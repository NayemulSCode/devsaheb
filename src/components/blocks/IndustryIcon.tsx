import type { ReactNode } from 'react';
import type { IndustryIconName } from '../../content/industry-icons';

/**
 * Line icons for IndustryGrid, drawn on a 24px grid at a 1.75 stroke.
 *
 * Inline rather than uploaded: SVG is excluded from the media uploader because
 * an SVG served from our own origin can carry script, so a fixed, reviewed set
 * is the safe way to let editors choose one.
 */
const PATHS: Record<IndustryIconName, ReactNode> = {
  travel: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M8 7v13M16 7v13" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.2v5.6l4.8-2.8z" />
    </>
  ),
  logistics: (
    <>
      <path d="M2.5 6.5h11v9.5h-11z" />
      <path d="M13.5 9.5h4l3 3.5v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  energy: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8z" />,
  mortgage: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  food: (
    <>
      <path d="M6 3v5.5a3 3 0 0 0 6 0V3" />
      <path d="M9 3v18" />
      <path d="M17.5 3c-1.6 1.3-2.7 3.6-2.7 6.6h2.7V21" />
    </>
  ),
  automotive: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 14.2v6.3M9.9 11.3 3.8 9.6M14.1 11.3l6.1-1.7" />
    </>
  ),
  sports: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5v17" />
      <path d="M6.3 5.7a8.5 8.5 0 0 1 0 12.6M17.7 5.7a8.5 8.5 0 0 0 0 12.6" />
    </>
  ),
  finance: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M4.5 10h15" />
      <path d="M6.5 10v8M10.2 10v8M13.8 10v8M17.5 10v8" />
      <path d="M3.5 20h17" />
    </>
  ),
  banking: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </>
  ),
  aviation: (
    <path d="M12 2.5c.9 0 1.5 1.3 1.5 2.5v4.5L21 14v2l-7.5-2.2V18l2.5 1.8v1.7l-4-1.1-4 1.1v-1.7l2.5-1.8v-4.2L3 16v-2l7.5-4.5V5c0-1.2.6-2.5 1.5-2.5z" />
  ),
  // A brick wall. A hard hat was tried first and read as a hotel service bell.
  construction: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 9.7h18M3 14.3h18" />
      <path d="M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" />
    </>
  ),
  education: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.6v4.1c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.1" />
      <path d="M21.5 9.5v5" />
    </>
  ),
  'oil-gas': (
    <>
      <path d="M12 3.2c-3.2 4.2-6 7.8-6 11a6 6 0 0 0 12 0c0-3.2-2.8-6.8-6-11z" />
      <path d="M9.4 14.6a2.6 2.6 0 0 0 2.6 2.6" />
    </>
  ),
  fintech: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2 0 2.7 5.3 1.4 5.3 4.1 0 1.2-1.2 2.1-2.7 2.1-1.2 0-2.2-.6-2.7-1.5" />
      <path d="M12 6.3v1.6M12 16.1v1.6" />
    </>
  ),
  'real-estate': (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1" />
      <path d="M8.5 7h2M13.5 7h2M8.5 10.5h2M13.5 10.5h2M8.5 14h2M13.5 14h2" />
      <path d="M10.5 20.5v-3h3v3" />
    </>
  ),
  healthcare: (
    <>
      <path d="M12 20.5s-8-4.8-8-10.4A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 8 2.6c0 5.6-8 10.4-8 10.4z" />
      <path d="M7 12.5h2.5L11 10l2 5 1.5-2.5H17" />
    </>
  ),
  retail: (
    <>
      <path d="M5 8h14l-1 12.5H6L5 8z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </>
  ),
  other: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
};

export default function IndustryIcon({
  name,
  className,
}: {
  name: IndustryIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name] ?? PATHS.other}
    </svg>
  );
}
