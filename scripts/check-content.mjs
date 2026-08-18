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

/**
 * Content paths that a route actually renders — i.e. published pages.
 *
 * A scaffold satisfies the schema while every field still says TODO, so schema
 * validation alone let a page go live with "TODO — the headline" as its h1,
 * indexed and in the sitemap. Publishing is the line: an unpublished draft may
 * hold placeholders, a published page may not.
 */
const published = new Set(
  (bundle.routes ?? []).filter((r) => r.contentPath).map((r) => r.contentPath),
);

const failures = [];

/**
 * A published route whose content file does not exist renders the "being
 * written" fallback — a thin page, live and in the sitemap. Checking only the
 * files that exist missed this entirely, which is how five of them shipped.
 */
for (const contentPath of published) {
  const file = join(CONTENT_DIR, `${contentPath}.json`);
  if (!existsSync(file)) {
    failures.push({
      rel: `content/${contentPath}.json`,
      kind: 'missing',
      issues: [
        'published, but this file does not exist — the page renders the "being written" fallback',
        `Run: npm run new:page -- ${contentPath.replace('taxonomy/', '').replace('/', ' ')}`,
        'Or set published: false in src/content/taxonomy.ts until it is written',
      ],
    });
  }
}

for (const { file, schema, kind } of targets) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const contentPath = rel.replace(/^content\//, '').replace(/\.json$/, '');

  try {
    const raw = await readFile(file, 'utf8');
    const parsed = schema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      failures.push({
        rel,
        kind,
        issues: parsed.error.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`),
      });
      continue;
    }

    if (published.has(contentPath) && /\bTODO\b/.test(raw)) {
      const fields = [...raw.matchAll(/"([a-zA-Z]+)":\s*"TODO[^"]*"/g)].map((m) => m[1]);
      failures.push({
        rel,
        kind,
        issues: [
          `published, but still contains TODO placeholders${
            fields.length ? ` (${[...new Set(fields)].join(', ')})` : ''
          }`,
          'Either finish the page, or set published: false in src/content/taxonomy.ts',
        ],
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
console.error(
  'A schema failure means the admin cannot save that file.\n' +
    'A missing or TODO failure means a placeholder page is live and indexable.\n',
);
process.exit(1);
