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
      { name: 'Web Development', slug: 'web-development', tier1: true },
      { name: 'Mobile App', slug: 'mobile-app', tier1: true },
      { name: 'iOS', slug: 'ios' },
      { name: 'Android', slug: 'android' },
      { name: 'Front End', slug: 'front-end' },
      { name: 'Back End', slug: 'back-end' },
    ],
  },
  {
    name: 'Platforms',
    items: [
      { name: 'SaaS', slug: 'saas', tier1: true },
      { name: 'Ecommerce', slug: 'ecommerce', tier1: true },
      { name: 'CMS', slug: 'cms' },
      { name: 'CRM', slug: 'crm' },
      { name: 'ERP', slug: 'erp' },
    ],
  },
  {
    name: 'Data & AI',
    items: [
      { name: 'AI Development', slug: 'ai-development', tier1: true },
      { name: 'Machine Learning', slug: 'machine-learning' },
      { name: 'Database', slug: 'database' },
    ],
  },
  {
    name: 'Cloud & Operations',
    items: [
      { name: 'Cloud Application', slug: 'cloud-application', tier1: true },
      { name: 'DevOps', slug: 'devops', tier1: true, published: true },
      { name: 'QA', slug: 'qa' },
      { name: 'Legacy Modernization', slug: 'legacy-application-modernization' },
      { name: 'Digital Transformation', slug: 'digital-transformation' },
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
      { name: 'JavaScript', slug: 'javascript' },
      { name: 'TypeScript', slug: 'typescript', tier1: true },
      { name: 'React.js', slug: 'reactjs', tier1: true, published: true },
      { name: 'Next.js', slug: 'nextjs', tier1: true },
      { name: 'Vue.js', slug: 'vuejs' },
      { name: 'Angular', slug: 'angular' },
      { name: 'Webflow', slug: 'webflow' },
    ],
  },
  {
    name: 'Backend',
    items: [
      { name: 'Node.js', slug: 'nodejs', tier1: true },
      { name: 'Python', slug: 'python', tier1: true },
      { name: 'Django', slug: 'django' },
      { name: 'PHP', slug: 'php' },
      { name: 'Laravel', slug: 'laravel' },
      { name: 'Java', slug: 'java' },
      { name: 'Spring Boot', slug: 'spring-boot' },
      { name: 'Golang', slug: 'golang' },
      { name: 'C#', slug: 'csharp' },
      { name: '.NET', slug: 'dotnet' },
    ],
  },
  {
    name: 'Mobile',
    items: [
      { name: 'Flutter', slug: 'flutter', tier1: true },
      { name: 'React Native', slug: 'react-native', tier1: true },
      { name: 'Kotlin', slug: 'kotlin' },
    ],
  },
  {
    name: 'Cloud & AI',
    items: [
      { name: 'AWS', slug: 'aws', tier1: true, published: true },
      { name: 'Azure', slug: 'azure' },
      { name: 'Google Cloud', slug: 'google-cloud' },
      { name: 'Docker', slug: 'docker' },
      { name: 'AI', slug: 'ai' },
    ],
  },
];

const flatten = (groups: TaxonomyGroup[]) => groups.flatMap((g) => g.items);

export const SERVICES = flatten(SERVICE_GROUPS);
export const TECHNOLOGIES = flatten(TECHNOLOGY_GROUPS);

export const TIER1_SERVICES = SERVICES.filter((s) => s.tier1);
export const PUBLISHED_SERVICES = SERVICES.filter((s) => s.published);
export const PUBLISHED_TECHNOLOGIES = TECHNOLOGIES.filter((t) => t.published);
export const TIER1_TECHNOLOGIES = TECHNOLOGIES.filter((t) => t.tier1);

export const servicePath = (slug: string) => `/services/${slug}`;
export const technologyPath = (slug: string) => `/technologies/${slug}`;
