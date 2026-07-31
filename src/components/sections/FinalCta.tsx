import Reveal from "@/components/ui/Reveal";
import CtaButton from "@/components/ui/CtaButton";
import { finalCta } from "@/lib/content";

/** Bloc 11 — CTA final. Ouvre le formulaire de qualification en modal. */
export default function FinalCta() {
  return (
    <section id="rendez-vous" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-md border border-line bg-card nc-shadow-2">
          <div className="relative bg-gradient-to-b from-accent/[0.07] to-transparent px-8 py-12 text-center sm:px-12 sm:py-16">
            <Reveal>
              <p className="nc-eyebrow mb-3">{finalCta.eyebrow}</p>
              <h2 className="nc-title text-3xl sm:text-4xl">{finalCta.title}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
                {finalCta.reassurance}
              </p>
              <div className="mt-8 flex justify-center">
                <CtaButton>
                  Faire le point sur mon organisation <span aria-hidden>→</span>
                </CtaButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
