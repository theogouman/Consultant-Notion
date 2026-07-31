/**
 * Lecture / écriture de la ligne unique `settings`.
 */

import "server-only";
import { getSupabaseAdmin } from "./supabase";
import type { Settings, WeeklyAvailability, Weekday, TimeRange } from "../types";

const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** Récupère la configuration (ligne id=1). Lève si absente. */
export async function getSettings(): Promise<Settings> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(`Impossible de lire les settings: ${error?.message ?? "introuvable"}`);
  }
  return data as Settings;
}

/** Champs modifiables depuis l'admin (tout sauf id/updated_at). */
export type SettingsUpdate = Partial<Omit<Settings, "id" | "updated_at">>;

/** Met à jour la configuration après normalisation/validation. */
export async function updateSettings(patch: SettingsUpdate): Promise<Settings> {
  const clean = sanitizeSettings(patch);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("settings")
    .update(clean)
    .eq("id", 1)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Échec mise à jour settings: ${error?.message ?? "inconnu"}`);
  }
  return data as Settings;
}

/** Borne un entier dans [min, max]. */
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Valide "HH:mm". */
function isHhmm(v: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
}

/** Nettoie/valide un patch de settings avant écriture. */
export function sanitizeSettings(patch: SettingsUpdate): SettingsUpdate {
  const out: SettingsUpdate = {};

  if (patch.call_duration_min !== undefined)
    out.call_duration_min = clampInt(patch.call_duration_min, 5, 480, 60);
  if (patch.slot_granularity_min !== undefined)
    out.slot_granularity_min = clampInt(patch.slot_granularity_min, 5, 240, 30);
  if (patch.buffer_before_min !== undefined)
    out.buffer_before_min = clampInt(patch.buffer_before_min, 0, 240, 0);
  if (patch.buffer_after_min !== undefined)
    out.buffer_after_min = clampInt(patch.buffer_after_min, 0, 240, 10);
  if (patch.min_notice_hours !== undefined)
    out.min_notice_hours = clampInt(patch.min_notice_hours, 0, 720, 24);
  if (patch.max_advance_days !== undefined)
    out.max_advance_days = clampInt(patch.max_advance_days, 1, 365, 21);
  if (patch.max_per_day !== undefined)
    out.max_per_day = clampInt(patch.max_per_day, 1, 50, 3);
  if (patch.reminder_hours_before !== undefined)
    out.reminder_hours_before = clampInt(patch.reminder_hours_before, 1, 72, 3);
  if (patch.host_timezone !== undefined)
    out.host_timezone = String(patch.host_timezone).slice(0, 64);
  if (patch.sender_from !== undefined)
    out.sender_from = String(patch.sender_from).slice(0, 200);
  if (patch.reply_to !== undefined) out.reply_to = String(patch.reply_to).slice(0, 200);
  if (patch.weekly_availability !== undefined)
    out.weekly_availability = sanitizeWeekly(patch.weekly_availability);

  return out;
}

/** Valide/normalise le planning hebdo : plages HH:mm cohérentes (start<end). */
export function sanitizeWeekly(input: unknown): WeeklyAvailability {
  const raw = (input ?? {}) as Record<string, unknown>;
  const out = {} as WeeklyAvailability;

  for (const day of WEEKDAYS) {
    const ranges = Array.isArray(raw[day]) ? (raw[day] as unknown[]) : [];
    const clean: TimeRange[] = [];
    for (const r of ranges) {
      const rr = r as Partial<TimeRange>;
      const start = String(rr?.start ?? "");
      const end = String(rr?.end ?? "");
      if (isHhmm(start) && isHhmm(end) && start < end) {
        clean.push({ start, end });
      }
    }
    // Tri par heure de début pour un affichage stable.
    clean.sort((a, b) => a.start.localeCompare(b.start));
    out[day] = clean;
  }
  return out;
}
