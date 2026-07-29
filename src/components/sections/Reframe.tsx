import Section from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { reframe } from "@/lib/content";

/** Bloc 4 — Le reframe (l'angle : faire moins pour faire mieux). */
export default function Reframe() {
  return (
    <div className="relative">
      <Section id="approche" width="narrow">
        <Reveal>
          <p className="nc-eyebrow mb-4">{reframe.eyebrow}</p>
          <h2 className="nc-title text-3xl sm:text-4xl md:text-[2.75rem]">
            {reframe.title}
          </h2>
        </Reveal>
        <div className="mt-8 space-y-5">
          {reframe.paragraphs.map((p, i) => (
            <Reveal key={i} delay={i * 60}>
              <p className="text-lg leading-relaxed text-muted">{p}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mt-8 border-l-2 border-accent pl-5 text-xl font-medium leading-relaxed text-ink">
            {reframe.highlight}
          </p>
        </Reveal>
      </Section>
    </div>
  );
}
