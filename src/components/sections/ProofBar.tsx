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
 * Les logos ont été normalisés à un canvas ~2:1 (~440×225) : on les rend dans
 * une boîte rectangulaire ~2:1 de taille fixe (dimensions réservées +
 * chargement immédiat) pour un espacement rigoureusement uniforme, y compris à
 * la jonction de boucle. La largeur fixe (w-32/w-40) garantit l'uniformité.
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
                      width={220}
                      height={112}
                      className="h-20 w-40 object-contain sm:h-24 sm:w-48"
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
