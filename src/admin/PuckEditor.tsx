import { useEffect, useState } from 'react';
import { Puck, type Config, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import HeroBlock from '../components/blocks/HeroBlock';
import SpecTableBlock from '../components/blocks/SpecTableBlock';
import CardGridBlock from '../components/blocks/CardGridBlock';
import ProseBlock from '../components/blocks/ProseBlock';
import type { HeroProps, SpecTableProps, CardGridProps, ProseProps } from '../components/blocks/types';

/**
 * Puck config.
 *
 * Every component here renders through the exact same block component the
 * public site uses, so what the editor previews is what visitors get. The
 * field definitions mirror src/content/schema.ts; the server validates every
 * save against that schema regardless, so a mismatch is rejected rather than
 * written.
 */
const config: Config = {
  components: {
    Hero: {
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Title' },
        highlight: { type: 'text', label: 'Highlighted word' },
        lede: { type: 'textarea', label: 'Lede' },
        primaryLabel: { type: 'text', label: 'Primary button' },
        primaryHref: { type: 'text', label: 'Primary link' },
        secondaryLabel: { type: 'text', label: 'Secondary button' },
        secondaryHref: { type: 'text', label: 'Secondary link' },
      },
      defaultProps: {
        eyebrow: 'software engineering',
        title: 'Built to a standard, not to a',
        highlight: 'deadline.',
        lede: '',
        primaryLabel: 'See our work',
        primaryHref: '/work',
        secondaryLabel: '',
        secondaryHref: '',
      },
      render: (props) => <HeroBlock {...(props as unknown as HeroProps)} />,
    },

    SpecTable: {
      fields: {
        caption: { type: 'text', label: 'Caption' },
        rows: {
          type: 'array',
          label: 'Rows',
          arrayFields: {
            label: { type: 'text' },
            value: { type: 'text' },
            tag: { type: 'text' },
          },
        },
      },
      defaultProps: {
        caption: 'Definition of done',
        rows: [{ label: 'Largest Contentful Paint', value: '< 2.0 s', tag: 'Enforced' }],
      },
      render: (props) => <SpecTableBlock {...(props as unknown as SpecTableProps)} />,
    },

    CardGrid: {
      fields: {
        tone: {
          type: 'select',
          label: 'Band',
          options: [
            { label: 'Ink (dark)', value: 'ink' },
            { label: 'Bone (light)', value: 'bone' },
          ],
        },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        lede: { type: 'textarea', label: 'Lede' },
        cards: {
          type: 'array',
          label: 'Cards',
          arrayFields: {
            index: { type: 'text', label: 'Index' },
            title: { type: 'text', label: 'Title' },
            body: { type: 'textarea', label: 'Body' },
            items: { type: 'array', label: 'List items', arrayFields: { item: { type: 'text' } } },
          },
        },
      },
      defaultProps: { tone: 'bone', eyebrow: '', heading: '', lede: '', cards: [] },
      render: (props) => <CardGridBlock {...(props as unknown as CardGridProps)} />,
    },

    Prose: {
      fields: {
        tone: {
          type: 'select',
          label: 'Band',
          options: [
            { label: 'Ink (dark)', value: 'ink' },
            { label: 'Bone (light)', value: 'bone' },
          ],
        },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body (blank line between paragraphs)' },
      },
      defaultProps: { tone: 'ink', eyebrow: '', heading: '', body: '' },
      render: (props) => <ProseBlock {...(props as unknown as ProseProps)} />,
    },
  },
};

const SLUG = 'home';
const PATH = '/';

export default function PuckEditor({ onSignOut }: { onSignOut: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/pages/${SLUG}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) throw new Error(j.error ?? 'Could not load page.');
        setData(j.data as Data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load page.'));
  }, []);

  async function publish(next: Data) {
    setStatus('Saving…');
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${SLUG}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: next, path: PATH }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed.');
      setStatus(`Published. ${json.blocks} block(s), page regenerated.`);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : 'Save failed.');
    }
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    onSignOut();
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24">
        <p role="alert" className="text-[#e0876a]">
          {error}
        </p>
      </main>
    );
  }

  if (!data) return <main className="px-6 py-24 text-silver">Loading content…</main>;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="flex flex-wrap items-center gap-4 border-b border-black/10 px-5 py-3">
        <strong className="font-mono text-[11px] uppercase tracking-[0.14em]">
          Editing: {SLUG}
        </strong>
        {status ? <span className="text-[13px] text-green-700">{status}</span> : null}
        {error ? (
          <span role="alert" className="text-[13px] text-red-700">
            {error}
          </span>
        ) : null}
        <button
          type="button"
          onClick={signOut}
          className="ml-auto border border-black/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]"
        >
          Sign out
        </button>
      </div>
      <Puck config={config} data={data} onPublish={publish} />
    </div>
  );
}
