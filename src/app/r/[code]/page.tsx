import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookingLinkByCode } from "@/modules/booking/server/links";
import BookingFlow from "@/modules/booking/components/BookingFlow";

export const metadata: Metadata = {
  title: "Réserver un appel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Lien de planification personnalisé : le prospect arrive avec ses infos déjà
 * connues (nom + e-mail), il n'a qu'à choisir un créneau. Les questions de
 * qualification sont masquées. Les données viennent du lien (côté serveur).
 */
export default async function PlanningLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const link = await getBookingLinkByCode(code);
  if (!link) notFound();

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
