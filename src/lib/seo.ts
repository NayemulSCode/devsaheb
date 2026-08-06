/**
 * Route metadata.
 *
 * Metadata is DATA, not rendered React elements. That is deliberate.
 *
 * React 19 can hoist <title>/<meta> to <head>, but only reliably when React
 * renders the whole document. We render an app subtree into #root, so React
 * would emit those tags inline in the body - which is exactly where social
 * crawlers do not look. Worse, stripping them out post-render would desync the
 * server HTML from what the client hydrates.
 *
 * So: routes declare metadata as plain objects. The prerender writes it into a
 * real <head> (see scripts/prerender.mjs), and the client applies the same
 * resolved values imperatively on navigation (see components/HeadSync.tsx).
 * One source of truth, no hydration mismatch, real tags for crawlers.
 */

export type RouteMeta = {
  title: string;
  description: string;
  /** Absolute or root-relative OG image. Falls back to the site default. */
  image?: string;
  /** Keeps a route out of the index. Used for /admin. */
  noindex?: boolean;
};

export type SiteConfig = {
  name: string;
  url: string;
  /** %s is replaced by the route title. */
  titleTemplate: string;
  description: string;
  image: string;
  locale: string;
};

export type ResolvedMeta = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  robots: string;
  locale: string;
  siteName: string;
};

/** Joins the site origin to a path without doubling or dropping the slash. */
export function absoluteUrl(site: SiteConfig, path: string): string {
  const base = site.url.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/**
 * Canonical form: lowercase, no trailing slash except root, no query.
 * Trailing-slash duplicates are a common source of split ranking signals.
 */
export function canonicalPath(pathname: string): string {
  const clean = pathname.split('?')[0]!.split('#')[0]!.toLowerCase();
  const trimmed = clean.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function resolveMeta(
  site: SiteConfig,
  meta: RouteMeta,
  pathname: string,
): ResolvedMeta {
  const path = canonicalPath(pathname);
  return {
    title: site.titleTemplate.replace('%s', meta.title),
    description: meta.description || site.description,
    canonical: absoluteUrl(site, path),
    image: absoluteUrl(site, meta.image ?? site.image),
    robots: meta.noindex ? 'noindex, nofollow' : 'index, follow',
    locale: site.locale,
    siteName: site.name,
  };
}
