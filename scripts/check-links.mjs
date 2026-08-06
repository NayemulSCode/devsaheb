/**
 * Fails the build if any internal link points at a page that was not
 * prerendered.
 *
 * Written after cross-links on the taxonomy pages silently pointed at ten
 * specialisms whose pages are not published yet. Nothing in the type system
 * catches that - the slugs are strings, and every one of them was a valid slug.
 *
 *   node scripts/check-links.mjs
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');

const ASSET = /\.(svg|png|jpe?g|webp|avif|ico|webmanifest|xml|txt|js|css|woff2?)$/i;

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

if (!existsSync(CLIENT_DIR)) {
  console.error('No build found. Run `npm run build` first.');
  process.exit(1);
}

const pages = htmlFiles(CLIENT_DIR);
const broken = new Map();

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    if (ASSET.test(href)) continue;
    // /media is written at runtime by uploads, so it is not in the build.
    if (href.startsWith('/media/')) continue;

    const target =
      href === '/' ? join(CLIENT_DIR, 'index.html') : join(CLIENT_DIR, href, 'index.html');

    if (!existsSync(target)) {
      const from = page.replace(CLIENT_DIR, '').replace(/\\/g, '/');
      if (!broken.has(href)) broken.set(href, new Set());
      broken.get(href).add(from);
    }
  }
}

if (broken.size === 0) {
  console.log(`link check: ${pages.length} pages, no broken internal links`);
  process.exit(0);
}

console.error(`link check FAILED: ${broken.size} broken target(s)\n`);
for (const [href, sources] of broken) {
  console.error(`  ${href}`);
  for (const src of sources) console.error(`      linked from ${src}`);
}
process.exit(1);
