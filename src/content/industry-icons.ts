/**
 * Icons the IndustryGrid block can show.
 *
 * The keys are stored in page content, so renaming one is a content migration.
 * Kept free of zod and of JSX so the schema and the editor can both import the
 * list without pulling either into the other's bundle.
 */
export const INDUSTRY_ICONS = [
  'travel',
  'media',
  'logistics',
  'energy',
  'mortgage',
  'food',
  'automotive',
  'sports',
  'finance',
  'banking',
  'aviation',
  'construction',
  'education',
  'oil-gas',
  'fintech',
  'real-estate',
  'healthcare',
  'retail',
  'other',
] as const;

export type IndustryIconName = (typeof INDUSTRY_ICONS)[number];

/** What each icon depicts, for the editor's picker. */
export const INDUSTRY_ICON_LABELS: Record<IndustryIconName, string> = {
  travel: 'Suitcase — travel, hospitality',
  media: 'Play — media, entertainment',
  logistics: 'Truck — logistics, shipping',
  energy: 'Lightning — energy, utilities',
  mortgage: 'House — mortgage, lending',
  food: 'Fork and knife — food, beverage',
  automotive: 'Steering wheel — automotive',
  sports: 'Ball — sports',
  finance: 'Bank — finance',
  banking: 'Card — banking, payments',
  aviation: 'Plane — aviation',
  construction: 'Bricks — construction',
  education: 'Mortarboard — education',
  'oil-gas': 'Drop — oil, gas',
  fintech: 'Coin — fintech',
  'real-estate': 'Building — real estate',
  healthcare: 'Heart — healthcare',
  retail: 'Bag — retail, FMCG',
  other: 'Grid — anything else',
};
