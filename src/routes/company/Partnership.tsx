import PageHero from '../../components/ui/PageHero';
import Section from '../../components/ui/Section';
import Container from '../../components/ui/Container';
import Reveal from '../../components/Reveal';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const MODELS = [
  {
    index: '01',
    title: 'White label',
    body: 'We build under your brand, to your standards, and stay invisible to your client.',
  },
  {
    index: '02',
    title: 'Overflow capacity',
    body: 'A reviewed, typed increment when your own team is at capacity — not bodies on a bench.',
  },
  {
    index: '03',
    title: 'Referral',
    body: 'You send work that is outside your scope; we do the same in return.',
  },
];

export default function Partnership() {
  return (
    <main>
      <PageHero
        eyebrow="partnership"
        title="For agencies and studios that need engineering they can vouch for."
        lede="Our standards are published, so you can hold us to them in front of your own client. That is the point of partnering with us rather than subcontracting blind."
      />

      <Section tone="bone">
        <Container>
          <div className="grid gap-px bg-[var(--accent-line)] md:grid-cols-3">
            {MODELS.map(({ index, title, body }, i) => (
              <Reveal key={title} delay={i * 60} className="h-full">
                <Card index={index} title={title} className="h-full border-0 bg-bone-2">
                  <p className="text-sm text-muted">{body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200} className="mt-12">
            <Button to="/contact">Talk about a partnership</Button>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
