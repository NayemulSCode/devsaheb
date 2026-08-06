import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Centred measure. `rail` adds the spec-sheet annotation column on wide screens. */
export default function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-14', className)}>
      {children}
    </div>
  );
}
