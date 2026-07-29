import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import CtaButton from "@/components/ui/CtaButton";
import { howItWorks as process } from "@/lib/content";

/** Bloc 6 — Comment ça se passe (4 étapes). */
export default function Process() {
  return (
    <Section id="deroule">
      <Reveal className="mb-12 max-w-2xl">
        <p className="nc-eyebrow mb-3">{process.eyebrow}</p>
        <h2 className="nc-title text-3xl sm:text-4xl">{process.title}</h2>
      </Reveal>
      <ol className="relative space-y-8 border-l border-line pl-8 sm:space-y-10">
        {process.steps.map((step, i) => (
          <Reveal as="li" key={i} delay={i * 60} className="relative">
            <span
              aria-hidden
              className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-sm font-bold text-accent nc-shadow-3"
            >
              {i + 1}
            </span>
            <h3 className="nc-title mb-1.5 text-xl">{step.title}</h3>
            <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
              {step.body}
            </p>
          </Reveal>
        ))}
      </ol>
      <Reveal className="mt-12">
        <CtaButton variant="ghost">
          Faire le point sur mon organisation <span aria-hidden>→</span>
        </CtaButton>
      </Reveal>
    </Section>
  );
}
