/**
 * Scaffolds a service or technology page.
 *
 *   npm run new:page -- services web-development
 *   npm run new:page -- technologies nodejs
 *
 * Writes a content file that already satisfies the schema, so the page opens
 * in /admin immediately and is filled in there with the live preview rather
 * than by hand-editing JSON.
 *
 * The scaffold deliberately does not publish the page. Publishing is a
 * separate, conscious step - see docs/keyword-map.md for the bar a page has to
 * clear first.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KINDS = new Set(['services', 'technologies']);

const [kind, slug] = process.argv.slice(2);

if (!kind || !slug || !KINDS.has(kind)) {
  console.error('Usage: npm run new:page -- <services|technologies> <slug>');
  console.error('   eg: npm run new:page -- services web-development');
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
  console.error(`Invalid slug "${slug}". Lowercase letters, digits and hyphens only.`);
  process.exit(1);
}

// The slug has to exist in the taxonomy, or no route will ever render it.
const taxonomy = await readFile(join(ROOT, 'src', 'content', 'taxonomy.ts'), 'utf8');
if (!taxonomy.includes(`slug: '${slug}'`)) {
  console.error(`"${slug}" is not in src/content/taxonomy.ts.`);
  console.error('Add it to the right group there first — that file decides what exists.');
  process.exit(1);
}

const file = join(ROOT, 'content', 'taxonomy', kind, `${slug}.json`);
if (existsSync(file)) {
  console.error(`Already exists: content/taxonomy/${kind}/${slug}.json`);
  process.exit(1);
}

const label = slug.replace(/-/g, ' ');
const isService = kind === 'services';

const template = {
  slug,
  primaryQuery: `TODO — the one query this page owns, from docs/keyword-map.md`,
  title: `TODO — ${label} (max 70 chars, shown in search results)`,
  description: `TODO — max 180 characters. Written for someone deciding whether to click.`,
  h1: `TODO — the headline, written for a human rather than the search result`,
  intro: 'TODO — open with the thing a buyer actually needs to hear first.',
  sections: [
    { heading: 'TODO — first section', body: 'TODO.\n\nBlank line between paragraphs.' },
    { heading: 'TODO — second section', body: 'TODO.' },
  ],
  deliverables: ['TODO — what the client actually receives'],
  faq: [
    { q: 'TODO — a real question you get asked?', a: 'TODO.' },
    { q: 'TODO — another?', a: 'TODO.' },
    { q: 'TODO — a third? Three is the minimum.', a: 'TODO.' },
  ],
  notFor: {
    heading: isService
      ? 'When we would recommend something else'
      : 'When this is the wrong tool',
    body: 'TODO — the honest counter-case. Hard to template, and the section buyers remember.',
  },
  related: { services: [], technologies: [] },
};

await mkdir(dirname(file), { recursive: true });
await writeFile(file, `${JSON.stringify(template, null, 2)}\n`, 'utf8');

const route = `/${kind}/${slug}`;

console.log(`
created  content/taxonomy/${kind}/${slug}.json

next:
  1. Set published: true on "${slug}" in src/content/taxonomy.ts
  2. npm run build
  3. Open ${route} in /admin and write it there — the preview is live

The page will not appear in the menu as a link until step 1, and the build
will fail the content check while required fields are still empty.
`);
