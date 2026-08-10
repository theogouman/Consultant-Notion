import Reveal from "@/components/ui/Reveal";
import BookingFlow from "@/modules/booking/components/BookingFlow";
import { finalCta } from "@/lib/content";

/**
 * Bloc 11 — CTA final. Le système de prise de rendez-vous (booker maison) est
 * embarqué directement dans la page : c'est le MÊME composant `BookingFlow`
 * que celui ouvert en modal par les CTA (aucun système en doublon).
 */
export default function FinalCta() {
  return (
    <section id="rendez-vous" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <Reveal className="mb-8 text-center">
          <p className="nc-eyebrow mb-3">{finalCta.eyebrow}</p>
          <h2 className="nc-title text-3xl sm:text-4xl">{finalCta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
            {finalCta.reassurance}
          </p>
        </Reveal>

        <Reveal>
          <div className="flex flex-col overflow-hidden rounded-md border border-line bg-card nc-shadow-2">
            <BookingFlow />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
