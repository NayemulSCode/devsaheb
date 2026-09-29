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

/**
 * Every block carries a stable id.
 *
 * Puck uses props.id as the dnd-kit draggable identifier. A block without one
 * cannot be picked up at all - the editor throws "Cannot start a drag operation
 * without a drag source" and the inspector renders no fields. Required rather
 * than optional, because an optional id produces a page that looks correct on
 * the public site and is silently uneditable, which is the worst of both.
 */
const blockId = z.string().trim().min(1).max(64);

/** Image source. Root-relative (/media/...) or https - never data: or javascript:. */
const imageSrc = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^\/(?!\/)/.test(v) || /^https:\/\//i.test(v), {
    message: 'Must be a root-relative path such as /media/photo.jpg, or an https URL',
  });

/**
 * List entries are objects, not bare strings.
 *
 * Puck's array field always writes objects, so a string[] here round-tripped as
 * [{ item: '...' }] and failed validation on save - the field looked editable
 * and silently could not be saved. Objects also leave room for a per-entry
 * field later without a second migration.
 */
const textItem = z.object({ text: trimmed(120) });

/**
 * An emptied field means "not set", not "invalid".
 *
 * Clearing a link in the editor leaves '', and Puck's defaults start there.
 * .optional() permits undefined and nothing else, so a Hero dragged in with its
 * two link fields untouched was rejected the instant it was published - with an
 * error naming a field the editor never asked anyone to fill in.
 *
 * Normalising here rather than in the save path means the rule holds for
 * hand-edited files and the admin alike.
 */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema.optional());

const heroBlock = z.object({
  type: z.literal('Hero'),
  props: z.object({
    id: blockId,
    eyebrow: trimmed(60),
    title: trimmed(200),
    /** Rendered in the accent colour inside the title. */
    highlight: trimmed(60).optional(),
    lede: trimmed(600).optional(),
    primaryLabel: trimmed(40).optional(),
    primaryHref: optional(href),
    secondaryLabel: trimmed(40).optional(),
    secondaryHref: optional(href),
  }),
});

const specTableBlock = z.object({
  type: z.literal('SpecTable'),
  props: z.object({
    id: blockId,
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
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    lede: trimmed(400).optional(),
    cards: z
      .array(
        z.object({
          index: trimmed(8).optional(),
          title: trimmed(80),
          items: z.array(textItem).max(12).optional(),
          body: trimmed(400).optional(),
        }),
      )
      .max(12),
  }),
});

/**
 * Rich text, stored as a document tree rather than HTML.
 *
 * The editor is Tiptap, whose native format this is. Storing its JSON instead
 * of its HTML output is the whole security argument: the renderer walks these
 * nodes into React elements, so there is no dangerouslySetInnerHTML anywhere
 * and no parse step that could be tricked. A `<script>` cannot be expressed in
 * this shape at all - it is not one of the node types.
 *
 * zod strips unknown keys, so an attribute nobody asked for is dropped rather
 * than carried through to the page.
 */
const ALIGN = z.enum(['left', 'center', 'right', 'justify']);

const RICH_NODES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'horizontalRule',
  'hardBreak',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
  'text',
] as const;

/** Link hrefs go through the same check as every other link on the site. */
const richMark = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('code') }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({
      href,
      target: z.string().max(20).nullish(),
      rel: z.string().max(80).nullish(),
    }),
  }),
]);

const richAttrs = z.object({
  // h1 belongs to the page, not to a paragraph of copy, so the editor offers
  // only h2 and h3 and the schema refuses anything else.
  level: z.union([z.literal(2), z.literal(3)]).nullish(),
  textAlign: ALIGN.nullish(),
  start: z.number().int().min(1).max(999).nullish(),
  colspan: z.number().int().min(1).max(20).nullish(),
  rowspan: z.number().int().min(1).max(20).nullish(),
  colwidth: z.array(z.number()).max(20).nullish(),
});

export type RichNode = {
  type: (typeof RICH_NODES)[number];
  text?: string | undefined;
  marks?: z.infer<typeof richMark>[] | undefined;
  attrs?: z.infer<typeof richAttrs> | undefined;
  content?: RichNode[] | undefined;
};

const richNode: z.ZodType<RichNode> = z.lazy(() =>
  z.object({
    type: z.enum(RICH_NODES),
    text: z.string().max(10000).optional(),
    marks: z.array(richMark).max(8).optional(),
    attrs: richAttrs.optional(),
    content: z.array(richNode).max(400).optional(),
  }),
);

const richDoc = z.object({
  type: z.literal('doc'),
  content: z.array(richNode).max(400).default([]),
});

const richTextBlock = z.object({
  type: z.literal('RichText'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    doc: richDoc,
  }),
});

/** Headline figures. Six is the most that stays readable in one band. */
const statsBlock = z.object({
  type: z.literal('Stats'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    stats: z
      .array(
        z.object({
          value: trimmed(20),
          label: trimmed(80),
          /** How it was measured. A number without one is a claim, not a fact. */
          note: trimmed(120).optional(),
        }),
      )
      .max(6),
  }),
});

/** An ordered process. Renders <ol>, because here the order carries meaning. */
const stepsBlock = z.object({
  type: z.literal('Steps'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    lede: trimmed(400).optional(),
    steps: z.array(z.object({ title: trimmed(80), body: trimmed(400).optional() })).max(8),
  }),
});

/** Q&A. Also the source for FAQPage structured data on block pages. */
const faqBlock = z.object({
  type: z.literal('Faq'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    items: z.array(z.object({ q: trimmed(200), a: trimmed(1200) })).max(20),
  }),
});

const quoteBlock = z.object({
  type: z.literal('Quote'),
  props: z.object({
    id: blockId,
    tone,
    quote: trimmed(600),
    attribution: trimmed(80).optional(),
    role: trimmed(120).optional(),
  }),
});

/** Closing call to action. Separate from Hero so it can sit as its own band. */
const ctaBlock = z.object({
  type: z.literal('Cta'),
  props: z.object({
    id: blockId,
    tone,
    heading: trimmed(200),
    lede: trimmed(400).optional(),
    primaryLabel: trimmed(40).optional(),
    primaryHref: optional(href),
    secondaryLabel: trimmed(40).optional(),
    secondaryHref: optional(href),
  }),
});

const teamGridBlock = z.object({
  type: z.literal('TeamGrid'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    lede: trimmed(400).optional(),
    people: z
      .array(
        z.object({
          name: trimmed(80),
          role: trimmed(100),
          focus: trimmed(200).optional(),
          image: optional(imageSrc),
        }),
      )
      .max(24),
  }),
});

/** Image beside text. `side` is which side the image takes at desktop width. */
const mediaTextBlock = z.object({
  type: z.literal('MediaText'),
  props: z.object({
    id: blockId,
    tone,
    side: z.enum(['left', 'right']),
    image: imageSrc,
    /** Empty means decorative, and the image is hidden from assistive tech. */
    imageAlt: trimmed(200),
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    body: trimmed(2000),
    primaryLabel: trimmed(40).optional(),
    primaryHref: optional(href),
  }),
});

const logoWallBlock = z.object({
  type: z.literal('LogoWall'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    logos: z
      .array(z.object({ name: trimmed(80), image: optional(imageSrc), href: optional(href) }))
      .max(24),
  }),
});

/** What a package includes and, just as usefully, what it does not. */
const checklistBlock = z.object({
  type: z.literal('Checklist'),
  props: z.object({
    id: blockId,
    tone,
    eyebrow: trimmed(60).optional(),
    heading: trimmed(200).optional(),
    includedTitle: trimmed(80),
    included: z.array(textItem).max(16),
    excludedTitle: trimmed(80).optional(),
    excluded: z.array(textItem).max(16).optional(),
  }),
});

export const blockSchema = z.discriminatedUnion('type', [
  heroBlock,
  specTableBlock,
  cardGridBlock,
  richTextBlock,
  statsBlock,
  stepsBlock,
  faqBlock,
  quoteBlock,
  ctaBlock,
  teamGridBlock,
  mediaTextBlock,
  logoWallBlock,
  checklistBlock,
]);

/**
 * Ids must also be unique within a page.
 *
 * Two blocks sharing one id makes the editor move or delete the wrong one,
 * because dnd-kit keys by that value. Caught here so a hand-edited file fails
 * the build rather than corrupting a page on the first drag.
 */
export const pageSchema = z
  .object({
    root: z
      .object({
        props: z.object({ title: trimmed(120).optional() }).optional(),
      })
      .optional(),
    content: z.array(blockSchema).max(40),
  })
  .superRefine((page, ctx) => {
    const seen = new Set<string>();
    page.content.forEach((block, i) => {
      const value = block.props.id;
      if (seen.has(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['content', i, 'props', 'id'],
          message: `Duplicate block id "${value}" - ids must be unique within a page`,
        });
      }
      seen.add(value);
    });
  });

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block['type'];
export type PageContent = z.infer<typeof pageSchema>;

export const BLOCK_TYPES = [
  'Hero',
  'SpecTable',
  'CardGrid',
  'RichText',
  'Stats',
  'Steps',
  'Faq',
  'Quote',
  'Cta',
  'TeamGrid',
  'MediaText',
  'LogoWall',
  'Checklist',
] as const;

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
  /**
   * Substance bar item 2: a code example specific to *this* page.
   *
   * On a technology page it does more work than any amount of prose - a buyer
   * searching "hire react developers" is evaluating whether you write code they
   * would accept in review. Rendered as text, never parsed, so it carries no
   * more risk than any other stored string.
   */
  codeExample: z
    .object({
      language: trimmed(20),
      filename: trimmed(80).optional(),
      /**
       * Roughly 90 words. The caption is what makes the snippet evidence
       * rather than decoration - it has to say what the code demonstrates and
       * why that matters, which a one-line label cannot do.
       */
      caption: trimmed(600),
      code: trimmed(4000),
    })
    .optional(),
  /**
   * Substance bar item 4: named engineers who actually work in this.
   *
   * The bar has always asked for this and there was nowhere to put it, so no
   * page could satisfy its own standard. Optional in the schema because a page
   * can be drafted before the names are decided - but a page without them is
   * not finished, whatever the renderer does.
   */
  engineers: z
    .array(z.object({ name: trimmed(80), role: trimmed(100), focus: trimmed(200).optional() }))
    .max(6)
    .optional(),
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
