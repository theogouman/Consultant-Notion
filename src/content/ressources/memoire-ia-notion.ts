import type { Ressource } from "./types";

/**
 * Guide officiel Notion « Set up Notion for your agent » (v0.0.6, publié le
 * 30/10/2026) : https://developers.notion.com/prompts/setup
 *
 * Chaque affirmation ci-dessous a été vérifiée sur cette page. Durée de mise
 * en place et compatibilité Gemini non confirmées : volontairement absentes.
 */
const SETUP_URL = "https://developers.notion.com/prompts/setup";

/** Prompt à donner à l'IA (formulation recommandée). */
const PROMPT = `Help me set up Notion as my context system using this guide: ${SETUP_URL}`;
const Q = encodeURIComponent(PROMPT);
const LOGOS = "/ressources/memoire-ia-notion/logos";

export const memoireIaNotion: Ressource = {
  slug: "memoire-ia-notion",
  titre: "Donne une mémoire à toutes tes IA, dans ton Notion",
  accroche:
    "Un lien à coller, et Claude ou ChatGPT ne repartent plus de zéro à chaque conversation.",
  descriptionSeo:
    "Le guide officiel de Notion pour faire de ton espace la mémoire partagée de tes IA (Claude, ChatGPT…). Un lien à coller, et tes IA ne repartent plus de zéro.",
  datePublication: "2026-11-07",
  tags: ["IA", "Notion", "Guide"],
  media: {
    type: "animation",
    nom: "memoire-ia",
    alt: "Claude, Gemini et ChatGPT envoient leurs informations vers Notion, qui devient leur mémoire commune",
  },
  source: {
    label: "Guide officiel Notion « Set up Notion for your agent »",
    url: SETUP_URL,
  },
  sections: [
    {
      type: "copie",
      id: "lien",
      titre: "À copier",
      valeur: PROMPT,
      boutonCopier: "Copier les instructions à donner à l'IA",
      consigne:
        "Colle ces instructions dans Claude ou ChatGPT : l'IA lance la configuration et te guide étape par étape.",
      // `?q=` pré-remplit le message chez Claude et ChatGPT. Gemini n'a pas de
      // paramètre officiel : le prompt est copié au clic, il suffit de coller.
      ouvrirDans: [
        { label: "Installer sur Claude", url: `https://claude.ai/new?q=${Q}`, logo: `${LOGOS}/claude.webp` },
        { label: "Installer sur ChatGPT", url: `https://chatgpt.com/?q=${Q}`, logo: `${LOGOS}/chatgpt.webp` },
        { label: "Installer sur Gemini", url: "https://gemini.google.com/app", logo: `${LOGOS}/gemini.webp` },
      ],
    },
    {
      type: "cta",
      id: "cta-final",
      variante: "final",
      titre:
        "Tu veux aller plus loin et structurer tout ton Notion pour que ton équipe et tes IA travaillent dessus ?",
      texte:
        "On fait le point sur ton organisation actuelle et on voit ce qui vaut le coup d'être construit.",
      bouton: "Réserver un appel",
    },
  ],
};
