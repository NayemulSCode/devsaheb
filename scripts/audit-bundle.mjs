/**
 * Fails the build if the marketing bundle outgrows its budget.
 *
 * The risk this guards is specific: Puck and its editor are ~84 kB gzipped,
 * and a single stray top-level import from a shared module would pull them
 * into every marketing page. That would not break anything visibly - it would
 * just quietly cost every visitor a CMS they never use, and nobody would
 * notice until a Lighthouse score slipped months later.
 *
 *   node scripts/audit-bundle.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const ASSETS = join(CLIENT_DIR, 'assets');
const MANIFEST = join(CLIENT_DIR, '.vite', 'manifest.json');

/** Gzipped kilobytes loaded by a first visit to any marketing page. */
const ENTRY_BUDGET_KB = 120;

/**
 * Modules that must never appear in the entry graph.
 *
 * These needles are identifiers that survive minification, verified by
 * deliberately importing Puck into a shared module and grepping the result.
 * A package name like "@measured/puck" does not survive - an earlier version
 * of this check used one and reported "absent" on a bundle that had leaked.
 */
const FORBIDDEN = [
  { needles: ['usePuck', 'dnd-kit'], label: 'Puck editor' },
  { needles: ['ZodError', 'invalid_type'], label: 'zod' },
];

const kb = (buf) => gzipSync(buf).length / 1024;

if (!existsSync(MANIFEST)) {
  console.error('No build found. Run `npm run build` first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const entry = Object.values(manifest).find((c) => c.isEntry);
if (!entry) {
  console.error('No entry chunk in the Vite manifest.');
  process.exit(1);
}

// Entry JS plus every stylesheet it pulls in - what a first paint actually costs.
const entryFiles = [entry.file, ...(entry.css ?? [])];
const entryKb = entryFiles.reduce((sum, f) => sum + kb(readFileSync(join(CLIENT_DIR, f))), 0);

const failures = [];

console.log('\nbundle budget');
console.log(`  entry (js + css)   ${entryKb.toFixed(1)} kB gz   (<= ${ENTRY_BUDGET_KB})`);
if (entryKb > ENTRY_BUDGET_KB) {
  failures.push(`entry is ${entryKb.toFixed(1)} kB gz, over the ${ENTRY_BUDGET_KB} kB budget`);
}

const entrySource = readFileSync(join(CLIENT_DIR, entry.file), 'utf8');
for (const { needles, label } of FORBIDDEN) {
  const hit = needles.find((n) => entrySource.includes(n));
  console.log(`  ${label.padEnd(18)} ${hit ? `PRESENT — leaked (matched "${hit}")` : 'absent'}`);
  if (hit) failures.push(`${label} leaked into the marketing entry chunk`);
}

// Lazy chunks are reported, not gated - they only cost the routes that load them.
const lazy = readdirSync(ASSETS)
  .filter((f) => f.endsWith('.js') && !entryFiles.includes(`assets/${f}`))
  .map((f) => ({ file: f, size: kb(readFileSync(join(ASSETS, f))) }))
  .sort((a, b) => b.size - a.size);

if (lazy.length) {
  console.log('\n  lazy chunks (not gated — only loaded by their own route)');
  for (const c of lazy) console.log(`    ${c.file.padEnd(34)} ${c.size.toFixed(1)} kB gz`);
}

if (failures.length) {
  console.error('\nbundle budget FAILED:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log('\nbundle budget met\n');
