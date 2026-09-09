/**
 * Types partagés du module de réservation (booker maison).
 * Isolé dans src/modules/booking/ pour réutilisation.
 */

/** Un jour de la semaine, clé du planning hebdo. */
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** Une plage horaire en heure host (ex. "09:00" -> "12:00"). */
export interface TimeRange {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

/** Planning hebdomadaire, par jour de semaine, en heure host. */
export type WeeklyAvailability = Record<Weekday, TimeRange[]>;

/** Situation du lead (select du formulaire). */
export type Situation = "notion_mal" | "pas_outil";

/** Statut d'une réservation. */
export type BookingStatus = "confirmed" | "cancelled" | "pending_manual";

/** Configuration éditable depuis l'admin (ligne unique `settings`). */
export interface Settings {
  id: number;
  call_duration_min: number;
  slot_granularity_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  min_notice_hours: number;
  max_advance_days: number;
  max_per_day: number;
  weekly_availability: WeeklyAvailability;
  host_timezone: string;
  reminder_hours_before: number;
  sender_from: string;
  reply_to: string;
  updated_at: string;
}

/** Une réservation telle que stockée en base. */
export interface Booking {
  id: string;
  start_utc: string;
  end_utc: string;
  lead_timezone: string;
  lead_name: string;
  lead_email: string;
  guest_email: string | null;
  activity: string;
  situation: Situation;
  motivation: string;
  status: BookingStatus;
  google_event_id: string | null;
  meet_url: string | null;
  manage_token: string;
  /** Attribution : `?source=` de l'URL d'arrivée (null si absent). */
  acq_source: string | null;
  /** Attribution : `?post=` de l'URL d'arrivée (null si absent). */
  acq_post: string | null;
  ics_sequence: number;
  reminder_sent_at: string | null;
  /** Sync Notion (best-effort) : IDs des pages créées + suivi d'erreur. */
  crm_page_id: string | null;
  meeting_page_id: string | null;
  notion_synced_at: string | null;
  notion_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Un créneau proposé au lead. `start_utc`/`end_utc` sont les instants absolus
 * (UTC, source de vérité) ; `label` est l'heure affichée dans le fuseau du lead.
 */
export interface Slot {
  start_utc: string;
  end_utc: string;
}

/** Créneaux disponibles regroupés par jour (dans le fuseau du lead). */
export interface AvailableDay {
  /** Date ISO (yyyy-mm-dd) dans le fuseau du lead. */
  date: string;
  slots: Slot[];
}

/* -------------------------------------------------------------------------- */
/* Annulation : questionnaire de rétention                                     */
/* -------------------------------------------------------------------------- */

/** Motif d'annulation (1re question du questionnaire d'annulation). */
export type CancelReason =
  | "not_available" // « Je ne suis plus disponible le [date] »
  | "other_consultant" // « J'ai commencé avec un autre consultant »
  | "better_tool" // « J'ai trouvé un meilleur outil que Notion »
  | "no_time"; // « Je n'ai plus le temps »

/** Outil concurrent cité (branche « meilleur outil »). */
export type BetterTool = "asana" | "clickup" | "custom_ai" | "other";

/** Délai de rappel souhaité (branche « plus le temps »). */
export type CallbackDelay = "1m" | "3m" | "6m";

/** Retour collecté pendant le flow d'annulation (transmis à la notif interne). */
export interface CancelFeedback {
  reason: CancelReason;
  /** branche better_tool */
  betterTool?: BetterTool;
  betterToolOther?: string; // si betterTool === "other"
  betterToolReason?: string; // « pourquoi mieux que Notion ? »
  /** branche no_time */
  wantsCallback?: boolean;
  callbackDelay?: CallbackDelay; // si wantsCallback
}

/** Charge utile du formulaire de qualification. */
export interface QualificationInput {
  name: string;
  email: string;
  activity: string;
  situation: Situation;
  motivation: string;
  /** Jusqu'à 5 invités (e-mails). Stockés en base en liste séparée par virgules. */
  guestEmails?: string[];
  /** Honeypot anti-bot : doit rester vide. */
  company?: string;
  /** Attribution — paramètre d'URL `source` (ex. `linkedin`). */
  acquisitionSource?: string | null;
  /** Attribution — paramètre d'URL `post` (ex. `carrousel-notion-crm`). */
  acquisitionPost?: string | null;
}
