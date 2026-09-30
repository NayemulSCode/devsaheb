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

/**
 * Every block the schema allows must be editable in the admin.
 *
 * The two halves are declared separately - zod in src/content/schema.ts, Puck
 * fields in src/admin/puck-config.tsx - so one can gain a block the other has
 * never heard of. The failure is quiet: the block renders correctly on the
 * public site and simply cannot be added or edited, which is how a CMS ends up
 * with content nobody can change.
 *
 * Read as source rather than imported, because importing the config would pull
 * @measured/puck and the whole React tree into a build script.
 */
const puckSource = await readFile(join(ROOT, 'src/admin/puck-config.tsx'), 'utf8');
const componentsBlock = puckSource.slice(puckSource.indexOf('components: {'));
const editable = new Set(
  [...componentsBlock.matchAll(/^\s{4}([A-Z][A-Za-z]*): \{$/gm)].map((m) => m[1]),
);

const missingEditors = (bundle.BLOCK_TYPES ?? []).filter((t) => !editable.has(t));
if (missingEditors.length > 0) {
  console.error(
    `\nBlock types with no editor in src/admin/puck-config.tsx: ${missingEditors.join(', ')}\n` +
      'Add them there, or remove them from BLOCK_TYPES in src/content/schema.ts.\n',
  );
  process.exit(1);
}

/**
 * A freshly dragged-in block must be publishable.
 *
 * Puck inserts defaultProps verbatim, so if one of them fails the schema, the
 * first thing anyone does with a new block - add it, press Publish - is
 * rejected, naming a field they never touched. That is exactly what happened
 * with Hero: its two link fields defaulted to '', and '' is not a valid href.
 *
 * Every default is now validated here, plus one of every array entry, so the
 * editor cannot offer a block that cannot be saved.
 */
{
  const defaults = bundle.BLOCK_DEFAULTS ?? {};
  const itemDefaults = bundle.ARRAY_ITEM_DEFAULTS ?? {};
  const bad = [];

  for (const [type, props] of Object.entries(defaults)) {
    const probe = { type, props: { id: 'probe', ...props } };
    const result = pageSchema.safeParse({ content: [probe] });
    if (!result.success) {
      for (const issue of result.error.issues) {
        bad.push(`${type} default → ${issue.path.slice(3).join('.') || 'value'}: ${issue.message}`);
      }
    }
  }

  // An array entry is validated inside its own block, since the schema only
  // describes it in that position.
  for (const [key, item] of Object.entries(itemDefaults)) {
    const [type, field] = key.split('.');
    const probe = {
      type,
      props: { id: 'probe', ...defaults[type], [field]: [item] },
    };
    const result = pageSchema.safeParse({ content: [probe] });
    if (!result.success) {
      for (const issue of result.error.issues) {
        bad.push(`${key} new entry → ${issue.path.slice(3).join('.') || 'value'}: ${issue.message}`);
      }
    }
  }

  if (bad.length > 0) {
    console.error('\nEditor defaults that cannot be published:\n');
    for (const line of bad) console.error(`  ${line}`);
    console.error('\nFix them in src/content/block-defaults.ts.\n');
    process.exit(1);
  }
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

/**
 * Contact details that site.json owns.
 *
 * A mailto: or tel: typed into a block is a second copy of a value that already
 * lives in site.json, and the two drift the moment one of them is edited. On
 * the careers page that means applications addressed to a mailbox nobody reads,
 * with nothing on screen to show it. Cheaper to fail the build.
 */
const siteRaw = JSON.parse(await readFile(join(CONTENT_DIR, 'site.json'), 'utf8'));
const contact = siteRaw.contact ?? {};

const known = new Set(
  [
    ...[contact.email, contact.careersEmail]
      .filter(Boolean)
      .map((e) => `mailto:${String(e).trim().toLowerCase()}`),
    ...(contact.phone ? [`tel:${String(contact.phone).replace(/[^\d+]/g, '')}`] : []),
  ],
);

/** Every mailto:/tel: in a content file, normalised the same way. */
function strayContacts(raw) {
  return [...raw.matchAll(/"((?:mailto|tel):[^"]+)"/gi)]
    .map((m) => m[1])
    .filter((href) => {
      const v = href.toLowerCase().startsWith('tel:')
        ? `tel:${href.slice(4).replace(/[^\d+]/g, '')}`
        : href.trim().toLowerCase();
      return !known.has(v);
    });
}

/**
 * Slugs each taxonomy defines, kept apart on purpose.
 *
 * A service slug listed under related.technologies passes a combined check and
 * still renders wrongly, because the renderer builds the path from which list
 * it was in - /technologies/database for a slug that is a service. Checking
 * them separately is what catches that.
 */
const knownSlugs = {
  services: new Set((bundle.SERVICES ?? []).map((i) => i.slug)),
  technologies: new Set((bundle.TECHNOLOGIES ?? []).map((i) => i.slug)),
};

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

    /**
     * `related` slugs must name a real taxonomy entry.
     *
     * The renderer looks each one up to get its display name, and silently
     * skips what it cannot find - so a typo does not break the page, it just
     * removes a link nobody notices is gone. custom-software shipped with
     * "awsd" for its AWS link and rendered fine the whole time.
     */
    if (kind === 'taxonomy' && parsed.success) {
      const related = parsed.data.related ?? {};
      const issues = [];

      for (const list of ['services', 'technologies']) {
        for (const slug of related[list] ?? []) {
          if (knownSlugs[list].has(slug)) continue;

          const other = list === 'services' ? 'technologies' : 'services';
          issues.push(
            knownSlugs[other].has(slug)
              ? `related.${list} lists "${slug}", which is a ${other.slice(0, -1)} — move it to related.${other}`
              : `related.${list} lists "${slug}", which does not exist`,
          );
        }
      }

      if (issues.length > 0) {
        failures.push({
          rel,
          kind,
          issues: [...issues, 'The link is dropped silently at render time rather than 404ing.'],
        });
      }
    }

    const stray = strayContacts(raw);
    if (stray.length > 0) {
      failures.push({
        rel,
        kind,
        issues: [
          `contact details not in site.json: ${[...new Set(stray)].join(', ')}`,
          'Use the address or number from content/site.json, or update site.json to match',
        ],
      });
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
    'A missing or TODO failure means a placeholder page is live and indexable.\n' +
    'A contact failure means a page points somewhere site.json does not.\n',
);
process.exit(1);
