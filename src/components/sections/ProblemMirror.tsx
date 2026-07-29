import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { problemMirror } from "@/lib/content";

/** Bloc 3 — Miroir du problème. */
export default function ProblemMirror() {
  return (
    <Section id="probleme">
      <Reveal className="mb-12 text-center">
        <p className="nc-eyebrow mb-3">{problemMirror.eyebrow}</p>
        <h2 className="nc-title text-3xl sm:text-4xl">{problemMirror.title}</h2>
      </Reveal>
      <div className="mx-auto grid max-w-3xl gap-3">
        {problemMirror.items.map((item, i) => (
          <Reveal key={i} delay={i * 60}>
            <div className="flex items-start gap-4 rounded-sm border border-line bg-card px-5 py-4 nc-shadow-3">
              <span
                aria-hidden
                className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent/10 text-xs text-accent"
              >
                ✓
              </span>
              <p className="text-[1.0625rem] leading-relaxed text-ink">{item}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
