import { z } from 'zod';

/**
 * Page content schema.
 *
 * The shape is Puck-compatible ({ root, content: [{ type, props }] }) so the
 * editor can read and write it directly, but public pages render it through
 * our own registry in components/blocks. That keeps @measured/puck out of the
 * marketing bundle entirely - it only ships inside the lazy /admin chunk.
 *
 * Client modules must import from here with `import type` only. The tsconfig
 * sets verbatimModuleSyntax, so a value import would be a visible mistake
 * rather than a silent 60 kB of zod in the public bundle.
 */

const trimmed = (max: number) => z.string().trim().max(max);

/** Internal path or absolute URL. Blocks javascript: and data: URLs. */
const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v) || /^(mailto|tel):/i.test(v), {
    message: 'Must be a root-relative path, http(s) URL, mailto: or tel:',
  });

const tone = z.enum(['ink', 'bone']);

const heroBlock = z.object({
  type: z.literal('Hero'),
  props: z.object({
    id: trimmed(64).optional(),
    eyebrow: trimmed(60),
    title: trimmed(200),
    /** Rendered in the accent colour inside the title. */
    highlight: trimmed(60).optional(),
    lede: trimmed(600).optional(),
    primaryLabel: trimmed(40).optional(),
    primaryHref: href.optional(),
    secondaryLabel: trimmed(40).optional(),
    secondaryHref: href.optional(),
  }),
});

const specTableBlock = z.object({
  type: z.literal('SpecTable'),
  props: z.object({
    id: trimmed(64).optional(),
    caption: trimmed(80),
    rows: z
      .array(
        z.object({
          label: trimmed(80),
          value: trimmed(40),
          tag: trimmed(20).optional(),
        }),
      )
      .max(20),
  }),
});

const cardGridBlock = z.object({
  type: z.literal('CardGrid'),
  props: z.object({
    id: trimmed(64).optional(),
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    lede: trimmed(400).optional(),
    cards: z
      .array(
        z.object({
          index: trimmed(8).optional(),
          title: trimmed(80),
          items: z.array(trimmed(80)).max(12).optional(),
          body: trimmed(400).optional(),
        }),
      )
      .max(12),
  }),
});

const proseBlock = z.object({
  type: z.literal('Prose'),
  props: z.object({
    id: trimmed(64).optional(),
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    /** Plain paragraphs for now. Tiptap replaces this when the blog lands. */
    body: trimmed(4000),
  }),
});

export const blockSchema = z.discriminatedUnion('type', [
  heroBlock,
  specTableBlock,
  cardGridBlock,
  proseBlock,
]);

export const pageSchema = z.object({
  root: z
    .object({
      props: z.object({ title: trimmed(120).optional() }).optional(),
    })
    .optional(),
  content: z.array(blockSchema).max(40),
});

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block['type'];
export type PageContent = z.infer<typeof pageSchema>;

export const BLOCK_TYPES = ['Hero', 'SpecTable', 'CardGrid', 'Prose'] as const;

/**
 * Service and technology detail pages.
 *
 * More structured than a block list because these pages carry structured data:
 * the FAQ drives FAQPage schema and the related lists drive the internal link
 * graph. A free-form block list could not be read back into either.
 *
 * Every field maps to a line in the substance bar in docs/keyword-map.md. A
 * page missing `faq`, `notFor`, or `related` fails that bar, which is exactly
 * the distinction between a legitimate programmatic play and 45 thin pages.
 */
export const taxonomyPageSchema = z.object({
  slug: slugSchemaBase(),
  /** Owned query from the keyword map. Recorded so drift is visible in review. */
  primaryQuery: trimmed(120),
  title: trimmed(70),
  description: trimmed(180),
  h1: trimmed(120),
  intro: trimmed(1200),
  sections: z
    .array(z.object({ heading: trimmed(120), body: trimmed(2500) }))
    .max(8),
  deliverables: z.array(trimmed(140)).max(12).optional(),
  faq: z.array(z.object({ q: trimmed(200), a: trimmed(1200) })).min(3).max(6),
  notFor: z.object({ heading: trimmed(120), body: trimmed(1200) }),
  related: z.object({
    services: z.array(trimmed(64)).max(6),
    technologies: z.array(trimmed(64)).max(8),
  }),
});

export type TaxonomyPage = z.infer<typeof taxonomyPageSchema>;

function slugSchemaBase() {
  return z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
}

/** Slugs address files on disk, so keep them to a strict, traversal-proof set. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, 'Lowercase letters, digits and hyphens only');
