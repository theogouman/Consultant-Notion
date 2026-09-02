import "server-only";

/**
 * Client API Notion — server-only.
 * Repris de Notion-Club/Infrastructure (src/shared/lib/notion/client.ts) :
 * queryDatabaseAll, getPage, helpers getTitle / getMultiSelect /
 * getFirstFileUrl, normalizeNotionId.
 *
 * Le token est lu côté serveur uniquement (NOTION_API_TOKEN). Aucun appel
 * n'est jamais fait depuis le navigateur. En l'absence de token, les
 * fonctions renvoient des valeurs vides pour que le build reste robuste.
 */

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

/* eslint-disable @typescript-eslint/no-explicit-any */

function token(): string | null {
  return process.env.NOTION_API_TOKEN || null;
}

/** Normalise un ID Notion (avec ou sans tirets) vers la forme à tirets. */
export function normalizeNotionId(raw: string): string {
  const clean = raw.replace(/[^a-fA-F0-9]/g, "");
  if (clean.length !== 32) return raw;
  return [
    clean.slice(0, 8),
    clean.slice(8, 12),
    clean.slice(12, 16),
    clean.slice(16, 20),
    clean.slice(20),
  ].join("-");
}

async function notionFetch(
  path: string,
  init?: RequestInit,
): Promise<any | null> {
  const t = token();
  if (!t) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[notion] NOTION_API_TOKEN absent — contenu Notion ignoré (build robuste).",
      );
    }
    return null;
  }

  try {
    // Par défaut : ISR (revalidate 3600). Si l'appelant demande no-store
    // (proxy d'images), on n'ajoute pas `next.revalidate` (incompatibles).
    const noStore = init?.cache === "no-store";
    const res = await fetch(`${NOTION_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${t}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...(noStore ? {} : { next: { revalidate: 3600 } }),
    });

    if (!res.ok) {
      console.error(`[notion] ${path} → ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[notion] appel échoué :", err);
    return null;
  }
}

/**
 * Récupère toutes les pages d'une base (pagination automatique).
 * `noStore` court-circuite le cache ISR : indispensable pour les lectures
 * transactionnelles (recherche d'une fiche CRM au moment d'une réservation).
 */
export async function queryDatabaseAll(
  databaseId: string,
  body: Record<string, unknown> = {},
  opts?: { noStore?: boolean },
): Promise<any[]> {
  const id = normalizeNotionId(databaseId);
  const results: any[] = [];
  let cursor: string | undefined;

  do {
    const data = await notionFetch(`/databases/${id}/query`, {
      method: "POST",
      ...(opts?.noStore ? { cache: "no-store" as const } : {}),
      body: JSON.stringify({
        ...body,
        ...(cursor ? { start_cursor: cursor } : {}),
        page_size: 100,
      }),
    });
    if (!data) break;
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

/** Récupère tous les blocs enfants d'une page (pagination automatique). */
export async function getPage(pageId: string): Promise<any[]> {
  const id = normalizeNotionId(pageId);
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const data = await notionFetch(
      `/blocks/${id}/children?page_size=100${
        cursor ? `&start_cursor=${cursor}` : ""
      }`,
    );
    if (!data) break;
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/** Récupère les blocs enfants d'un bloc donné (pour l'imbrication). */
export async function getBlockChildren(blockId: string): Promise<any[]> {
  return getPage(blockId);
}

/**
 * Récupère les propriétés d'une page (GET /pages/{id}).
 * Utilisé par le proxy d'images pour obtenir une URL de fichier Notion
 * fraîche (non expirée) à la demande. `noStore` désactive le cache Next
 * (le proxy gère lui-même la mise en cache CDN via ses en-têtes).
 */
export async function retrievePage(
  pageId: string,
  opts?: { noStore?: boolean },
): Promise<any | null> {
  const id = normalizeNotionId(pageId);
  return notionFetch(
    `/pages/${id}`,
    opts?.noStore ? { cache: "no-store" } : undefined,
  );
}

/* ------------------------------------------------------------------ */
/* Écriture (CRM)                                                      */
/* ------------------------------------------------------------------ */

/**
 * Crée une page dans une base (POST /pages). Renvoie la page créée, ou `null`
 * si l'appel échoue (token absent, base non partagée avec l'intégration,
 * propriété inconnue...). Les appelants traitent l'écriture en best-effort :
 * un CRM indisponible ne doit jamais faire échouer un parcours utilisateur.
 */
export async function createPage(
  databaseId: string,
  properties: Record<string, any>,
): Promise<any | null> {
  return notionFetch("/pages", {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({
      parent: { database_id: normalizeNotionId(databaseId) },
      properties,
    }),
  });
}

/** Met à jour les propriétés d'une page (PATCH /pages/{id}). Best-effort. */
export async function updatePage(
  pageId: string,
  properties: Record<string, any>,
): Promise<any | null> {
  return notionFetch(`/pages/${normalizeNotionId(pageId)}`, {
    method: "PATCH",
    cache: "no-store",
    body: JSON.stringify({ properties }),
  });
}

/* ------------------------------------------------------------------ */
/* Helpers de lecture de propriétés                                    */
/* ------------------------------------------------------------------ */

/** Extrait le texte d'une propriété `title`. */
export function getTitle(properties: any, name: string): string {
  const prop = properties?.[name];
  if (!prop || prop.type !== "title") return "";
  return (prop.title || []).map((t: any) => t.plain_text).join("").trim();
}

/** Extrait les valeurs d'une propriété `multi_select`. */
export function getMultiSelect(properties: any, name: string): string[] {
  const prop = properties?.[name];
  if (!prop || prop.type !== "multi_select") return [];
  return (prop.multi_select || []).map((o: any) => o.name);
}

/** Extrait le texte d'une propriété `rich_text`. */
export function getRichText(properties: any, name: string): string {
  const prop = properties?.[name];
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text || []).map((t: any) => t.plain_text).join("").trim();
}

/** Extrait la première URL d'une propriété `files`. */
export function getFirstFileUrl(properties: any, name: string): string | null {
  const prop = properties?.[name];
  if (!prop || prop.type !== "files") return null;
  const file = (prop.files || [])[0];
  if (!file) return null;
  if (file.type === "external") return file.external?.url || null;
  if (file.type === "file") return file.file?.url || null;
  return null;
}
