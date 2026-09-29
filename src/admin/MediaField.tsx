import { useCallback, useEffect, useRef, useState } from 'react';

type MediaFile = { name: string; url: string; bytes: number; modified: number };

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

const kb = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;

/**
 * Image picker for Puck's image fields.
 *
 * Writes the served path (/media/<name>) rather than an id, so the stored value
 * is exactly what the public renderer puts in src and what the schema
 * validates. Nothing has to resolve a reference at render time.
 *
 * An external https URL typed by hand stays valid - the schema allows it - so
 * this adds a way to fill the field without becoming the only way.
 */
export default function MediaField({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean | undefined;
}) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [browsing, setBrowsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media');
      const json = await res.json();
      if (json.ok) setFiles(json.files as MediaFile[]);
    } catch {
      // A failed listing only costs the picker; typing a path still works.
    }
  }, []);

  useEffect(() => {
    if (browsing) void load();
  }, [browsing, load]);

  const send = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/admin/media', { method: 'POST', body });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? 'Upload failed.');
        onChange(json.url as string);
        setFiles((prev) => [json as MediaFile, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onChange],
  );

  const disabled = Boolean(readOnly) || busy;

  return (
    <div style={S.wrap}>
      {value ? (
        <div style={S.preview}>
          {/* Uploads are images by construction, so a preview is safe here. */}
          <img src={value} alt="" style={S.thumb} />
          <div style={S.meta}>
            <code style={S.path}>{value}</code>
            <button type="button" style={S.link} disabled={disabled} onClick={() => onChange('')}>
              Remove
            </button>
          </div>
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void send(file);
        }}
        style={{ ...S.drop, ...(dragging ? S.dropActive : null) }}
      >
        {busy ? 'Uploading…' : 'Drop an image here, or'}{' '}
        {!busy ? (
          <button type="button" style={S.link} disabled={disabled} onClick={() => inputRef.current?.click()}>
            choose a file
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void send(file);
          }}
        />
      </div>

      <div style={S.row}>
        <button type="button" style={S.link} disabled={disabled} onClick={() => setBrowsing((b) => !b)}>
          {browsing ? 'Hide library' : 'Choose from library'}
        </button>
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder="/media/… or https://…"
          onChange={(e) => onChange(e.target.value)}
          style={S.text}
        />
      </div>

      {error ? <p style={S.error}>{error}</p> : null}

      {browsing ? (
        files.length === 0 ? (
          <p style={S.empty}>Nothing uploaded yet.</p>
        ) : (
          <ul style={S.grid}>
            {files.map((file) => (
              <li key={file.name}>
                <button
                  type="button"
                  title={`${file.name} · ${kb(file.bytes)}`}
                  onClick={() => onChange(file.url)}
                  style={{
                    ...S.tile,
                    ...(file.url === value ? S.tileActive : null),
                  }}
                >
                  <img src={file.url} alt="" style={S.tileImg} />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

/**
 * Inline styles on purpose.
 *
 * Puck renders its inspector inside its own stylesheet, and this file is part
 * of the lazy admin chunk. Adding Tailwind classes here would either not apply
 * or pull marketing-site CSS into the editor; neither is worth a stylesheet.
 */
const S: Record<string, React.CSSProperties> = {
  wrap: { display: 'grid', gap: 8 },
  preview: { display: 'flex', gap: 10, alignItems: 'center' },
  thumb: {
    width: 56,
    height: 56,
    objectFit: 'cover',
    border: '1px solid rgba(0,0,0,0.15)',
    background: '#f4f4f5',
  },
  meta: { display: 'grid', gap: 2, minWidth: 0 },
  path: { fontSize: 11, wordBreak: 'break-all', color: '#3f3f46' },
  drop: {
    border: '1px dashed rgba(0,0,0,0.25)',
    borderRadius: 4,
    padding: '14px 10px',
    fontSize: 12,
    textAlign: 'center',
    color: '#52525b',
  },
  dropActive: { borderColor: '#2563eb', background: 'rgba(37,99,235,0.06)' },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  text: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    padding: '6px 8px',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: 4,
  },
  link: {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    fontSize: 12,
    color: '#2563eb',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  error: { margin: 0, fontSize: 12, color: '#b91c1c' },
  empty: { margin: 0, fontSize: 12, color: '#71717a' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
    gap: 6,
    listStyle: 'none',
    margin: 0,
    padding: 0,
    maxHeight: 220,
    overflowY: 'auto',
  },
  tile: {
    display: 'block',
    width: '100%',
    aspectRatio: '1 / 1',
    padding: 0,
    border: '1px solid rgba(0,0,0,0.15)',
    background: '#f4f4f5',
    cursor: 'pointer',
  },
  tileActive: { outline: '2px solid #2563eb', outlineOffset: 1 },
  tileImg: { width: '100%', height: '100%', objectFit: 'cover' },
};
