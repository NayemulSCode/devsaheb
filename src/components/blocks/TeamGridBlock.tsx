import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { TeamGridProps } from './types';

export default function TeamGridBlock({
  tone,
  eyebrow,
  heading,
  lede,
  people,
}: TeamGridProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading || lede ? (
          <Reveal className="mb-12 grid gap-4">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="max-w-[24ch] text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
            {lede ? <p className={`max-w-[60ch] ${bodyText}`}>{lede}</p> : null}
          </Reveal>
        ) : null}

        <ul className="grid gap-px bg-[var(--accent-line)] sm:grid-cols-2 lg:grid-cols-4">
          {people.map((person, i) => (
            <Reveal
              key={`${person.name}-${i}`}
              as="li"
              delay={i * 50}
              className={tone === 'bone' ? 'bg-bone-2 p-6' : 'bg-ink-2 p-6'}
            >
              {person.image ? (
                <img
                  src={person.image}
                  // The name is already in the heading below, so repeating it
                  // here would have a screen reader announce the person twice.
                  alt=""
                  width={320}
                  height={320}
                  loading="lazy"
                  decoding="async"
                  className="mb-5 aspect-square w-full object-cover grayscale transition-[filter] duration-500 hover:grayscale-0 motion-reduce:transition-none"
                />
              ) : null}
              <h3 className="text-lg font-bold">{person.name}</h3>
              <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--accent)]">
                {person.role}
              </p>
              {person.focus ? <p className={`mt-3 text-sm ${bodyText}`}>{person.focus}</p> : null}
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
