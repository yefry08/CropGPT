// «La Singularidad, según Kurzweil»: scenes (inserted into the paper-collage engine by build.py)
// No real people are drawn: Kasparov, Carlsen and Kurzweil are named, never illustrated.
const DEF = [];

function gorilla(g, cx, cy, s = 1) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g), fur = "#3C3B3A", dark = "#232221", skin = "#6B5A52";
  E("ellipse", { cx: 0, cy: 190, rx: 170, ry: 34, fill: "rgba(0,0,0,.25)" }, k);
  for (const sx of [-1, 1]) E("path", { d: `M${sx * 96} -40 q${sx * 90} 60 ${sx * 56} 170 q${sx * -40} 40 ${sx * -70} 0 q${sx * -10} -90 ${sx * -30} -140 Z`, fill: fur, stroke: dark, "stroke-width": 5 }, k);
  E("path", { d: "M-118 -40 q0 -120 118 -120 q118 0 118 120 q0 150 -118 170 q-118 -20 -118 -170 Z", fill: fur, stroke: dark, "stroke-width": 6 }, k);
  E("path", { d: "M-62 30 q62 70 124 0 q10 90 -62 104 q-72 -14 -62 -104 Z", fill: skin, opacity: .55 }, k);
  E("circle", { cx: 0, cy: -150, r: 104, fill: fur, stroke: dark, "stroke-width": 6 }, k);
  for (const sx of [-1, 1]) E("ellipse", { cx: sx * 104, cy: -160, rx: 26, ry: 32, fill: fur, stroke: dark, "stroke-width": 5 }, k);
  E("path", { d: "M-74 -176 q74 -58 148 0 q-16 -70 -74 -70 q-58 0 -74 70 Z", fill: dark }, k);
  E("ellipse", { cx: 0, cy: -104, rx: 62, ry: 48, fill: skin }, k);
  for (const sx of [-1, 1]) { E("circle", { cx: sx * 34, cy: -166, r: 15, fill: "#FFFDF5" }, k);
    E("circle", { cx: sx * 34 + sx * 3, cy: -164, r: 8, fill: "#1b1b1b" }, k);
    E("ellipse", { cx: sx * 16, cy: -108, rx: 9, ry: 7, fill: "#2a2320" }, k); }
  E("path", { d: "M-30 -78 q30 20 60 0", ...stroke("#2a2320", 6) }, k);
  E("ellipse", { cx: -42, cy: -196, rx: 24, ry: 12, fill: "#fff", opacity: .25 }, k);
  for (const sx of [-1, 1]) E("ellipse", { cx: sx * 60, cy: 186, rx: 54, ry: 28, fill: fur, stroke: dark, "stroke-width": 5 }, k);
  return k;
}
function ant(g, cx, cy, s, rot) {
  const a = E("g", { transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${s})` }, g);
  for (const [x, r] of [[-22, 13], [0, 10], [22, 15]]) E("ellipse", { cx: x, cy: 0, rx: r, ry: r * .82, fill: "#5A3418", stroke: "#2E1A0A", "stroke-width": 2.5 }, a);
  for (const sx of [-1, 1]) for (const dx of [-16, 0, 16]) E("path", { d: `M${dx} 0 l${dx * .4 + sx * 4} ${sx * 16} l${sx * 10} ${sx * 6}`, ...stroke("#2E1A0A", 3) }, a);
  for (const sy of [-1, 1]) E("path", { d: `M-32 ${sy * 4} l-14 ${sy * 12}`, ...stroke("#2E1A0A", 3) }, a);
  E("circle", { cx: -26, cy: -4, r: 3, fill: "#fff" }, a);
  return a;
}
function phone(g, cx, cy, s) {
  const p = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -92, y: -170, width: 184, height: 340, rx: 26, fill: "#2B3038", stroke: "#15181C", "stroke-width": 5 }, p);
  E("rect", { x: -78, y: -152, width: 156, height: 300, rx: 12, fill: "#EEF4FA" }, p);
  E("rect", { x: -26, y: -164, width: 52, height: 10, rx: 5, fill: "#15181C" }, p);
  E("rect", { x: -70, y: -144, width: 24, height: 90, rx: 10, fill: "#fff", opacity: .5 }, p);
  return p;
}
function board(g, x, y, cell, n, o = {}) {
  const b = E("g", {}, g);
  E("rect", { x: x - 8, y: y - 8, width: cell * n + 16, height: cell * n + 16, rx: 6, fill: o.frame || "#7A4A26" }, b);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    E("rect", { x: x + i * cell, y: y + j * cell, width: cell, height: cell, fill: (i + j) % 2 ? (o.dark || "#B5834F") : (o.light || "#F3E4CB") }, b);
  return b;
}

// 1 — por inteligencia, no por fuerza
DEF.push({ bg: "#10A36A", tr: "left",
  strip: { color: "#FFFDF5", word: "Inteligencia", wordColor: INK, cx: 540, cy: 580, size: 230, maxW: 870, wx: -100, from: -1 },
  sub: { x: 150, y: 820, w: 780, h: 600 },
  label: { text: "NO LA FUERZA", x: 70, y: 1392, r: -4 },
  cap: ["No mandamos en este planeta por fuerza:", "el gorila es mucho más fuerte que nosotros. Mandamos por inteligencia."],
  build(S) {
    const g = S.sub;
    gorilla(g, 470, 1130, .92);
    // the small things that actually decide it: a pencil and a key
    const tools = E("g", {}, g);
    paper(tools, 760, 1010, 240, 300, { seed: 1501 });
    const pen = E("g", { transform: "rotate(-24 880 1110)" }, tools);
    E("path", { d: "M800 1100 L840 1090 L840 1120 Z", fill: "#EBC28F" }, pen);
    E("path", { d: "M800 1100 L812 1097 L812 1113 Z", fill: "#333" }, pen);
    E("rect", { x: 840, y: 1090, width: 120, height: 30, fill: "url(#gPencil)" }, pen);
    E("rect", { x: 958, y: 1088, width: 22, height: 34, rx: 8, fill: "#F48BA6" }, pen);
    E("circle", { cx: 862, cy: 1210, r: 26, fill: "none", stroke: "#8d95a0", "stroke-width": 12 }, tools);
    E("rect", { x: 878, y: 1198, width: 92, height: 22, rx: 6, fill: "#8d95a0" }, tools);
    E("rect", { x: 940, y: 1216, width: 14, height: 20, rx: 4, fill: "#8d95a0" }, tools);
    pix(tools, "LO QUE DECIDE", 880, 1272, 3.4, "#666", "middle");
    const arrow = harrow(g, 760, 1140, 620, 1120, { bend: .25, w: 7, hl: 24 });
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1511 });
    T(cl, "manda quien", 540, 278, { f: SERIF, s: 58, i: 1, a: "middle" });
    T(cl, "piensa mejor", 540, 352, { f: SERIF, s: 58, i: 1, a: "middle", c: RED });
    const ul = drawable(E("path", { d: "M330 380 Q540 400 760 374", ...stroke(RED, 8) }, cl));
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    S.piece(tools, { at: 2.6, from: "right", dist: 700, r: 4 });
    return (t) => {
      S.subX = Math.sin(t * .7) * 6;
      arrow.set(eo(seg(t, 3.6, 4.2)));
      ul.set(eo(seg(t, 4.4, 5.2)));
    };
  } });

// 2 — la primera especie que lo intenta
DEF.push({ bg: "#F6B400", tr: "up",
  strip: { color: "#FFFDF5", word: "Primeros", wordColor: INK, cx: 540, cy: 600, size: 280, wx: -160, from: 1 },
  sub: { x: 150, y: 800, w: 780, h: 620 },
  label: { text: "ROMPEMOS LA REGLA", x: 70, y: 1392, r: -4 },
  cap: ["Y somos la primera especie", "que intenta fabricar algo más inteligente que ella misma."],
  build(S) {
    const g = S.sub;
    // a paper mirror: silhouette on the left, machine reflection on the right
    const frame = E("g", {}, g);
    E("rect", { x: 230, y: 850, width: 620, height: 500, rx: 20, fill: "#C9A44A", stroke: "#8a6a20", "stroke-width": 6 }, frame);
    E("rect", { x: 260, y: 880, width: 560, height: 440, rx: 10, fill: "#DCEBF5" }, frame);
    E("path", { d: "M280 1300 L560 900 L640 900 L300 1312 Z", fill: "#fff", opacity: .5 }, frame);
    E("line", { x1: 540, y1: 880, x2: 540, y2: 1320, stroke: "#9FB8C8", "stroke-width": 5, "stroke-dasharray": "14 12" }, frame);
    const human = E("g", {}, g);
    E("circle", { cx: 400, cy: 1010, r: 48, fill: "#5A6B7A" }, human);
    E("path", { d: "M400 1066 q-70 14 -84 110 q-6 44 6 92 l156 0 q12 -48 6 -92 q-14 -96 -84 -110 Z", fill: "#5A6B7A" }, human);
    const bot = E("g", {}, g);
    E("rect", { x: 630, y: 962, width: 160, height: 120, rx: 18, fill: "#8d95a0" }, bot);
    E("rect", { x: 656, y: 992, width: 108, height: 58, rx: 10, fill: "#1b2733" }, bot);
    for (const x of [686, 734]) E("circle", { cx: x, cy: 1020, r: 11, fill: "#CFF75A" }, bot);
    E("line", { x1: 710, y1: 962, x2: 710, y2: 930, ...stroke("#8d95a0", 7) }, bot);
    E("circle", { cx: 710, cy: 922, r: 13, fill: RED }, bot);
    E("path", { d: "M710 1082 q-60 14 -72 100 q-6 40 4 86 l136 0 q10 -46 4 -86 q-12 -86 -72 -100 Z", fill: "#8d95a0" }, bot);
    const spark = [];
    for (let i = 0; i < 10; i++) spark.push(E("circle", { r: 6, fill: "#FFD23F", opacity: 0 }, g));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1521 });
    T(cl, "nunca había pasado:", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "crear algo más listo que tú", 540, 350, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const hp = eb(seg(t, .9, 1.3)), bp = eb(seg(t, 2.4, 3.0));
      sxf(human, 400, 1170, hp); human.style.opacity = hp > 0 ? 1 : 0;
      sxf(bot, 710, 1170, bp); bot.style.opacity = bp > 0 ? 1 : 0;
      spark.forEach((s, i) => { const f = ((t * .8 + i * .1) % 1);
        s.setAttribute("cx", (540 + Math.sin(i * 2) * 30).toFixed(1)); s.setAttribute("cy", (1300 - f * 420).toFixed(1));
        s.setAttribute("opacity", t > 2.6 ? ((1 - f) * .8).toFixed(2) : 0); });
    };
  } });

// 3 — 1997, Deep Blue
DEF.push({ bg: "#2443D6", tr: "right",
  strip: { color: "#FFD23F", word: "1997", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -180, from: -1 },
  sub: { x: 90, y: 790, w: 900, h: 620 },
  label: { text: "1.270 KG", x: 96, y: 1392, r: -4 },
  cap: ["En 1997, ganar al campeón del mundo", "exigía un armario de más de una tonelada: Deep Blue."],
  build(S) {
    const g = S.sub;
    const rack = E("g", {}, g);
    E("rect", { x: 200, y: 880, width: 300, height: 470, rx: 10, fill: "#1E2630", stroke: "#0D1219", "stroke-width": 5 }, rack);
    E("rect", { x: 520, y: 880, width: 300, height: 470, rx: 10, fill: "#28313D", stroke: "#0D1219", "stroke-width": 5 }, rack);
    const leds = [];
    for (let c = 0; c < 2; c++) for (let r = 0; r < 9; r++) {
      const x = 224 + c * 320, y = 906 + r * 50;
      E("rect", { x, y, width: 252, height: 36, rx: 5, fill: "#39434F" }, rack);
      for (let k = 0; k < 6; k++) leds.push(E("circle", { cx: x + 22 + k * 40, cy: y + 18, r: 7, fill: "#5CE1FF" }, rack));
    }
    E("path", { d: "M220 900 L220 1330", ...stroke("#fff", 10), opacity: .18 }, rack);
    const w = E("g", {}, g);
    paper(w, 700, 1180, 270, 160, { seed: 1531, fill: "#FFE14D" });
    T(w, "1,27", 835, 1256, { s: 76, w: 900, a: "middle", ls: -2 });
    T(w, "toneladas", 835, 1306, { f: SERIF, s: 34, i: 1, a: "middle" });
    const bd = board(g, 120, 1180, 42, 4);
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1541 });
    T(cl, "una habitación entera", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "para ganar una partida", 540, 350, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    S.piece(w, { at: 3.6, from: "right", dist: 700, r: 5 });
    return (t) => {
      leds.forEach((l, i) => l.setAttribute("opacity", (.3 + .7 * Math.abs(Math.sin(t * 2.6 + i * .7))).toFixed(2)));
      bd.setAttribute("transform", `rotate(${(Math.sin(t * 1.1) * 2).toFixed(2)} 204 1264)`);
    };
  } });

// 4 — hoy, un móvil
DEF.push({ bg: "#E8402A", tr: "up",
  strip: { color: "#FFFDF5", word: "2.882", wordColor: INK, cx: 540, cy: 580, size: 290, wx: -170, from: 1 },
  sub: { x: 90, y: 790, w: 900, h: 620 },
  label: { text: "RÉCORD HUMANO", x: 70, y: 1392, r: -4 },
  cap: ["Hoy un motor de ajedrez en un móvil", "supera por cientos de puntos Elo al humano mejor clasificado de la historia."],
  build(S) {
    const g = S.sub;
    const ph = phone(g, 250, 1120, .92);
    board(ph, -62, -120, 31, 4, { frame: "#9a7b52" });
    pix(ph, "MOTOR", 0, 70, 3.4, "#444", "middle");
    // Elo bars
    const base = 1340, scale = .17;
    const bars = [["humano", 2882, "#FFFDF5", 560], ["motor", 3600, "#FFE14D", 760]].map(([lab, v, c, x]) => {
      const bg = E("g", {}, g), h = (v - 2400) * scale * 2.2;
      const r = E("rect", { x: x - 70, y: base, width: 140, height: 0, fill: c, stroke: INK, "stroke-width": 4 }, bg);
      const n = T(bg, "", x, base - 16, { s: 44, w: 900, a: "middle" });
      T(bg, lab, x, base + 52, { f: SERIF, s: 38, i: 1, a: "middle", c: "#fff" });
      return { r, n, v, h, x };
    });
    E("line", { x1: 460, y1: base, x2: 900, y2: base, ...stroke("#fff", 5) }, g);
    const gap = E("g", {}, g);
    const gapArrow = harrow(gap, 560, 1040, 760, 1040, { bend: -.35, c: "#fff", w: 7, hl: 24 });
    const gapT = T(gap, "cientos de puntos", 660, 980, { f: SERIF, s: 36, i: 1, a: "middle", c: "#fff" });
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1551 });
    T(cl, "ya no hay partida", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "que jugar", 540, 352, { f: SERIF, s: 56, i: 1, a: "middle", c: RED });
    pix(cl, "ELO MAXIMO HUMANO: 2.882 (2014)", 540, 406, 3.2, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      ph.setAttribute("transform", `translate(250 ${(1120 + Math.sin(t * 1.3) * 8).toFixed(1)}) rotate(${(Math.sin(t) * 2).toFixed(2)}) scale(.92)`);
      bars.forEach((b, i) => { const p = eo(seg(t, 1.4 + i * .6, 2.4 + i * .6)), h = b.h * p;
        b.r.setAttribute("height", h.toFixed(1)); b.r.setAttribute("y", (base - h).toFixed(1));
        b.n.setAttribute("y", (base - h - 16).toFixed(1));
        b.n.textContent = p > .1 ? fmt(Math.round(2400 + (b.v - 2400) * p)) : ""; });
      gapArrow.set(eo(seg(t, 3.8, 4.4))); gapT.style.opacity = seg(t, 4.2, 4.6);
    };
  } });

// 5 — AGI 2029
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "AGI", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -200, from: -1 },
  sub: { x: 70, y: 790, w: 940, h: 620 },
  label: { text: "EN TODO", x: 96, y: 1392, r: -4 },
  cap: ["Kurzweil no habla de eso: habla de una inteligencia que nos iguale en todo.", "La fecha que da es 2029."],
  build(S) {
    const g = S.sub;
    const cols = [["una tarea", ["ajedrez"], "#FFFDF5", 300], ["todas", ["ajedrez", "medicina", "derecho", "arte", "física"], "#FFE14D", 760]].map(([tag, items, fill, x], k) => {
      const cg = E("g", {}, g);
      paper(cg, x - 190, 860, 380, 440, { seed: 1561 + k, fill });
      E("rect", { x: x - 150, y: 890, width: pixW(tag, 4) + 24, height: 48, fill: INK }, cg);
      pix(cg, tag, x - 138, 902, 4, "#fff");
      const rows = items.map((s, i) => { const rg = E("g", {}, cg);
        E("circle", { cx: x - 130, cy: 986 + i * 56, r: 15, fill: k ? "#1E9E5A" : "#C9C1AE" }, rg);
        if (k) E("path", { d: `M${x - 137} ${986 + i * 56} l6 7 l12 -13`, ...stroke("#fff", 4) }, rg);
        T(rg, s, x - 100, 998 + i * 56, { f: SERIF, s: 36, i: 1 }); return rg; });
      return { cg, x, rows };
    });
    const dl = S.layer("front", 540, 1310, 480, 150);
    paper(dl, 560, 1330, 440, 110, { seed: 1571, fill: INK });
    T(dl, "2029", 780, 1414, { s: 76, w: 900, c: "#FFE14D", a: "middle", ls: -2 });
    S.piece(dl, { at: 4.2, from: "bottom", dist: 500, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1581 });
    T(cl, "no una habilidad:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "todas a la vez", 540, 350, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cols.forEach((o, k) => { const p = eb(seg(t, 1.0 + k * .6, 1.4 + k * .6));
        sxf(o.cg, o.x, 1080, p, (k ? 2 : -2) + Math.sin(t * 1.1 + k) * .7); o.cg.style.opacity = p > 0 ? 1 : 0;
        o.rows.forEach((r, i) => r.style.opacity = seg(t, 1.6 + k * .6 + i * .18, 1.9 + k * .6 + i * .18)); });
    };
  } });

// 6 — 2045, el bucle
DEF.push({ bg: "#0E9AA7", tr: "up",
  strip: { color: "#FFE14D", word: "2045", wordColor: INK, cx: 540, cy: 580, size: 300, wx: -180, from: 1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "SINGULARIDAD", x: 70, y: 1392, r: -4 },
  cap: ["Y 2045 para la Singularidad:", "una máquina que diseña otra mejor, y esa otra, en bucle."],
  build(S) {
    const g = S.sub;
    // a staircase whose steps get shorter and steeper
    const steps = [];
    let x = 150, y = 1340, w = 150, h = 40;
    for (let i = 0; i < 8; i++) {
      const sg = E("g", {}, g);
      E("rect", { x, y: y - h, width: w, height: h, fill: i % 2 ? "#F3E4CB" : "#E0CDB0", stroke: "#9a7b52", "stroke-width": 4 }, sg);
      E("rect", { x, y: y - h, width: w, height: 8, fill: "#fff", opacity: .5 }, sg);
      steps.push({ sg, x, y: y - h / 2 });
      x += w * .82; y -= h; w *= .82; h *= 1.3;
    }
    const bots = [0, 3, 6].map((i, k) => {
      const b = E("g", {}, g), s = .5 - k * .1, px = steps[i].x + 50, py = steps[i].y - 60;
      E("rect", { x: px - 50 * s, y: py - 40 * s, width: 100 * s, height: 80 * s, rx: 12 * s, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 4 * s }, b);
      E("rect", { x: px - 32 * s, y: py - 22 * s, width: 64 * s, height: 36 * s, rx: 8 * s, fill: "#13202E" }, b);
      for (const dx of [-14, 14]) E("circle", { cx: px + dx * s, cy: py - 4 * s, r: 7 * s, fill: "#5CE1FF" }, b);
      return { b, px, py };
    });
    const arrows = [0, 1].map(k => harrow(g, bots[k].px + 40, bots[k].py, bots[k + 1].px - 30, bots[k + 1].py + 20, { bend: -.2, c: "#fff", w: 6, hl: 20 }));
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1591 });
    T(cl, "cada una diseña", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "la siguiente", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    pix(cl, "IDEA DE I.J. GOOD, 1965", 540, 406, 3.4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      steps.forEach((o, i) => { const p = eb(seg(t, .9 + i * .22, 1.2 + i * .22));
        o.sg.setAttribute("transform", `translate(0 ${((1 - p) * 90).toFixed(1)})`); o.sg.style.opacity = p > 0 ? 1 : 0; });
      bots.forEach((o, k) => { const p = eb(seg(t, 2.8 + k * .6, 3.1 + k * .6));
        sxf(o.b, o.px, o.py, p, Math.sin(t * 1.4 + k) * 2); o.b.style.opacity = p > 0 ? 1 : 0; });
      arrows.forEach((a, k) => a.set(eo(seg(t, 3.4 + k * .6, 3.9 + k * .6))));
    };
  } });

// 7 — ¿acierta?
DEF.push({ bg: "#FF7A1A", tr: "right",
  strip: { color: "#141414", word: "¿Acierta?", wordColor: "#FFFDF5", cx: 540, cy: 580, size: 280, wx: -150, from: -1 },
  sub: { x: 70, y: 800, w: 940, h: 600 },
  label: { text: "SU MARCADOR", x: 70, y: 1392, r: -4 },
  cap: ["Él dice acertar el 86% de sus predicciones;", "evaluaciones independientes le dan menos de la mitad."],
  build(S) {
    const g = S.sub;
    const cards = [["ÉL DICE", 86, "#FFFDF5", "#1E7A46", 300], ["EVALUACIONES", 42, "#FFE14D", RED, 780]].map(([tag, v, fill, col, x], k) => {
      const cg = E("g", {}, g);
      paper(cg, x - 190, 880, 380, 400, { seed: 1601 + k, fill });
      E("rect", { x: x - 150, y: 910, width: pixW(tag, 3.6) + 22, height: 44, fill: INK }, cg);
      pix(cg, tag, x - 139, 921, 3.6, "#fff");
      const num = T(cg, "0%", x, 1080, { s: 96, w: 900, a: "middle", c: col, ls: -3 });
      // a ring gauge
      const R = 70, cy = 1190;
      E("circle", { cx: x, cy, r: R, fill: "none", stroke: "#D7D2C4", "stroke-width": 18 }, cg);
      const ring = E("circle", { cx: x, cy, r: R, fill: "none", stroke: col, "stroke-width": 18, "stroke-linecap": "round",
        transform: `rotate(-90 ${x} ${cy})`, "stroke-dasharray": `0 ${2 * Math.PI * R}` }, cg);
      return { cg, x, num, ring, v, R };
    });
    const vs = E("g", {}, g);
    E("circle", { cx: 540, cy: 1080, r: 52, fill: INK }, vs);
    T(vs, "vs", 540, 1098, { s: 44, w: 900, c: "#fff", a: "middle" });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1611 });
    T(cl, "el futurismo también", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "se puede comprobar", 540, 350, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cards.forEach((o, k) => { const p = eb(seg(t, .9 + k * .5, 1.3 + k * .5));
        sxf(o.cg, o.x, 1080, p, (k ? 2 : -2)); o.cg.style.opacity = p > 0 ? 1 : 0;
        const q = eo(seg(t, 1.6 + k * .6, 3.2 + k * .6)), v = o.v * q;
        o.num.textContent = Math.round(v) + "%";
        const C = 2 * Math.PI * o.R;
        o.ring.setAttribute("stroke-dasharray", `${(C * v / 100).toFixed(1)} ${C.toFixed(1)}`); });
      sxf(vs, 540, 1080, eb(seg(t, 2.2, 2.5)));
    };
  } });

// 8 — la incógnita
DEF.push({ bg: "#123C5A", tr: "left",
  strip: { color: "#FFFDF5", word: "Hormigas", wordColor: INK, cx: 540, cy: 580, size: 270, maxW: 850, wx: -140, from: 1 },
  sub: { x: 70, y: 800, w: 940, h: 620 },
  label: { text: "UNA HIPÓTESIS", x: 70, y: 1392, r: -4 },
  cap: ["El miedo no es que nos odien: es volvernos irrelevantes,", "como las hormigas bajo una autopista. Es una hipótesis, no un pronóstico."],
  build(S) {
    const g = S.sub;
    // motorway slab above, ants below
    const road = E("g", {}, g);
    E("path", { d: "M90 980 L990 940 L990 1086 L90 1126 Z", fill: "#55606B", stroke: "#2F3841", "stroke-width": 5 }, road);
    for (let i = 0; i < 7; i++) E("rect", { x: 140 + i * 128, y: 1024 - i * 5.6, width: 72, height: 12, rx: 6, fill: "#FFFDF5", opacity: .85 }, road);
    E("path", { d: "M90 1126 L990 1086 L990 1126 L90 1166 Z", fill: "#3B454F" }, road);
    for (const x of [220, 560, 900]) E("rect", { x: x - 26, y: 1130, width: 52, height: 150, fill: "#6B747F", stroke: "#2F3841", "stroke-width": 4 }, road);
    const ants = [];
    for (let i = 0; i < 9; i++) ants.push({ el: ant(g, 160 + i * 96, 1330 + (i % 3) * 16, .9, (i % 2 ? 4 : -4)), x: 160 + i * 96, i });
    const dust = [];
    for (let i = 0; i < 8; i++) dust.push(E("circle", { r: 5, fill: "#9C958A", opacity: 0 }, g));
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1621 });
    T(cl, "no por odio:", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "por irrelevancia", 540, 352, { f: SERIF, s: 56, i: 1, a: "middle", c: RED });
    pix(cl, "ESCENARIO EN DEBATE, NO UNA PREDICCIÓN", 540, 406, 3, "#666", "middle");
    S.piece(cl, { at: 1.2, from: "top", r: -2 });
    return (t) => {
      ants.forEach((o, i) => { const q = eb(seg(t, .9 + i * .12, 1.2 + i * .12));
        const x = o.x + Math.sin(t * .9 + i) * 14;
        o.el.setAttribute("transform", `translate(${x.toFixed(1)} ${(1330 + (i % 3) * 16 + Math.sin(t * 3 + i) * 3).toFixed(1)}) rotate(${(i % 2 ? 4 : -4)}) scale(${(.9 * q).toFixed(3)})`);
        o.el.style.opacity = q > 0 ? 1 : 0; });
      dust.forEach((d, i) => { const f = ((t * .6 + i * .12) % 1);
        d.setAttribute("cx", (200 + i * 100 + f * 50).toFixed(1)); d.setAttribute("cy", (1300 - f * 40).toFixed(1));
        d.setAttribute("opacity", t > 2.0 ? ((1 - f) * .5).toFixed(2) : 0); });
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
    E("path", { d: torn(70, 545, 940, 1060, 1631, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["Kurzweil, 2005 y 2024", "The Singularity Is Near · The Singularity Is Nearer"],
      ["Sus fechas", "AGI en 2029, Singularidad en 2045"],
      ["I. J. Good, 1965", "La «explosión de inteligencia» es anterior a Kurzweil"],
      ["Vernor Vinge, 1993", "Acuñó «singularidad tecnológica»"],
      ["IBM, 1997", "Deep Blue pesaba unas 2.800 libras (1,27 t)"],
      ["FIDE", "Récord humano de Elo: 2.882 (Carlsen, 2014)"],
      ["Armstrong (FHI) y otros", "Estiman su acierto en torno al 42-46%, no el 86%"],
      ["Nota", "Las fechas son predicciones de un autor, no consenso científico"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 29, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
