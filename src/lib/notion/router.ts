import "server-only";
import { getBlockChildren } from "./client";
import type { NotionBlock, NotionBlockType, RichText } from "./types";

/**
 * Normalise les blocs Notion bruts en `NotionBlock[]`.
 * Repris de Notion-Club/Infrastructure (src/shared/lib/notion/router.ts).
 * ~30 types supportés ; les blocs à enfants sont résolus récursivement.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapRichText(rich: any[] = []): RichText[] {
  return rich.map((r) => ({
    text: r.plain_text ?? "",
    bold: !!r.annotations?.bold,
    italic: !!r.annotations?.italic,
    strikethrough: !!r.annotations?.strikethrough,
    underline: !!r.annotations?.underline,
    code: !!r.annotations?.code,
    color:
      r.annotations?.color && r.annotations.color !== "default"
        ? r.annotations.color
        : undefined,
    href: r.href ?? null,
  }));
}

function fileUrl(node: any): string | null {
  if (!node) return null;
  if (node.type === "external") return node.external?.url ?? null;
  if (node.type === "file") return node.file?.url ?? null;
  return null;
}

const HAS_CHILDREN_CONTAINERS = new Set<NotionBlockType>([
  "toggle",
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
  "quote",
  "callout",
  "column_list",
  "column",
  "table",
]);

/** Convertit un bloc brut, en résolvant récursivement ses enfants. */
async function normalizeBlock(raw: any): Promise<NotionBlock | null> {
  const type = raw.type as string;
  const data = raw[type];

  const base: NotionBlock = {
    id: raw.id,
    type: "unsupported" as NotionBlockType,
  };

  const withChildren = async (block: NotionBlock): Promise<NotionBlock> => {
    if (raw.has_children && HAS_CHILDREN_CONTAINERS.has(block.type)) {
      const rawChildren = await getBlockChildren(raw.id);
      block.children = await normalizeBlocks(rawChildren);
    }
    return block;
  };

  switch (type) {
    case "paragraph":
      return { ...base, type: "paragraph", richText: mapRichText(data.rich_text) };

    case "heading_1":
      return { ...base, type: "heading_1", level: 1, richText: mapRichText(data.rich_text) };
    case "heading_2":
      return { ...base, type: "heading_2", level: 2, richText: mapRichText(data.rich_text) };
    case "heading_3":
      return { ...base, type: "heading_3", level: 3, richText: mapRichText(data.rich_text) };

    case "bulleted_list_item":
      return withChildren({ ...base, type: "bulleted_list_item", richText: mapRichText(data.rich_text) });
    case "numbered_list_item":
      return withChildren({ ...base, type: "numbered_list_item", richText: mapRichText(data.rich_text) });
    case "to_do":
      return withChildren({ ...base, type: "to_do", richText: mapRichText(data.rich_text), checked: !!data.checked });
    case "toggle":
      return withChildren({ ...base, type: "toggle", richText: mapRichText(data.rich_text) });
    case "quote":
      return withChildren({ ...base, type: "quote", richText: mapRichText(data.rich_text) });

    case "callout":
      return withChildren({
        ...base,
        type: "callout",
        richText: mapRichText(data.rich_text),
        icon: data.icon?.emoji ?? null,
      });

    case "code":
      return {
        ...base,
        type: "code",
        richText: mapRichText(data.rich_text),
        language: data.language ?? "plain text",
        caption: mapRichText(data.caption),
      };

    case "image":
      return {
        ...base,
        type: "image",
        url: fileUrl(data),
        caption: mapRichText(data.caption),
      };
    case "video":
      return { ...base, type: "video", url: fileUrl(data), caption: mapRichText(data.caption) };
    case "file":
      return {
        ...base,
        type: "file",
        url: fileUrl(data),
        caption: mapRichText(data.caption),
        richText: mapRichText(data.name ? [{ plain_text: data.name }] : []),
      };

    case "bookmark":
      return { ...base, type: "bookmark", url: data.url ?? null, caption: mapRichText(data.caption) };
    case "embed":
      return { ...base, type: "embed", url: data.url ?? null };

    case "divider":
      return { ...base, type: "divider" };

    case "column_list":
      return withChildren({ ...base, type: "column_list" });
    case "column":
      return withChildren({ ...base, type: "column" });

    case "table":
      return withChildren({ ...base, type: "table" });
    case "table_row":
      return {
        ...base,
        type: "table_row",
        children: (data.cells || []).map((cell: any[], i: number) => ({
          id: `${raw.id}-cell-${i}`,
          type: "paragraph" as NotionBlockType,
          richText: mapRichText(cell),
        })),
      };

    default:
      return { ...base, type: "unsupported" };
  }
}

/** Normalise une liste de blocs bruts (en parallèle). */
export async function normalizeBlocks(rawBlocks: any[]): Promise<NotionBlock[]> {
  const normalized = await Promise.all(rawBlocks.map(normalizeBlock));
  return normalized.filter((b): b is NotionBlock => b !== null && b.type !== "unsupported");
}
