// «La casilla que decía uigur»: scenes (inserted into the paper-collage engine by build.py)
// No face is ever drawn. People appear as featureless silhouettes inside detection boxes with code
// labels beside them — which is what the system does, and it keeps the piece clear of caricature.
const DEF = [];

// ---------- props ----------
function figure(g, cx, cy, s, fill) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-70 110 C-64 24 -36 0 0 0 C36 0 64 24 70 110 Z", fill }, k);
  E("circle", { cx: 0, cy: -48, r: 40, fill }, k);
  return k;
}

function detBox(g, x, y, w, h, col, tag) {
  const k = E("g", {}, g);
  const c = 26;
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const px0 = x + sx * w, py0 = y + sy * h, dx = sx ? -c : c, dy = sy ? -c : c;
    E("path", { d: `M${px0} ${py0 + dy} L${px0} ${py0} L${px0 + dx} ${py0}`, ...stroke(col, 7) }, k);
  }
  E("rect", { x, y, width: w, height: h, fill: "none", stroke: col, "stroke-width": 3, opacity: .45 }, k);
  if (tag) { E("rect", { x, y: y - 42, width: pixW(tag, 3) + 18, height: 38, fill: col }, k);
    pix(k, tag, x + 9, y - 33, 3, "#111"); }
  return k;
}

function camera(g, cx, cy, s, rot) {
  const k = E("g", { transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${s})` }, g);
  E("rect", { x: -14, y: -140, width: 28, height: 150, rx: 8, fill: "#6E7884" }, k);
  E("rect", { x: -70, y: -10, width: 140, height: 62, rx: 14, fill: "#3A424C", stroke: "#1E242B", "stroke-width": 5 }, k);
  E("rect", { x: 60, y: 4, width: 36, height: 34, rx: 8, fill: "#2B3038" }, k);
  const lens = E("circle", { cx: 86, cy: 21, r: 13, fill: "#8FD7E8" }, k);
  E("circle", { cx: -36, cy: -22, r: 9, fill: RED }, k);
  return { k, lens };
}

function codeRow(g, x, y, w, key, val, on) {
  const k = E("g", {}, g);
  E("rect", { x, y, width: w, height: 54, rx: 6, fill: on ? "#3A1414" : "#1E2228" }, k);
  pix(k, key, x + 16, y + 16, 4, on ? "#FF6B5A" : "#9AA3AE");
  pix(k, val, x + w - 26 - pixW(val, 4), y + 16, 4, on ? "#FFD23F" : "#6E7884");
  return k;
}

function mosque(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -230, y: -60, width: 460, height: 230, rx: 8, fill: "#E0B23F", stroke: "#8E6A10", "stroke-width": 6 }, k);
  E("path", { d: "M-230 -60 C-180 -150 -60 -186 0 -186 C60 -186 180 -150 230 -60 Z", fill: "#E8BF52", stroke: "#8E6A10", "stroke-width": 6 }, k);
  E("path", { d: "M-60 170 L-60 20 C-60 -32 60 -32 60 20 L60 170 Z", fill: "#8E6A10" }, k);
  for (const sx of [-1, 1]) {
    E("rect", { x: sx * 206 - 26, y: -230, width: 52, height: 180, rx: 8, fill: "#E8BF52", stroke: "#8E6A10", "stroke-width": 5 }, k);
    E("path", { d: `M${sx * 206 - 34} -230 C${sx * 206 - 24} -286 ${sx * 206 + 24} -286 ${sx * 206 + 34} -230 Z`, fill: "#C99A28", stroke: "#8E6A10", "stroke-width": 5 }, k);
  }
  E("path", { d: "M-150 -84 C-120 -130 -60 -150 0 -150 C60 -150 120 -130 150 -84 Z", fill: "#fff", opacity: .18 }, k);
  return k;
}

function moneyCard(g, x, y, w, h, name, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  E("rect", { x: x + 18, y: y + 18, width: w - 36, height: 46, fill: INK }, k);
  pix(k, name, x + w / 2, y + 32, name.length > 7 ? 3 : 4, "#fff", "middle");
  T(k, "valía más de", x + w / 2, y + 140, { f: SERIF, s: 30, i: 1, a: "middle", c: "#666" });
  const sg = E("g", { transform: `rotate(-8 ${x + w / 2} ${y + h - 70})` }, k);
  E("rect", { x: x + 22, y: y + h - 104, width: w - 44, height: 70, rx: 8, fill: "none", stroke: "#1E9E5A", "stroke-width": 6 }, sg);
  pix(sg, "+1.000 M", x + w / 2, y + h - 80, 3, "#1E9E5A", "middle");
  return k;
}

// =====================================================================
// 1 — medio millón de intentos
DEF.push({ bg: "#1B2A3C", tr: "left",
  strip: { color: "#FFFDF5", word: "Un mes", wordColor: INK, cx: 540, cy: 590, size: 270, wx: -110, from: -1 },
  sub: { x: 30, y: 780, w: 1020, h: 650 },
  label: { text: "500.000 INTENTOS", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["En un mes, las cámaras de una ciudad china intentaron identificar", "a sus vecinos más de 500.000 veces."],
  build(S) {
    const g = S.sub;
    E("rect", { x: 30, y: 1368, width: 1020, height: 62, fill: "#2A3748" }, g);
    const cams = [[150, 1010, -8], [340, 980, 0], [530, 1010, 8]].map(([x, y, r]) => camera(g, x, y, .66, r));
    const figs = [[260, 1300], [560, 1310], [850, 1300]].map(([x, y]) => {
      const k = E("g", {}, g);
      figure(k, x, y, .86, "#44566C");
      return k; });
    const boxes = [[176, 1216, 170, 200], [476, 1228, 170, 200], [766, 1216, 170, 200]].map(([x, y, w, h], i) =>
      detBox(g, x, y, w, h, "#5CE1FF", ["ID 01", "ID 02", "ID 03"][i]));
    const counter = E("g", {}, g);
    paper(counter, 620, 840, 400, 165, { seed: 7111, fill: INK });
    const n = T(counter, "0", 820, 955, { s: 86, a: "middle", w: 900, c: "#5CE1FF" });
    S.piece(counter, { at: 2.4, from: "top", dist: 320, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7101 });
    T(cl, "no buscaba a nadie:", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "los miraba a todos", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cams.forEach((c, i) => c.lens.setAttribute("opacity", (.5 + .5 * Math.abs(Math.sin(t * 2 + i))).toFixed(2)));
      figs.forEach((f, i) => f.style.opacity = seg(t, .8 + i * .2, 1.1 + i * .2).toFixed(2));
      boxes.forEach((b, i) => b.style.opacity = seg(t, 1.5 + i * .25, 1.8 + i * .25).toFixed(2));
      n.textContent = fmt(Math.round(lerp(0, 500000, eo(seg(t, 2.8, 4.4)))));
    };
  } });

// 2 — la casilla
DEF.push({ bg: "#8E1B2E", tr: "right",
  strip: { color: "#FFD23F", word: "Una casilla", wordColor: INK, cx: 540, cy: 600, size: 215, wx: -20, maxW: 960, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "REC_UYGUR", x: 96, y: 1392, r: -4 },
  cap: ["En el código, junto a «gafas de sol» o «sexo», había una casilla", "que respondía a una sola pregunta: si esa cara era de un uigur."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 90, 850, 900, 470, { seed: 7211, fill: "#15191F" });
    pix(card, "REGISTRO", 540, 890, 4, "#6E7884", "middle");
    const rows = [["REC_GENDER", "1", false], ["REC_GLASSES", "0", false], ["REC_AGE", "34", false], ["REC_UYGUR", "1", true]]
      .map(([k, v, on], i) => codeRow(card, 140, 950 + i * 76, 800, k, v, on));
    const ring = hcircle(g, 540, 1204, 440, 60, { seed: 2, c: "#FFD23F", w: 9 });
    S.piece(card, { at: .5, from: "bottom", dist: 520, r: -1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7201 });
    T(cl, "una persona,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "reducida a un campo", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      rows.forEach((r, i) => r.style.opacity = eo(seg(t, 1.0 + i * .35, 1.3 + i * .35)).toFixed(2));
      ring.set(seg(t, 2.8, 3.8));
    };
  } });

// 3 — 2.834
DEF.push({ bg: "#C8591C", tr: "left",
  strip: { color: "#FFFDF5", word: "2.834", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -140, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "GUARDADAS", x: 96, y: 1392, r: -4 },
  cap: ["El sistema dijo que sí 2.834 veces,", "y guardó cada imagen para que la policía la revisara."],
  build(S) {
    const g = S.sub;
    const sheet = E("g", {}, g);
    paper(sheet, 70, 850, 640, 470, { seed: 7311, fill: "#FFFDF5" });
    const thumbs = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const x = 110 + c * 100, y = 900 + r * 106, k = E("g", {}, sheet);
      E("rect", { x, y, width: 82, height: 88, rx: 6, fill: "#DED8C8", stroke: "#B9B3A6", "stroke-width": 3 }, k);
      figure(k, x + 41, y + 78, .26, "#A9A194");
      thumbs.push(k);
    }
    const card = E("g", {}, g);
    paper(card, 740, 930, 270, 300, { seed: 7321, fill: INK });
    const n = T(card, "0", 875, 1070, { s: 80, a: "middle", w: 900, c: "#FFD23F" });
    pix(card, "POSITIVOS", 875, 1110, 3, "#fff", "middle");
    pix(card, "DE 500.000", 875, 1150, 3, "#9AA3AE", "middle");
    S.piece(sheet, { at: .5, from: "left", dist: 540, r: -2 });
    S.piece(card, { at: 2.4, from: "right", dist: 400, r: 4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7301 });
    T(cl, "y cada acierto", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "quedaba archivado", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      thumbs.forEach((k, i) => k.style.opacity = seg(t, .9 + i * .05, 1.2 + i * .05).toFixed(2));
      n.textContent = fmt(Math.round(lerp(0, 2834, eo(seg(t, 2.8, 4.0)))));
    };
  } });

// 4 — dieciséis provincias
DEF.push({ bg: "#2B6F4E", tr: "right",
  strip: { color: "#CFF75A", word: "Dieciséis", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -50, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "DESDE 2018", x: 96, y: 1392, r: -4 },
  cap: ["No era una ciudad suelta: casi dos docenas de policías de 16 provincias", "pidieron esa función, una de ellas con más del 97% de acierto."],
  build(S) {
    const g = S.sub;
    const map = E("g", {}, g);
    paper(map, 70, 850, 600, 470, { seed: 7411, fill: "#EDE6D4" });
    E("path", { d: "M130 980 C200 900 310 930 390 896 C470 862 580 900 630 880 L640 1120 C560 1200 470 1250 380 1240 C280 1228 170 1160 130 1080 Z", fill: "#D9D0B8", stroke: "#BDB29A", "stroke-width": 5 }, map);
    const prov = [];
    const pts = [[200, 1010], [250, 1090], [300, 960], [330, 1140], [380, 1030], [420, 920], [440, 1180], [470, 1090], [500, 970], [530, 1150], [560, 1040], [580, 930], [600, 1100], [260, 1180], [350, 1200], [610, 1000]];
    pts.forEach(([x, y]) => prov.push(E("circle", { cx: x, cy: y, r: 17, fill: RED, stroke: "#fff", "stroke-width": 4 }, map)));
    const cards = [["¿UIGUR O NO?", "atributo pedido en Shaanxi"], ["97% DE ACIERTO", "exigido en dos condados"],
      ["MISMO VUELO", "aviso si coinciden varios"]].map(([tx, sub], i) => {
      const k = E("g", {}, g), y = 866 + i * 158;
      paper(k, 700, y, 320, 142, { seed: 7421 + i, fill: "#FFFDF5" });
      pix(k, tx, 860, y + 40, 3, INK, "middle");
      T(k, sub, 860, y + 112, { f: SERIF, s: 25, i: 1, a: "middle", c: "#666" });
      return k; });
    S.piece(map, { at: .5, from: "left", dist: 540, r: -2 });
    cards.forEach((c, i) => S.piece(c, { at: 2.0 + i * .5, from: "right", dist: 400, r: i % 2 ? 1.2 : -1.2 }));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7401 });
    T(cl, "no fue un experimento:", 540, 278, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "se pedía por catálogo", 540, 352, { f: SERIF, s: 48, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => prov.forEach((p, i) => { const q = eb(seg(t, .9 + i * .07, 1.2 + i * .07));
      p.setAttribute("opacity", q > 0 ? 1 : 0);
      p.setAttribute("r", (17 * q).toFixed(1)); });
  } });

// 5 — el folleto
DEF.push({ bg: "#D9A400", tr: "left",
  strip: { color: "#1B1B1B", word: "Alarma", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 280, wx: -120, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LO VENDÍAN ASÍ", x: 96, y: 1392, r: -4 },
  cap: ["Las empresas lo vendían como una ventaja: si en 20 días aparecían", "seis uigures en un barrio, el sistema avisaba solo."],
  build(S) {
    const g = S.sub;
    const bro = E("g", {}, g);
    paper(bro, 80, 850, 700, 460, { seed: 7511, fill: "#FFFDF5" });
    pix(bro, "FOLLETO COMERCIAL", 430, 890, 3, "#888", "middle");
    T(bro, "“", 120, 1010, { f: SERIF, s: 150, c: "#D6D0C2" });
    const lines = ["si en 20 días aparecen", "seis uigures en un barrio,", "envía alarmas de inmediato"].map((s, i) =>
      T(bro, s, 430, 1010 + i * 72, { f: SERIF, s: 42, i: 1, a: "middle", c: i === 2 ? RED : INK }));
    const bell = E("g", {}, g);
    E("path", { d: "M900 1120 C900 1030 850 1010 850 960 C850 920 950 920 950 960 C950 1010 900 1030 900 1120 Z", fill: "#FFFDF5", stroke: INK, "stroke-width": 6 }, bell);
    E("path", { d: "M830 1120 L970 1120", ...stroke(INK, 8) }, bell);
    E("circle", { cx: 900, cy: 1146, r: 15, fill: INK }, bell);
    const waves = [];
    for (let i = 0; i < 2; i++) waves.push(drawable(E("path", { d: `M${990 + i * 34} ${1000} A${100 + i * 34} ${100 + i * 34} 0 0 1 ${990 + i * 34} ${1120}`, ...stroke("#FFFDF5", 7) }, g)));
    const euph = E("g", {}, g);
    paper(euph, 420, 1250, 560, 120, { seed: 7521, fill: INK });
    T(euph, "lo llamaban «identificación de minorías»", 700, 1322, { s: 30, a: "middle", c: "#FFD23F", w: 700 });
    S.piece(bro, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(bell, { at: 2.4, from: "right", dist: 300, r: 4 });
    S.piece(euph, { at: 3.4, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7501 });
    T(cl, "no es un fallo:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "era el argumento de venta", 540, 352, { f: SERIF, s: 42, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      lines.forEach((l, i) => l.style.opacity = eo(seg(t, 1.0 + i * .4, 1.4 + i * .4)).toFixed(2));
      waves.forEach((w, i) => w.set(seg(t, 2.8 + i * .2, 3.2 + i * .2) * (.7 + .3 * Math.sin(t * 6 - i))));
      sxf(bell, 900, 1120, 1, Math.sin(t * 7) * (t > 2.8 ? 5 : 0));
    };
  } });

// 6 — Kasgar
DEF.push({ bg: "#4A2B6E", tr: "right",
  strip: { color: "#FFD23F", word: "Kasgar", wordColor: INK, cx: 540, cy: 590, size: 280, wx: -120, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "MÁS DE 200 CÁMARAS", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["Son 11 millones de personas, hasta un millón de ellas en campos,", "y había más de 200 cámaras dentro de la gran mezquita de Kasgar."],
  build(S) {
    const g = S.sub;
    const mq = E("g", {}, g); mosque(mq, 440, 1170, .92);
    const cams = [[150, 940, -12], [730, 900, 12], [300, 856, -6], [580, 850, 6]].map(([x, y, r]) => camera(g, x, y, .46, r));
    const nums = [["11 M", "PERSONAS", 760, 880], ["1 M", "EN CAMPOS", 790, 1130]].map(([a, b, x, y], i) => {
      const k = E("g", {}, g);
      paper(k, x, y, 220, 170, { seed: 7611 + i, fill: i ? INK : "#FFFDF5" });
      T(k, a, x + 110, y + 92, { s: 58, a: "middle", w: 900, c: i ? "#FFD23F" : INK });
      pix(k, b, x + 110, y + 118, 3, i ? "#fff" : "#666", "middle");
      return k; });
    S.piece(mq, { at: .5, from: "bottom", dist: 560, r: -1.5 });
    nums.forEach((n, i) => S.piece(n, { at: 2.0 + i * .5, from: "right", dist: 360, r: i ? -1 : 1 }));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7601 });
    T(cl, "ya casi nadie entra:", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "las cámaras están dentro", 540, 352, { f: SERIF, s: 44, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => cams.forEach((c, i) => c.lens.setAttribute("opacity", (.4 + .6 * Math.abs(Math.sin(t * 2.2 + i))).toFixed(2)));
  } });

// 7 — las empresas y el dinero
DEF.push({ bg: "#1F5FA8", tr: "left",
  strip: { color: "#FFFDF5", word: "Mil millones", wordColor: INK, cx: 540, cy: 600, size: 200, wx: 0, maxW: 960, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "SU RESPUESTA", x: 96, y: 1392, r: -4 },
  cap: ["Cuatro de esas empresas valían más de 1.000 millones cada una y tenían dinero occidental;", "una dijo que no lo sabía y otra, que se dedica a lo comercial, no a lo político."],
  build(S) {
    const g = S.sub;
    const cards = [["YITU", 60], ["MEGVII", 310], ["SENSETIME", 560], ["CLOUDWALK", 810]].map(([n, x], i) =>
      moneyCard(g, x, 840, 220, 280, n, 7711 + i));
    const q1 = E("g", {}, g);
    paper(q1, 70, 1140, 440, 200, { seed: 7721, fill: "#FFFDF5" });
    T(q1, "«no sabíamos", 290, 1220, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(q1, "que se usaba así»", 290, 1280, { f: SERIF, s: 40, i: 1, a: "middle", c: RED });
    const q2 = E("g", {}, g);
    paper(q2, 560, 1160, 450, 200, { seed: 7731, fill: "#FFFDF5" });
    T(q2, "«soluciones comerciales,", 785, 1240, { f: SERIF, s: 34, i: 1, a: "middle" });
    T(q2, "no políticas»", 785, 1300, { f: SERIF, s: 40, i: 1, a: "middle", c: RED });
    cards.forEach((c, i) => S.piece(c, { at: .6 + i * .3, from: "top", dist: 420, r: -1.5 + i }));
    S.piece(q1, { at: 2.6, from: "left", dist: 460, r: -2 });
    S.piece(q2, { at: 3.1, from: "right", dist: 460, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7701 });
    T(cl, "con inversores", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "de Estados Unidos y Europa", 540, 352, { f: SERIF, s: 40, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 8 — lo que vino después
DEF.push({ bg: "#13735E", tr: "right",
  strip: { color: "#FFD23F", word: "Prohibido", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -70, maxW: 950, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "2019 · 2022 · 2025", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["EE. UU. las puso en su lista negra en 2019, la ONU habló de posibles crímenes contra la humanidad en 2022,", "y en 2025 Europa prohibió exactamente esto: deducir la raza de una cara."],
  build(S) {
    const g = S.sub;
    E("path", { d: "M90 1010 L990 1010", ...stroke("#FFFDF5", 7), opacity: .5 }, g);
    const items = [["EE. UU.", "2019", "lista negra"], ["ONU", "2022", "crímenes contra la humanidad"], ["EUROPA", "2025", "prohibido"]];
    const cards = items.map(([a, b, c], i) => { const k = E("g", {}, g), x = 90 + i * 310;
      E("circle", { cx: x + 120, cy: 1010, r: 17, fill: "#FFD23F", stroke: INK, "stroke-width": 5 }, g);
      paper(k, x, 1060, 240, 270, { seed: 7811 + i, fill: i === 2 ? "#FFD23F" : "#FFFDF5" });
      pix(k, a, x + 120, 1098, 4, INK, "middle");
      T(k, b, x + 120, 1210, { s: 58, a: "middle", w: 900, c: INK });
      T(k, c, x + 120, 1272, { f: SERIF, s: c.length > 16 ? 23 : 30, i: 1, a: "middle", c: "#555" });
      return k; });
    const seal = E("g", {}, g);
    E("circle", { cx: 860, cy: 880, r: 86, fill: "none", stroke: RED, "stroke-width": 14 }, seal);
    E("path", { d: "M800 820 L920 940", ...stroke(RED, 14) }, seal);
    const face = E("g", {}, seal);
    detBox(face, 818, 838, 84, 84, "#FFFDF5", "");
    figure(face, 860, 920, .24, "#FFFDF5");
    cards.forEach((c, i) => S.piece(c, { at: .8 + i * .7, from: "bottom", dist: 340, r: -1.5 + i }));
    S.piece(seal, { at: 3.4, from: "pop", r: 0 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 7801 });
    T(cl, "tardó seis años", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "en prohibirse aquí", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
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
      ["Paul Mozur, The New York Times", "14 de abril de 2019"],
      ["Sanmenxia", "+500.000 intentos en ~1 mes; «rec_uygur» dio positivo 2.834 veces"],
      ["16 provincias", "Casi dos docenas de policías pidieron la función desde 2018"],
      ["CloudWalk", "«Seis uigures en 20 días: envía alarmas de inmediato»"],
      ["No es fiable", "Yitu presumía en 2017 de acertar 1 de cada 3 avisos"],
      ["Inversores", "Fidelity y Qualcomm en SenseTime; Sequoia en Yitu; Sinovation en Megvii"],
      ["EE. UU., 9 oct. 2019 · ONU, 31 ago. 2022", "Lista negra comercial · posibles crímenes contra la humanidad"],
      ["Reglamento Europeo de IA", "Desde el 2 de febrero de 2025 prohíbe deducir raza o religión de un rostro"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 28, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 25, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja ningún rostro.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
