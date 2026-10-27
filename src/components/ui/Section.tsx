import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type Tone = 'ink' | 'bone';

/**
 * A full-width band.
 *
 * Sets --accent for everything inside it. Gold is 9.22:1 on ink but only
 * 1.81:1 on bone, so a bone band swaps in gold-deep (5.33:1). Components read
 * --accent rather than naming a colour, which means the contrast rule holds by
 * construction - you cannot place unreadable gold type on a light band.
 */
const TONES: Record<Tone, { className: string; style: CSSProperties }> = {
  ink: {
    className: 'bg-ink text-bone',
    style: {
      '--accent': 'var(--color-gold)',
      '--accent-line': 'rgb(204 170 80 / 0.2)',
    } as CSSProperties,
  },
  bone: {
    className: 'bg-bone text-ink',
    style: {
      '--accent': 'var(--color-gold-deep)',
      '--accent-line': 'rgb(11 16 32 / 0.12)',
    } as CSSProperties,
  },
};

export default function Section({
  tone = 'ink',
  as: Tag = 'section',
  padded = true,
  className,
  children,
  ...rest
}: {
  tone?: Tone;
  as?: 'section' | 'div' | 'header' | 'footer' | 'main';
  /**
   * Off for bands that set their own height, such as a ticker. cn() joins
   * classes without resolving conflicts, so passing py-0 alongside the default
   * would leave the winner to stylesheet order.
   */
  padded?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  const { className: toneClass, style } = TONES[tone];
  return (
    <Tag
      style={style}
      className={cn(padded && 'py-18 md:py-32', toneClass, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
