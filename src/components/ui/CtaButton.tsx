"use client";

import { useQualification } from "@/components/form/QualificationProvider";

/**
 * CTA unique de la page : ouvre le formulaire de qualification en modal
 * (multi-étapes). Un seul type de CTA sur toute la landing.
 */
export default function CtaButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const { open } = useQualification();

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page";
  const styles =
    variant === "primary"
      ? "bg-accent text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] hover:bg-[#d1504a] hover:-translate-y-0.5"
      : "border border-line bg-card text-ink hover:border-accent hover:text-accent";

  return (
    <button
      type="button"
      onClick={open}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
