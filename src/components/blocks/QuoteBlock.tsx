import Section from '../ui/Section';
import Container from '../ui/Container';
import Reveal from '../Reveal';

import type { QuoteProps } from './types';

export default function QuoteBlock({ tone, quote, attribution, role }: QuoteProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        <Reveal>
          <figure className="mx-auto max-w-[62ch] text-center">
            <span
              aria-hidden="true"
              className="block font-display text-6xl leading-none text-[var(--accent)]"
            >
              &ldquo;
            </span>
            <blockquote className="mt-4 text-balance font-display text-2xl font-bold leading-snug md:text-3xl">
              {quote}
            </blockquote>
            {attribution ? (
              <figcaption className={`mt-7 font-mono text-[11px] uppercase tracking-[0.12em] ${bodyText}`}>
                {attribution}
                {role ? <span className="text-[var(--accent)]"> · {role}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        </Reveal>
      </Container>
    </Section>
  );
}
