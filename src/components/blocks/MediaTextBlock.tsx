import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import Reveal from '../Reveal';

import type { MediaTextProps } from './types';

const isInternal = (value: string) => value.startsWith('/');

export default function MediaTextBlock({
  tone,
  side,
  image,
  imageAlt,
  eyebrow,
  heading,
  body,
  primaryLabel,
  primaryHref,
}: MediaTextProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <Section tone={tone}>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal
            // Source order stays text-then-image so it reads sensibly on a
            // phone and to a screen reader; only the desktop column flips.
            className={side === 'left' ? 'lg:order-1' : 'lg:order-2'}
          >
            <img
              src={image}
              alt={imageAlt}
              width={1200}
              height={900}
              loading="lazy"
              decoding="async"
              className="w-full border border-[var(--accent-line)] object-cover"
              {...(imageAlt.trim() ? {} : { 'aria-hidden': true })}
            />
          </Reveal>

          <Reveal delay={80} className={side === 'left' ? 'lg:order-2' : 'lg:order-1'}>
            {eyebrow ? (
              <div className="mb-4">
                <Eyebrow>{eyebrow}</Eyebrow>
              </div>
            ) : null}
            {heading ? (
              <h2 className="mb-6 max-w-[22ch] text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
            <div className="grid max-w-[60ch] gap-5">
              {paragraphs.map((p, i) => (
                <p key={i} className={bodyText}>
                  {p}
                </p>
              ))}
            </div>
            {primaryLabel && primaryHref ? (
              <div className="mt-8">
                {isInternal(primaryHref) ? (
                  <Button to={primaryHref}>{primaryLabel}</Button>
                ) : (
                  <Button href={primaryHref}>{primaryLabel}</Button>
                )}
              </div>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
