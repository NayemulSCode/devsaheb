import { useEffect, type ReactNode } from 'react';
import { useEditor, EditorContent, type Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
// All four live in this one package; the separate row/cell/header packages are
// re-exports of the same classes.
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

/**
 * Tiptap's own document shape.
 *
 * Deliberately not the schema's RichNode type. This is the editor's working
 * format, and it is converted at the one boundary in puck-config; the schema
 * validates on save, which is where the shape is actually enforced.
 */
export type Doc = { type: 'doc'; content?: JSONContent[] };

const EMPTY: Doc = { type: 'doc', content: [{ type: 'paragraph' }] };

/**
 * Body copy editor.
 *
 * Stores Tiptap's document JSON, which is what the schema validates and what
 * the public renderer walks. Deliberately not HTML: nothing downstream parses
 * markup, so nothing stored here can introduce any.
 *
 * Only h2 and h3 are offered. h1 belongs to the page's hero, and a second one
 * inside body copy breaks the document outline a screen reader navigates by.
 */
export default function RichTextField({
  value,
  onChange,
  readOnly,
}: {
  value: Doc | undefined;
  onChange: (next: Doc) => void;
  readOnly?: boolean | undefined;
}) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        // Belt and braces: the schema refuses anything else on save, but the
        // editor should not let it be typed in the first place.
        protocols: ['http', 'https', 'mailto', 'tel'],
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value?.content?.length ? value : EMPTY,
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON() as Doc),
    editorProps: { attributes: { class: 'ds-rte-content' } },
  });

  // Puck can swap the selected block while this component stays mounted, which
  // would otherwise leave the previous block's text in the editor.
  useEffect(() => {
    if (!editor) return;
    const next = value?.content?.length ? value : EMPTY;
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(next)) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div style={S.wrap}>
      <style>{CSS}</style>
      <div style={S.bar}>
        <Group>
          <Btn e={editor} label="↩" title="Undo" run={(c) => c.undo()} can="undo" />
          <Btn e={editor} label="↪" title="Redo" run={(c) => c.redo()} can="redo" />
        </Group>

        <Group>
          <Btn e={editor} label="H2" title="Heading 2" run={(c) => c.toggleHeading({ level: 2 })} active={['heading', { level: 2 }]} />
          <Btn e={editor} label="H3" title="Heading 3" run={(c) => c.toggleHeading({ level: 3 })} active={['heading', { level: 3 }]} />
        </Group>

        <Group>
          <Btn e={editor} label="B" title="Bold" bold run={(c) => c.toggleBold()} active={['bold']} />
          <Btn e={editor} label="I" title="Italic" italic run={(c) => c.toggleItalic()} active={['italic']} />
          <Btn e={editor} label="U" title="Underline" underline run={(c) => c.toggleUnderline()} active={['underline']} />
          <Btn e={editor} label="S" title="Strikethrough" strike run={(c) => c.toggleStrike()} active={['strike']} />
          <Btn e={editor} label="<>" title="Inline code" run={(c) => c.toggleCode()} active={['code']} />
        </Group>

        <Group>
          <Btn e={editor} label="• List" title="Bullet list" run={(c) => c.toggleBulletList()} active={['bulletList']} />
          <Btn e={editor} label="1. List" title="Numbered list" run={(c) => c.toggleOrderedList()} active={['orderedList']} />
        </Group>

        <Group>
          <Btn e={editor} label="&ldquo; Quote" title="Blockquote" run={(c) => c.toggleBlockquote()} active={['blockquote']} />
          <Btn e={editor} label="— HR" title="Horizontal rule" run={(c) => c.setHorizontalRule()} />
          <LinkBtn editor={editor} />
        </Group>

        <Group>
          <Btn e={editor} label="⇤" title="Align left" run={(c) => c.setTextAlign('left')} active={[{ textAlign: 'left' }]} />
          <Btn e={editor} label="≡" title="Align centre" run={(c) => c.setTextAlign('center')} active={[{ textAlign: 'center' }]} />
          <Btn e={editor} label="⇥" title="Align right" run={(c) => c.setTextAlign('right')} active={[{ textAlign: 'right' }]} />
        </Group>

        <Group>
          <Btn
            e={editor}
            label="▦ Table"
            title="Insert table"
            run={(c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true })}
          />
          {editor.isActive('table') ? (
            <Btn e={editor} label="✕ Table" title="Delete table" run={(c) => c.deleteTable()} />
          ) : null}
        </Group>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <div style={S.group}>{children}</div>;
}

type Chain = ReturnType<Editor['chain']>['focus'] extends () => infer R ? R : never;

function Btn({
  e,
  label,
  title,
  run,
  active,
  can,
  bold,
  italic,
  underline,
  strike,
}: {
  e: Editor;
  label: string;
  title: string;
  run: (chain: Chain) => { run: () => boolean };
  active?: [string, Record<string, unknown>?] | [Record<string, unknown>];
  can?: 'undo' | 'redo';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}) {
  const isActive = active
    ? // @ts-expect-error - isActive is overloaded for name and/or attributes
      e.isActive(...active)
    : false;
  const disabled = can === 'undo' ? !e.can().undo() : can === 'redo' ? !e.can().redo() : false;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active ? isActive : undefined}
      disabled={disabled}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={() => run(e.chain().focus()).run()}
      style={{
        ...S.btn,
        ...(isActive ? S.btnActive : null),
        ...(disabled ? S.btnDisabled : null),
        ...(bold ? { fontWeight: 700 } : null),
        ...(italic ? { fontStyle: 'italic' } : null),
        ...(underline ? { textDecoration: 'underline' } : null),
        ...(strike ? { textDecoration: 'line-through' } : null),
      }}
    >
      {label}
    </button>
  );
}

/**
 * Link prompt.
 *
 * window.prompt is refused in some embedded viewers and returns null, which
 * this treats as "cancelled" - the same as pressing Escape. That is the right
 * outcome either way: nothing is changed without an explicit value.
 */
function LinkBtn({ editor }: { editor: Editor }) {
  const active = editor.isActive('link');

  return (
    <button
      type="button"
      title={active ? 'Edit or remove link' : 'Add link'}
      aria-label={active ? 'Edit or remove link' : 'Add link'}
      aria-pressed={active}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={() => {
        const current = (editor.getAttributes('link').href as string) ?? '';
        const next = window.prompt('Link (/page, https://…, mailto: or tel:)', current);
        if (next === null) return;

        const href = next.trim();
        if (!href) {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
        if (!/^\/(?!\/)/.test(href) && !/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
          window.alert('Use /page, https://…, mailto: or tel:');
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      }}
      style={{ ...S.btn, ...(active ? S.btnActive : null) }}
    >
      🔗 Link
    </button>
  );
}

/**
 * Inline styles and a scoped stylesheet, for the same reason MediaField uses
 * them: this renders inside Puck's own inspector, where the marketing site's
 * Tailwind is neither loaded nor wanted.
 */
const S: Record<string, React.CSSProperties> = {
  wrap: { border: '1px solid rgba(0,0,0,0.2)', borderRadius: 4, background: '#fff' },
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    borderBottom: '1px solid rgba(0,0,0,0.12)',
    background: '#fafafa',
  },
  group: { display: 'flex', gap: 2, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 4, padding: 2 },
  btn: {
    minWidth: 28,
    padding: '4px 7px',
    fontSize: 12,
    lineHeight: 1.2,
    border: 'none',
    borderRadius: 3,
    background: 'transparent',
    color: '#27272a',
    cursor: 'pointer',
  },
  btnActive: { background: '#2563eb', color: '#fff' },
  btnDisabled: { opacity: 0.35, cursor: 'default' },
};

const CSS = `
.ds-rte-content { padding: 12px; min-height: 220px; max-height: 460px; overflow-y: auto;
  font-size: 14px; line-height: 1.65; color: #18181b; outline: none; }
.ds-rte-content > * + * { margin-top: 0.75em; }
.ds-rte-content h2 { font-size: 1.3em; font-weight: 800; }
.ds-rte-content h3 { font-size: 1.1em; font-weight: 700; }
.ds-rte-content ul { list-style: disc; padding-left: 1.4em; }
.ds-rte-content ol { list-style: decimal; padding-left: 1.4em; }
.ds-rte-content li > p { margin: 0; }
.ds-rte-content blockquote { border-left: 3px solid #d4d4d8; padding-left: 0.9em; font-style: italic; }
.ds-rte-content hr { border: none; border-top: 1px solid #d4d4d8; }
.ds-rte-content a { color: #2563eb; text-decoration: underline; }
.ds-rte-content code { background: #f4f4f5; padding: 0.1em 0.3em; border-radius: 3px;
  font-family: ui-monospace, monospace; font-size: 0.9em; }
.ds-rte-content table { border-collapse: collapse; width: 100%; }
.ds-rte-content th, .ds-rte-content td { border: 1px solid #d4d4d8; padding: 6px 8px; }
.ds-rte-content th { background: #f4f4f5; font-weight: 700; text-align: left; }
.ds-rte-content .ProseMirror-selectednode { outline: 2px solid #2563eb; }
.ds-rte-content p.is-editor-empty:first-child::before { content: attr(data-placeholder);
  color: #a1a1aa; float: left; height: 0; pointer-events: none; }
`;
