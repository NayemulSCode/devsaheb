import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Puck, type Config, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import TaxonomyEditor from './TaxonomyEditor';
import { puckConfig } from './puck-config';

// Pulls in the site's route components. Split out so opening a block page does
// not pay for a preview it never shows.
const PagePreview = lazy(() => import('./PagePreview'));
import type { TaxonomyPage } from '../content/schema';

type DocKind = 'blocks' | 'taxonomy';

type DocumentRef = {
  contentPath: string;
  route: string;
  title: string;
  kind: DocKind;
};

type Loaded = {
  contentPath: string;
  route: string;
  kind: DocKind;
  data: unknown;
  versions: string[];
};

/**
 * The admin shell: pick a document, edit it with the right editor, publish.
 *
 * The document list comes from the server, which derives it from the route
 * table in the built bundle. Nothing here maintains its own registry, so a new
 * content-backed route becomes editable the moment it ships.
 */
export default function AdminApp({ onSignOut }: { onSignOut: () => void }) {
  const [docs, setDocs] = useState<DocumentRef[] | null>(null);
  const [current, setCurrent] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<unknown>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    fetch('/api/admin/documents')
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) throw new Error(j.error ?? 'Could not list documents.');
        setDocs(j.documents as DocumentRef[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not list documents.'));
  }, []);

  const open = useCallback(async (contentPath: string) => {
    setError(null);
    setStatus(null);
    setCurrent(null);
    try {
      const res = await fetch(`/api/admin/content?path=${encodeURIComponent(contentPath)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'Could not load.');
      setCurrent(json as Loaded);
      setDraft(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load.');
    }
  }, []);

  async function publish(data: unknown) {
    if (!current) return;
    setSaving(true);
    setStatus('Saving…');
    setError(null);
    try {
      const res = await fetch(`/api/admin/content?path=${encodeURIComponent(current.contentPath)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Save failed.');
      setStatus(`Published — ${json.saved}. ${current.route} regenerated.`);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    onSignOut();
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-black">
      <header className="flex flex-wrap items-center gap-4 border-b border-black/10 bg-white px-5 py-3">
        <strong className="font-mono text-[11px] uppercase tracking-[0.14em]">DevSaheb admin</strong>

        <select
          value={current?.contentPath ?? ''}
          onChange={(e) => e.target.value && open(e.target.value)}
          className="border border-black/20 px-2.5 py-1.5 text-[13px]"
          aria-label="Choose a page to edit"
        >
          <option value="">Choose a page…</option>
          {(docs ?? []).map((d) => (
            <option key={d.contentPath} value={d.contentPath}>
              {d.route} — {d.title}
            </option>
          ))}
        </select>

        {status ? <span className="text-[13px] text-green-700">{status}</span> : null}
        {error ? (
          <span role="alert" className="text-[13px] text-red-700">
            {error}
          </span>
        ) : null}

        {current ? (
          <a
            href={current.route}
            target="_blank"
            rel="noreferrer"
            className="text-[12.5px] underline"
          >
            View page
          </a>
        ) : null}

        <button
          type="button"
          onClick={signOut}
          className="ml-auto border border-black/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]"
        >
          Sign out
        </button>
      </header>

      {!docs && !error ? <Centered>Loading pages…</Centered> : null}

      {docs && !current ? (
        <Centered>
          <p className="mb-5 text-[14px] text-black/60">
            {docs.length} editable page{docs.length === 1 ? '' : 's'}.
          </p>
          <ul className="grid w-full max-w-xl gap-px bg-black/10">
            {docs.map((d) => (
              <li key={d.contentPath}>
                <button
                  type="button"
                  onClick={() => open(d.contentPath)}
                  className="flex w-full items-baseline gap-3 bg-white px-4 py-3 text-left hover:bg-neutral-50"
                >
                  <span className="font-mono text-[11.5px] text-black/50">{d.route}</span>
                  <span className="text-[14px] font-semibold">{d.title}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-black/40">
                    {d.kind}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Centered>
      ) : null}

      {current?.kind === 'blocks' ? (
        <Puck
          config={puckConfig as Config}
          data={current.data as Data}
          onPublish={(next) => publish(next)}
        />
      ) : null}

      {current?.kind === 'taxonomy' ? (
        <div
          className={
            preview
              ? 'grid h-[calc(100vh-108px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
              : 'h-[calc(100vh-108px)] overflow-auto'
          }
        >
          <div className="min-h-0 overflow-auto">
            <div className="mx-auto grid max-w-3xl gap-6 p-6">
              <TaxonomyEditor
                value={draft as TaxonomyPage}
                onChange={(next) => setDraft(next)}
              />
            </div>
          </div>

          {preview ? (
            <div className="min-h-0 border-l border-black/10">
              <Suspense
                fallback={<Centered>Loading preview…</Centered>}
              >
                <PagePreview route={current.route} data={draft} />
              </Suspense>
            </div>
          ) : null}
        </div>
      ) : null}

      {current?.kind === 'taxonomy' ? (
        <div className="fixed inset-x-0 bottom-0 flex items-center gap-4 border-t border-black/10 bg-white px-5 py-3">
          <button
            type="button"
            onClick={() => publish(draft)}
            disabled={saving}
            className="border border-black bg-black px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>

          <button
            type="button"
            onClick={() => setPreview(!preview)}
            aria-pressed={preview}
            className="border border-black/20 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em]"
          >
            {preview ? 'Hide preview' : 'Show preview'}
          </button>

          <span className="text-[12px] text-black/50">
            {current.versions.length} previous version
            {current.versions.length === 1 ? '' : 's'} kept
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
      {children}
    </div>
  );
}
