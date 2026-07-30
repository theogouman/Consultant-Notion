import Reveal from "@/components/ui/Reveal";
import { getClientLogos } from "@/lib/logos";

/**
 * Bloc 2 — Bande de preuve : marquee (défilement horizontal infini) des
 * logos clients présents dans public/images/Logo-Clients.
 *
 * Marquee : @keyframes translateX(-50%) sur un contenu dupliqué à
 * l'identique, fondus sur les bords, pause au survol (animation-play-state)
 * et repli prefers-reduced-motion (mouvement stoppé). Cf. globals.css.
 *
 * Les logos sont des carrés 1080×1080 : on les rend dans une boîte carrée de
 * taille fixe (dimensions réservées + chargement immédiat) pour un
 * espacement rigoureusement uniforme, y compris à la jonction de boucle.
 */
export default function ProofBar() {
  const logos = getClientLogos();
  if (logos.length === 0) return null;

  return (
    <section className="border-y border-line/60 bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <Reveal>
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
                      width={80}
                      height={80}
                      className="h-16 w-16 object-contain sm:h-20 sm:w-20"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
