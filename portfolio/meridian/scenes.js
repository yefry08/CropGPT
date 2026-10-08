// «Ciento veinte días»: scenes (inserted into the paper-collage engine by build.py)
// Rules kept throughout: no face of any real person is drawn (the three co-leads are name cards on
// empty chairs), no real logo or official seal is reproduced, and the film never says the study
// gives anyone control of the Pentagon — it is an advisory report written by MITRE.
const DEF = [];

// ---------- props ----------
function stamp(g, cx, cy, txt, rot, col, size) {
  const k = E("g", {}, g), s = size || 40, w = textW(txt, s, SANS, false) + 56;
  const b = E("g", { transform: `rotate(${rot} ${cx} ${cy})` }, k);
  E("rect", { x: cx - w / 2, y: cy - s, width: w, height: s * 2, rx: 8, fill: "none", stroke: col, "stroke-width": 7 }, b);
  T(b, txt, cx, cy + s * .35, { s, a: "middle", c: col });
  return k;
}

// a sheet with ruled lines
function sheet(g, x, y, w, h, seed, o = {}) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: o.fill || "#FFFDF5" });
  const n = o.lines == null ? 7 : o.lines;
  for (let i = 0; i < n; i++)
    E("rect", { x: x + 36, y: y + (o.top || 92) + i * ((h - (o.top || 92) - 40) / n), width: (w - 72) * (i % 3 === 2 ? .62 : .94), height: 12, rx: 3, fill: o.ink || "#CFC8B8" }, k);
  return k;
}

// an empty chair, seen from the front: a seat for someone this film does not draw
function chair(g, cx, cy, s, col) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-58 8 L-66 104 M58 8 L66 104", ...stroke(col, 15) }, k);
  E("rect", { x: -62, y: -132, width: 124, height: 84, rx: 12, fill: col, stroke: "#fff", "stroke-width": 7 }, k);
  E("rect", { x: -48, y: -112, width: 96, height: 14, rx: 7, fill: "rgba(255,255,255,.4)" }, k);
  E("path", { d: "M-44 -48 L-44 -14 M44 -48 L44 -14", ...stroke(col, 12) }, k);
  E("rect", { x: -72, y: -18, width: 144, height: 28, rx: 10, fill: col, stroke: "#fff", "stroke-width": 7 }, k);
  return k;
}

// a signature on a dotted line
function signLine(g, x, y, w, col) {
  const k = E("g", {}, g);
  E("path", { d: `M${x} ${y} L${x + w} ${y}`, ...stroke("#9A9484", 4), "stroke-dasharray": "10 10" }, k);
  const sg = drawable(E("path", { d: `M${x + 14} ${y - 6} q22 -34 36 -4 q10 22 24 -10 q14 -30 30 2 q8 20 26 -12 q10 -18 22 4`, ...stroke(col || INK, 6) }, k));
  return { k, sg };
}

// a small rocket, nose up
function rocket(g, cx, cy, s, col) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M0 -120 C26 -86 36 -30 36 26 L36 70 L-36 70 L-36 26 C-36 -30 -26 -86 0 -120 Z", fill: col || "#E7E2D6", stroke: "#6E6758", "stroke-width": 6 }, k);
  E("path", { d: "M-36 24 L-76 92 L-36 70 Z M36 24 L76 92 L36 70 Z", fill: "#C9C2B0", stroke: "#6E6758", "stroke-width": 5 }, k);
  E("circle", { cx: 0, cy: -34, r: 15, fill: "#4C86C6", stroke: "#6E6758", "stroke-width": 5 }, k);
  E("path", { d: "M-18 70 L0 128 L18 70 Z", fill: "#FFD23F" }, k);
  return k;
}

// a fixed-wing autonomous drone seen from above
function drone(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M0 -74 C14 -52 18 -20 18 14 L18 56 L-18 56 L-18 14 C-18 -20 -14 -52 0 -74 Z", fill: "#D8D2C4", stroke: "#6E6758", "stroke-width": 6 }, k);
  E("path", { d: "M-16 -6 L-104 26 L-104 44 L-16 24 Z M16 -6 L104 26 L104 44 L16 24 Z", fill: "#C9C2B0", stroke: "#6E6758", "stroke-width": 5 }, k);
  E("path", { d: "M-14 48 L-48 70 L-48 82 L-14 70 Z M14 48 L48 70 L48 82 L14 70 Z", fill: "#C9C2B0", stroke: "#6E6758", "stroke-width": 5 }, k);
  E("circle", { cx: 0, cy: -46, r: 11, fill: RED, stroke: "#6E6758", "stroke-width": 4 }, k);
  return k;
}

// =====================================================================
// 1 — qué es, exactamente
DEF.push({ bg: "#1B2A3D", tr: "left",
  strip: { color: "#FFD23F", word: "120 días", wordColor: INK, cx: 540, cy: 590, size: 230, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "UN ESTUDIO", x: 96, y: 1392, r: -4 },
  cap: ["El 30 de septiembre el Pentágono anunció el Proyecto Meridian: un estudio",
        "de 120 días sobre cómo será la guerra. El informe se espera para finales de enero."],
  build(S) {
    const g = S.sub;
    const memo = E("g", {}, g);
    sheet(memo, 90, 850, 480, 420, 4011, { top: 120 });
    E("rect", { x: 128, y: 886, width: pixW("MEMORANDO", 4) + 22, height: 46, fill: INK }, memo);
    pix(memo, "MEMORANDO", 139, 899, 4, "#fff");
    T(memo, "Proyecto Meridian", 330, 996, { f: SERIF, s: 40, i: 1, a: "middle" });
    S.piece(memo, { at: .5, from: "left", dist: 450, r: -1.5 });
    const d1 = E("g", {}, g);
    paper(d1, 640, 860, 340, 170, { seed: 4021, fill: "#FFFDF5" });
    pix(d1, "30 SEP 2026", 810, 902, 4, INK, "middle");
    T(d1, "se anuncia", 810, 992, { f: SERIF, s: 34, i: 1, a: "middle", c: "#555" });
    S.piece(d1, { at: 1.6, from: "right", dist: 380, r: 1.2 });
    const d2 = E("g", {}, g);
    paper(d2, 640, 1090, 340, 170, { seed: 4031, fill: "#FFD23F" });
    pix(d2, "ENE 2027", 810, 1132, 4, INK, "middle");
    T(d2, "se publica", 810, 1222, { f: SERIF, s: 34, i: 1, a: "middle", c: RED });
    S.piece(d2, { at: 3.0, from: "right", dist: 380, r: -1.2 });
    const bt = E("g", {}, g);
    paper(bt, 100, 1300, 860, 110, { seed: 4041, fill: INK });
    T(bt, "no es una toma de control: es un informe", 530, 1374, { f: SERIF, s: 38, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bt, { at: 4.2, from: "bottom", dist: 240, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4001 });
    T(cl, "ciento veinte días", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "para un solo informe", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const ar = harrow(g, 900, 1046, 880, 1076, { c: RED, w: 8, bend: .9 });
    return (t) => ar.set(seg(t, 2.6, 3.2));
  } });

// 2 — los tres nombres
DEF.push({ bg: "#5E1540", tr: "right",
  strip: { color: "#FFFDF5", word: "Tres", wordColor: INK, cx: 540, cy: 590, size: 290, wx: -30, maxW: 880, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "LOS COLÍDERES", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Lo colideran Elon Musk, Palmer Luckey y Newt Gingrich.",
        "Ninguno de los tres ha servido en el ejército estadounidense."],
  build(S) {
    const g = S.sub;
    const names = [["ELON MUSK", 190, "#1B4FA0"], ["PALMER LUCKEY", 540, "#2E7D4F"], ["NEWT GINGRICH", 890, "#B35A1F"]];
    names.forEach(([n, x, c], i) => {
      const k = E("g", {}, g);
      chair(k, x, 1080, .82, c);
      const card = E("g", {}, k);
      paper(card, x - 145, 1140, 290, 110, { seed: 4111 + i, fill: "#FFFDF5" });
      const px = pixW(n, 3) > 250 ? 2 : 3;
      pix(card, n, x, 1188, px, INK, "middle");
      S.piece(k, { at: .7 + i * .5, from: "bottom", dist: 340, r: -1 + i * .9 });
    });
    const bt = E("g", {}, g);
    paper(bt, 130, 1290, 820, 110, { seed: 4121, fill: INK });
    T(bt, "ninguno ha servido en el ejército", 540, 1364, { f: SERIF, s: 40, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bt, { at: 3.0, from: "bottom", dist: 250, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4101 });
    T(cl, "tres sillas, tres nombres", 540, 272, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "y cero uniformes", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 3 — lo que el encargo no es
DEF.push({ bg: "#13402E", tr: "left",
  strip: { color: "#FFD23F", word: "No manda", wordColor: INK, cx: 540, cy: 592, size: 230, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "LO ESCRIBE MITRE", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["No va a escribir estrategias ni políticas: solo señalar qué dominios hay que ganar.",
        "El análisis lo redacta MITRE, un centro de investigación con fondos públicos."],
  build(S) {
    const g = S.sub;
    const no = E("g", {}, g);
    sheet(no, 80, 850, 440, 400, 4211, { top: 110, lines: 6 });
    E("rect", { x: 118, y: 884, width: pixW("ESTRATEGIA", 4) + 22, height: 46, fill: INK }, no);
    pix(no, "ESTRATEGIA", 129, 897, 4, "#fff");
    const xd = drawable(E("path", { d: "M110 880 L500 1230 M500 880 L110 1230", ...stroke(RED, 11) }, no));
    S.piece(no, { at: .5, from: "left", dist: 440, r: -1.5 });
    const yes = E("g", {}, g);
    paper(yes, 580, 850, 400, 400, { seed: 4221, fill: "#FFD23F" });
    pix(yes, "SÍ HACE", 780, 892, 4, INK, "middle");
    T(yes, "señalar qué", 780, 1000, { f: SERIF, s: 38, i: 1, a: "middle" });
    T(yes, "dominios ganar", 780, 1052, { f: SERIF, s: 38, i: 1, a: "middle" });
    T(yes, "y qué capacidades", 780, 1120, { f: SERIF, s: 34, i: 1, a: "middle", c: "#7A3214" });
    T(yes, "hay que dominar", 780, 1166, { f: SERIF, s: 34, i: 1, a: "middle", c: "#7A3214" });
    S.piece(yes, { at: 2.0, from: "right", dist: 400, r: 1.2 });
    const mt = E("g", {}, g);
    paper(mt, 190, 1290, 700, 110, { seed: 4231, fill: INK });
    T(mt, "y el informe lo redacta MITRE", 540, 1364, { f: SERIF, s: 40, i: 1, a: "middle", c: "#CFF75A" });
    S.piece(mt, { at: 3.6, from: "bottom", dist: 250, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4201 });
    T(cl, "no escriben la política:", 540, 272, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "escriben la lista", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => xd.set(seg(t, 1.0, 1.9));
  } });

// 4 — del subsuelo a la Luna
DEF.push({ bg: "#141A33", tr: "right",
  strip: { color: "#CFF75A", word: "Hasta la Luna", wordColor: INK, cx: 540, cy: 585, size: 185, wx: -30, maxW: 960, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 660 },
  label: { text: "EL ALCANCE", x: 96, y: 1392, r: -4 },
  cap: ["El encargo va del subsuelo al espacio entre la Tierra y la Luna, y nombra",
        "inteligencia artificial, autonomía, energía dirigida, robótica y biotecnología."],
  build(S) {
    const g = S.sub;
    const col = E("g", {}, g);
    E("path", { d: torn(70, 840, 420, 560, 4311, 8, 24), fill: "url(#gPaper)" }, col);
    // the stack: underground, surface, orbit, the Moon
    E("rect", { x: 110, y: 1290, width: 340, height: 70, rx: 4, fill: "#6E5A3A" }, col);
    T(col, "subsuelo", 280, 1336, { s: 28, a: "middle", c: "#fff" });
    E("rect", { x: 110, y: 1190, width: 340, height: 70, rx: 4, fill: "#2E7D4F" }, col);
    T(col, "superficie", 280, 1236, { s: 28, a: "middle", c: "#fff" });
    E("rect", { x: 110, y: 1090, width: 340, height: 70, rx: 4, fill: "#1B4FA0" }, col);
    T(col, "órbita", 280, 1136, { s: 28, a: "middle", c: "#fff" });
    E("circle", { cx: 280, cy: 952, r: 62, fill: "#E7E2D6", stroke: "#8C8575", "stroke-width": 6 }, col);
    for (const [dx, dy, r] of [[-20, -16, 13], [18, 10, 17], [-6, 26, 9]])
      E("circle", { cx: 280 + dx, cy: 952 + dy, r, fill: "#C9C2B0" }, col);
    T(col, "la Luna", 280, 1056, { f: SERIF, s: 32, i: 1, a: "middle" });
    S.piece(col, { at: .5, from: "left", dist: 440, r: -1.5 });
    const tags = ["INTELIGENCIA ARTIFICIAL", "AUTONOMÍA", "ENERGÍA DIRIGIDA", "ROBÓTICA", "BIOTECNOLOGÍA"].map((tx, i) => {
      const k = E("g", {}, g), y = 880 + i * 102, px = pixW(tx, 3) > 400 ? 2 : 3;
      paper(k, 540, y, 440, 80, { seed: 4321 + i, fill: i % 2 ? "#FFFDF5" : "#CFF75A" });
      pix(k, tx, 760, y + 32, px, INK, "middle");
      S.piece(k, { at: 1.4 + i * .42, from: "right", dist: 360, r: -.8 + i * .4 });
      return k; });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4301 });
    T(cl, "el encargo no deja", 540, 272, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "ningún sitio fuera", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 5 — lo de los videojuegos ya pasó, y no fue secreto
DEF.push({ bg: "#7A3214", tr: "left",
  strip: { color: "#FFFDF5", word: "2012", wordColor: INK, cx: 540, cy: 588, size: 285, wx: -30, maxW: 880, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "NI SECRETO NI NUEVO", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["Lo de los videojuegos no es secreto ni nuevo: el FBI licenció Unreal Engine en 2012",
        "para entrenar escenas del crimen, y hoy Lockheed construye su simulador con ese motor."],
  build(S) {
    const g = S.sub;
    // a CRT showing a wireframe room
    const mon = E("g", {}, g);
    paper(mon, 80, 850, 480, 400, { seed: 4411, fill: "#15191F" });
    E("rect", { x: 112, y: 882, width: 416, height: 300, rx: 8, fill: "#10202A" }, mon);
    const grid = E("g", {}, mon);
    for (let i = 0; i <= 8; i++) {
      E("path", { d: `M${132 + i * 48} 1150 L${260 + i * 12} 952`, ...stroke("#3FA7A0", 3), opacity: .8 }, grid);
      E("path", { d: `M132 ${1150 - i * 22} L508 ${1150 - i * 22}`, ...stroke("#3FA7A0", 3), opacity: .5 }, grid);
    }
    E("rect", { x: 300, y: 1012, width: 90, height: 120, rx: 4, fill: "none", stroke: "#FFD23F", "stroke-width": 5 }, mon);
    pix(mon, "ESCENA DEL CRIMEN", 320, 1208, 2, "#CFC8B8");
    S.piece(mon, { at: .5, from: "left", dist: 440, r: -1.5 });
    const cards = [["FBI, 2012", "licenció el motor", "#FFFDF5", 880], ["LOCKHEED, HOY", "simulador militar", "#FFD23F", 1060]].map(([a, b, c, y], i) => {
      const k = E("g", {}, g);
      paper(k, 620, y, 360, 150, { seed: 4421 + i, fill: c });
      const px = pixW(a, 4) > 300 ? 3 : 4;
      pix(k, a, 800, y + 38, px, INK, "middle");
      T(k, b, 800, y + 118, { f: SERIF, s: 32, i: 1, a: "middle", c: "#555" });
      S.piece(k, { at: 1.8 + i * .7, from: "right", dist: 380, r: -1 + i * 2 });
      return k; });
    const bt = E("g", {}, g);
    paper(bt, 150, 1290, 780, 110, { seed: 4431, fill: INK });
    T(bt, "se anunció en rueda de prensa", 540, 1364, { f: SERIF, s: 40, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bt, { at: 3.8, from: "bottom", dist: 250, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4401 });
    T(cl, "el motor de videojuegos", 540, 272, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "lleva ahí catorce años", 540, 348, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 6 — quiénes son, en realidad
DEF.push({ bg: "#0E2F3A", tr: "right",
  strip: { color: "#FFD23F", word: "Los dos", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -50, maxW: 930, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "PROVEEDORES", x: 96, y: 1392, r: -4 },
  cap: ["Musk dirige SpaceX, que se llevó 5 de los 7 lanzamientos de seguridad nacional del año.",
        "Luckey cofundó Anduril, que hace los sistemas autónomos. Y ahora señalan qué comprar."],
  build(S) {
    const g = S.sub;
    const a = E("g", {}, g);
    paper(a, 70, 850, 420, 330, { seed: 4511, fill: "#FFFDF5" });
    rocket(a, 190, 1020, .72);
    T(a, "5 de 7", 360, 1000, { f: SERIF, s: 56, i: 1, a: "middle", c: RED });
    T(a, "lanzamientos", 360, 1048, { s: 24, a: "middle", c: "#555" });
    T(a, "de seguridad", 360, 1082, { s: 24, a: "middle", c: "#555" });
    T(a, "nacional", 360, 1116, { s: 24, a: "middle", c: "#555" });
    S.piece(a, { at: .5, from: "left", dist: 440, r: -1.5 });
    const b = E("g", {}, g);
    paper(b, 580, 850, 400, 330, { seed: 4521, fill: "#FFFDF5" });
    drone(b, 690, 1010, .62);
    T(b, "sistemas", 860, 1012, { f: SERIF, s: 34, i: 1, a: "middle" });
    T(b, "autónomos", 860, 1058, { f: SERIF, s: 34, i: 1, a: "middle", c: RED });
    S.piece(b, { at: 1.6, from: "right", dist: 400, r: 1.2 });
    const li = E("g", {}, g);
    paper(li, 180, 1230, 720, 180, { seed: 4531, fill: "#FFD23F" });
    pix(li, "QUÉ HAY QUE COMPRAR", 540, 1272, 4, INK, "middle");
    for (let i = 0; i < 3; i++) E("rect", { x: 250 + i * 190, y: 1330, width: 150, height: 14, rx: 4, fill: "#8C6A10" }, li);
    S.piece(li, { at: 3.2, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4501 });
    T(cl, "los que venden", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "escriben la lista", 540, 348, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const ar1 = harrow(g, 290, 1196, 420, 1236, { c: RED, w: 8, bend: -.25 });
    const ar2 = harrow(g, 790, 1196, 660, 1236, { c: RED, w: 8, bend: .25 });
    return (t) => { ar1.set(seg(t, 3.9, 4.5)); ar2.set(seg(t, 4.1, 4.7)); };
  } });

// 7 — el contrato de días después
DEF.push({ bg: "#8C1A2B", tr: "left",
  strip: { color: "#FFD23F", word: "2.900 M", wordColor: INK, cx: 540, cy: 592, size: 230, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "DÍAS DESPUÉS", x: 96, y: 1392, r: -4 },
  cap: ["Días después del nombramiento, Anduril ganó un contrato naval de hasta 2.900 millones.",
        "«Aquí no hay nada que ver», dijo el Pentágono. El Congreso dijo que lo va a mirar."],
  build(S) {
    const g = S.sub;
    const ct = E("g", {}, g);
    sheet(ct, 90, 850, 470, 400, 4611, { top: 116, lines: 4 });
    E("rect", { x: 128, y: 886, width: pixW("CONTRATO NAVAL", 3) + 20, height: 40, fill: INK }, ct);
    pix(ct, "CONTRATO NAVAL", 138, 897, 3, "#fff");
    const num = T(ct, "", 325, 1120, { f: SERIF, s: 62, i: 1, a: "middle", c: RED });
    T(ct, "hasta", 325, 1176, { s: 26, a: "middle", c: "#555" });
    const sg = signLine(ct, 150, 1222, 350, INK);
    S.piece(ct, { at: .5, from: "left", dist: 450, r: -1.5 });
    const q1 = E("g", {}, g);
    paper(q1, 620, 860, 360, 170, { seed: 4621, fill: "#FFFDF5" });
    T(q1, "«aquí no hay", 800, 930, { f: SERIF, s: 36, i: 1, a: "middle" });
    T(q1, "nada que ver»", 800, 976, { f: SERIF, s: 36, i: 1, a: "middle" });
    T(q1, "el Pentágono", 800, 1016, { s: 24, a: "middle", c: "#777" });
    S.piece(q1, { at: 2.6, from: "right", dist: 380, r: 1.2 });
    const q2 = E("g", {}, g);
    paper(q2, 620, 1080, 360, 170, { seed: 4631, fill: INK });
    T(q2, "«lo vamos", 800, 1150, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFD23F" });
    T(q2, "a mirar»", 800, 1196, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFD23F" });
    T(q2, "el Congreso", 800, 1236, { s: 24, a: "middle", c: "#CFC8B8" });
    S.piece(q2, { at: 3.8, from: "right", dist: 380, r: -1.2 });
    const bt = E("g", {}, g);
    paper(bt, 130, 1264, 480, 100, { seed: 4641, fill: "#FFD23F" });
    T(bt, "nadie ha probado nada", 370, 1328, { f: SERIF, s: 34, i: 1, a: "middle" });
    S.piece(bt, { at: 4.8, from: "bottom", dist: 240, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 4601 });
    T(cl, "el nombramiento y el", 540, 272, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "contrato, la misma semana", 540, 348, { f: SERIF, s: 40, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q = eo(seg(t, .9, 2.4));
      num.textContent = q > .02 ? fmt(2900 * q) + " M $" : "";
      sg.sg.set(seg(t, 2.0, 3.0));
    };
  } });

// 8 — lo que de verdad decide
DEF.push({ bg: "#26384F", tr: "right",
  strip: { color: "#FFFDF5", word: "Los contratos", wordColor: INK, cx: 540, cy: 585, size: 185, wx: -30, maxW: 960, from: 1 },
  sub: { x: 30, y: 780, w: 1020, h: 660 },
  label: { text: "LO QUE FIRMA", x: 96, y: 1392, r: -4 },
  cap: ["Anduril todavía no es el mayor proveedor: 4.300 millones frente a 26.800 de Lockheed.",
        "Un informe no cambia la ley; los contratos sí, y esos ya se están firmando."],
  build(S) {
    const g = S.sub;
    const ch = E("g", {}, g);
    E("path", { d: torn(70, 840, 470, 480, 4711, 8, 24), fill: "url(#gPaper)" }, ch);
    pix(ch, "MILLONES DE DÓLARES", 112, 876, 3, INK);
    E("path", { d: "M120 1270 L500 1270", ...stroke(INK, 6) }, ch);
    const b1 = E("rect", { x: 170, y: 1270, width: 100, height: 0, fill: RED }, ch);
    const b2 = E("rect", { x: 350, y: 1270, width: 100, height: 0, fill: "#9A9484" }, ch);
    T(ch, "Anduril", 220, 1308, { s: 25, a: "middle", c: "#555" });
    T(ch, "Lockheed", 400, 1308, { s: 25, a: "middle", c: "#555" });
    const n1 = T(ch, "", 220, 1250, { f: SERIF, s: 30, i: 1, a: "middle", c: RED });
    const n2 = T(ch, "", 400, 1250, { f: SERIF, s: 30, i: 1, a: "middle" });
    S.piece(ch, { at: .5, from: "left", dist: 450, r: -1.5 });
    const rp = E("g", {}, g);
    paper(rp, 600, 850, 390, 220, { seed: 4721, fill: "#FFFDF5" });
    pix(rp, "EL INFORME", 795, 892, 4, INK, "middle");
    T(rp, "no cambia la ley", 795, 1000, { f: SERIF, s: 34, i: 1, a: "middle", c: "#555" });
    S.piece(rp, { at: 2.0, from: "right", dist: 400, r: 1.2 });
    const cn = E("g", {}, g);
    paper(cn, 600, 1110, 390, 230, { seed: 4731, fill: "#FFD23F" });
    pix(cn, "LOS CONTRATOS", 795, 1152, 4, INK, "middle");
    T(cn, "sí, y ya se firman", 795, 1240, { f: SERIF, s: 32, i: 1, a: "middle" });
    const sg = signLine(cn, 650, 1300, 290, INK);
    S.piece(cn, { at: 3.2, from: "right", dist: 400, r: -1.2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4701 });
    T(cl, "en enero llega", 540, 268, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "el informe; el dinero", 540, 332, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "ya se movió", 540, 396, { f: SERIF, s: 48, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q1 = eo(seg(t, .9, 2.0)), q2 = eo(seg(t, 1.5, 2.8));
      b1.setAttribute("height", (q1 * 51).toFixed(1)); b1.setAttribute("y", (1270 - q1 * 51).toFixed(1));
      b2.setAttribute("height", (q2 * 318).toFixed(1)); b2.setAttribute("y", (1270 - q2 * 318).toFixed(1));
      n1.textContent = q1 > .02 ? fmt(4300 * q1) : ""; n1.setAttribute("y", (1260 - q1 * 51).toFixed(1));
      n2.textContent = q2 > .02 ? fmt(26800 * q2) : ""; n2.setAttribute("y", (1260 - q2 * 318).toFixed(1));
      sg.sg.set(seg(t, 4.2, 5.2));
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
    E("path", { d: torn(70, 545, 940, 1060, 4831, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["El anuncio", "30 de septiembre de 2026, en la base de Quantico; estudio de 120 días"],
      ["Los colíderes", "Elon Musk, Palmer Luckey y Newt Gingrich; ninguno sirvió en el ejército"],
      ["Quién lo redacta", "MITRE, por encargo del jefe de tecnología del Pentágono"],
      ["El encargo", "Del subsuelo al espacio cislunar: IA, autonomía, energía dirigida, robótica, biotecnología"],
      ["El motor de videojuegos", "El FBI licenció Unreal Engine en 2012, en público; Lockheed lo usa hoy en su simulador"],
      ["Lanzamientos", "SpaceX se llevó 5 de las 7 misiones de seguridad nacional del año fiscal 2026"],
      ["El contrato", "Hasta 2.900 M $ de la Marina, días después del nombramiento (6 de octubre de 2026)"],
      ["El tamaño", "Anduril proyecta 4.300 M $ en 2026; Lockheed, 26.800 M $ solo en aeronáutica"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 28, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 23, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 170);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona", 540, 1686, { s: 28, w: 600, c: "#ddd", a: "middle" });
    T(fl, "ni se reproduce ningún logotipo o sello oficial.", 540, 1732, { s: 28, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
