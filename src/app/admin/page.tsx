import type { Metadata } from "next";
import { getSettings } from "@/modules/booking/server/settings";
import { getFunnelLog } from "@/modules/booking/server/funnel";
import { listBookingLinks } from "@/modules/booking/server/links";
import { baseUrl } from "@/modules/booking/emails/links";
import SettingsForm from "@/modules/booking/admin/SettingsForm";
import AdminTabs from "@/modules/booking/admin/AdminTabs";
import FunnelLog from "@/modules/booking/admin/FunnelLog";
import PlanningLinks from "@/modules/booking/admin/PlanningLinks";
import { logoutAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Page admin unique, protégée par le middleware (cookie signé).
 * Trois sections : Logs (journal du tunnel), Liens de planification, Réglages.
 */
export default async function AdminPage() {
  const [settings, log, links] = await Promise.all([
    getSettings(),
    getFunnelLog(150),
    listBookingLinks(),
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

      <AdminTabs
        logs={<FunnelLog entries={log} hostTimezone={settings.host_timezone} />}
        links={<PlanningLinks links={links} baseUrl={baseUrl()} />}
        settings={
          <section>
            <h2 className="nc-title mb-6 text-xl">Règles &amp; disponibilités</h2>
            <div className="rounded-md bg-card p-6 nc-shadow-2 sm:p-8">
              <SettingsForm settings={settings} />
            </div>
          </section>
        }
      />
    </main>
  );
}
