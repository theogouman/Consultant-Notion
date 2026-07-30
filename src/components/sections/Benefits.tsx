import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { benefits } from "@/lib/content";

/** Bloc 5 — Ce que vous obtenez (bénéfices). */
export default function Benefits() {
  return (
    <Section id="benefices">
      <Reveal className="mb-12 max-w-2xl">
        <p className="nc-eyebrow mb-3">{benefits.eyebrow}</p>
        <h2 className="nc-title text-3xl sm:text-4xl">{benefits.title}</h2>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2">
        {benefits.items.map((item, i) => (
          <Reveal key={i} delay={(i % 2) * 80}>
            <div className="h-full rounded-md border border-line bg-card p-7 nc-shadow-3">
              <div className="relative z-[1]">
                <span
                  aria-hidden
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xs bg-accent/10 text-lg font-bold text-accent"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="nc-title mb-2 text-xl">{item.title}</h3>
                <p className="text-[1.0625rem] leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
