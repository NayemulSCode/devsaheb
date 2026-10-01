/**
 * Services and technologies.
 *
 * Single source for the mega-menus, the hub pages, the footer, and the
 * sitemap. Grouping is by how buyers think, not alphabetically - twenty links
 * in one column is a wall, and four considered groups read as a firm that has
 * thought about its offering.
 *
 * `tier1` marks what launches first and what the footer links. The remaining
 * pages ship only as real content exists for them; see the substance bar in
 * PLAN.md. Forty-five templated pages is a doorway-page risk that is assessed
 * sitewide, not per page.
 */

export type TaxonomyItem = {
  name: string;
  slug: string;
  tier1?: boolean;
  /**
   * A detail page exists and has cleared the substance bar.
   *
   * Unpublished items still appear in the menus and hubs - the firm does the
   * work - but render as plain text rather than links. That avoids both a 404
   * and the worse option of shipping a thin page to fill the gap.
   */
  published?: boolean;
  /**
   * Content is written and reviewable, but has not cleared the substance bar.
   *
   * A draft gets a real route, so it can be opened at its own URL and edited in
   * /admin - without this, a written page exists only as a file on disk that
   * nothing in the system can display. It carries noindex, is kept out of the
   * sitemap, and is still not linked from the menus, so it is reachable only by
   * someone who was given the address.
   *
   * Mark it `published` when items 2 and 4 of the bar are genuinely met.
   */
  draft?: boolean;
  /**
   * Removes the item from the menus, hubs, footer and sitemap entirely.
   *
   * Different from `published`. Unpublished means "we do this, the page is not
   * written yet" and still shows as plain text. Hidden means "do not advertise
   * this at all" — use it for work you have stopped offering, rather than
   * deleting the entry and losing the record of the slug.
   */
  hidden?: boolean;
};

export type TaxonomyGroup = {
  name: string;
  items: TaxonomyItem[];
};

export const SERVICE_GROUPS: TaxonomyGroup[] = [
  {
    name: 'Build',
    items: [
      { name: 'Custom Software', slug: 'custom-software', tier1: true, published: true },
      { name: 'Web Development', slug: 'web-development', tier1: true, published: true },
      { name: 'Mobile App', slug: 'mobile-app', tier1: true, draft: true },
      { name: 'iOS', slug: 'ios', draft: true },
      { name: 'Android', slug: 'android', draft: true },
      { name: 'Front End', slug: 'front-end', draft: true },
      { name: 'Back End', slug: 'back-end', draft: true },
      { name: 'Test Automation', slug: 'test-automation', hidden: true },
    ],
  },
  {
    name: 'Platforms',
    items: [
      { name: 'SaaS', slug: 'saas', tier1: true, draft: true },
      { name: 'Ecommerce', slug: 'ecommerce', tier1: true, draft: true },
      { name: 'CMS', slug: 'cms', draft: true },
      { name: 'CRM', slug: 'crm', draft: true },
      { name: 'ERP', slug: 'erp', draft: true },
    ],
  },
  {
    name: 'Data & AI',
    items: [
      { name: 'AI Development', slug: 'ai-development', tier1: true, draft: true },
      { name: 'Machine Learning', slug: 'machine-learning', draft: true },
      { name: 'Database', slug: 'database', draft: true },
    ],
  },
  {
    name: 'Cloud & Operations',
    items: [
      { name: 'Cloud Application', slug: 'cloud-application', tier1: true, draft: true },
      { name: 'DevOps', slug: 'devops', tier1: true, published: true },
      { name: 'QA', slug: 'qa', published: true },
      { name: 'Legacy Modernization', slug: 'legacy-application-modernization', draft: true },
      { name: 'Digital Transformation', slug: 'digital-transformation', draft: true },
    ],
  },
];

/**
 * Four slugs are deliberately not what the reference site uses. `c` for C#
 * reads as the C language, `net` for .NET is a meaningless token, google-clouds
 * is a typo, and angular-js names the 1.x line that reached end of life in
 * January 2022 - advertising it signals a decade-stale stack.
 */
export const TECHNOLOGY_GROUPS: TaxonomyGroup[] = [
  {
    name: 'Frontend',
    items: [
      { name: 'JavaScript', slug: 'javascript', draft: true },
      { name: 'TypeScript', slug: 'typescript', tier1: true, published: true },
      { name: 'React.js', slug: 'reactjs', tier1: true, published: true },
      { name: 'Next.js', slug: 'nextjs', tier1: true, published: true },
      { name: 'Vue.js', slug: 'vuejs', draft: true },
      { name: 'Angular', slug: 'angular', draft: true },
      { name: 'Webflow', slug: 'webflow', draft: true },
    ],
  },
  {
    name: 'Backend',
    items: [
      { name: 'Node.js', slug: 'nodejs', tier1: true, published: true },
      { name: 'Python', slug: 'python', tier1: true, draft: true },
      { name: 'Django', slug: 'django', draft: true },
      { name: 'PHP', slug: 'php', draft: true },
      { name: 'Laravel', slug: 'laravel', draft: true },
      { name: 'Java', slug: 'java', draft: true },
      { name: 'Spring Boot', slug: 'spring-boot', draft: true },
      { name: 'Golang', slug: 'golang', draft: true },
      { name: 'C#', slug: 'csharp', draft: true },
      { name: '.NET', slug: 'dotnet', draft: true },
    ],
  },
  {
    name: 'Mobile',
    items: [
      { name: 'Flutter', slug: 'flutter', tier1: true, draft: true },
      { name: 'React Native', slug: 'react-native', tier1: true, draft: true },
      { name: 'Kotlin', slug: 'kotlin', draft: true },
    ],
  },
  {
    name: 'Cloud & AI',
    items: [
      { name: 'AWS', slug: 'aws', tier1: true, published: true },
      { name: 'Azure', slug: 'azure', draft: true },
      { name: 'Google Cloud', slug: 'google-cloud', draft: true },
      { name: 'Docker', slug: 'docker', draft: true },
      // Folded into /services/ai-development. Its query, 'ai development
      // services', is the same intent as that page's 'ai development company',
      // so the two competed - which docs/keyword-map.md flagged and this acts on.
      { name: 'AI', slug: 'ai', hidden: true },
    ],
  },
];

const flatten = (groups: TaxonomyGroup[]) => groups.flatMap((g) => g.items);

/**
 * Groups with hidden items removed, and any group left empty dropped.
 *
 * Menus and hubs render from these. SERVICES and TECHNOLOGIES below stay
 * complete, so a name lookup still resolves for anything already referenced.
 */
export const visibleGroups = (groups: TaxonomyGroup[]): TaxonomyGroup[] =>
  groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.hidden) }))
    .filter((g) => g.items.length > 0);

export const VISIBLE_SERVICE_GROUPS = visibleGroups(SERVICE_GROUPS);
export const VISIBLE_TECHNOLOGY_GROUPS = visibleGroups(TECHNOLOGY_GROUPS);

export const SERVICES = flatten(SERVICE_GROUPS);
export const TECHNOLOGIES = flatten(TECHNOLOGY_GROUPS);

export const TIER1_SERVICES = SERVICES.filter((s) => s.tier1);
export const PUBLISHED_SERVICES = SERVICES.filter((s) => s.published && !s.hidden);
export const PUBLISHED_TECHNOLOGIES = TECHNOLOGIES.filter((t) => t.published && !t.hidden);

/** Written but not yet published. Routed, noindexed, and absent from the menus. */
export const DRAFT_SERVICES = SERVICES.filter((s) => s.draft && !s.published && !s.hidden);
export const DRAFT_TECHNOLOGIES = TECHNOLOGIES.filter(
  (t) => t.draft && !t.published && !t.hidden,
);
export const TIER1_TECHNOLOGIES = TECHNOLOGIES.filter((t) => t.tier1);

export const servicePath = (slug: string) => `/services/${slug}`;
export const technologyPath = (slug: string) => `/technologies/${slug}`;
