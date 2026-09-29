import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { StatsProps } from './types';

export default function StatsBlock({ tone, eyebrow, heading, stats }: StatsProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading ? (
          <Reveal className="mb-12 grid gap-4">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="max-w-[22ch] text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
          </Reveal>
        ) : null}

        <dl className="grid gap-px bg-[var(--accent-line)] sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal
              key={`${stat.label}-${i}`}
              delay={i * 60}
              className={tone === 'bone' ? 'bg-bone-2 p-7' : 'bg-ink-2 p-7'}
            >
              {/* dd before dt so the figure reads first visually while the
                  markup keeps term-then-definition order for screen readers. */}
              <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
                {stat.label}
              </dt>
              <dd className="mt-3 font-display text-4xl font-extrabold md:text-5xl">
                {stat.value}
              </dd>
              {stat.note ? <p className={`mt-3 text-sm ${bodyText}`}>{stat.note}</p> : null}
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
