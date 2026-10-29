import { useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';
import { cn } from '../../lib/cn';
import type { TechStackProps } from './types';

type Item = TechStackProps['groups'][number]['items'][number];

/**
 * Technologies by category, one tab per group.
 *
 * Follows the WAI-ARIA tabs pattern: arrow keys move between tabs and select as
 * they go, Home and End jump to the ends, and only the selected tab sits in the
 * tab order. Every panel is in the prerendered HTML, so crawlers see the whole
 * stack; the unselected ones are hidden. A single group renders without tabs.
 */
export default function TechStackBlock({ tone, eyebrow, heading, lede, groups }: TechStackProps) {
  const [active, setActive] = useState(0);
  const [switched, setSwitched] = useState(false);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const shown = groups.filter((g) => g.items.length > 0);
  if (shown.length === 0) return null;

  const current = Math.min(active, shown.length - 1);
  const muted = tone === 'bone' ? 'text-muted' : 'text-silver';

  const select = (i: number) => {
    setActive(i);
    setSwitched(true);
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = shown.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    tabs.current[next]?.focus();
  };

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading || lede ? (
          <Reveal className="mx-auto mb-10 grid max-w-[46rem] justify-items-center gap-4 text-center">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? <h2 className="text-balance text-3xl font-extrabold md:text-4xl">{heading}</h2> : null}
            {lede ? <p className={cn('max-w-[60ch]', muted)}>{lede}</p> : null}
          </Reveal>
        ) : null}

        {shown.length > 1 ? (
          <div
            role="tablist"
            aria-label={heading || 'Technology categories'}
            className="mb-10 flex flex-wrap justify-center gap-x-7 gap-y-1"
          >
            {shown.map((group, i) => {
              const selected = i === current;
              return (
                <button
                  key={`${group.label}-${i}`}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${base}-tab${i}`}
                  aria-selected={selected}
                  aria-controls={`${base}-panel${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    'border-b-2 py-2 font-mono text-[11.5px] uppercase tracking-[0.12em] transition-colors',
                    selected
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : cn('border-transparent hover:text-[var(--accent)]', muted),
                  )}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {shown.map((group, i) => {
          const selected = i === current;
          const tabbed = shown.length > 1;
          return (
            <div
              key={`${group.label}-${i}`}
              id={`${base}-panel${i}`}
              role={tabbed ? 'tabpanel' : undefined}
              aria-labelledby={tabbed ? `${base}-tab${i}` : undefined}
              tabIndex={tabbed ? 0 : undefined}
              hidden={!selected}
              className={cn('mx-auto max-w-5xl', selected && switched && 'ds-fade-in')}
            >
              {/* Framed and raised as one panel. Thirty-six logos each casting
                  a shadow would be noise; the grid's own hairlines stay. */}
              <div
                className={cn(
                  'border border-[var(--accent-line)] p-2 shadow-[var(--shadow-panel)] sm:p-4',
                  tone === 'bone' ? 'bg-bone-2' : 'bg-ink-2',
                )}
              >
                <ul
                  aria-label={tabbed ? undefined : group.label}
                  className="ds-tech-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                >
                  {group.items.map((item, j) => (
                    <li key={`${item.name}-${j}`} className="ds-tech-tile relative">
                      <Tile item={item} />
                    </li>
                  ))}
                  {fillers(group.items.length).map((visibility, k) => (
                    <li key={`fill-${k}`} aria-hidden="true" className={cn('ds-tech-tile relative', visibility)} />
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </Container>
    </Section>
  );
}

function Tile({ item }: { item: Item }) {
  const className =
    'group flex h-full min-h-28 flex-col items-center justify-center gap-3 px-3 py-6 text-center sm:min-h-32';

  const body: ReactNode = (
    <>
      <Mark item={item} />
      <span className="text-balance text-[13.5px] font-semibold leading-snug transition-colors group-hover:text-[var(--accent)]">
        {item.name}
      </span>
    </>
  );

  if (!item.href) return <div className={className}>{body}</div>;

  return item.href.startsWith('/') ? (
    <Link to={item.href} className={className}>
      {body}
    </Link>
  ) : (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}

/** Uploaded logo, else one from the fixed set, else a lettermark. Decorative: the name is beside it. */
function Mark({ item }: { item: Item }) {
  const lift = 'transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none';

  if (item.image) {
    return (
      <img
        src={item.image}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        className={cn('size-10 object-contain', lift)}
      />
    );
  }

  if (item.icon) {
    return (
      <span
        aria-hidden="true"
        className={cn('ds-tech-icon block size-9 text-[var(--accent)]', lift)}
        style={{ '--icon': `url(/tech/${item.icon}.svg)` } as CSSProperties}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn('grid h-9 min-w-9 place-items-center font-display text-xl font-extrabold tracking-tight text-[var(--accent)]', lift)}
    >
      {lettermark(item.name)}
    </span>
  );
}

/**
 * Empty cells that complete the last row, so the hairlines run the full width
 * instead of stopping under a lone tile. How many depends on the column count,
 * so each one is shown only at the breakpoints that need it. They come after
 * every real tile, which keeps the grid's nth-child rules counting correctly.
 */
function fillers(count: number): string[] {
  const need = (cols: number) => (cols - (count % cols)) % cols;
  const [base, sm, md, lg] = [need(2), need(3), need(4), need(6)];
  return Array.from({ length: Math.max(base, sm, md, lg) }, (_, k) =>
    cn(
      k < base ? 'block' : 'hidden',
      k < sm ? 'sm:block' : 'sm:hidden',
      k < md ? 'md:block' : 'md:hidden',
      k < lg ? 'lg:block' : 'lg:hidden',
    ),
  );
}

/** "AWS" stays AWS, "C#" stays C#, "Azure" is Az, "Google Cloud" is GC. */
function lettermark(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  const word = words[0] ?? '';
  return word.length <= 4 ? word : word.slice(0, 2);
}
