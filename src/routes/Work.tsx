import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';
import Card from '../components/ui/Card';

/**
 * Case study index.
 *
 * Deliberately empty of invented work. Fabricated clients and metrics are the
 * fastest way to undermine a page whose entire argument is that we publish
 * real numbers. Populated in Phase 4 from content/projects/*.json once client
 * permissions land.
 */
const PROCESS = [
  {
    index: '01',
    title: 'Problem',
    body: 'The constraint as the client stated it, and the one we found underneath.',
  },
  {
    index: '02',
    title: 'Approach',
    body: 'Architecture, trade-offs we rejected, and why.',
  },
  {
    index: '03',
    title: 'Result',
    body: 'A number. Measured before and after, not estimated.',
  },
];

export default function Work() {
  return (
    <main>
      <PageHero
        eyebrow="selected work"
        title="Every case study ends in a number."
        lede="Problem, constraints, approach, architecture, result. The same structure every time, because consistency is the point."
      />

      <Section tone="bone">
        <Container>
          <Reveal className="mb-12">
            <h2 className="max-w-[24ch] text-3xl font-extrabold md:text-4xl">
              What each case study will tell you.
            </h2>
          </Reveal>

          <div className="grid gap-px bg-[var(--accent-line)] md:grid-cols-3">
            {PROCESS.map(({ index, title, body }, i) => (
              <Reveal key={title} delay={i * 60} className="h-full">
                <Card index={index} title={title} className="h-full border-0 bg-bone-2">
                  <p className="text-sm text-muted">{body}</p>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="mt-12 max-w-[62ch] text-muted">
              Case studies are being prepared with client permission. We would
              rather publish three real ones than a dozen invented, which is the
              same reason our metrics carry the measurement method next to them.
            </p>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
