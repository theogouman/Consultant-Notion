/**
 * Libellés + résumé du questionnaire d'annulation.
 * Module PUR (ni server-only ni client-only) : partagé par l'UI (CancelFlow)
 * et par la notification interne (e-mail) pour une seule source de vérité.
 */

import type {
  BetterTool,
  CallbackDelay,
  CancelFeedback,
  CancelReason,
} from "../types";

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  not_available: "Plus disponible au créneau prévu",
  other_consultant: "A commencé à travailler avec un autre consultant",
  better_tool: "A trouvé un meilleur outil que Notion",
  no_time: "N'a plus le temps",
};

/** Options « meilleur outil » (dans l'ordre d'affichage). */
export const TOOL_OPTIONS: { value: BetterTool; label: string }[] = [
  { value: "asana", label: "Asana" },
  { value: "clickup", label: "ClickUp" },
  { value: "custom_ai", label: "Sur-mesure avec Claude Code / Codex" },
  { value: "other", label: "Autre" },
];

export const TOOL_LABEL: Record<BetterTool, string> = TOOL_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<BetterTool, string>,
);

/** Options de délai de rappel (branche « plus le temps »). */
export const DELAY_OPTIONS: { value: CallbackDelay; label: string }[] = [
  { value: "1m", label: "Dans 1 mois" },
  { value: "3m", label: "Dans 3 mois" },
  { value: "6m", label: "Dans 6 mois" },
];

export const DELAY_LABEL: Record<CallbackDelay, string> = DELAY_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<CallbackDelay, string>,
);

/**
 * Lignes lisibles (FR) résumant le retour d'annulation, pour la notification
 * interne à Théo. Une ligne = « Clé : valeur ».
 */
export function summarizeCancelFeedback(fb: CancelFeedback): string[] {
  const lines: string[] = [`Motif : ${CANCEL_REASON_LABEL[fb.reason]}`];

  if (fb.reason === "better_tool") {
    const tool =
      fb.betterTool === "other"
        ? fb.betterToolOther?.trim() || "Autre (non précisé)"
        : fb.betterTool
          ? TOOL_LABEL[fb.betterTool]
          : "—";
    lines.push(`Outil retenu : ${tool}`);
    if (fb.betterToolReason?.trim()) {
      lines.push(`Pourquoi mieux que Notion : ${fb.betterToolReason.trim()}`);
    }
  }

  if (fb.reason === "no_time") {
    lines.push(
      fb.wantsCallback
        ? `Souhaite être rappelé : oui (${fb.callbackDelay ? DELAY_LABEL[fb.callbackDelay] : "délai non précisé"})`
        : "Souhaite être rappelé : non",
    );
  }

  return lines;
}
