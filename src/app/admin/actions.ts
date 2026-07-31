"use server";

/**
 * Server Actions de l'admin (§8). Chaque action mutante revérifie la session
 * (défense en profondeur, en plus du middleware).
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createSessionToken,
  verifySessionToken,
  safeCompareString,
} from "@/modules/booking/lib/admin-auth";
import {
  updateSettings,
  sanitizeWeekly,
  type SettingsUpdate,
} from "@/modules/booking/server/settings";
import { cancelExisting } from "@/modules/booking/server/flow";

/** Vérifie la session admin. Lève si absente/invalide. */
async function requireAdmin(): Promise<void> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!secret || !(await verifySessionToken(secret, token))) {
    throw new Error("Non autorisé.");
  }
}

export type LoginState = { error?: string } | undefined;

/** Connexion : compare le mot de passe, pose le cookie signé. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!expected || !secret) {
    return { error: "Configuration serveur incomplète (variables d'environnement)." };
  }
  if (!password || !(await safeCompareString(password, expected))) {
    return { error: "Mot de passe incorrect." };
  }

  const token = await createSessionToken(secret);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  redirect("/admin");
}

/** Déconnexion. */
export async function logoutAction(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/** Met à jour la configuration (règles + planning hebdo). */
export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const num = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? undefined : Number(v);
  };
  const str = (k: string) => {
    const v = formData.get(k);
    return v === null ? undefined : String(v);
  };

  let weekly: SettingsUpdate["weekly_availability"];
  const weeklyRaw = formData.get("weekly_availability");
  if (typeof weeklyRaw === "string" && weeklyRaw.trim()) {
    try {
      weekly = sanitizeWeekly(JSON.parse(weeklyRaw));
    } catch {
      // JSON invalide -> on ignore le champ planning (les autres passent).
      weekly = undefined;
    }
  }

  const patch: SettingsUpdate = {
    call_duration_min: num("call_duration_min"),
    slot_granularity_min: num("slot_granularity_min"),
    buffer_before_min: num("buffer_before_min"),
    buffer_after_min: num("buffer_after_min"),
    min_notice_hours: num("min_notice_hours"),
    max_advance_days: num("max_advance_days"),
    max_per_day: num("max_per_day"),
    reminder_hours_before: num("reminder_hours_before"),
    host_timezone: str("host_timezone"),
    sender_from: str("sender_from"),
    reply_to: str("reply_to"),
    ...(weekly ? { weekly_availability: weekly } : {}),
  };

  await updateSettings(patch);
  revalidatePath("/admin");
}

/** Annulation d'une réservation par l'admin (supprime Google + mails). */
export async function adminCancelAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("booking_id") ?? "");
  if (id) await cancelExisting(id);
  revalidatePath("/admin");
}
