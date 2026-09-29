import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { FaqProps } from './types';

/**
 * Q&A.
 *
 * <details>/<summary> rather than a scripted accordion: it is keyboard
 * operable, announced correctly, and expands with JavaScript disabled - which
 * also means the answers are in the prerendered HTML for crawlers to read.
 */
export default function FaqBlock({ tone, eyebrow, heading, items }: FaqProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading ? (
          <Reveal className="mb-12 grid gap-4">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="max-w-[24ch] text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
          </Reveal>
        ) : null}

        <div className="max-w-[72ch]">
          {items.map((item, i) => (
            <Reveal key={`${item.q}-${i}`} delay={i * 40}>
              <details className="group border-b border-[var(--accent-line)]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-bold marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 font-mono text-[var(--accent)] transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className={`pb-6 pr-10 text-sm leading-relaxed ${bodyText}`}>{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
