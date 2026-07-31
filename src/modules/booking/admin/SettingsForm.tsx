"use client";

import { useState } from "react";
import { updateSettingsAction } from "@/app/admin/actions";
import type { Settings, Weekday, WeeklyAvailability } from "../types";

const DAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mardi" },
  { key: "wed", label: "Mercredi" },
  { key: "thu", label: "Jeudi" },
  { key: "fri", label: "Vendredi" },
  { key: "sat", label: "Samedi" },
  { key: "sun", label: "Dimanche" },
];

const NUMBERS: { key: keyof Settings; label: string; hint?: string }[] = [
  { key: "call_duration_min", label: "Durée de l'appel (min)" },
  { key: "slot_granularity_min", label: "Pas des créneaux (min)" },
  { key: "buffer_before_min", label: "Tampon avant (min)" },
  { key: "buffer_after_min", label: "Tampon après (min)" },
  { key: "min_notice_hours", label: "Délai mini (h)" },
  { key: "max_advance_days", label: "Fenêtre max (jours)" },
  { key: "max_per_day", label: "Max RDV / jour" },
  { key: "reminder_hours_before", label: "Rappel (h avant)" },
];

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [weekly, setWeekly] = useState<WeeklyAvailability>(settings.weekly_availability);
  const [saved, setSaved] = useState(false);

  function addRange(day: Weekday) {
    setWeekly((w) => ({ ...w, [day]: [...(w[day] ?? []), { start: "09:00", end: "12:00" }] }));
  }
  function removeRange(day: Weekday, idx: number) {
    setWeekly((w) => ({ ...w, [day]: (w[day] ?? []).filter((_, i) => i !== idx) }));
  }
  function updateRange(day: Weekday, idx: number, field: "start" | "end", value: string) {
    setWeekly((w) => ({
      ...w,
      [day]: (w[day] ?? []).map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
  }

  return (
    <form
      action={async (fd) => {
        await updateSettingsAction(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }}
      className="space-y-8"
    >
      {/* Règles numériques */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Règles</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {NUMBERS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs text-muted">{f.label}</span>
              <input
                type="number"
                name={f.key}
                defaultValue={String(settings[f.key] ?? "")}
                className="w-full rounded-sm border border-line bg-raised px-3 py-2 text-ink outline-none focus:border-accent focus:bg-card"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Expéditeur / fuseau */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Fuseau host</span>
          <input
            type="text"
            name="host_timezone"
            defaultValue={settings.host_timezone}
            className="w-full rounded-sm border border-line bg-raised px-3 py-2 text-ink outline-none focus:border-accent focus:bg-card"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Expéditeur (from)</span>
          <input
            type="text"
            name="sender_from"
            defaultValue={settings.sender_from}
            className="w-full rounded-sm border border-line bg-raised px-3 py-2 text-ink outline-none focus:border-accent focus:bg-card"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Reply-To</span>
          <input
            type="text"
            name="reply_to"
            defaultValue={settings.reply_to}
            className="w-full rounded-sm border border-line bg-raised px-3 py-2 text-ink outline-none focus:border-accent focus:bg-card"
          />
        </label>
      </div>

      {/* Planning hebdo */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Disponibilités hebdomadaires <span className="normal-case text-muted/70">(heure host)</span>
        </h3>
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-raised px-4 py-3">
              <span className="w-24 flex-none text-sm font-medium text-ink">{label}</span>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {(weekly[key] ?? []).length === 0 && (
                  <span className="text-sm text-muted">Fermé</span>
                )}
                {(weekly[key] ?? []).map((r, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-sm border border-line bg-card px-2 py-1">
                    <input
                      type="time"
                      value={r.start}
                      onChange={(e) => updateRange(key, idx, "start", e.target.value)}
                      className="bg-transparent text-sm text-ink outline-none"
                    />
                    <span className="text-muted">–</span>
                    <input
                      type="time"
                      value={r.end}
                      onChange={(e) => updateRange(key, idx, "end", e.target.value)}
                      className="bg-transparent text-sm text-ink outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeRange(key, idx)}
                      aria-label="Retirer la plage"
                      className="ml-1 text-muted hover:text-accent"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => addRange(key)}
                  className="rounded-sm border border-dashed border-line px-2 py-1 text-sm text-muted hover:border-accent hover:text-accent"
                >
                  + plage
                </button>
              </div>
            </div>
          ))}
        </div>
        <input type="hidden" name="weekly_availability" value={JSON.stringify(weekly)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_8px_24px_-8px_rgba(224,98,90,0.6)] transition-all hover:bg-[#d1504a]"
        >
          Enregistrer
        </button>
        {saved && <span className="text-sm text-accent">Enregistré.</span>}
      </div>
    </form>
  );
}
