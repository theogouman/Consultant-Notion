import Reveal from "@/components/ui/Reveal";
import QualificationForm from "@/components/form/QualificationForm";
import { finalCta } from "@/lib/content";

/** Bloc 11 — CTA final + formulaire de qualification. */
export default function FinalCta() {
  return (
    <section id="rendez-vous" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-md border border-line bg-card nc-shadow-2">
          <div className="relative border-b border-line bg-gradient-to-b from-accent/[0.07] to-transparent px-8 py-10 text-center sm:px-12">
            <Reveal>
              <p className="nc-eyebrow mb-3">{finalCta.eyebrow}</p>
              <h2 className="nc-title text-3xl sm:text-4xl">{finalCta.title}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
                {finalCta.reassurance}
              </p>
            </Reveal>
          </div>
          <div className="px-8 py-10 sm:px-12">
            <QualificationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
