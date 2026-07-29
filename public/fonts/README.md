# Polices — SF Pro Display

Déposer ici les fichiers `.otf` (repris de `Notion-Club/Infrastructure`,
`src/shared/fonts/`) :

- `SFProDisplay-Regular.otf` (400)
- `SFProDisplay-Medium.otf` (500)
- `SFProDisplay-Bold.otf` (700)

Les déclarations `@font-face` correspondantes sont dans
`src/app/globals.css`. En l'absence de ces fichiers, la stack de repli
(`-apple-system, BlinkMacSystemFont, …`) prend automatiquement le relais —
la page reste fonctionnelle mais sans le rendu exact de SF Pro Display sur
les navigateurs non-Apple.

> SF Pro Display est une police propriétaire Apple. Ne pas committer les
> fichiers si la licence ne le permet pas dans ce dépôt ; les fournir via
> le pipeline de build / un stockage privé le cas échéant.
