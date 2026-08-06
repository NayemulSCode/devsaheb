import type { Block, PageContent } from '../../content/schema';
import HeroBlock from './HeroBlock';
import SpecTableBlock from './SpecTableBlock';
import CardGridBlock from './CardGridBlock';
import ProseBlock from './ProseBlock';

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
  Prose: ProseBlock,
} as const;

export default function Blocks({ data }: { data: PageContent }) {
  return (
    <>
      {data.content.map((block, i) => (
        <BlockRenderer key={block.props.id ?? `${block.type}-${i}`} block={block} />
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
    case 'Prose':
      return <ProseBlock {...block.props} />;
    default:
      // Unknown block types are skipped rather than thrown on: a page saved by
      // a newer build should degrade, not take the whole route down.
      return null;
  }
}

export { REGISTRY };
