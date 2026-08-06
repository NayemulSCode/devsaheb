import type { Block } from '../../content/schema';

/**
 * Block component props, derived from the zod schema rather than restated.
 *
 * Declaring them separately drifts: the schema gains a field, the component
 * quietly ignores it, and nothing fails until an editor wonders why their
 * change did nothing. Deriving means a schema edit is a compile error here.
 */
export type PropsOf<T extends Block['type']> = Extract<Block, { type: T }>['props'];

export type HeroProps = PropsOf<'Hero'>;
export type SpecTableProps = PropsOf<'SpecTable'>;
export type CardGridProps = PropsOf<'CardGrid'>;
export type ProseProps = PropsOf<'Prose'>;
