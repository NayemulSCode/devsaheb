import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { ProseProps } from './types';

export default function ProseBlock({ tone, eyebrow, heading, body }: ProseProps) {
  // Split on blank lines. Rendered as text nodes, never as HTML - stored
  // content must not be able to inject markup into the page.
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <Section tone={tone}>
      <Container>
        <div className="max-w-[68ch]">
          {eyebrow ? (
            <Reveal className="mb-4">
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          {heading ? (
            <Reveal delay={60}>
              <h2 className="mb-6 text-3xl font-extrabold md:text-4xl">{heading}</h2>
            </Reveal>
          ) : null}
          <Reveal delay={120} className="grid gap-5">
            {paragraphs.map((p, i) => (
              <p key={i} className={tone === 'bone' ? 'text-muted' : 'text-silver'}>
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
