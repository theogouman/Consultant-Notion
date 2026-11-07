import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getRessource, ressources } from "@/content/ressources";
import { stripVerif } from "@/components/ressources/RichText";

export const alt = "Ressource — Théo Gouman, consultant Notion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ressources.map((r) => ({ slug: r.slug }));
}

/** Image de partage d'une ressource, sur le modèle de l'image de la home. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const r = getRessource(slug);
  const titre = r ? stripVerif(r.titre) : "Ressources";
  const tag = r?.tags[0] ?? "Ressource";

  // SF Pro Display (police du site), lue au build. Repli : police par défaut.
  const fonts = await Promise.all(
    [
      { file: "SFPRODISPLAYREGULAR.OTF", weight: 400 as const },
      { file: "SFPRODISPLAYBOLD.OTF", weight: 700 as const },
    ].map(async ({ file, weight }) => {
      try {
        const data = await readFile(path.join(process.cwd(), "public/fonts", file));
        return { name: "SF Pro Display", data, weight, style: "normal" as const };
      } catch {
        return null;
      }
    }),
  ).then((list) => list.filter((f) => f !== null));

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          // Couleur et dégradés séparés : Satori refuse une couleur en dernière
          // couche de `background`.
          backgroundColor: "#f5f2f2",
          backgroundImage:
            "radial-gradient(56% 50% at -8% 50%, rgba(224,99,90,0.35) 0%, transparent 72%), radial-gradient(56% 50% at 108% 50%, rgba(224,99,90,0.32) 0%, transparent 72%)",
          fontFamily: fonts.length ? "SF Pro Display" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#000", letterSpacing: "-0.02em" }}>
            Théo Gouman
          </div>
          <div style={{ width: 12, height: 12, borderRadius: 9999, background: "#e0625a" }} />
          <div style={{ fontSize: 26, color: "#52525b" }}>Ressources</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              color: "#e0625a",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: titre.length > 60 ? 62 : 72,
              fontWeight: 700,
              color: "#000",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {titre}
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#52525b" }}>
            consultant-notion.fr/ressources
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
