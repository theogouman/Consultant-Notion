import type { Ressource } from "./types";

/**
 * Guide officiel Notion « Set up Notion for your agent » (v0.0.6, publié le
 * 30/10/2026) : https://developers.notion.com/prompts/setup
 *
 * Chaque affirmation ci-dessous a été vérifiée sur cette page. Ce qu'elle ne
 * confirme pas est marqué `[À VÉRIFIER]`.
 */
const SETUP_URL = "https://developers.notion.com/prompts/setup";

export const memoireIaNotion: Ressource = {
  slug: "memoire-ia-notion",
  titre: "Donne une mémoire à toutes tes IA, dans ton Notion",
  accroche:
    "En 5 minutes [À VÉRIFIER], Claude, ChatGPT ou Gemini [À VÉRIFIER] ne repartent plus de zéro à chaque conversation.",
  descriptionSeo:
    "Le guide officiel de Notion pour faire de ton espace la mémoire partagée de tes IA (Claude, ChatGPT…). Un lien à coller, et tes IA ne repartent plus de zéro.",
  datePublication: "2026-11-07",
  tags: ["IA", "Notion", "Guide"],
  media: {
    type: "video",
    src: "/ressources/memoire-ia-notion/animation.mp4",
    alt: "Animation : une IA enregistre son contexte dans Notion, puis une autre IA le relit.",
  },
  source: {
    label: "Guide officiel Notion « Set up Notion for your agent »",
    url: SETUP_URL,
  },
  sections: [
    {
      type: "intro",
      id: "probleme",
      titre: "Le problème : ton IA oublie tout",
      paragraphes: [
        "À chaque nouvelle conversation, tu recolles ton contexte. Ton activité, tes clients, tes projets, ta façon de travailler. Encore et encore.",
        "Et quand ton IA retient quelque chose, ça reste enfermé chez elle. Tu ne peux pas l'emmener ailleurs. Tu passes de Claude à ChatGPT ? Tu recommences à zéro.",
      ],
    },
    {
      type: "intro",
      id: "solution",
      titre: "Ce que fait le guide de Notion",
      paragraphes: [
        "Notion a publié un guide officiel écrit pour les IA, pas pour les humains. Tu colles son lien dans ton IA. Elle le lit et configure elle-même ton Notion comme sa mémoire.",
        "Ensuite, toute IA branchée à ton Notion, et à qui tu as donné les mêmes instructions, peut relire cette mémoire. Ton contexte ne dépend plus d'un seul outil.",
      ],
    },
    {
      type: "liste",
      id: "benefices",
      titre: "Ce que tu y gagnes",
      items: [
        {
          titre: "Un contexte partagé entre tes IA",
          texte:
            "Tes préférences, tes décisions et l'état de tes projets vivent dans Notion. Chaque IA connectée les consulte avant de répondre.",
        },
        {
          titre: "Une mémoire qui t'appartient",
          texte:
            "Ce sont des pages Notion. Tu les lis, tu les corriges, tu les partages. Rien n'est caché dans un outil que tu ne contrôles pas.",
        },
        {
          titre: "Des livrables qui survivent au chat",
          texte:
            "Les documents utiles produits avec ton IA sont rangés dans Notion, avec leur source et leur date. Fini de les chercher dans un vieil historique.",
        },
        {
          titre: "Un suivi de projets visible par toi et tes IA",
          texte:
            "Où en est chaque projet, ce qui a été décidé : c'est écrit au même endroit, pour toi comme pour tes IA. Suivi des tâches : [À VÉRIFIER].",
        },
      ],
    },
    {
      type: "copie",
      id: "lien",
      titre: "À copier",
      valeur: SETUP_URL,
      consigne:
        "Colle ce lien dans Claude ou ChatGPT et demande-lui de lancer la configuration.",
    },
    {
      type: "etapes",
      id: "etapes",
      titre: "Ce qui se passe ensuite, étape par étape",
      intro:
        "Ton IA te guide une étape à la fois, avec des messages courts. Tu n'as rien de technique à faire.",
      etapes: [
        {
          titre: "Connecter Notion à ton IA",
          texte:
            "Ton IA te demande de connecter ton Notion via le connecteur MCP de Notion. Elle confirme ensuite ton nom et ton espace de travail, pour être sûre d'être au bon endroit.",
        },
        {
          titre: "Choisir le niveau",
          texte: "Deux options te sont proposées :",
          details: [
            "« Shared context layer » (recommandé) : ton IA enregistre au fil de l'eau tes souvenirs, tes livrables et tes skills dans Notion. Elle devient plus utile avec le temps.",
            "« Basic setup » : ton IA crée seulement un guide qu'elle consulte en premier. Rien d'autre n'est enregistré.",
          ],
        },
        {
          titre: "Créer ton « Agent Operating Guide »",
          texte:
            "Ton IA crée une page privée dans ton Notion : ton espace, où ranger quoi, tes préférences et ce qu'il ne faut pas toucher. Elle te donne ensuite des instructions personnalisées à coller dans les réglages de ton IA, pour qu'elle consulte Notion d'abord. Pour Claude et ChatGPT, elle t'indique le chemin exact dans les réglages.",
        },
        {
          titre: "Mettre en place une routine quotidienne",
          texte:
            "Uniquement en « Shared context layer », et seulement si tu dis oui. Chaque jour, ton IA enregistre les nouveaux souvenirs et livrables utiles, et vérifie si le guide de Notion a évolué. Elle ne lit pas tes conversations en entier et n'installe rien sans te demander.",
        },
        {
          titre: "Importer ton contexte existant",
          texte:
            "Ton IA te propose de ranger dans Notion ce qu'elle sait déjà : tes travaux récents, ses mémoires sur toi, tes skills. Chaque élément garde sa source et sa date.",
          details: [
            "Jamais de mots de passe ni de secrets.",
            "Jamais de transcriptions de conversations.",
          ],
        },
        {
          titre: "Finaliser le guide",
          texte:
            "Ton IA complète ton Agent Operating Guide avec l'emplacement réel de tes mémoires, skills et documents. Elle te fait un récapitulatif et te propose de tester avec une nouvelle conversation, ou avec une autre IA.",
        },
      ],
    },
    {
      type: "cta",
      id: "cta-etapes",
      variante: "discret",
      titre: "Tu préfères qu'on le mette en place ensemble ?",
      texte: "On regarde ensemble comment ça s'intègre à ton Notion actuel.",
      bouton: "Réserver un appel",
    },
    {
      type: "intro",
      id: "exemple",
      titre: "Un exemple concret",
      style: "encadre",
      paragraphes: [
        "Lundi, tu commences le plan d'un nouveau projet avec Claude. Les décisions et le plan sont enregistrés dans Notion.",
        "Mardi, tu ouvres ChatGPT. Il lit ton guide et tes pages projet dans Notion. Il reprend là où tu en étais, sans que tu réexpliques quoi que ce soit.",
      ],
    },
    {
      type: "faq",
      id: "faq",
      titre: "Questions fréquentes",
      questions: [
        {
          q: "Avec quelles IA ça marche ?",
          r: "Le guide donne les réglages exacts pour Claude et ChatGPT. Pour les autres IA, il faut qu'elles puissent se connecter à Notion via le connecteur MCP : l'IA cherche alors elle-même où coller ses instructions. Gemini et les autres : [À VÉRIFIER].",
        },
        {
          q: "Qu'est-ce qui est stocké, et qu'est-ce qui ne l'est jamais ?",
          r: "Stocké : tes préférences, tes décisions, l'état de tes projets, les livrables que tu valides et tes skills, avec leur source et leur date. Jamais : mots de passe, secrets, transcriptions de conversations, bavardages, ni contenus auxquels l'IA n'a pas accès.",
        },
        {
          q: "Est-ce que je garde la main ?",
          r: "Oui. En « Shared context layer », ton choix vaut accord pour que l'IA crée et remplisse ses pages privées. Pour tout le reste, elle demande avant : mettre quelque chose dans un espace partagé, modifier un guide existant, lancer la routine quotidienne, supprimer, déplacer ou réorganiser. Et comme tout est dans Notion, tu peux tout relire et corriger.",
        },
        {
          q: "Faut-il un abonnement Notion payant ?",
          r: "Le guide n'en parle pas. [À VÉRIFIER : offre Notion requise pour le connecteur MCP, et offre requise côté Claude / ChatGPT pour les connecteurs.]",
        },
        {
          q: "Peut-on l'utiliser en équipe ?",
          r: "La configuration est personnelle : tout est créé dans ton espace privé. L'IA demande avant de mettre quoi que ce soit dans un espace partagé ou d'équipe. Un usage collectif complet : [À VÉRIFIER]. C'est justement le genre de structure qu'on construit ensemble.",
        },
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
