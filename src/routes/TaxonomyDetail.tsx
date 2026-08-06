import { Link, useLocation } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import Container from '../components/ui/Container';
import Reveal from '../components/Reveal';
import Button from '../components/ui/Button';
import { useRouteData } from '../lib/page-data';
import type { TaxonomyPage } from '../content/schema';
import {
  SERVICES,
  TECHNOLOGIES,
  servicePath,
  technologyPath,
} from '../content/taxonomy';

type Item = { slug: string; name: string; published?: boolean };

const find = (list: Item[], slug: string): Item | undefined =>
  list.find((i) => i.slug === slug);

/**
 * Related items may legitimately reference specialisms whose page is not
 * written yet - the cross-links are authored against the whole taxonomy, not
 * against what happens to be published this week. Unpublished ones render as
 * plain text so the relationship still reads without producing a 404.
 */
function RelatedLink({
  list,
  slug,
  toPath,
  className,
  mutedClassName,
}: {
  list: Item[];
  slug: string;
  toPath: (slug: string) => string;
  className: string;
  mutedClassName: string;
}) {
  const item = find(list, slug);
  if (!item) return null;
  if (!item.published) return <span className={mutedClassName}>{item.name}</span>;
  return (
    <Link to={toPath(slug)} className={className}>
      {item.name}
    </Link>
  );
}

/**
 * Detail page for one service or technology.
 *
 * Every section here exists because the substance bar in docs/keyword-map.md
 * requires it. The FAQ becomes FAQPage schema, and `related` is the internal
 * link graph between the two taxonomies - the main structural payoff of having
 * both.
 */
export default function TaxonomyDetail() {
  const data = useRouteData<TaxonomyPage>();
  const { pathname } = useLocation();
  const isService = pathname.startsWith('/services/');

  if (!data) {
    return (
      <main>
        <PageHero
          eyebrow={isService ? 'service' : 'technology'}
          title="This page is being written."
          lede="It will be published once it clears the substance bar rather than as a template with a word swapped."
        />
      </main>
    );
  }

  const hubPath = isService ? '/services' : '/technologies';
  const hubLabel = isService ? 'Services' : 'Technologies';

  return (
    <main>
      <PageHero
        eyebrow={isService ? 'service' : 'technology'}
        title={data.h1}
        lede={data.intro}
      >
        <Reveal delay={180} className="mt-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-silver-dim">
              <li>
                <Link to="/" className="hover:text-gold">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={hubPath} className="hover:text-gold">
                  {hubLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              {/* The short name, not the h1. A headline-length breadcrumb is
                  unreadable, and Google cross-checks this trail against the
                  BreadcrumbList schema - they have to say the same thing. */}
              <li aria-current="page" className="text-silver">
                {find(isService ? SERVICES : TECHNOLOGIES, data.slug)?.name ?? data.slug}
              </li>
            </ol>
          </nav>
        </Reveal>
      </PageHero>

      <Section tone="bone">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
            <div className="grid gap-10">
              {data.sections.map((section, i) => (
                <Reveal key={section.heading} delay={i * 60}>
                  <h2 className="max-w-[26ch] text-2xl font-extrabold md:text-3xl">
                    {section.heading}
                  </h2>
                  <div className="mt-4 grid max-w-[68ch] gap-4">
                    {section.body
                      .split(/\n{2,}/)
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((p, j) => (
                        <p key={j} className="text-muted">
                          {p}
                        </p>
                      ))}
                  </div>
                </Reveal>
              ))}
            </div>

            {data.deliverables?.length ? (
              <Reveal delay={120}>
                <aside className="border border-[var(--accent-line)] bg-bone-2 p-6">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                    What you get
                  </h2>
                  <ul className="mt-5 grid gap-3">
                    {data.deliverables.map((d) => (
                      <li key={d} className="text-sm text-muted">
                        <span aria-hidden="true" className="mr-2 font-bold text-[var(--accent)]">
                          ·
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </aside>
              </Reveal>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* The honest counter-case. Hard to template, which is exactly why it is
          worth publishing - and it is the section buyers remember. */}
      <Section tone="ink">
        <Container>
          <Reveal className="max-w-[68ch]">
            <h2 className="text-2xl font-extrabold md:text-3xl">{data.notFor.heading}</h2>
            <p className="mt-4 text-silver">{data.notFor.body}</p>
          </Reveal>
        </Container>
      </Section>

      <Section tone="bone">
        <Container>
          <Reveal className="mb-10">
            <h2 className="text-2xl font-extrabold md:text-3xl">Common questions</h2>
          </Reveal>
          <dl className="grid max-w-[70ch] gap-px border-t border-[var(--accent-line)]">
            {data.faq.map((item, i) => (
              <Reveal key={item.q} delay={i * 50}>
                <div className="border-b border-[var(--accent-line)] py-6">
                  <dt className="font-display text-lg font-bold">{item.q}</dt>
                  <dd className="mt-3 text-muted">{item.a}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-10 md:grid-cols-2">
            {data.related.services.length ? (
              <Reveal>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                  Related services
                </h2>
                <ul className="mt-5 grid gap-2.5">
                  {data.related.services.map((slug) => (
                    <li key={slug}>
                      <RelatedLink
                        list={SERVICES}
                        slug={slug}
                        toPath={servicePath}
                        className="text-silver transition-colors hover:text-gold"
                        mutedClassName="text-silver-dim"
                      />
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}

            {data.related.technologies.length ? (
              <Reveal delay={60}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                  Built with
                </h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {data.related.technologies.map((slug) => (
                    <li key={slug}>
                      <RelatedLink
                        list={TECHNOLOGIES}
                        slug={slug}
                        toPath={technologyPath}
                        className="inline-block border border-silver/15 px-3 py-1.5 font-mono text-[12px] text-silver transition-colors hover:border-gold hover:text-gold"
                        mutedClassName="inline-block border border-silver/10 px-3 py-1.5 font-mono text-[12px] text-silver-dim"
                      />
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>

          <Reveal delay={140} className="mt-14 border-t border-gold/20 pt-10">
            <h2 className="max-w-[24ch] text-2xl font-extrabold md:text-3xl">
              Tell us the constraint. We will tell you honestly if we fit.
            </h2>
            <div className="mt-7">
              <Button to="/contact">Start a conversation</Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
