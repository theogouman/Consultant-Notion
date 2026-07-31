import { adminCancelAction } from "@/app/admin/actions";
import { formatSlotLong, timezoneAbbrev } from "../lib/timezone";
import type { Booking } from "../types";

const SITUATION_LABEL: Record<string, string> = {
  notion_mal: "Notion, mais mal",
  pas_outil: "Pas d'outil",
};

/**
 * Liste des réservations à venir (§8). Les pending_manual remontent en tête.
 * Affichage dans le fuseau host.
 */
export default function BookingsList({
  bookings,
  hostTimezone,
}: {
  bookings: Booking[];
  hostTimezone: string;
}) {
  const sorted = [...bookings].sort((a, b) => {
    // pending_manual d'abord, puis par date.
    const pa = a.status === "pending_manual" ? 0 : 1;
    const pb = b.status === "pending_manual" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.start_utc.localeCompare(b.start_utc);
  });

  if (sorted.length === 0) {
    return <p className="text-sm text-muted">Aucune réservation à venir.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((b) => {
        const when =
          formatSlotLong(b.start_utc, hostTimezone) +
          ` (${timezoneAbbrev(b.start_utc, hostTimezone)})`;
        const pending = b.status === "pending_manual";
        return (
          <div
            key={b.id}
            className={`rounded-sm border px-4 py-4 ${
              pending ? "border-accent/50 bg-accent/5" : "border-line bg-card"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{b.lead_name}</span>
                  {pending && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-medium text-white">
                      À confirmer à la main
                    </span>
                  )}
                </div>
                <p className="text-sm capitalize text-ink">{when}</p>
                <p className="text-sm text-muted">
                  {b.lead_email}
                  {b.guest_email ? ` · invité : ${b.guest_email}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {b.activity} · {SITUATION_LABEL[b.situation] ?? b.situation}
                </p>
                {b.motivation && (
                  <p className="mt-1 text-sm text-ink/80">« {b.motivation} »</p>
                )}
              </div>

              <div className="flex flex-none flex-col items-end gap-2">
                <a
                  href={`/rdv/manage/${b.manage_token}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Reprogrammer
                </a>
                <form action={adminCancelAction}>
                  <input type="hidden" name="booking_id" value={b.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-muted transition-colors hover:text-accent"
                  >
                    Annuler
                  </button>
                </form>
                {b.meet_url && (
                  <a
                    href={b.meet_url}
                    className="text-xs text-muted hover:text-ink"
                  >
                    Meet
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
