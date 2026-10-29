import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type Tone = 'ink' | 'ink-soft' | 'bone' | 'bone-soft' | 'sand';

/**
 * A full-width band.
 *
 * Sets --accent for everything inside it. Gold is 9.22:1 on ink but only
 * 1.81:1 on bone, so a bone band swaps in gold-deep (5.33:1). Components read
 * --accent rather than naming a colour, which means the contrast rule holds by
 * construction - you cannot place unreadable gold type on a light band.
 *
 * Accent fills need the same treatment. --on-accent is the text colour on an
 * --accent fill, and --accent-hover the fill a solid button lifts to. Ink on
 * gold-deep is only 3.14:1, so a bone band puts bone on it instead (5.33:1)
 * and hovers to ink (16.73:1) - gold-lift under bone text would be 1.50:1.
 *
 * The other tones are small steps from these two, not new palettes: each one
 * takes its family's accent rules and only moves the band (--band) and the
 * cards raised on it (--surface). Measured on band / surface:
 *   ink-soft   dark: gold 7.10 / 6.31, silver-dim 5.22 / 4.64
 *              light: gold 5.11 / 5.62, silver-dim 5.27 / 5.79
 *   bone-soft  gold-deep 5.64 / 6.03, muted 7.46 / 7.98
 *   sand       gold-deep 4.83 / 5.64, muted 6.39 / 7.46
 */
const DARK_ACCENT = {
  '--accent': 'var(--color-gold)',
  '--accent-line': 'color-mix(in srgb, var(--color-gold) 20%, transparent)',
  '--accent-hover': 'var(--color-gold-lift)',
  '--on-accent': 'var(--color-ink)',
};

const LIGHT_ACCENT = {
  '--accent': 'var(--color-gold-deep)',
  '--accent-line': 'color-mix(in srgb, var(--color-ink) 12%, transparent)',
  '--accent-hover': 'var(--color-ink)',
  '--on-accent': 'var(--color-bone)',
};

// tone-bone keeps a light band's original palette under the light theme.
const TONES: Record<Tone, { className: string; light: boolean; style: CSSProperties }> = {
  ink: {
    className: 'tone-ink bg-ink text-bone',
    light: false,
    style: { ...DARK_ACCENT, '--band': 'var(--color-ink)', '--surface': 'var(--color-ink-2)' } as CSSProperties,
  },
  'ink-soft': {
    className: 'tone-ink bg-ink-2 text-bone',
    light: false,
    style: { ...DARK_ACCENT, '--band': 'var(--color-ink-2)', '--surface': 'var(--surface-raised)' } as CSSProperties,
  },
  bone: {
    className: 'tone-bone bg-bone text-ink',
    light: true,
    style: { ...LIGHT_ACCENT, '--band': 'var(--color-bone)', '--surface': 'var(--color-bone-2)' } as CSSProperties,
  },
  'bone-soft': {
    className: 'tone-bone bg-bone-2 text-ink',
    light: true,
    style: { ...LIGHT_ACCENT, '--band': 'var(--color-bone-2)', '--surface': '#fff' } as CSSProperties,
  },
  sand: {
    className: 'tone-bone bg-sand text-ink',
    light: true,
    style: { ...LIGHT_ACCENT, '--band': 'var(--color-sand)', '--surface': 'var(--color-bone-2)' } as CSSProperties,
  },
};

/** True for the cream family, which takes dark text and gold-deep. */
export const isLightTone = (tone: Tone) => TONES[tone].light;

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
