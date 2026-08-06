import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findRoute } from '../routes';
import { resolveMeta, type SiteConfig } from '../lib/seo';

/**
 * Keeps <head> correct during client-side navigation.
 *
 * Renders null on both server and client first paint, so it can never cause a
 * hydration mismatch. The prerendered HTML already carries the correct tags for
 * the entry URL; this only matters once the user navigates within the SPA.
 */
export default function HeadSync({ site }: { site: SiteConfig }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = findRoute(pathname);
    const m = resolveMeta(site, route.meta, pathname);

    document.title = m.title;

    setMeta('name', 'description', m.description);
    setMeta('name', 'robots', m.robots);
    setMeta('property', 'og:title', m.title);
    setMeta('property', 'og:description', m.description);
    setMeta('property', 'og:url', m.canonical);
    setMeta('property', 'og:image', m.image);
    setMeta('name', 'twitter:title', m.title);
    setMeta('name', 'twitter:description', m.description);
    setMeta('name', 'twitter:image', m.image);
    setCanonical(m.canonical);
  }, [pathname, site]);

  return null;
}

function setMeta(keyAttr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${keyAttr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}
