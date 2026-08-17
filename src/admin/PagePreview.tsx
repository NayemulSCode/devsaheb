import { useEffect, useRef, useState } from 'react';
import TaxonomyDetail from '../routes/TaxonomyDetail';
import { RouteDataPreview } from '../lib/page-data';

const WIDTHS = { desktop: 1280, mobile: 390 } as const;
type Device = keyof typeof WIDTHS;

/**
 * Live preview of a taxonomy page as it is edited.
 *
 * Renders the real route component with the draft in place of stored content,
 * so what you see is the page itself - not a second implementation that can
 * drift from it.
 *
 * No router is created here. React Router refuses to nest one inside another,
 * and the admin already provides one; TaxonomyDetail decides whether it is a
 * service or a technology from the content rather than the location, so it
 * renders correctly regardless. Its links resolve normally but are prevented
 * from navigating, which keeps the markup identical to the real page.
 */
export default function PagePreview({ route, data }: { route: string; data: unknown }) {
  const [device, setDevice] = useState<Device>('desktop');
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const width = WIDTHS[device];

  // Scale the page down to whatever room the pane has, so layout is judged at
  // a real viewport width rather than a squeezed one.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const fit = () => setScale(Math.min(1, (el.clientWidth - 24) / width));
    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-black/10 bg-white px-4 py-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-black/50">
          Preview
        </span>
        <span className="font-mono text-[11px] text-black/40">{route}</span>

        <div className="ml-auto flex items-center gap-1">
          {(Object.keys(WIDTHS) as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-pressed={device === d}
              className={`border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] ${
                device === d ? 'border-black bg-black text-white' : 'border-black/20'
              }`}
            >
              {d}
            </button>
          ))}
          <span className="ml-2 font-mono text-[10.5px] text-black/40">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      <div ref={frameRef} className="min-h-0 flex-1 overflow-auto bg-neutral-300 p-3">
        <div
          style={{
            // The scaled child still reserves its unscaled height, which would
            // leave a large dead area below the preview.
            height: scale < 1 ? `calc(var(--preview-h, 0px) * ${scale})` : undefined,
          }}
        >
          <div
            className="ds-preview origin-top-left bg-ink shadow-lg"
            style={{ width, transform: `scale(${scale})` }}
            // Links must render exactly as they do on the real page, but a
            // click here should not navigate the admin away mid-edit.
            onClickCapture={(e) => {
              if ((e.target as HTMLElement).closest('a')) e.preventDefault();
            }}
            ref={(el) => {
              if (el?.parentElement) {
                el.parentElement.style.setProperty('--preview-h', `${el.scrollHeight}px`);
              }
            }}
          >
            <RouteDataPreview value={data}>
              <TaxonomyDetail />
            </RouteDataPreview>
          </div>
        </div>
      </div>
    </div>
  );
}
