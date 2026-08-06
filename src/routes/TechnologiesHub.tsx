import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';
import { TECHNOLOGY_GROUPS, technologyPath } from '../content/taxonomy';

export default function TechnologiesHub() {
  return (
    <main>
      <PageHero
        eyebrow="technologies"
        title="The stack we actually maintain in production."
        lede="We list what we run and support, not everything we have touched. If a technology is not here, we will say so rather than learn it on your budget."
      />

      <Section tone="ink">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-16">
            {TECHNOLOGY_GROUPS.map((group, gi) => (
              <Reveal key={group.name} delay={gi * 60}>
                <h2 className="border-b border-gold/20 pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
                  {group.name}
                </h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      {item.published ? (
                        <Link
                          to={technologyPath(item.slug)}
                          className="inline-block border border-silver/15 px-3.5 py-2 font-mono text-[12.5px] text-silver transition-colors hover:border-gold hover:text-gold"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="inline-block border border-silver/10 px-3.5 py-2 font-mono text-[12.5px] text-silver-dim">
                          {item.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
