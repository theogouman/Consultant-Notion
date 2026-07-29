import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { faq } from "@/lib/content";

/** Bloc 10 — FAQ (objections). Accordéons natifs (accessibles, sans JS). */
export default function Faq() {
  return (
    <Section id="faq" width="narrow">
      <Reveal className="mb-10 text-center">
        <p className="nc-eyebrow mb-3">{faq.eyebrow}</p>
        <h2 className="nc-title text-3xl sm:text-4xl">{faq.title}</h2>
      </Reveal>
      <div className="space-y-3">
        {faq.items.map((item, i) => (
          <Reveal key={i} delay={i * 40}>
            <details className="group rounded-sm border border-line bg-card px-6 py-1 nc-shadow-3 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.0625rem] font-medium text-ink">
                {item.q}
                <span
                  aria-hidden
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-raised text-accent transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[1.0625rem] leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
