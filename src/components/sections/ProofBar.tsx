import Reveal from "@/components/ui/Reveal";
import { proof } from "@/lib/content";

/**
 * Bloc 2 — Bande de preuve : logos clients + le chiffre. Sobre, immédiat.
 * [À AFFINER] — remplacer les placeholders par les logos autorisés.
 */
export default function ProofBar() {
  return (
    <section className="border-y border-line/60 bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <Reveal className="flex flex-col items-center gap-8">
          <p className="text-center text-sm font-medium uppercase tracking-[0.12em] text-muted">
            {proof.stat} · depuis 2022
          </p>
          <div className="flex w-full flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
            {proof.logos.map((logo, i) => (
              <span
                key={i}
                className="text-base font-medium text-muted/70"
                /* Placeholder logo — remplacer par next/image quand fournis. */
              >
                {logo}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
