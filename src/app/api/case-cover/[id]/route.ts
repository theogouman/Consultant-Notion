import type { NextRequest } from "next/server";
import { getFreshCoverUrl } from "@/lib/notion/case-studies";

/**
 * Proxy d'images de couverture des études de cas.
 *
 * Pourquoi : Notion sert les fichiers via des URLs S3 pré-signées qui
 * expirent au bout d'une heure (X-Amz-Expires=3600). Embarquées telles quelles
 * dans le HTML statique (revalidate=3600), elles cassent sur trafic froid dès
 * que la signature est expirée. Ce proxy :
 *   1. résout une URL Notion FRAÎCHE côté serveur, à la demande ;
 *   2. streame les octets sous une URL stable `/api/case-cover/[id]` ;
 *   3. laisse le CDN Vercel mettre en cache le résultat (Cache-Control),
 *      donc le client ne voit jamais l'URL signée qui expire.
 */

export const dynamic = "force-dynamic"; // résolution fraîche ; cache géré par en-têtes

// Accepte un id Notion avec ou sans tirets (32 hex, ou UUID à tirets).
const ID_RE = /^[0-9a-fA-F]{32}$|^[0-9a-fA-F-]{36}$/;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) {
    return new Response("Bad request", { status: 400 });
  }

  let url: string | null = null;
  try {
    url = await getFreshCoverUrl(id);
  } catch {
    url = null;
  }
  if (!url) return new Response(null, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store" });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // Le CDN garde les octets sous l'URL stable : fiable même quand la
      // signature S3 d'origine a expiré. Rafraîchi ~1 j, servi périmé jusqu'à 30 j.
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=2592000",
    },
  });
}
