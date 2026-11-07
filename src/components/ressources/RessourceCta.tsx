import CtaButton from "@/components/ui/CtaButton";
import RichText from "./RichText";
import type { SectionCta } from "@/content/ressources/types";

/**
 * CTA vers la prise de rendez-vous : réutilise `CtaButton`, qui ouvre le modal
 * du `BookingModalProvider` posé par `src/app/ressources/layout.tsx`.
 */
export default function RessourceCta({ section }: { section: SectionCta }) {
  if (section.variante === "discret") {
    return (
      <div className="flex flex-col gap-4 rounded-sm border border-line bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[1.0625rem] font-bold leading-snug text-ink">{section.titre}</p>
          {section.texte && (
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
              <RichText>{section.texte}</RichText>
            </p>
          )}
        </div>
        <CtaButton variant="ghost" className="flex-none !px-5 !py-2.5 !text-[0.9375rem]">
          {section.bouton}
          <span aria-hidden>→</span>
        </CtaButton>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line/70 bg-card px-6 py-10 text-center nc-shadow-2 sm:px-12 sm:py-14">
      <h2 className="nc-title nc-balance-wide text-[1.625rem] sm:text-[2rem]">{section.titre}</h2>
      {section.texte && (
        <p className="nc-balance-wide mt-4 text-[1.0625rem] leading-relaxed text-muted">
          <RichText>{section.texte}</RichText>
        </p>
      )}
      <div className="mt-8 flex justify-center">
        <CtaButton>
          {section.bouton}
          <span aria-hidden>→</span>
        </CtaButton>
      </div>
    </div>
  );
}
