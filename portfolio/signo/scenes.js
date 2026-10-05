// «El signo que lo invirtió todo»: scenes (inserted into the paper-collage engine by build.py)
const DEF = [];

function keycap(g, cx, cy, s, label, col) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -54, y: -44, width: 108, height: 96, rx: 14, fill: "#6B747F" }, k);
  E("rect", { x: -54, y: -54, width: 108, height: 96, rx: 14, fill: col || "#E9EDF2", stroke: "#8d95a0", "stroke-width": 4 }, k);
  E("rect", { x: -40, y: -44, width: 50, height: 14, rx: 7, fill: "#fff", opacity: .7 }, k);
  T(k, label, 0, 12, { s: 56, w: 900, a: "middle", c: INK });
  return k;
}
function rater(g, cx, cy, s, shirt, stars) {
  const p = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M0 10 q-58 10 -70 90 q-4 36 8 78 l124 0 q12 -42 8 -78 q-12 -80 -70 -90 Z", fill: shirt, stroke: "rgba(0,0,0,.22)", "stroke-width": 4 }, p);
  E("circle", { cx: 0, cy: -32, r: 40, fill: "#F2C9A4", stroke: "#B98A5E", "stroke-width": 4 }, p);
  E("path", { d: "M-28 -50 q28 -22 56 0 q-6 -28 -28 -28 q-22 0 -28 28 Z", fill: "#3b2b1f" }, p);
  const sg = E("g", {}, p);
  for (let i = 0; i < 5; i++) star(sg, -64 + i * 32, -96, 13, i < stars ? "#FFC21A" : "#D7D2C4");
  return { p, sg };
}
function codeCard(g, x, y, w, h, seed) {
  const c = E("g", {}, g);
  E("rect", { x, y, width: w, height: h, rx: 16, fill: "#0D1623", stroke: "#2E4458", "stroke-width": 5 }, c);
  E("rect", { x, y, width: w, height: 44, rx: 16, fill: "#1B2C3E" }, c);
  [["#FF5F57", 30], ["#FEBC2E", 56], ["#28C840", 82]].forEach(([col, dx]) => E("circle", { cx: x + dx, cy: y + 22, r: 8, fill: col }, c));
  return c;
}
function dial(g, cx, cy, r, col) {
  const d = E("g", {}, g);
  E("circle", { cx, cy, r: r + 14, fill: "url(#gMetal)", stroke: "#555", "stroke-width": 3 }, d);
  E("circle", { cx, cy, r, fill: "#FFFDF8", stroke: "#333", "stroke-width": 3 }, d);
  for (let k = 0; k <= 10; k++) { const a = (-120 + k * 24) * Math.PI / 180;
    E("line", { x1: cx + Math.sin(a) * (r - 22), y1: cy - Math.cos(a) * (r - 22), x2: cx + Math.sin(a) * (r - 6), y2: cy - Math.cos(a) * (r - 6), stroke: k > 7 ? col : INK, "stroke-width": 5, "stroke-linecap": "round" }, d); }
  const needle = E("g", {}, d);
  E("path", { d: `M${cx - 6} ${cy} L${cx} ${cy - r + 16} L${cx + 6} ${cy} Z`, fill: col }, needle);
  E("circle", { cx, cy, r: 16, fill: "url(#gMetal)", stroke: "#444", "stroke-width": 3 }, d);
  return { d, needle, cx, cy };
}

// 1 — un signo
DEF.push({ bg: "#123C5A", tr: "left",
  strip: { color: "#FFE14D", word: "Un signo", wordColor: INK, cx: 540, cy: 600, size: 270, maxW: 840, wx: -150, from: -1 },
  sub: { x: 70, y: 800, w: 940, h: 600 },
  label: { text: "AÑO 2019", x: 96, y: 1392, r: -4 },
  cap: ["En 2019, un solo signo cambiado en el código", "convirtió a GPT-2 en lo contrario de lo que querían."],
  build(S) {
    const g = S.sub;
    // keyboard with one key leaping out
    const kb = E("g", {}, g);
    E("path", { d: "M140 1180 L940 1180 L990 1330 L90 1330 Z", fill: "url(#gMetal)", stroke: "#777", "stroke-width": 4 }, kb);
    const keys = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) {
      const x = 170 + c * 68 - r * 12, y = 1196 + r * 44;
      if (r === 0 && c === 9) continue;
      keys.push(E("rect", { x, y, width: 54, height: 34, rx: 7, fill: "#3a3f46" }, kb));
    }
    E("rect", { x: 300, y: 1330, width: 480, height: 18, rx: 9, fill: "#8d9399" }, g);
    const minus = keycap(g, 782, 1210, .62, "−", "#FFE14D");
    const trail = [];
    for (let i = 0; i < 7; i++) trail.push(E("circle", { r: 6, fill: "#FFE14D", opacity: 0 }, g));
    const slot = E("rect", { x: 752, y: 1192, width: 54, height: 34, rx: 7, fill: "#13202E", stroke: "#2E4458", "stroke-width": 3, opacity: 0 }, g);
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1201 });
    T(cl, "un carácter", 540, 282, { f: SERIF, s: 60, i: 1, a: "middle" });
    T(cl, "lo cambió todo", 540, 356, { f: SERIF, s: 60, i: 1, a: "middle", c: RED });
    pix(cl, "INCIDENTE DOCUMENTADO POR OPENAI", 540, 410, 3.2, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const jump = seg(t, 1.6, 3.2), arc = Math.sin(jump * Math.PI);
      minus.setAttribute("transform", `translate(${(782 + jump * 60).toFixed(1)} ${(1210 - arc * 320).toFixed(1)}) rotate(${(jump * 220).toFixed(1)}) scale(${(.62 + arc * .5).toFixed(3)})`);
      minus.style.opacity = jump >= 1 ? 0 : 1;
      slot.setAttribute("opacity", seg(t, 1.7, 2.0));
      trail.forEach((c, i) => { const f = clamp(jump - i * .05), a2 = Math.sin(f * Math.PI);
        c.setAttribute("cx", (782 + f * 60).toFixed(1)); c.setAttribute("cy", (1210 - a2 * 320).toFixed(1));
        c.setAttribute("opacity", f > 0 && f < 1 ? (.5 * (1 - i / 7)).toFixed(2) : 0); });
    };
  } });

// 2 — cómo se alinea (RLHF)
DEF.push({ bg: "#F6B400", tr: "up",
  strip: { color: "#FFFDF5", word: "Notas", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: 1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "RLHF", x: 96, y: 1392, r: -4 },
  cap: ["Para alinearlo usaban RLHF: personas puntuaban respuestas,", "y con esas notas se entrenaba un modelo de recompensa."],
  build(S) {
    const g = S.sub;
    const raters = [[200, 1120, .62, "#7FD3FF", 4], [370, 1150, .58, "#CFF75A", 2], [540, 1120, .62, "#FF9EC4", 5]].map(([x, y, s, c, st]) => ({ ...rater(g, x, y, s, c, st), x, y, s }));
    // the reward model being trained from those scores
    const rm = E("g", {}, g);
    E("rect", { x: 700, y: 1040, width: 250, height: 200, rx: 22, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 5 }, rm);
    E("rect", { x: 728, y: 1070, width: 194, height: 110, rx: 12, fill: "#13202E" }, rm);
    const eyes = E("g", {}, rm);
    for (const x of [785, 865]) E("circle", { cx: x, cy: 1118, r: 14, fill: "#FFC21A" }, eyes);
    E("path", { d: "M792 1152 q33 18 66 0", ...stroke("#FFC21A", 6) }, rm);
    E("rect", { x: 728, y: 1196, width: 194, height: 16, rx: 8, fill: "#6B747F", opacity: .5 }, rm);
    E("rect", { x: 716, y: 1058, width: 56, height: 12, rx: 6, fill: "#fff", opacity: .55 }, rm);
    const tag = E("g", {}, g);
    paper(tag, 686, 1256, 280, 96, { seed: 1211 });
    T(tag, "modelo de", 826, 1294, { f: SERIF, s: 34, i: 1, a: "middle" });
    T(tag, "recompensa", 826, 1334, { f: SERIF, s: 34, i: 1, a: "middle", c: RED });
    const flows = [0, 1, 2].map(i => harrow(g, 200 + i * 170, 1040, 700, 1100, { bend: -.12 - i * .04, w: 6, hl: 22 }));
    const cards = [];
    for (let i = 0; i < 5; i++) cards.push(paper(g, 120 + i * 24, 880, 160, 70, { seed: 1221 + i, j: 4 }));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1231 });
    T(cl, "las personas puntúan;", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "la máquina aprende qué gusta", 540, 350, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      raters.forEach((o, i) => { const p = eb(seg(t, .9 + i * .3, 1.25 + i * .3));
        o.p.setAttribute("transform", `translate(${o.x} ${(o.y + Math.sin(t * 1.5 + i) * 5).toFixed(1)}) scale(${(o.s * p).toFixed(3)})`);
        o.p.style.opacity = p > 0 ? 1 : 0;
        o.sg.setAttribute("opacity", seg(t, 1.6 + i * .3, 1.9 + i * .3)); });
      cards.forEach((c, i) => { const q = eb(seg(t, 1.4 + i * .12, 1.7 + i * .12)); c.style.opacity = q;
        c.setAttribute("transform", `translate(0 ${((1 - q) * -40).toFixed(1)}) rotate(${(-4 + i * 2).toFixed(1)} ${200 + i * 24} 915)`); });
      flows.forEach((a, i) => a.set(eo(seg(t, 3.0 + i * .25, 3.5 + i * .25))));
      const rp = eb(seg(t, 3.8, 4.2)); sxf(rm, 825, 1140, rp); rm.style.opacity = rp > 0 ? 1 : 0;
      eyes.setAttribute("opacity", (t % 3) > 2.85 ? .15 : 1);
      tag.style.opacity = seg(t, 4.3, 4.7);
    };
  } });

// 3 — la regla
DEF.push({ bg: "#10A36A", tr: "right",
  strip: { color: "#FFFDF5", word: "Regla", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: -1 },
  sub: { x: 110, y: 790, w: 860, h: 620 },
  label: { text: "PUNTUA BAJO", x: 70, y: 1392, r: -4 },
  cap: ["Una instrucción decía:", "si el texto es sexualmente explícito, dale la peor nota posible."],
  build(S) {
    const g = S.sub;
    const sheet = paper(g, 160, 830, 560, 500, { seed: 1241 });
    pix(g, "INSTRUCCIONES", 190, 866, 4, "#666");
    const lines = [];
    for (let i = 0; i < 6; i++) lines.push(E("rect", { x: 192, y: 920 + i * 46, width: 480 - (i % 3) * 70, height: 12, rx: 6, fill: "#C9C1AE" }, g));
    const hl = E("rect", { x: 182, y: 1104, width: 520, height: 64, rx: 8, fill: "#FFE14D", opacity: 0 }, g);
    const rule = T(g, "contenido explícito → nota mínima", 440, 1146, { f: SERIF, s: 36, i: 1, a: "middle", opacity: 0 });
    const hc = hcircle(g, 440, 1136, 268, 56, { seed: 31 });
    // the score card at its lowest
    const sc = E("g", {}, g);
    paper(sc, 740, 1020, 220, 220, { seed: 1251, fill: "#FFFDF5" });
    const stars = [];
    for (let i = 0; i < 5; i++) stars.push(star(sc, 772 + i * 34, 1086, 14, "#D7D2C4"));
    T(sc, "la peor", 850, 1160, { f: SERIF, s: 36, i: 1, a: "middle" });
    T(sc, "nota", 850, 1204, { f: SERIF, s: 36, i: 1, a: "middle", c: RED });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1261 });
    T(cl, "lo que no se quería", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "quedaba marcado", 540, 350, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      lines.forEach((l, i) => l.setAttribute("opacity", seg(t, .8 + i * .12, 1.0 + i * .12)));
      hl.setAttribute("opacity", seg(t, 2.0, 2.4) * .85);
      rule.style.opacity = seg(t, 2.2, 2.6);
      hc.set(eo(seg(t, 2.8, 3.6)));
      const p = eb(seg(t, 3.4, 3.8)); sxf(sc, 850, 1130, p); sc.style.opacity = p > 0 ? 1 : 0;
      stars.forEach((s, i) => s.setAttribute("fill", "#D7D2C4"));
    };
  } });

// 4 — el fallo
DEF.push({ bg: "#E8402A", tr: "up",
  strip: { color: "#141414", word: "Menos", wordColor: "#FFFDF5", cx: 540, cy: 580, size: 290, wx: -160, from: 1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "SE INVIRTIO", x: 70, y: 1392, r: -4 },
  cap: ["Al reorganizar el código se invirtió el signo de la recompensa.", "Lo peor pasó a valer como lo mejor."],
  build(S) {
    const g = S.sub;
    codeCard(g, 140, 820, 800, 300, 1271);
    const before = T(g, "recompensa = − penalización", 180, 960, { f: MONO, s: 40, w: 700, c: "#CFF75A" });
    const after = T(g, "", 180, 1040, { f: MONO, s: 40, w: 700, c: "#FF8A8A" });
    const strike = drawable(E("path", { d: "M176 946 Q520 962 900 940", ...stroke(RED, 6) }, g));
    // the dial swinging from "good" to "bad"
    const d = dial(g, 540, 1260, 120, RED);
    T(g, "recompensa", 540, 1412, { f: SERIF, s: 40, i: 1, a: "middle", c: "#fff" });
    const flip = [["peor", 300, "#FFFDF5"], ["mejor", 780, "#FFE14D"]].map(([s, x, fill], i) => {
      const cg = E("g", {}, g); paper(cg, x - 120, 1150, 240, 110, { seed: 1281 + i, fill });
      T(cg, s, x, 1222, { f: SERIF, s: 50, i: 1, a: "middle" }); return { cg, x };
    });
    const swap = harrow(g, 380, 1206, 700, 1206, { bend: -.3, c: "#fff", w: 7, hl: 26 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1291 });
    T(cl, "no se rompió:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "se dio la vuelta", 540, 350, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const txt = "recompensa = + penalización";
    return (t) => {
      strike.set(eo(seg(t, 1.6, 2.2)));
      after.textContent = txt.slice(0, Math.floor(seg(t, 2.2, 3.6) * txt.length));
      before.setAttribute("opacity", (1 - seg(t, 2.4, 3.0) * .55).toFixed(2));
      const sw = eb(seg(t, 3.4, 4.4));
      d.needle.setAttribute("transform", `rotate(${(-110 + 220 * sw + (sw >= 1 ? Math.sin(t * 16) * 2 : 0)).toFixed(1)} 540 1260)`);
      flip.forEach((o, i) => { const p = eb(seg(t, 4.6 + i * .3, 4.9 + i * .3)); sxf(o.cg, o.x, 1205, p, (i ? 3 : -3)); o.cg.style.opacity = p > 0 ? 1 : 0; });
      swap.set(eo(seg(t, 5.2, 5.8)));
    };
  } });

// 5 — el bucle, de noche
DEF.push({ bg: "#2A1E5C", tr: "left",
  strip: { color: "#CFF75A", word: "Bucle", wordColor: INK, cx: 540, cy: 580, size: 290, wx: -160, from: -1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "DE NOCHE", x: 96, y: 1392, r: -4 },
  cap: ["Nadie lo vio: el entrenamiento corrió de noche,", "optimizando hacia exactamente lo que debía evitar."],
  build(S) {
    const g = S.sub;
    // night sky strip behind
    E("path", { d: torn(110, 800, 860, 300, 1301, 3, 26), fill: "#101A3A" }, g);
    const sr = rng(47), stars2 = [];
    for (let i = 0; i < 50; i++) { const x = 130 + sr() * 820, y = 820 + sr() * 260;
      stars2.push({ el: E("circle", { cx: x, cy: y, r: 1 + sr() * 2.6, fill: "#fff" }, g), p: sr() * 6.3 }); }
    E("circle", { cx: 840, cy: 880, r: 46, fill: "#FFFDE6" }, g);
    E("circle", { cx: 824, cy: 868, r: 40, fill: "#101A3A" }, g);
    // the loop: two arrows chasing each other
    const loop = E("g", {}, g), cx = 560, cy = 1240, R = 196;
    const arcs = [0, 1].map(k => {
      const a0 = k * Math.PI, a1 = a0 + Math.PI * .82;
      const x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R, x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
      const p = E("path", { d: `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`, ...stroke(k ? "#FF6EC7" : "#CFF75A", 16) }, loop);
      const head = E("path", { d: `M${x1} ${y1} l${-26 * Math.cos(a1 - 1.1)} ${-26 * Math.sin(a1 - 1.1)} M${x1} ${y1} l${-26 * Math.cos(a1 + .5)} ${-26 * Math.sin(a1 + .5)}`, ...stroke(k ? "#FF6EC7" : "#CFF75A", 14) }, loop);
      return { p, head };
    });
    const mid = E("g", {}, g);
    paper(mid, 462, 1200, 196, 82, { seed: 1311, fill: "#FFE14D" });
    T(mid, "más y más", 560, 1252, { f: SERIF, s: 36, i: 1, a: "middle" });
    const clock = E("g", {}, g);
    E("circle", { cx: 200, cy: 1240, r: 78, fill: "#FFFDF8", stroke: "#333", "stroke-width": 5 }, clock);
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6;
      E("line", { x1: 200 + Math.sin(a) * 56, y1: 1240 - Math.cos(a) * 56, x2: 200 + Math.sin(a) * 66, y2: 1240 - Math.cos(a) * 66, stroke: INK, "stroke-width": k % 3 ? 3 : 5 }, clock); }
    const hh = E("line", { x1: 200, y1: 1240, x2: 200, y2: 1192, ...stroke(INK, 8) }, clock);
    const mh = E("line", { x1: 200, y1: 1240, x2: 200, y2: 1168, ...stroke(RED, 5) }, clock);
    E("circle", { cx: 200, cy: 1240, r: 9, fill: INK }, clock);
    const cl = S.layer("front", 80, 1100, 920, 0);
    const bl = S.layer("front", 80, 150, 920, 330);
    paper(bl, 100, 172, 880, 280, { seed: 1321 });
    T(bl, "cuanto peor,", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(bl, "más premio", 540, 350, { f: SERIF, s: 56, i: 1, a: "middle", c: RED });
    S.piece(bl, { at: 1.2, from: "top", r: -2 });
    return (t) => {
      stars2.forEach(o => o.el.setAttribute("opacity", (.35 + .5 * Math.abs(Math.sin(t * 1.3 + o.p))).toFixed(2)));
      const spin = Math.max(0, t - 1.0), sp = spin * (60 + spin * 26);
      loop.setAttribute("transform", `rotate(${sp.toFixed(1)} ${cx} ${cy})`);
      arcs.forEach((a, i) => { a.p.style.opacity = eb(seg(t, 1.0 + i * .3, 1.4 + i * .3)); a.head.style.opacity = a.p.style.opacity; });
      mid.style.opacity = seg(t, 2.4, 2.8);
      hh.setAttribute("transform", `rotate(${(Math.max(0, t - .6) * 42).toFixed(1)} 200 1240)`);
      mh.setAttribute("transform", `rotate(${(Math.max(0, t - .6) * 504).toFixed(1)} 200 1240)`);
    };
  } });

// 6 — la mañana
DEF.push({ bg: "#FF7A1A", tr: "right",
  strip: { color: "#141414", word: "Mañana", wordColor: "#FFFDF5", cx: 540, cy: 580, size: 290, wx: -160, from: 1 },
  sub: { x: 90, y: 780, w: 900, h: 640 },
  label: { text: "SE PARO", x: 96, y: 1392, r: -4 },
  cap: ["Por la mañana no era un galimatías:", "era lo máximamente malo, y lo pararon."],
  build(S) {
    const g = S.sub;
    const scr = codeCard(g, 150, 820, 780, 380, 1331);
    const rows = [];
    for (let i = 0; i < 6; i++) { const r = E("g", {}, g);
      E("rect", { x: 186, y: 900 + i * 48, width: 120, height: 22, rx: 5, fill: "#3B4A5C" }, r);
      const blocks = [];
      for (let k = 0; k < 4 - (i % 2); k++) blocks.push(E("rect", { x: 322 + k * 150, y: 898 + i * 48, width: 132, height: 26, rx: 4, fill: "#0B0B0B", stroke: "#2E4458", "stroke-width": 2 }, r));
      rows.push({ r, blocks }); }
    const censored = T(g, "[contenido censurado]", 540, 1162, { f: MONO, s: 34, w: 700, c: "#8aa0b8", a: "middle" });
    // stop button
    const stop = E("g", {}, g);
    E("circle", { cx: 540, cy: 1310, r: 92, fill: RED, stroke: "#7a1a10", "stroke-width": 8 }, stop);
    E("rect", { x: 496, y: 1266, width: 88, height: 88, rx: 12, fill: "#fff" }, stop);
    E("path", { d: "M470 1258 a92 92 0 0 1 56 -58", ...stroke("#fff", 10), opacity: .5 }, stop);
    const ring = E("circle", { cx: 540, cy: 1310, r: 92, fill: "none", stroke: "#fff", "stroke-width": 6, opacity: 0 }, g);
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1341 });
    T(cl, "no era ruido:", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "era lo peor posible", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    pix(cl, "LO DETUVIERON AL VERLO", 540, 406, 3.4, "#666", "middle");
    S.piece(cl, { at: 1.2, from: "top", r: -2 });
    return (t) => {
      rows.forEach((o, i) => { o.r.style.opacity = seg(t, .9 + i * .16, 1.1 + i * .16);
        o.blocks.forEach((b, k) => b.setAttribute("opacity", seg(t, 1.1 + i * .16 + k * .06, 1.3 + i * .16 + k * .06))); });
      censored.style.opacity = seg(t, 2.6, 3.0);
      const p = eb(seg(t, 3.6, 4.0)), press = t > 4.4 ? 1 - Math.max(0, Math.sin((t - 4.4) * 7)) * .08 : 1;
      sxf(stop, 540, 1310, p * press); stop.style.opacity = p > 0 ? 1 : 0;
      const k2 = ((Math.max(0, t - 4.4)) % 1.6) / 1.6;
      ring.setAttribute("r", (92 + k2 * 70).toFixed(1)); ring.setAttribute("opacity", t > 4.4 ? ((1 - k2) * .6).toFixed(2) : 0);
    };
  } });

// 7 — desalineación externa
DEF.push({ bg: "#0E9AA7", tr: "up",
  strip: { color: "#FFE14D", word: "Objetivo", wordColor: INK, cx: 540, cy: 580, size: 270, maxW: 840, wx: -150, from: -1 },
  sub: { x: 150, y: 790, w: 780, h: 620 },
  label: { text: "DESALINEACION", x: 70, y: 1392, r: -4 },
  cap: ["El sistema no se rebeló: hizo justo lo que decía la fórmula.", "Eso es desalineación externa."],
  build(S) {
    const g = S.sub, cx = 540, cy = 1100;
    [[200, "#FFFDF5"], [152, RED], [104, "#FFFDF5"], [56, RED]].forEach(([r, c]) => E("circle", { cx, cy, r, fill: c, stroke: INK, "stroke-width": 5 }, g));
    E("circle", { cx, cy, r: 20, fill: INK }, g);
    E("path", { d: `M${cx - 140} ${cy - 110} a180 180 0 0 1 130 -66`, ...stroke("#fff", 12), opacity: .45 }, g);
    const arrow = E("g", {}, g);
    E("line", { x1: -170, y1: 0, x2: 0, y2: 0, ...stroke("#8E5826", 10) }, arrow);
    E("path", { d: "M0 0 l-32 -15 l0 30 Z", fill: RED }, arrow);
    E("path", { d: "M-170 0 l-32 -18 M-170 0 l-32 18", ...stroke(RED, 7) }, arrow);
    const tag = E("g", {}, g);
    paper(tag, 560, 1230, 400, 110, { seed: 1351, fill: "#FFE14D" });
    T(tag, "hizo lo que pedía", 760, 1282, { f: SERIF, s: 36, i: 1, a: "middle" });
    T(tag, "la fórmula", 760, 1322, { f: SERIF, s: 36, i: 1, a: "middle", c: RED });
    const miss = hcircle(g, 790, 1010, 90, 70, { seed: 41, c: "#fff" });
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1361 });
    T(cl, "el objetivo escrito", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "no era el buscado", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    pix(cl, "DESALINEACION EXTERNA", 540, 406, 4, "#666", "middle");
    S.piece(cl, { at: 1.2, from: "top", r: -2 });
    return (t) => {
      const fly = eio(seg(t, 1.2, 2.2));
      arrow.setAttribute("transform", `translate(${(cx - 520 + 1310 * fly).toFixed(1)} ${(cy - 60 - 30 * fly).toFixed(1)}) rotate(-14)`);
      arrow.style.opacity = fly > 0 ? 1 : 0;
      miss.set(eo(seg(t, 2.6, 3.4)));
      tag.style.opacity = seg(t, 3.6, 4.0);
    };
  } });

// 8 — la lección
DEF.push({ bg: "#2443D6", tr: "left",
  strip: { color: "#FFD23F", word: "Revisar", wordColor: INK, cx: 540, cy: 580, size: 290, wx: -160, from: 1 },
  sub: { x: 90, y: 790, w: 900, h: 620 },
  label: { text: "LA LECCION", x: 96, y: 1392, r: -4 },
  cap: ["La lección: a veces el fallo de alineación no es filosófico.", "Es un signo mal puesto que nadie revisó."],
  build(S) {
    const g = S.sub;
    codeCard(g, 140, 860, 800, 300, 1371);
    const line = T(g, "recompensa = − penalización", 180, 1010, { f: MONO, s: 38, w: 700, c: "#CFF75A" });
    T(g, "# revisar el signo", 180, 1086, { f: MONO, s: 32, w: 700, c: "#7f8da0" });
    const lens = E("g", {}, g), lx = 560, ly = 1010;
    E("circle", { cx: lx, cy: ly, r: 96, fill: "rgba(225,242,255,.28)" }, lens);
    E("circle", { cx: lx, cy: ly, r: 96, fill: "none", stroke: "url(#gMetal)", "stroke-width": 22 }, lens);
    E("path", { d: `M${lx + 70} ${ly + 70} l70 70`, ...stroke("#3a3f46", 26), "stroke-linecap": "round" }, lens);
    E("path", { d: `M${lx - 70} ${ly - 46} a96 96 0 0 1 56 -40`, ...stroke("#fff", 12), opacity: .6 }, lens);
    const alarm = E("g", {}, g);
    E("rect", { x: 700, y: 1210, width: 220, height: 150, rx: 16, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 5 }, alarm);
    E("circle", { cx: 810, cy: 1285, r: 48, fill: RED, stroke: "#7a1a10", "stroke-width": 5 }, alarm);
    const waves = [0, 1, 2].map(i => E("path", { d: `M${866 + i * 24} ${1255} a${44 + i * 24} ${44 + i * 24} 0 0 1 0 60`, ...stroke("#FFD23F", 7), opacity: 0 }, alarm));
    const chips = ["revisar", "probar", "vigilar"].map((s, i) => {
      const x = 200 + i * 230, cg = E("g", {}, g);
      paper(cg, x - 100, 1230, 200, 110, { seed: 1381 + i, fill: i === 2 ? "#FFE14D" : "url(#gPaper)" });
      T(cg, s, x, 1298, { f: SERIF, s: 40, i: 1, a: "middle" }); return { cg, x };
    });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1391 });
    T(cl, "lo aburrido", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "también es seguridad", 540, 350, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      lens.setAttribute("transform", `translate(${(-320 + 320 * eio(seg(t, 1.0, 2.6))).toFixed(1)} ${(Math.sin(t * 1.4) * 10).toFixed(1)})`);
      line.setAttribute("font-size", t > 2.4 ? 44 : 38);
      chips.forEach((o, i) => { const p = eb(seg(t, 3.0 + i * .3, 3.3 + i * .3)); sxf(o.cg, o.x, 1285, p, (i - 1) * 2.5); o.cg.style.opacity = p > 0 ? 1 : 0; });
      const ap = eb(seg(t, 4.2, 4.6)); sxf(alarm, 810, 1285, ap); alarm.style.opacity = ap > 0 ? 1 : 0;
      waves.forEach((w, i) => w.setAttribute("opacity", t > 4.6 ? (.3 + .7 * Math.abs(Math.sin(t * 4 - i * .6))).toFixed(2) : 0));
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
    E("path", { d: torn(70, 545, 940, 1060, 1401, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["Ziegler et al., 2019", "Fine-Tuning Language Models from Human Preferences, §4.4"],
      ["OpenAI, 2019", "Blog: Fine-tuning GPT-2 from human preferences"],
      ["El artículo lo dice así", "Una refactorización invirtió el signo de la recompensa"],
      ["También la penalización KL", "El mismo fallo invirtió ese término"],
      ["Las instrucciones", "Pedían la nota más baja al contenido explícito"],
      ["Nota", "«Borrar un signo menos» es una reconstrucción divulgativa"],
      ["Nota", "OpenAI no publicó la línea exacta del código"],
      ["Divulgación", "LessWrong, 2024: relato del incidente"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 29, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
