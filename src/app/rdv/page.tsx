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

      <div className="w-full max-w-xl rounded-md bg-card p-6 nc-shadow-2 sm:p-8">
        <header className="mb-6">
          <p className="nc-eyebrow mb-2">Appel de qualification</p>
          <h1 className="nc-title text-2xl sm:text-3xl">Faisons le point.</h1>
          <p className="mt-2 text-[0.95rem] text-muted">
            20 minutes, gratuit, sans engagement. Je vous dis franchement si je
            peux vous aider.
          </p>
        </header>

        <BookingFlow />
      </div>
    </main>
  );
}
