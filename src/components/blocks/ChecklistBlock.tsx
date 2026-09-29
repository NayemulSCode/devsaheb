import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { ChecklistProps } from './types';

export default function ChecklistBlock({
  tone,
  eyebrow,
  heading,
  includedTitle,
  included,
  excludedTitle,
  excluded,
}: ChecklistProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';
  const hasExcluded = Boolean(excludedTitle && excluded?.length);

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

        <div className={`grid gap-10 ${hasExcluded ? 'md:grid-cols-2 md:gap-16' : ''}`}>
          <Reveal>
            <h3 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
              {includedTitle}
            </h3>
            <ul className="mt-6 grid gap-3.5">
              {included.map((item, i) => (
                <li key={`${item.text}-${i}`} className={`flex gap-3 text-sm ${bodyText}`}>
                  <span aria-hidden="true" className="mt-px font-bold text-[var(--accent)]">
                    ✓
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </Reveal>

          {hasExcluded ? (
            <Reveal delay={100}>
              <h3
                className={`font-mono text-[10.5px] uppercase tracking-[0.14em] ${
                  tone === 'bone' ? 'text-muted' : 'text-silver-dim'
                }`}
              >
                {excludedTitle}
              </h3>
              <ul className="mt-6 grid gap-3.5">
                {excluded?.map((item, i) => (
                  <li key={`${item.text}-${i}`} className={`flex gap-3 text-sm ${bodyText}`}>
                    <span
                      aria-hidden="true"
                      className={tone === 'bone' ? 'mt-px text-muted' : 'mt-px text-silver-dim'}
                    >
                      —
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
