import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { findRoute } from '../routes';

/**
 * Content for the page currently being rendered.
 *
 * The entry page's content arrives embedded in the HTML, so first paint needs
 * no request. Client-side navigation cannot read another page's script tag,
 * so subsequent routes fetch their content from the static JSON the prerender
 * writes alongside each page.
 *
 * An earlier version simply held the value it was constructed with. That meant
 * navigating from one content page to another kept showing the first page's
 * content - the provider had no idea the route had changed.
 *
 * Typed as unknown because routes carry different shapes - block lists for
 * editable pages, a structured record for taxonomy pages. Each route asserts
 * its own via useRouteData<T>().
 */
const RouteDataContext = createContext<unknown>(null);

export const PAGE_DATA_ID = '__DS_PAGE_DATA__';

/** Where the prerender writes each route's content as a fetchable file. */
export const dataUrl = (contentPath: string) => `/_data/${contentPath}.json`;

export function PageDataProvider({
  initialData = null,
  initialPath,
  children,
}: {
  initialData?: unknown;
  /** The path the embedded data belongs to. */
  initialPath?: string | undefined;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const key = normalise(pathname);

  // Seeded with the entry page so no fetch happens for the first render, and
  // kept across navigations so going back is instant.
  const cache = useRef<Map<string, unknown>>(
    new Map(initialPath ? [[normalise(initialPath), initialData]] : []),
  );
  const [, bump] = useState(0);

  const contentPath = findRoute(pathname).contentPath;
  const known = cache.current.has(key);

  useEffect(() => {
    if (!contentPath || known) return;

    let active = true;
    fetch(dataUrl(contentPath))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        cache.current.set(key, data);
        bump((n) => n + 1);
      })
      .catch(() => {
        if (!active) return;
        // Cache the miss so a failing route does not refetch on every render.
        cache.current.set(key, null);
        bump((n) => n + 1);
      });

    return () => {
      active = false;
    };
  }, [key, contentPath, known]);

  const value = contentPath ? (cache.current.get(key) ?? null) : null;

  return <RouteDataContext.Provider value={value}>{children}</RouteDataContext.Provider>;
}

export function useRouteData<T>(): T | null {
  return (useContext(RouteDataContext) as T | null) ?? null;
}

/**
 * Supplies content directly, with no fetching or caching.
 *
 * The admin preview needs a new value on every keystroke, which is exactly
 * what PageDataProvider's cache is designed to prevent. Preview is the one
 * caller that should bypass it.
 */
export function RouteDataPreview({
  value,
  children,
}: {
  value: unknown;
  children: ReactNode;
}) {
  return <RouteDataContext.Provider value={value}>{children}</RouteDataContext.Provider>;
}

/** Reads the embedded payload on the client. Returns null if absent or invalid. */
export function readEmbeddedPageData(): unknown {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(PAGE_DATA_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

const normalise = (path: string) => path.replace(/\/+$/, '') || '/';
