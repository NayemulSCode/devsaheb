import Section from '../ui/Section';
import Container from '../ui/Container';
import Button from '../ui/Button';
import Reveal from '../Reveal';

import type { CtaProps } from './types';

/** Internal paths route; anything else is a real navigation. */
const isInternal = (value: string) => value.startsWith('/');

export default function CtaBlock({
  tone,
  heading,
  lede,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        <Reveal className="mx-auto grid max-w-[54ch] justify-items-center gap-6 text-center">
          <h2 className="text-balance text-3xl font-extrabold md:text-4xl">{heading}</h2>
          {lede ? <p className={bodyText}>{lede}</p> : null}

          {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {primaryLabel && primaryHref ? (
                isInternal(primaryHref) ? (
                  <Button to={primaryHref}>{primaryLabel}</Button>
                ) : (
                  <Button href={primaryHref}>{primaryLabel}</Button>
                )
              ) : null}
              {secondaryLabel && secondaryHref ? (
                isInternal(secondaryHref) ? (
                  <Button to={secondaryHref} variant="ghost">
                    {secondaryLabel}
                  </Button>
                ) : (
                  <Button href={secondaryHref} variant="ghost">
                    {secondaryLabel}
                  </Button>
                )
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}
