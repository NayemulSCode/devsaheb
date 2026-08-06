import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import Reveal from '../Reveal';
import type { HeroProps } from './types';

export default function HeroBlock({
  eyebrow,
  title,
  highlight,
  lede,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: HeroProps) {
  return (
    <Section tone="ink" as="div" className="pt-16 md:pt-24">
      <Container>
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mt-6 max-w-[18ch] text-4xl font-extrabold md:text-6xl">
            {title}
            {highlight ? (
              <>
                {' '}
                <em className="not-italic text-[var(--accent)]">{highlight}</em>
              </>
            ) : null}
          </h1>
        </Reveal>

        {lede ? (
          <Reveal delay={120}>
            <p className="mt-6 max-w-[60ch] text-silver md:text-lg">{lede}</p>
          </Reveal>
        ) : null}

        {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
          <Reveal delay={180} className="mt-9 flex flex-wrap gap-3.5">
            {primaryLabel && primaryHref ? (
              <Button {...linkProp(primaryHref)}>{primaryLabel}</Button>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Button variant="ghost" {...linkProp(secondaryHref)}>
                {secondaryLabel}
              </Button>
            ) : null}
          </Reveal>
        ) : null}
      </Container>
    </Section>
  );
}

/** Internal paths route client-side; anything else is a plain anchor. */
function linkProp(target: string): { to: string } | { href: string } {
  return target.startsWith('/') ? { to: target } : { href: target };
}
