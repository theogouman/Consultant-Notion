import CtaButton from "@/components/ui/CtaButton";
import Reveal from "@/components/ui/Reveal";
import { hero } from "@/lib/content";

/** Bloc 1 — Hero. */
export default function Hero() {
  return (
    <section id="top" className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h1 className="nc-title nc-balance-wide text-4xl sm:text-5xl md:text-6xl">
            {hero.title}
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            {hero.subtitle}
          </p>
        </Reveal>
        <Reveal delay={180}>
          <div className="mt-9 flex flex-col items-center gap-4">
            <CtaButton>
              {hero.cta}
              <span aria-hidden>→</span>
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
