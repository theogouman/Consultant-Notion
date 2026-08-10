"use client";

import { useEffect, useRef } from "react";

/**
 * Visuel carte 2 — « Audit de votre organisation ».
 * Réseau de nœuds : chaos → propagation du signal d'audit → réalignement en
 * roue lisible. Boucle rAF, en pause quand la carte n'est pas active
 * (--nc-anim-state), état final figé en prefers-reduced-motion.
 * Aucun texte : uniquement le mouvement de la forme.
 */
export default function AuditNetwork() {
  const rootRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const marksRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const gLinks = linksRef.current;
    const gNodes = nodesRef.current;
    const gMarks = marksRef.current;
    const root = rootRef.current;
    if (!gLinks || !gNodes || !gMarks || !root) return;

    // repartir propre (React strict mode peut ré-exécuter l'effet)
    gLinks.replaceChildren();
    gNodes.replaceChildren();
    gMarks.replaceChildren();

    const SVG = "http://www.w3.org/2000/svg";
    const LOOP = 8200;
    const cx = 200, cy = 150, R = 92;
    const ring = (deg: number): [number, number] => [
      cx + R * Math.cos((deg * Math.PI) / 180),
      cy + R * Math.sin((deg * Math.PI) / 180),
    ];

    type Node = { id: string; r: number; chaos: [number, number]; order: [number, number] };
    const nodes: Node[] = [
      { id: "H", r: 15, chaos: [150, 92], order: [cx, cy] },
      { id: "A", r: 11, chaos: [300, 66], order: ring(-90) },
      { id: "B", r: 11, chaos: [344, 150], order: ring(-30) },
      { id: "C", r: 11, chaos: [272, 214], order: ring(30) },
      { id: "D", r: 11, chaos: [104, 222], order: ring(90) },
      { id: "E", r: 11, chaos: [58, 128], order: ring(150) },
      { id: "F", r: 11, chaos: [182, 182], order: ring(210) },
    ];
    const N: Record<string, Node> = Object.fromEntries(nodes.map((n) => [n.id, n]));

    type Link = { a: string; b: string; type?: "ghost" };
    const chaosLinks: Link[] = [
      { a: "H", b: "A" }, { a: "H", b: "B" }, { a: "H", b: "D" }, { a: "H", b: "E" }, { a: "H", b: "F" },
      { a: "A", b: "D" }, { a: "B", b: "E" }, { a: "F", b: "C" },
      { a: "E", b: "C", type: "ghost" },
    ];
    const spokeLinks: [string, string][] = [["H","A"],["H","B"],["H","C"],["H","D"],["H","E"],["H","F"]];
    const ringOrder = ["A", "B", "C", "D", "E", "F"];
    const ringLinks: [string, string][] = ringOrder.map((id, i) => [id, ringOrder[(i + 1) % ringOrder.length]]);

    const line = (parent: SVGGElement) => {
      const el = document.createElementNS(SVG, "line");
      el.setAttribute("stroke-linecap", "round");
      parent.appendChild(el);
      return el;
    };

    const chaosEls = chaosLinks.map((l) => {
      const base = line(gLinks);
      const fill = line(gLinks);
      fill.setAttribute("stroke", "var(--accent)");
      return { ...l, base, fill };
    });
    const spokeEls = spokeLinks.map(([a, b]) => {
      const el = line(gLinks);
      el.setAttribute("stroke", "var(--accent)");
      el.setAttribute("stroke-width", "1.7");
      el.setAttribute("opacity", "0");
      return { a, b, el };
    });
    const ringEls = ringLinks.map(([a, b]) => {
      const el = line(gLinks);
      el.setAttribute("stroke", "var(--accent)");
      el.setAttribute("stroke-width", "1.5");
      el.setAttribute("opacity", "0");
      return { a, b, el };
    });

    const ORIGIN: [number, number] = [186, 146];
    const MAXR = 205;

    const jam = document.createElementNS(SVG, "circle");
    jam.setAttribute("fill", "none");
    jam.setAttribute("stroke", "var(--accent-strong)");
    jam.setAttribute("stroke-width", "1.4");
    jam.setAttribute("opacity", "0");
    gMarks.appendChild(jam);

    const nodeEls = nodes.map((n) => {
      const g = document.createElementNS(SVG, "g");
      const body = document.createElementNS(SVG, "circle");
      body.setAttribute("fill", "#ffffff");
      body.setAttribute("stroke", "#cfd4da");
      body.setAttribute("stroke-width", "1.6");
      const core = document.createElementNS(SVG, "circle");
      core.setAttribute("fill", "#c0c6ce");
      g.appendChild(body);
      g.appendChild(core);
      gNodes.appendChild(g);
      return { n, body, core };
    });

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const pos = (n: Node, u: number): [number, number] => [
      lerp(n.chaos[0], n.order[0], u), lerp(n.chaos[1], n.order[1], u),
    ];
    const hex = (h: string): [number, number, number] => {
      h = h.replace("#", "");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const C = {
      dimS: hex("#cfd4da"), dimC: hex("#c0c6ce"), acc: hex("#e0625a"),
      accS: hex("#d1504a"), white: [255, 255, 255] as [number, number, number],
    };
    const mix = (a: number[], b: number[], t: number): [number, number, number] => {
      t = clamp(t);
      return [
        Math.round(lerp(a[0], b[0], t)),
        Math.round(lerp(a[1], b[1], t)),
        Math.round(lerp(a[2], b[2], t)),
      ];
    };
    const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

    const CHAOS_IN = 0.05, HOLD = 0.10, AUDIT = 0.34, RESOLVE = 0.52, CALM = 0.90;

    const draw = (p: number, now: number) => {
      let u = 0;
      if (p >= HOLD && p < RESOLVE) u = easeIO(clamp((p - AUDIT) / (RESOLVE - AUDIT)));
      else if (p >= RESOLVE) u = 1;
      if (p < AUDIT) u = 0;

      const auditL = clamp((p - HOLD) / (AUDIT - HOLD));
      const inAudit = p >= HOLD && p < AUDIT;
      const inCalm = p >= RESOLVE && p < CALM;
      const outA = p >= CALM ? easeOut((p - CALM) / (1 - CALM)) : 0;

      const cur: Record<string, [number, number]> = {};
      const act: Record<string, number> = {};
      nodeEls.forEach(({ n }) => {
        const [x, y] = pos(n, u);
        cur[n.id] = [x, y];
        const d = Math.hypot(n.chaos[0] - ORIGIN[0], n.chaos[1] - ORIGIN[1]);
        let a = p < HOLD ? 0 : smooth((auditL - d / MAXR) / 0.34);
        if (p >= AUDIT) a = 1;
        act[n.id] = a;
      });

      nodeEls.forEach(({ n, body, core }) => {
        const [x, y] = cur[n.id];
        const a = act[n.id];
        body.setAttribute("r", String(n.r));
        core.setAttribute("r", String(Math.max(2, n.r * 0.34)));

        let strokeCol = mix(C.dimS, C.acc, a);
        let coreCol = mix(C.dimC, C.accS, a);
        let fill = mix(C.white, hex("#fdeeeb"), a * 0.5);
        let sw = lerp(1.6, 1.9, a);
        if (n.id === "H") {
          fill = mix(hex("#fdeeeb"), C.acc, u);
          coreCol = mix(coreCol, C.white, u);
          strokeCol = mix(strokeCol, C.acc, u);
          sw = lerp(sw, 2, u);
        } else {
          strokeCol = mix(strokeCol, C.acc, u);
        }

        let op = 1;
        if (p < CHAOS_IN) op = easeOut(p / CHAOS_IN);
        op *= 1 - outA;

        body.setAttribute("cx", String(x));
        body.setAttribute("cy", String(y));
        core.setAttribute("cx", String(x));
        core.setAttribute("cy", String(y));
        body.setAttribute("stroke", rgb(strokeCol));
        body.setAttribute("stroke-width", String(sw));
        body.setAttribute("fill", rgb(fill));
        core.setAttribute("fill", rgb(coreCol));
        body.setAttribute("opacity", op.toFixed(2));
        core.setAttribute("opacity", op.toFixed(2));
      });

      chaosEls.forEach(({ a, b, type, base, fill }) => {
        const [x1, y1] = cur[a], [x2, y2] = cur[b];
        [base, fill].forEach((el) => {
          el.setAttribute("x1", String(x1)); el.setAttribute("y1", String(y1));
          el.setAttribute("x2", String(x2)); el.setAttribute("y2", String(y2));
        });
        const len = Math.hypot(x2 - x1, y2 - y1);
        const dm = Math.hypot(
          (N[a].chaos[0] + N[b].chaos[0]) / 2 - ORIGIN[0],
          (N[a].chaos[1] + N[b].chaos[1]) / 2 - ORIGIN[1],
        );
        const charge = p < HOLD ? 0 : p >= AUDIT ? 1 : smooth((auditL - dm / MAXR) / 0.30);
        const baseOp = (p < CHAOS_IN ? easeOut(p / CHAOS_IN) : 1) * (1 - clamp(u / 0.45)) * (1 - outA);

        if (type === "ghost") {
          base.setAttribute("stroke", "#c2c8d0");
          base.setAttribute("stroke-width", "1.1");
          base.setAttribute("stroke-dasharray", "4 4");
          base.setAttribute("opacity", (baseOp * (0.55 + 0.2 * (1 - charge))).toFixed(2));
        } else {
          base.setAttribute("stroke", "#d3d7dd");
          base.setAttribute("stroke-width", "1.2");
          base.removeAttribute("stroke-dasharray");
          base.setAttribute("opacity", baseOp.toFixed(2));
        }
        fill.setAttribute("stroke-width", "1.7");
        fill.setAttribute("stroke-dasharray", len.toFixed(1));
        fill.setAttribute("stroke-dashoffset", (len * (1 - charge)).toFixed(1));
        fill.setAttribute("opacity", (charge > 0 ? baseOp : 0).toFixed(2));
      });

      spokeEls.forEach(({ a, b, el }) => {
        const [x1, y1] = cur[a], [x2, y2] = cur[b];
        const g = easeOut(clamp((u - 0.05) / 0.7));
        el.setAttribute("x1", String(x1)); el.setAttribute("y1", String(y1));
        el.setAttribute("x2", String(lerp(x1, x2, g))); el.setAttribute("y2", String(lerp(y1, y2, g)));
        let op = g * 0.6;
        if (inCalm) op = 0.55 + 0.1 * Math.sin(now / 520);
        op *= 1 - outA;
        el.setAttribute("opacity", op.toFixed(2));
      });

      ringEls.forEach(({ a, b, el }) => {
        const [x1, y1] = cur[a], [x2, y2] = cur[b];
        const g = easeOut(clamp((u - 0.45) / 0.55));
        el.setAttribute("x1", String(x1)); el.setAttribute("y1", String(y1));
        el.setAttribute("x2", String(lerp(x1, x2, g))); el.setAttribute("y2", String(lerp(y1, y2, g)));
        let op = g * 0.5;
        if (inCalm) op = 0.42 + 0.08 * Math.sin(now / 520 + 1);
        op *= 1 - outA;
        el.setAttribute("opacity", op.toFixed(2));
      });

      const [hx, hy] = cur["H"];
      jam.setAttribute("cx", String(hx));
      jam.setAttribute("cy", String(hy));
      const s = inAudit ? smooth((auditL - 0.58) / 0.16) * (1 - smooth((auditL - 0.9) / 0.1)) : 0;
      jam.setAttribute("r", (N.H.r + 7 + 2.2 * Math.sin(now / 220)).toFixed(1));
      jam.setAttribute("opacity", (s * 0.55).toFixed(2));
    };

    // reduced-motion : état final figé, pas de boucle
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0.72, 0);
      return;
    }

    // boucle avec pause hors-écran (temps accumulé seulement si actif)
    const visual = root.closest<HTMLElement>(".nc-proc-visual");
    let raf = 0;
    let elapsed = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const state = visual
        ? getComputedStyle(visual).getPropertyValue("--nc-anim-state").trim()
        : "running";
      if (state !== "paused") elapsed += dt;
      draw((elapsed % LOOP) / LOOP, now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={rootRef} className="nc-v-net" aria-hidden>
      <svg viewBox="0 0 400 300" className="nc-v-net-svg">
        <g ref={linksRef} />
        <g ref={nodesRef} />
        <g ref={marksRef} />
      </svg>
    </div>
  );
}
