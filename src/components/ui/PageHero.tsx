import type { ReactNode } from 'react';
import Section from './Section';
import Container from './Container';
import Eyebrow from './Eyebrow';
import Reveal from '../Reveal';

export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <Section tone="ink" as="div" className="border-b border-gold/15 py-14 md:py-20">
      <Container>
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="mt-5 max-w-[20ch] text-4xl font-extrabold md:text-5xl">{title}</h1>
        </Reveal>
        {lede ? (
          <Reveal delay={120}>
            <p className="mt-5 max-w-[62ch] text-silver md:text-lg">{lede}</p>
          </Reveal>
        ) : null}
        {children}
      </Container>
    </Section>
  );
}
