import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingByToken } from "@/modules/booking/server/bookings";
import ManageBooking from "@/modules/booking/components/ManageBooking";

export const metadata: Metadata = {
  title: "Gérer mon rendez-vous",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Page publique de gestion d'une réservation via lien tokenisé (§6).
 * Le jeton (dans l'URL) autorise l'accès à CETTE réservation uniquement.
 */
export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

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
        <ManageBooking
          token={token}
          startUtc={booking.start_utc}
          leadTimezone={booking.lead_timezone}
          leadName={booking.lead_name}
          status={booking.status}
          meetUrl={booking.meet_url}
        />
      </div>
    </main>
  );
}
