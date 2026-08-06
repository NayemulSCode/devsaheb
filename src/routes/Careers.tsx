import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';
import Button from '../components/ui/Button';

/**
 * Careers stays on-domain deliberately.
 *
 * Sending this straight to an external ATS forfeits the SEO entirely: on-domain
 * postings carry JobPosting structured data and become eligible for the Google
 * Jobs panel. Link out from the apply button on an individual role instead.
 * Phase 4 renders roles from content/careers/*.json and emits that schema.
 */
export default function Careers() {
  return (
    <main>
      <PageHero
        eyebrow="careers"
        title="We hire engineers who argue with the spec."
        lede="If you have ever refused to ship something you could not defend in review, you will recognise how we work."
      />

      <Section tone="ink">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Reveal>
              <h2 className="max-w-[22ch] text-2xl font-extrabold md:text-3xl">
                No open roles listed right now.
              </h2>
              <p className="mt-5 max-w-[54ch] text-silver">
                We keep this page honest rather than perpetually advertising
                positions that do not exist. If you are strong and the timing is
                wrong, write anyway — we would rather know you early.
              </p>
              <div className="mt-8">
                <Button href="mailto:careers@devsaheb.com">Send an introduction</Button>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="border border-gold/20 bg-ink-2 p-7">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-silver-dim">
                  What we look for
                </h3>
                <ul className="mt-5 grid gap-3.5 text-sm text-silver">
                  <li>Reads the codebase before proposing a rewrite.</li>
                  <li>Writes the test that would have caught it.</li>
                  <li>Can explain a trade-off to someone non-technical.</li>
                  <li>Says &ldquo;I do not know&rdquo; early rather than late.</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </main>
  );
}
