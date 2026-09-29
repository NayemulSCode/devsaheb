import type { Block, PageContent } from '../../content/schema';
import HeroBlock from './HeroBlock';
import SpecTableBlock from './SpecTableBlock';
import CardGridBlock from './CardGridBlock';
import RichTextBlock from './RichTextBlock';
import StatsBlock from './StatsBlock';
import StepsBlock from './StepsBlock';
import FaqBlock from './FaqBlock';
import QuoteBlock from './QuoteBlock';
import CtaBlock from './CtaBlock';
import TeamGridBlock from './TeamGridBlock';
import MediaTextBlock from './MediaTextBlock';
import LogoWallBlock from './LogoWallBlock';
import ChecklistBlock from './ChecklistBlock';

/**
 * Renders stored page content.
 *
 * This is the public renderer. It deliberately does not use Puck's <Render>:
 * walking the array ourselves is a few lines and keeps @measured/puck out of
 * every marketing page's bundle. The editor maps the same components into a
 * Puck config, so both sides stay in step.
 */
const REGISTRY = {
  Hero: HeroBlock,
  SpecTable: SpecTableBlock,
  CardGrid: CardGridBlock,
  RichText: RichTextBlock,
  Stats: StatsBlock,
  Steps: StepsBlock,
  Faq: FaqBlock,
  Quote: QuoteBlock,
  Cta: CtaBlock,
  TeamGrid: TeamGridBlock,
  MediaText: MediaTextBlock,
  LogoWall: LogoWallBlock,
  Checklist: ChecklistBlock,
} as const;

export default function Blocks({ data }: { data: PageContent }) {
  return (
    <>
      {data.content.map((block, i) => (
        <BlockRenderer key={block.props.id || `${block.type}-${i}`} block={block} />
      ))}
    </>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'Hero':
      return <HeroBlock {...block.props} />;
    case 'SpecTable':
      return <SpecTableBlock {...block.props} />;
    case 'CardGrid':
      return <CardGridBlock {...block.props} />;
    case 'RichText':
      return <RichTextBlock {...block.props} />;
    case 'Stats':
      return <StatsBlock {...block.props} />;
    case 'Steps':
      return <StepsBlock {...block.props} />;
    case 'Faq':
      return <FaqBlock {...block.props} />;
    case 'Quote':
      return <QuoteBlock {...block.props} />;
    case 'Cta':
      return <CtaBlock {...block.props} />;
    case 'TeamGrid':
      return <TeamGridBlock {...block.props} />;
    case 'MediaText':
      return <MediaTextBlock {...block.props} />;
    case 'LogoWall':
      return <LogoWallBlock {...block.props} />;
    case 'Checklist':
      return <ChecklistBlock {...block.props} />;
    default:
      // Unknown block types are skipped rather than thrown on: a page saved by
      // a newer build should degrade, not take the whole route down.
      return null;
  }
}

export { REGISTRY };
