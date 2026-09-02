# consultant-notion.fr

Landing page one-page orientée conversion pour **Théo Gouman**, consultant
Notion indépendant. Objectif unique : convertir vers un formulaire de
qualification qui débouche sur une prise de rendez-vous.

Next.js (App Router) · TypeScript · Tailwind CSS v4 · light mode ·
build-time + ISR.

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseigner les variables
npm run dev                  # http://localhost:3000
```

## Variables d'environnement

| Variable | Portée | Rôle |
| --- | --- | --- |
| `NOTION_API_TOKEN` | **serveur, secret** | Token de l'intégration Notion. Jamais exposé au client, jamais committé. |
| `NOTION_CASE_STUDIES_DATABASE_ID` | serveur | ID de la base études de cas (défaut : `a9a77a8e49af4c83bb6c3cfc67706b20`). |
| `NOTION_CRM_DATABASE_ID` | serveur | ID de la base CRM alimentée à chaque réservation (défaut : `70703f6c7f4a45df865150c9f3ec8fb3`). |
| `NEXT_PUBLIC_BASE_URL` | public | URL de base publique (liens manage + add-to-calendar des e-mails). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | **serveur, secret** | App OAuth2 Google existante. |
| `GOOGLE_REFRESH_TOKEN` | **serveur, secret** | Refresh token offline de Théo (app en statut Production). |
| `GOOGLE_CALENDAR_ID` | serveur | Agenda host (`theo@gouman.fr`). |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | **serveur, secret** | Accès base (server-only, bypass RLS). |
| `RESEND_API_KEY` | **serveur, secret** | Envoi de tous les e-mails. |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | **serveur, secret** | Accès `/admin` + signature du cookie de session. |
| `CRON_SECRET` | **serveur, secret** | Protège `/api/cron/reminders` (en-tête `x-cron-secret`). |

À enregistrer dans les variables d'environnement Vercel. Sans
`NOTION_API_TOKEN`, le build reste fonctionnel : la grille d'études de cas
affiche un état vide (aucune erreur).

## Architecture

```
src/
├── app/
│   ├── globals.css        # Design system (tokens, fond de marque, animations)
│   ├── layout.tsx         # Métadonnées FR, OpenGraph, lang="fr", fond de marque
│   ├── page.tsx           # Assemble les 11 blocs (revalidate = 3600 → ISR)
│   ├── opengraph-image.tsx# Image de partage générée dynamiquement
│   ├── icon.svg / robots / sitemap
├── components/
│   ├── sections/          # Les 11 blocs de la landing + Header/Footer
│   ├── ui/                # CtaButton (CTA unique → /rdv), Section, Reveal
│   ├── case-studies/      # Grille + cartes (filtres par secteur)
│   └── notion/            # Moteur morph iOS + NotionRenderer
├── lib/
│   ├── content.ts         # Tout le copy (zones [À AFFINER] regroupées)
│   ├── spring.ts          # Physique du morph (constantes exactes)
│   └── notion/            # client (server-only) · router · case-studies · types
├── middleware.ts          # Protection /admin (cookie signé)
└── modules/booking/       # Booker maison, isolé et réutilisable (voir plus bas)
```

## Études de cas (Notion)

Rendu au **build + ISR** (`revalidate = 3600`) : Notion reste la source
d'édition, la page reste rapide, le contenu se rafraîchit sans redéploiement.

- Base : `Titre` (title), `Image` (files), `Secteur d'activité` (multi-select).
- Clic sur une carte → **morph iOS** (§6) : la surface morphe de la carte
  vers le panneau (rayon 16 → 24), le titre voyage (hero title), le contenu
  fait un fondu enchaîné. Fermeture par clic hors panneau, bouton ×, ou Échap.
  Navigation cas précédent / suivant aux flèches ← →.
- `prefers-reduced-motion` désactive le morph (ouverture/fermeture nettes).

## Booker maison (`src/modules/booking/`)

Système de prise de rendez-vous full-custom (équivalent Calendly), sans
dépendance à un service de scheduling payant. Isolé dans son propre module pour
réutilisation.

- **Modal sur la page principale** : le CTA ouvre un modal (backdrop flouté sur
  desktop, feuille remontant du bas sur mobile). Calendrier mensuel -> choix
  d'une date -> morphisme vers les créneaux -> formulaire de qualification.
  Créneaux calculés côté serveur (Google freebusy + règles admin), affichés
  dans le fuseau du lead (sélecteur de fuseau custom). Pas de route dédiée.
- **Gestion** `/rdv/manage/[token]` : reprogrammer / annuler via lien tokenisé.
- **Admin** `/admin` : règles + planning hebdo + réservations à venir
  (protégé par mot de passe, cookie signé — pas de Supabase Auth).
- **E-mails** : 100 % via Resend (confirmation, reprogrammation, annulation,
  rappel H-3, notifications internes) avec `.ics` + add-to-calendar.
- **Fuseaux** : stockage UTC, calculs via Luxon, aucun offset manuel.

```
src/modules/booking/
├── server/       # supabase · settings · google · availability · bookings · resend · ics · flow · crm
├── components/   # BookingFlow · SlotPicker · QualificationForm · ManageBooking
├── admin/        # SettingsForm · BookingsList
├── emails/       # templates (voix de Théo) · links
├── lib/          # timezone (Luxon) · tokens · validation · rate-limit · admin-auth
└── types.ts
```

### Mise en place (une fois)

1. **Base** : appliquer `supabase/migrations/0001_booking_schema.sql` (tables
   `settings` + `bookings`, index anti-double-booking, seed). Déjà appliqué sur
   le projet Supabase existant.
2. **Variables d'env** Vercel : voir le tableau ci-dessus (Google, Supabase,
   Resend, admin, cron).
3. **Resend** : authentifier `consultant-notion.fr` (SPF + DKIM + DMARC).
4. **Google** : app OAuth en statut **Production**, scopes Calendar autorisés,
   `GOOGLE_REFRESH_TOKEN` d'un accès offline de Théo.
5. **Rappel H-3** : après le premier déploiement, exécuter
   `supabase/migrations/0002_booking_reminders_cron.sql` (planifie pg_cron →
   `/api/cron/reminders` via pg_net, secret dans Supabase Vault). Inclut aussi
   la purge RGPD (> 12 mois).

Tests fuseaux (bascules d'heure incluses) : `npm test`.

## Liens de campagne — `?l=1`, `?source=`, `?post=`

Trois paramètres d'URL, lus au chargement de la landing (`BookingModalProvider`) :

| Paramètre | Effet |
| --- | --- |
| `?l=1` | Ouvre directement le modal de réservation sur le calendrier — un clic de moins depuis un post, une bio ou une newsletter. |
| `?source=` | D'où vient le clic (`linkedin`, `youtube`, `newsletter`…). |
| `?post=` | Quelle publication précisément (`carrousel-notion-crm`, `video-12`…). |

Exemple : `https://consultant-notion.fr/?l=1&source=linkedin&post=carrousel-notion-crm`.

`source` et `post` sont normalisés (trim, 120 caractères max), mémorisés le
temps de l'onglet (`sessionStorage`, premier contact gagnant) et enregistrés à
la réservation dans `bookings.acq_source` / `bookings.acq_post`
(migration `0004_acquisition_channel.sql`).

À la confirmation, la valeur `source⎜post` part vers le CRM Notion
(`server/crm.ts`) dans la propriété **Canal d'acquisition**, et apparaît dans
la notification interne. Règles de format : les deux paramètres ->
`source⎜post` ; un seul -> la valeur seule ; aucun -> propriété laissée vide.

Côté CRM (base « CRM @Gouman ») :

- fiche absente pour cet e-mail -> création (`Nom`, `E-mail`, `Job` = activité,
  `État` = **Rdv Pris**, `Canal d'acquisition`) ;
- fiche déjà présente -> on ne remplit que `Canal d'acquisition` s'il est vide
  (l'attribution d'origine et l'`État` en cours ne sont jamais écrasés).

L'écriture est **best-effort** et hors chemin critique (`after()`) : un CRM
indisponible, un token absent ou une base non partagée avec l'intégration
n'empêchent jamais une réservation. **Prérequis unique** : partager la base CRM
avec l'intégration Notion (`⋯` → Connexions → l'intégration de
`NOTION_API_TOKEN`), sinon l'API répond 404 et rien n'est écrit.

## Design system

Repris de `Notion-Club/Infrastructure`. Accent unique corail `#e0625a`,
texte `#000` / `#52525b`, surface `#f5f2f2`. Une seule famille : **SF Pro
Display** (déposer les `.otf` dans `public/fonts/` — cf. le README dédié ;
repli automatique sur `-apple-system` en leur absence).

## Éléments restant à compléter — `[À AFFINER]`

Regroupés dans `src/lib/content.ts` :

1. Logos clients (bloc 2)
2. Témoignages (bloc 7)
3. Bio + parcours de Théo (bloc 9)
4. Certifications Notion exactes (bloc 9)
5. YouTube / newsletter — inclure ou non (bloc 9)
6. Réponses FAQ (bloc 10) — rédigées provisoirement, à valider
7. Placeholder « activité » — version large retenue, à confirmer

### Booker — points à confirmer (§15 du brief)

1. **Règle de reprogrammation** : défaut = tout créneau futur valide (≥ délai
   mini). À confirmer, ou ajouter « pas plus tôt que l'actuel ».
2. **Expéditeur** : défaut `rdv@consultant-notion.fr` (Reply-To
   `theo@gouman.fr`). Éditable en admin.
3. **Plages de disponibilité** initiales : Lun–Ven 09:00–12:00 / 14:00–18:00
   (semées en base, éditables en admin).
4. **Textes des e-mails** : rédigés dans la voix de Théo (`emails/templates.ts`),
   à valider.
