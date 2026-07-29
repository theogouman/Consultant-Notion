import type { NotionBlock, RichText } from "@/lib/notion/types";

/**
 * Rend `NotionBlock[]` dans la direction artistique de la landing.
 * Repris de Notion-Club/Infrastructure (NotionRenderer.tsx), adapté aux tokens.
 * Composant purement présentationnel — utilisable côté client (morph) ou serveur.
 */

function RichTextRun({ runs }: { runs?: RichText[] }) {
  if (!runs || runs.length === 0) return null;
  return (
    <>
      {runs.map((run, i) => {
        let node: React.ReactNode = run.text;
        if (run.code)
          node = (
            <code className="rounded bg-raised px-1.5 py-0.5 text-[0.9em] text-ink">
              {node}
            </code>
          );
        if (run.bold) node = <strong className="font-bold">{node}</strong>;
        if (run.italic) node = <em className="italic">{node}</em>;
        if (run.underline) node = <u>{node}</u>;
        if (run.strikethrough) node = <s>{node}</s>;
        if (run.href)
          node = (
            <a
              href={run.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
            >
              {node}
            </a>
          );
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

function Block({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case "paragraph":
      if (!block.richText?.some((r) => r.text)) return <div className="h-4" />;
      return (
        <p className="text-[1.0625rem] leading-relaxed text-muted">
          <RichTextRun runs={block.richText} />
        </p>
      );

    case "heading_1":
      return (
        <h2 className="nc-title mt-8 text-2xl sm:text-3xl">
          <RichTextRun runs={block.richText} />
        </h2>
      );
    case "heading_2":
      return (
        <h3 className="nc-title mt-6 text-xl sm:text-2xl">
          <RichTextRun runs={block.richText} />
        </h3>
      );
    case "heading_3":
      return (
        <h4 className="nc-title mt-4 text-lg sm:text-xl">
          <RichTextRun runs={block.richText} />
        </h4>
      );

    case "bulleted_list_item":
      return (
        <li className="ml-5 list-disc text-[1.0625rem] leading-relaxed text-muted marker:text-accent">
          <RichTextRun runs={block.richText} />
          {block.children && <BlockList blocks={block.children} />}
        </li>
      );
    case "numbered_list_item":
      return (
        <li className="ml-5 list-decimal text-[1.0625rem] leading-relaxed text-muted marker:text-accent">
          <RichTextRun runs={block.richText} />
          {block.children && <BlockList blocks={block.children} />}
        </li>
      );

    case "to_do":
      return (
        <div className="flex items-start gap-2 text-[1.0625rem] leading-relaxed text-muted">
          <span
            aria-hidden
            className={`mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded border ${
              block.checked
                ? "border-accent bg-accent text-white"
                : "border-line"
            }`}
          >
            {block.checked ? "✓" : ""}
          </span>
          <span className={block.checked ? "line-through" : ""}>
            <RichTextRun runs={block.richText} />
          </span>
        </div>
      );

    case "toggle":
      return (
        <details className="rounded-xs border border-line bg-card px-4 py-3">
          <summary className="cursor-pointer text-[1.0625rem] font-medium text-ink">
            <RichTextRun runs={block.richText} />
          </summary>
          {block.children && (
            <div className="mt-3 space-y-3">
              <BlockList blocks={block.children} />
            </div>
          )}
        </details>
      );

    case "quote":
      return (
        <blockquote className="border-l-2 border-accent pl-4 text-[1.0625rem] italic leading-relaxed text-ink">
          <RichTextRun runs={block.richText} />
          {block.children && (
            <div className="mt-2 space-y-2 not-italic">
              <BlockList blocks={block.children} />
            </div>
          )}
        </blockquote>
      );

    case "callout":
      return (
        <div className="flex gap-3 rounded-sm border border-line bg-raised px-4 py-3">
          {block.icon && <span aria-hidden>{block.icon}</span>}
          <div className="text-[1.0625rem] leading-relaxed text-ink">
            <RichTextRun runs={block.richText} />
            {block.children && (
              <div className="mt-2 space-y-2">
                <BlockList blocks={block.children} />
              </div>
            )}
          </div>
        </div>
      );

    case "code":
      return (
        <pre className="overflow-x-auto rounded-sm border border-line bg-raised p-4 text-sm">
          <code>
            {(block.richText || []).map((r) => r.text).join("")}
          </code>
        </pre>
      );

    case "image":
      if (!block.url) return null;
      return (
        <figure className="my-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={(block.caption || []).map((c) => c.text).join("") || ""}
            loading="lazy"
            className="w-full rounded-sm border border-line"
          />
          {block.caption && block.caption.length > 0 && (
            <figcaption className="mt-2 text-center text-sm text-muted">
              <RichTextRun runs={block.caption} />
            </figcaption>
          )}
        </figure>
      );

    case "video":
    case "embed":
      if (!block.url) return null;
      return (
        <div className="aspect-video overflow-hidden rounded-sm border border-line">
          <iframe
            src={block.url}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Contenu intégré"
          />
        </div>
      );

    case "file":
    case "bookmark":
      if (!block.url) return null;
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-sm border border-line bg-card px-4 py-3 text-[1.0625rem] text-accent transition-colors hover:border-accent"
        >
          <RichTextRun runs={block.richText} />
          {(!block.richText || block.richText.length === 0) && block.url}
        </a>
      );

    case "divider":
      return <hr className="my-6 border-line" />;

    case "column_list":
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          {(block.children || []).map((col) => (
            <div key={col.id} className="space-y-4">
              <BlockList blocks={col.children || []} />
            </div>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.95rem]">
            <tbody>
              {(block.children || []).map((row) => (
                <tr key={row.id} className="border-b border-line">
                  {(row.children || []).map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-top text-muted">
                      <RichTextRun runs={cell.richText} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Regroupe les items de liste consécutifs dans <ul>/<ol> et rend le reste.
 */
function BlockList({ blocks }: { blocks: NotionBlock[] }) {
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const b = blocks[i];
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const ordered = b.type === "numbered_list_item";
      const group: NotionBlock[] = [];
      while (
        i < blocks.length &&
        blocks[i].type ===
          (ordered ? "numbered_list_item" : "bulleted_list_item")
      ) {
        group.push(blocks[i]);
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      out.push(
        <ListTag key={`list-${b.id}`} className="space-y-1.5">
          {group.map((item) => (
            <Block key={item.id} block={item} />
          ))}
        </ListTag>,
      );
    } else {
      out.push(<Block key={b.id} block={b} />);
      i++;
    }
  }

  return <>{out}</>;
}

export default function NotionRenderer({ blocks }: { blocks: NotionBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-[1.0625rem] leading-relaxed text-muted">
        Le détail de cette étude de cas sera bientôt disponible.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <BlockList blocks={blocks} />
    </div>
  );
}
