import { cn } from '../../lib/cn';

export type SpecRow = {
  label: string;
  value: string;
  tag?: string;
};

/**
 * The datasheet block. Carries the "engineering spec sheet" idea that the whole
 * design rests on, so it is a primitive rather than a one-off.
 *
 * Rendered as a <dl> because it is genuinely term/description pairs, and with
 * tabular-nums so the values align down the column.
 */
export default function SpecTable({
  caption,
  rows,
  className,
  id,
}: {
  caption: string;
  rows: SpecRow[];
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn('border border-[var(--accent-line)] bg-ink-2', className)}
    >
      <p className="border-b border-[var(--accent-line)] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-silver-dim">
        {caption}
      </p>
      <dl className="px-6">
        {rows.map(({ label, value, tag }) => (
          <div
            key={label}
            className="flex items-center gap-4 border-b border-silver/10 py-3.5 last:border-b-0"
          >
            <dt className="flex-1 text-sm text-silver">{label}</dt>
            <dd className="font-mono text-[13px] tabular-nums">{value}</dd>
            {tag ? (
              <span className="border border-[var(--accent)]/35 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--accent)]">
                {tag}
              </span>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
