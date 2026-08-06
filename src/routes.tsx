import type { ComponentType } from 'react';
import type { RouteMeta } from './lib/seo';
import Home from './routes/Home';
import NotFound from './routes/NotFound';
import ServicesHub from './routes/ServicesHub';
import TechnologiesHub from './routes/TechnologiesHub';
import Work from './routes/Work';
import About from './routes/company/About';
import Team from './routes/company/Team';
import Ceo from './routes/company/Ceo';
import Partnership from './routes/company/Partnership';
import Careers from './routes/Careers';
import Contact from './routes/Contact';
import { Privacy, Terms } from './routes/Legal';

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
 * Phase 3b generates the 20 service and 25 technology detail routes from
 * content JSON rather than listing them by hand - and ships them in tiers, not
 * all at once. See the substance bar in PLAN.md.
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
  {
    path: '/services',
    Component: ServicesHub,
    meta: {
      title: 'Services',
      description:
        'Custom software, web and mobile development, SaaS and ecommerce platforms, AI, cloud, and DevOps. Twenty specialisms across four disciplines, delivered to one standard.',
    },
  },
  {
    path: '/technologies',
    Component: TechnologiesHub,
    meta: {
      title: 'Technologies',
      description:
        'The stack DevSaheb maintains in production: TypeScript, React, Next.js, Node.js, Python, Laravel, Flutter, React Native, AWS, Azure, and more.',
    },
  },
  {
    path: '/work',
    Component: Work,
    meta: {
      title: 'Work',
      description:
        'Case studies from DevSaheb. Problem, constraints, approach, architecture, and a measured result — the same structure every time.',
    },
  },
  {
    path: '/company/about',
    Component: About,
    meta: {
      title: 'About us',
      description:
        'DevSaheb treats engineering standards as the product. Our five-stage process and the published definition of done every build is measured against.',
    },
  },
  {
    path: '/company/team',
    Component: Team,
    meta: {
      title: 'Our team',
      description:
        'The engineers who will actually be on your project at DevSaheb — not an account manager who hands you over after signing.',
    },
  },
  {
    path: '/company/ceo',
    Component: Ceo,
    meta: {
      title: 'Our CEO',
      description:
        'How DevSaheb started, what it refuses to take on, and who is accountable when something goes wrong.',
    },
  },
  {
    path: '/company/partnership',
    Component: Partnership,
    meta: {
      title: 'Partnership',
      description:
        'White label, overflow capacity, and referral partnerships for agencies and studios that need engineering they can vouch for.',
    },
  },
  {
    path: '/careers',
    Component: Careers,
    meta: {
      title: 'Careers',
      description:
        'Engineering roles at DevSaheb. We hire people who argue with the spec and write the test that would have caught it.',
    },
  },
  {
    path: '/contact',
    Component: Contact,
    meta: {
      title: 'Contact',
      description:
        'Start a project with DevSaheb. A short call, no deck — and an honest answer if your problem is outside what we do well.',
    },
  },
  {
    path: '/privacy',
    Component: Privacy,
    meta: {
      title: 'Privacy policy',
      description: 'What this site collects, why, and how long it is kept.',
    },
  },
  {
    path: '/terms',
    Component: Terms,
    meta: {
      title: 'Terms of service',
      description:
        'The terms under which DevSaheb provides services and you use this site.',
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
