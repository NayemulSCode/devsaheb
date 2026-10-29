import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Glides back to the top after an in-app navigation.
 *
 * The browser only resets scroll on a full page load, so without this a link
 * in the footer opens the next page already scrolled to its bottom. Keyed on
 * location.key rather than pathname so a link to the page you are on still
 * takes you up. Back and forward are left alone: the browser restores where
 * the visitor was, which is what they expect. Links with a #hash land on the
 * target instead of the top.
 */
export default function ScrollToTop() {
  const { key, hash } = useLocation();
  const navigationType = useNavigationType();
  const first = useRef(true);

  useEffect(() => {
    // The first render is the page load itself; the browser has placed it.
    if (first.current) {
      first.current = false;
      return;
    }
    if (navigationType === 'POP') return;

    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView({ behavior, block: 'start' });
    else window.scrollTo({ top: 0, behavior });
  }, [key, hash, navigationType]);

  return null;
}
