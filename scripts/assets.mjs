/**
 * Resolves built asset URLs from the Vite manifest.
 *
 * Shared by the build-time prerender and by server.js when it regenerates a
 * page after a content save, so both emit identical markup.
 *
 * Cached after first read: the manifest cannot change without a redeploy, and
 * re-reading it on every save would be wasted I/O.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'dist', 'client', '.vite', 'manifest.json');

/**
 * Only the display face's latin subset is preloaded. It renders the h1, so it
 * is on the LCP path. Preloading more fonts would have them compete for
 * bandwidth with the very thing we are trying to speed up - the mono face
 * only sets small labels and can arrive with the normal CSS cascade.
 */
const PRELOAD_MATCH = /geist-latin-wght-normal\.woff2$/;

let cached = null;

export async function readAssets() {
  if (cached) return cached;

  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const entry = Object.values(manifest).find((c) => c.isEntry);
  if (!entry) throw new Error('No entry chunk in the Vite manifest.');

  const css = new Set(entry.css ?? []);
  const seen = new Set();
  const walk = (names = []) => {
    for (const name of names) {
      if (seen.has(name)) continue;
      seen.add(name);
      const chunk = manifest[name];
      if (!chunk) continue;
      for (const f of chunk.css ?? []) css.add(f);
      walk(chunk.imports);
    }
  };
  walk(entry.imports);

  const preload = Object.entries(manifest)
    .filter(([src]) => PRELOAD_MATCH.test(src))
    .map(([, chunk]) => `/${chunk.file}`);

  cached = {
    js: `/${entry.file}`,
    css: [...css].map((f) => `/${f}`),
    preload,
  };
  return cached;
}
