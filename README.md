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
| `NEXT_PUBLIC_BOOKING_URL` | public | Lien de prise de rendez-vous (destination du formulaire). **[À AFFINER]** |

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
│   ├── ui/                # CtaButton (CTA unique), Section, Reveal
│   ├── form/              # QualificationForm (§9)
│   ├── case-studies/      # Grille + cartes (filtres par secteur)
│   └── notion/            # Moteur morph iOS + NotionRenderer
└── lib/
    ├── content.ts         # Tout le copy (zones [À AFFINER] regroupées)
    ├── spring.ts          # Physique du morph (constantes exactes)
    └── notion/            # client (server-only) · router · case-studies · types
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
7. `NEXT_PUBLIC_BOOKING_URL` (`.env`)
8. Placeholder « activité » — version large retenue, à confirmer

> Le formulaire redirige vers `NEXT_PUBLIC_BOOKING_URL` sans transmettre de
> données en query string. Pour capturer les réponses (CRM / webhook), voir
> le `TODO` dans `src/components/form/QualificationForm.tsx`.
