import type { Config } from '@measured/puck';
import HeroBlock from '../components/blocks/HeroBlock';
import SpecTableBlock from '../components/blocks/SpecTableBlock';
import CardGridBlock from '../components/blocks/CardGridBlock';
import RichTextBlock from '../components/blocks/RichTextBlock';
import RichTextField, { type Doc } from './RichTextField';
import StatsBlock from '../components/blocks/StatsBlock';
import StepsBlock from '../components/blocks/StepsBlock';
import FaqBlock from '../components/blocks/FaqBlock';
import QuoteBlock from '../components/blocks/QuoteBlock';
import CtaBlock from '../components/blocks/CtaBlock';
import TeamGridBlock from '../components/blocks/TeamGridBlock';
import MediaTextBlock from '../components/blocks/MediaTextBlock';
import LogoWallBlock from '../components/blocks/LogoWallBlock';
import ChecklistBlock from '../components/blocks/ChecklistBlock';
import HeroShowcaseBlock from '../components/blocks/HeroShowcaseBlock';
import MarqueeBlock from '../components/blocks/MarqueeBlock';
import ServiceExplorerBlock from '../components/blocks/ServiceExplorerBlock';
import IndustryGridBlock from '../components/blocks/IndustryGridBlock';
import TechStackBlock from '../components/blocks/TechStackBlock';
import CaseStudiesBlock from '../components/blocks/CaseStudiesBlock';
import { INDUSTRY_ICONS, INDUSTRY_ICON_LABELS } from '../content/industry-icons';
import { TECH_ICONS, TECH_ICON_LABELS } from '../content/tech-icons';
import MediaField from './MediaField';
import { BLOCK_DEFAULTS, ARRAY_ITEM_DEFAULTS, TECH_ITEM_DEFAULT } from '../content/block-defaults';
import type {
  HeroProps,
  SpecTableProps,
  CardGridProps,
  RichTextProps,
  StatsProps,
  StepsProps,
  FaqProps,
  QuoteProps,
  CtaProps,
  TeamGridProps,
  MediaTextProps,
  LogoWallProps,
  ChecklistProps,
  HeroShowcaseProps,
  MarqueeProps,
  ServiceExplorerProps,
  IndustryGridProps,
  TechStackProps,
  CaseStudiesProps,
} from '../components/blocks/types';

/**
 * Puck config for block-shaped pages.
 *
 * Every component renders through the exact same block component the public
 * site uses, so what the editor previews is what visitors get. The field
 * definitions mirror src/content/schema.ts; the server validates every save
 * against that schema regardless, so a mismatch is rejected rather than
 * written.
 *
 * Two rules keep the two halves honest, both learned the hard way:
 *
 *   1. Every defaultProps must satisfy the schema's required fields. Puck
 *      inserts defaultProps verbatim, so a missing required value produces a
 *      block that cannot be saved the moment it is added.
 *   2. An array field always writes objects. A schema expecting string[] gets
 *      [{ item: '...' }] and rejects the save with no visible cause, which is
 *      why list entries are { text } objects on both sides.
 *
 * Puck supplies props.id itself on insert, so it is not declared as a field.
 */

const toneField = {
  type: 'select' as const,
  label: 'Band',
  options: [
    { label: 'Ink', value: 'ink' },
    { label: 'Ink · lifted', value: 'ink-soft' },
    { label: 'Bone (cream)', value: 'bone' },
    { label: 'Bone · lighter', value: 'bone-soft' },
    { label: 'Sand (warm cream)', value: 'sand' },
  ],
};

/** Shared by every list-of-strings field; see rule 2 above. */
const textItems = (label: string) => ({
  type: 'array' as const,
  label,
  arrayFields: { text: { type: 'text' as const, label: 'Text' } },
  defaultItemProps: { text: '' },
  getItemSummary: (item: { text?: string }) => item?.text || 'Item',
});

/**
 * Image field: upload, or pick something already uploaded.
 *
 * Stores the served path, so the value in the JSON is exactly what ends up in
 * src and exactly what the schema validates. A hand-typed https URL still
 * works - this is an easier way to fill the field, not the only one.
 */
const imageField = (label: string) => ({
  type: 'custom' as const,
  label,
  render: ({
    value,
    onChange,
    readOnly,
  }: {
    value: string;
    onChange: (next: string) => void;
    readOnly?: boolean;
  }) => <MediaField value={value ?? ''} onChange={onChange} readOnly={readOnly} />,
});

export const puckConfig: Config = {
  categories: {
    layout: {
      title: 'Page structure',
      components: ['Hero', 'HeroShowcase', 'RichText', 'MediaText', 'Cta', 'Marquee'],
    },
    proof: { title: 'Proof', components: ['Stats', 'SpecTable', 'Quote', 'LogoWall', 'CaseStudies'] },
    detail: {
      title: 'Detail',
      components: ['CardGrid', 'ServiceExplorer', 'IndustryGrid', 'TechStack', 'Steps', 'Checklist', 'Faq', 'TeamGrid'],
    },
  },

  components: {
    Hero: {
      label: 'Hero',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        highlight: { type: 'text', label: 'Highlighted word' },
        lede: { type: 'textarea', label: 'Lede' },
        primaryLabel: { type: 'text', label: 'Primary button' },
        primaryHref: { type: 'text', label: 'Primary link' },
        secondaryLabel: { type: 'text', label: 'Secondary button' },
        secondaryHref: { type: 'text', label: 'Secondary link' },
      },
      defaultProps: BLOCK_DEFAULTS.Hero,
      render: (props) => <HeroBlock {...(props as unknown as HeroProps)} />,
    },

    RichText: {
      label: 'Body content',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        doc: {
          type: 'custom',
          label: 'Body content',
          // The editor works in Tiptap's JSONContent shape and the schema
          // describes the same tree more strictly. They are converted here,
          // the one boundary between them; the save is validated regardless.
          render: ({ value, onChange, readOnly }: {
            value: RichTextProps['doc'];
            onChange: (next: RichTextProps['doc']) => void;
            readOnly?: boolean;
          }) => (
            <RichTextField
              value={value as unknown as Doc}
              onChange={(next) => onChange(next as unknown as RichTextProps['doc'])}
              readOnly={readOnly}
            />
          ),
        },
      },
      defaultProps: BLOCK_DEFAULTS.RichText,
      render: (props) => <RichTextBlock {...(props as unknown as RichTextProps)} />,
    },

    MediaText: {
      label: 'Image + text',
      fields: {
        tone: toneField,
        side: {
          type: 'select',
          label: 'Image side (desktop)',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        image: imageField('Image'),
        imageAlt: { type: 'text', label: 'Alt text (leave blank if decorative)' },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body (blank line between paragraphs)' },
        primaryLabel: { type: 'text', label: 'Button label' },
        primaryHref: { type: 'text', label: 'Button link' },
      },
      defaultProps: BLOCK_DEFAULTS.MediaText,
      render: (props) => <MediaTextBlock {...(props as unknown as MediaTextProps)} />,
    },

    Cta: {
      label: 'Call to action',
      fields: {
        tone: toneField,
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        primaryLabel: { type: 'text', label: 'Primary button' },
        primaryHref: { type: 'text', label: 'Primary link' },
        secondaryLabel: { type: 'text', label: 'Secondary button' },
        secondaryHref: { type: 'text', label: 'Secondary link' },
      },
      defaultProps: BLOCK_DEFAULTS.Cta,
      render: (props) => <CtaBlock {...(props as unknown as CtaProps)} />,
    },

    Stats: {
      label: 'Numbers',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        stats: {
          type: 'array',
          label: 'Figures',
          arrayFields: {
            value: { type: 'text', label: 'Figure' },
            label: { type: 'text', label: 'Label' },
            note: { type: 'text', label: 'How it was measured' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['Stats.stats'],
          getItemSummary: (item: { value?: string }) => item?.value || 'Figure',
        },
      },
      defaultProps: BLOCK_DEFAULTS.Stats,
      render: (props) => <StatsBlock {...(props as unknown as StatsProps)} />,
    },

    SpecTable: {
      label: 'Spec table',
      fields: {
        caption: { type: 'text', label: 'Caption' },
        rows: {
          type: 'array',
          label: 'Rows',
          arrayFields: {
            label: { type: 'text', label: 'Label' },
            value: { type: 'text', label: 'Value' },
            tag: { type: 'text', label: 'Tag' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['SpecTable.rows'],
          getItemSummary: (item: { label?: string }) => item?.label || 'Row',
        },
      },
      defaultProps: BLOCK_DEFAULTS.SpecTable,
      render: (props) => <SpecTableBlock {...(props as unknown as SpecTableProps)} />,
    },

    Quote: {
      label: 'Quote',
      fields: {
        tone: toneField,
        quote: { type: 'textarea', label: 'Quote' },
        attribution: { type: 'text', label: 'Who said it' },
        role: { type: 'text', label: 'Role and company' },
      },
      defaultProps: BLOCK_DEFAULTS.Quote,
      render: (props) => <QuoteBlock {...(props as unknown as QuoteProps)} />,
    },

    LogoWall: {
      label: 'Logo wall',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        logos: {
          type: 'array',
          label: 'Logos',
          arrayFields: {
            name: { type: 'text', label: 'Name' },
            image: imageField('Logo (blank shows the name)'),
            href: { type: 'text', label: 'Link' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['LogoWall.logos'],
          getItemSummary: (item: { name?: string }) => item?.name || 'Logo',
        },
      },
      defaultProps: BLOCK_DEFAULTS.LogoWall,
      render: (props) => <LogoWallBlock {...(props as unknown as LogoWallProps)} />,
    },

    CardGrid: {
      label: 'Card grid',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        cards: {
          type: 'array',
          label: 'Cards',
          arrayFields: {
            index: { type: 'text', label: 'Index' },
            title: { type: 'text', label: 'Title' },
            body: { type: 'textarea', label: 'Body' },
            items: textItems('List items'),
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['CardGrid.cards'],
          getItemSummary: (item: { title?: string }) => item?.title || 'Card',
        },
      },
      defaultProps: BLOCK_DEFAULTS.CardGrid,
      render: (props) => <CardGridBlock {...(props as unknown as CardGridProps)} />,
    },

    Steps: {
      label: 'Process steps',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        steps: {
          type: 'array',
          label: 'Steps (numbered automatically)',
          arrayFields: {
            title: { type: 'text', label: 'Title' },
            body: { type: 'textarea', label: 'Body' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['Steps.steps'],
          getItemSummary: (item: { title?: string }) => item?.title || 'Step',
        },
      },
      defaultProps: BLOCK_DEFAULTS.Steps,
      render: (props) => <StepsBlock {...(props as unknown as StepsProps)} />,
    },

    Checklist: {
      label: 'Included / not included',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        includedTitle: { type: 'text', label: 'Included heading' },
        included: textItems('Included'),
        excludedTitle: { type: 'text', label: 'Not included heading' },
        excluded: textItems('Not included'),
      },
      defaultProps: BLOCK_DEFAULTS.Checklist,
      render: (props) => <ChecklistBlock {...(props as unknown as ChecklistProps)} />,
    },

    Faq: {
      label: 'FAQ',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        items: {
          type: 'array',
          label: 'Questions',
          arrayFields: {
            q: { type: 'text', label: 'Question' },
            a: { type: 'textarea', label: 'Answer' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['Faq.items'],
          getItemSummary: (item: { q?: string }) => item?.q || 'Question',
        },
      },
      defaultProps: BLOCK_DEFAULTS.Faq,
      render: (props) => <FaqBlock {...(props as unknown as FaqProps)} />,
    },

    TeamGrid: {
      label: 'People',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        people: {
          type: 'array',
          label: 'People',
          arrayFields: {
            name: { type: 'text', label: 'Name' },
            role: { type: 'text', label: 'Role' },
            focus: { type: 'textarea', label: 'What they own' },
            image: imageField('Photo'),
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['TeamGrid.people'],
          getItemSummary: (item: { name?: string }) => item?.name || 'Person',
        },
      },
      defaultProps: BLOCK_DEFAULTS.TeamGrid,
      render: (props) => <TeamGridBlock {...(props as unknown as TeamGridProps)} />,
    },

    HeroShowcase: {
      label: 'Hero with team',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        highlight: { type: 'text', label: 'Highlighted words' },
        lede: { type: 'textarea', label: 'Lede' },
        primaryLabel: { type: 'text', label: 'Primary button' },
        primaryHref: { type: 'text', label: 'Primary link' },
        secondaryLabel: { type: 'text', label: 'Secondary button' },
        secondaryHref: { type: 'text', label: 'Secondary link' },
        people: {
          type: 'array',
          label: 'People (four show at once; the rest rotate in)',
          max: 12,
          arrayFields: {
            name: { type: 'text', label: 'Name' },
            role: { type: 'text', label: 'Role' },
            image: imageField('Photo (blank shows initials)'),
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['HeroShowcase.people'],
          getItemSummary: (item: { name?: string }) => item?.name || 'Person',
        },
        badges: {
          type: 'array',
          label: 'Badges (up to three)',
          max: 3,
          arrayFields: {
            label: { type: 'text', label: 'Small label' },
            value: { type: 'text', label: 'Value (short, e.g. 80%)' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['HeroShowcase.badges'],
          getItemSummary: (item: { value?: string }) => item?.value || 'Badge',
        },
        rotateSeconds: { type: 'number', label: 'Seconds between rotations (0 holds still)', min: 0, max: 60 },
      },
      defaultProps: BLOCK_DEFAULTS.HeroShowcase,
      render: (props) => <HeroShowcaseBlock {...(props as unknown as HeroShowcaseProps)} />,
    },

    Marquee: {
      label: 'Ticker',
      fields: {
        tone: toneField,
        label: { type: 'text', label: 'Name read out by screen readers' },
        speed: {
          type: 'select',
          label: 'Speed',
          options: [
            { label: 'Slow', value: 'slow' },
            { label: 'Normal', value: 'normal' },
            { label: 'Fast', value: 'fast' },
          ],
        },
        direction: {
          type: 'select',
          label: 'Direction',
          options: [
            { label: 'Right to left', value: 'left' },
            { label: 'Left to right', value: 'right' },
          ],
        },
        items: {
          type: 'array',
          label: 'Items',
          max: 30,
          arrayFields: {
            text: { type: 'text', label: 'Text' },
            href: { type: 'text', label: 'Link (optional)' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['Marquee.items'],
          getItemSummary: (item: { text?: string }) => item?.text || 'Item',
        },
      },
      defaultProps: BLOCK_DEFAULTS.Marquee,
      render: (props) => <MarqueeBlock {...(props as unknown as MarqueeProps)} />,
    },

    ServiceExplorer: {
      label: 'Service explorer',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        cardLabel: { type: 'text', label: 'Label above the card list' },
        items: {
          type: 'array',
          label: 'Services',
          max: 10,
          arrayFields: {
            title: { type: 'text', label: 'Title' },
            description: { type: 'textarea', label: 'Description' },
            subItems: textItems('Card list'),
            image: imageField('Card image (blank shows the number)'),
            imageAlt: { type: 'text', label: 'Image alt text (blank if decorative)' },
            href: { type: 'text', label: 'Link (optional)' },
            linkLabel: { type: 'text', label: 'Link label' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['ServiceExplorer.items'],
          getItemSummary: (item: { title?: string }) => item?.title || 'Service',
        },
      },
      defaultProps: BLOCK_DEFAULTS.ServiceExplorer,
      render: (props) => <ServiceExplorerBlock {...(props as unknown as ServiceExplorerProps)} />,
    },

    IndustryGrid: {
      label: 'Industry grid',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        industries: {
          type: 'array',
          label: 'Industries',
          max: 36,
          arrayFields: {
            label: { type: 'text', label: 'Name' },
            icon: {
              type: 'select',
              label: 'Icon',
              options: INDUSTRY_ICONS.map((value) => ({ label: INDUSTRY_ICON_LABELS[value], value })),
            },
            href: { type: 'text', label: 'Link (optional)' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['IndustryGrid.industries'],
          getItemSummary: (item: { label?: string }) => item?.label || 'Industry',
        },
      },
      defaultProps: BLOCK_DEFAULTS.IndustryGrid,
      render: (props) => <IndustryGridBlock {...(props as unknown as IndustryGridProps)} />,
    },

    TechStack: {
      label: 'Technology stack',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        groups: {
          type: 'array',
          label: 'Tabs (one per group)',
          max: 8,
          arrayFields: {
            label: { type: 'text', label: 'Tab name' },
            items: {
              type: 'array',
              label: 'Technologies',
              max: 36,
              arrayFields: {
                name: { type: 'text', label: 'Name' },
                icon: {
                  type: 'select',
                  label: 'Logo',
                  options: [
                    { label: 'None (show letters)', value: '' },
                    ...TECH_ICONS.map((value) => ({ label: TECH_ICON_LABELS[value], value })),
                  ],
                },
                image: imageField('Logo image (overrides the logo above)'),
                href: { type: 'text', label: 'Link (optional)' },
              },
              defaultItemProps: TECH_ITEM_DEFAULT,
              getItemSummary: (item: { name?: string }) => item?.name || 'Technology',
            },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['TechStack.groups'],
          getItemSummary: (item: { label?: string }) => item?.label || 'Group',
        },
      },
      defaultProps: BLOCK_DEFAULTS.TechStack,
      render: (props) => <TechStackBlock {...(props as unknown as TechStackProps)} />,
    },

    CaseStudies: {
      label: 'Case studies',
      fields: {
        tone: toneField,
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        primaryLabel: { type: 'text', label: 'Button' },
        primaryHref: { type: 'text', label: 'Button link' },
        studies: {
          type: 'array',
          label: 'Projects',
          max: 12,
          arrayFields: {
            title: { type: 'text', label: 'Project name' },
            category: { type: 'text', label: 'Category (e.g. Fintech · Web app)' },
            summary: { type: 'textarea', label: 'One-line result' },
            image: imageField('Screenshot (blank shows the number)'),
            imageAlt: { type: 'text', label: 'Screenshot alt text (blank if decorative)' },
            href: { type: 'text', label: 'Link to the write-up (optional)' },
          },
          defaultItemProps: ARRAY_ITEM_DEFAULTS['CaseStudies.studies'],
          getItemSummary: (item: { title?: string }) => item?.title || 'Project',
        },
      },
      defaultProps: BLOCK_DEFAULTS.CaseStudies,
      render: (props) => <CaseStudiesBlock {...(props as unknown as CaseStudiesProps)} />,
    },
  },
};
