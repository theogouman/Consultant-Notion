"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
        <FilterMenu
          value={filter}
          onChange={setFilter}
          counts={{ all: entries.length, unconfirmed: unconfirmedCount }}
        />
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

/* -------------------------------------------------------------------------- */
/* Filtre « dropdown menu morph » (adapté de transitions.dev)                  */
/* -------------------------------------------------------------------------- */

const FILTER_LABEL: Record<"all" | "unconfirmed", string> = {
  all: "Tout",
  unconfirmed: "Non confirmés",
};

function FilterMenu({
  value,
  onChange,
  counts,
}: {
  value: "all" | "unconfirmed";
  onChange: (v: "all" | "unconfirmed") => void;
  counts: { all: number; unconfirmed: number };
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

  const options: ("all" | "unconfirmed")[] = ["all", "unconfirmed"];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-accent"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 5h18M6 12h12M10 19h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>{FILTER_LABEL[value]}</span>
        {value === "unconfirmed" && (
          <span className="rounded-full bg-accent/15 px-1.5 text-xs font-semibold text-accent">
            {counts.unconfirmed}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Surface qui « morphe » depuis le bouton : scale + fondu + flou. */}
      <div
        role="menu"
        className={`absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-line bg-card p-1 nc-shadow-2 ${
          open
            ? "pointer-events-auto scale-100 opacity-100 blur-0"
            : "pointer-events-none scale-[0.96] opacity-0 blur-[2px]"
        }`}
        style={{
          transition: open
            ? "opacity 200ms cubic-bezier(0.34,1.25,0.64,1), transform 350ms cubic-bezier(0.34,1.25,0.64,1), filter 200ms cubic-bezier(0.34,1.25,0.64,1)"
            : "opacity 180ms cubic-bezier(0.22,1,0.36,1), transform 250ms cubic-bezier(0.22,1,0.36,1), filter 180ms cubic-bezier(0.22,1,0.36,1)",
        }}
        hidden={!open}
      >
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
  );
}
