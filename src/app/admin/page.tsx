import type { Metadata } from "next";
import { getSettings } from "@/modules/booking/server/settings";
import { getUpcomingBookings } from "@/modules/booking/server/bookings";
import SettingsForm from "@/modules/booking/admin/SettingsForm";
import BookingsList from "@/modules/booking/admin/BookingsList";
import { logoutAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Page admin unique (§8), protégée par le middleware (cookie signé).
 * Section 1 — Règles + planning. Section 2 — Réservations à venir.
 */
export default async function AdminPage() {
  const [settings, bookings] = await Promise.all([
    getSettings(),
    getUpcomingBookings(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="nc-eyebrow mb-1">Booker</p>
          <h1 className="nc-title text-3xl">Administration</h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-sm border border-line bg-card px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <section className="mb-14">
        <h2 className="nc-title mb-6 text-xl">Réservations à venir</h2>
        <BookingsList bookings={bookings} hostTimezone={settings.host_timezone} />
      </section>

      <section>
        <h2 className="nc-title mb-6 text-xl">Règles &amp; disponibilités</h2>
        <div className="rounded-md bg-card p-6 nc-shadow-2 sm:p-8">
          <SettingsForm settings={settings} />
        </div>
      </section>
    </main>
  );
}
