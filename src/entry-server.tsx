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
export { pageSchema, slugSchema, taxonomyPageSchema, BLOCK_TYPES } from './content/schema';
export { BLOCK_DEFAULTS, ARRAY_ITEM_DEFAULTS } from './content/block-defaults';

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
 * FAQ entries from a block page's Faq blocks.
 *
 * Taxonomy pages have always driven FAQPage schema from their own faq field. A
 * block page can now carry the same questions in a Faq block, and there is no
 * reason for the markup to depend on which editor the page happens to use.
 *
 * Every Faq block on the page contributes, in document order.
 */
function blockFaq(data: unknown): { q: string; a: string }[] | null {
  if (!data || typeof data !== 'object' || !('content' in data)) return null;
  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content)) return null;

  const entries = content
    .filter((b): b is { props?: { items?: unknown } } => {
      return Boolean(b) && typeof b === 'object' && (b as { type?: string }).type === 'Faq';
    })
    .flatMap((b) => (Array.isArray(b.props?.items) ? b.props.items : []))
    .filter(
      (i): i is { q: string; a: string } =>
        Boolean(i) && typeof i === 'object' && typeof i.q === 'string' && typeof i.a === 'string',
    )
    .filter((i) => i.q.trim() && i.a.trim());

  return entries.length > 0 ? entries : null;
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
      <App initialData={data} initialPath={url} />
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

  return { html, meta, data, faq: taxonomy?.faq ?? blockFaq(data), breadcrumb };
}
