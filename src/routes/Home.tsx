import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Eyebrow from '../components/ui/Eyebrow';
import Button from '../components/ui/Button';
import SpecTable, { type SpecRow } from '../components/ui/SpecTable';
import Card from '../components/ui/Card';
import Reveal from '../components/Reveal';

const STANDARDS: SpecRow[] = [
  { label: 'Largest Contentful Paint', value: '< 2.0 s', tag: 'Enforced' },
  { label: 'Interaction to Next Paint', value: '< 200 ms', tag: 'Enforced' },
  { label: 'Cumulative Layout Shift', value: '< 0.05', tag: 'Enforced' },
  { label: 'Accessibility', value: 'WCAG 2.2 AA', tag: 'Audited' },
  { label: 'Test coverage floor', value: '80%', tag: 'CI gate' },
];

const DISCIPLINES = [
  {
    index: '01',
    title: 'Build',
    items: ['Custom Software', 'Web Development', 'Mobile App', 'iOS & Android'],
  },
  {
    index: '02',
    title: 'Platforms',
    items: ['SaaS', 'Ecommerce', 'CMS', 'CRM', 'ERP'],
  },
  {
    index: '03',
    title: 'Data & AI',
    items: ['AI Development', 'Machine Learning', 'Database'],
  },
  {
    index: '04',
    title: 'Cloud & Operations',
    items: ['Cloud Application', 'DevOps', 'QA', 'Legacy Modernization'],
  },
];

export default function Home() {
  return (
    <main>
      <Section tone="ink" as="div" className="pt-16 md:pt-24">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <Reveal as="div">
                <Eyebrow>software engineering</Eyebrow>
              </Reveal>

              <Reveal as="div" delay={60}>
                <h1 className="mt-6 text-4xl font-extrabold md:text-6xl">
                  Built to a standard,
                  <br />
                  not to a <em className="not-italic text-[var(--accent)]">deadline</em>.
                </h1>
              </Reveal>

              <Reveal as="div" delay={120}>
                <p className="mt-6 max-w-[60ch] text-silver md:text-lg">
                  We build custom software, cloud platforms, and mobile apps.
                  Every project ships typed end to end, reviewed line by line,
                  and measured against numbers we commit to before the work
                  starts.
                </p>
              </Reveal>

              <Reveal as="div" delay={180} className="mt-9 flex flex-wrap gap-3.5">
                <Button to="/">See our work</Button>
                <Button variant="ghost" href="#standards">
                  Our standards
                </Button>
              </Reveal>
            </div>

            <Reveal as="div" delay={240}>
              <SpecTable id="standards" caption="Definition of done" rows={STANDARDS} />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="bone">
        <Container>
          <Reveal as="div" className="mb-12 grid gap-4">
            <Eyebrow>what we do</Eyebrow>
            <h2 className="max-w-[22ch] text-3xl font-extrabold md:text-4xl">
              Four disciplines, twenty specialisms, one standard across all of
              them.
            </h2>
            <p className="max-w-[60ch] text-muted">
              We group our work the way clients actually buy it, not
              alphabetically.
            </p>
          </Reveal>

          <div className="grid gap-px bg-[var(--accent-line)] sm:grid-cols-2 lg:grid-cols-4">
            {/* Reveal is the grid item, so it must generate a box. display:contents
                would drop it from the layout and silently kill the animation,
                since opacity cannot apply to a box-less element. */}
            {DISCIPLINES.map(({ index, title, items }, i) => (
              <Reveal key={title} delay={i * 60} className="h-full">
                <Card
                  index={index}
                  title={title}
                  className="h-full border-0 bg-bone-2 hover:bg-white"
                >
                  <ul className="grid gap-2">
                    {items.map((item) => (
                      <li key={item} className="text-sm text-muted">
                        <span aria-hidden="true" className="mr-2 font-bold text-[var(--accent)]">
                          ·
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
