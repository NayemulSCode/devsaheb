import PageHero from '../../components/ui/PageHero';
import Section from '../../components/ui/Section';
import Container from '../../components/ui/Container';
import Reveal from '../../components/Reveal';

/**
 * Real names and photos go here once they are collected. Placeholder people
 * are worse than an empty section - a visitor who recognises stock faces
 * stops believing the metrics on the next page too.
 */
export default function Team() {
  return (
    <main>
      <PageHero
        eyebrow="our team"
        title="The people who will actually be on your project."
        lede="You will meet the engineers doing the work, not an account manager who hands you over after signing."
      />

      <Section tone="bone">
        <Container>
          <Reveal>
            <p className="max-w-[62ch] text-muted">
              Team profiles are being prepared. Each will name the person, what
              they work on, and which of our services and technologies they
              actually own — so the specialism pages can point at a real
              engineer rather than a claim.
            </p>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
