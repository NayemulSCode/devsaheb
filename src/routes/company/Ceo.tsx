import PageHero from '../../components/ui/PageHero';
import Section from '../../components/ui/Section';
import Container from '../../components/ui/Container';
import Reveal from '../../components/Reveal';

export default function Ceo() {
  return (
    <main>
      <PageHero
        eyebrow="our ceo"
        title="Who you are trusting with the work."
        lede="A short account of how DevSaheb started, what it refuses to do, and who is accountable when something goes wrong."
      />

      <Section tone="ink">
        <Container>
          <Reveal>
            <p className="max-w-[62ch] text-silver">
              This page is being written. It will carry a named, attributable
              point of view rather than a biography — including the kinds of
              project we turn down and why.
            </p>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
