import Image from "next/image";
import { footer } from "@/lib/content";

/**
 * Pied de page : avatar à gauche, identité à droite (nom, activité, mention
 * légale avec tooltip SIREN, réseaux sociaux).
 */
export default function Footer() {
  return (
    <footer className="border-t border-line/60 bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Colonne gauche : avatar */}
          <Image
            src={footer.avatar}
            alt="Théo Gouman"
            width={72}
            height={72}
            className="h-16 w-16 flex-none object-contain sm:h-[72px] sm:w-[72px]"
          />

          {/* Colonne droite : identité */}
          <div className="min-w-0">
            <p className="font-bold text-ink">{footer.name}</p>
            <p className="mt-1 text-sm text-muted">{footer.tagline}</p>
            <p className="mt-1 text-sm text-muted">
              {/* Mention légale : tooltip SIREN au survol (transitions.dev). */}
              <span className="t-tt-wrap">
                <span className="cursor-help underline decoration-dotted decoration-muted/40 underline-offset-2">
                  {footer.operatedBy}
                </span>
                <span className="t-tt" role="tooltip">
                  {footer.siren}
                </span>
              </span>{" "}
              🇫🇷
            </p>

            <div className="mt-3 flex items-center gap-3">
              {footer.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="opacity-60 transition-opacity hover:opacity-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.icon} alt="" width={20} height={20} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
