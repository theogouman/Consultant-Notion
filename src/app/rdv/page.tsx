import type { Metadata } from "next";
import Link from "next/link";
import BookingFlow from "@/modules/booking/components/BookingFlow";

export const metadata: Metadata = {
  title: "Réserver un appel",
  description:
    "Réservez votre appel de qualification avec Théo Gouman, consultant Notion. 20 minutes, gratuit, sans engagement.",
  robots: { index: false, follow: true },
};

// Route dynamique : les disponibilités sont calculées à la demande.
export const dynamic = "force-dynamic";

/**
 * Route publique du booker maison (§2). Le lead choisit un créneau puis remplit
 * le formulaire de qualification, sans redirection externe.
 */
export default function RdvPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← consultant-notion.fr
        </Link>
      </div>

      {/* Carte-modal. Padding + barre de progression gérés dans BookingFlow ;
          `relative` positionne la barre collée au haut de la carte. */}
      <div className="relative w-full max-w-xl rounded-md bg-card nc-shadow-2">
        <BookingFlow />
      </div>
    </main>
  );
}
