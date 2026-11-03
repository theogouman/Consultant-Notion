import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingLinkByCode } from "@/modules/booking/server/links";
import { getBookingById } from "@/modules/booking/server/bookings";
import BookingFlow from "@/modules/booking/components/BookingFlow";
import ManageBooking from "@/modules/booking/components/ManageBooking";

export const metadata: Metadata = {
  title: "Réserver un appel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Lien de planification personnalisé : le prospect arrive avec ses infos déjà
 * connues (nom + e-mail), il n'a qu'à choisir un créneau. Les questions de
 * qualification sont masquées. Les données viennent du lien (côté serveur).
 *
 * Lien « ponctuel » (one_time) déjà réservé : au lieu de planifier un nouvel
 * appel, on affiche la vue de gestion du rendez-vous (comme le lien envoyé par
 * e-mail) avec un titre « déjà réservé » et un CTA pour modifier le créneau.
 */
export default async function PlanningLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const link = await getBookingLinkByCode(code);
  if (!link) notFound();

  // Lien ponctuel déjà consommé -> gestion du rendez-vous existant.
  if (link.kind === "one_time" && link.booking_id) {
    const booking = await getBookingById(link.booking_id);
    if (booking) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
          <div className="w-full rounded-2xl border border-line bg-card p-6 nc-shadow-2 sm:p-8">
            <ManageBooking
              token={booking.manage_token}
              startUtc={booking.start_utc}
              leadTimezone={booking.lead_timezone}
              leadName={booking.lead_name}
              status={booking.status}
              meetUrl={booking.meet_url}
              alreadyBooked
            />
          </div>
        </main>
      );
    }
    // Réservation supprimée : on retombe sur le parcours de réservation.
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
      <div className="overflow-hidden rounded-2xl border border-line bg-card nc-shadow-2">
        <BookingFlow
          heading={{
            title: `Quand est-ce qu'on se parle, ${link.first_name} ?`,
            subtitle: "On cale un premier échange pour parler de ton organisation.",
          }}
          prefill={{
            linkCode: link.code,
            firstName: link.first_name,
            lastName: link.last_name,
            email: link.email,
          }}
        />
      </div>
    </main>
  );
}
