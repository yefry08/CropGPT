// «Nexus: información no es verdad»: scenes (inserted into the paper-collage engine by build.py)
// Every interpretive claim is attributed to Harari on screen. No people are drawn in the historical scenes.
const DEF = [];

function oldBook(g, cx, cy, s = 1, o = {}) {
  const b = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g), cover = o.cover || "#7A3B22", dark = o.dark || "#4A2112";
  E("path", { d: "M-230 150 L230 150 L250 196 L-250 196 Z", fill: "#8E5826" }, b);
  E("path", { d: "M-212 -150 L0 -116 L212 -150 L212 150 L0 182 L-212 150 Z", fill: cover, stroke: dark, "stroke-width": 6, "stroke-linejoin": "round" }, b);
  for (const sx of [-1, 1]) {
    E("path", { d: `M0 -116 L${sx * 196} -142 L${sx * 196} 142 L0 166 Z`, fill: "#FFFDF0", stroke: "#CFC6AE", "stroke-width": 4 }, b);
    for (let k = 1; k < 4; k++) E("path", { d: `M${sx * 8} ${-110 + k * 6} L${sx * 190} ${-136 + k * 6}`, ...stroke("#DED6C0", 3) }, b);
    for (let i = 0; i < 7; i++) E("line", { x1: sx * 36, y1: -74 + i * 34, x2: sx * 170, y2: -86 + i * 34 + sx * 6, stroke: "#B9B0A0", "stroke-width": 5 }, b);
  }
  E("path", { d: "M0 -116 L0 166", ...stroke(dark, 6) }, b);
  for (const sy of [-1, 1]) E("rect", { x: 182, y: sy > 0 ? 70 : -110, width: 42, height: 40, rx: 6, fill: "url(#gMetal)", stroke: "#6a6a6a", "stroke-width": 3 }, b);
  E("path", { d: "M-150 -120 L-150 120", ...stroke("#fff", 10), opacity: .25 }, b);
  return b;
}
function candle(g, x, y, s = 1, lit = true) {
  const c = E("g", { transform: `translate(${x} ${y}) scale(${s})` }, g);
  E("ellipse", { cx: 0, cy: 72, rx: 34, ry: 9, fill: "rgba(0,0,0,.25)" }, c);
  E("rect", { x: -18, y: -30, width: 36, height: 100, rx: 8, fill: "#FFFDF0", stroke: "#D8D0BC", "stroke-width": 3 }, c);
  E("rect", { x: -12, y: -22, width: 10, height: 80, rx: 5, fill: "#fff", opacity: .7 }, c);
  E("line", { x1: 0, y1: -30, x2: 0, y2: -44, ...stroke("#4a4a4a", 4) }, c);
  const fl = E("g", {}, c);
  if (lit) { E("ellipse", { cx: 0, cy: -62, rx: 26, ry: 40, fill: "url(#gGlow)" }, fl);
    E("path", { d: "M0 -96 q18 24 0 40 q-18 -16 0 -40 Z", fill: "#FFC21A" }, fl);
    E("path", { d: "M0 -84 q9 14 0 24 q-9 -10 0 -24 Z", fill: "#FFF3B0" }, fl); }
  return { c, fl };
}
function scales(g, cx, cy, s = 1) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-70 150 L70 150 L52 112 L-52 112 Z", fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 4 }, k);
  E("rect", { x: -10, y: -120, width: 20, height: 236, fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, k);
  const beam = E("g", {}, k);
  E("rect", { x: -170, y: -130, width: 340, height: 18, rx: 9, fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, beam);
  const pans = [-1, 1].map(sd => { const p = E("g", {}, k);
    for (const dx of [-52, 0, 52]) E("line", { x1: 0, y1: 0, x2: dx, y2: 92, stroke: "#9a6a10", "stroke-width": 3 }, p);
    E("path", { d: "M-66 90 Q0 130 66 90 Z", fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, p); return { p, sd }; });
  return { k, beam, pans };
}

// 1 — la tesis
DEF.push({ bg: "#2443D6", tr: "left",
  strip: { color: "#FFD23F", word: "Nexus", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -170, from: -1 },
  sub: { x: 110, y: 790, w: 880, h: 620 },
  label: { text: "HARARI, 2024", x: 96, y: 1392, r: -4 },
  cap: ["Harari sostiene en Nexus que la información no sirve, sobre todo,", "para decir la verdad: sirve para conectar."],
  build(S) {
    const g = S.sub;
    oldBook(g, 540, 1130, .92, { cover: "#1E3F8F", dark: "#102455" });
    // a network rising out of the book: nodes joined by drawn links
    const net = E("g", {}, g), P = [[300, 880], [430, 800], [620, 790], [760, 870], [850, 980], [250, 980], [540, 930]];
    const links = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 1], [6, 2], [6, 3], [4, 6]].map(([a, b]) =>
      drawable(E("path", { d: `M${P[a][0]} ${P[a][1]} L${P[b][0]} ${P[b][1]}`, ...stroke("#FFFDF5", 4) }, net)));
    const nodes = P.map(([x, y], i) => { const ng = E("g", {}, net);
      E("circle", { cx: x, cy: y, r: 26, fill: i === 6 ? "#FFD23F" : "#FFFDF5", stroke: INK, "stroke-width": 4 }, ng);
      E("circle", { cx: x - 8, cy: y - 9, r: 7, fill: "#fff", opacity: .9 }, ng);
      E("circle", { cx: x, cy: y - 4, r: 7, fill: INK }, ng);
      E("path", { d: `M${x - 13} ${y + 14} q13 -14 26 0`, ...stroke(INK, 4) }, ng); return { ng, x, y }; });
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 801 });
    T(cl, "información", 540, 272, { f: SERIF, s: 62, i: 1, a: "middle" });
    T(cl, "≠ verdad", 540, 356, { f: SERIF, s: 72, i: 1, a: "middle", c: RED });
    const ul = drawable(E("path", { d: "M330 380 Q540 400 760 374", ...stroke(RED, 8) }, cl));
    pix(cl, "LA TESIS DEL LIBRO", 540, 410, 4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      nodes.forEach((o, i) => { const p = eb(seg(t, 2.0 + i * .16, 2.35 + i * .16));
        o.ng.setAttribute("transform", `translate(0 ${((1 - p) * 120).toFixed(1)})`);
        sxf(o.ng, o.x, o.y, p); o.ng.style.opacity = p > 0 ? 1 : 0; });
      links.forEach((l, i) => l.set(eo(seg(t, 2.6 + i * .12, 2.95 + i * .12))));
      ul.set(eo(seg(t, 3.4, 4.1)));
    };
  } });

// 2 — el manual
DEF.push({ bg: "#F6B400", tr: "up",
  strip: { color: "#FFFDF5", word: "1486", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -180, from: 1 },
  sub: { x: 150, y: 800, w: 780, h: 600 },
  label: { text: "EL MANUAL", x: 96, y: 1392, r: -4 },
  cap: ["Su ejemplo: en 1486 un clérigo, Heinrich Kramer, publicó un manual para cazar brujas", "que fue un éxito de ventas durante dos siglos."],
  build(S) {
    const g = S.sub;
    E("path", { d: "M300 1340 L780 1340 L820 1400 L260 1400 Z", fill: "#8E5826" }, g);
    const bk = oldBook(g, 540, 1080, .86);
    const press = [];
    for (let i = 0; i < 10; i++) press.push(oldBook(g, 540, 1080, .86 * (1 - i * .03), { cover: "#6E3520", dark: "#3E1A0E" }));
    const tl = S.layer("front", 90, 150, 900, 330);
    paper(tl, 110, 172, 860, 280, { seed: 811 });
    T(tl, "«Malleus", 540, 280, { f: SERIF, s: 68, i: 1, a: "middle" });
    T(tl, "Maleficarum»", 540, 356, { f: SERIF, s: 68, i: 1, a: "middle" });
    pix(tl, "HEINRICH KRAMER · IMPRESO EN 1487", 540, 408, 3.4, "#666", "middle");
    S.piece(tl, { at: 1.0, from: "top", r: -2 });
    const bl = S.layer("front", 620, 1180, 420, 260);
    paper(bl, 640, 1200, 380, 220, { seed: 821 });
    const bars = [40, 86, 150, 120, 70].map((h, k) => E("rect", { x: 666 + k * 70, y: 1382, width: 48, height: 0, fill: k === 2 ? RED : "#C9A44A" }, bl));
    pix(bl, "DOS SIGLOS VENDIENDOSE", 830, 1232, 3.2, "#666", "middle");
    S.piece(bl, { at: 3.6, from: "right", r: 4 });
    const hs = [40, 86, 150, 120, 70];
    return (t) => {
      press.forEach((p, i) => { const at = 2.2 + i * .22, q = eb(seg(t, at, at + .3));
        p.setAttribute("transform", `translate(${(540 - 26 - i * 22).toFixed(1)} ${(1080 - 16 - i * 26 + Math.sin(t * 1.4 + i) * 3).toFixed(1)}) scale(${(.86 * (1 - i * .03) * q).toFixed(3)}) rotate(${(-4 + i * 1.2).toFixed(1)})`);
        p.style.opacity = q > 0 ? 1 : 0; });
      bk.setAttribute("transform", `translate(540 ${(1080 + Math.sin(t * 1.2) * 5).toFixed(1)}) scale(.86)`);
      bars.forEach((b, k) => { const h = hs[k] * eo(seg(t, 4.0 + k * .14, 4.5 + k * .14));
        b.setAttribute("y", (1382 - h).toFixed(1)); b.setAttribute("height", h.toFixed(1)); });
    };
  } });

// 3 — la red funcionó (tribunal vacío + pira apagada, sin figuras)
DEF.push({ bg: "#E8402A", tr: "right",
  strip: { color: "#141414", word: "Falso", wordColor: "#FFFDF5", cx: 540, cy: 580, size: 300, wx: -170, from: -1 },
  sub: { x: 70, y: 760, w: 940, h: 660 },
  label: { text: "~45.000", x: 96, y: 1392, r: -4 },
  cap: ["Las brujas del manual no existían, pero la red funcionó:", "unos 100.000 juicios y en torno a 45.000 ejecuciones."],
  build(S) {
    const g = S.sub;
    // empty tribunal: bench, gavel, ledger, scales — no figures
    const court = E("g", {}, g);
    E("path", { d: "M180 1180 L700 1180 L740 1250 L140 1250 Z", fill: "#7A4A26", stroke: "#4A2A12", "stroke-width": 5 }, court);
    E("rect", { x: 140, y: 1250, width: 600, height: 150, fill: "#8E5826", stroke: "#4A2A12", "stroke-width": 5 }, court);
    for (let k = 0; k < 4; k++) E("rect", { x: 170 + k * 148, y: 1278, width: 118, height: 94, rx: 6, fill: "#7A4A26", stroke: "#4A2A12", "stroke-width": 3 }, court);
    E("path", { d: "M180 1180 L700 1180", ...stroke("#fff", 6), opacity: .25 }, court);
    // ledger with ticks that fill in
    const led = E("g", {}, court);
    paper(led, 210, 1086, 300, 96, { seed: 831 });
    const ticks = [];
    for (let i = 0; i < 18; i++) ticks.push(E("line", { x1: 232 + (i % 9) * 30, y1: 1106 + Math.floor(i / 9) * 44, x2: 232 + (i % 9) * 30, y2: 1140 + Math.floor(i / 9) * 44, ...stroke(INK, 5), opacity: 0 }, led));
    // gavel
    const gav = E("g", {}, court);
    E("rect", { x: 540, y: 1120, width: 150, height: 22, rx: 11, fill: "url(#gHandle)" }, gav);
    E("rect", { x: 630, y: 1086, width: 86, height: 90, rx: 12, fill: "#7A4A26", stroke: "#4A2A12", "stroke-width": 4 }, gav);
    E("rect", { x: 646, y: 1098, width: 20, height: 24, rx: 6, fill: "#fff", opacity: .4 }, gav);
    E("rect", { x: 600, y: 1182, width: 150, height: 22, rx: 8, fill: "#5E3417" }, court);
    const sc = scales(g, 860, 1060, .66);
    // unlit pyre: stake and firewood, cold ashes — no fire, no figures
    const pyre = E("g", {}, g);
    E("ellipse", { cx: 430, cy: 1392, rx: 190, ry: 34, fill: "rgba(0,0,0,.22)" }, pyre);
    E("rect", { x: 414, y: 1180, width: 32, height: 200, rx: 6, fill: "#6E4523", stroke: "#3E2510", "stroke-width": 4 }, pyre);
    const logs = [];
    for (let i = 0; i < 9; i++) { const a = -40 + i * 10, x = 430 + Math.sin(a * Math.PI / 180) * 10;
      logs.push(E("rect", { x: 300 + i * 30, y: 1352, width: 26, height: 42, rx: 8, fill: ["#6E4523", "#8A5A2E", "#5A3718"][i % 3], stroke: "#3E2510", "stroke-width": 3, transform: `rotate(${a} ${312 + i * 30} 1372)` }, pyre)); }
    const ash = [];
    for (let i = 0; i < 14; i++) ash.push(E("circle", { cx: 320 + i * 17, cy: 1392 + (i % 3) * 5, r: 6 + (i % 4), fill: "#9C958A", opacity: 0 }, pyre));
    // flames over the firewood (no figures of any kind)
    const fire = E("g", { opacity: 0 }, pyre);
    E("ellipse", { cx: 430, cy: 1300, rx: 150, ry: 120, fill: "url(#gGlowO)", opacity: .8 }, fire);
    const flames = [[430, 1, "#FF6A00"], [370, .72, "#FF9A1F"], [492, .68, "#FF8A00"], [400, .5, "#FFD23F"], [462, .46, "#FFE98A"]].map(([x, k, col]) => {
      const f = E("path", { d: `M${x} 1370 q${-46 * k} ${-60 * k} ${-10 * k} ${-110 * k} q${12 * k} ${34 * k} ${30 * k} ${16 * k} q${-14 * k} ${-52 * k} ${18 * k} ${-96 * k} q${4 * k} ${54 * k} ${34 * k} ${70 * k} q${18 * k} ${44 * k} ${-72 * k} ${120 * k} Z`, fill: col }, fire);
      return { f, x, k };
    });
    const embers = [];
    for (let i = 0; i < 10; i++) embers.push(E("circle", { r: 3 + (i % 3), fill: "#FFC21A", opacity: 0 }, fire));
    // candles in memory (lit, calm)
    const cands = [[640, 1392, .5], [700, 1398, .44], [760, 1392, .48]].map(([x, y, s]) => candle(pyre, x, y, s));
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 841 });
    const n1 = T(cl, "0", 320, 310, { s: 96, w: 900, a: "middle", ls: -3 });
    T(cl, "juicios", 320, 376, { f: SERIF, s: 42, i: 1, a: "middle" });
    const n2 = T(cl, "0", 760, 310, { s: 96, w: 900, c: RED, a: "middle", ls: -3 });
    T(cl, "ejecuciones", 760, 376, { f: SERIF, s: 42, i: 1, a: "middle", c: RED });
    E("line", { x1: 540, y1: 236, x2: 540, y2: 400, stroke: "#C9C1AE", "stroke-width": 4 }, cl);
    pix(cl, "EUROPA, 1400-1750 · ESTIMACION HISTORICA", 540, 424, 3.2, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      n1.textContent = fmt(100000 * eo(seg(t, 1.4, 3.4)));
      n2.textContent = t < 2.2 ? "0" : fmt(45000 * eo(seg(t, 2.2, 4.2)));
      ticks.forEach((k, i) => k.setAttribute("opacity", seg(t, 1.6 + i * .12, 1.8 + i * .12)));
      const hit = Math.max(0, Math.sin(Math.max(0, t - 2.0) * 3.4));
      gav.setAttribute("transform", `rotate(${(-14 * hit).toFixed(1)} 690 1130)`);
      logs.forEach((l, i) => { const p = eb(seg(t, 3.2 + i * .1, 3.5 + i * .1));
        l.setAttribute("opacity", p); });
      ash.forEach((a, i) => a.setAttribute("opacity", (seg(t, 5.4 + i * .05, 5.7 + i * .05) * .9).toFixed(2)));
      const burn = seg(t, 3.9, 4.6), die = 1 - seg(t, 5.2, 6.0);
      fire.setAttribute("opacity", (burn * die).toFixed(2));
      flames.forEach((o, i) => { const w = .82 + .18 * Math.sin(t * 7 + i * 1.7), h = (.7 + .3 * Math.sin(t * 9 + i)) * burn * die;
        o.f.setAttribute("transform", `translate(${o.x} 1370) scale(${w.toFixed(3)} ${Math.max(.05, h).toFixed(3)}) translate(${-o.x} -1370)`); });
      embers.forEach((e, i) => { const f = ((t * .7 + i * .13) % 1);
        e.setAttribute("cx", (370 + i * 14 + Math.sin(t * 2 + i) * 16).toFixed(1));
        e.setAttribute("cy", (1350 - f * 180).toFixed(1));
        e.setAttribute("opacity", burn > .2 ? ((1 - f) * .9 * die).toFixed(2) : 0); });
      cands.forEach((c, i) => { const p = eb(seg(t, 5.0 + i * .2, 5.3 + i * .2));
        c.c.setAttribute("transform", `translate(${640 + i * 60} ${1392 + (i === 1 ? 6 : 0)}) scale(${(.5 - i * .02) * p})`);
        c.fl.setAttribute("transform", `translate(${(Math.sin(t * 3 + i) * 2).toFixed(1)} 0) scale(1 ${(.92 + .08 * Math.sin(t * 7 + i)).toFixed(2)})`); });
      sc.beam.setAttribute("transform", `rotate(${(Math.sin(t * 1.3) * 3).toFixed(2)} 0 -130)`);
    };
  } });

// 4 — conectar, no verificar
DEF.push({ bg: "#10A36A", tr: "up",
  strip: { color: "#FFFDF5", word: "Conectar", wordColor: INK, cx: 540, cy: 580, size: 270, maxW: 840, wx: -150, from: 1 },
  sub: { x: 90, y: 790, w: 900, h: 620 },
  label: { text: "NO VERIFICAR", x: 70, y: 1392, r: -4 },
  cap: ["La lección de Harari:", "una red puede difundir algo falso con enorme eficacia si eso coordina a la gente."],
  build(S) {
    const g = S.sub;
    const gear = (cx, cy, R, teeth, col, lab) => {
      const gg = E("g", {}, g), inner = E("g", {}, gg), pts = [];
      for (let i = 0; i < teeth * 2; i++) { const a = i * Math.PI / teeth, r = i % 2 ? R : R * 1.22;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      E("path", { d: pts2d(pts), fill: col, stroke: INK, "stroke-width": 5, "stroke-linejoin": "round" }, inner);
      E("circle", { cx, cy, r: R * .42, fill: "#FFFDF5", stroke: INK, "stroke-width": 5 }, inner);
      E("path", { d: `M${cx - R * .7} ${cy - R * .4} a${R} ${R} 0 0 1 ${R * .8} ${-R * .4}`, ...stroke("#fff", 10), opacity: .5 }, inner);
      T(gg, lab, cx, cy + R + 56, { f: SERIF, s: 42, i: 1, a: "middle" });
      return { gg, inner, cx, cy };
    };
    const slow = gear(330, 1020, 128, 10, "#C9C1AE", "verdad");
    const fast = gear(720, 1070, 168, 12, "#FFD23F", "orden");
    const spark = [];
    for (let i = 0; i < 8; i++) spark.push(E("circle", { r: 7, fill: "#fff", opacity: 0 }, g));
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 851 });
    T(cl, "lo que une", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "gana a lo que es cierto", 540, 356, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    pix(cl, "SEGUN HARARI", 540, 410, 4, "#666", "middle");
    S.piece(cl, { at: 1.2, from: "top", r: -2 });
    return (t) => {
      const w = Math.max(0, t - .8);
      slow.inner.setAttribute("transform", `rotate(${(w * 18).toFixed(1)} ${slow.cx} ${slow.cy})`);
      fast.inner.setAttribute("transform", `rotate(${(-w * 86).toFixed(1)} ${fast.cx} ${fast.cy})`);
      spark.forEach((s, i) => { const f = ((t * 1.4 + i * .18) % 1);
        s.setAttribute("cx", 520 + Math.cos(i) * 24); s.setAttribute("cy", 1046 + Math.sin(i * 2) * 20 - f * 40);
        s.setAttribute("opacity", t > 1.6 ? ((1 - f) * .8).toFixed(2) : 0); });
    };
  } });

// 5 — agente, no canal
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "Agente", wordColor: INK, cx: 540, cy: 580, size: 290, wx: -160, from: -1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "NO ES UN CANAL", x: 70, y: 1392, r: -4 },
  cap: ["Lo nuevo, dice, es que la IA ya no es el canal por donde pasa el mensaje:", "decide qué mensaje mandar."],
  build(S) {
    const g = S.sub;
    // top: a pipe the message passes through (old model)
    const pipe = E("g", {}, g);
    E("rect", { x: 170, y: 880, width: 740, height: 96, rx: 48, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 5 }, pipe);
    E("rect", { x: 200, y: 898, width: 300, height: 16, rx: 8, fill: "#fff", opacity: .6 }, pipe);
    const msg = E("g", {}, pipe);
    E("rect", { x: -40, y: -26, width: 80, height: 52, rx: 8, fill: "#FFFDF5", stroke: INK, "stroke-width": 4 }, msg);
    E("path", { d: "M-40 -26 L0 6 L40 -26", ...stroke(INK, 4) }, msg);
    const xo = drawable(E("path", { d: "M160 860 L930 1000 M930 860 L160 1000", ...stroke(RED, 12) }, g));
    pix(g, "ANTES: SOLO PASABA", 540, 1014, 4, "#E7DCFF", "middle");
    // bottom: an agent that writes the message itself
    const ag = E("g", {}, g);
    E("rect", { x: 390, y: 1130, width: 300, height: 206, rx: 26, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 5 }, ag);
    E("rect", { x: 424, y: 1164, width: 232, height: 112, rx: 12, fill: "#13202E" }, ag);
    const eyes = E("g", {}, ag);
    for (const x of [490, 590]) E("circle", { cx: x, cy: 1212, r: 16, fill: "#CFF75A" }, eyes);
    E("path", { d: "M498 1246 q42 20 84 0", ...stroke("#CFF75A", 6) }, ag);
    E("rect", { x: 424, y: 1292, width: 232, height: 18, rx: 9, fill: "#6B747F", opacity: .5 }, ag);
    E("rect", { x: 414, y: 1150, width: 62, height: 12, rx: 6, fill: "#fff", opacity: .55 }, ag);
    E("line", { x1: 540, y1: 1130, x2: 540, y2: 1096, ...stroke("#6B747F", 6) }, ag);
    E("circle", { cx: 540, cy: 1086, r: 14, fill: RED }, ag);
    const outs = [[250, 1200], [250, 1300], [830, 1200], [830, 1300]].map(([x, y]) => {
      const o = E("g", {}, g);
      E("rect", { x: x - 54, y: y - 36, width: 108, height: 72, rx: 8, fill: "#FFFDF5", stroke: INK, "stroke-width": 4 }, o);
      for (let i = 0; i < 3; i++) E("rect", { x: x - 36, y: y - 18 + i * 16, width: 72 - i * 14, height: 7, rx: 3, fill: "#C9C1AE" }, o);
      return { o, x, y };
    });
    const arrows = outs.map((o, i) => harrow(g, 540, 1232, o.x + (o.x < 540 ? 70 : -70), o.y, { bend: i % 2 ? .2 : -.2, c: "#fff", w: 6, hl: 22 }));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 861 });
    T(cl, "elige qué", 540, 278, { f: SERIF, s: 60, i: 1, a: "middle" });
    T(cl, "mensaje mandar", 540, 352, { f: SERIF, s: 60, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 3.4, from: "top", r: -2 });
    return (t) => {
      const f = ((t * .5) % 1);
      msg.setAttribute("transform", `translate(${(200 + f * 680).toFixed(1)} 928)`);
      msg.style.opacity = t < 2.6 ? 1 : 0;
      xo.set(eo(seg(t, 2.6, 3.3)));
      const ap = eb(seg(t, 3.4, 3.9));
      sxf(ag, 540, 1230, ap); ag.style.opacity = ap > 0 ? 1 : 0;
      eyes.setAttribute("opacity", (t % 3.2) > 3.02 ? .15 : 1);
      outs.forEach((o, i) => { const p = eb(seg(t, 4.6 + i * .22, 4.95 + i * .22));
        sxf(o.o, o.x, o.y, p); o.o.style.opacity = p > 0 ? 1 : 0; });
      arrows.forEach((a, i) => a.set(eo(seg(t, 4.4 + i * .22, 4.9 + i * .22))));
    };
  } });

// 6 — alineación
DEF.push({ bg: "#FF7A1A", tr: "right",
  strip: { color: "#141414", word: "Alineación", wordColor: "#FFFDF5", cx: 540, cy: 580, size: 260, maxW: 860, wx: -120, from: 1 },
  sub: { x: 150, y: 790, w: 780, h: 620 },
  label: { text: "OBJETIVOS", x: 96, y: 1392, r: -4 },
  cap: ["De ahí el problema de la alineación:", "un sistema muy eficaz cumpliendo un objetivo mal definido."],
  build(S) {
    const g = S.sub, cx = 540, cy = 1090;
    const rings = [[220, "#FFFDF5"], [168, RED], [116, "#FFFDF5"], [64, RED]];
    rings.forEach(([r, c]) => E("circle", { cx, cy, r, fill: c, stroke: INK, "stroke-width": 5 }, g));
    E("circle", { cx, cy, r: 22, fill: INK }, g);
    E("path", { d: `M${cx - 150} ${cy - 120} a200 200 0 0 1 150 -72`, ...stroke("#fff", 12), opacity: .45 }, g);
    const mkArrow = (ax, ay, rot, col) => { const a = E("g", { transform: `translate(${ax} ${ay}) rotate(${rot})` }, g);
      E("line", { x1: -170, y1: 0, x2: 0, y2: 0, ...stroke("#8E5826", 10) }, a);
      E("path", { d: "M0 0 l-34 -16 l0 32 Z", fill: col }, a);
      E("path", { d: "M-170 0 l-34 -20 M-170 0 l-34 20", ...stroke(col, 7) }, a); return a; };
    const good = mkArrow(cx, cy, 0, "#1E9E5A"), bad = mkArrow(cx + 160, cy - 170, -32, RED);
    const tags = [["lo que pedimos", cx + 230, cy - 210, "#1E9E5A"], ["lo que queríamos", cx - 100, cy + 268, RED]].map(([s, x, y, c], i) => {
      const tg = E("g", {}, g); paper(tg, x - 190, y - 40, 380, 76, { seed: 871 + i });
      T(tg, s, x, y + 14, { f: SERIF, s: 42, i: 1, a: "middle", c }); return { tg, x, y };
    });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 881 });
    T(cl, "muy eficaz,", 540, 278, { f: SERIF, s: 58, i: 1, a: "middle" });
    T(cl, "con el objetivo equivocado", 540, 350, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const p1 = eio(seg(t, 1.4, 2.2)), p2 = eio(seg(t, 3.0, 3.9));
      good.setAttribute("transform", `translate(${(cx - 420 + 420 * p1).toFixed(1)} ${cy}) rotate(0)`);
      good.style.opacity = p1 > 0 ? 1 : 0;
      bad.setAttribute("transform", `translate(${(cx + 120 + 330 * p2).toFixed(1)} ${(cy - 110 - 150 * p2).toFixed(1)}) rotate(-32)`);
      bad.style.opacity = p2 > 0 ? 1 : 0;
      tags.forEach((o, i) => { const q = eb(seg(t, i ? 4.2 : 2.4, (i ? 4.2 : 2.4) + .3));
        sxf(o.tg, o.x, o.y, q, i ? 3 : -3); o.tg.style.opacity = q > 0 ? 1 : 0; });
    };
  } });

// 7 — autocorrección
DEF.push({ bg: "#0E9AA7", tr: "up",
  strip: { color: "#FFE14D", word: "Corregir", wordColor: INK, cx: 540, cy: 580, size: 290, wx: -160, from: -1 },
  sub: { x: 150, y: 800, w: 780, h: 600 },
  label: { text: "AUTOCORRECCION", x: 70, y: 1392, r: -4 },
  cap: ["Su propuesta no es frenar la tecnología,", "sino construir mecanismos que admitan el error y lo corrijan."],
  build(S) {
    const g = S.sub;
    const sheet = paper(g, 190, 860, 700, 300, { seed: 891 });
    const wrong = T(g, "la red nunca se equivoca", 240, 980, { f: SERIF, s: 46, i: 1, c: "#444" });
    const right = T(g, "", 240, 1086, { f: SERIF, s: 46, i: 1, c: "#1E9E5A" });
    const strike = drawable(E("path", { d: "M232 968 Q540 986 866 962", ...stroke(RED, 7) }, g));
    const crumbs = [];
    for (let i = 0; i < 16; i++) crumbs.push(E("rect", { width: 9, height: 7, rx: 2, fill: "#C9C1AE", opacity: 0 }, g));
    const pen = E("g", {}, g);
    E("path", { d: "M0 0 L70 -24 L70 24 Z", fill: "#EBC28F" }, pen);
    E("path", { d: "M0 0 L22 -8 L22 8 Z", fill: "#333" }, pen);
    E("rect", { x: 70, y: -24, width: 300, height: 48, fill: "url(#gPencil)" }, pen);
    E("rect", { x: 370, y: -26, width: 50, height: 52, fill: "url(#gMetal)" }, pen);
    E("rect", { x: 418, y: -24, width: 54, height: 48, rx: 12, fill: "#F48BA6" }, pen);
    const chips = ["humildad", "control", "revisión"].map((s, i) => {
      const x = 230 + i * 240, cg = E("g", {}, g);
      paper(cg, x, 1210, 220, 120, { seed: 901 + i, fill: i === 2 ? "#FFE14D" : "url(#gPaper)" });
      T(cg, s, x + 110, 1286, { f: SERIF, s: 40, i: 1, a: "middle" });
      return { cg, x: x + 110, y: 1270 };
    });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 911 });
    T(cl, "no frenar:", 540, 278, { f: SERIF, s: 58, i: 1, a: "middle" });
    T(cl, "poder rectificar", 540, 350, { f: SERIF, s: 58, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const txt = "la red debe poder rectificar";
    return (t) => {
      strike.set(eo(seg(t, 1.4, 2.0)));
      const er = seg(t, 2.4, 3.6);
      wrong.setAttribute("opacity", (1 - er).toFixed(2));
      const px = lerp(880, 230, eio(er));
      pen.setAttribute("transform", `translate(${px.toFixed(1)} ${(1000 + Math.sin(t * 22) * 4).toFixed(1)}) rotate(152)`);
      pen.style.opacity = er > 0 && er < 1 ? 1 : (t > 3.6 && t < 5.4 ? 1 : 0);
      if (t > 3.6) { const w = seg(t, 3.8, 5.2); right.textContent = txt.slice(0, Math.floor(w * txt.length));
        pen.setAttribute("transform", `translate(${(250 + w * txt.length * 21).toFixed(1)} ${(1106 + Math.sin(t * 20) * 3).toFixed(1)}) rotate(152)`); }
      crumbs.forEach((c, i) => { const f = seg(t, 2.6 + i * .06, 3.4 + i * .06);
        c.setAttribute("x", (300 + i * 36 - f * 14).toFixed(1)); c.setAttribute("y", (992 + f * 180 + (i % 3) * 8).toFixed(1));
        c.setAttribute("opacity", f > 0 && f < 1 ? (1 - f).toFixed(2) : 0); });
      chips.forEach((o, i) => { const q = eb(seg(t, 5.4 + i * .3, 5.7 + i * .3));
        sxf(o.cg, o.x, o.y, q, (i - 1) * 2.5); o.cg.style.opacity = q > 0 ? 1 : 0; });
    };
  } });

// 8 — las críticas
DEF.push({ bg: "#123C5A", tr: "left",
  strip: { color: "#FFFDF5", word: "¿Y él?", wordColor: INK, cx: 540, cy: 580, size: 290, wx: -160, from: 1 },
  sub: { x: 90, y: 800, w: 900, h: 600 },
  label: { text: "CRITICAS", x: 96, y: 1392, r: -4 },
  cap: ["A Harari también lo critican: le reprochan generalizar y saltarse detalles incómodos.", "Conviene leerlo con esa cautela."],
  build(S) {
    const g = S.sub, sc = scales(g, 540, 1030, 1.08);
    const pans = sc.pans;
    const bookPan = E("g", {}, g), notesPan = E("g", {}, g);
    oldBook(bookPan, 0, -60, .3, { cover: "#1E3F8F", dark: "#102455" });
    for (let i = 0; i < 3; i++) { const ng = E("g", { transform: `translate(${-50 + i * 50} ${-60 - i * 26}) rotate(${-8 + i * 8})` }, notesPan);
      paper(ng, -52, -34, 104, 68, { seed: 921 + i, j: 4 });
      for (let k = 0; k < 3; k++) E("rect", { x: -34, y: -18 + k * 14, width: 68 - k * 12, height: 6, rx: 3, fill: "#C9C1AE" }, ng); }
    const tags = [["EL LIBRO", 300, 1300], ["LAS RESEÑAS", 780, 1300]].map(([s, x, y], i) => {
      const tg = E("g", {}, g), w = pixW(s, 4) + 24;
      E("rect", { x: x - w / 2, y, width: w, height: 48, fill: INK }, tg);
      pix(tg, s, x, y + 12, 4, "#fff", "middle"); return { tg, x: x, y: y + 24 };
    });
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 931 });
    T(cl, "leer con", 540, 276, { f: SERIF, s: 58, i: 1, a: "middle" });
    T(cl, "cautela", 540, 352, { f: SERIF, s: 68, i: 1, a: "middle", c: RED });
    pix(cl, "GENERALIZA, DICEN SUS CRITICOS", 540, 412, 3.4, "#666", "middle");
    S.piece(cl, { at: 2.6, from: "top", r: -2 });
    return (t) => {
      const sw = eb(seg(t, 1.6, 3.0)), th = (lerp(-10, 8, sw) + Math.sin(t * 1.9) * 1.4) * Math.PI / 180;
      sc.beam.setAttribute("transform", `rotate(${(th * 180 / Math.PI).toFixed(2)} 0 -130)`);
      const R = 170 * 1.08;
      [bookPan, notesPan].forEach((p, i) => { const sd = i ? 1 : -1;
        const x = 540 + sd * R * Math.cos(th), y = 1030 - 130 * 1.08 + sd * R * Math.sin(th) + 100;
        p.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        p.style.opacity = eb(seg(t, i ? 1.4 : .9, (i ? 1.4 : .9) + .4)); });
      pans.forEach((o, i) => { const x = 540 + o.sd * R * Math.cos(th), y = 1030 - 130 * 1.08 + o.sd * R * Math.sin(th);
        o.p.setAttribute("transform", `translate(${(x - 540).toFixed(1)} ${(y - 1030 + 130 * 1.08).toFixed(1)})`); });
      tags.forEach((o, i) => sxf(o.tg, o.x, o.y, eb(seg(t, 3.4 + i * .3, 3.7 + i * .3))));
    };
  } });

// fin — fuentes
DEF.push({ bg: "#151515", tr: "left", dur: 7.5,
  strip: { color: RED, word: "Fuentes", wordColor: "#FFFDF5", cx: 540, cy: 330, size: 250, wx: -40, h: 280, from: -1 },
  sub: { x: 50, y: 520, w: 980, h: 1110, at: .4 },
  label: { text: "VERIFICADO", x: 640, y: 150, r: 4, px: 6, at: 1.2 },
  cap: [],
  build(S) {
    const g = S.sub;
    E("path", { d: torn(70, 545, 940, 1060, 971, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["Harari, 2024", "Nexus: A Brief History of Information Networks"],
      ["Kramer, 1486", "Malleus Maleficarum (impreso en 1487, Espira)"],
      ["Levack", "The Witch-Hunt in Early Modern Europe (~45.000 ejecuciones)"],
      ["Behringer", "Más de 20.000 ejecuciones en el espacio alemán"],
      ["Reseñas de Nexus, 2024", "Críticas por generalizar y omitir detalles"],
      ["Wikipedia", "Nexus · Malleus Maleficarum · Heinrich Kramer"],
      ["Conflicto de interés", "Vídeo hecho con IA de Anthropic, empresa del sector"],
      ["Nota", "Las cifras de los juicios son estimaciones académicas"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 29, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
