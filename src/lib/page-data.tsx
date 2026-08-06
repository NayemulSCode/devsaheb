import { createContext, useContext, type ReactNode } from 'react';
import type { PageContent } from '../content/schema';

/**
 * Content for the page currently being rendered.
 *
 * The server reads it from disk; the prerender embeds it in the HTML; the
 * client reads it back on hydration. Both sides therefore render from the same
 * bytes, which is what keeps hydration stable.
 */
const PageDataContext = createContext<PageContent | null>(null);

export function PageDataProvider({
  value,
  children,
}: {
  value: PageContent | null;
  children: ReactNode;
}) {
  return <PageDataContext.Provider value={value}>{children}</PageDataContext.Provider>;
}

export function usePageData(): PageContent | null {
  return useContext(PageDataContext);
}

export const PAGE_DATA_ID = '__DS_PAGE_DATA__';

/** Reads the embedded payload on the client. Returns null if absent or invalid. */
export function readEmbeddedPageData(): PageContent | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(PAGE_DATA_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as PageContent;
  } catch {
    return null;
  }
}
