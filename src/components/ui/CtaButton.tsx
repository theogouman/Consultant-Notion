"use client";

import { useBooking } from "@/modules/booking/components/BookingModalProvider";

/**
 * CTA unique de la page : ouvre le modal de réservation (booker maison).
 * Le lead choisit un créneau puis remplit le formulaire de qualification —
 * tout se passe sur la page principale, sans redirection ni route dédiée.
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
  const { open } = useBooking();

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page";
  const styles =
    variant === "primary"
      ? "nc-btn-3d text-white"
      : "border border-line bg-card text-ink hover:border-accent hover:text-accent";

  return (
    <button type="button" onClick={open} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}
