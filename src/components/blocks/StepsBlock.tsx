import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { StepsProps } from './types';

/**
 * An ordered process.
 *
 * <ol> rather than a div grid: the order is the information here, and a
 * screen reader should announce "3 of 5". The visible numbering is generated
 * from the index so it can never disagree with the actual sequence.
 */
export default function StepsBlock({ tone, eyebrow, heading, lede, steps }: StepsProps) {
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

        <ol className="grid gap-8 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, i) => (
            <Reveal key={`${step.title}-${i}`} as="li" delay={i * 60} className="relative pt-7">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-[var(--accent-line)]"
              />
              <span
                aria-hidden="true"
                className="absolute -top-1 left-0 size-2 rounded-full bg-[var(--accent)]"
              />
              <span
                aria-hidden="true"
                className="font-mono text-[10.5px] tracking-[0.14em] text-[var(--accent)]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
              {step.body ? <p className={`mt-3 text-sm ${bodyText}`}>{step.body}</p> : null}
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
