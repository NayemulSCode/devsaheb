import { renderToString } from 'react-dom/server';
// v7 removed the react-router-dom/server subpath; StaticRouter is on the root.
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { routes, notFoundRoute, findRoute } from './routes';
import { resolveMeta, type SiteConfig } from './lib/seo';
import site from '../content/site.json';

export { routes, notFoundRoute, findRoute };
export const siteConfig = site as SiteConfig;

export type RenderResult = {
  html: string;
  meta: ReturnType<typeof resolveMeta>;
};

/**
 * Renders one route to markup plus its resolved metadata.
 *
 * Used at build time by scripts/prerender.mjs, and again at runtime by
 * server.js when a content save invalidates a page. Same function both times,
 * so a regenerated page is byte-identical to a freshly built one.
 */
export function render(url: string): RenderResult {
  const route = findRoute(url);
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
  return { html, meta: resolveMeta(siteConfig, route.meta, url) };
}
