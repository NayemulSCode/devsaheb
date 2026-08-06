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

import { mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readAssets } from './assets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const SERVER_ENTRY = join(ROOT, 'dist', 'server', 'entry-server.js');

const escape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Structured data for a taxonomy detail page.
 *
 * FAQPage is the one with a real chance of a rich result, which is why the
 * substance bar requires a genuine 3-5 question FAQ rather than padding.
 * BreadcrumbList mirrors the on-page trail - Google cross-checks the two, so
 * they must agree.
 */
function taxonomyJsonLd(site, routePath, faq) {
  const base = site.url.replace(/\/+$/, '');
  const isService = routePath.startsWith('/services/');
  const hub = isService ? '/services' : '/technologies';
  const hubName = isService ? 'Services' : 'Technologies';

  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
        { '@type': 'ListItem', position: 2, name: hubName, item: base + hub },
        { '@type': 'ListItem', position: 3, name: faq.title, item: base + routePath },
      ],
    },
  ];

  if (faq.entries.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.entries.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  if (isService) {
    graph.push({
      '@type': 'Service',
      name: faq.title,
      serviceType: faq.title,
      provider: { '@type': 'Organization', name: site.name, url: base },
      areaServed: 'Worldwide',
      url: base + routePath,
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
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

/**
 * Embeds the content the page was rendered from so the client hydrates against
 * identical bytes. `<` is escaped: an unescaped `</script>` inside the JSON
 * would close the tag early and let stored content inject markup.
 */
function pageDataScript(data) {
  if (!data) return '';
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `    <script type="application/json" id="__DS_PAGE_DATA__">${json}</script>\n`;
}

function buildDocument({ appHtml, meta, assets, site, jsonLd, data }) {
  const styles = assets.css
    .map((href) => `    <link rel="stylesheet" href="${href}">`)
    .join('\n');

  // crossorigin is mandatory on font preloads even same-origin. Without it the
  // browser fetches the file twice and the preload is worse than useless.
  const preloads = (assets.preload ?? [])
    .map(
      (href) =>
        `    <link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`,
    )
    .join('\n');

  const ld = jsonLd
    ? `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`
    : '';

  return `<!doctype html>
<html lang="${escape(site.locale.split('_')[0])}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Arms the scroll-reveal hidden state before first paint. Deliberately
         inline and blocking: deferring it would flash finished content and
         then hide it. If scripting is off this never runs, the .js class is
         never set, and every [data-reveal] block simply stays visible. -->
    <script>document.documentElement.classList.add('js')</script>

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

${preloads}
${styles}
${ld}    <script type="module" src="${assets.js}"></script>
  </head>
  <body>
    <div id="root">${appHtml}</div>
${pageDataScript(data)}  </body>
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
  const { html, meta, data, faq, breadcrumb } = render(routePath);

  let jsonLd = null;
  if (routePath === '/') {
    jsonLd = organizationJsonLd(siteConfig);
  } else if (faq) {
    jsonLd = taxonomyJsonLd(siteConfig, routePath, {
      title: breadcrumb ?? meta.title,
      entries: faq,
    });
  }

  const doc = buildDocument({
    appHtml: html,
    meta,
    assets,
    site: siteConfig,
    jsonLd,
    data,
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
      data: null,
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
