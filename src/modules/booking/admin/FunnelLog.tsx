"use client";

import { useMemo, useState } from "react";
import { formatSlotLong, timezoneAbbrev } from "../lib/timezone";
import { formatAcquisitionChannel } from "../lib/acquisition";
import type { FunnelLogEntry } from "../types";

const SITUATION_LABEL: Record<string, string> = {
  notion_mal: "Notion, mais mal",
  pas_outil: "Pas d'outil",
};

type Tag = { label: string; cls: string };

/** Tag dérivé du statut de session + statut réel du booking. */
function tagOf(e: FunnelLogEntry): Tag {
  if (e.status === "abandoned")
    return { label: "Abandonné", cls: "bg-ink/10 text-ink" };
  if (e.status === "in_progress")
    return { label: "En cours", cls: "bg-blue-100 text-blue-700" };
  // converted -> on reflète le statut réel du booking.
  if (e.booking_status === "confirmed")
    return { label: "Confirmé", cls: "bg-green-100 text-green-700" };
  if (e.booking_status === "cancelled")
    return { label: "Annulé", cls: "bg-accent/15 text-accent" };
  if (e.booking_status === "pending_manual")
    return { label: "À confirmer", cls: "bg-orange-100 text-orange-700" };
  return { label: "Converti", cls: "bg-green-100 text-green-700" };
}

/** « Non confirmé » = abandon, annulation ou échec technique. */
function isUnconfirmed(e: FunnelLogEntry): boolean {
  return (
    e.status === "abandoned" ||
    e.booking_status === "cancelled" ||
    e.booking_status === "pending_manual"
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function FunnelLog({
  entries,
  hostTimezone,
}: {
  entries: FunnelLogEntry[];
  hostTimezone: string;
}) {
  const [filter, setFilter] = useState<"all" | "unconfirmed">("all");

  const unconfirmedCount = useMemo(
    () => entries.filter(isUnconfirmed).length,
    [entries],
  );
  const shown = useMemo(
    () => (filter === "all" ? entries : entries.filter(isUnconfirmed)),
    [entries, filter],
  );

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="nc-title text-xl">Journal des réservations</h2>
        <div className="flex gap-1 rounded-lg bg-raised p-1 text-sm">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              filter === "all" ? "bg-card text-ink nc-shadow-1" : "text-muted hover:text-ink"
            }`}
          >
            Tout ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unconfirmed")}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              filter === "unconfirmed" ? "bg-card text-ink nc-shadow-1" : "text-muted hover:text-ink"
            }`}
          >
            Non confirmés ({unconfirmedCount})
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">Aucune entrée.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((e) => {
            const tag = tagOf(e);
            const slot =
              e.start_utc && e.lead_timezone
                ? `${formatSlotLong(e.start_utc, hostTimezone)} (${timezoneAbbrev(e.start_utc, hostTimezone)})`
                : null;
            const channel = formatAcquisitionChannel({
              source: e.acq_source,
              post: e.acq_post,
            });
            const situation = e.situation
              ? SITUATION_LABEL[e.situation] ?? e.situation
              : null;
            const details = [e.activity, situation].filter(Boolean).join(" · ");
            return (
              <div
                key={e.id}
                className="rounded-sm border border-line bg-card px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">
                        {e.lead_name || "—"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${tag.cls}`}
                      >
                        {tag.label}
                      </span>
                      {e.link_code && (
                        <span className="rounded-full bg-raised px-2 py-0.5 text-[0.7rem] text-muted">
                          lien perso
                        </span>
                      )}
                    </div>
                    {e.lead_email && (
                      <p className="text-sm text-muted">{e.lead_email}</p>
                    )}
                    {slot && <p className="text-sm capitalize text-ink">{slot}</p>}
                    {details && <p className="mt-0.5 text-sm text-muted">{details}</p>}
                    {e.motivation && (
                      <p className="mt-0.5 text-sm text-ink/80">« {e.motivation} »</p>
                    )}
                    {channel && (
                      <p className="mt-0.5 text-xs text-muted">Canal : {channel}</p>
                    )}
                  </div>
                  <span className="flex-none whitespace-nowrap text-xs text-muted">
                    {formatDate(e.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
