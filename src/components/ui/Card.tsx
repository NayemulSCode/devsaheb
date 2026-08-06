import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Surface with the logo's node dots as corner registration marks and an accent
 * rule that draws in on hover.
 */
export default function Card({
  index,
  title,
  children,
  footer,
  className,
  style,
}: {
  index?: string;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <article
      style={style}
      className={cn(
        'group relative flex flex-col gap-4 border border-[var(--accent-line)] p-7',
        'transition-colors duration-300 ease-[var(--ease-brand)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-[380ms] ease-[var(--ease-brand)] group-hover:scale-x-100 motion-reduce:transition-none"
      />
      <span
        aria-hidden="true"
        className="absolute -left-[3px] -top-[3px] size-1.5 rounded-full bg-[var(--accent)] opacity-60"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-[3px] -right-[3px] size-1.5 rounded-full bg-[var(--accent)] opacity-60"
      />

      {index ? (
        <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--accent)]">
          {index}
        </span>
      ) : null}

      <h3 className="text-xl font-bold">{title}</h3>
      {children}
      {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
    </article>
  );
}
