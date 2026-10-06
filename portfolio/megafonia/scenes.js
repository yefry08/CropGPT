// «Las llamaron por megafonía»: scenes (inserted into the paper-collage engine by build.py)
// Nothing explicit is ever drawn: where the fabricated image would be there is a torn black block.
// No real person is illustrated — the student who speaks in the last scene is an anonymous figure.
const DEF = [];

// ---------- props ----------
function school(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -300, y: -120, width: 600, height: 300, rx: 10, fill: "#A8402E", stroke: "#6E2518", "stroke-width": 6 }, k);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++)
    E("rect", { x: -294 + c * 60 + (r % 2) * 10, y: -114 + r * 50, width: 52, height: 42, rx: 4, fill: r % 2 ? "#B64A36" : "#9E3828" }, k);
  E("path", { d: "M-330 -120 L0 -250 L330 -120 Z", fill: "#7E2C1D", stroke: "#52190F", "stroke-width": 6 }, k);
  E("rect", { x: -34, y: -214, width: 68, height: 70, rx: 6, fill: "#F3E5C8", stroke: "#52190F", "stroke-width": 5 }, k);
  E("circle", { cx: 0, cy: -180, r: 23, fill: "#FFFDF5", stroke: "#52190F", "stroke-width": 4 }, k);
  E("path", { d: "M0 -180 l0 -14 M0 -180 l11 5", ...stroke("#52190F", 4) }, k);
  for (const x of [-210, -110, 110, 210]) E("rect", { x: x - 32, y: -40, width: 64, height: 80, rx: 6, fill: "#CFE2F2", stroke: "#52190F", "stroke-width": 5 }, k);
  E("rect", { x: -54, y: 40, width: 108, height: 140, rx: 6, fill: "#5E3A22", stroke: "#2F1C0F", "stroke-width": 5 }, k);
  E("circle", { cx: 32, cy: 112, r: 8, fill: "#F3E5C8" }, k);
  return k;
}

function phoneCard(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -150, y: -270, width: 300, height: 540, rx: 36, fill: "#2B3038", stroke: "#15181C", "stroke-width": 6 }, k);
  E("rect", { x: -128, y: -240, width: 256, height: 480, rx: 14, fill: "#EEF4FA" }, k);
  E("rect", { x: -44, y: -258, width: 88, height: 12, rx: 6, fill: "#15181C" }, k);
  const photo = E("g", {}, k);
  E("rect", { x: -108, y: -200, width: 216, height: 290, rx: 8, fill: "#9FC3DE" }, photo);
  E("path", { d: "M-108 70 L-40 -40 L18 40 L56 -4 L108 70 Z", fill: "#6E9CC0" }, photo);
  E("circle", { cx: 54, cy: -140, r: 30, fill: "#FFE9A8" }, photo);
  const block = E("g", {}, k);
  E("path", { d: torn(0, -200, 108, 290, 331, 9, 24), fill: "#111214" }, block);
  E("path", { d: "M18 -80 l72 72 M90 -80 l-72 72", ...stroke("#4A4D55", 8) }, block);
  for (let i = 0; i < 3; i++) E("rect", { x: -108, y: 112 + i * 42, width: 216 - i * 54, height: 20, rx: 10, fill: "#C9D2DC" }, k);
  return { k, block };
}

function speaker(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -150, y: -150, width: 300, height: 300, rx: 24, fill: "#C9B79A", stroke: "#7A6848", "stroke-width": 6 }, k);
  E("rect", { x: -120, y: -120, width: 240, height: 200, rx: 12, fill: "#8D7A5C" }, k);
  for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++)
    E("circle", { cx: -104 + c * 26, cy: -104 + r * 28, r: 7, fill: "#6B5B41" }, k);
  E("rect", { x: -60, y: 96, width: 120, height: 26, rx: 13, fill: "#8D7A5C" }, k);
  E("path", { d: "M-124 -124 L-40 -124", ...stroke("#fff", 7), opacity: .3 }, k);
  return k;
}

function deskGrid(g, x, y, cols, rows, cell, marked) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, dx = x + c * cell, dy = y + r * cell, on = marked.includes(i);
    const k = E("g", {}, g);
    E("rect", { x: dx, y: dy, width: cell - 22, height: 44, rx: 7, fill: on ? RED : "#FFFDF5", stroke: on ? "#8E1B1B" : "#B9B3A6", "stroke-width": 4 }, k);
    for (const sx of [10, cell - 42]) E("line", { x1: dx + sx, y1: dy + 44, x2: dx + sx, y2: dy + 86, ...stroke(on ? "#8E1B1B" : "#B9B3A6", 5) }, k);
    out.push({ k, on });
  }
  return out;
}

function clockFace(g, cx, cy, r, o = {}) {
  const k = E("g", {}, g);
  E("circle", { cx, cy, r, fill: "#FFFDF5", stroke: INK, "stroke-width": 7 }, k);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6;
    E("line", { x1: cx + Math.sin(a) * (r - 14), y1: cy - Math.cos(a) * (r - 14), x2: cx + Math.sin(a) * (r - 4), y2: cy - Math.cos(a) * (r - 4), ...stroke(INK, 4) }, k); }
  const hh = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - r * .5, ...stroke(INK, 8) }, k);
  const mm = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - r * .74, ...stroke(o.c || RED, 6) }, k);
  E("circle", { cx, cy, r: 8, fill: INK }, k);
  return { k, hh, mm };
}

// =====================================================================
// 1 — octubre de 2023
DEF.push({ bg: "#27476E", tr: "left",
  strip: { color: "#FFFDF5", word: "Octubre", wordColor: INK, cx: 540, cy: 590, size: 260, wx: -90, from: -1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "NUEVA JERSEY", x: 96, y: 1392, r: -4 },
  cap: ["En octubre de 2023, unas alumnas de un instituto de Nueva Jersey descubrieron", "que sus compañeros habían fabricado imágenes sexuales falsas de ellas."],
  build(S) {
    const g = S.sub;
    const sc = E("g", {}, g); school(sc, 410, 1090, .90);
    const ph = E("g", {}, g); const { block } = phoneCard(ph, 850, 1150, .82);
    S.piece(sc, { at: .5, from: "bottom", dist: 640, r: -2 });
    S.piece(ph, { at: 1.6, from: "right", dist: 440, r: 5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3101 });
    T(cl, "una foto suya,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "convertida en otra cosa", 540, 352, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const p = eo(seg(t, 2.6, 3.4));
      block.style.opacity = p.toFixed(2);
      block.setAttribute("transform", `translate(${((1 - p) * 90).toFixed(1)} 0)`);
    };
  } });

// 2 — la megafonía
DEF.push({ bg: "#D9A400", tr: "right",
  strip: { color: "#FFFDF5", word: "Megafonía", wordColor: INK, cx: 540, cy: 600, size: 230, wx: -30, maxW: 950, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "SUS NOMBRES, EN ALTO", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["A los chicos los fueron sacando de clase en voz baja.", "A ellas las llamaron al despacho diciendo sus nombres por megafonía."],
  build(S) {
    const g = S.sub;
    const sp = E("g", {}, g); speaker(sp, 280, 1050, .92);
    const waves = [];
    for (let i = 0; i < 3; i++) waves.push(drawable(E("path", { d: `M${438 + i * 40} ${960} A${90 + i * 40} ${90 + i * 40} 0 0 1 ${438 + i * 40} ${1140}`, ...stroke("#FFFDF5", 8) }, g)));
    const names = ["ANA", "LUCIA", "SARA"].map((n, i) => { const k = E("g", {}, g);
      paper(k, 600 + (i % 2) * 150, 860 + i * 140, 250, 100, { seed: 3211 + i, fill: "#FFFDF5" });
      pix(k, n, 725 + (i % 2) * 150, 900 + i * 140, 5, INK, "middle");
      return k; });
    const note = E("g", {}, g);
    pix(note, "NOMBRES DE EJEMPLO", 740, 1300, 3, "#8A6E12", "middle");
    S.piece(sp, { at: .5, from: "left", dist: 520, r: -3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3201 });
    T(cl, "a ellos, en voz baja;", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "a ellas, por el altavoz", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      waves.forEach((w, i) => w.set(seg(t, 1.3 + i * .25, 1.9 + i * .25) * (.7 + .3 * Math.sin(t * 3 - i))));
      names.forEach((n, i) => { const q = eb(seg(t, 2.0 + i * .4, 2.5 + i * .4));
        n.style.opacity = q > 0 ? 1 : 0;
        n.setAttribute("transform", `translate(${((1 - q) * 240).toFixed(1)} ${(Math.sin(t * 1.4 + i) * 5).toFixed(1)})`); });
      note.style.opacity = seg(t, 3.4, 3.9).toFixed(2);
    };
  } });

// 3 — uno o dos días
DEF.push({ bg: "#9E1B2F", tr: "left",
  strip: { color: "#FFD23F", word: "Dos días", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -60, maxW: 940, from: -1 },
  sub: { x: 60, y: 800, w: 960, h: 620 },
  label: { text: "LA SANCIÓN", x: 96, y: 1392, r: -4 },
  cap: ["Al alumno señalado lo suspendieron uno o dos días,", "según le dijo el instituto a la madre de una de ellas."],
  build(S) {
    const g = S.sub;
    const cal = E("g", {}, g);
    paper(cal, 120, 870, 520, 470, { seed: 3311, fill: "#FFFDF5" });
    E("rect", { x: 120, y: 870, width: 520, height: 86, fill: INK }, cal);
    pix(cal, "OCTUBRE", 380, 898, 5, "#fff", "middle");
    const cells = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const x = 160 + c * 92, y = 990 + r * 86, i = r * 5 + c;
      cells.push(E("rect", { x, y, width: 72, height: 66, rx: 8, fill: i === 6 || i === 7 ? "#FFD23F" : "#EFEADF" }, cal));
    }
    const ring = hcircle(cal, 394, 1110, 118, 60, { seed: 3, c: RED, w: 9 });
    const slip = E("g", {}, g);
    paper(slip, 680, 980, 290, 230, { seed: 3321, fill: "#FFFDF5" });
    pix(slip, "SUSPENSIÓN", 825, 1020, 4, INK, "middle");
    T(slip, "1-2", 825, 1130, { s: 86, a: "middle", w: 900, c: RED });
    pix(slip, "DÍAS", 825, 1160, 4, "#666", "middle");
    S.piece(cal, { at: .5, from: "left", dist: 540, r: -2 });
    S.piece(slip, { at: 1.8, from: "right", dist: 440, r: 4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3301 });
    T(cl, "eso fue todo", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "lo que les contaron", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { ring.set(seg(t, 2.6, 3.5)); };
  } });

// 4 — Beverly Hills: cinco expulsiones
DEF.push({ bg: "#13825A", tr: "right",
  strip: { color: "#FFFDF5", word: "Expulsados", wordColor: INK, cx: 540, cy: 600, size: 215, wx: -20, maxW: 960, from: 1 },
  sub: { x: 50, y: 800, w: 980, h: 620 },
  label: { text: "DOS SEMANAS", x: 96, y: 1392, r: -4 },
  cap: ["En Beverly Hills, otro colegio tardó dos semanas", "en expulsar a cinco alumnos por lo mismo."],
  build(S) {
    const g = S.sub;
    const doc = E("g", {}, g);
    paper(doc, 140, 860, 800, 480, { seed: 3411, fill: "#FFFDF5" });
    pix(doc, "ACTA DEL CONSEJO ESCOLAR", 540, 900, 4, "#666", "middle");
    const rows = [0, 1, 2, 3, 4].map(i => { const k = E("g", {}, doc), y = 980 + i * 70;
      E("rect", { x: 200, y, width: 430, height: 22, rx: 11, fill: "#C9C2B4" }, k);
      return k; });
    const stamps = [0, 1, 2, 3, 4].map(i => { const k = E("g", {}, doc);
      E("rect", { x: 650, y: 966 + i * 70, width: 180, height: 50, rx: 6, fill: "none", stroke: RED, "stroke-width": 5 }, k);
      pix(k, "EXPULSADO", 740, 982 + i * 70, 3, RED, "middle");
      k.style.opacity = 0; return k; });
    S.piece(doc, { at: .5, from: "bottom", dist: 560, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3401 });
    T(cl, "mismo delito,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "otra respuesta", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      rows.forEach((r, i) => r.style.opacity = seg(t, 1.0 + i * .14, 1.3 + i * .14));
      stamps.forEach((s, i) => { const q = seg(t, 2.2 + i * .33, 2.5 + i * .33);
        s.style.opacity = q.toFixed(2);
        sxf(s, 740, 991 + i * 70, 1 + (1 - eo(q)) * .45, -7 + i * 3); });
    };
  } });

// 5 — ¿qué se supone que tengo que denunciar?
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "Denunciar", wordColor: INK, cx: 540, cy: 600, size: 225, wx: -30, maxW: 950, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "CERCA DE SEATTLE", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Cerca de Seattle, un detective preguntó por qué el centro no lo había denunciado.", "La subdirectora preguntó qué se suponía que tenía que denunciar."],
  build(S) {
    const g = S.sub;
    const rep = E("g", {}, g);
    paper(rep, 90, 860, 400, 460, { seed: 3511, fill: "#FFFDF5" });
    E("rect", { x: 130, y: 900, width: 150, height: 44, fill: INK }, rep);
    pix(rep, "POLICÍA", 150, 912, 4, "#fff");
    for (let i = 0; i < 7; i++) E("rect", { x: 130, y: 980 + i * 42, width: 320 - (i % 3) * 60, height: 18, rx: 9, fill: "#C9C2B4" }, rep);
    E("circle", { cx: 420, cy: 1250, r: 44, fill: "#2E4A8A" }, rep);
    E("path", { d: "M420 1222 l12 22 l24 4 l-18 18 l5 24 l-23 -12 l-23 12 l5 -24 l-18 -18 l24 -4 Z", fill: "#FFD23F" }, rep);
    const bub = E("g", {}, g);
    E("rect", { x: 530, y: 900, width: 460, height: 260, rx: 30, fill: "#fff" }, bub);
    E("rect", { x: 538, y: 908, width: 444, height: 244, rx: 26, fill: "#FFFDF5" }, bub);
    E("path", { d: "M600 1152 l-48 66 l72 -58 Z", fill: "#FFFDF5" }, bub);
    T(bub, "¿y qué tengo", 760, 1000, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(bub, "que denunciar,", 760, 1064, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(bub, "si no son reales?", 760, 1128, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    const law = E("g", {}, g);
    paper(law, 520, 1200, 480, 130, { seed: 3521, fill: INK });
    T(law, "la ley decía que sí", 760, 1282, { f: SERIF, s: 46, i: 1, a: "middle", c: "#CFF75A" });
    S.piece(rep, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(bub, { at: 1.6, from: "right", dist: 520, r: 2 });
    S.piece(law, { at: 3.6, from: "bottom", dist: 260, r: -1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3501 });
    T(cl, "nadie sabía", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "qué hacer con esto", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 6 — el 15%
DEF.push({ bg: "#E2641A", tr: "right",
  strip: { color: "#FFFDF5", word: "Quince", wordColor: INK, cx: 540, cy: 600, size: 280, wx: -120, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "ENCUESTA NACIONAL", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["No es raro: en 2024, el 15% de los alumnos de instituto sabía", "de un deepfake sexual de alguien de su propio centro."],
  build(S) {
    const g = S.sub;
    const sheet = E("g", {}, g);
    paper(sheet, 90, 850, 620, 470, { seed: 3611, fill: "#FFFDF5" });
    const desks = deskGrid(sheet, 140, 910, 5, 4, 112, [2, 7, 13]);
    const card = E("g", {}, g);
    paper(card, 740, 950, 270, 270, { seed: 3621, fill: INK });
    const num = T(card, "0%", 875, 1090, { s: 84, a: "middle", w: 900, c: "#FFD23F" });
    pix(card, "DE LOS ALUMNOS", 875, 1140, 3, "#fff", "middle");
    S.piece(sheet, { at: .5, from: "left", dist: 560, r: -2 });
    S.piece(card, { at: 2.6, from: "right", dist: 400, r: 4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3601 });
    T(cl, "no fue un caso:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "es un patrón", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      desks.forEach((d, i) => { const q = eb(seg(t, .9 + i * .045, 1.2 + i * .045));
        d.k.style.opacity = (d.on ? q * (.2 + .8 * seg(t, 2.2 + (i % 3) * .22, 2.6 + (i % 3) * .22)) : q).toFixed(2); });
      num.textContent = Math.round(lerp(0, 15, eo(seg(t, 3.0, 4.0)))) + "%";
    };
  } });

// 7 — la ley, después
DEF.push({ bg: "#13304F", tr: "left",
  strip: { color: "#FFD23F", word: "La ley", wordColor: INK, cx: 540, cy: 600, size: 270, wx: -110, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LLEGÓ DESPUÉS", x: 96, y: 1392, r: -4 },
  cap: ["La ley llegó después: el FBI avisó en 2024, Nueva Jersey lo castigó con hasta 5 años,", "y desde 2025 las plataformas tienen 48 horas para retirarlas."],
  build(S) {
    const g = S.sub;
    E("path", { d: "M80 1012 L960 1012", ...stroke("#FFFDF5", 7), opacity: .5 }, g);
    const items = [["FBI", "2024", "es delito"], ["N. JERSEY", "2025", "hasta 5 años"], ["EE. UU.", "2025", "48 horas"]];
    const cards = items.map(([a, b, c], i) => { const k = E("g", {}, g), x = 80 + i * 310;
      E("circle", { cx: x + 120, cy: 1012, r: 17, fill: "#FFD23F", stroke: INK, "stroke-width": 5 }, g);
      paper(k, x, 1064, 240, 262, { seed: 3711 + i, fill: i === 2 ? "#FFD23F" : "#FFFDF5" });
      pix(k, a, x + 120, 1102, 4, INK, "middle");
      T(k, b, x + 120, 1212, { s: 60, a: "middle", w: 900, c: INK });
      T(k, c, x + 120, 1276, { f: SERIF, s: 32, i: 1, a: "middle", c: "#555" });
      return k; });
    const cl2 = clockFace(g, 920, 846, 64);
    S.piece(cards[0], { at: .8, from: "bottom", dist: 320, r: -2 });
    S.piece(cards[1], { at: 1.5, from: "bottom", dist: 320, r: 1 });
    S.piece(cards[2], { at: 2.2, from: "bottom", dist: 320, r: -1 });
    S.piece(cl2.k, { at: 3.0, from: "pop", r: 8 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3701 });
    T(cl, "primero pasó,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "y luego se prohibió", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const a = t * 2.2;
      cl2.hh.setAttribute("x2", (920 + Math.sin(a) * 32).toFixed(1)); cl2.hh.setAttribute("y2", (846 - Math.cos(a) * 32).toFixed(1));
      cl2.mm.setAttribute("x2", (920 + Math.sin(a * 6) * 48).toFixed(1)); cl2.mm.setAttribute("y2", (846 - Math.cos(a * 6) * 48).toFixed(1));
    };
  } });

// 8 — la alumna que lo cambió
DEF.push({ bg: "#1F8A70", tr: "right",
  strip: { color: "#FFFDF5", word: "Normas", wordColor: INK, cx: 540, cy: 590, size: 280, wx: -120, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "LO PIDIÓ ELLA", x: 96, y: 1392, r: -4 },
  cap: ["Lo consiguió una de aquellas alumnas, que lo resumió así:", "«si el instituto hubiera tenido normas sobre IA, yo habría estado protegida»."],
  build(S) {
    const g = S.sub;
    const fig = E("g", {}, g);
    E("rect", { x: 100, y: 1150, width: 300, height: 260, rx: 10, fill: "#FFFDF5", stroke: "#B9B3A6", "stroke-width": 5 }, fig);
    E("path", { d: "M124 1176 L376 1176", ...stroke("#DCD6C8", 6) }, fig);
    E("path", { d: "M198 1112 C206 1012 242 982 272 982 C302 982 338 1012 346 1112 Z", fill: "#12594A" }, fig);
    E("circle", { cx: 272, cy: 926, r: 58, fill: "#12594A" }, fig);
    const mic = E("g", {}, g);
    E("line", { x1: 146, y1: 1150, x2: 168, y2: 1030, ...stroke("#3A424C", 10) }, mic);
    E("ellipse", { cx: 170, cy: 1006, rx: 28, ry: 34, fill: "#2B3038", stroke: "#15181C", "stroke-width": 5 }, mic);
    for (let i = 0; i < 4; i++) E("line", { x1: 146, y1: 988 + i * 13, x2: 194, y2: 988 + i * 13, ...stroke("#5A626C", 4) }, mic);
    const q = E("g", {}, g);
    paper(q, 450, 862, 560, 438, { seed: 3811, fill: "#FFFDF5" });
    T(q, "“", 482, 998, { f: SERIF, s: 190, c: "#D6D0C2" });
    const lines = ["si el instituto", "hubiera tenido", "normas sobre IA,", "yo habría estado", "protegida"].map((s, i) =>
      T(q, s, 730, 952 + i * 74, { f: SERIF, s: 46, i: 1, a: "middle", c: i > 3 ? RED : INK }));
    S.piece(fig, { at: .6, from: "bottom", dist: 520, r: -1 });
    S.piece(mic, { at: 1.1, from: "bottom", dist: 300, r: 2 });
    S.piece(q, { at: 1.6, from: "right", dist: 500, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 3801 });
    T(cl, "tenía 14 años", 540, 268, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "cuando empezó a pedirlo", 540, 336, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => lines.forEach((l, i) => { const p = eo(seg(t, 2.0 + i * .33, 2.4 + i * .33));
      l.style.opacity = p.toFixed(2); l.setAttribute("transform", `translate(${((1 - p) * 34).toFixed(1)} 0)`); });
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
      ["Natasha Singer, The New York Times", "8 de abril de 2024, desde Westfield (Nueva Jersey)"],
      ["Westfield, octubre de 2023", "A ellas las llamaron por megafonía; a ellos, en voz baja"],
      ["Beverly Vista, febrero de 2024", "Cinco expulsiones aprobadas dos semanas después"],
      ["Issaquah (Seattle), otoño 2023", "Informe policial obtenido por el NYT con una petición pública"],
      ["FBI, 29 de marzo de 2024", "Es ilegal distribuir ese material aunque esté generado por IA"],
      ["CDT, julio-agosto de 2024", "El 15% de los alumnos de instituto sabía de un caso en su centro"],
      ["Nueva Jersey, 2 abril 2025", "Hasta 5 años de cárcel; Francesca Mani estuvo en la firma"],
      ["Take It Down Act, 19 mayo 2025", "Las plataformas deben retirarlas en 48 horas"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 30, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 26, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
