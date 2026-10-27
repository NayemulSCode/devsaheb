import type { BlockType } from './schema';

/**
 * What each block looks like the moment it is dragged in.
 *
 * Shared with the Puck config rather than written there, so check-content can
 * validate every one of them against the schema on each build. That check
 * exists because of a real failure: Hero's defaults set primaryHref to '', the
 * href schema rejected it, and the first thing anyone did with a fresh Hero -
 * add it and publish - failed on a field they had never touched.
 *
 * id is supplied by Puck on insert, so it is not part of a default.
 */
export const BLOCK_DEFAULTS = {
  Hero: {
    eyebrow: 'software engineering',
    title: 'A headline written for a human',
    highlight: '',
    lede: '',
    primaryLabel: '',
    primaryHref: '',
    secondaryLabel: '',
    secondaryHref: '',
  },
  HeroShowcase: {
    eyebrow: 'software engineering',
    title: 'Built to a standard, not to a',
    highlight: 'deadline.',
    lede: 'We build custom software, cloud platforms, and mobile apps. Every project ships typed end to end, reviewed line by line, and measured against numbers we commit to before the work starts.',
    primaryLabel: 'Start a project',
    primaryHref: '/contact',
    secondaryLabel: 'Our standards',
    secondaryHref: '/company/about',
    // No photos yet: each portrait shows initials until one is uploaded.
    people: [
      { name: 'Nayemul Saheb', role: 'CEO & Software Engineer', image: '' },
      { name: 'Fahim Asfaq', role: 'COO', image: '' },
      { name: 'Sumaiya Noor Muna', role: 'Software Quality Assurance', image: '' },
    ],
    // Commitments from the published definition of done, not marketing claims.
    badges: [
      { label: 'Accessibility', value: 'WCAG 2.2 AA' },
      { label: 'Largest Contentful Paint', value: '< 2.0 s' },
      { label: 'Test coverage floor', value: '80%' },
    ],
    rotateSeconds: 5,
  },
  Marquee: {
    tone: 'ink',
    label: 'Services we deliver',
    speed: 'normal',
    direction: 'left',
    // Only published pages are linked; a link to a draft would expose it.
    items: [
      { text: 'Custom Software', href: '/services/custom-software' },
      { text: 'Web Development', href: '/services/web-development' },
      { text: 'Mobile Apps', href: '' },
      { text: 'SaaS Platforms', href: '' },
      { text: 'Ecommerce', href: '' },
      { text: 'AI Development', href: '' },
      { text: 'Cloud Applications', href: '' },
      { text: 'DevOps', href: '/services/devops' },
      { text: 'Quality Assurance', href: '/services/qa' },
      { text: 'Legacy Modernization', href: '' },
    ],
  },
  ServiceExplorer: {
    tone: 'bone',
    eyebrow: 'what we build',
    heading: 'From the first requirement to a system your team can run.',
    cardLabel: 'Core services',
    items: [
      {
        title: 'Custom Software',
        description:
          'Systems built around how your business actually works, with the rules in one place and a codebase your team can still change safely in year three.',
        subItems: [
          { text: 'Architecture & scoping' },
          { text: 'Business workflows' },
          { text: 'Integrations & APIs' },
          { text: 'Internal tools' },
        ],
        image: '',
        imageAlt: '',
        href: '/services/custom-software',
        linkLabel: 'See more',
      },
      {
        title: 'Web Development',
        description:
          'Web applications that hold state, enforce rules and stay fast, with one typed contract shared by the browser and the server.',
        subItems: [
          { text: 'Front end' },
          { text: 'Back end' },
          { text: 'Ecommerce' },
          { text: 'Content management' },
        ],
        image: '',
        imageAlt: '',
        href: '/services/web-development',
        linkLabel: 'See more',
      },
      {
        title: 'Mobile App Development',
        description:
          'Apps built for real devices and real networks: offline-first, cross-platform where it fits and native where it does not.',
        subItems: [{ text: 'iOS' }, { text: 'Android' }, { text: 'Flutter' }, { text: 'React Native' }],
        image: '',
        imageAlt: '',
        href: '',
        linkLabel: '',
      },
      {
        title: 'SaaS Development',
        description:
          'Multi-tenant products with isolation, billing and onboarding designed in from the first customer rather than retrofitted after the tenth.',
        subItems: [
          { text: 'Tenant isolation' },
          { text: 'Billing & subscriptions' },
          { text: 'Self-serve onboarding' },
          { text: 'Admin dashboards' },
        ],
        image: '',
        imageAlt: '',
        href: '',
        linkLabel: '',
      },
      {
        title: 'AI Development',
        description:
          'Applied AI that ships: retrieval over your own content, measured against an evaluation set before it reaches anyone.',
        subItems: [
          { text: 'LLM integration' },
          { text: 'Retrieval (RAG)' },
          { text: 'Evaluation' },
          { text: 'Guardrails & cost control' },
        ],
        image: '',
        imageAlt: '',
        href: '',
        linkLabel: '',
      },
      {
        title: 'Cloud & DevOps',
        description:
          'Infrastructure as code, pipelines with gates that cannot be skipped, and a rollback that has been tested rather than assumed.',
        subItems: [
          { text: 'CI/CD pipelines' },
          { text: 'Infrastructure as code' },
          { text: 'Monitoring & alerting' },
          { text: 'Cloud migration' },
        ],
        image: '',
        imageAlt: '',
        href: '/services/devops',
        linkLabel: 'See more',
      },
    ],
  },
  IndustryGrid: {
    tone: 'bone',
    eyebrow: 'industry expertise',
    heading: 'Solving industry challenges with custom software.',
    lede: '',
    industries: [
      { label: 'Travel & Hospitality', icon: 'travel', href: '' },
      { label: 'Media & Entertainment', icon: 'media', href: '' },
      { label: 'Logistics & Shipping', icon: 'logistics', href: '' },
      { label: 'Energy & Utilities', icon: 'energy', href: '' },
      { label: 'Mortgage & Lending', icon: 'mortgage', href: '' },
      { label: 'Food & Beverage', icon: 'food', href: '' },
      { label: 'Automotive', icon: 'automotive', href: '' },
      { label: 'Sports', icon: 'sports', href: '' },
      { label: 'Finance', icon: 'finance', href: '' },
      { label: 'Banking & Payment', icon: 'banking', href: '' },
      { label: 'Aviation', icon: 'aviation', href: '' },
      { label: 'Construction', icon: 'construction', href: '' },
      { label: 'E-Learning & Education', icon: 'education', href: '' },
      { label: 'Oil & Gas', icon: 'oil-gas', href: '' },
      { label: 'Fintech', icon: 'fintech', href: '' },
      { label: 'Real Estate', icon: 'real-estate', href: '' },
      { label: 'Healthcare', icon: 'healthcare', href: '' },
      { label: 'Retail & FMCG', icon: 'retail', href: '' },
    ],
  },
  RichText: {
    tone: 'ink',
    eyebrow: '',
    heading: '',
    doc: { type: 'doc', content: [{ type: 'paragraph' }] },
  },
  MediaText: {
    tone: 'bone',
    side: 'right',
    image: '/og-default.png',
    imageAlt: '',
    eyebrow: '',
    heading: '',
    body: '',
    primaryLabel: '',
    primaryHref: '',
  },
  Cta: {
    tone: 'ink',
    heading: 'Start a conversation.',
    lede: '',
    primaryLabel: 'Contact us',
    primaryHref: '/contact',
    secondaryLabel: '',
    secondaryHref: '',
  },
  Stats: {
    tone: 'ink',
    eyebrow: '',
    heading: '',
    stats: [{ value: '0', label: 'Label', note: '' }],
  },
  SpecTable: {
    caption: 'Definition of done',
    rows: [{ label: 'Largest Contentful Paint', value: '< 2.0 s', tag: 'Enforced' }],
  },
  Quote: { tone: 'ink', quote: '', attribution: '', role: '' },
  LogoWall: { tone: 'bone', eyebrow: '', heading: '', logos: [] },
  CardGrid: { tone: 'bone', eyebrow: '', heading: '', lede: '', cards: [] },
  Steps: { tone: 'bone', eyebrow: '', heading: '', lede: '', steps: [] },
  Checklist: {
    tone: 'bone',
    eyebrow: '',
    heading: '',
    includedTitle: 'What you get',
    included: [],
    excludedTitle: '',
    excluded: [],
  },
  Faq: { tone: 'ink', eyebrow: '', heading: '', items: [] },
  TeamGrid: { tone: 'bone', eyebrow: '', heading: '', lede: '', people: [] },
} satisfies Record<BlockType, Record<string, unknown>>;

/**
 * A fresh array entry, for the same reason.
 *
 * Adding a row to Stats or a person to TeamGrid creates an object from these
 * keys, and those are just as capable of failing validation as a whole block.
 */
export const ARRAY_ITEM_DEFAULTS: Record<string, Record<string, unknown>> = {
  'Stats.stats': { value: '0', label: 'Label', note: '' },
  'SpecTable.rows': { label: 'Label', value: 'Value', tag: '' },
  'CardGrid.cards': { index: '', title: 'Card', body: '', items: [] },
  'Steps.steps': { title: 'Step', body: '' },
  'Faq.items': { q: 'Question?', a: '' },
  'TeamGrid.people': { name: 'Name', role: 'Role', focus: '', image: '' },
  'LogoWall.logos': { name: 'Name', image: '', href: '' },
  'HeroShowcase.people': { name: 'Name', role: 'Role', image: '' },
  'HeroShowcase.badges': { label: 'Label', value: 'Value' },
  'Marquee.items': { text: 'Item', href: '' },
  'ServiceExplorer.items': {
    title: 'Service',
    description: '',
    subItems: [],
    image: '',
    imageAlt: '',
    href: '',
    linkLabel: '',
  },
  'IndustryGrid.industries': { label: 'Industry', icon: 'other', href: '' },
};
