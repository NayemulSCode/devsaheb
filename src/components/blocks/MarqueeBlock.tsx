import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import { cn } from '../../lib/cn';
import type { MarqueeProps } from './types';

/** Seconds each item spends crossing the band, so the loop scales with the list. */
const SECONDS_PER_ITEM = { slow: 6, normal: 4, fast: 2.5 } as const;

const TEXT = 'whitespace-nowrap font-display text-lg font-semibold tracking-tight md:text-xl';

/**
 * A ticker of names.
 *
 * WCAG 2.2.2 requires that motion which starts on its own and lasts over five
 * seconds can be paused. It pauses on hover and on keyboard focus, has its own
 * pause control, and does not move at all under reduced motion - where the list
 * wraps instead, since a clipped strip that never scrolls would hide most of it.
 *
 * The list renders twice so the loop is seamless. The copy is hidden from
 * assistive tech and its links leave the tab order, so the band reads and tabs
 * as a single list.
 */
export default function MarqueeBlock({ tone, label, speed, direction, items }: MarqueeProps) {
  const [paused, setPaused] = useState(false);
  if (items.length === 0) return null;

  const style = {
    '--marquee-duration': `${Math.max(12, items.length * SECONDS_PER_ITEM[speed])}s`,
  } as CSSProperties;

  return (
    <Section tone={tone} as="div" padded={false}>
      <div
        role="region"
        aria-label={label}
        data-paused={paused ? 'true' : undefined}
        data-direction={direction}
        style={style}
        className="ds-marquee relative border-y border-[var(--accent-line)]"
      >
        <div className="ds-marquee-viewport overflow-hidden py-6 md:py-7">
          <div className="ds-marquee-track flex w-max">
            <Items items={items} />
            <Items items={items} copy />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? 'Resume scrolling' : 'Pause scrolling'}
          className={cn(
            'ds-marquee-toggle absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center',
            'border border-[var(--accent-line)] text-[var(--accent)] transition-colors hover:border-[var(--accent)]',
            'bg-[var(--band)]',
          )}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
          </svg>
        </button>
      </div>
    </Section>
  );
}

function Items({ items, copy = false }: { items: MarqueeProps['items']; copy?: boolean }) {
  return (
    <ul
      className={cn('flex shrink-0 items-center', copy && 'ds-marquee-copy')}
      aria-hidden={copy || undefined}
    >
      {items.map((item, i) => (
        <li key={i} className="flex items-center">
          {item.href ? (
            <ItemLink href={item.href} focusable={!copy}>
              {item.text}
            </ItemLink>
          ) : (
            <span className={TEXT}>{item.text}</span>
          )}
          <span aria-hidden="true" className="mx-7 size-1.5 rotate-45 bg-[var(--accent)]" />
        </li>
      ))}
    </ul>
  );
}

function ItemLink({ href, focusable, children }: { href: string; focusable: boolean; children: ReactNode }) {
  const className = cn(TEXT, 'transition-colors hover:text-[var(--accent)] focus-visible:text-[var(--accent)]');
  const tabIndex = focusable ? undefined : -1;

  return href.startsWith('/') ? (
    <Link to={href} tabIndex={tabIndex} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} tabIndex={tabIndex} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
