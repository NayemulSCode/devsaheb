import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';
import { cn } from '../../lib/cn';
import type { ServiceExplorerProps } from './types';

type Item = ServiceExplorerProps['items'][number];
type Tone = ServiceExplorerProps['tone'];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A numbered list where choosing an item reveals its detail.
 *
 * Every item is a button with aria-expanded, so it works by keyboard and is
 * announced as expandable. The detail has two homes: inline under the item
 * below the lg breakpoint, and in the card on the right above it. Exactly one
 * is displayed at any width, so assistive tech never meets it twice.
 *
 * The first item starts open, which makes the prerendered HTML match the first
 * render and puts real content in front of crawlers.
 */
export default function ServiceExplorerBlock({
  tone,
  eyebrow,
  heading,
  cardLabel,
  items,
}: ServiceExplorerProps) {
  const [active, setActive] = useState(0);
  const base = useId();
  if (items.length === 0) return null;

  const current = Math.min(active, items.length - 1);
  const muted = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading ? (
          <Reveal className="mx-auto mb-12 grid max-w-[46rem] justify-items-center gap-4 text-center">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="text-balance text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
          </Reveal>
        ) : null}

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <ol className="border-l border-[var(--accent-line)]">
            {items.map((item, i) => {
              const open = i === current;
              return (
                <li key={`${item.title}-${i}`} className="border-b border-[var(--accent-line)] last:border-b-0">
                  <h3>
                    <button
                      type="button"
                      id={`${base}-t${i}`}
                      aria-expanded={open}
                      aria-controls={`${base}-p${i}`}
                      onClick={() => setActive(i)}
                      className="group flex w-full items-baseline gap-4 py-5 pl-6 pr-2 text-left"
                    >
                      <span
                        className={cn(
                          'font-mono text-[11px] tracking-[0.12em]',
                          open ? 'text-[var(--accent)]' : muted,
                        )}
                      >
                        {pad(i + 1)}
                      </span>
                      <span
                        className={cn(
                          'text-lg font-bold transition-colors md:text-xl',
                          open ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]',
                        )}
                      >
                        {item.title}
                      </span>
                    </button>
                  </h3>

                  <div
                    id={`${base}-p${i}`}
                    role="region"
                    aria-labelledby={`${base}-t${i}`}
                    hidden={!open}
                    className="pb-6 pl-6 pr-2"
                  >
                    {item.description ? (
                      <p className={cn('max-w-[58ch] text-sm leading-relaxed', muted)}>{item.description}</p>
                    ) : null}
                    <div className="mt-6 lg:hidden">
                      <Detail item={item} index={i} cardLabel={cardLabel} tone={tone} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="hidden lg:sticky lg:top-28 lg:block">
            <Detail item={items[current]!} index={current} cardLabel={cardLabel} tone={tone} />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Detail({
  item,
  index,
  cardLabel,
  tone,
}: {
  item: Item;
  index: number;
  cardLabel?: string | undefined;
  tone: Tone;
}) {
  const muted = tone === 'bone' ? 'text-muted' : 'text-silver';
  const linkClass =
    'inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)] underline-offset-4 hover:underline';

  return (
    <div
      className={cn(
        // The one raised surface in the section: the list points at it.
        'relative flex flex-col border border-[var(--accent-line)] p-7 shadow-[var(--shadow-panel)] lg:min-h-[26rem]',
        tone === 'bone' ? 'bg-bone-2' : 'bg-ink-2',
      )}
    >
      {item.subItems?.length ? (
        <>
          <p className={cn('font-mono text-[10.5px] uppercase tracking-[0.14em]', muted)}>
            {cardLabel || 'Core services'}
          </p>
          <ul className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {item.subItems.map((sub, i) => (
              <li key={`${sub.text}-${i}`} className="flex items-baseline gap-2.5 text-[15px] font-medium">
                <span aria-hidden="true" className="size-1.5 shrink-0 translate-y-[-2px] rotate-45 bg-[var(--accent)]" />
                {sub.text}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {item.href ? (
        <div className="mt-7">
          {item.href.startsWith('/') ? (
            <Link to={item.href} className={linkClass}>
              {item.linkLabel || 'See more'} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {item.linkLabel || 'See more'} <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex justify-end pt-8">
        {item.image ? (
          <img
            src={item.image}
            alt={item.imageAlt ?? ''}
            width={480}
            height={360}
            loading="lazy"
            decoding="async"
            className="max-h-56 w-auto object-contain"
          />
        ) : (
          // Until there is an image, the item's own number stands in for one:
          // an outline numeral in the accent reads as designed, not missing.
          <span
            aria-hidden="true"
            className="font-display text-[6.5rem] font-extrabold leading-none text-transparent opacity-70 [-webkit-text-stroke:1.5px_var(--accent)] md:text-[8rem]"
          >
            {pad(index + 1)}
          </span>
        )}
      </div>
    </div>
  );
}
