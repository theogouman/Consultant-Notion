import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Liste les logos clients présents dans public/images/Logo-Clients au
 * build (et à la revalidation ISR — les fichiers sont inclus dans la
 * fonction via `outputFileTracingIncludes` dans next.config).
 *
 * Déposer/retirer un fichier image dans le dossier suffit à mettre à jour
 * la bande de logos, sans toucher au code.
 */

export interface ClientLogo {
  src: string;
  name: string;
}

const IMAGE_RE = /\.(png|jpe?g|svg|webp|avif|gif)$/i;

export function getClientLogos(): ClientLogo[] {
  try {
    const dir = join(process.cwd(), "public", "images", "Logo-Clients");
    return readdirSync(dir)
      .filter((f) => !f.startsWith(".") && IMAGE_RE.test(f))
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((f) => ({
        src: `/images/Logo-Clients/${encodeURIComponent(f)}`,
        name: f.replace(IMAGE_RE, "").replace(/[._]+/g, " ").trim(),
      }));
  } catch {
    return [];
  }
}
