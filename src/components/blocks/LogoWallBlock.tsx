import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { LogoWallProps } from './types';

/**
 * Client or stack logos.
 *
 * A logo without an image file falls back to its name as text rather than a
 * broken image box, so the wall is usable before the assets are collected.
 */
export default function LogoWallBlock({ tone, eyebrow, heading, logos }: LogoWallProps) {
  return (
    <Section tone={tone}>
      <Container>
        {eyebrow || heading ? (
          <Reveal className="mb-10 grid gap-4">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h2 className="max-w-[24ch] text-3xl font-extrabold md:text-4xl">{heading}</h2>
            ) : null}
          </Reveal>
        ) : null}

        <ul className="flex flex-wrap items-center gap-x-10 gap-y-8">
          {logos.map((logo, i) => {
            const mark = logo.image ? (
              <img
                src={logo.image}
                alt={logo.name}
                height={32}
                loading="lazy"
                decoding="async"
                className="h-8 w-auto opacity-70 transition-opacity duration-300 hover:opacity-100 motion-reduce:transition-none"
              />
            ) : (
              <span className="font-display text-lg font-extrabold opacity-70">{logo.name}</span>
            );

            return (
              <Reveal key={`${logo.name}-${i}`} as="li" delay={i * 40}>
                {logo.href ? (
                  <a
                    href={logo.href}
                    className="inline-block"
                    {...(/^https?:\/\//i.test(logo.href)
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {mark}
                  </a>
                ) : (
                  mark
                )}
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
