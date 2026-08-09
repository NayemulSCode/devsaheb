import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';
import { SERVICE_GROUPS, servicePath } from '../content/taxonomy';

export default function ServicesHub() {
  return (
    <main>
      <PageHero
        eyebrow="services"
        title="Twenty specialisms, grouped the way clients buy them."
        lede="Four disciplines cover everything we take on. Each service page sets out how we approach the work, what we have shipped, and when we would point you somewhere else."
      />

      <Section tone="bone">
        <Container>
          <div className="grid gap-14">
            {SERVICE_GROUPS.map((group, gi) => (
              <Reveal key={group.name} delay={gi * 60}>
                <div className="grid gap-6 md:grid-cols-[220px_1fr] md:gap-10">
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
                    {group.name}
                  </h2>
                  <ul className="grid gap-px border-t border-[var(--accent-line)] sm:grid-cols-2">
                    {group.items.map((item) => (
                      <li key={item.slug} className="border-b border-[var(--accent-line)]">
                        {item.published ? (
                          <Link
                            to={servicePath(item.slug)}
                            className="group flex items-center justify-between gap-4 py-4 pr-2 transition-[padding] duration-200 hover:pl-2"
                          >
                            <span className="font-display text-lg font-bold">{item.name}</span>
                            <span
                              aria-hidden="true"
                              className="font-mono text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              →
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between gap-4 py-4 pr-2">
                            <span className="font-display text-lg font-bold text-muted">
                              {item.name}
                            </span>
                            {/* Full muted, not muted/70 - the blend measured
                                3.45:1 on bone, below AA. */}
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted">
                              Page in progress
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
