import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../Reveal';

import type { RichTextProps } from './types';
import type { RichNode } from '../../content/schema';

/**
 * Renders the stored document tree.
 *
 * Every node becomes a React element. Nothing is parsed as HTML and
 * dangerouslySetInnerHTML appears nowhere, so stored content cannot introduce
 * markup - text is always a text node, whatever it contains. A node type this
 * function does not know is skipped rather than thrown on, so content saved by
 * a newer build degrades instead of taking the route down.
 */
export default function RichTextBlock({ tone, eyebrow, heading, doc }: RichTextProps) {
  const bodyText = tone === 'bone' ? 'text-muted' : 'text-silver';

  return (
    <Section tone={tone}>
      <Container>
        <div className={`max-w-[68ch] ${bodyText}`}>
          {eyebrow ? (
            <Reveal className="mb-4">
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
          ) : null}
          {heading ? (
            <Reveal delay={60}>
              <h2 className="mb-6 text-3xl font-extrabold md:text-4xl">{heading}</h2>
            </Reveal>
          ) : null}
          <Reveal delay={120} className="grid gap-5">
            <Nodes nodes={doc.content} tone={tone} />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function Nodes({ nodes, tone }: { nodes?: RichNode[] | undefined; tone: 'ink' | 'bone' }) {
  if (!nodes?.length) return null;
  return (
    <>
      {nodes.map((node, i) => (
        <Node key={i} node={node} tone={tone} />
      ))}
    </>
  );
}

const alignStyle = (node: RichNode): CSSProperties | undefined =>
  node.attrs?.textAlign ? { textAlign: node.attrs.textAlign } : undefined;

function Node({ node, tone }: { node: RichNode; tone: 'ink' | 'bone' }) {
  const heading = tone === 'bone' ? 'text-ink' : 'text-bone';
  const rule = 'border-[var(--accent-line)]';

  switch (node.type) {
    case 'text':
      return <Marks node={node} />;

    case 'hardBreak':
      return <br />;

    case 'paragraph':
      // An empty paragraph is spacing the author added on purpose; keep it, but
      // give it a height so it is not collapsed away to nothing.
      return node.content?.length ? (
        <p style={alignStyle(node)}>
          <Nodes nodes={node.content} tone={tone} />
        </p>
      ) : (
        <p aria-hidden="true" className="h-2" />
      );

    case 'heading': {
      const Tag = node.attrs?.level === 3 ? 'h3' : 'h2';
      const size = Tag === 'h2' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl';
      return (
        <Tag style={alignStyle(node)} className={`mt-4 font-extrabold ${size} ${heading}`}>
          <Nodes nodes={node.content} tone={tone} />
        </Tag>
      );
    }

    case 'bulletList':
      return (
        <ul className="ml-5 grid list-disc gap-2 marker:text-[var(--accent)]">
          <Nodes nodes={node.content} tone={tone} />
        </ul>
      );

    case 'orderedList':
      return (
        <ol
          start={node.attrs?.start ?? undefined}
          className="ml-5 grid list-decimal gap-2 marker:text-[var(--accent)]"
        >
          <Nodes nodes={node.content} tone={tone} />
        </ol>
      );

    case 'listItem':
      // List items hold paragraphs. Rendering those as <p> inside <li> would
      // add block spacing between every bullet, so their children are lifted.
      return (
        <li>
          {node.content?.map((child, i) =>
            child.type === 'paragraph' ? (
              <Fragment key={i}>
                <Nodes nodes={child.content} tone={tone} />
              </Fragment>
            ) : (
              <Node key={i} node={child} tone={tone} />
            ),
          )}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote className={`border-l-2 pl-5 italic ${rule}`}>
          <Nodes nodes={node.content} tone={tone} />
        </blockquote>
      );

    case 'horizontalRule':
      return <hr className={`my-4 border-t ${rule}`} />;

    case 'table':
      return (
        // Tables are the one thing allowed to be wider than the prose column,
        // so it scrolls on its own rather than pushing the page sideways.
        <div className="-mx-1 overflow-x-auto">
          <table className={`w-full border-collapse border text-sm ${rule}`}>
            <tbody>
              <Nodes nodes={node.content} tone={tone} />
            </tbody>
          </table>
        </div>
      );

    case 'tableRow':
      return (
        <tr>
          <Nodes nodes={node.content} tone={tone} />
        </tr>
      );

    case 'tableHeader':
    case 'tableCell': {
      const Cell = node.type === 'tableHeader' ? 'th' : 'td';
      return (
        <Cell
          colSpan={node.attrs?.colspan ?? undefined}
          rowSpan={node.attrs?.rowspan ?? undefined}
          className={`border p-2.5 align-top ${rule} ${
            node.type === 'tableHeader' ? `text-left font-bold ${heading}` : ''
          }`}
        >
          <Nodes nodes={node.content} tone={tone} />
        </Cell>
      );
    }

    default:
      return null;
  }
}

/** Wraps text in its marks, innermost first. Link is applied last, outermost. */
function Marks({ node }: { node: RichNode }) {
  let out: ReactNode = node.text ?? '';
  let link: { href: string; external: boolean } | null = null;

  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        out = <strong className="font-bold">{out}</strong>;
        break;
      case 'italic':
        out = <em>{out}</em>;
        break;
      case 'underline':
        out = <u>{out}</u>;
        break;
      case 'strike':
        out = <s>{out}</s>;
        break;
      case 'code':
        out = (
          <code className="border border-[var(--accent-line)] px-1.5 py-0.5 font-mono text-[0.9em]">
            {out}
          </code>
        );
        break;
      case 'link':
        link = { href: mark.attrs.href, external: /^https?:\/\//i.test(mark.attrs.href) };
        break;
    }
  }

  if (!link) return <>{out}</>;

  const className = 'text-[var(--accent)] underline underline-offset-2';

  // Internal paths route client-side; external ones get the safety rel. The
  // href already passed the schema, so javascript: and data: cannot reach here.
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {out}
    </a>
  ) : (
    <Link to={link.href} className={className}>
      {out}
    </Link>
  );
}
