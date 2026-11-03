"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatSlotLong, timezoneAbbrev } from "../lib/timezone";
import { formatAcquisitionChannel } from "../lib/acquisition";
import { archiveFunnelAction, unarchiveFunnelAction } from "@/app/admin/actions";
import type { FunnelLogEntry } from "../types";

const SITUATION_LABEL: Record<string, string> = {
  notion_mal: "Notion, mais mal",
  pas_outil: "Pas d'outil",
};

type Filter = "all" | "unconfirmed" | "archived";

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

function isArchived(e: FunnelLogEntry): boolean {
  return !!e.archived_at;
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
  const [filter, setFilter] = useState<Filter>("all");

  const active = useMemo(() => entries.filter((e) => !isArchived(e)), [entries]);
  const archived = useMemo(() => entries.filter(isArchived), [entries]);

  const counts = useMemo(
    () => ({
      all: active.length,
      unconfirmed: active.filter(isUnconfirmed).length,
      archived: archived.length,
    }),
    [active, archived],
  );

  const shown = useMemo(() => {
    if (filter === "archived") return archived;
    if (filter === "unconfirmed") return active.filter(isUnconfirmed);
    return active;
  }, [active, archived, filter]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="nc-title text-xl">Journal des réservations</h2>
        <FilterMenu value={filter} onChange={setFilter} counts={counts} />
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
            const archivedRow = isArchived(e);
            return (
              <div
                key={e.id}
                className={`rounded-sm border border-line bg-card px-4 py-3 ${archivedRow ? "opacity-70" : ""}`}
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
                      {archivedRow && (
                        <span className="rounded-full bg-raised px-2 py-0.5 text-[0.7rem] text-muted">
                          archivé
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
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <span className="whitespace-nowrap text-xs text-muted">
                      {formatDate(e.created_at)}
                    </span>
                    <ArchiveButton id={e.id} archived={archivedRow} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Bouton archiver / désarchiver (server action + revalidation). */
function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  return (
    <form action={archived ? unarchiveFunnelAction : archiveFunnelAction}>
      <input type="hidden" name="funnel_id" value={id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        {archived ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 8h18M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M9 12l3-3 3 3M12 9v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Désarchiver
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 8h18M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M4 4h16v4H4zM10 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Archiver
          </>
        )}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Filtre « dropdown menu morph » (transitions.dev)                            */
/* Le bouton (icône) morphe en surface de menu : taille + rayon animés.        */
/* -------------------------------------------------------------------------- */

const FILTER_LABEL: Record<Filter, string> = {
  all: "Tout",
  unconfirmed: "Non confirmés",
  archived: "Archivés",
};

function FilterMenu({
  value,
  onChange,
  counts,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
  counts: Record<Filter, number>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options: Filter[] = ["all", "unconfirmed", "archived"];

  return (
    <div ref={ref} className="t-fmorph-anchor">
      <div className="t-fmorph" data-open={open ? "true" : "false"}>
        {/* Déclencheur : icône de filtre (morphe en sortant). */}
        <button
          type="button"
          className="t-fmorph-trigger"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Filtrer le journal"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 5h18M6 12h12M10 19h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {value !== "all" && <span className="t-fmorph-dot" aria-hidden />}
        </button>

        {/* Panneau révélé par le morph. */}
        <div className="t-fmorph-panel" role="menu">
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selected ? "bg-raised text-ink" : "text-muted hover:bg-raised hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className={selected ? "text-accent" : "text-transparent"}
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {FILTER_LABEL[opt]}
                </span>
                <span className="text-xs text-muted">{counts[opt]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
