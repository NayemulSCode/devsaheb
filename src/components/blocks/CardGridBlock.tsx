import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';
import Card from '../ui/Card';

import type { CardGridProps } from './types';

export default function CardGridBlock({
  tone,
  eyebrow,
  heading,
  lede,
  cards,
}: CardGridProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading || lede ? (
          <Reveal className="mb-12 grid gap-4">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="max-w-[22ch] text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
            {lede ? <p className={`max-w-[60ch] ${bodyText}`}>{lede}</p> : null}
          </Reveal>
        ) : null}

        <div
          className="grid gap-px bg-[var(--accent-line)] sm:grid-cols-2"
          style={{ gridTemplateColumns: undefined }}
          data-cards={cards.length}
        >
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 60} className="h-full">
              <Card
                index={card.index}
                title={card.title}
                className={`h-full border-0 ${tone === 'bone' ? 'bg-bone-2 hover:bg-white' : 'bg-ink-2'}`}
              >
                {card.body ? <p className={`text-sm ${bodyText}`}>{card.body}</p> : null}
                {card.items?.length ? (
                  <ul className="grid gap-2">
                    {card.items.map((item) => (
                      <li key={item} className={`text-sm ${bodyText}`}>
                        <span aria-hidden="true" className="mr-2 font-bold text-[var(--accent)]">
                          ·
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
