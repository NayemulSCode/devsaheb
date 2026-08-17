/**
 * Content store: JSON on disk, no database.
 *
 * Three properties this has to hold, because there is no database to fall
 * back on:
 *
 *   1. Atomic writes. Write to a temp file, then rename. A crash mid-write
 *      would otherwise truncate the file and 500 the page it backs.
 *   2. Snapshots. The previous version is copied into .versions before every
 *      overwrite. Without a database this is the only undo that exists.
 *   3. A write lock. Two concurrent saves to one file interleave and corrupt
 *      it. Rename is atomic; read-modify-write is not.
 */

import { mkdir, readFile, writeFile, rename, copyFile, readdir, unlink, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = join(ROOT, 'content');
export const MEDIA_DIR = join(CONTENT_DIR, 'media');
const VERSIONS_DIR = join(CONTENT_DIR, '.versions');
const KEEP_VERSIONS = 20;

/** Per-path promise chain. Serialises writes without blocking the event loop. */
const locks = new Map();

function withLock(key, task) {
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);
  // Keep the chain alive but do not let a rejection poison later writers.
  locks.set(
    key,
    next.catch(() => {}),
  );
  return next;
}

/**
 * Resolves a slug to a path under CONTENT_DIR, refusing anything that escapes.
 * The slug is already regex-validated upstream; this is the backstop that
 * makes traversal impossible even if that check is ever loosened.
 */
export function pagePath(slug) {
  const file = join(CONTENT_DIR, 'pages', `${slug}.json`);
  const base = join(CONTENT_DIR, 'pages');
  if (!file.startsWith(base + (process.platform === 'win32' ? '\\' : '/'))) {
    throw new Error('Resolved path escapes the content directory.');
  }
  return file;
}

export async function readPage(slug) {
  const file = pagePath(slug);
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, 'utf8'));
}

async function snapshot(slug, file) {
  if (!existsSync(file)) return;
  const dir = join(VERSIONS_DIR, 'pages', slug);
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await copyFile(file, join(dir, `${stamp}.json`));

  // Prune oldest. Timestamps sort lexicographically, so name order is age order.
  const entries = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  for (const stale of entries.slice(0, Math.max(0, entries.length - KEEP_VERSIONS))) {
    await unlink(join(dir, stale)).catch(() => {});
  }
}

/**
 * Validates, snapshots, then writes atomically. `validate` is injected so this
 * module stays free of the schema - the caller passes the compiled zod schema
 * from the SSR bundle, which is the same one the renderer was built against.
 */
export async function writePage(slug, data, validate) {
  const parsed = validate(data);
  const file = pagePath(slug);

  return withLock(file, async () => {
    await mkdir(dirname(file), { recursive: true });
    await snapshot(slug, file);

    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    await rename(tmp, file);
    return parsed;
  });
}

export async function listVersions(slug) {
  const dir = join(VERSIONS_DIR, 'pages', slug);
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().reverse();
}

export async function ensureDirs() {
  await mkdir(join(CONTENT_DIR, 'pages'), { recursive: true });
  await mkdir(MEDIA_DIR, { recursive: true });
  await mkdir(VERSIONS_DIR, { recursive: true });
}

/**
 * Links the document root's /media at the real upload directory.
 *
 * In production Apache serves dist/client directly and only /api reaches the
 * Node app, so uploads stored in content/media would 404 - every image added
 * through the admin would be broken, and nothing in the app log would say so.
 *
 * The symlink cannot live in the repo or the release: `vite build` empties
 * dist/, so a deploy replaces the whole directory. Recreating it at boot means
 * it comes back on the app restart that follows every deploy, with no manual
 * step to forget.
 */
export async function ensureMediaLink(clientDir) {
  const link = join(clientDir, 'media');
  if (existsSync(link)) return null;

  try {
    // 'junction' is required for directories on Windows and ignored on POSIX.
    await symlink(MEDIA_DIR, link, 'junction');
    return link;
  } catch (err) {
    // Not fatal: the site still serves, only uploaded images are missing.
    return err instanceof Error ? err : new Error(String(err));
  }
}
