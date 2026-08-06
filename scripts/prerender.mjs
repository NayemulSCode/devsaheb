/**
 * Walks the route table and writes a real HTML file per route.
 *
 * This is what makes the site crawlable. Apache serves these files directly -
 * Node is never in the request path for a public page, which is what makes the
 * whole thing viable on cPanel shared hosting.
 *
 * Also exported so server.js can regenerate a single page after a content save
 * without a full rebuild.
 */

import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const SERVER_ENTRY = join(ROOT, 'dist', 'server', 'entry-server.js');
const MANIFEST = join(CLIENT_DIR, '.vite', 'manifest.json');

const escape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Entry JS plus every stylesheet it pulls in, transitively. */
async function readAssets() {
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

  return { js: `/${entry.file}`, css: [...css].map((f) => `/${f}`) };
}

function organizationJsonLd(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    logo: `${site.url.replace(/\/+$/, '')}/ds-lockup-h-dark.svg`,
    description: site.description,
  };
}

function buildDocument({ appHtml, meta, assets, site, jsonLd }) {
  const styles = assets.css
    .map((href) => `    <link rel="stylesheet" href="${href}">`)
    .join('\n');

  const ld = jsonLd
    ? `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`
    : '';

  return `<!doctype html>
<html lang="${escape(site.locale.split('_')[0])}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>${escape(meta.title)}</title>
    <meta name="description" content="${escape(meta.description)}">
    <meta name="robots" content="${escape(meta.robots)}">
    <link rel="canonical" href="${escape(meta.canonical)}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${escape(meta.siteName)}">
    <meta property="og:locale" content="${escape(meta.locale)}">
    <meta property="og:title" content="${escape(meta.title)}">
    <meta property="og:description" content="${escape(meta.description)}">
    <meta property="og:url" content="${escape(meta.canonical)}">
    <meta property="og:image" content="${escape(meta.image)}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escape(meta.title)}">
    <meta name="twitter:description" content="${escape(meta.description)}">
    <meta name="twitter:image" content="${escape(meta.image)}">

    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="apple-touch-icon" href="/icon-180.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#0B1020">

${styles}
${ld}    <script type="module" src="${assets.js}"></script>
  </head>
  <body>
    <div id="root">${appHtml}</div>
  </body>
</html>
`;
}

/** Write via temp file + rename so a crash can never leave a truncated page. */
async function writeAtomic(file, contents) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, contents, 'utf8');
  await rename(tmp, file);
}

function outputPath(routePath) {
  if (routePath === '/') return join(CLIENT_DIR, 'index.html');
  return join(CLIENT_DIR, routePath.replace(/^\/+/, ''), 'index.html');
}

export async function loadServerBundle() {
  return import(pathToFileURL(SERVER_ENTRY).href);
}

/** Renders one route and writes its HTML file. Returns the path written. */
export async function renderPage(routePath, bundle, assets) {
  const { render, siteConfig } = bundle;
  const { html, meta } = render(routePath);
  const doc = buildDocument({
    appHtml: html,
    meta,
    assets,
    site: siteConfig,
    jsonLd: routePath === '/' ? organizationJsonLd(siteConfig) : null,
  });
  const file = outputPath(routePath);
  await writeAtomic(file, doc);
  return file;
}

async function writeSitemap(routes, site) {
  const base = site.url.replace(/\/+$/, '');
  const urls = routes
    .filter((r) => !r.meta.noindex && !r.skipPrerender)
    .map((r) => `  <url><loc>${base}${r.path === '/' ? '/' : r.path}</loc></url>`)
    .join('\n');

  await writeAtomic(
    join(CLIENT_DIR, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  );

  await writeAtomic(
    join(CLIENT_DIR, 'robots.txt'),
    `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`,
  );
}

export async function prerenderAll() {
  const bundle = await loadServerBundle();
  const assets = await readAssets();
  const { routes, notFoundRoute, siteConfig } = bundle;

  const written = [];
  for (const route of routes) {
    if (route.skipPrerender) continue;
    written.push(await renderPage(route.path, bundle, assets));
  }

  // Apache's ErrorDocument target. Rendered through the same pipeline so it
  // carries the real stylesheet and shell rather than being a bare fallback.
  const { html, meta } = bundle.render('/__not-found__');
  await writeAtomic(
    join(CLIENT_DIR, '404.html'),
    buildDocument({
      appHtml: html,
      meta: { ...meta, title: notFoundRoute.meta.title },
      assets,
      site: siteConfig,
      jsonLd: null,
    }),
  );
  written.push(join(CLIENT_DIR, '404.html'));

  await writeSitemap(routes, siteConfig);

  return written;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const files = await prerenderAll();
  for (const f of files) console.log(`  ${f.replace(CLIENT_DIR, 'dist/client')}`);
  console.log(`\nprerendered ${files.length} page(s) + sitemap.xml + robots.txt`);
}
