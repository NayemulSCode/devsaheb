import type { Config } from '@measured/puck';
import HeroBlock from '../components/blocks/HeroBlock';
import SpecTableBlock from '../components/blocks/SpecTableBlock';
import CardGridBlock from '../components/blocks/CardGridBlock';
import ProseBlock from '../components/blocks/ProseBlock';
import type {
  HeroProps,
  SpecTableProps,
  CardGridProps,
  ProseProps,
} from '../components/blocks/types';

/**
 * Puck config for block-shaped pages.
 *
 * Every component renders through the exact same block component the public
 * site uses, so what the editor previews is what visitors get. The field
 * definitions mirror src/content/schema.ts; the server validates every save
 * against that schema regardless, so a mismatch is rejected rather than
 * written.
 */
export const puckConfig: Config = {
  components: {
    Hero: {
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
      defaultProps: {
        eyebrow: 'software engineering',
        title: 'Built to a standard, not to a',
        highlight: 'deadline.',
        lede: '',
        primaryLabel: 'See our work',
        primaryHref: '/work',
        secondaryLabel: '',
        secondaryHref: '',
      },
      render: (props) => <HeroBlock {...(props as unknown as HeroProps)} />,
    },

    SpecTable: {
      fields: {
        caption: { type: 'text', label: 'Caption' },
        rows: {
          type: 'array',
          label: 'Rows',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
            tag: { type: 'text' },
          },
        },
      },
      defaultProps: {
        caption: 'Definition of done',
        rows: [{ label: 'Largest Contentful Paint', value: '< 2.0 s', tag: 'Enforced' }],
      },
      render: (props) => <SpecTableBlock {...(props as unknown as SpecTableProps)} />,
    },

    CardGrid: {
      fields: {
        tone: {
          type: 'select',
          label: 'Band',
          options: [
            { label: 'Ink (dark)', value: 'ink' },
            { label: 'Bone (light)', value: 'bone' },
          ],
        },
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
            items: { type: 'array', label: 'List items', arrayFields: { item: { type: 'text' } } },
          },
        },
      },
      defaultProps: { tone: 'bone', eyebrow: '', heading: '', lede: '', cards: [] },
      render: (props) => <CardGridBlock {...(props as unknown as CardGridProps)} />,
    },

    Prose: {
      fields: {
        tone: {
          type: 'select',
          label: 'Band',
          options: [
            { label: 'Ink (dark)', value: 'ink' },
            { label: 'Bone (light)', value: 'bone' },
          ],
        },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body (blank line between paragraphs)' },
      },
      defaultProps: { tone: 'ink', eyebrow: '', heading: '', body: '' },
      render: (props) => <ProseBlock {...(props as unknown as ProseProps)} />,
    },
  },
};
