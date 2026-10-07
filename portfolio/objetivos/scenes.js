// «El cuello de botella era el humano»: scenes (inserted into the paper-collage engine by build.py)
// Everything the sources describe is attributed on screen; the army's denial has its own scene (7).
// Destroyed buildings are drawn; people are not — no bodies, no wounded, no figures of any side.
const DEF = [];

// ---------- props ----------
function building(g, x, y, w, h, o = {}) {
  const k = E("g", {}, g), wall = o.wall || "#D8D2C4", dark = o.dark || "#8C8575";
  E("rect", { x, y, width: w, height: h, rx: 4, fill: wall, stroke: dark, "stroke-width": 6 }, k);
  const cols = Math.max(2, Math.floor(w / 62)), rows = Math.max(2, Math.floor(h / 70));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    E("rect", { x: x + 18 + c * (w - 26) / cols, y: y + 20 + r * (h - 28) / rows, width: (w - 26) / cols - 16, height: (h - 28) / rows - 20, rx: 3, fill: o.win || "#5E6B78" }, k);
  return k;
}

// a collapsed building: tilted slabs, snapped columns, rebar and dust — no people
function ruin(g, cx, cy, s, seed) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g), r = rng(seed || 5);
  const dust = E("g", {}, k);
  for (let i = 0; i < 5; i++) E("ellipse", { cx: -180 + i * 95, cy: -30 - r() * 70, rx: 120 + r() * 60, ry: 26 + r() * 14, fill: "#D8D2C4", opacity: .09 }, dust);
  E("path", { d: "M-250 120 L250 120 L230 170 L-230 170 Z", fill: "#9A8F7C" }, k);
  // standing stump of the facade
  E("path", { d: "M-230 120 L-230 -140 L-120 -150 L-110 120 Z", fill: "#D8D2C4", stroke: "#8C8575", "stroke-width": 6 }, k);
  for (let i = 0; i < 3; i++) E("rect", { x: -206, y: -120 + i * 76, width: 50, height: 52, rx: 3, fill: "#4A5560" }, k);
  // tilted floor slabs
  const slabs = [[-120, 40, 230, 34, -8], [-60, -30, 200, 30, 12], [20, 50, 220, 32, 6], [60, -10, 180, 28, -14]];
  slabs.forEach(([x, y, w, h, rot], i) => {
    const sg = E("g", { transform: `rotate(${rot} ${x + w / 2} ${y + h / 2})` }, k);
    E("rect", { x, y, width: w, height: h, rx: 4, fill: i % 2 ? "#C9C2B0" : "#D8D2C4", stroke: "#8C8575", "stroke-width": 5 }, sg);
    for (let j = 0; j < 4; j++) E("path", { d: `M${x + 20 + j * (w / 4)} ${y} q6 -22 -4 -36`, ...stroke("#6E6758", 4) }, sg);
  });
  // rubble heap
  for (let i = 0; i < 26; i++) {
    const bx = -200 + r() * 420, by = 60 + r() * 60, sz = 12 + r() * 26;
    E("rect", { x: bx, y: by, width: sz, height: sz * .72, rx: 3, fill: ["#C9C2B0", "#B5AE9C", "#D8D2C4"][Math.floor(r() * 3)], stroke: "#8C8575", "stroke-width": 3, transform: `rotate(${(r() * 60 - 30).toFixed(1)} ${bx + sz / 2} ${by + sz / 2})` }, k);
  }
  // bent rebar
  for (let i = 0; i < 5; i++) E("path", { d: `M${-140 + i * 70} 60 q${10 + r() * 20} -40 ${-6 + r() * 30} -70`, ...stroke("#6E6758", 4) }, k);
  return k;
}

function screenCard(g, x, y, w, h, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#15191F" });
  E("rect", { x: x + 18, y: y + 18, width: w - 36, height: 44, rx: 6, fill: "#232A33" }, k);
  return k;
}

function bombShape(g, cx, cy, s, guided) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M0 -120 C34 -96 44 -40 44 20 L44 80 L-44 80 L-44 20 C-44 -40 -34 -96 0 -120 Z", fill: "#6E7884", stroke: "#3A424C", "stroke-width": 6 }, k);
  E("path", { d: "M-44 80 L-74 130 L-30 110 Z M44 80 L74 130 L30 110 Z M-16 80 L-16 136 L16 136 L16 80 Z", fill: "#55606C", stroke: "#3A424C", "stroke-width": 5 }, k);
  if (guided) { E("circle", { cx: 0, cy: -70, r: 16, fill: "#CFF75A", stroke: "#3A424C", "stroke-width": 5 }, k);
    for (let i = 0; i < 2; i++) E("path", { d: `M${-40 - i * 16} -84 q${20 + i * 10} -22 ${40 + i * 20} 0`, ...stroke("#CFF75A", 4), opacity: .7 }, k); }
  return k;
}

function scaleBeam(g, cx, cy, w) {
  const k = E("g", {}, g);
  E("path", { d: `M${cx} ${cy + 150} L${cx} ${cy - 20}`, ...stroke("#8C8575", 12) }, k);
  E("path", { d: `M${cx - 40} ${cy + 150} L${cx + 40} ${cy + 150}`, ...stroke("#8C8575", 14) }, k);
  const beam = E("g", {}, k);
  E("path", { d: `M${cx - w / 2} ${cy - 20} L${cx + w / 2} ${cy - 20}`, ...stroke("#8C8575", 12) }, beam);
  for (const sx of [-1, 1]) {
    E("path", { d: `M${cx + sx * w / 2} ${cy - 20} L${cx + sx * w / 2} ${cy + 40}`, ...stroke("#8C8575", 5) }, beam);
    E("path", { d: `M${cx + sx * w / 2 - 70} ${cy + 40} L${cx + sx * w / 2 + 70} ${cy + 40} L${cx + sx * w / 2 + 56} ${cy + 78} L${cx + sx * w / 2 - 56} ${cy + 78} Z`, fill: "#C9C2B0", stroke: "#8C8575", "stroke-width": 5 }, beam);
  }
  return { k, beam };
}

// =====================================================================
// 1 — el libro de 2021
DEF.push({ bg: "#13213A", tr: "left",
  strip: { color: "#FFFDF5", word: "El cuello", wordColor: INK, cx: 540, cy: 590, size: 240, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "UN LIBRO, 2021", x: 96, y: 1392, r: -4 },
  cap: ["En 2021, un jefe de inteligencia israelí publicó un libro en el que el obstáculo", "para hacer la guerra era el ser humano: no damos abasto generando objetivos."],
  build(S) {
    const g = S.sub;
    const bk = E("g", {}, g);
    paper(bk, 80, 870, 420, 460, { seed: 1011, fill: "#E7E2D6" });
    E("path", { d: "M290 880 L290 1320", ...stroke("#C9C2B0", 6) }, bk);
    T(bk, "The", 190, 980, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(bk, "Human-", 190, 1034, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(bk, "Machine", 190, 1088, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(bk, "Team", 190, 1142, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    pix(bk, "BRIG. GEN. Y.S.", 190, 1230, 3, "#666", "middle");
    const fn = E("g", {}, g);
    E("path", { d: "M620 880 L980 880 L830 1090 L830 1230 L770 1230 L770 1090 Z", fill: "none", stroke: "#FFFDF5", "stroke-width": 9 }, fn);
    const dots = [];
    for (let i = 0; i < 14; i++) dots.push(E("circle", { r: 13, fill: "#FFD23F" }, fn));
    const jam = E("g", {}, g);
    paper(jam, 640, 1250, 340, 120, { seed: 1021, fill: INK });
    T(jam, "«cuello de botella»", 810, 1322, { f: SERIF, s: 38, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bk, { at: .5, from: "left", dist: 460, r: -2 });
    S.piece(fn, { at: 1.4, from: "top", dist: 340, r: 1 });
    S.piece(jam, { at: 3.0, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1001 });
    T(cl, "el estorbo, escribió,", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "éramos nosotros", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => dots.forEach((d, i) => {
      const f = ((t * .35 + i * .071) % 1), y = 890 + f * 300;
      const squeeze = clamp((y - 980) / 110);
      d.setAttribute("cx", (800 + (1 - squeeze) * Math.sin(i * 2.3) * 150).toFixed(1));
      d.setAttribute("cy", y.toFixed(1));
      d.setAttribute("opacity", t > .9 ? .9 : 0);
    });
  } });

// 2 — 37.000
DEF.push({ bg: "#7E1A2B", tr: "right",
  strip: { color: "#FFD23F", word: "37.000", wordColor: INK, cx: 540, cy: 600, size: 270, wx: -110, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "SEIS FUENTES", x: 96, y: 1392, r: -4 },
  cap: ["Seis oficiales contaron a dos medios israelíes que un sistema puntuaba", "a casi todos los habitantes de Gaza, y llegó a marcar 37.000 personas."],
  build(S) {
    const g = S.sub;
    const sc = screenCard(g, 70, 850, 640, 470, 1111);
    pix(sc, "PUNTUACIÓN 1-100", 390, 884, 4, "#9AA3AE", "middle");
    const cells = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 10; c++) {
      const i = r * 10 + c, hot = [13, 24, 35, 46, 57, 61, 9].includes(i);
      const k = E("g", {}, sc);
      E("rect", { x: 110 + c * 56, y: 940 + r * 52, width: 46, height: 42, rx: 5, fill: hot ? "#7A1F1F" : "#232A33" }, k);
      pix(k, String(hot ? 90 + (i % 9) : 10 + (i * 7) % 60), 133 + c * 56, 952 + r * 52, 2, hot ? "#FF6B5A" : "#4A5560", "middle");
      cells.push({ k, hot });
    }
    const card = E("g", {}, g);
    paper(card, 740, 940, 270, 300, { seed: 1121, fill: "#FFFDF5" });
    const n = T(card, "0", 875, 1080, { s: 84, a: "middle", w: 900, c: RED });
    pix(card, "MARCADOS", 875, 1120, 3, INK, "middle");
    pix(card, "SEGÚN LAS FUENTES", 875, 1170, 3, "#888", "middle");
    S.piece(sc, { at: .5, from: "left", dist: 540, r: -2 });
    S.piece(card, { at: 2.6, from: "right", dist: 400, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1101 });
    T(cl, "no era una lista:", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "era toda la población", 540, 352, { f: SERIF, s: 48, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cells.forEach((c, i) => c.k.style.opacity = seg(t, .9 + (i % 10) * .04, 1.2 + (i % 10) * .04).toFixed(2));
      n.textContent = fmt(Math.round(lerp(0, 37000, eo(seg(t, 3.0, 4.2)))));
    };
  } });

// 3 — veinte segundos
DEF.push({ bg: "#C08A12", tr: "left",
  strip: { color: "#FFFDF5", word: "20 segundos", wordColor: INK, cx: 540, cy: 600, size: 200, wx: 0, maxW: 960, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "¿ES UN HOMBRE?", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Según ellos, la comprobación humana duraba unos 20 segundos y consistía en confirmar", "que el marcado fuera un hombre, sabiendo que el sistema fallaba en torno al 10%."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 80, 860, 600, 440, { seed: 1211, fill: "#FFFDF5" });
    pix(card, "ÚNICA COMPROBACIÓN", 380, 906, 4, "#666", "middle");
    E("rect", { x: 150, y: 1000, width: 76, height: 76, rx: 10, fill: "#FFFDF5", stroke: INK, "stroke-width": 6 }, card);
    const tick = drawable(E("path", { d: "M166 1038 l20 22 l34 -44", ...stroke("#1E9E5A", 10) }, card));
    T(card, "¿es un hombre?", 260, 1058, { f: SERIF, s: 50, i: 1 });
    E("rect", { x: 150, y: 1120, width: 76, height: 76, rx: 10, fill: "#EFEADF", stroke: "#C9C2B4", "stroke-width": 6 }, card);
    T(card, "¿por qué lo marcó?", 260, 1178, { f: SERIF, s: 44, i: 1, c: "#999" });
    const wt = E("g", {}, g);
    paper(wt, 730, 890, 280, 280, { seed: 1221, fill: INK });
    const nt = T(wt, "0 s", 870, 1040, { s: 76, a: "middle", w: 900, c: "#FFD23F" });
    pix(wt, "POR OBJETIVO", 870, 1090, 3, "#fff", "middle");
    const err = E("g", {}, g);
    paper(err, 730, 1210, 280, 150, { seed: 1231, fill: "#FFFDF5" });
    T(err, "10%", 870, 1300, { s: 62, a: "middle", w: 900, c: RED });
    pix(err, "DE ERROR ASUMIDO", 870, 1330, 3, "#666", "middle");
    S.piece(card, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(wt, { at: 1.8, from: "right", dist: 380, r: 1 });
    S.piece(err, { at: 3.0, from: "right", dist: 380, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1201 });
    T(cl, "el humano quedó", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "como un sello de goma", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      tick.set(seg(t, 1.2, 1.6));
      nt.textContent = Math.round(lerp(0, 20, eo(seg(t, 2.2, 3.0)))) + " s";
    };
  } });

// 4 — al entrar en casa
DEF.push({ bg: "#3A2A4E", tr: "right",
  strip: { color: "#FFD23F", word: "De noche", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "AL ENTRAR EN CASA", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Otro programa avisaba cuando esa persona entraba en su casa familiar,", "y ese era el momento elegido para bombardear."],
  build(S) {
    const g = S.sub;
    const hs = E("g", {}, g);
    building(hs, 120, 1010, 320, 330, { wall: "#CFC7B6", win: "#3A3348" });
    E("path", { d: "M100 1010 L280 890 L460 1010 Z", fill: "#8E6A4A", stroke: "#5A4230", "stroke-width": 6 }, hs);
    const lit = [];
    for (let i = 0; i < 3; i++) lit.push(E("rect", { x: 150 + i * 96, y: 1070, width: 62, height: 70, rx: 4, fill: "#FFD98A" }, hs));
    const alert = screenCard(g, 560, 880, 440, 300, 1311);
    pix(alert, "AVISO AUTOMÁTICO", 780, 912, 3, "#9AA3AE", "middle");
    const txt = T(alert, "ha entrado en casa", 780, 1030, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FF6B5A" });
    const dotG = E("circle", { cx: 640, cy: 1100, r: 16, fill: "#FF6B5A" }, alert);
    pix(alert, "03:14", 820, 1092, 4, "#fff", "middle");
    const stars = [];
    for (let i = 0; i < 16; i++) stars.push(E("circle", { cx: 80 + i * 62, cy: 830 + (i % 4) * 22, r: 3 + (i % 3), fill: "#FFFDF5", opacity: .5 }, g));
    const note = E("g", {}, g);
    paper(note, 560, 1230, 440, 130, { seed: 1321, fill: INK });
    T(note, "era el momento elegido", 780, 1302, { f: SERIF, s: 38, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(hs, { at: .5, from: "bottom", dist: 480, r: -1.5 });
    S.piece(alert, { at: 1.6, from: "right", dist: 440, r: 1.5 });
    S.piece(note, { at: 3.2, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1301 });
    T(cl, "no en combate:", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "en su casa, de madrugada", 540, 352, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      lit.forEach((l, i) => l.setAttribute("opacity", (t > 1.2 + i * .25 ? 1 : .15).toFixed(2)));
      dotG.setAttribute("opacity", (Math.sin(t * 6) > 0 ? 1 : .2).toFixed(2));
      txt.style.opacity = seg(t, 2.2, 2.5).toFixed(2);
      stars.forEach((s2, i) => s2.setAttribute("opacity", (.3 + .3 * Math.abs(Math.sin(t * 1.4 + i))).toFixed(2)));
    };
  } });

// 5 — el edificio entero
DEF.push({ bg: "#6B3A1E", tr: "left",
  strip: { color: "#FFFDF5", word: "No guiadas", wordColor: INK, cx: 540, cy: 590, size: 215, wx: -20, maxW: 960, from: -1 },
  sub: { x: 30, y: 780, w: 1020, h: 650 },
  label: { text: "EL EDIFICIO ENTERO", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["A los sospechosos de rango bajo, cuentan, se les atacaba con bombas no guiadas,", "más baratas, que se llevan por delante el edificio entero."],
  build(S) {
    const g = S.sub;
    const rn = E("g", {}, g); ruin(rn, 650, 1160, 1.34, 7);
    const b1 = E("g", {}, g); bombShape(b1, 130, 930, .46, true);
    const b2 = E("g", {}, g); bombShape(b2, 310, 930, .46, false);
    const tags = [["GUIADA", 130, 1050, "#1E9E5A"], ["NO GUIADA", 310, 1050, RED]].map(([tx, x, y, c], i) => {
      const k = E("g", {}, g);
      E("rect", { x: x - pixW(tx, 3) / 2 - 10, y, width: pixW(tx, 3) + 20, height: 36, fill: INK }, k);
      pix(k, tx, x, y + 10, 3, c, "middle");
      return k; });
    const price = E("g", {}, g);
    paper(price, 60, 1250, 300, 112, { seed: 1411, fill: "#FFFDF5" });
    T(price, "la barata", 210, 1318, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    S.piece(rn, { at: .6, from: "bottom", dist: 560, r: -1 });
    S.piece(b1, { at: 1.4, from: "top", dist: 320, r: -2 });
    S.piece(b2, { at: 1.8, from: "top", dist: 320, r: 2 });
    S.piece(price, { at: 3.0, from: "left", dist: 300, r: -1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1401 });
    T(cl, "ahorrar en la bomba", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "lo paga el edificio", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => tags.forEach((k, i) => k.style.opacity = eo(seg(t, 2.0 + i * .3, 2.3 + i * .3)).toFixed(2));
  } });

// 6 — la cuenta
DEF.push({ bg: "#1E5F55", tr: "right",
  strip: { color: "#CFF75A", word: "La cuenta", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -50, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "15, 20, MÁS DE 100", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Hablan de 15 o 20 civiles autorizados por cada miliciano raso, y de más de 100 para un comandante.", "Un mando estadounidense contaba que allí 15 ya se salía del procedimiento."],
  build(S) {
    const g = S.sub;
    const sc = scaleBeam(g, 400, 1060, 480);
    const one = E("g", {}, g);
    E("rect", { x: 128, y: 1072, width: 64, height: 46, rx: 6, fill: "#FFFDF5", stroke: INK, "stroke-width": 5 }, one);
    pix(one, "1", 160, 1086, 3, INK, "middle");
    const many = [];
    for (let i = 0; i < 20; i++) many.push(E("rect", { x: 586 + (i % 5) * 26, y: 1046 + Math.floor(i / 5) * 20, width: 20, height: 15, rx: 3, fill: "#D8D2C4", stroke: "#8C8575", "stroke-width": 2 }, g));
    const c100 = E("g", {}, g);
    paper(c100, 700, 1200, 300, 170, { seed: 1511, fill: INK });
    T(c100, "+100", 850, 1296, { s: 64, a: "middle", w: 900, c: RED });
    pix(c100, "POR UN COMANDANTE", 850, 1330, 3, "#fff", "middle");
    const usa = E("g", {}, g);
    paper(usa, 70, 1210, 580, 160, { seed: 1521, fill: "#FFFDF5" });
    pix(usa, "EE. UU. CONTRA EL ESTADO ISLÁMICO", 360, 1246, 3, "#888", "middle");
    T(usa, "15 ya exigía permiso del mando", 360, 1326, { f: SERIF, s: 36, i: 1, a: "middle" });
    S.piece(sc.k, { at: .6, from: "top", dist: 360, r: 0 });
    S.piece(c100, { at: 2.6, from: "right", dist: 380, r: 1 });
    S.piece(usa, { at: 3.4, from: "left", dist: 420, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1501 });
    T(cl, "la proporcionalidad,", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "convertida en una cifra", 540, 352, { f: SERIF, s: 44, i: 1, a: "middle", c: "#CFF75A" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      many.forEach((m, i) => m.style.opacity = seg(t, 1.2 + i * .07, 1.5 + i * .07).toFixed(2));
      const tilt = eo(seg(t, 1.4, 3.0)) * 7;
      sc.beam.setAttribute("transform", `rotate(${tilt.toFixed(2)} 400 1040)`);
      one.setAttribute("transform", `translate(0 ${(tilt * 3.4).toFixed(1)})`);
    };
  } });

// 7 — la respuesta del ejército
DEF.push({ bg: "#BDB7A8", tr: "left",
  strip: { color: "#1B1B1B", word: "Lo niegan", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 230, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "SU RESPUESTA", x: 96, y: 1392, r: -4 },
  cap: ["El ejército israelí lo niega: dice que son herramientas auxiliares,", "que cada objetivo lo examina un analista, y que esa lista no existe."],
  build(S) {
    const g = S.sub;
    const st = E("g", {}, g);
    paper(st, 80, 850, 920, 440, { seed: 1611, fill: "#FFFDF5" });
    E("rect", { x: 120, y: 890, width: pixW("COMUNICADO OFICIAL", 4) + 24, height: 48, fill: INK }, st);
    pix(st, "COMUNICADO OFICIAL", 132, 904, 4, "#fff");
    T(st, "“", 130, 1070, { f: SERIF, s: 150, c: "#D6D0C2" });
    const lines = ["son herramientas auxiliares que", "ayudan a los oficiales; se exige un", "examen independiente de un analista", "de cada objetivo"].map((s, i) =>
      T(st, s, 560, 1020 + i * 62, { f: SERIF, s: 38, i: 1, a: "middle", c: i === 3 ? INK : INK }));
    const deny = E("g", {}, g);
    paper(deny, 300, 1250, 460, 130, { seed: 1621, fill: INK });
    T(deny, "y niega que exista la lista", 530, 1322, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(st, { at: .5, from: "top", dist: 440, r: -1.5 });
    S.piece(deny, { at: 3.0, from: "bottom", dist: 260, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1601 });
    T(cl, "seis fuentes anónimas", 540, 278, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "frente a un desmentido", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => lines.forEach((l, i) => l.style.opacity = eo(seg(t, .9 + i * .35, 1.3 + i * .35)).toFixed(2));
  } });

// 8 — lo que queda
DEF.push({ bg: "#26384F", tr: "right",
  strip: { color: "#FFD23F", word: "Después", wordColor: INK, cx: 540, cy: 580, size: 260, wx: -90, from: 1 },
  sub: { x: 30, y: 780, w: 1020, h: 650 },
  label: { text: "LO QUE QUEDA", x: 96, y: 1392, r: -4 },
  cap: ["La ONU se dijo profundamente preocupada, el autor de aquel libro dimitió en 2024,", "y la ley europea de inteligencia artificial no se aplica a los usos militares."],
  build(S) {
    const g = S.sub;
    const sky = E("g", {}, g);
    ruin(sky, 230, 1330, .52, 11);
    ruin(sky, 560, 1340, .44, 23);
    ruin(sky, 860, 1330, .5, 31);
    const cards = [["ONU", "«profundamente", "preocupada»", 70], ["EL AUTOR", "dimitió", "en 2024", 400], ["LEY DE IA", "no se aplica", "a lo militar", 730]].map(([a, b, c, x], i) => {
      const k = E("g", {}, g);
      paper(k, x, 860, 250, 260, { seed: 1711 + i, fill: i === 2 ? "#FFD23F" : "#FFFDF5" });
      E("rect", { x: x + 20, y: x === 70 ? 884 : 884, width: pixW(a, 3) + 18, height: 38, fill: INK }, k);
      pix(k, a, x + 29, 894, 3, "#fff");
      T(k, b, x + 125, 1000, { f: SERIF, s: 34, i: 1, a: "middle" });
      T(k, c, x + 125, 1048, { f: SERIF, s: 34, i: 1, a: "middle", c: RED });
      return k; });
    cards.forEach((c, i) => S.piece(c, { at: .8 + i * .6, from: "top", dist: 340, r: -1 + i * .8 }));
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 1701 });
    T(cl, "la ley que prohíbe esto", 540, 268, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "se detiene en la guerra", 540, 336, { f: SERIF, s: 44, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
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
      ["Yuval Abraham, +972 y Local Call", "3 de abril de 2024; seis oficiales israelíes, bajo anonimato"],
      ["El libro", "«The Human-Machine Team» (2021); su autor dimitió el 12 de sept. de 2024"],
      ["37.000 marcados", "Y un 10% de error asumido, según las fuentes"],
      ["«Where's Daddy?»", "Avisaba cuando el marcado entraba en su casa familiar"],
      ["Munición no guiada", "CNN, dic. 2023: ~45% de la usada en Gaza, según inteligencia de EE. UU."],
      ["El contraste", "Gen. Gersten, 2021: 15 civiles ya exigía permiso del Mando Central"],
      ["El ejército israelí lo niega", "«Herramientas auxiliares»; niega que exista esa lista"],
      ["Reglamento Europeo de IA", "Artículo 2: no se aplica a los usos exclusivamente militares"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 28, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 25, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
