import { renderToString } from 'react-dom/server';
// v7 removed the react-router-dom/server subpath; StaticRouter is on the root.
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { routes, notFoundRoute, findRoute } from './routes';
import { resolveMeta, type SiteConfig } from './lib/seo';
import { readPageContent } from './lib/content-server';
import type { PageContent } from './content/schema';
import site from '../content/site.json';

export { routes, notFoundRoute, findRoute };
export const siteConfig = site as SiteConfig;

// Re-exported so server/admin.js validates saves with exactly the schema this
// bundle's renderer was compiled against - no drift between the two.
export { pageSchema, slugSchema } from './content/schema';

export type RenderResult = {
  html: string;
  meta: ReturnType<typeof resolveMeta>;
  data: PageContent | null;
};

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
  const data = route.contentSlug ? readPageContent(route.contentSlug) : null;

  const html = renderToString(
    <StaticRouter location={url}>
      <App initialData={data} />
    </StaticRouter>,
  );

  return { html, meta: resolveMeta(siteConfig, route.meta, url), data };
}
