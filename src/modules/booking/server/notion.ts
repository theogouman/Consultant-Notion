/**
 * Synchronisation booker -> CRM Notion (best-effort, jamais bloquante).
 *
 * À chaque événement du cycle de vie d'une réservation on écrit/met à jour les
 * pages Notion de Théo (CRM + notes de réunion) pour piloter le Sales.
 *
 * Garde-fous (voir brief) :
 *   - API « data sources », en-tête Notion-Version: 2026-03-11 ; on cible les
 *     data_source_id (pas les database_id).
 *   - Introspection LIVE du schéma : on vérifie l'existence exacte des
 *     propriétés/options et on échoue avec un message clair si un nom manque
 *     (jamais de création silencieuse d'option Status).
 *   - Création depuis template = asynchrone : on attend (polling) que la
 *     structure (bloc Tabs → onglet « Infos Formulaire ») soit présente avant
 *     d'écrire dedans.
 *   - Idempotence : on ne recrée pas les pages si les IDs existent déjà.
 *   - Non bloquant : toute erreur Notion est loguée + tracée en base
 *     (notion_sync_error), jamais propagée à la réservation.
 *   - Aucun secret en dur : tout vient des variables d'environnement.
 */

import "server-only";
import { DateTime } from "../lib/timezone";
import { manageUrl } from "../emails/links";
import { TOOL_LABEL } from "../lib/cancel";
import { getBookingById, setNotionSync } from "./bookings";
import type { Booking, CallbackDelay, CancelFeedback } from "../types";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const HOST_ZONE = "Europe/Paris";

/** Titre de l'onglet cible dans le bloc Tabs de la page réunion. */
const INFOS_TAB_TITLE = "Infos Formulaire";

/** Options attendues (doivent préexister côté Notion). */
const ETAT_RDV_PRIS = "Rdv Pris";
const ETAT_ANNULE = "Annulé avant R1";
const TYPE_APPEL_VENTE = "Appel de Vente";

/** Délai de rappel -> nombre de mois (recontact après annulation). */
const CALLBACK_MONTHS: Record<CallbackDelay, number> = { "1m": 1, "3m": 3, "6m": 6 };

/** Mapping `situation` -> texte clair (onglet Infos Formulaire). */
const SITUATION_TEXT: Record<string, string> = {
  notion_mal: "Utilise déjà Notion, mais mal",
  pas_outil: "Pas d'outil d'organisation",
};

/** Mapping `situation` -> clause narrative (commentaire d'annulation CRM). */
const SITUATION_CLAUSE: Record<string, string> = {
  notion_mal: "il utilisait déjà Notion, mais mal",
  pas_outil: "il n'avait pas d'outil d'organisation",
};

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

interface NotionEnv {
  token: string;
  crmDataSourceId: string;
  meetingsDataSourceId: string;
  meetingTemplateId?: string;
}

/** Lit la config, ou renvoie null si Notion n'est pas configuré (sync no-op). */
function readEnv(): NotionEnv | null {
  const token = process.env.NOTION_API_TOKEN_BOOKER;
  const crmDataSourceId = process.env.NOTION_CRM_DATA_SOURCE_ID;
  const meetingsDataSourceId = process.env.NOTION_MEETINGS_DATA_SOURCE_ID;
  if (!token || !crmDataSourceId || !meetingsDataSourceId) return null;
  return {
    token,
    crmDataSourceId,
    meetingsDataSourceId,
    meetingTemplateId: process.env.NOTION_MEETING_TEMPLATE_ID || undefined,
  };
}

/** La sync Notion est-elle activée (variables présentes) ? */
export function isNotionConfigured(): boolean {
  return readEnv() !== null;
}

/* -------------------------------------------------------------------------- */
/* Client REST bas niveau                                                     */
/* -------------------------------------------------------------------------- */

async function notionFetch(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Notion ${init.method ?? "GET"} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : {};
}

/* -------------------------------------------------------------------------- */
/* Introspection + validation du schéma (mise en cache par instance)          */
/* -------------------------------------------------------------------------- */

interface ResolvedSchema {
  meetingTemplateId: string;
}
let schemaCache: ResolvedSchema | null = null;

type NotionProps = Record<string, { type?: string; [k: string]: unknown }>;

function optionNames(prop: unknown, key: "select" | "status"): string[] {
  const p = prop as Record<string, { options?: { name?: string }[] }>;
  return (p?.[key]?.options ?? []).map((o) => o.name ?? "").filter(Boolean);
}

/** GET data source (schéma). */
async function getDataSource(env: NotionEnv, id: string): Promise<NotionProps> {
  const ds = (await notionFetch(env.token, `/data_sources/${id}`)) as {
    properties?: NotionProps;
  };
  if (!ds.properties) throw new Error(`Data source ${id} sans propriétés.`);
  return ds.properties;
}

/** Résout un template_id : env prioritaire, sinon via l'endpoint templates. */
async function resolveTemplateId(
  env: NotionEnv,
  dataSourceId: string,
  override: string | undefined,
  pick: (t: { id: string; name: string; default?: boolean }) => boolean,
  label: string,
): Promise<string> {
  if (override) return override;
  const res = (await notionFetch(env.token, `/data_sources/${dataSourceId}/templates`)) as {
    templates?: { id: string; name?: string; default?: boolean }[];
    results?: { id: string; name?: string; default?: boolean }[];
  };
  const list = res.templates ?? res.results ?? [];
  const match = list
    .map((t) => ({ id: t.id, name: (t.name ?? "").trim(), default: t.default }))
    .find(pick);
  if (!match) {
    throw new Error(
      `Template introuvable (${label}) pour la data source ${dataSourceId}. Templates: ${list
        .map((t) => `${(t.name ?? "").trim()}${t.default ? " [default]" : ""}`)
        .join(", ") || "aucun"}`,
    );
  }
  return match.id;
}

/**
 * Vérifie que toutes les propriétés/options attendues existent, et résout les
 * templates. Échoue avec un message explicite si un nom/option manque.
 */
async function ensureSchema(env: NotionEnv): Promise<ResolvedSchema> {
  if (schemaCache) return schemaCache;

  const [crm, meetings] = await Promise.all([
    getDataSource(env, env.crmDataSourceId),
    getDataSource(env, env.meetingsDataSourceId),
  ]);

  const missing: string[] = [];
  const need = (props: NotionProps, name: string, type: string, where: string) => {
    const p = props[name];
    if (!p) missing.push(`${where}: propriété « ${name} » absente`);
    else if (p.type !== type)
      missing.push(`${where}: « ${name} » est de type ${p.type}, attendu ${type}`);
  };

  // CRM
  need(crm, "Nom", "title", "CRM");
  need(crm, "E-mail", "email", "CRM");
  need(crm, "Job", "rich_text", "CRM");
  need(crm, "Next Follow-up", "date", "CRM");
  need(crm, "État", "status", "CRM");
  if (crm["État"]?.type === "status") {
    const opts = optionNames(crm["État"], "status");
    for (const o of [ETAT_RDV_PRIS, ETAT_ANNULE]) {
      if (!opts.includes(o)) missing.push(`CRM: option Status « ${o} » absente sur « État »`);
    }
  }

  // Réunions
  need(meetings, "Type", "select", "Réunions");
  need(meetings, "Date", "date", "Réunions");
  need(meetings, "CRM", "relation", "Réunions");
  if (meetings["Type"]?.type === "select") {
    const opts = optionNames(meetings["Type"], "select");
    if (!opts.includes(TYPE_APPEL_VENTE))
      missing.push(`Réunions: option Select « ${TYPE_APPEL_VENTE} » absente sur « Type »`);
  }

  if (missing.length) {
    throw new Error(`Schéma Notion incompatible :\n- ${missing.join("\n- ")}`);
  }

  // La fiche CRM est créée/dédupliquée par crm.ts (canal d'acquisition, État
  // non régressé). Ici on ne crée que la note de réunion -> seul le template
  // « R1 » est résolu.
  const meetingTemplateId = await resolveTemplateId(
    env,
    env.meetingsDataSourceId,
    env.meetingTemplateId,
    (t) => t.name.toLowerCase() === "r1",
    "Réunions (template « R1 »)",
  );

  schemaCache = { meetingTemplateId };
  return schemaCache;
}

/* -------------------------------------------------------------------------- */
/* Helpers de contenu (dates, texte)                                          */
/* -------------------------------------------------------------------------- */

/** ISO 8601 avec offset Paris (Notion gère l'heure d'été via l'offset). */
function parisIso(startUtc: string): string {
  return DateTime.fromISO(startUtc, { zone: "utc" }).setZone(HOST_ZONE).toISO()!;
}

/** Date longue en français d'un instant ISO (UTC), ex. « 1 août 2026 ». */
function parisLongDate(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" })
    .setZone(HOST_ZONE)
    .setLocale("fr")
    .toFormat("d LLLL yyyy");
}

/** Date longue en français de « maintenant » (heure Paris). */
function parisLongDateNow(): string {
  return DateTime.now().setZone(HOST_ZONE).setLocale("fr").toFormat("d LLLL yyyy");
}

/** Date + heure longues en français, ex. « 1 août 2026 à 17h00 ». */
function parisLongDateTime(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" })
    .setZone(HOST_ZONE)
    .setLocale("fr")
    .toFormat("d LLLL yyyy 'à' HH'h'mm");
}

function richText(content: string, opts?: { italic?: boolean; link?: string }) {
  return [
    {
      type: "text",
      text: { content, link: opts?.link ? { url: opts.link } : undefined },
      annotations: opts?.italic ? { italic: true } : undefined,
    },
  ];
}

function paragraph(children: ReturnType<typeof richText>) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: children } };
}

function bullet(labelBold: string, value: string) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [
        { type: "text", text: { content: `${labelBold} ` }, annotations: { bold: true } },
        { type: "text", text: { content: value } },
      ],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Blocs / onglets (Tabs)                                                     */
/* -------------------------------------------------------------------------- */

interface Block {
  id: string;
  type: string;
  has_children?: boolean;
  [k: string]: unknown;
}

async function listChildren(env: NotionEnv, blockId: string): Promise<Block[]> {
  const out: Block[] = [];
  let cursor: string | undefined;
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : `?page_size=100`;
    const res = (await notionFetch(env.token, `/blocks/${blockId}/children${q}`)) as {
      results?: Block[];
      next_cursor?: string | null;
      has_more?: boolean;
    };
    out.push(...(res.results ?? []));
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

/** Texte brut d'un bloc (concatène le rich_text du sous-objet typé). */
function blockText(block: Block): string {
  const body = block[block.type] as { rich_text?: { plain_text?: string }[]; title?: string } | undefined;
  if (!body) return "";
  if (Array.isArray(body.rich_text)) return body.rich_text.map((r) => r.plain_text ?? "").join("");
  if (typeof body.title === "string") return body.title;
  return "";
}

/**
 * Cherche (en profondeur bornée) l'onglet dont le titre = INFOS_TAB_TITLE et
 * renvoie l'id du bloc auquel appender le contenu. Le template dupliqué ayant
 * de nouveaux ids, on localise par TITRE, jamais par id en dur.
 */
async function findInfosTab(env: NotionEnv, pageId: string, depth = 2): Promise<string | null> {
  const stack: { id: string; d: number }[] = [{ id: pageId, d: 0 }];
  while (stack.length) {
    const { id, d } = stack.shift()!;
    let children: Block[];
    try {
      children = await listChildren(env, id);
    } catch {
      continue;
    }
    for (const b of children) {
      if (blockText(b).trim() === INFOS_TAB_TITLE) return b.id;
    }
    if (d < depth) {
      for (const b of children) {
        if (b.has_children) stack.push({ id: b.id, d: d + 1 });
      }
    }
  }
  return null;
}

/** Poll jusqu'à ce que l'onglet « Infos Formulaire » du template soit appliqué. */
async function waitForInfosTab(
  env: NotionEnv,
  pageId: string,
  tries = 8,
  delayMs = 1500,
): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    const id = await findInfosTab(env, pageId);
    if (id) return id;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Opérations pages                                                           */
/* -------------------------------------------------------------------------- */

async function createFromTemplate(
  env: NotionEnv,
  dataSourceId: string,
  templateId: string,
  properties: Record<string, unknown>,
): Promise<string> {
  const page = (await notionFetch(env.token, `/pages`, {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      template: { type: "template_id", template_id: templateId },
      properties,
    }),
  })) as { id: string };
  return page.id;
}

async function patchProperties(
  env: NotionEnv,
  pageId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  await notionFetch(env.token, `/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
}

async function archivePage(env: NotionEnv, pageId: string): Promise<void> {
  // API « data sources » (2026-03-11) : le champ `archived` est REJETÉ, il faut
  // `in_trash`. On met la page réunion à la corbeille.
  await notionFetch(env.token, `/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ in_trash: true }),
  });
}

async function appendChildren(env: NotionEnv, blockId: string, children: unknown[]): Promise<void> {
  await notionFetch(env.token, `/blocks/${blockId}/children`, {
    method: "PATCH",
    body: JSON.stringify({ children }),
  });
}

async function addComment(env: NotionEnv, pageId: string, richTextArr: unknown[]): Promise<void> {
  await notionFetch(env.token, `/comments`, {
    method: "POST",
    body: JSON.stringify({ parent: { page_id: pageId }, rich_text: richTextArr }),
  });
}

/* -------------------------------------------------------------------------- */
/* Flux A : réservation confirmée                                             */
/* -------------------------------------------------------------------------- */

/**
 * Crée la note de réunion (depuis le template « R1 »), la relie à la fiche CRM
 * (déjà créée/dédupliquée par crm.ts, dont l'id est en base via `crm_page_id`),
 * écrit l'onglet « Infos Formulaire », et poste le commentaire de gestion.
 * Idempotent : ne recrée pas la note si `meeting_page_id` est déjà mémorisé.
 */
export async function syncBookingConfirmed(booking: Booking): Promise<void> {
  const env = readEnv();
  if (!env) return;

  // Relire l'état courant (idempotence sur double appel / retry).
  const current = (await getBookingById(booking.id)) ?? booking;

  // La fiche CRM est l'ancre : elle est créée par crm.ts (canal d'acquisition,
  // dédup par e-mail, État non régressé) et son id stocké dans `crm_page_id`.
  // Sans elle, aucune note de réunion à relier.
  const crmPageId = current.crm_page_id;
  if (!crmPageId) {
    console.warn(
      `[notion] Pas de fiche CRM pour ${current.id} — note de réunion non créée.`,
    );
    return;
  }
  // Idempotent : note de réunion déjà créée.
  if (current.meeting_page_id) return;

  try {
    const { meetingTemplateId } = await ensureSchema(env);

    // Note de réunion (reliée au CRM) depuis le template « R1 ».
    const meetingPageId = await createFromTemplate(
      env,
      env.meetingsDataSourceId,
      meetingTemplateId,
      {
        Type: { select: { name: TYPE_APPEL_VENTE } },
        Date: { date: { start: parisIso(current.start_utc) } },
        CRM: { relation: [{ id: crmPageId }] },
      },
    );
    await setNotionSync(current.id, { meetingPageId });

    // Onglet « Infos Formulaire » (attendre l'application du template).
    const tabId = await waitForInfosTab(env, meetingPageId);

    // La relation « CRM » posée à la CRÉATION ne « prend » pas de façon fiable
    // (la page CRM vient d'être créée, pas encore indexée côté relation). On la
    // (ré)applique donc par un PATCH une fois le template appliqué. On en profite
    // pour ré-affirmer la Date (date/heure DU CRÉNEAU) au cas où le template
    // l'écraserait.
    try {
      await patchProperties(env, meetingPageId, {
        CRM: { relation: [{ id: crmPageId }] },
        Date: { date: { start: parisIso(current.start_utc) } },
      });
    } catch (relErr) {
      console.warn("[notion] Ré-affirmation relation CRM / Date échouée:", relErr);
    }

    if (tabId) {
      const situation = SITUATION_TEXT[current.situation] ?? current.situation;
      // Date affichée = date à laquelle le créneau a été confirmé (created_at),
      // pas la date du rendez-vous lui-même.
      await appendChildren(env, tabId, [
        paragraph(
          richText(
            `Le lead a pris rendez-vous le ${parisLongDate(current.created_at)}, voici ses informations :`,
          ),
        ),
        bullet("Secteur d'activité :", current.activity),
        bullet("Usage de Notion :", situation),
        bullet("Pourquoi cet appel :", current.motivation),
      ]);
    } else {
      console.warn(
        `[notion] Onglet « ${INFOS_TAB_TITLE} » introuvable (template non appliqué ?) pour ${meetingPageId}`,
      );
    }

    // A.3 — Commentaire de gestion sur la page réunion : hyperlien « ce lien »
    // (couleur rouge), plutôt que l'URL brute.
    const manage = manageUrl(current);
    await addComment(env, meetingPageId, [
      { type: "text", text: { content: "Ce rendez-vous peut être géré via " } },
      {
        type: "text",
        text: { content: "ce lien", link: { url: manage } },
        annotations: { color: "red" },
      },
      { type: "text", text: { content: "." } },
    ]);

    await setNotionSync(current.id, {
      syncedAt: new Date().toISOString(),
      error: null,
    });
  } catch (err) {
    console.error("[notion] Sync confirmation échouée:", err);
    await safeMarkError(current.id, err);
  }
}

/* -------------------------------------------------------------------------- */
/* Flux B : annulation                                                        */
/* -------------------------------------------------------------------------- */

interface Recontact {
  months: number;
  /** Date ISO (yyyy-mm-dd) du recontact, pour la propriété « Next Follow-up ». */
  iso: string;
  /** Date longue FR du recontact, pour la phrase du commentaire. */
  long: string;
}

/**
 * Clause de motif (sans « parce qu' » initial, toujours commencée par « il »
 * pour l'élision). Reprend le phrasé défini avec Théo.
 */
function cancelMotifClause(
  feedback: CancelFeedback | undefined,
  recontact?: Recontact,
): string {
  if (!feedback) return "il n'a pas précisé de motif";

  switch (feedback.reason) {
    case "other_consultant":
      return "il collabore désormais avec un autre consultant Notion";
    case "not_available":
      return "il n'était plus disponible à ce créneau";
    case "better_tool": {
      const tool =
        feedback.betterTool === "other"
          ? feedback.betterToolOther?.trim() || "un autre outil"
          : feedback.betterTool
            ? TOOL_LABEL[feedback.betterTool]
            : "un autre outil";
      return `il a préféré ${tool}`;
    }
    case "no_time":
      return recontact
        ? `il n'a plus le temps pour le moment, mais souhaite être recontacté dans ${recontact.months} mois (le ${recontact.long})`
        : "il n'a plus le temps et ne souhaite pas être recontacté";
  }
}

/**
 * Commentaire d'annulation posté sur la page CRM. Comme la note de réunion est
 * archivée (perte des blocs « Infos Formulaire »), ce commentaire CONSERVE le
 * contexte du formulaire : créneau prévu, date + motif d'annulation, activité,
 * situation et motivation du lead.
 */
function buildCancelComment(
  current: Booking,
  feedback: CancelFeedback | undefined,
  recontact?: Recontact,
): unknown[] {
  const slot = parisLongDateTime(current.start_utc);
  const cancelDate = parisLongDateNow();
  const motif = cancelMotifClause(feedback, recontact);
  const situation = SITUATION_CLAUSE[current.situation] ?? current.situation;

  return [
    {
      type: "text",
      text: {
        content:
          `Un appel était prévu pour le ${slot}, mais a été annulé le ${cancelDate} parce qu'${motif}.\n\n` +
          `Il avait indiqué que son activité était « ${current.activity} », ${situation}. ` +
          `Il était motivé à prendre cet appel parce que :\n\n`,
      },
    },
    {
      type: "text",
      text: { content: `« ${current.motivation} »` },
      annotations: { italic: true },
    },
  ];
}

export async function syncBookingCancelled(
  booking: Booking,
  feedback?: CancelFeedback,
): Promise<void> {
  const env = readEnv();
  if (!env) return;

  const current = (await getBookingById(booking.id)) ?? booking;
  // Rien à synchroniser si la sync initiale n'a pas eu lieu.
  if (!current.crm_page_id && !current.meeting_page_id) return;

  let hadError = false;

  // 1) Archiver la page réunion (corbeille) — indépendant du schéma : même si la
  //    résolution/validation du schéma échoue, l'archivage doit avoir lieu.
  if (current.meeting_page_id) {
    try {
      await archivePage(env, current.meeting_page_id);
    } catch (err) {
      hadError = true;
      console.error("[notion] Archive de la note de réunion échouée:", err);
      await safeMarkError(current.id, err);
    }
  }

  // 2) CRM : État « Annulé avant R1 » + éventuel recontact + commentaire motif.
  if (current.crm_page_id) {
    try {
      await ensureSchema(env);

      await patchProperties(env, current.crm_page_id, {
        "État": { status: { name: ETAT_ANNULE } },
      });

      // Recontact demandé (branche « plus le temps » du questionnaire).
      let recontact: Recontact | undefined;
      if (feedback?.wantsCallback && feedback.callbackDelay) {
        const months = CALLBACK_MONTHS[feedback.callbackDelay];
        const dt = DateTime.now().setZone(HOST_ZONE).plus({ months });
        recontact = {
          months,
          iso: dt.toISODate()!,
          long: dt.setLocale("fr").toFormat("d LLLL yyyy"),
        };
        await patchProperties(env, current.crm_page_id, {
          "Next Follow-up": { date: { start: recontact.iso } },
        });
      }

      // Commentaire d'annulation (conserve le contexte du formulaire, car la
      // note de réunion est archivée) sur la page CRM.
      await addComment(env, current.crm_page_id, buildCancelComment(current, feedback, recontact));
    } catch (err) {
      hadError = true;
      console.error("[notion] Sync CRM (annulation) échouée:", err);
      await safeMarkError(current.id, err);
    }
  }

  if (!hadError) {
    await setNotionSync(current.id, { syncedAt: new Date().toISOString(), error: null });
  }
}

/* -------------------------------------------------------------------------- */
/* Flux C : reprogrammation                                                   */
/* -------------------------------------------------------------------------- */

export async function syncBookingRescheduled(booking: Booking): Promise<void> {
  const env = readEnv();
  if (!env) return;

  const current = (await getBookingById(booking.id)) ?? booking;
  if (!current.meeting_page_id) return;

  try {
    await ensureSchema(env);

    // Propriété Date (écrase l'ancienne).
    await patchProperties(env, current.meeting_page_id, {
      Date: { date: { start: parisIso(current.start_utc) } },
    });

    // Cohérence : mettre aussi à jour la ligne « Le lead a pris rendez-vous
    // le … » dans l'onglet en (ré)appendant une note de mise à jour.
    const tabId = await findInfosTab(env, current.meeting_page_id);
    if (tabId) {
      await appendChildren(env, tabId, [
        paragraph(
          richText(
            `Rendez-vous reprogrammé au ${parisLongDate(current.start_utc)}.`,
            { italic: true },
          ),
        ),
      ]);
    }

    await setNotionSync(current.id, { syncedAt: new Date().toISOString(), error: null });
  } catch (err) {
    console.error("[notion] Sync reprogrammation échouée:", err);
    await safeMarkError(current.id, err);
  }
}

/* -------------------------------------------------------------------------- */

async function safeMarkError(bookingId: string, err: unknown): Promise<void> {
  try {
    await setNotionSync(bookingId, { error: String(err).slice(0, 500) });
  } catch (e) {
    console.error("[notion] Impossible d'enregistrer notion_sync_error:", e);
  }
}
