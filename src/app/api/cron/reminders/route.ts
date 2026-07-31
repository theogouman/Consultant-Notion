/**
 * Endpoint de rappel H-3 (§9), déclenché par pg_cron Supabase toutes les 15 min
 * via pg_net (POST avec en-tête secret x-cron-secret).
 *
 * Sélectionne les réservations confirmées, non encore rappelées, dont le début
 * tombe dans la fenêtre [now, now + reminder_hours_before], envoie le rappel via
 * Resend, puis pose reminder_sent_at (anti double-rappel).
 */

import { NextResponse } from "next/server";
import { getSettings } from "@/modules/booking/server/settings";
import {
  getBookingsToRemind,
  markReminderSent,
} from "@/modules/booking/server/bookings";
import { sendReminder } from "@/modules/booking/server/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const settings = await getSettings();
  const due = await getBookingsToRemind(settings.reminder_hours_before);

  let sent = 0;
  for (const booking of due) {
    try {
      await sendReminder(booking, settings);
      await markReminderSent(booking.id);
      sent += 1;
    } catch (err) {
      console.error(`[cron/reminders] échec rappel booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, candidates: due.length, sent });
}

export async function POST(req: Request) {
  return handle(req);
}

// GET autorisé (mêmes contrôles) pour des tests manuels / uptime checks.
export async function GET(req: Request) {
  return handle(req);
}
