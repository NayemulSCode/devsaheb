import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Section label wrapped in the logo's code brackets.
 *
 * The brackets are decorative, so they are marked aria-hidden - a screen
 * reader should hear "software engineering", not "less than software
 * engineering greater than".
 */
export default function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]',
        className,
      )}
    >
      <span aria-hidden="true" className="opacity-50">
        &lt;
      </span>
      {children}
      <span aria-hidden="true" className="opacity-50">
        &gt;
      </span>
    </p>
  );
}
