import { useState } from 'react';
import type { TaxonomyPage } from '../content/schema';

/**
 * Form editor for service and technology pages.
 *
 * These are not Puck documents on purpose. Their `faq` drives FAQPage schema
 * and `related` drives the internal link graph between the two taxonomies -
 * flattening them into a free-form block list would lose both, and the
 * structured data is most of why these pages are worth publishing.
 *
 * The field set mirrors src/content/schema.ts. The server validates every save
 * against that schema regardless, so a drift here is rejected rather than
 * written.
 */
export default function TaxonomyEditor({
  value,
  onChange,
}: {
  value: TaxonomyPage;
  onChange: (next: TaxonomyPage) => void;
}) {
  const set = <K extends keyof TaxonomyPage>(key: K, v: TaxonomyPage[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="grid gap-8">
      <Group title="Search">
        <Field label="Primary query (from the keyword map)" hint="One owned query. Do not reuse another page's.">
          <input className={INPUT} value={value.primaryQuery} onChange={(e) => set('primaryQuery', e.target.value)} />
        </Field>
        <Field label="Title" hint={`${value.title.length}/70 — shown in search results`}>
          <input className={INPUT} maxLength={70} value={value.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Description" hint={`${value.description.length}/180`}>
          <textarea className={INPUT} rows={2} maxLength={180} value={value.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </Group>

      <Group title="Page">
        <Field label="Headline (h1)" hint="Written for a human, not the search result.">
          <input className={INPUT} value={value.h1} onChange={(e) => set('h1', e.target.value)} />
        </Field>
        <Field label="Intro">
          <textarea className={INPUT} rows={4} value={value.intro} onChange={(e) => set('intro', e.target.value)} />
        </Field>
      </Group>

      <ListGroup
        title="Sections"
        items={value.sections}
        onChange={(next) => set('sections', next)}
        blank={{ heading: '', body: '' }}
        max={8}
        render={(item, update) => (
          <>
            <input className={INPUT} placeholder="Heading" value={item.heading} onChange={(e) => update({ ...item, heading: e.target.value })} />
            <textarea className={INPUT} rows={6} placeholder="Body — blank line between paragraphs" value={item.body} onChange={(e) => update({ ...item, body: e.target.value })} />
          </>
        )}
      />

      <ListGroup
        title="What you get"
        items={value.deliverables ?? []}
        onChange={(next) => set('deliverables', next)}
        blank=""
        max={12}
        render={(item, update) => (
          <input className={INPUT} value={item} onChange={(e) => update(e.target.value)} />
        )}
      />

      <ListGroup
        title="FAQ"
        hint="3 to 5 real questions. These become FAQPage structured data, so padding here is worse than useless."
        items={value.faq}
        onChange={(next) => set('faq', next)}
        blank={{ q: '', a: '' }}
        max={6}
        render={(item, update) => (
          <>
            <input className={INPUT} placeholder="Question" value={item.q} onChange={(e) => update({ ...item, q: e.target.value })} />
            <textarea className={INPUT} rows={4} placeholder="Answer" value={item.a} onChange={(e) => update({ ...item, a: e.target.value })} />
          </>
        )}
      />

      <Group title="When we would recommend otherwise" hint="The section buyers remember. Hard to template, which is the point.">
        <Field label="Heading">
          <input className={INPUT} value={value.notFor.heading} onChange={(e) => set('notFor', { ...value.notFor, heading: e.target.value })} />
        </Field>
        <Field label="Body">
          <textarea className={INPUT} rows={4} value={value.notFor.body} onChange={(e) => set('notFor', { ...value.notFor, body: e.target.value })} />
        </Field>
      </Group>

      <Group title="Cross-links" hint="Slugs only, comma separated. Unpublished ones render as plain text rather than broken links.">
        <Field label="Related services">
          <input
            className={INPUT}
            value={value.related.services.join(', ')}
            onChange={(e) => set('related', { ...value.related, services: splitSlugs(e.target.value) })}
          />
        </Field>
        <Field label="Related technologies">
          <input
            className={INPUT}
            value={value.related.technologies.join(', ')}
            onChange={(e) => set('related', { ...value.related, technologies: splitSlugs(e.target.value) })}
          />
        </Field>
      </Group>
    </div>
  );
}

const splitSlugs = (raw: string) =>
  raw.split(',').map((s) => s.trim()).filter(Boolean);

const INPUT =
  'w-full border border-black/15 bg-white px-3 py-2 text-[13.5px] outline-none focus-visible:border-black/50';

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border border-black/10 bg-white">
      <h2 className="border-b border-black/10 px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em]">
        {title}
      </h2>
      <div className="grid gap-4 p-4">
        {hint ? <p className="text-[12.5px] text-black/55">{hint}</p> : null}
        {children}
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-semibold">{label}</span>
      {hint ? <span className="text-[11.5px] text-black/50">{hint}</span> : null}
      {children}
    </label>
  );
}

/** Add/remove/reorder for the repeating groups. */
function ListGroup<T>({
  title,
  hint,
  items,
  onChange,
  blank,
  max,
  render,
}: {
  title: string;
  hint?: string;
  items: T[];
  onChange: (next: T[]) => void;
  blank: T;
  max: number;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const replace = (i: number, next: T) => onChange(items.map((it, j) => (j === i ? next : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
    onChange(next);
  };

  return (
    <section className="border border-black/10 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-b border-black/10 px-4 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.14em]"
      >
        {title}
        <span className="text-black/40">{items.length}</span>
        <span aria-hidden="true" className="ml-auto">{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <div className="grid gap-4 p-4">
          {hint ? <p className="text-[12.5px] text-black/55">{hint}</p> : null}

          {items.map((item, i) => (
            <div key={i} className="grid gap-2 border-l-2 border-black/10 pl-3">
              <div className="flex items-center gap-2 text-[11px] text-black/45">
                <span className="font-mono">{String(i + 1).padStart(2, '0')}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={MINI}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className={MINI}>↓</button>
                <button type="button" onClick={() => remove(i)} className={`${MINI} ml-auto text-red-700`}>Remove</button>
              </div>
              {render(item, (next) => replace(i, next))}
            </div>
          ))}

          <button
            type="button"
            onClick={() => onChange([...items, structuredClone(blank)])}
            disabled={items.length >= max}
            className="justify-self-start border border-black/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] disabled:opacity-40"
          >
            Add {items.length >= max ? `(max ${max})` : ''}
          </button>
        </div>
      ) : null}
    </section>
  );
}

const MINI = 'border border-black/15 px-1.5 py-0.5 disabled:opacity-30';
