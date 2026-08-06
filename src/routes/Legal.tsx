import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';

/**
 * Placeholder legal pages.
 *
 * Deliberately not filled with boilerplate copied from elsewhere: a privacy
 * policy that misdescribes what you collect is worse than none, and under
 * GDPR it is a liability rather than a formality. These need a lawyer or at
 * minimum a factual audit of what the site actually stores.
 */
function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const isPrivacy = kind === 'privacy';
  return (
    <main>
      <PageHero
        eyebrow={isPrivacy ? 'privacy' : 'terms'}
        title={isPrivacy ? 'Privacy policy' : 'Terms of service'}
        lede={
          isPrivacy
            ? 'What this site collects, why, and how long it is kept.'
            : 'The terms under which we provide services and you use this site.'
        }
      />
      <Section tone="ink">
        <Container>
          <Reveal>
            <p className="max-w-[62ch] text-silver">
              This document is being drafted against what the site actually does
              rather than adapted from a template. Boilerplate that misdescribes
              your data handling is a liability, not a formality.
            </p>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}

export function Privacy() {
  return <LegalPage kind="privacy" />;
}

export function Terms() {
  return <LegalPage kind="terms" />;
}
