# Images

Déposez ici toutes les images du site. Tout ce qui est sous `public/` est
servi à la racine du domaine.

## Sous-dossiers

- **`Logo-Clients/`** — logos clients affichés dans la bande de preuve
  (bloc 2). Formats conseillés : `.svg` (idéal) ou `.png` détouré sur fond
  transparent.
- **`Annexes/`** — toutes les autres images (illustrations, captures,
  visuels de sections, etc.).

## Comment référencer une image

Un fichier `public/images/Logo-Clients/acme.png` est accessible à l'URL
`/images/Logo-Clients/acme.png`.

```tsx
import Image from "next/image";

<Image
  src="/images/Logo-Clients/acme.png"
  alt="Acme"
  width={120}
  height={40}
/>;
```

> Astuce : conservez des noms de fichiers simples, en minuscules et sans
> espaces ni accents (ex. `cabinet-durand.png`), pour des URLs propres.

Les fichiers `.gitkeep` ne servent qu'à versionner les dossiers vides ; vous
pouvez les laisser.
