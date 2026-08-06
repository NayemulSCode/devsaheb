/**
 * One shared IntersectionObserver for every reveal on the page.
 *
 * Per-element observers would mean dozens of them on a long marketing page;
 * a single observer with a subscriber map costs one.
 */

const callbacks = new Map<Element, () => void>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        observer?.unobserve(entry.target);
        callbacks.delete(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
  );
  return observer;
}

/** Fires once when `el` scrolls into view. Returns an unsubscribe function. */
export function observeOnce(el: Element, onVisible: () => void): () => void {
  callbacks.set(el, onVisible);
  getObserver().observe(el);
  return () => {
    observer?.unobserve(el);
    callbacks.delete(el);
  };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
