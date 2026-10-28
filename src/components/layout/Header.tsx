import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import {
  VISIBLE_SERVICE_GROUPS,
  VISIBLE_TECHNOLOGY_GROUPS,
  servicePath,
  technologyPath,
  type TaxonomyGroup,
} from '../../content/taxonomy';

type MenuId = 'services' | 'technologies' | 'company';

const COMPANY_LINKS = [
  { name: 'About Us', path: '/company/about' },
  { name: 'Our Team', path: '/company/team' },
  { name: 'Our CEO', path: '/company/ceo' },
  { name: 'Partnership', path: '/company/partnership' },
];

/** Diagonal mouse travel toward a panel briefly leaves the trigger. */
const HOVER_INTENT_MS = 150;

/** The drawer only exists below this; widening past it closes the drawer. */
const DESKTOP_QUERY = '(min-width: 64rem)';

/**
 * The site header: a floating pill.
 *
 * The header itself is a transparent sticky strip that lets clicks through;
 * only the pill and the open drawer take pointer events, so the page scrolling
 * underneath stays usable in the gutters around it. Once the page has moved,
 * the pill gets a firmer background and a shadow to lift it off the content.
 */
export default function Header() {
  const [open, setOpen] = useState<MenuId | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});
  const menuButton = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pathname } = useLocation();

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Route changes should never leave a menu hanging open.
  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [pathname]);

  const close = useCallback((returnFocusTo?: MenuId | null) => {
    clearTimer();
    setOpen(null);
    if (returnFocusTo) triggers.current[returnFocusTo]?.focus();
  }, []);

  useEffect(() => {
    if (!open && !drawer) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (open) close(open);
      else {
        setDrawer(false);
        menuButton.current?.focus();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        close();
        setDrawer(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, drawer, close]);

  // The page behind an open drawer should not scroll, and a drawer left open
  // while the window widens to desktop would sit under the inline menu.
  useEffect(() => {
    if (!drawer) return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => mq.matches && setDrawer(false);
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    mq.addEventListener('change', onChange);
    return () => {
      root.style.overflow = previous;
      mq.removeEventListener('change', onChange);
    };
  }, [drawer]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => clearTimer, []);

  const hoverOpen = (id: MenuId) => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(id), HOVER_INTENT_MS);
  };

  const hoverClose = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(null), HOVER_INTENT_MS);
  };

  const dropdown = (id: MenuId) => ({
    id,
    open: open === id,
    onToggle: () => setOpen(open === id ? null : id),
    onHoverOpen: () => hoverOpen(id),
    onHoverClose: hoverClose,
    registerTrigger: (el: HTMLButtonElement | null) => {
      triggers.current[id] = el;
    },
  });

  return (
    <header
      ref={headerRef}
      className="pointer-events-none sticky top-0 z-50 px-3 pt-3 sm:px-5 lg:pt-4"
      style={{ ['--accent' as string]: 'var(--color-gold)', ['--accent-line' as string]: 'color-mix(in srgb, var(--color-gold) 20%, transparent)' }}
    >
      {/* Dims the page under the open drawer; a tap on it closes the drawer. A
          sibling of the pill, not a child: the pill's backdrop-filter would make
          it the containing block for anything fixed inside it. */}
      {drawer ? (
        <div
          aria-hidden="true"
          onClick={() => setDrawer(false)}
          className="pointer-events-auto fixed inset-0 bg-ink/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <div
        className={cn(
          'pointer-events-auto relative mx-auto flex h-14 max-w-[1180px] items-center gap-4 rounded-full border pl-5 pr-2 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 lg:h-[60px] lg:pl-6',
          scrolled || drawer
            ? 'border-gold/25 bg-ink-2/90 shadow-[var(--shadow-pill)]'
            : 'border-gold/15 bg-ink-2/60',
        )}
      >
        <Link to="/" className="flex shrink-0 items-center" aria-label="DevSaheb — home">
          <img src="/ds-lockup-h-dark.svg" alt="DevSaheb" width={83} height={32} className="h-8 w-auto light:hidden" />
          <img src="/ds-lockup-h.svg" alt="DevSaheb" width={83} height={32} className="hidden h-8 w-auto light:block" />
        </Link>

        {/* Before the nav in the DOM, so on a phone Tab reaches the menu
            button and then the drawer it opens; drawn after it from lg. */}
        <div className="ml-auto flex items-center gap-2 lg:order-last lg:ml-1">
          <ThemeToggle />
          <button
            ref={menuButton}
            type="button"
            onClick={() => setDrawer((v) => !v)}
            aria-expanded={drawer}
            aria-controls="primary-nav"
            aria-label={drawer ? 'Close menu' : 'Open menu'}
            className="grid size-10 place-items-center rounded-full border border-gold/25 text-bone transition-colors hover:border-gold hover:text-gold lg:hidden"
          >
            <MenuIcon open={drawer} />
          </button>
        </div>

        <nav
          id="primary-nav"
          aria-label="Primary"
          className={cn(
            'lg:ml-auto lg:flex lg:items-center lg:gap-2',
            drawer
              ? 'absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain rounded-3xl border border-gold/20 bg-ink-2 px-5 pb-5 pt-2 shadow-[var(--shadow-float)]'
              : 'hidden',
          )}
        >
          <ul className="divide-y divide-silver/10 lg:flex lg:items-center lg:gap-0.5 lg:divide-y-0">
            <NavDropdown {...dropdown('services')} label="Services" active={pathname.startsWith('/services')} wide>
              <TaxonomyPanel groups={VISIBLE_SERVICE_GROUPS} toPath={servicePath} hub="/services" />
            </NavDropdown>

            <NavDropdown
              {...dropdown('technologies')}
              label="Technologies"
              active={pathname.startsWith('/technologies')}
              wide
            >
              <TaxonomyPanel groups={VISIBLE_TECHNOLOGY_GROUPS} toPath={technologyPath} hub="/technologies" />
            </NavDropdown>

            <li>
              <TopLink to="/work" active={pathname.startsWith('/work')}>
                Work
              </TopLink>
            </li>

            <NavDropdown {...dropdown('company')} label="Company" active={pathname.startsWith('/company')}>
              <ul className="grid">
                {COMPANY_LINKS.map(({ name, path }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      aria-current={pathname === path ? 'page' : undefined}
                      className="block rounded-xl py-2.5 text-sm text-silver transition-colors hover:text-gold aria-[current=page]:text-gold lg:px-3 lg:hover:bg-gold/5"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </NavDropdown>

            <li>
              <TopLink to="/careers" active={pathname.startsWith('/careers')}>
                Careers
              </TopLink>
            </li>
          </ul>

          <Link
            to="/contact"
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-gold-lift lg:ml-2 lg:mt-0 lg:py-2.5"
          >
            Contact
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

type Theme = 'dark' | 'light';

/** Must match the key the inline head script reads in scripts/prerender.mjs. */
const THEME_KEY = 'theme';

const THEME_COLOR: Record<Theme, string> = { dark: '#0B1020', light: '#FBF8F2' };

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

/**
 * Switches between the light and dark themes.
 *
 * Light is the default for everyone, whatever their system setting; the head
 * script has already applied a saved choice of dark before first paint, so
 * this only reads the result. Which icon shows is decided by CSS from
 * data-theme, not from state, so the prerendered button is right from the
 * first frame instead of flipping on hydration. A choice is remembered.
 */
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current: Theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current);
    applyTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode or storage disabled: the switch still works for this page.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className="grid size-10 place-items-center rounded-full border border-gold/25 text-bone transition-colors hover:border-gold hover:text-gold"
    >
      {/* Sun on dark (to go light), moon on light (to go dark). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-[18px] light:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="hidden size-[18px] light:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11Z" />
      </svg>
    </button>
  );
}

/** Three bars that fold into a cross. Decorative: the button carries the label. */
function MenuIcon({ open }: { open: boolean }) {
  const bar =
    'absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-transform duration-300 ease-[var(--ease-brand)] motion-reduce:transition-none';
  return (
    <span aria-hidden="true" className="relative block h-3 w-[18px]">
      <span className={cn(bar, 'top-0', open && 'translate-y-[5.25px] rotate-45')} />
      <span className={cn(bar, 'top-[5.25px] transition-opacity', open && 'opacity-0')} />
      <span className={cn(bar, 'bottom-0', open && '-translate-y-[5.25px] -rotate-45')} />
    </span>
  );
}

const ITEM =
  'font-mono text-[11.5px] font-medium uppercase tracking-[0.1em] transition-colors lg:rounded-full lg:px-3.5 lg:py-2';

function TopLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        ITEM,
        'block py-4',
        active ? 'text-gold lg:bg-gold/10' : 'text-silver hover:text-bone lg:hover:bg-bone/5',
      )}
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  id,
  label,
  open,
  active,
  wide = false,
  onToggle,
  onHoverOpen,
  onHoverClose,
  registerTrigger,
  children,
}: {
  id: MenuId;
  label: string;
  open: boolean;
  active: boolean;
  /** Mega panels centre under the whole bar, so they never run off screen. */
  wide?: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onHoverClose: () => void;
  registerTrigger: (el: HTMLButtonElement | null) => void;
  children: React.ReactNode;
}) {
  const panelId = `menu-${id}`;
  return (
    <li className={cn(!wide && 'lg:relative')} onMouseEnter={onHoverOpen} onMouseLeave={onHoverClose}>
      <button
        type="button"
        ref={registerTrigger}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          ITEM,
          'flex w-full items-center justify-between gap-1.5 py-4 lg:w-auto',
          open || active ? 'text-gold' : 'text-silver hover:text-bone',
          active ? 'lg:bg-gold/10' : open ? 'lg:bg-bone/5' : 'lg:hover:bg-bone/5',
        )}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={cn('size-3 transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m3 4.5 3 3 3-3" />
        </svg>
      </button>

      {/*
        The panel is always in the markup, never injected on open. Every one of
        the 45 taxonomy URLs has to be a real <a href> in the prerendered HTML
        or crawlers cannot reach them and the link graph is stranded.
        Visibility is CSS only. visibility:hidden also removes the links from
        the tab order and the accessibility tree while closed.

        On desktop the panel's top padding is a transparent bridge across the
        gap below the pill, so the pointer never leaves the item on its way down.
      */}
      <div
        id={panelId}
        className={cn(
          'lg:absolute lg:top-full lg:z-50 lg:pt-3',
          'lg:transition-[opacity,transform,visibility] lg:duration-200 lg:ease-[var(--ease-brand)]',
          wide ? 'lg:inset-x-0 lg:mx-auto lg:w-[min(760px,100%)]' : 'lg:left-1/2 lg:w-[240px] lg:-translate-x-1/2',
          open
            ? 'block pb-4 lg:visible lg:translate-y-0 lg:pb-0 lg:opacity-100'
            : 'hidden lg:invisible lg:block lg:-translate-y-1.5 lg:opacity-0',
        )}
      >
        <div className="rounded-2xl border border-gold/15 bg-ink/40 p-4 lg:border-gold/20 lg:bg-ink-2 lg:p-6 lg:shadow-[var(--shadow-float)]">
          {children}
        </div>
      </div>
    </li>
  );
}

function TaxonomyPanel({
  groups,
  toPath,
  hub,
}: {
  groups: TaxonomyGroup[];
  toPath: (slug: string) => string;
  hub: string;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-4 lg:gap-7">
        {groups.map((group) => (
          <div key={group.name}>
            <h2 className="mb-3.5 border-b border-gold/20 pb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
              {group.name}
            </h2>
            <ul className="grid gap-2.5">
              {group.items.map((item) => (
                <li key={item.slug}>
                  {item.published ? (
                    <Link
                      to={toPath(item.slug)}
                      className="block text-[13.5px] text-silver transition-[color,padding] duration-150 hover:pl-1 hover:text-gold"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    // We do the work; the page is not written yet. A link here
                    // would 404, and a filler page would be the thin content
                    // the whole tiering strategy exists to avoid.
                    <span className="block cursor-default text-[13.5px] text-silver-dim">{item.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link
        to={hub}
        className="mt-6 inline-block font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold hover:underline"
      >
        View all →
      </Link>
    </>
  );
}
