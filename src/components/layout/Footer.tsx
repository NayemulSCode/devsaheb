import { Link } from 'react-router-dom';
import Container from '../ui/Container';
// Only published pages are linked. A footer link to an unwritten page is a 404
// on every page of the site at once.
import { PUBLISHED_SERVICES, servicePath } from '../../content/taxonomy';
import { telHref, addressLines, activeSocial, type SiteConfig } from '../../lib/seo';
import siteJson from '../../../content/site.json';

const site = siteJson as SiteConfig;

const COMPANY = [
  { name: 'About Us', path: '/company/about' },
  { name: 'Our Team', path: '/company/team' },
  { name: 'Our CEO', path: '/company/ceo' },
  { name: 'Partnership', path: '/company/partnership' },
  { name: 'Careers', path: '/careers' },
  { name: 'Contact', path: '/contact' },
];

const RESOURCES = [
  { name: 'Case Studies', path: '/work' },
  { name: 'Services', path: '/services' },
  { name: 'Technologies', path: '/technologies' },
];

/** Icon geometry only. The hrefs live in content/site.json. */
const SOCIAL_ICONS: Record<string, string> = {
  LinkedIn: 'M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3ZM10 9h3.8v1.7h.05a4.2 4.2 0 0 1 3.75-2c4 0 4.75 2.6 4.75 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2.05 1.4-2.05 2.8V21h-4Z',
  GitHub: 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z',
  X: 'M18.24 2H21l-6.55 7.49L22.5 22h-6.3l-4.93-6.44L5.6 22H2.84l7.01-8.01L1.5 2h6.45l4.46 5.89ZM17.1 20.3h1.53L7.01 3.6H5.37Z',
  Facebook: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z',
};

export default function Footer() {
  return (
    <footer
      className="border-t border-gold/20 bg-ink-2 pt-16"
      style={{ ['--accent' as string]: 'var(--color-gold)' }}
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr] lg:gap-12">
          <div>
            <Link to="/" aria-label="DevSaheb — home" className="inline-block">
              <img
                src="/ds-lockup-h-dark.svg"
                alt="DevSaheb"
                width={103}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            <address className="mt-7 grid gap-4 not-italic">
              <ContactLine icon="pin">
                {addressLines(site.contact.address).map((line, i, all) => (
                  <span key={line}>
                    {line}
                    {i < all.length - 1 ? <br /> : null}
                  </span>
                ))}
              </ContactLine>
              <ContactLine icon="mail">
                <a href={`mailto:${site.contact.email}`} className="hover:text-gold">
                  {site.contact.email}
                </a>
              </ContactLine>
              <ContactLine icon="phone">
                <a href={telHref(site.contact.phone)} className="hover:text-gold">
                  {site.contact.phone}
                </a>
              </ContactLine>
            </address>

            {/* Only profiles that exist. Linking a network's homepage because we
                have no profile yet is worse than showing nothing. */}
            {activeSocial(site).length > 0 ? (
              <div className="mt-9">
                <p className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-silver">
                  <span aria-hidden="true" className="h-px w-6 bg-gold" />
                  Follow us
                </p>
                <ul className="flex gap-2">
                  {activeSocial(site).map(({ label, href }) => (
                    <li key={label}>
                      {/* Bare icons announce as nothing, so each carries its own label. */}
                      <a
                        href={href}
                        aria-label={`${site.name} on ${label}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid size-9 place-items-center border border-silver/15 text-silver transition-[color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d={SOCIAL_ICONS[label] ?? ''} />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <FooterColumn title="Company" links={COMPANY} />

          {/* Six services and no technologies column. Sitewide links to all 45
              pages would flatten the internal link graph so nothing reads as
              important, and dense keyword-link footers are a known spam
              pattern. The hubs distribute from here. */}
          <FooterColumn
            title="Services"
            links={PUBLISHED_SERVICES.slice(0, 6).map((s) => ({
              name: s.name,
              path: servicePath(s.slug),
            }))}
            more={{ name: 'All services →', path: '/services' }}
          />

          <FooterColumn
            title="Resources"
            links={RESOURCES}
            more={{ name: 'All technologies →', path: '/technologies' }}
          />
        </div>

        <div className="mt-11 flex flex-wrap items-center gap-6 lg:justify-end">
          {/* Displayed as images only. Self-serving AggregateRating markup on
              your own Organization is disallowed for rich results. */}
          <div className="grid min-w-32 gap-1 border border-silver/15 px-4 py-2.5">
            <span className="font-display text-[15px] font-extrabold text-bone">BASIS</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-silver-dim">
              Member — verify before use
            </span>
          </div>
          <div className="grid min-w-32 gap-1 border border-silver/15 px-4 py-2.5">
            <span className="text-xs tracking-[0.1em] text-gold">★★★★★</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-silver-dim">
              Google reviews — display only
            </span>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-gold/20 py-6 font-mono text-[10.5px] tracking-[0.06em] text-silver-dim">
          <span>
            © {new Date().getFullYear()} {site.name}
            {site.registrationNumber ? ` · Reg. No. ${site.registrationNumber}` : ''}
          </span>
          <nav aria-label="Legal" className="flex gap-6">
            <Link to="/privacy" className="hover:text-gold">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gold">
              Terms
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  more,
}: {
  title: string;
  links: { name: string; path: string }[];
  more?: { name: string; path: string };
}) {
  return (
    <div>
      <h2 className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
        {title}
      </h2>
      <ul className="grid gap-3">
        {links.map(({ name, path }) => (
          <li key={path}>
            <Link to={path} className="text-[13.5px] text-silver transition-colors hover:text-gold">
              {name}
            </Link>
          </li>
        ))}
        {more ? (
          <li>
            <Link
              to={more.path}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-gold hover:underline"
            >
              {more.name}
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

const ICONS = {
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z',
  mail: 'm3 7 9 6 9-6',
  phone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
} as const;

function ContactLine({
  icon,
  children,
}: {
  icon: keyof typeof ICONS;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-[13.5px] text-silver">
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#CCAA50"
        strokeWidth="1.6"
        aria-hidden="true"
        className="mt-1 shrink-0"
      >
        {icon === 'mail' ? <rect x="3" y="5" width="18" height="14" rx="2" /> : null}
        {icon === 'pin' ? <circle cx="12" cy="10" r="3" /> : null}
        <path d={ICONS[icon]} />
      </svg>
      <span>{children}</span>
    </div>
  );
}
