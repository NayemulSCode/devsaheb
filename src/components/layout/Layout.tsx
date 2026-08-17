import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  // The admin is a full-height tool, not a page on the site. Wrapping it in
  // the marketing header and footer cost vertical space the editor needs and
  // left a site footer sitting under a 100vh split view.
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* First tab stop on every page. Sighted keyboard users would otherwise
          traverse 45 mega-menu links before reaching the content. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-gold focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.1em] focus:text-gold"
      >
        Skip to content
      </a>
      <Header />
      <div id="main" className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
