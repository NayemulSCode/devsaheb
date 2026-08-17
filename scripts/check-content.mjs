/**
 * Validates every content file against the schema that governs it.
 *
 * Content on disk was never checked before: the renderer reads it without
 * validating, and only the admin's save path runs the schema. That let
 * hand-authored files sit there rendering perfectly while being unsaveable -
 * open one in the editor, press Publish, and it is rejected for a limit it
 * never satisfied in the first place.
 *
 *   node scripts/check-content.mjs
 */

import { readFile } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadServerBundle } from './prerender.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(ROOT, 'content');

function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue; // skip .versions
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...jsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const bundle = await loadServerBundle();
const { pageSchema, taxonomyPageSchema } = bundle;

if (!pageSchema?.parse || !taxonomyPageSchema?.parse) {
  console.error('The build is missing a schema. Run `npm run build` first.');
  process.exit(1);
}

const targets = [
  ...jsonFiles(join(CONTENT_DIR, 'pages')).map((f) => ({ file: f, schema: pageSchema, kind: 'blocks' })),
  ...jsonFiles(join(CONTENT_DIR, 'taxonomy')).map((f) => ({ file: f, schema: taxonomyPageSchema, kind: 'taxonomy' })),
];

const failures = [];

for (const { file, schema, kind } of targets) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  try {
    const parsed = schema.safeParse(JSON.parse(await readFile(file, 'utf8')));
    if (!parsed.success) {
      failures.push({
        rel,
        kind,
        issues: parsed.error.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`),
      });
    }
  } catch (err) {
    failures.push({ rel, kind, issues: [err instanceof Error ? err.message : String(err)] });
  }
}

console.log(`\ncontent check: ${targets.length} file(s)`);

if (failures.length === 0) {
  console.log('all valid — every file can be saved through the admin\n');
  process.exit(0);
}

console.error(`\n${failures.length} invalid file(s):\n`);
for (const f of failures) {
  console.error(`  ${f.rel}  (${f.kind})`);
  for (const issue of f.issues) console.error(`      ${issue}`);
  console.error('');
}
console.error('These render, but the admin will refuse to save them.\n');
process.exit(1);
