import Blocks from '../components/blocks';
import HeroBlock from '../components/blocks/HeroBlock';
import SpecTableBlock from '../components/blocks/SpecTableBlock';
import CardGridBlock from '../components/blocks/CardGridBlock';
import { usePageData } from '../lib/page-data';

/**
 * Home renders from content/pages/home.json.
 *
 * The coded fallback below is not dead weight: if the JSON is missing or fails
 * to parse, the page still renders rather than going blank. Content this
 * important should degrade, not disappear.
 */
export default function Home() {
  const data = usePageData();

  if (data?.content?.length) {
    return (
      <main>
        <Blocks data={data} />
      </main>
    );
  }

  return (
    <main>
      <HeroBlock
        eyebrow="software engineering"
        title="Built to a standard, not to a"
        highlight="deadline."
        lede="We build custom software, cloud platforms, and mobile apps. Every project ships typed end to end, reviewed line by line, and measured against numbers we commit to before the work starts."
        primaryLabel="See our work"
        primaryHref="/work"
        secondaryLabel="Our standards"
        secondaryHref="/company/about"
      />
      <SpecTableBlock
        caption="Definition of done"
        rows={[
          { label: 'Largest Contentful Paint', value: '< 2.0 s', tag: 'Enforced' },
          { label: 'Interaction to Next Paint', value: '< 200 ms', tag: 'Enforced' },
          { label: 'Cumulative Layout Shift', value: '< 0.05', tag: 'Enforced' },
          { label: 'Accessibility', value: 'WCAG 2.2 AA', tag: 'Audited' },
          { label: 'Test coverage floor', value: '80%', tag: 'CI gate' },
        ]}
      />
      <CardGridBlock
        tone="bone"
        eyebrow="what we do"
        heading="Four disciplines, twenty specialisms, one standard across all of them."
        lede="We group our work the way clients actually buy it, not alphabetically."
        cards={[
          {
            index: '01',
            title: 'Build',
            items: ['Custom Software', 'Web Development', 'Mobile App', 'iOS & Android'],
          },
          { index: '02', title: 'Platforms', items: ['SaaS', 'Ecommerce', 'CMS', 'CRM', 'ERP'] },
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
        ]}
      />
    </main>
  );
}
