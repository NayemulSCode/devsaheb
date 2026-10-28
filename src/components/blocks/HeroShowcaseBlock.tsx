import { useEffect, useState } from 'react';
import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import Reveal from '../Reveal';
import { cn } from '../../lib/cn';
import { prefersReducedMotion } from '../../lib/reveal';
import type { HeroShowcaseProps } from './types';

type Person = HeroShowcaseProps['people'][number];

/** Portrait size by slot; the first person leads. */
const SLOTS = [
  { size: 'size-28 lg:size-32', type: 'text-3xl lg:text-4xl' },
  { size: 'size-20 lg:size-22', type: 'text-xl lg:text-2xl' },
  { size: 'size-24 lg:size-26', type: 'text-2xl lg:text-3xl' },
  { size: 'size-20 lg:size-22', type: 'text-xl lg:text-2xl' },
] as const;

/**
 * Where portraits and badges sit above the lg breakpoint, by how many
 * portraits are showing. Each left is the item's centre on a 56rem stage, and
 * every layout keeps clear of captions and badges wrapped to two lines at
 * their maximum width - a fixed five-slot scatter put a portrait on top of a
 * badge as soon as the fifth person was added. Below lg the cluster is a
 * wrapped row. Literal strings so Tailwind can see every class.
 */
const LAYOUTS = [
  {
    stage: 'lg:h-96',
    people: ['lg:left-1/2 lg:top-28'],
    badges: ['lg:left-[72.5%] lg:top-18', 'lg:left-[25.7%] lg:top-38', 'lg:left-[74.8%] lg:top-62'],
  },
  {
    stage: 'lg:h-96',
    people: ['lg:left-[45.8%] lg:top-28', 'lg:left-[75.9%] lg:top-19'],
    badges: ['lg:left-[23.4%] lg:top-15', 'lg:left-[21.2%] lg:top-62', 'lg:left-[75.9%] lg:top-68'],
  },
  {
    stage: 'lg:h-104',
    people: ['lg:left-1/2 lg:top-28', 'lg:left-[21.9%] lg:top-4', 'lg:left-[80.4%] lg:top-37'],
    badges: ['lg:left-[69.2%] lg:top-11', 'lg:left-[21.2%] lg:top-60', 'lg:left-[65.8%] lg:top-81'],
  },
  {
    stage: 'lg:h-108',
    people: ['lg:left-1/2 lg:top-30', 'lg:left-[25.7%] lg:top-0', 'lg:left-[82.6%] lg:top-40', 'lg:left-[13.8%] lg:top-68'],
    badges: ['lg:left-[71.4%] lg:top-10', 'lg:left-[23.4%] lg:top-44', 'lg:left-[67%] lg:top-87'],
  },
] as const;

// w-max stops an item near the right edge from shrinking to the space left of
// it, which would wrap its caption.
const PLACED = 'lg:absolute lg:w-max lg:-translate-x-1/2';

const DEFAULT_ROTATE_SECONDS = 5;

export default function HeroShowcaseBlock({
  eyebrow,
  title,
  highlight,
  lede,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  people,
  badges,
  rotateSeconds,
}: HeroShowcaseProps) {
  const slots = Math.min(people.length, SLOTS.length);
  const layout = slots > 0 ? LAYOUTS[slots - 1] : undefined;

  // Slot s cycles through people s, s + slots, s + 2·slots, ... so every
  // person appears and the first four always open the page.
  const queues = Array.from({ length: slots }, (_, s) => people.filter((_, i) => i % slots === s));
  const rotating = queues.flatMap((queue, s) => (queue.length > 1 ? [s] : []));
  const intervalMs = (rotateSeconds ?? DEFAULT_ROTATE_SECONDS) * 1000;
  const canRotate = rotating.length > 0 && intervalMs > 0;

  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);

  // WCAG 2.2.2: content that updates on its own for more than five seconds
  // must be pausable. It holds while hovered or focused, has a pause control,
  // and never starts under reduced motion.
  useEffect(() => {
    if (!canRotate || paused || held || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setStep((n) => n + 1), intervalMs);
    return () => window.clearInterval(timer);
  }, [canRotate, paused, held, intervalMs]);

  // One rotating slot advances per step, in turn, so faces change one at a
  // time rather than the whole cluster blinking at once.
  const shown = queues.map((queue, s) => {
    const k = rotating.indexOf(s);
    if (k < 0) return queue[0]!;
    const advances = step > k ? Math.floor((step - k - 1) / rotating.length) + 1 : 0;
    return queue[advances % queue.length]!;
  });

  return (
    <Section tone="ink" as="div" className="relative overflow-hidden pb-20 pt-16 md:pb-24 md:pt-24">
      <Backdrop />

      <Container className="relative">
        <Reveal className="flex justify-center">
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mx-auto mt-6 max-w-[20ch] text-balance text-center text-4xl font-extrabold md:text-6xl">
            {title}
            {highlight ? (
              <>
                {' '}
                <em className="not-italic text-[var(--accent)]">{highlight}</em>
              </>
            ) : null}
          </h1>
        </Reveal>

        {lede ? (
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-[60ch] text-center text-silver md:text-lg">{lede}</p>
          </Reveal>
        ) : null}

        {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
          <Reveal delay={180} className="mt-9 flex flex-wrap justify-center gap-3.5">
            {primaryLabel && primaryHref ? <Button {...linkProp(primaryHref)}>{primaryLabel}</Button> : null}
            {secondaryLabel && secondaryHref ? (
              <Button variant="ghost" {...linkProp(secondaryHref)}>
                {secondaryLabel}
              </Button>
            ) : null}
          </Reveal>
        ) : null}

        {slots > 0 || badges.length > 0 ? (
          <div
            className={cn('relative mx-auto mt-12 max-w-4xl', layout?.stage)}
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={() => setHeld(false)}
          >
            {layout ? (
              <ul
                aria-label="The people behind the work"
                className="flex flex-wrap items-start justify-center gap-x-6 gap-y-8 lg:absolute lg:inset-0 lg:block"
              >
                {shown.map((person, s) => (
                  <li key={s} className={cn(PLACED, layout.people[s])}>
                    <Reveal delay={240 + s * 70}>
                      {/* Keyed by person, so a rotation remounts and fades in. */}
                      <Portrait
                        key={`${person.name}-${person.image ?? ''}`}
                        person={person}
                        size={SLOTS[s]!.size}
                        type={SLOTS[s]!.type}
                        animate={step > 0}
                      />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : null}

            {badges.length > 0 ? (
              <ul
                className={cn(
                  'mt-8 flex flex-wrap justify-center gap-3',
                  layout && 'lg:absolute lg:inset-0 lg:mt-0 lg:block',
                )}
              >
                {badges.slice(0, LAYOUTS[0].badges.length).map((badge, i) => (
                  // Two to a row on a phone, so three badges take two rows, not three.
                  <li
                    key={`${badge.label}-${i}`}
                    className={cn('basis-[calc(50%-0.375rem)] sm:basis-auto', layout && PLACED, layout?.badges[i])}
                  >
                    <Reveal delay={420 + i * 70} className="h-full">
                      <Badge label={badge.label} value={badge.value} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {canRotate ? (
          <div className="mt-10 flex justify-center motion-reduce:hidden lg:mt-4">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-silver underline-offset-4 hover:text-[var(--accent)] hover:underline"
            >
              {paused ? 'Resume rotation' : 'Pause rotation'}
            </button>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

function Portrait({
  person,
  size,
  type,
  animate,
}: {
  person: Person;
  size: string;
  type: string;
  animate: boolean;
}) {
  return (
    <figure className={cn('flex flex-col items-center', animate && 'ds-fade-in')}>
      {person.image ? (
        <img
          src={person.image}
          // The name is in the caption below; repeating it here would make a
          // screen reader announce each person twice.
          alt=""
          width={160}
          height={160}
          loading="lazy"
          decoding="async"
          className={cn(size, 'rounded-full object-cover ring-2 ring-gold/40 ring-offset-4 ring-offset-ink')}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            size,
            type,
            'grid place-items-center rounded-full bg-ink-3 font-display font-extrabold tracking-tight text-gold ring-2 ring-gold/40 ring-offset-4 ring-offset-ink',
          )}
        >
          {initials(person.name)}
        </span>
      )}
      {/* Capped and wrapping, so a long title cannot widen into a neighbour. */}
      <figcaption className="tone-bone relative z-10 -mt-4 max-w-52 border border-gold/25 bg-bone px-3 py-1.5 text-center">
        <span className="block text-balance text-[12.5px] font-bold text-ink">{person.name}</span>
        <span className="block text-balance font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
          {person.role}
        </span>
      </figcaption>
    </figure>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="tone-bone h-full max-w-52 border border-gold/25 bg-bone px-4 py-2.5 shadow-[var(--shadow-chip)] lg:h-auto">
      <span className="block text-balance font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">{label}</span>
      <span className="mt-1 flex items-center gap-2 whitespace-nowrap font-display text-[17px] font-bold text-ink">
        {value}
        <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold-deep" />
      </span>
    </div>
  );
}

/** A dot grid fading out from the top, and a low gold glow. Decoration only. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 [background-image:radial-gradient(color-mix(in_srgb,var(--color-gold)_22%,transparent)_1px,transparent_1.3px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="absolute -bottom-1/3 left-1/2 h-[75%] w-[120%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-gold)_14%,transparent),transparent)]" />
    </div>
  );
}

/** First and last initials: "Sumaiya Noor Muna" is SM. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Internal paths route client-side; anything else is a plain anchor. */
function linkProp(target: string): { to: string } | { href: string } {
  return target.startsWith('/') ? { to: target } : { href: target };
}
