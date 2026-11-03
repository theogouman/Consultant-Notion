/**
 * Liens de planification personnalisés (`booking_links`).
 * Créés par l'admin pour un prospect démarché ; consommés par /r/<code>.
 */

import "server-only";
import { getSupabaseAdmin } from "./supabase";
import { generateLinkCode } from "../lib/tokens";
import type { BookingLink, BookingLinkKind } from "../types";

export interface CreateLinkInput {
  firstName: string;
  lastName: string;
  email: string;
  acqSource?: string | null;
  linkedinUrl?: string | null;
  /** Défaut : « one_time » (ponctuel). */
  kind?: BookingLinkKind;
}

/** Crée un lien personnalisé avec un code court unique. */
export async function createBookingLink(input: CreateLinkInput): Promise<BookingLink> {
  const supabase = getSupabaseAdmin();

  // Quelques tentatives en cas de collision (très improbable).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateLinkCode();
    const { data, error } = await supabase
      .from("booking_links")
      .insert({
        code,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        acq_source: input.acqSource?.trim() || null,
        linkedin_url: input.linkedinUrl?.trim() || null,
        kind: input.kind === "permanent" ? "permanent" : "one_time",
      })
      .select("*")
      .single();

    if (!error && data) return data as BookingLink;
    if (error && error.code !== "23505") {
      throw new Error(`Création du lien échouée: ${error.message}`);
    }
  }
  throw new Error("Impossible de générer un code de lien unique.");
}

/** Lien par code (page /r/<code>). */
export async function getBookingLinkByCode(code: string): Promise<BookingLink | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("booking_links")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(`Lecture du lien échouée: ${error.message}`);
  return (data as BookingLink) ?? null;
}

/** Tous les liens (récent d'abord), pour l'admin. */
export async function listBookingLinks(): Promise<BookingLink[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("booking_links")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Lecture des liens échouée: ${error.message}`);
  return (data ?? []) as BookingLink[];
}

/** Marque un lien comme utilisé (1re conversion). Best-effort. */
export async function markLinkUsed(code: string, bookingId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("booking_links")
      .update({ used_at: new Date().toISOString(), booking_id: bookingId })
      .eq("code", code)
      .is("used_at", null);
  } catch (err) {
    console.error("[links] markLinkUsed échoué:", err);
  }
}

/** Supprime un lien (admin). */
export async function deleteBookingLink(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("booking_links").delete().eq("id", id);
  if (error) throw new Error(`Suppression du lien échouée: ${error.message}`);
}
