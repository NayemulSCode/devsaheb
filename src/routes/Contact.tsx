import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';

import { telHref, addressLines, type SiteConfig } from '../lib/seo';
import siteJson from '../../content/site.json';

const site = siteJson as SiteConfig;

const DIRECT = [
  { label: 'Email', value: site.contact.email, href: `mailto:${site.contact.email}` },
  { label: 'Phone', value: site.contact.phone, href: telHref(site.contact.phone) },
  {
    label: 'Careers',
    value: site.contact.careersEmail,
    href: `mailto:${site.contact.careersEmail}`,
  },
  { label: 'Office', value: addressLines(site.contact.address).join(', '), href: null },
];

export default function Contact() {
  return (
    <main>
      <PageHero
        eyebrow="start a project"
        title="Tell us the constraint. We will tell you honestly if we fit."
        lede="A short call, no deck. If your problem is outside what we do well, we will say so and point you somewhere better."
      />

      <Section tone="ink">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Reveal>
              <h2 className="text-2xl font-extrabold md:text-3xl">Reach us directly</h2>
              <dl className="mt-8 grid gap-px border-t border-gold/20">
                {DIRECT.map(({ label, value, href }) => (
                  <div
                    key={label}
                    className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-gold/20 py-4"
                  >
                    <dt className="w-24 font-mono text-[10.5px] uppercase tracking-[0.14em] text-silver-dim">
                      {label}
                    </dt>
                    <dd>
                      {href ? (
                        <a href={href} className="text-silver transition-colors hover:text-gold">
                          {value}
                        </a>
                      ) : (
                        <span className="text-silver">{value}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={100}>
              <div className="border border-gold/20 bg-ink-2 p-7">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-silver-dim">
                  What to include
                </h2>
                <ul className="mt-5 grid gap-3.5 text-sm text-silver">
                  <li>What the software needs to do, in your own words.</li>
                  <li>What already exists, if anything.</li>
                  <li>The deadline that actually matters, and why.</li>
                  <li>Roughly what you have budgeted.</li>
                </ul>
                <p className="mt-6 border-t border-silver/10 pt-5 text-[13px] text-silver-dim">
                  A contact form lands here in a later phase. Until then email
                  reaches us faster than a form would.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </main>
  );
}
