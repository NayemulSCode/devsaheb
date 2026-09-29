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
  Prose: { tone: 'ink', eyebrow: '', heading: '', body: '' },
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
};
