import { renderToString } from 'react-dom/server';
// v7 removed the react-router-dom/server subpath; StaticRouter is on the root.
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { routes, notFoundRoute, findRoute } from './routes';
import { resolveMeta, type SiteConfig } from './lib/seo';
import { readContentFile } from './lib/content-server';
import { SERVICES, TECHNOLOGIES } from './content/taxonomy';
import type { TaxonomyPage } from './content/schema';
import site from '../content/site.json';

export { routes, notFoundRoute, findRoute };
export const siteConfig = site as SiteConfig;

// Re-exported so server/admin.js validates saves with exactly the schema this
// bundle's renderer was compiled against - no drift between the two.
export { pageSchema, slugSchema } from './content/schema';

export type RenderResult = {
  html: string;
  meta: ReturnType<typeof resolveMeta>;
  data: unknown;
  /** FAQ entries, when the route has them. Drives FAQPage schema. */
  faq: { q: string; a: string }[] | null;
  /** Short taxonomy name. Breadcrumbs use this, never the h1 headline. */
  breadcrumb: string | null;
};

/** Narrow enough to detect a taxonomy payload without importing zod here. */
function asTaxonomy(data: unknown): TaxonomyPage | null {
  return data && typeof data === 'object' && 'faq' in data && 'notFor' in data
    ? (data as TaxonomyPage)
    : null;
}

/**
 * Renders one route to markup, its resolved metadata, and the content it was
 * rendered from.
 *
 * Used at build time by scripts/prerender.mjs, and again at runtime by
 * server.js when a save invalidates a page. Same function both times, so a
 * regenerated page is byte-identical to a freshly built one.
 */
export function render(url: string): RenderResult {
  const route = findRoute(url);
  const data = route.contentPath ? readContentFile<unknown>(route.contentPath) : null;
  const taxonomy = asTaxonomy(data);

  const html = renderToString(
    <StaticRouter location={url}>
      <App initialData={data} />
    </StaticRouter>,
  );

  // A taxonomy page's own title and description are the ones written against
  // its keyword-map row, so they win over the route table's fallback.
  const meta = resolveMeta(
    siteConfig,
    taxonomy
      ? { ...route.meta, title: taxonomy.title, description: taxonomy.description }
      : route.meta,
    url,
  );

  const breadcrumb = taxonomy
    ? ([...SERVICES, ...TECHNOLOGIES].find((i) => i.slug === taxonomy.slug)?.name ?? taxonomy.slug)
    : null;

  return { html, meta, data, faq: taxonomy?.faq ?? null, breadcrumb };
}
