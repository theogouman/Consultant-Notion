#!/usr/bin/env python3
"""
normalize_logos.py — Homogénéise le poids optique d'un jeu de logos hétérogènes.

Le problème : des logos au même format de fichier mais de proportions très
différentes (carrés pleins vs bandeaux horizontaux) n'ont pas le même "poids
optique". Contraindre width/height en CSS ne corrige pas ça. Ce script égalise
la surface réellement occupée par chaque logo, puis les recentre dans un canvas
de taille identique.

Pipeline :
  1. Trim   : recadre chaque logo sur sa vraie bounding box (canal alpha).
  2. Mesure : aire de la boîte (bbox) ou pixels encrés (ink), au choix.
  3. Égalise: chaque logo est ramené à la métrique MÉDIANE du set
              (scale_rel = sqrt(médiane / mesure_logo)).
  4. Cadre  : on cherche le plus grand facteur global S tel que MÊME le logo
              le plus contraignant tienne dans sa boîte max (aucun débordement),
              modulé par --fill pour la marge.
  5. Override: correction manuelle par logo pour les outliers de densité.
  6. Colle  : chaque logo centré sur un canvas transparent IDENTIQUE → côté
              front, object-fit:contain dans des conteneurs égaux = alignement
              parfait, le poids optique baké dans l'image est préservé.

Métrique (--metric) :
  bbox : aire de la boîte englobante. Doux et stable. Défaut.
  ink  : pixels réellement encrés (alpha sommé). Colle au poids perçu — agrandit
         les tracés fins, réduit les blocs pleins. Plus agressif.

Usage :
  python normalize_logos.py --src ./Logo-Clients --out ./Logo-Clients-normalized
  python normalize_logos.py --src ./in --out ./out --metric ink --fill 0.9
"""
import argparse, json, math, os, glob, statistics
from PIL import Image

# Corrections manuelles : "NomFichierSansExtension" -> multiplicateur.
# 1.0 = neutre, >1 agrandit, <1 réduit. À ajuster après un premier rendu.
OVERRIDES = {
    # "Senef": 0.90,
    # "Mister IA": 1.10,
}

def measure(crop, metric):
    alpha = crop.split()[-1]
    if metric == "ink":
        return sum(alpha.getdata()) / 255.0
    w, h = crop.size
    return float(w * h)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src", required=True, help="dossier des PNG source")
    p.add_argument("--out", default=None,
                   help="dossier de sortie. Omis = écrase les fichiers dans --src (in-place).")
    p.add_argument("--metric", choices=["bbox", "ink"], default="bbox")
    p.add_argument("--canvas-w", type=int, default=640)
    p.add_argument("--canvas-h", type=int, default=320)
    p.add_argument("--fill", type=float, default=0.9,
                   help="marge : 0.9 = le logo le plus contraignant occupe 90% de sa boite max")
    p.add_argument("--max-w-frac", type=float, default=0.94)
    p.add_argument("--max-h-frac", type=float, default=0.92)
    p.add_argument("--overrides", default=None,
                   help="chemin JSON {nom: facteur} (remplace la table interne)")
    args = p.parse_args()

    overrides = OVERRIDES
    if args.overrides and os.path.exists(args.overrides):
        overrides = json.load(open(args.overrides))

    out_dir = args.out or args.src            # in-place si --out omis
    inplace = os.path.abspath(out_dir) == os.path.abspath(args.src)
    os.makedirs(out_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(args.src, "*.png")))
    if not files:
        raise SystemExit(f"Aucun PNG dans {args.src}")
    if inplace:
        print("  ⚠ mode in-place : les fichiers source seront écrasés "
              "(assure-toi d'avoir commit avant).\n")

    max_w = args.canvas_w * args.max_w_frac
    max_h = args.canvas_h * args.max_h_frac

    # 1-2. Trim + mesure
    items = []
    for f in files:
        im = Image.open(f).convert("RGBA")
        bbox = im.split()[-1].getbbox()
        if bbox is None:
            print(f"  ! {os.path.basename(f)} vide, ignoré")
            continue
        crop = im.crop(bbox)
        crop.load()  # charge les pixels en RAM : indispensable si on écrase la source
        items.append([f, crop, measure(crop, args.metric)])

    ref = statistics.median(m for _, _, m in items)

    # 3. scale relatif : égalise la métrique -> médiane
    for it in items:
        f, crop, m = it
        name = os.path.splitext(os.path.basename(f))[0]
        rel = math.sqrt(ref / m) * overrides.get(name, 1.0)
        it.append(rel)

    # 4. facteur global S : le plus grand qui garde chaque logo dans sa boite max
    S = min(min(max_w / (crop.size[0] * rel), max_h / (crop.size[1] * rel))
            for _, crop, _, rel in items) * args.fill

    print(f"metric={args.metric}  ref(médiane)={ref:,.0f}  "
          f"canvas={args.canvas_w}x{args.canvas_h}  fill={args.fill}  S={S:.4f}\n")

    # 6. resize + collage centré
    for f, crop, m, rel in items:
        name = os.path.splitext(os.path.basename(f))[0]
        w, h = crop.size
        nw, nh = max(1, round(w * rel * S)), max(1, round(h * rel * S))
        resized = crop.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", (args.canvas_w, args.canvas_h), (0, 0, 0, 0))
        canvas.alpha_composite(resized,
                               ((args.canvas_w - nw) // 2, (args.canvas_h - nh) // 2))
        canvas.save(os.path.join(out_dir, os.path.basename(f)))
        print(f"  {name:26s} {w}x{h} -> {nw}x{nh}")

    print(f"\nOK -> {out_dir}")

if __name__ == "__main__":
    main()
