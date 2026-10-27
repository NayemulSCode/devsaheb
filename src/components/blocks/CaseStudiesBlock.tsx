import { useEffect, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import Reveal from '../Reveal';
import { cn } from '../../lib/cn';
import { prefersReducedMotion } from '../../lib/reveal';
import type { CaseStudiesProps } from './types';

type Study = CaseStudiesProps['studies'][number];

/** Wide enough that the heading and a run of cards share the screen. */
const PIN_QUERY = '(min-width: 64rem)';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Case study cards beside a fixed heading.
 *
 * On a wide screen the band pins while the page scrolls past it, and the cards
 * slide sideways in step - the scroll position drives them, so nothing moves
 * that the reader did not move. Everywhere else it is a native swipeable row
 * with previous and next controls: on phones, under reduced motion (sideways
 * travel on a vertical scroll is a known vestibular trigger), and before the
 * script runs, which is also what the prerendered HTML shows.
 */
export default function CaseStudiesBlock({
  tone,
  eyebrow,
  heading,
  lede,
  primaryLabel,
  primaryHref,
  studies,
}: CaseStudiesProps) {
  const outer = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  // How far the track travels while pinned; 0 means not pinned.
  const [distance, setDistance] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const measure = () => {
      const v = viewport.current;
      const t = track.current;
      if (!v || !t) return;
      const travel = Math.max(0, t.scrollWidth - v.clientWidth);
      setOverflowing(travel > 1);
      setDistance(mq.matches && !prefersReducedMotion() ? travel : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    if (track.current) ro.observe(track.current);
    mq.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', measure);
    };
  }, [studies.length]);

  // Scroll drives the track. Written straight to the DOM in a frame callback,
  // since a React render per scroll event would be the slowest way to do it.
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    if (distance === 0) {
      t.style.transform = '';
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = outer.current;
      if (!el) return;
      const span = el.offsetHeight - window.innerHeight;
      const progress = span > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)) : 0;
      t.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [distance]);

  if (studies.length === 0) return null;

  // Tabbing to a card that is off to the side scrolls the page to the point
  // where that card is in view, instead of letting the browser scroll the
  // clipped container and tear the track away from the scroll position.
  const onFocus = (e: FocusEvent) => {
    const el = outer.current;
    const v = viewport.current;
    const card = (e.target as HTMLElement).closest('li');
    if (!distance || !el || !v || !card) return;
    v.scrollLeft = 0;
    const x = Math.min(distance, Math.max(0, card.offsetLeft - (v.clientWidth - card.offsetWidth) / 2));
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + (x / distance) * span });
  };

  const step = (dir: 1 | -1) => {
    const v = viewport.current;
    const card = track.current?.querySelector('li');
    if (!v || !card) return;
    v.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const onScroll = () => {
    const v = viewport.current;
    if (!v) return;
    setEdges({ start: v.scrollLeft < 4, end: v.scrollLeft + v.clientWidth > v.scrollWidth - 4 });
  };

  const pinned = distance > 0;
  const muted = tone === 'bone' ? 'text-muted' : 'text-silver';
  const label = heading || 'Case studies';

  return (
    <Section tone={tone} padded={false} className="overflow-x-clip">
      <div ref={outer} style={pinned ? { height: `calc(100vh + ${distance}px)` } : undefined}>
        <div className={cn(pinned ? 'sticky top-0 flex h-screen items-center' : 'py-18 md:py-32')}>
          <Container className="grid gap-10 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
            <Reveal className="grid content-start justify-items-start gap-5">
              {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
              {heading ? <h2 className="text-balance text-3xl font-extrabold md:text-4xl">{heading}</h2> : null}
              {lede ? <p className={cn('max-w-[46ch]', muted)}>{lede}</p> : null}
              {primaryLabel && primaryHref ? (
                <Button
                  {...(primaryHref.startsWith('/') ? { to: primaryHref } : { href: primaryHref })}
                  className="mt-2"
                >
                  {primaryLabel}
                </Button>
              ) : null}
            </Reveal>

            <div className="min-w-0">
              {/* Bleeds to the screen edge on the right, and to both edges on a phone. */}
              <div
                ref={viewport}
                role="region"
                aria-label={label}
                tabIndex={pinned ? undefined : 0}
                onFocus={onFocus}
                onScroll={pinned ? undefined : onScroll}
                className={cn(
                  '-mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:mr-[calc((min(100vw,1240px)_-_100vw)/2_-_3.5rem)] lg:px-0',
                  pinned
                    ? 'overflow-hidden'
                    : 'snap-x snap-mandatory scroll-px-5 overflow-x-auto pb-2 [scrollbar-width:thin] sm:scroll-px-8 lg:scroll-px-0',
                )}
              >
                <ul ref={track} className="relative flex w-max gap-6 will-change-transform lg:pr-14">
                  {studies.map((study, i) => (
                    <li key={`${study.title}-${i}`} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[22rem] lg:w-[25rem] lg:max-w-none">
                      <Card study={study} index={i} tone={tone} />
                    </li>
                  ))}
                </ul>
              </div>

              {pinned ? (
                <div aria-hidden="true" className="mt-8 h-px bg-[var(--accent-line)]">
                  {/* No scale class: Tailwind's sets the `scale` property, which
                      would multiply with the transform written on scroll. */}
                  <span ref={bar} className="block h-full origin-left bg-[var(--accent)]" />
                </div>
              ) : overflowing ? (
                <div className="mt-6 flex gap-3">
                  <StepButton label="Previous case study" disabled={edges.start} onClick={() => step(-1)} dir={-1} />
                  <StepButton label="Next case study" disabled={edges.end} onClick={() => step(1)} dir={1} />
                </div>
              ) : null}
            </div>
          </Container>
        </div>
      </div>
    </Section>
  );
}

/**
 * Cards are light on both bands, so their text uses fixed ink and gold-deep
 * rather than the band's accent - gold on bone would fail contrast.
 */
function Card({ study, index, tone }: { study: Study; index: number; tone: CaseStudiesProps['tone'] }) {
  const className = cn(
    'group flex h-full flex-col overflow-hidden text-ink transition-transform duration-300 ease-[var(--ease-brand)] hover:-translate-y-1 motion-reduce:hover:translate-y-0',
    tone === 'bone' ? 'border border-[var(--accent-line)] bg-bone-2' : 'bg-bone',
  );

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-2">
        {study.image ? (
          <img
            src={study.image}
            alt={study.imageAlt ?? ''}
            width={800}
            height={500}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          // Until there is a screenshot, the card's number stands in for one.
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
            <span className="absolute inset-0 [background-image:radial-gradient(rgb(204_170_80/0.18)_1px,transparent_1.3px)] [background-size:18px_18px]" />
            <span className="relative font-display text-[6rem] font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-gold)]">
              {pad(index + 1)}
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <h3 className="text-xl font-bold leading-tight">{study.title}</h3>
        {study.category ? (
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{study.category}</p>
        ) : null}
        {study.summary ? <p className="mt-1 text-sm leading-relaxed text-muted">{study.summary}</p> : null}
        {study.href ? (
          <span className="mt-auto pt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-deep">
            Read the case study <span aria-hidden="true">→</span>
          </span>
        ) : null}
      </div>
    </>
  );

  if (!study.href) return <article className={className}>{body}</article>;

  const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]';
  return study.href.startsWith('/') ? (
    <Link to={study.href} className={cn(className, focus)}>
      {body}
    </Link>
  ) : (
    <a href={study.href} target="_blank" rel="noopener noreferrer" className={cn(className, focus)}>
      {body}
    </a>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  dir,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  dir: 1 | -1;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center border border-[var(--accent-line)] text-[var(--accent)] transition-colors hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-[var(--accent-line)]"
    >
      <span aria-hidden="true">{dir === 1 ? '→' : '←'}</span>
    </button>
  );
}
