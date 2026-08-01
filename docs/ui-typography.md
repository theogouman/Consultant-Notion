# Typographie & équilibrage des lignes

Règle de rédaction visuelle pour **tout le site** (existant et futur). But :
un rendu compact et soigné, sans ligne « orpheline ».

## 1. Équilibrage des lignes (line-balancing)

> Un titre ou un texte court d'affichage ne doit **jamais** se casser en
> « 15 mots sur la 1re ligne + 1 mot sur la 2de ». Les lignes doivent être de
> **longueur homogène** pour donner un effet compact.

### Deux mesures, selon la longueur

Il existe **deux presets** (définis dans `src/app/globals.css`). Les deux
posent `text-wrap: balance` + `margin-inline: auto` ; ils ne diffèrent que par
la **mesure** (largeur max), ce qui change le **nombre de lignes** obtenu :

| Classe | Mesure | Pour quoi |
| --- | --- | --- |
| `.nc-balance` | `34ch` (compacte) | Microcopie de support, sous-textes courts. Vise ~2 lignes serrées. |
| `.nc-balance-wide` | `46ch` (**demi-mesure**) | Titres / phrases courtes d'affichage. Garde **1 à 2 lignes** au lieu de casser 5 mots sur 3 lignes. |

> ⚠️ **Ne pas sur-découper.** Une mesure trop étroite casse une phrase de
> ~5 mots en 3 lignes de 1–2 mots : « ça fait long pour rien ». Pour un titre
> ou une phrase courte, préférer `.nc-balance-wide` (ou une mesure large) afin
> de rester sur **deux lignes maximum**. On ne descend sur `.nc-balance`
> (compacte) que pour de la microcopie qu'on veut resserrer.

```tsx
{/* ✅ Titre court : demi-mesure => 1–2 lignes */}
<h2 className="nc-title nc-balance-wide text-2xl">
  Notre rendez-vous est confirmé pour le
</h2>

{/* ✅ Microcopie de support : mesure compacte */}
<p className="nc-balance text-sm text-muted">
  Merci d'avoir pris le temps de replanifier cet appel ! Une confirmation a
  été envoyée par mail.
</p>

{/* ❌ Mauvais : phrase de 5 mots cassée en 3 lignes (mesure trop étroite) */}
<p className="nc-balance text-2xl" style={{ "--nc-measure": "14ch" }}>
  Notre rendez-vous est confirmé
</p>
```

### Ajuster la mesure

Pour un cas particulier, surcharger la variable CSS `--nc-measure` (jamais via
`max-w-*`, qui entrerait en conflit avec le preset) :

```tsx
<h1 className="nc-title nc-balance-wide text-3xl" style={{ "--nc-measure": "22rem" }}>
  …
</h1>
```

### Quand l'utiliser

- **Toujours** : titres (`h1`/`h2`), sous-titres, textes de confirmation,
  messages courts centrés.
- **Inutile** : longs blocs de paragraphe pleine largeur (le corps de texte
  courant), où l'équilibrage n'apporte rien et coûte en calcul.

### Note de compatibilité

`text-wrap: balance` est un **enrichissement progressif** (Chrome 114+,
Safari 17.5+, Firefox 121+). Sur les navigateurs plus anciens, le texte se
comporte comme un `text-wrap: normal` classique (aucune régression). Le
`max-width` de `.nc-balance` continue, lui, de contraindre la mesure partout.

## 2. Cohérence de la typographie

- **Une seule famille** : `SF Pro Display` (voir `@font-face` dans
  `globals.css`), repli `-apple-system…`.
- **Titres** : classe `.nc-title` (700, `letter-spacing: -0.03em`).
- **Puce de date** (`dateChip`) et phrase qui l'entoure doivent partager la
  **même taille et le même poids** de police : une puce n'est différenciée que
  par son fond gris (`bg-raised`) et son arrondi, **pas** par une police plus
  grosse ou plus grasse. Éviter d'ajouter `font-medium`/`font-bold` à une puce
  insérée dans une phrase de poids normal.

## 3. Où c'est déjà appliqué

- `src/modules/booking/components/BookingFlow.tsx` — écran de confirmation
  on-page (titre + sous-texte).
- `src/modules/booking/components/ManageBooking.tsx` — page de gestion /
  reprogrammation (titres via `Centered`, sous-textes).
