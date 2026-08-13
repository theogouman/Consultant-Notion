"use client";

import { useEffect, useRef } from "react";

/**
 * Visuel carte 3 — « Construction clé en main ».
 * Reprise fidèle de l'aperçu validé (apercu-carte3-notion.html) : fenêtre Notion
 * dark, page « Architecture de votre Notion » + mind map (hub + 5 domaines),
 * puis migration des nœuds dans la sidebar et apparition d'un board Kanban
 * skeleton. Boucle rAF, en pause hors-écran (--nc-anim-state), état final figé
 * en prefers-reduced-motion.
 *
 * Adaptations vs aperçu : fenêtre resserrée (plus carrée, sans chevauchement) ;
 * traits hub→domaines conservés et rendus plus premium (dégradé corail + flux) ;
 * relations rouges pointillées supprimées ; pas de légende ni de boutons.
 */

// Dimensions internes de la fenêtre. Aperçu validé = 960×620 ; resserré à 880
// (plus carré, éléments plus lisibles à l'échelle) sans chevauchement.
const WIDTH = 880;
const HEIGHT = 620;

export default function NotionBuild() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scaler = root.querySelector<HTMLElement>(".nc-v-scaler");
    const win = root.querySelector<HTMLElement>(".nc-v-notion-win");
    if (!scaler || !win) return;

    const SVGNS = "http://www.w3.org/2000/svg";
    const LOOP = 11500;
    const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeIO = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const S = "stroke:#a9a9a7";
    const IC: Record<string, string> = {
      hash: `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" style="${S}"><path d="M5 9h14M5 15h14M11 4l-2 16M15 4l-2 16"/></svg>`,
      grid: `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" style="${S}"><path d="M4 4h6v6h-6zM14 4h6v6h-6zM4 14h6v6h-6zM14 14h6v6h-6z"/></svg>`,
      user: `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" style="${S}"><path d="M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/></svg>`,
      book: `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" style="${S}"><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"/><path d="M3 6v13M12 6v13M21 6v13"/></svg>`,
      check: `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" style="${S}"><path d="M9 12l2 2l4 -4"/><path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18"/></svg>`,
      target: `<svg class="ic" viewBox="0 0 24 24" width="20" height="20" style="${S}"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg>`,
    };

    // Markup de la fenêtre Notion (sidebar + main + fly), avatar local.
    win.innerHTML = `
      <aside class="sidebar">
        <div class="sb-top">
          <div class="ws"><div class="logo"></div><div class="nm">Espace de travail</div>
            <span class="cv"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6l6 -6"/></svg></span></div>
          <div class="navrow">
            <div class="navitem"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12l-2 0l9 -9l9 9l-2 0"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-7"/></svg>Home</div>
            <div class="navitem"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/></svg>Notification</div>
            <div class="navicon"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg></div>
          </div>
        </div>
        <div class="seclbl">Espaces d'équipe</div>
        <div class="sb-items"></div>
        <div class="sb-bottom">
          <div class="newchat"><svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M13 3l-9 11h7l-1 7l9 -11h-7z"/></svg><span>New chat</span><span class="kbd">⌘O</span></div>
          <div class="compose"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg></div>
        </div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div class="tb-l">
            <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="18" height="18"><path d="M4 6h16M4 12h16M4 18h16"/></svg></span>
            <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="18" height="18"><path d="M15 6l-6 6l6 6"/></svg></span>
            <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6l-6 6"/></svg></span>
            <div class="crumb"><span>⚛️</span><span>Votre Notion</span><span class="sep">/</span><span>Architecture</span></div>
          </div>
          <div class="tb-r">
            <span class="edited">Modifié le 1 juil.</span>
            <div class="avstack">
              <span class="av"><img src="/images/Annexes/theo-gouman-avatar.png" alt="Théo Gouman"/></span>
              <span class="plus">+7</span>
            </div>
            <div class="share"><svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M8.7 10.7l6.6 -3.4"/><path d="M8.7 13.3l6.6 3.4"/><path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/></svg>Partager</div>
            <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/></svg></span>
            <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg></span>
          </div>
        </div>
        <div class="content">
          <div class="pagehead">
            <div class="pt-icon">⚛️</div>
            <div class="pt-h1">Architecture de votre Notion</div>
          </div>
          <div class="pagediv"></div>
          <div class="board"></div>
        </div>
      </div>
      <div class="fly"><svg class="lines">
        <defs>
          <linearGradient id="ncBranchGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${HEIGHT}">
            <stop offset="0" stop-color="#e0625a"/>
            <stop offset="1" stop-color="#e0625a" stop-opacity="0.35"/>
          </linearGradient>
        </defs>
      </svg></div>`;

    const notion = win;
    const pagehead = win.querySelector<HTMLElement>(".pagehead")!;
    const pagediv = win.querySelector<HTMLElement>(".pagediv")!;
    const board = win.querySelector<HTMLElement>(".board")!;
    const fly = win.querySelector<HTMLElement>(".fly")!;
    const lines = win.querySelector<SVGSVGElement>(".lines")!;

    type Node = {
      id: string;
      label: string;
      icon: string;
      mm: [number, number];
      side: [number, number];
      header?: boolean;
      el?: HTMLElement;
      lbl?: HTMLElement;
    };
    // nœuds : hub + 5 domaines. mm (mind-map, recentrée pour largeur 880) →
    // side (sidebar, sous « Espaces d'équipe »).
    const NODES: Node[] = [
      { id: "hub", label: "Votre Notion", icon: IC.hash, mm: [472, 330], side: [10, 118], header: true },
      { id: "proj", label: "Projets", icon: IC.grid, mm: [348, 230], side: [22, 150] },
      { id: "cli", label: "Clients", icon: IC.user, mm: [640, 230], side: [22, 174] },
      { id: "wiki", label: "Wiki", icon: IC.book, mm: [648, 340], side: [22, 198] },
      { id: "task", label: "Tâches", icon: IC.check, mm: [348, 450], side: [22, 222] },
      { id: "obj", label: "Objectifs", icon: IC.target, mm: [640, 450], side: [22, 246] },
    ];
    const byId: Record<string, Node> = Object.fromEntries(NODES.map((n) => [n.id, n]));
    NODES.forEach((n) => {
      const el = document.createElement("div");
      el.className = "node";
      el.innerHTML = `<span class="ni">${n.icon}</span><span class="nl">${n.label}</span>`;
      fly.appendChild(el);
      n.el = el;
      n.lbl = el.querySelector<HTMLElement>(".nl")!;
    });

    const domIds = ["proj", "cli", "wiki", "task", "obj"];
    // Traits hub→domaines : conservés, rendus premium (trait plein, dégradé
    // corail, léger halo). Les relations rouges pointillées sont supprimées.
    const branches = domIds.map((id) => {
      const halo = document.createElementNS(SVGNS, "line");
      halo.setAttribute("stroke", "#e0625a");
      halo.setAttribute("stroke-width", "4");
      halo.setAttribute("stroke-linecap", "round");
      halo.setAttribute("opacity", "0");
      lines.appendChild(halo);
      const l = document.createElementNS(SVGNS, "line");
      l.setAttribute("stroke", "url(#ncBranchGrad)");
      l.setAttribute("stroke-width", "1.7");
      l.setAttribute("stroke-linecap", "round");
      l.setAttribute("opacity", "0");
      lines.appendChild(l);
      return { id, l, halo };
    });

    // board Kanban skeleton
    const COLS = [
      { t: "Sales", c: "#c9847d", bg: "#3a2320", n: 4 },
      { t: "Admin", c: "#7ba7d9", bg: "#1f2b3a", n: 3 },
      { t: "Relation Client", c: "#cbab63", bg: "#332c1a", n: 3 },
      { t: "Process", c: "#82b078", bg: "#20301e", n: 2 },
    ];
    board.innerHTML = `
      <div class="board-tools">
        <span class="btab active"><svg class="ic" viewBox="0 0 24 24" width="15" height="15"><path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.397 .534a5 5 0 0 1 -7.127 -7.071l.524 -.463"/></svg>Pages liées</span>
        <span class="btab"><svg class="ic" viewBox="0 0 24 24" width="15" height="15" style="stroke:#6f6f6d"><path d="M3 4h18v4h-18zM5 8v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-10M10 12h4"/></svg>Archivées</span>
        <div class="btools-r">
          <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M4 6h16M6 12h12M9 18h6"/></svg></span>
          <span class="tb-ic"><svg class="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M3 9l4 -4l4 4M7 5v14M21 15l-4 4l-4 -4M17 5v14"/></svg></span>
          <span class="newbtn">Nouveau <svg class="ic" viewBox="0 0 24 24" width="13" height="13" style="stroke:#fff"><path d="M6 9l6 6l6 -6"/></svg></span>
        </div>
      </div>
      <div class="cols"></div>`;
    const colsEl = board.querySelector<HTMLElement>(".cols")!;
    const cards: { el: HTMLElement }[] = [];
    COLS.forEach((col) => {
      const c = document.createElement("div");
      c.className = "col";
      const h = document.createElement("span");
      h.className = "col-h";
      h.style.background = col.bg;
      h.style.color = col.c;
      h.textContent = col.t;
      h.style.opacity = "0";
      c.appendChild(h);
      cards.push({ el: h });
      for (let i = 0; i < col.n; i++) {
        const k = document.createElement("div");
        k.className = "kcard";
        const w = 44 + ((i * 37 + col.t.length * 11) % 44);
        k.innerHTML = `<span class="ki"></span><span class="kb" style="width:${w}%"></span>`;
        c.appendChild(k);
        cards.push({ el: k });
      }
      const nw = document.createElement("div");
      nw.className = "knew";
      nw.textContent = "+ Nouvelle page";
      nw.style.opacity = "0";
      c.appendChild(nw);
      cards.push({ el: nw });
      colsEl.appendChild(c);
    });

    function applyNode(n: Node, m: number) {
      const el = n.el!;
      el.style.left = lerp(n.mm[0], n.side[0], m).toFixed(1) + "px";
      el.style.top = lerp(n.mm[1], n.side[1], m).toFixed(1) + "px";
      const cardA = 1 - m;
      el.style.background = `rgba(37,37,37,${cardA.toFixed(2)})`;
      el.style.borderColor = `rgba(58,58,58,${cardA.toFixed(2)})`;
      el.style.padding = `${lerp(9, 5, m).toFixed(1)}px ${lerp(18, 11, m).toFixed(1)}px`;
      n.lbl!.style.fontSize = lerp(15, 13.5, m).toFixed(1) + "px";
      n.lbl!.style.color = n.header ? "#e0e0de" : m > 0.55 ? "#b8b8b6" : "#e6e6e5";
      n.lbl!.style.fontWeight = n.header ? "600" : "500";
      el.style.opacity = "1";
    }
    function center(n: Node): [number, number] {
      const x = parseFloat(n.el!.style.left) || n.mm[0];
      const y = parseFloat(n.el!.style.top) || n.mm[1];
      return [x + n.el!.offsetWidth / 2, y + n.el!.offsetHeight / 2];
    }

    const T = {
      appIn: 0.025, titleIn: 0.02, hub: 0.05, dom0: 0.08, domStep: 0.028, domD: 0.07,
      rel0: 0.24, rel1: 0.3, morph0: 0.37, morphD: 0.18, board0: 0.45, settle0: 0.74, hold: 0.88,
    };

    function draw(p: number) {
      const outA = p >= 0.96 ? easeOut((p - 0.96) / 0.04) : 0;
      notion.style.opacity = (easeOut(clamp(p / T.appIn)) * (1 - outA)).toFixed(3);

      // titre de page : apparaît puis DISPARAÎT (ne migre pas)
      const titleIn = easeOut(clamp((p - T.titleIn) / 0.06));
      const titleOut = easeOut(clamp((p - T.morph0) / 0.1));
      const titleO = titleIn * (1 - titleOut) * (1 - outA);
      pagehead.style.opacity = titleO.toFixed(2);
      const divIn = easeOut(clamp((p - 0.05) / 0.06));
      pagediv.style.opacity = (divIn * (1 - titleOut) * (1 - outA)).toFixed(2);

      // nœuds
      NODES.forEach((n) => {
        let appT0: number, appD: number;
        if (n.id === "hub") {
          appT0 = T.hub;
          appD = 0.06;
        } else {
          const i = domIds.indexOf(n.id);
          appT0 = T.dom0 + i * T.domStep;
          appD = T.domD;
        }
        const app = easeOut(clamp((p - appT0) / appD));
        const mOrder = n.id === "hub" ? 0 : 0.04 + domIds.indexOf(n.id) * 0.03;
        const m = easeIO(clamp((p - (T.morph0 + mOrder)) / T.morphD));
        applyNode(n, m);
        n.el!.style.opacity = (app * (1 - outA)).toFixed(2);
      });

      // branches (premium : trait plein dégradé corail + léger halo, draw-in)
      branches.forEach((b) => {
        const i = domIds.indexOf(b.id);
        const app = easeOut(clamp((p - (T.dom0 + i * T.domStep)) / T.domD));
        const [hx, hy] = center(byId.hub);
        const [dx, dy] = center(byId[b.id]);
        const x2 = lerp(hx, dx, app).toFixed(1);
        const y2 = lerp(hy, dy, app).toFixed(1);
        [b.l, b.halo].forEach((el) => {
          el.setAttribute("x1", String(hx));
          el.setAttribute("y1", String(hy));
          el.setAttribute("x2", x2);
          el.setAttribute("y2", y2);
        });
        const fade = 1 - easeOut(clamp((p - T.morph0) / 0.08));
        const o = app * fade * (1 - outA);
        b.l.setAttribute("opacity", o.toFixed(2));
        b.halo.setAttribute("opacity", (o * 0.12).toFixed(3));
      });

      // board
      board.style.opacity = (easeOut(clamp((p - T.board0) / 0.1)) * (1 - outA)).toFixed(2);
      cards.forEach((c, i) => {
        const o = easeOut(clamp((p - (T.board0 + 0.02 + i * 0.014)) / 0.06));
        c.el.style.opacity = (o * (1 - outA)).toFixed(2);
        c.el.style.transform = `translateY(${((1 - o) * 8).toFixed(1)}px)`;
      });
    }

    // 1) fit : échelle WIDTH -> largeur du conteneur
    const fit = () => {
      scaler.style.transform = `scale(${root.clientWidth / WIDTH})`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    fit();

    // reduced-motion : état final figé, pas de boucle
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0.8);
      return () => ro.disconnect();
    }

    // 3) boucle avec pause hors-écran
    const visual = root.closest<HTMLElement>(".nc-proc-visual");
    let raf = 0;
    let elapsed = 0;
    let last = performance.now();
    let prev = "paused";
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const state = visual
        ? getComputedStyle(visual).getPropertyValue("--nc-anim-state").trim()
        : "running";
      // La carte (re)devient active → l'animation repart de 0.
      if (state === "running" && prev !== "running") elapsed = 0;
      prev = state;
      if (state !== "paused") elapsed += dt;
      draw((elapsed % LOOP) / LOOP);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="nc-v-notion" aria-hidden>
      <div className="nc-v-scaler">
        <div className="nc-v-notion-win" />
      </div>
    </div>
  );
}
