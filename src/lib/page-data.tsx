import { createContext, useContext, type ReactNode } from 'react';

/**
 * Content for the page currently being rendered.
 *
 * The server reads it from disk; the prerender embeds it in the HTML; the
 * client reads it back on hydration. Both sides therefore render from the same
 * bytes, which is what keeps hydration stable.
 *
 * Typed as unknown because routes carry different shapes - block lists for
 * editable pages, a structured record for taxonomy detail pages. Each route
 * asserts its own via useRouteData<T>().
 */
const RouteDataContext = createContext<unknown>(null);

export function PageDataProvider({
  value,
  children,
}: {
  value: unknown;
  children: ReactNode;
}) {
  return <RouteDataContext.Provider value={value}>{children}</RouteDataContext.Provider>;
}

export function useRouteData<T>(): T | null {
  return (useContext(RouteDataContext) as T | null) ?? null;
}

export const PAGE_DATA_ID = '__DS_PAGE_DATA__';

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
