/**
 * Intégration Google Calendar (freebusy + events) via l'API REST.
 *
 * On réutilise l'app OAuth2 existante et approuvée de Théo. Un seul utilisateur
 * (Théo) a autorisé l'accès offline -> GOOGLE_REFRESH_TOKEN. Le lead ne touche
 * jamais Google.
 *
 * ⚠️ L'app OAuth doit être en statut Production (sinon le refresh token expire
 * à 7 jours) avec les scopes Calendar (calendar.events + calendar.readonly ou
 * calendar) autorisés.
 *
 * Pas de SDK lourd : on rafraîchit l'access token à la demande et on appelle
 * l'API Calendar en fetch. `sendUpdates: 'none'` -> Google reste silencieux,
 * Resend gère 100 % des mails.
 */

import "server-only";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

interface GoogleEnv {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

function env(): GoogleEnv {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!clientId || !clientSecret || !refreshToken || !calendarId) {
    throw new Error(
      "Variables Google manquantes (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / GOOGLE_CALENDAR_ID).",
    );
  }
  return { clientId, clientSecret, refreshToken, calendarId };
}

// Cache mémoire de l'access token (valide ~1h). Évite un refresh par appel.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }
  const { clientId, clientSecret, refreshToken } = env();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh token Google échoué (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

async function calFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${CAL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** Intervalle occupé renvoyé par freebusy. */
export interface BusyInterval {
  start: string; // ISO UTC
  end: string; // ISO UTC
}

/**
 * Interroge freebusy sur l'agenda host entre deux instants (ISO).
 * Renvoie les intervalles occupés (y compris events « indisponible » posés
 * manuellement par Théo -> sert de « congés »).
 */
export async function getBusyIntervals(
  timeMinIso: string,
  timeMaxIso: string,
): Promise<BusyInterval[]> {
  const { calendarId } = env();
  const res = await calFetch("/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`freeBusy échoué (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    calendars: Record<string, { busy?: BusyInterval[] }>;
  };
  return data.calendars?.[calendarId]?.busy ?? [];
}

export interface CreateEventInput {
  summary: string;
  description: string;
  startUtc: string; // ISO
  endUtc: string; // ISO
  attendees: { email: string }[];
  /** Clé unique pour la requête Meet (idempotence côté Google). */
  requestId: string;
}

export interface EventResult {
  id: string;
  meetUrl: string | null;
  htmlLink: string | null;
}

function parseMeetUrl(ev: {
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
}): string | null {
  if (ev.hangoutLink) return ev.hangoutLink;
  const ep = ev.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video",
  );
  return ep?.uri ?? null;
}

/**
 * Crée l'event dans l'agenda host avec Google Meet obligatoire.
 * `sendUpdates: 'none'` -> Google n'envoie aucun mail (Resend s'en charge).
 */
export async function createEvent(input: CreateEventInput): Promise<EventResult> {
  const { calendarId } = env();
  const res = await calFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startUtc, timeZone: "UTC" },
        end: { dateTime: input.endUtc, timeZone: "UTC" },
        attendees: input.attendees,
        guestsCanInviteOthers: true,
        reminders: { useDefault: false },
        conferenceData: {
          createRequest: {
            requestId: input.requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Création event Google échouée (${res.status}): ${text}`);
  }
  const ev = (await res.json()) as {
    id: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };
  return { id: ev.id, meetUrl: parseMeetUrl(ev), htmlLink: ev.htmlLink ?? null };
}

/** Met à jour les horaires d'un event existant (reprogrammation). */
export async function updateEventTime(
  eventId: string,
  startUtc: string,
  endUtc: string,
): Promise<EventResult> {
  const { calendarId } = env();
  const res = await calFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    {
      method: "PATCH",
      body: JSON.stringify({
        start: { dateTime: startUtc, timeZone: "UTC" },
        end: { dateTime: endUtc, timeZone: "UTC" },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mise à jour event Google échouée (${res.status}): ${text}`);
  }
  const ev = (await res.json()) as {
    id: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };
  return { id: ev.id, meetUrl: parseMeetUrl(ev), htmlLink: ev.htmlLink ?? null };
}

/** Supprime un event (annulation). 410/404 = déjà supprimé => succès idempotent. */
export async function deleteEvent(eventId: string): Promise<void> {
  const { calendarId } = env();
  const res = await calFetch(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const text = await res.text();
    throw new Error(`Suppression event Google échouée (${res.status}): ${text}`);
  }
}
