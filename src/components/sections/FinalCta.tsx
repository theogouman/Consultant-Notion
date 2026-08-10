import Reveal from "@/components/ui/Reveal";
import EmbeddedBooking from "@/components/sections/EmbeddedBooking";
import { finalCta } from "@/lib/content";

/**
 * Bloc 11 — Rendez-vous. Le système de prise de rendez-vous (booker maison)
 * est embarqué directement dans la page : c'est le MÊME composant que celui
 * ouvert en modal par les CTA (aucun système en doublon). Le seul titre
 * affiché est celui de l'encadré, propre à cette section.
 */
export default function FinalCta() {
  return (
    <section id="rendez-vous" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Reveal>
          <EmbeddedBooking heading={finalCta.bookingHeading} />
        </Reveal>
      </div>
    </section>
  );
}
