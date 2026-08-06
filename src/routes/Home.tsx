const STANDARDS = [
  { k: 'Largest Contentful Paint', v: '< 2.0 s', tag: 'Enforced' },
  { k: 'Interaction to Next Paint', v: '< 200 ms', tag: 'Enforced' },
  { k: 'Cumulative Layout Shift', v: '< 0.05', tag: 'Enforced' },
  { k: 'Accessibility', v: 'WCAG 2.2 AA', tag: 'Audited' },
  { k: 'Test coverage floor', v: '80%', tag: 'CI gate' },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 md:py-32">
      <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
        <span className="opacity-50">&lt;</span>
        software engineering
        <span className="opacity-50">&gt;</span>
      </p>

      <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-balance md:text-6xl">
        Built to a standard,
        <br />
        not to a <em className="not-italic text-gold">deadline</em>.
      </h1>

      <p className="mt-6 max-w-[60ch] text-silver md:text-lg">
        We build custom software, cloud platforms, and mobile apps. Every project
        ships typed end to end, reviewed line by line, and measured against
        numbers we commit to before the work starts.
      </p>

      <section
        aria-labelledby="standards"
        className="mt-16 border border-gold/20 bg-ink-2"
      >
        <h2
          id="standards"
          className="border-b border-gold/20 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-silver-dim"
        >
          Definition of done
        </h2>
        <dl className="px-6">
          {STANDARDS.map(({ k, v, tag }) => (
            <div
              key={k}
              className="flex items-center gap-4 border-b border-silver/10 py-3.5 last:border-b-0"
            >
              <dt className="flex-1 text-sm text-silver">{k}</dt>
              <dd className="font-mono text-[13px] tabular-nums">{v}</dd>
              <span className="border border-gold/35 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-gold">
                {tag}
              </span>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
