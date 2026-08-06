import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { observeOnce, prefersReducedMotion } from '../lib/reveal';

/**
 * Reveals a subtree on scroll.
 *
 * The visible state lives in React, not in a class added to the DOM from
 * outside. An earlier version toggled the class directly from an observer and
 * the page rendered blank: React owns className, so it wiped the class on
 * hydration and nothing ever became visible.
 *
 * No-JS safety comes from the CSS, which only hides `[data-reveal]` under
 * `html.js`. That class is set by an inline script in the prerendered head, so
 * without scripting nothing is ever hidden in the first place.
 */
export default function Reveal({
  as: Tag = 'div' as ElementType,
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  /** Milliseconds. Stagger siblings in 40-60ms steps. */
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    return observeOnce(el, () => setVisible(true));
  }, []);

  const style = delay
    ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties)
    : undefined;

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={style}
      className={cn(className, visible && 'is-visible')}
    >
      {children}
    </Tag>
  );
}
