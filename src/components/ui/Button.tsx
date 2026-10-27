import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

type Variant = 'solid' | 'ghost';

const BASE =
  'inline-flex items-center justify-center gap-2.5 border px-6 py-3.5 font-mono ' +
  'text-caption font-semibold uppercase tracking-[0.12em] no-underline ' +
  'transition-[background-color,color,border-color,transform] duration-300 ' +
  'ease-[var(--ease-brand)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0';

const VARIANTS: Record<Variant, string> = {
  // Fill, text and hover all come from <Section>, which pairs them per band:
  // ink on gold / gold-lift on ink bands, bone on gold-deep / ink on bone bands.
  solid:
    'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] ' +
    'hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]',
  ghost:
    'border-[var(--accent-line)] bg-transparent text-[var(--accent)] hover:border-[var(--accent)]',
};

type Props = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
} & ({ to: string; href?: never } | { href: string; to?: never });

export default function Button({
  variant = 'solid',
  className,
  children,
  ...rest
}: Props) {
  const classes = cn(BASE, VARIANTS[variant], className);

  // Internal links route client-side; external ones get the safety rel.
  if ('to' in rest && rest.to) {
    return (
      <Link to={rest.to} className={classes}>
        {children}
      </Link>
    );
  }

  const href = (rest as { href: string }).href;
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={classes}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}
