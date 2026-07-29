import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { forWhom } from "@/lib/content";

/** Bloc 8 — À qui c'est fait / pas fait. */
export default function ForWhom() {
  return (
    <Section id="pour-qui">
      <Reveal className="mb-12 max-w-2xl">
        <p className="nc-eyebrow mb-3">{forWhom.eyebrow}</p>
        <h2 className="nc-title text-3xl sm:text-4xl">{forWhom.title}</h2>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-md border border-accent/30 bg-card p-7 nc-shadow-3">
            <h3 className="nc-title mb-5 flex items-center gap-2 text-xl">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm text-white"
              >
                ✓
              </span>
              {forWhom.forYou.title}
            </h3>
            <ul className="space-y-3">
              {forWhom.forYou.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-[1.0625rem] leading-relaxed text-ink">
                  <span aria-hidden className="mt-1 flex-none text-accent">
                    →
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="h-full rounded-md border border-line bg-raised/50 p-7">
            <h3 className="nc-title mb-5 flex items-center gap-2 text-xl text-muted">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-line text-sm text-muted"
              >
                ✕
              </span>
              {forWhom.notForYou.title}
            </h3>
            <ul className="space-y-3">
              {forWhom.notForYou.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-[1.0625rem] leading-relaxed text-muted">
                  <span aria-hidden className="mt-1 flex-none">
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
