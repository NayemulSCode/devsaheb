import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { cn } from '../../lib/cn';
import {
  SERVICE_GROUPS,
  TECHNOLOGY_GROUPS,
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

export default function Header() {
  const [open, setOpen] = useState<MenuId | null>(null);
  const [drawer, setDrawer] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});
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

  const close = useCallback(
    (returnFocusTo?: MenuId | null) => {
      clearTimer();
      setOpen(null);
      if (returnFocusTo) triggers.current[returnFocusTo]?.focus();
    },
    [],
  );

  useEffect(() => {
    if (!open && !drawer) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (open) close(open);
      else setDrawer(false);
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

  useEffect(() => clearTimer, []);

  const hoverOpen = (id: MenuId) => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(id), HOVER_INTENT_MS);
  };

  const hoverClose = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(null), HOVER_INTENT_MS);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-gold/20 bg-ink/90 backdrop-blur-md"
      style={{ ['--accent' as string]: 'var(--color-gold)', ['--accent-line' as string]: 'rgb(204 170 80 / 0.2)' }}
    >
      <Container>
        <div className="flex h-[74px] items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center" aria-label="DevSaheb — home">
            <img
              src="/ds-lockup-h-dark.svg"
              alt="DevSaheb"
              width={90}
              height={35}
              className="h-[35px] w-auto"
            />
          </Link>

          <button
            type="button"
            onClick={() => setDrawer((v) => !v)}
            aria-expanded={drawer}
            aria-controls="primary-nav"
            className="ml-auto inline-flex items-center gap-2 border border-gold/30 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-silver lg:hidden"
          >
            {drawer ? 'Close' : 'Menu'}
          </button>

          <nav
            id="primary-nav"
            aria-label="Primary"
            className={cn(
              'lg:ml-auto lg:flex lg:items-center lg:gap-1',
              drawer
                ? 'absolute inset-x-0 top-full max-h-[calc(100vh-74px)] overflow-y-auto border-b border-gold/20 bg-ink px-5 pb-8 pt-2'
                : 'hidden lg:static lg:flex lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0',
            )}
          >
            <ul className="lg:flex lg:items-center lg:gap-1">
              <NavDropdown
                id="services"
                label="Services"
                open={open === 'services'}
                onToggle={() => setOpen(open === 'services' ? null : 'services')}
                onHoverOpen={() => hoverOpen('services')}
                onHoverClose={hoverClose}
                registerTrigger={(el) => (triggers.current.services = el)}
                width="lg:w-[760px]"
              >
                <TaxonomyPanel groups={SERVICE_GROUPS} toPath={servicePath} hub="/services" />
              </NavDropdown>

              <NavDropdown
                id="technologies"
                label="Technologies"
                open={open === 'technologies'}
                onToggle={() => setOpen(open === 'technologies' ? null : 'technologies')}
                onHoverOpen={() => hoverOpen('technologies')}
                onHoverClose={hoverClose}
                registerTrigger={(el) => (triggers.current.technologies = el)}
                width="lg:w-[700px]"
              >
                <TaxonomyPanel
                  groups={TECHNOLOGY_GROUPS}
                  toPath={technologyPath}
                  hub="/technologies"
                />
              </NavDropdown>

              <li>
                <TopLink to="/work">Work</TopLink>
              </li>

              <NavDropdown
                id="company"
                label="Company"
                open={open === 'company'}
                onToggle={() => setOpen(open === 'company' ? null : 'company')}
                onHoverOpen={() => hoverOpen('company')}
                onHoverClose={hoverClose}
                registerTrigger={(el) => (triggers.current.company = el)}
                width="lg:w-[230px]"
              >
                <ul className="grid">
                  {COMPANY_LINKS.map(({ name, path }) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="block border-b border-silver/10 py-2.5 text-sm text-silver transition-colors last:border-b-0 hover:text-gold"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavDropdown>

              <li>
                <TopLink to="/careers">Careers</TopLink>
              </li>
            </ul>

            <div className="mt-6 lg:ml-3 lg:mt-0">
              <Button to="/contact" className="w-full lg:w-auto">
                Contact
              </Button>
            </div>
          </nav>
        </div>
      </Container>
    </header>
  );
}

function TopLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block py-3.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:text-bone lg:px-3.5 lg:py-6"
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  id,
  label,
  open,
  onToggle,
  onHoverOpen,
  onHoverClose,
  registerTrigger,
  width,
  children,
}: {
  id: MenuId;
  label: string;
  open: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onHoverClose: () => void;
  registerTrigger: (el: HTMLButtonElement | null) => void;
  width: string;
  children: React.ReactNode;
}) {
  const panelId = `menu-${id}`;
  return (
    <li
      className="lg:relative"
      onMouseEnter={onHoverOpen}
      onMouseLeave={onHoverClose}
    >
      <button
        type="button"
        ref={registerTrigger}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 py-3.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.1em] text-silver transition-colors hover:text-bone lg:w-auto lg:px-3.5 lg:py-6"
      >
        {label}
        <span
          aria-hidden="true"
          className={cn(
            'size-1 rounded-full bg-gold transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
      </button>

      {/*
        The panel is always in the markup, never injected on open. Every one of
        the 45 taxonomy URLs has to be a real <a href> in the prerendered HTML
        or crawlers cannot reach them and the link graph is stranded.
        Visibility is CSS only. visibility:hidden also removes the links from
        the tab order and the accessibility tree while closed.
      */}
      <div
        id={panelId}
        className={cn(
          'lg:absolute lg:left-1/2 lg:top-full lg:z-50 lg:-translate-x-1/2 lg:border lg:border-gold/20 lg:bg-ink-2 lg:p-7 lg:shadow-[0_30px_70px_rgb(0_0_0/0.55)]',
          'lg:transition-[opacity,transform] lg:duration-200 lg:ease-[var(--ease-brand)]',
          width,
          open
            ? 'block pb-4 pl-3 lg:visible lg:translate-y-0 lg:pb-7 lg:pl-7 lg:opacity-100'
            : 'hidden lg:block lg:invisible lg:-translate-y-1.5 lg:opacity-0',
        )}
      >
        {children}
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
      <div className="grid gap-6 lg:grid-cols-4 lg:gap-7">
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
                    <span className="block cursor-default text-[13.5px] text-silver-dim">
                      {item.name}
                    </span>
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
