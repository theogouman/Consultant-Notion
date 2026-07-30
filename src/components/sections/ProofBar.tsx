import Reveal from "@/components/ui/Reveal";
import { proof } from "@/lib/content";
import { getClientLogos } from "@/lib/logos";

/**
 * Bloc 2 — Bande de preuve : le chiffre + un marquee (défilement horizontal
 * infini) des logos clients présents dans public/images/Logo-Clients.
 *
 * Marquee : @keyframes translateX(-50%) sur un contenu dupliqué à
 * l'identique, fondus sur les bords, pause au survol (animation-play-state)
 * et repli prefers-reduced-motion (mouvement stoppé). Cf. globals.css.
 */
export default function ProofBar() {
  const logos = getClientLogos();

  return (
    <section className="border-y border-line/60 bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <Reveal className="flex flex-col items-center gap-8">
          <p className="text-center text-sm font-medium uppercase tracking-[0.12em] text-muted">
            {proof.stat} · depuis 2022
          </p>

          {logos.length > 0 && (
            <div className="nc-marquee w-full" aria-label="Ils nous font confiance">
              {/* Contenu dupliqué exactement pour une boucle sans couture */}
              <div className="nc-marquee__track">
                {[...logos, ...logos].map((logo, i) => {
                  const duplicate = i >= logos.length;
                  return (
                    <div
                      className="nc-marquee__item"
                      key={`${logo.src}-${i}`}
                      aria-hidden={duplicate}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logo.src}
                        alt={duplicate ? "" : logo.name}
                        loading="lazy"
                        className="h-9 w-auto object-contain opacity-80 transition-opacity duration-[200ms] hover:opacity-100 sm:h-10"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
