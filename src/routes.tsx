import type { ComponentType } from 'react';
import type { RouteMeta } from './lib/seo';
import Home from './routes/Home';
import NotFound from './routes/NotFound';

export type AppRoute = {
  path: string;
  Component: ComponentType;
  meta: RouteMeta;
  /** Excluded from the prerender walk and from sitemap.xml. */
  skipPrerender?: boolean;
};

/**
 * The route table is the single source of truth for three things: what renders,
 * what metadata each URL carries, and which URLs the prerender walks. Adding a
 * page here is all that is needed for it to be built, indexed, and sitemapped.
 *
 * Phase 3 adds the marketing pages; Phase 3b generates the service and
 * technology routes from content JSON rather than listing them by hand.
 */
export const routes: AppRoute[] = [
  {
    path: '/',
    Component: Home,
    meta: {
      title: 'Software development company',
      description:
        'DevSaheb builds custom software, cloud platforms, and mobile apps to a published engineering standard. Typed end to end, reviewed line by line, measured against numbers we commit to before we start.',
    },
  },
];

/** Rendered for anything the table does not match. */
export const notFoundRoute: AppRoute = {
  path: '/404',
  Component: NotFound,
  meta: {
    title: 'Page not found',
    description: 'That page does not exist.',
    noindex: true,
  },
};

export function findRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return routes.find((r) => r.path === clean) ?? notFoundRoute;
}
