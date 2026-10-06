// «Dos días antes de votar»: scenes (inserted into the paper-collage engine by build.py)
// Nobody is drawn: the people in the story are real individuals falsely put in a faked recording,
// so the screen shows waveforms, posts, rules and paper — plus the Slovak flag.
const DEF = [];

// ---------- props ----------
function slovakFlag(g, x, y, w, seed) {
  const k = E("g", {}, g), h = w * .62, b = h / 3;
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  E("rect", { x, y: y + b, width: w, height: b, fill: "#0B4EA2" }, k);
  E("rect", { x, y: y + 2 * b, width: w, height: b, fill: "#EE1C25" }, k);
  // coat of arms: red shield, white double cross on three blue hills
  const sx = x + w * .3, sy = y + h * .2, sw = w * .3, sh = h * .56;
  E("path", { d: `M${sx} ${sy} L${sx + sw} ${sy} L${sx + sw} ${sy + sh * .55} C${sx + sw} ${sy + sh * .9} ${sx + sw * .5} ${sy + sh} ${sx + sw / 2} ${sy + sh} C${sx + sw * .5} ${sy + sh} ${sx} ${sy + sh * .9} ${sx} ${sy + sh * .55} Z`, fill: "#EE1C25", stroke: "#FFFDF5", "stroke-width": w * .018 }, k);
  const cx = sx + sw / 2, cw = sw * .12;
  E("rect", { x: cx - cw / 2, y: sy + sh * .12, width: cw, height: sh * .62, fill: "#FFFDF5" }, k);
  E("rect", { x: cx - sw * .26, y: sy + sh * .27, width: sw * .52, height: cw, fill: "#FFFDF5" }, k);
  E("rect", { x: cx - sw * .34, y: sy + sh * .45, width: sw * .68, height: cw, fill: "#FFFDF5" }, k);
  for (const [dx, r] of [[-sw * .26, sh * .1], [0, sh * .14], [sw * .26, sh * .1]])
    E("path", { d: `M${cx + dx - sw * .2} ${sy + sh * .78} q${sw * .2} ${-r * 2} ${sw * .4} 0 Z`, fill: "#0B4EA2" }, k);
  return k;
}

function wave(g, x, y, w, h, n, col) {
  const bars = [];
  for (let i = 0; i < n; i++) bars.push(E("rect", { x: x + i * (w / n), y: y + h / 2, width: w / n - 6, height: 6, rx: 3, fill: col }, g));
  return { bars, set(t, amp) {
    bars.forEach((b, i) => { const v = Math.abs(Math.sin(i * 1.7 + t * 4)) * h * amp * (.35 + .65 * Math.abs(Math.sin(i * .6)));
      b.setAttribute("y", (y + h / 2 - v / 2).toFixed(1)); b.setAttribute("height", Math.max(6, v).toFixed(1)); }); } };
}

function post(g, x, y, w, h, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  E("circle", { cx: x + 54, cy: y + 54, r: 28, fill: "#C9C2B4" }, k);
  E("rect", { x: x + 98, y: y + 36, width: 180, height: 16, rx: 8, fill: "#C9C2B4" }, k);
  E("rect", { x: x + 98, y: y + 62, width: 110, height: 12, rx: 6, fill: "#DCD6C8" }, k);
  return k;
}

function clockFace(g, cx, cy, r) {
  const k = E("g", {}, g);
  E("circle", { cx, cy, r, fill: "#FFFDF5", stroke: INK, "stroke-width": 7 }, k);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6;
    E("line", { x1: cx + Math.sin(a) * (r - 13), y1: cy - Math.cos(a) * (r - 13), x2: cx + Math.sin(a) * (r - 4), y2: cy - Math.cos(a) * (r - 4), ...stroke(INK, 4) }, k); }
  const hh = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - r * .5, ...stroke(INK, 8) }, k);
  const mm = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - r * .74, ...stroke(RED, 6) }, k);
  E("circle", { cx, cy, r: 8, fill: INK }, k);
  return { k, set(a) {
    hh.setAttribute("x2", (cx + Math.sin(a) * r * .5).toFixed(1)); hh.setAttribute("y2", (cy - Math.cos(a) * r * .5).toFixed(1));
    mm.setAttribute("x2", (cx + Math.sin(a * 12) * r * .74).toFixed(1)); mm.setAttribute("y2", (cy - Math.cos(a * 12) * r * .74).toFixed(1)); } };
}

function checkRow(g, x, y, w, label, on) {
  const k = E("g", {}, g);
  E("rect", { x, y, width: 54, height: 54, rx: 8, fill: "#FFFDF5", stroke: INK, "stroke-width": 5 }, k);
  if (on) E("path", { d: `M${x + 12} ${y + 28} l14 16 l24 -30`, ...stroke("#1E9E5A", 8) }, k);
  T(k, label, x + 78, y + 42, { f: SERIF, s: 42, i: 1, c: on ? INK : "#777" });
  return k;
}

function ballotBox(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-150 -80 L150 -80 L120 150 L-120 150 Z", fill: "#D8D2C4", stroke: "#8C8575", "stroke-width": 6 }, k);
  E("rect", { x: -160, y: -110, width: 320, height: 40, rx: 8, fill: "#C2BBA9", stroke: "#8C8575", "stroke-width": 6 }, k);
  E("rect", { x: -60, y: -98, width: 120, height: 14, rx: 7, fill: "#5A5346" }, k);
  E("rect", { x: -34, y: -190, width: 70, height: 96, rx: 5, fill: "#FFFDF5", stroke: "#B9B3A6", "stroke-width": 5 }, k);
  return k;
}

// =====================================================================
// 1 — dos días antes
DEF.push({ bg: "#13304F", tr: "left",
  strip: { color: "#FFFDF5", word: "Dos días", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -70, maxW: 950, from: -1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "ESLOVAQUIA, 2023", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Dos días antes de las elecciones eslovacas apareció en Facebook", "un audio con dos voces conocidas hablando de cómo amañar la votación."],
  build(S) {
    const g = S.sub;
    const fl = E("g", {}, g); slovakFlag(fl, 620, 850, 340, 8111);
    const pg = E("g", {}, g);
    const p = post(pg, 70, 900, 520, 420, 8121);
    const w1 = wave(p, 110, 1060, 440, 150, 22, "#2E6FB8");
    pix(p, "AUDIO · 1:12", 330, 1250, 4, "#888", "middle");
    const cal = E("g", {}, g);
    paper(cal, 620, 1130, 340, 220, { seed: 8131, fill: "#FFFDF5" });
    const cells = [];
    for (let i = 0; i < 7; i++) cells.push(E("rect", { x: 652 + i * 44, y: 1230, width: 36, height: 44, rx: 5, fill: i < 2 ? RED : "#EFEADF" }, cal));
    pix(cal, "FALTAN 2 DÍAS", 790, 1180, 4, INK, "middle");
    S.piece(pg, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(fl, { at: 1.3, from: "right", dist: 420, r: 1 });
    S.piece(cal, { at: 2.4, from: "bottom", dist: 300, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8101 });
    T(cl, "dos voces conocidas", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "que nunca dijeron eso", 540, 352, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { w1.set(t, .9); cells.forEach((c, i) => c.setAttribute("opacity", seg(t, 2.9 + i * .06, 3.1 + i * .06).toFixed(2))); };
  } });

// 2 — las 48 horas de silencio
DEF.push({ bg: "#8E1B2E", tr: "right",
  strip: { color: "#FFD23F", word: "Silencio", wordColor: INK, cx: 540, cy: 600, size: 260, wx: -90, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "48 HORAS", x: 96, y: 1392, r: -4 },
  cap: ["Los dos dijeron que era falso y los verificadores encontraron señales de manipulación,", "pero el audio cayó dentro de las 48 horas de silencio electoral."],
  build(S) {
    const g = S.sub;
    const meg = E("g", {}, g);
    E("path", { d: "M140 1060 L300 1000 L300 1220 L140 1160 Z", fill: "#D8D2C4", stroke: "#8C8575", "stroke-width": 6 }, meg);
    E("path", { d: "M300 990 L470 920 L470 1300 L300 1230 Z", fill: "#E8E2D4", stroke: "#8C8575", "stroke-width": 6 }, meg);
    E("rect", { x: 96, y: 1080, width: 56, height: 60, rx: 8, fill: "#8C8575" }, meg);
    const tape = E("g", { transform: "rotate(-12 320 1110)" }, g);
    E("rect", { x: 70, y: 1072, width: 520, height: 76, fill: INK }, tape);
    pix(tape, "SILENCIO", 330, 1098, 6, "#fff", "middle");
    const cl2 = clockFace(g, 790, 1000, 108);
    const h48 = E("g", {}, g);
    paper(h48, 660, 1160, 300, 180, { seed: 8211, fill: "#FFFDF5" });
    T(h48, "48 h", 810, 1280, { s: 76, a: "middle", w: 900, c: RED });
    const stamp = E("g", {}, g);
    paper(stamp, 70, 826, 430, 128, { seed: 8221, fill: "#FFFDF5" });
    pix(stamp, "AFP: SEÑALES DE IA", 285, 872, 4, INK, "middle");
    S.piece(meg, { at: .5, from: "left", dist: 420, r: -2 });
    S.piece(cl2.k, { at: 1.2, from: "right", dist: 380, r: 1 });
    S.piece(stamp, { at: 2.2, from: "top", dist: 320, r: -3 });
    S.piece(tape, { at: 3.0, from: "left", dist: 620, r: 0 });
    S.piece(h48, { at: 2.8, from: "bottom", dist: 280, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8201 });
    T(cl, "lo desmintieron,", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "pero no podían gritarlo", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => cl2.set(t * .5);
  } });

// 3 — la norma solo hablaba de vídeo
DEF.push({ bg: "#D9A400", tr: "left",
  strip: { color: "#FFFDF5", word: "Solo vídeo", wordColor: INK, cx: 540, cy: 600, size: 225, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "LA NORMA", x: 96, y: 1392, r: -4 },
  cap: ["Y además era audio: la norma de Meta sobre contenido manipulado", "solo hablaba de vídeos, así que técnicamente no la incumplía."],
  build(S) {
    const g = S.sub;
    const doc = E("g", {}, g);
    paper(doc, 80, 850, 620, 440, { seed: 8311, fill: "#FFFDF5" });
    pix(doc, "MEDIOS MANIPULADOS", 390, 896, 4, "#666", "middle");
    checkRow(doc, 130, 980, 500, "vídeo editado", true);
    checkRow(doc, 130, 1080, 500, "audio clonado", false);
    checkRow(doc, 130, 1180, 500, "imagen", true);
    const gap = E("g", {}, g);
    E("path", { d: "M640 1110 C760 1090 820 1080 900 1096", ...stroke(RED, 9) }, gap);
    paper(gap, 740, 950, 270, 130, { seed: 8321, fill: INK });
    T(gap, "el hueco", 875, 1030, { f: SERIF, s: 50, i: 1, a: "middle", c: "#FFD23F" });
    const wv = E("g", {}, g);
    const w2 = wave(wv, 740, 1140, 260, 110, 14, "#FFFDF5");
    S.piece(doc, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(gap, { at: 2.6, from: "right", dist: 380, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8301 });
    T(cl, "no era legal ni ilegal:", 540, 278, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "es que no estaba", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => w2.set(t, .8);
  } });

// 4 — verificarlo costó horas
DEF.push({ bg: "#13825A", tr: "right",
  strip: { color: "#CFF75A", word: "Horas", wordColor: INK, cx: 540, cy: 600, size: 280, wx: -120, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LO VERIFICARON", x: 96, y: 1392, r: -4 },
  cap: ["Tres días antes había caído otro, y verificarlo les llevó horas:", "rastrear la cuenta anónima, llamar a expertos y pasar un clasificador de voz."],
  build(S) {
    const g = S.sub;
    const board = E("g", {}, g);
    paper(board, 70, 850, 940, 470, { seed: 8411, fill: "#EDE6D4" });
    const notes = [["CUENTA ANÓNIMA", 130, 920], ["EXPERTOS", 440, 1000], ["CLASIFICADOR", 700, 900]].map(([tx, x, y], i) => {
      const k = E("g", {}, board);
      paper(k, x, y, 250, 150, { seed: 8421 + i, fill: ["#FFF7B0", "#FFD9E0", "#CFF0FF"][i] });
      pix(k, tx, x + 125, y + 56, tx.length > 11 ? 3 : 4, INK, "middle");
      if (i === 2) T(k, "87% IA", x + 125, y + 126, { s: 40, a: "middle", w: 900, c: RED });
      return k; });
    const threads = [0, 1].map(i => drawable(E("path", { d: i ? "M380 1000 C480 1020 540 1030 570 1020" : "M690 1010 C740 990 790 980 820 1000", ...stroke(RED, 6) }, board)));
    const hours = E("g", {}, g);
    paper(hours, 380, 1160, 320, 150, { seed: 8431, fill: INK });
    T(hours, "horas", 540, 1265, { f: SERIF, s: 60, i: 1, a: "middle", c: "#CFF75A" });
    S.piece(board, { at: .5, from: "bottom", dist: 520, r: -1.5 });
    S.piece(hours, { at: 3.2, from: "bottom", dist: 260, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8401 });
    T(cl, "el bulo tarda segundos;", 540, 278, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "desmentirlo, horas", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      notes.forEach((n, i) => n.style.opacity = eo(seg(t, 1.0 + i * .5, 1.4 + i * .5)).toFixed(2));
      threads.forEach((th, i) => th.set(seg(t, 1.8 + i * .4, 2.4 + i * .4)));
    };
  } });

// 5 — la etiqueta
DEF.push({ bg: "#C62828", tr: "left",
  strip: { color: "#1B1B1B", word: "La etiqueta", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 210, wx: -20, maxW: 960, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "TEXTUAL", x: 96, y: 1392, r: -4 },
  cap: ["La etiqueta que acabó encima de aquel audio decía", "que «la foto o imagen» había sido editada."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 80, 860, 920, 430, { seed: 8511, fill: "#FFFDF5" });
    const w3 = wave(card, 130, 900, 820, 130, 30, "#C9C2B4");
    E("rect", { x: 130, y: 1070, width: 820, height: 170, rx: 10, fill: "#EEF1F5", stroke: "#C9D2DC", "stroke-width": 4 }, card);
    E("circle", { cx: 200, cy: 1155, r: 30, fill: "#6A7382" }, card);
    T(card, "!", 200, 1172, { s: 46, a: "middle", c: "#fff", w: 900 });
    T(card, "la foto o imagen ha sido editada", 580, 1140, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(card, "de forma que podría inducir a error", 580, 1200, { f: SERIF, s: 36, i: 1, a: "middle", c: "#555" });
    const ring = hcircle(g, 420, 1138, 190, 44, { seed: 3, c: RED, w: 9 });
    const ar = harrow(g, 300, 1010, 400, 1096, { c: RED, w: 8, bend: -.2, hl: 28 });
    S.piece(card, { at: .5, from: "bottom", dist: 520, r: -1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8501 });
    T(cl, "ni siquiera había", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "una etiqueta para el audio", 540, 352, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { w3.set(t, .55); ar.set(seg(t, 1.8, 2.4)); ring.set(seg(t, 2.6, 3.6)); };
  } });

// 6 — el segundo 15 de 20
DEF.push({ bg: "#6A3BDE", tr: "right",
  strip: { color: "#FFD23F", word: "Segundo 15", wordColor: INK, cx: 540, cy: 600, size: 205, wx: -10, maxW: 960, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "DE 20 SEGUNDOS", x: 96, y: 1392, r: -4 },
  cap: ["Un partido de extrema derecha publicó dos vídeos con voces clonadas,", "y el aviso de que eran ficticias no aparecía hasta el segundo 15 de 20."],
  build(S) {
    const g = S.sub;
    const vid = E("g", {}, g);
    paper(vid, 90, 860, 900, 300, { seed: 8611, fill: "#1B2330" });
    const w4 = wave(vid, 140, 900, 800, 140, 26, "#8FA4C0");
    const note = E("g", {}, vid);
    E("rect", { x: 250, y: 1060, width: 580, height: 62, rx: 8, fill: "#000", opacity: .85 }, note);
    T(note, "«estas voces son ficticias»", 540, 1104, { f: SERIF, s: 34, i: 1, a: "middle", c: "#fff" });
    const bar = E("g", {}, g);
    E("rect", { x: 120, y: 1230, width: 840, height: 34, rx: 17, fill: "#D8D2C4" }, bar);
    const fill = E("rect", { x: 120, y: 1230, width: 0, height: 34, rx: 17, fill: "#FFD23F" }, bar);
    E("line", { x1: 750, y1: 1206, x2: 750, y2: 1288, ...stroke(RED, 7) }, bar);
    pix(bar, "SEG. 15", 750, 1310, 4, "#FFFDF5", "middle");
    pix(bar, "0", 120, 1186, 4, "#FFFDF5");
    pix(bar, "20", 930, 1186, 4, "#FFFDF5");
    S.piece(vid, { at: .5, from: "top", dist: 420, r: -1.5 });
    S.piece(bar, { at: 1.4, from: "bottom", dist: 300, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8601 });
    T(cl, "avisaban, sí:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "cuando ya habías oído", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      w4.set(t, .8);
      const q = clamp(seg(t, 1.8, 4.3));
      fill.setAttribute("width", (840 * q).toFixed(1));
      note.style.opacity = (q > .75 ? 1 : 0).toString();
    };
  } });

// 7 — ganó SMER, sin pruebas sobre el audio
DEF.push({ bg: "#E2641A", tr: "left",
  strip: { color: "#FFFDF5", word: "Sin pruebas", wordColor: INK, cx: 540, cy: 600, size: 205, wx: -10, maxW: 960, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "GANÓ SMER", x: 96, y: 1392, r: -4 },
  cap: ["Ganó el partido que pedía cortar la ayuda militar a Ucrania,", "y nadie ha demostrado que el audio moviera un solo voto."],
  build(S) {
    const g = S.sub;
    const bx = E("g", {}, g); ballotBox(bx, 300, 1120, .92);
    const fl = E("g", {}, g); slovakFlag(fl, 620, 850, 230, 8711);
    const q = E("g", {}, g);
    paper(q, 600, 1050, 400, 290, { seed: 8721, fill: "#FFFDF5" });
    T(q, "?", 800, 1230, { s: 160, a: "middle", w: 900, c: RED });
    pix(q, "¿CAMBIÓ ALGO?", 800, 1280, 4, INK, "middle");
    const note = E("g", {}, g);
    paper(note, 70, 850, 440, 116, { seed: 8731, fill: INK });
    T(note, "no hay forma de saberlo", 290, 922, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bx, { at: .5, from: "bottom", dist: 480, r: -2 });
    S.piece(fl, { at: 1.3, from: "top", dist: 360, r: 2 });
    S.piece(q, { at: 2.2, from: "right", dist: 400, r: 1.5 });
    S.piece(note, { at: 3.4, from: "top", dist: 320, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 8701 });
    T(cl, "el vídeo no dice", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "que decidiera la elección", 540, 352, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 8 — el otro daño
DEF.push({ bg: "#13735E", tr: "right",
  strip: { color: "#FFD23F", word: "Negarlo todo", wordColor: INK, cx: 540, cy: 590, size: 195, wx: 0, maxW: 960, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "EL OTRO DAÑO", x: 96, y: 1392, r: -4 },
  cap: ["Lo más duradero no es que te crean un audio falso:", "es que ya se puede negar uno verdadero diciendo que es IA."],
  build(S) {
    const g = S.sub;
    const rec = E("g", {}, g);
    paper(rec, 90, 870, 820, 330, { seed: 8811, fill: "#FFFDF5" });
    pix(rec, "GRABACIÓN AUTÉNTICA", 500, 912, 4, "#666", "middle");
    const w5 = wave(rec, 140, 980, 720, 150, 26, "#2E6FB8");
    const stamp = E("g", {}, g);
    E("rect", { x: 360, y: 1010, width: 400, height: 150, rx: 10, fill: "none", stroke: RED, "stroke-width": 12 }, stamp);
    pix(stamp, "ES IA", 560, 1062, 9, RED, "middle");
    const law = E("g", {}, g);
    paper(law, 150, 1240, 760, 150, { seed: 8821, fill: INK });
    T(law, "desde agosto de 2026 hay que etiquetarlos", 530, 1300, { s: 32, a: "middle", c: "#FFD23F", w: 700 });
    T(law, "pero esto no lo arregla una etiqueta", 530, 1356, { f: SERIF, s: 34, i: 1, a: "middle", c: "#fff" });
    S.piece(rec, { at: .6, from: "left", dist: 480, r: -2 });
    S.piece(law, { at: 3.0, from: "bottom", dist: 300, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 8801 });
    T(cl, "el daño no es creerlo:", 540, 268, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "es no creer nada", 540, 336, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      w5.set(t, .85);
      const q = eb(seg(t, 2.0, 2.5));
      stamp.style.opacity = q > 0 ? 1 : 0;
      sxf(stamp, 560, 1085, 1 + (1 - q) * .7, -9);
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
      ["WIRED, octubre de 2023", "Los audios falsos de las elecciones eslovacas"],
      ["30 de septiembre de 2023", "El audio apareció dos días antes, en la moratoria de 48 horas"],
      ["AFP", "Su departamento de verificación vio señales de manipulación con IA"],
      ["La norma de Meta", "Cubría solo vídeos; un audio clonado no la incumplía"],
      ["Demagog", "Rastrearon la cuenta, llamaron a expertos y usaron un clasificador"],
      ["Republika", "Aviso de voces ficticias en el segundo 15 de un vídeo de 20"],
      ["El resultado", "Ganó SMER; nadie ha demostrado que el audio cambiara votos"],
      ["Reglamento Europeo de IA", "Desde el 2 de agosto de 2026 hay que etiquetar los deepfakes"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 30, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 26, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
