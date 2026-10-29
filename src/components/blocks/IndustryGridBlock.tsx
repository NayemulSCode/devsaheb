import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Section, { isLightTone } from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';
import IndustryIcon from './IndustryIcon';
import { cn } from '../../lib/cn';
import type { IndustryGridProps } from './types';

type Industry = IndustryGridProps['industries'][number];

export default function IndustryGridBlock({ tone, eyebrow, heading, lede, industries }: IndustryGridProps) {
  if (industries.length === 0) return null;

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading || lede ? (
          <Reveal className="mx-auto mb-12 grid max-w-[46rem] justify-items-center gap-4 text-center">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="text-balance text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
            {lede ? (
              <p className={cn('max-w-[60ch]', isLightTone(tone) ? 'text-muted' : 'text-silver')}>{lede}</p>
            ) : null}
          </Reveal>
        ) : null}

        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
          {industries.map((industry, i) => (
            // Stagger along a row, not down the whole list, so the last tile
            // does not wait a second behind the first.
            <Reveal key={`${industry.label}-${i}`} as="li" delay={(i % 6) * 40} className="relative h-full hover:z-10">
              <Tile industry={industry} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function Tile({ industry }: { industry: Industry }) {
  const className = cn(
    // A little tighter on a phone, where eighteen tiles make nine rows.
    'group relative flex h-full min-h-28 flex-col items-center justify-center gap-2.5 px-3 py-5 text-center sm:min-h-32 sm:gap-3 sm:py-6',
    // Separate tiles, so each lifts on its own; at rest they stay flat.
    'border border-[var(--accent-line)] transition-[border-color,box-shadow,translate] duration-300 ease-[var(--ease-brand)] hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0',
    'bg-[var(--surface)]',
  );

  const body: ReactNode = (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-[380ms] ease-[var(--ease-brand)] group-hover:scale-x-100 motion-reduce:transition-none"
      />
      <IndustryIcon
        name={industry.icon}
        className="size-7 text-[var(--accent)] transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none sm:size-8"
      />
      <span className="text-balance text-[13.5px] font-semibold leading-snug transition-colors group-hover:text-[var(--accent)]">
        {industry.label}
      </span>
    </>
  );

  if (!industry.href) return <div className={className}>{body}</div>;

  return industry.href.startsWith('/') ? (
    <Link to={industry.href} className={className}>
      {body}
    </Link>
  ) : (
    <a href={industry.href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}
