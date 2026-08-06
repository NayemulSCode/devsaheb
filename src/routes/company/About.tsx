import PageHero from '../../components/ui/PageHero';
import Section from '../../components/ui/Section';
import Container from '../../components/ui/Container';
import Reveal from '../../components/Reveal';
import SpecTable, { type SpecRow } from '../../components/ui/SpecTable';

const STEPS = [
  {
    no: '01',
    title: 'Discover',
    body: 'We map the real constraint before proposing anything. It is usually not the one in the brief.',
  },
  {
    no: '02',
    title: 'Architect',
    body: 'Schema, boundaries, and failure modes on paper, approved by you before code exists.',
  },
  {
    no: '03',
    title: 'Build',
    body: 'Two-week increments. Every pull request reviewed by a second engineer, CI green before merge.',
  },
  {
    no: '04',
    title: 'Harden',
    body: 'Load tests, accessibility audit, performance budget enforced, dependency and secrets review.',
  },
  {
    no: '05',
    title: 'Ship & support',
    body: 'Monitoring, an on-call rotation, and a documented handover your own team can act on.',
  },
];

const STANDARDS: SpecRow[] = [
  { label: 'Largest Contentful Paint', value: '< 2.0 s', tag: 'Enforced' },
  { label: 'Interaction to Next Paint', value: '< 200 ms', tag: 'Enforced' },
  { label: 'Cumulative Layout Shift', value: '< 0.05', tag: 'Enforced' },
  { label: 'Accessibility', value: 'WCAG 2.2 AA', tag: 'Audited' },
  { label: 'Test coverage floor', value: '80%', tag: 'CI gate' },
  { label: 'Critical vulnerabilities', value: '0', tag: 'CI gate' },
  { label: 'Handover documentation', value: 'Included', tag: 'Always' },
];

export default function About() {
  return (
    <main>
      <PageHero
        eyebrow="about us"
        title="We treat engineering standards as the product."
        lede="Most software fails slowly: it ships, it works, and eighteen months later nobody can change it safely. We build so that the second year is cheaper than the first."
      />

      <Section tone="bone">
        <Container>
          <Reveal className="mb-12">
            <h2 className="max-w-[24ch] text-3xl font-extrabold md:text-4xl">
              Five stages. Nothing skipped when the schedule tightens.
            </h2>
          </Reveal>
          {/* Numbered because this genuinely is a sequence - the order carries
              information. Decorative numbering elsewhere would not. */}
          <ol className="grid gap-8 md:grid-cols-3 lg:grid-cols-5">
            {STEPS.map(({ no, title, body }, i) => (
              <Reveal key={no} as="li" delay={i * 60} className="relative pt-7">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-[var(--accent-line)]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-1 left-0 size-2 rounded-full bg-[var(--accent)]"
                />
                <span className="font-mono text-[10.5px] tracking-[0.14em] text-[var(--accent)]">
                  {no}
                </span>
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm text-muted">{body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <h2 className="max-w-[20ch] text-3xl font-extrabold md:text-4xl">
                Most agencies say &ldquo;quality&rdquo;. Here is ours, as numbers.
              </h2>
              <p className="mt-5 max-w-[54ch] text-silver">
                These are contractual, not aspirational. If a build misses one it
                does not ship, and you do not pay for the sprint that fixes it.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <SpecTable caption="Definition of done" rows={STANDARDS} />
            </Reveal>
          </div>
        </Container>
      </Section>
    </main>
  );
}
