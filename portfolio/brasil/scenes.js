// «No falsificaron al candidato»: scenes (inserted into the paper-collage engine by build.py)
// Rules kept throughout: no likeness of the news anchor and no likeness of either candidate is
// drawn — drawing their faces would repeat the very thing the film is about. The fabricated
// "neighbours" are drawn as faceless paper cut-outs, always carrying a visible IA mark.
const DEF = [];

// ---------- props ----------
// the Brazilian flag: green field, yellow rhombus, blue globe with its white band
function brFlag(g, x, y, w, seed, o = {}) {
  const k = E("g", {}, g), h = w * .7, cx = x + w / 2, cy = y + h / 2, r = w * .175;
  if (o.paper !== false) paper(k, x, y, w, h, { seed: seed || 1, fill: "#009739" });
  else E("rect", { x, y, width: w, height: h, fill: "#009739" }, k);
  const m = w * .085, dw = w / 2 - m, dh = h / 2 - m * .7;
  E("path", { d: `M${cx} ${y + m * .7} L${x + w - m} ${cy} L${cx} ${y + h - m * .7} L${x + m} ${cy} Z`, fill: "#FEDD00" }, k);
  E("circle", { cx, cy, r, fill: "#012169" }, k);
  const cid = "br" + (UID++), cp = E("clipPath", { id: cid }, k); E("circle", { cx, cy, r }, cp);
  const band = E("g", { "clip-path": `url(#${cid})` }, k);
  E("path", { d: `M${cx - r * 1.3} ${cy + r * .62} Q${cx} ${cy - r * .52} ${cx + r * 1.3} ${cy + r * .28} L${cx + r * 1.3} ${cy + r * .62} Q${cx} ${cy - r * .18} ${cx - r * 1.3} ${cy + r * .96} Z`, fill: "#fff" }, band);
  const rr = rng(seed || 3);
  for (let i = 0; i < 14; i++) {
    const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * .9, sx = cx + Math.cos(a) * d, sy = cy + Math.sin(a) * d;
    if (sy > cy - r * .1 && sy < cy + r * .75 && Math.abs(sx - cx) < r * 1.1) continue;
    star(band, sx, sy, Math.max(2.4, r * .07 * (.6 + rr())), "#fff");
  }
  return k;
}

// a crossed-out claim stamp
function stamp(g, cx, cy, txt, rot, col) {
  const k = E("g", {}, g), w = textW(txt, 40, SANS, false) + 56;
  const b = E("g", { transform: `rotate(${rot} ${cx} ${cy})` }, k);
  E("rect", { x: cx - w / 2, y: cy - 40, width: w, height: 80, rx: 8, fill: "none", stroke: col, "stroke-width": 7 }, b);
  T(b, txt, cx, cy + 14, { s: 40, a: "middle", c: col });
  return k;
}

// a faceless cut-out person: this film never draws a face
function figure(g, cx, cy, s, col, seed) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g), r = rng(seed || 2);
  E("path", { d: "M-78 160 C-78 70 -44 24 0 24 C44 24 78 70 78 160 Z", fill: col, stroke: "#fff", "stroke-width": 8 }, k);
  E("circle", { cx: 0, cy: -34, r: 58, fill: "#C9C2B0", stroke: "#fff", "stroke-width": 8 }, k);
  // deliberately blank: a smudge where the face would be
  E("ellipse", { cx: 0, cy: -30, rx: 34, ry: 40, fill: "#B5AE9C" }, k);
  for (let i = 0; i < 3; i++) E("path", { d: `M${-26 + i * 4} ${-56 + i * 26} q26 ${6 + r() * 10} 52 0`, ...stroke("#9A9484", 5) }, k);
  return k;
}

// a microphone held into frame, the street-interview tell
function micro(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -22, y: 0, width: 44, height: 150, rx: 10, fill: "#2B313A", stroke: "#11161C", "stroke-width": 5 }, k);
  E("rect", { x: -34, y: -70, width: 68, height: 86, rx: 22, fill: "#4A5560", stroke: "#11161C", "stroke-width": 5 }, k);
  for (let i = 0; i < 4; i++) E("path", { d: `M-30 ${-56 + i * 20} L30 ${-56 + i * 20}`, ...stroke("#2B313A", 4) }, k);
  return k;
}

// the little corner mark platforms add — or fail to add
function iaTag(g, x, y, px, on) {
  const k = E("g", {}, g), t = "HECHO CON IA", w = pixW(t, px) + px * 6, h = 7 * px + px * 5;
  E("rect", { x, y, width: w, height: h, rx: 4, fill: on ? INK : "none", stroke: on ? "none" : RED, "stroke-width": 4, "stroke-dasharray": on ? "none" : "9 7" }, k);
  if (on) pix(k, t, x + px * 3, y + px * 2.5, px, "#fff");
  return k;
}

// a phone-shaped card to hold a video still
function phone(g, x, y, w, h, seed, fill) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#15191F" });
  E("rect", { x: x + 16, y: y + 16, width: w - 32, height: h - 86, rx: 8, fill: fill || "#2B313A" }, k);
  return k;
}

// =====================================================================
// 1 — el domingo
DEF.push({ bg: "#0B3D2C", tr: "left",
  strip: { color: "#FEDD00", word: "47-45", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -60, maxW: 920, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "PRIMERA VUELTA", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["El domingo Brasil votó para presidente: Flávio Bolsonaro 47%, Lula 45%.",
        "Hay segunda vuelta el 25 de octubre."],
  build(S) {
    const g = S.sub;
    const fl = E("g", {}, g);
    brFlag(fl, 190, 850, 400, 3011);
    S.piece(fl, { at: .5, from: "top", dist: 400, r: -1 });
    const bars = [["47%", "#1B4FA0", 120, 0], ["45%", RED, 640, 1]].map(([t, c, x, i]) => {
      const k = E("g", {}, g);
      paper(k, x, 1175, 320, 175, { seed: 3021 + i, fill: "#FFFDF5" });
      T(k, t, x + 160, 1276, { f: SERIF, s: 72, i: 1, a: "middle", c });
      T(k, i ? "segundo" : "primero", x + 160, 1324, { s: 26, a: "middle", c: "#555" });
      S.piece(k, { at: 1.8 + i * .5, from: "bottom", dist: 280, r: -1 + i * 1.6 });
      return k; });
    const dt = E("g", {}, g);
    paper(dt, 700, 916, 280, 150, { seed: 3031, fill: INK });
    pix(dt, "25 OCT", 840, 962, 5, "#FEDD00", "middle");
    T(dt, "segunda vuelta", 840, 1042, { s: 25, a: "middle", c: "#CFC8B8" });
    S.piece(dt, { at: 3.4, from: "pop", r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 3001 });
    T(cl, "dos puntos separan", 540, 272, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "a los dos candidatos", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 2 — el falso fácil
DEF.push({ bg: "#2A1B4A", tr: "right",
  strip: { color: "#FFFDF5", word: "Fácil", wordColor: INK, cx: 540, cy: 590, size: 280, wx: -40, maxW: 880, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "EL QUE SÍ DUDAS", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Uno pensaría que el peligro es un vídeo falso del candidato diciendo algo horrible.",
        "Ese es el más fácil de dudar: sabes que alguien quiere hacerle daño."],
  build(S) {
    const g = S.sub;
    const ph = phone(g, 290, 840, 500, 420, 3111, "#3A4450");
    E("rect", { x: 330, y: 880, width: 420, height: 250, rx: 8, fill: "#55606C" }, ph);
    T(ph, "«dice algo", 540, 958, { f: SERIF, s: 50, i: 1, a: "middle", c: "#fff" });
    T(ph, "horrible»", 540, 1020, { f: SERIF, s: 50, i: 1, a: "middle", c: "#FEDD00" });
    E("rect", { x: 420, y: 1050, width: 240, height: 52, rx: 4, fill: "#FFFDF5" }, ph);
    pix(ph, "EL CANDIDATO", 540, 1064, 3, INK, "middle");
    S.piece(ph, { at: .5, from: "bottom", dist: 420, r: -1 });
    const st = E("g", {}, g);
    const sb = E("g", { transform: "rotate(-9 540 1196)" }, st);
    E("rect", { x: 290, y: 1148, width: 500, height: 96, rx: 10, fill: "none", stroke: RED, "stroke-width": 9 }, sb);
    T(sb, "esto sí lo dudas", 540, 1214, { s: 46, a: "middle", c: RED });
    S.piece(st, { at: 2.6, from: "pop", r: 0 });
    const bt = E("g", {}, g);
    paper(bt, 130, 1296, 820, 92, { seed: 3121, fill: INK });
    T(bt, "sabes que alguien quiere hacerle daño", 540, 1356, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFFDF5" });
    S.piece(bt, { at: 3.8, from: "bottom", dist: 240, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 3101 });
    T(cl, "el peligro no era", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "el candidato falso", 540, 348, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 3 — los vecinos que no existen
DEF.push({ bg: "#8C1A2B", tr: "left",
  strip: { color: "#FEDD00", word: "Cincuenta", wordColor: INK, cx: 540, cy: 590, size: 225, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "AOS FATOS", x: 96, y: 1392, r: -4 },
  cap: ["Lo que circuló fue otra cosa: Aos Fatos encontró 50 vídeos con formato de",
        "entrevista en la calle. Ninguna de esas personas existe."],
  build(S) {
    const g = S.sub;
    const figs = [["#1B4FA0", 230, 3211], ["#E7A33A", 540, 3212], ["#2E7D4F", 850, 3213]].map(([c, x, sd], i) => {
      const k = E("g", {}, g);
      figure(k, x, 1060, .86, c, sd);
      micro(k, x - 120, 1090, .72);
      iaTag(k, x - 92, 1256, 2, false);
      T(k, "no existe", x, 1356, { f: SERIF, s: 34, i: 1, a: "middle", c: "#FFFDF5" });
      S.piece(k, { at: .8 + i * .55, from: "bottom", dist: 340, r: -1 + i * .9 });
      return k; });
    const fg = E("g", {}, g);
    brFlag(fg, 830, 840, 180, 3221);
    S.piece(fg, { at: 2.8, from: "right", dist: 300, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3201 });
    T(cl, "50 entrevistas de calle", 540, 268, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "con vecinos que", 540, 332, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "nunca existieron", 540, 396, { f: SERIF, s: 46, i: 1, a: "middle", c: "#FEDD00" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 4 — 7,4 millones
DEF.push({ bg: "#13273D", tr: "right",
  strip: { color: "#CFF75A", word: "7,4 M", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -60, maxW: 920, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "ANTES DE BORRARLOS", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["Juntaron 7,4 millones de visualizaciones antes de que TikTok los borrara.",
        "En casi uno de cada cinco ni siquiera avisaban de que estaban hechos con IA."],
  build(S) {
    const g = S.sub;
    const vc = E("g", {}, g);
    paper(vc, 90, 860, 520, 240, { seed: 3311, fill: "#FFFDF5" });
    pix(vc, "VISUALIZACIONES", 130, 900, 3, INK);
    const num = T(vc, "", 350, 1030, { f: SERIF, s: 84, i: 1, a: "middle", c: RED });
    S.piece(vc, { at: .5, from: "left", dist: 450, r: -1.5 });
    const rm = E("g", {}, g);
    paper(rm, 660, 860, 320, 240, { seed: 3321, fill: INK });
    T(rm, "retirados", 820, 960, { f: SERIF, s: 42, i: 1, a: "middle", c: "#fff" });
    T(rm, "por la", 820, 1010, { s: 26, a: "middle", c: "#CFC8B8" });
    T(rm, "plataforma", 820, 1050, { s: 26, a: "middle", c: "#CFC8B8" });
    const xd = drawable(E("path", { d: "M690 886 L954 1072 M954 886 L690 1072", ...stroke(RED, 10) }, rm));
    S.piece(rm, { at: 1.8, from: "right", dist: 380, r: 1.2 });
    // one in five with no warning
    const row = E("g", {}, g), tags = [];
    paper(row, 90, 1160, 890, 230, { seed: 3331, fill: "#E7E2D6" });
    T(row, "casi 1 de cada 5 iba sin aviso", 535, 1226, { s: 32, a: "middle", c: "#333" });
    for (let i = 0; i < 5; i++) tags.push(iaTag(row, 130 + i * 172, 1276, 2, i !== 4));
    S.piece(row, { at: 3.2, from: "bottom", dist: 280, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 3301 });
    T(cl, "ya los habías visto", 540, 272, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "cuando los borraron", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q = eo(seg(t, .9, 3.0));
      num.textContent = q > .02 ? fmt(7400000 * q) : "";
      xd.set(seg(t, 2.4, 3.2));
      tags.forEach((k, i) => k.style.opacity = eo(seg(t, 3.9 + i * .18, 4.2 + i * .18)).toFixed(2));
    };
  } });

// 5 — casi uno por hora
DEF.push({ bg: "#13402E", tr: "left",
  strip: { color: "#FFFDF5", word: "920", wordColor: INK, cx: 540, cy: 590, size: 280, wx: -30, maxW: 880, from: -1 },
  sub: { x: 40, y: 780, w: 1000, h: 660 },
  label: { text: "SEIS SEMANAS", x: 96, y: 1392, r: -4 },
  cap: ["El proyecto VigIA, de la agencia Lupa con la Unicamp, contó 920 contenidos",
        "electorales con IA en seis semanas: casi uno por hora."],
  build(S) {
    const g = S.sub;
    const gd = E("g", {}, g);
    E("path", { d: torn(80, 840, 600, 420, 3411, 8, 24), fill: "url(#gPaper)" }, gd);
    const dots = [];
    for (let i = 0; i < 230; i++) {
      const c = i % 23, r = Math.floor(i / 23);
      dots.push(E("rect", { x: 118 + c * 23, y: 900 + r * 32, width: 15, height: 22, rx: 3, fill: i % 7 === 0 ? RED : "#2E7D4F" }, gd));
    }
    pix(gd, "920 CONTENIDOS CON IA", 118, 862, 3, INK);
    S.piece(gd, { at: .5, from: "left", dist: 460, r: -1.5 });
    const ck = E("g", {}, g);
    paper(ck, 730, 860, 250, 250, { seed: 3421, fill: "#FFFDF5" });
    E("circle", { cx: 855, cy: 985, r: 92, fill: "none", stroke: INK, "stroke-width": 8 }, ck);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6;
      E("path", { d: `M${855 + Math.sin(a) * 76} ${985 - Math.cos(a) * 76} L${855 + Math.sin(a) * 88} ${985 - Math.cos(a) * 88}`, ...stroke(INK, 5) }, ck); }
    const hand = E("path", { d: "M855 985 L855 925", ...stroke(RED, 8) }, ck);
    E("circle", { cx: 855, cy: 985, r: 10, fill: INK }, ck);
    S.piece(ck, { at: 1.8, from: "right", dist: 360, r: 1.2 });
    const lb = E("g", {}, g);
    paper(lb, 120, 1300, 840, 120, { seed: 3431, fill: INK });
    T(lb, "casi un contenido con IA por hora", 540, 1376, { f: SERIF, s: 44, i: 1, a: "middle", c: "#CFF75A" });
    S.piece(lb, { at: 3.4, from: "bottom", dist: 240, r: -1 });
    const fg = E("g", {}, g);
    brFlag(fg, 740, 1150, 230, 3441);
    S.piece(fg, { at: 2.6, from: "right", dist: 320, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 3401 });
    T(cl, "no fueron dos vídeos:", 540, 272, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "fue una inundación", 540, 348, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      dots.forEach((d, i) => d.style.opacity = clamp(seg(t, .8 + i * .012, 1.0 + i * .012)).toFixed(2));
      hand.setAttribute("transform", `rotate(${(t * 120).toFixed(1)} 855 985)`);
    };
  } });

// 6 — seis de cada diez sin etiqueta
DEF.push({ bg: "#5E1540", tr: "right",
  strip: { color: "#FEDD00", word: "6 de 10", wordColor: INK, cx: 540, cy: 595, size: 240, wx: -60, maxW: 940, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "SIN ETIQUETA", x: 96, y: 1392, r: -4 },
  cap: ["Seis de cada diez no llevaban la etiqueta que exige la ley electoral brasileña.",
        "554 eran deepfakes y 29 salieron de perfiles oficiales de candidatos o partidos."],
  build(S) {
    const g = S.sub;
    const row = E("g", {}, g), tg = [];
    paper(row, 80, 850, 900, 300, { seed: 3511, fill: "#FFFDF5" });
    pix(row, "LA LEY ELECTORAL LA EXIGE", 120, 890, 3, INK);
    for (let i = 0; i < 10; i++) {
      const x = 132 + (i % 5) * 168, y = 952 + Math.floor(i / 5) * 86;
      tg.push(iaTag(row, x, y, 2, i < 4));
    }
    S.piece(row, { at: .5, from: "top", dist: 400, r: -1 });
    const cards = [["554", "deepfakes", RED, 90], ["29", "de perfiles oficiales", "#1B4FA0", 560]].map(([n, s, c, x], i) => {
      const k = E("g", {}, g);
      paper(k, x, 1190, 410, 200, { seed: 3521 + i, fill: i ? "#FEDD00" : "#FFFDF5" });
      T(k, n, x + 205, 1296, { f: SERIF, s: 74, i: 1, a: "middle", c });
      T(k, s, x + 205, 1352, { s: 28, a: "middle", c: "#333" });
      S.piece(k, { at: 2.6 + i * .6, from: "bottom", dist: 280, r: -1 + i * 1.4 });
      return k; });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 3501 });
    T(cl, "la etiqueta es obligatoria", 540, 272, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "y casi nadie la pone", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => tg.forEach((k, i) => k.style.opacity = eo(seg(t, .9 + i * .13, 1.2 + i * .13)).toFixed(2));
  } });

// 7 — la encuesta que nunca existió
DEF.push({ bg: "#1A2340", tr: "left",
  strip: { color: "#FFFDF5", word: "55-45", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -60, maxW: 920, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "NUNCA EXISTIÓ", x: 96, y: 1392, r: -4 },
  cap: ["En uno, una presentadora del telediario de la Band anunciaba una encuesta: 55 a 45.",
        "No existió. La Lupa buscó el original: era una emisión de diciembre."],
  build(S) {
    const g = S.sub;
    // a news studio reduced to desk, screen and a faceless silhouette
    const tv = E("g", {}, g);
    paper(tv, 80, 880, 560, 390, { seed: 3611, fill: "#15191F" });
    E("rect", { x: 110, y: 910, width: 500, height: 290, rx: 8, fill: "#223049" }, tv);
    figure(tv, 230, 1036, .5, "#B33", 3615);
    E("rect", { x: 110, y: 1130, width: 500, height: 70, rx: 4, fill: "#0E1522" }, tv);
    pix(tv, "ENCUESTA", 132, 1148, 4, "#FEDD00");
    const b1 = E("rect", { x: 390, y: 1004, width: 0, height: 32, fill: "#1B4FA0" }, tv);
    const b2 = E("rect", { x: 390, y: 1054, width: 0, height: 32, fill: RED }, tv);
    T(tv, "55", 368, 1032, { f: SERIF, s: 36, i: 1, a: "end", c: "#fff" });
    T(tv, "45", 368, 1082, { f: SERIF, s: 36, i: 1, a: "end", c: "#fff" });
    iaTag(tv, 124, 928, 2, false);
    S.piece(tv, { at: .5, from: "left", dist: 470, r: -1.5 });
    const st = E("g", {}, g);
    stamp(st, 830, 898, "no existió", -8, RED);
    S.piece(st, { at: 2.4, from: "pop", r: 0 });
    const or = E("g", {}, g);
    paper(or, 680, 1020, 300, 180, { seed: 3621, fill: "#FFFDF5" });
    pix(or, "EL ORIGINAL", 702, 1052, 3, INK);
    T(or, "una emisión", 830, 1128, { f: SERIF, s: 34, i: 1, a: "middle" });
    T(or, "de diciembre", 830, 1174, { f: SERIF, s: 34, i: 1, a: "middle", c: RED });
    S.piece(or, { at: 3.8, from: "right", dist: 340, r: 1.2 });
    const bt = E("g", {}, g);
    paper(bt, 120, 1268, 840, 112, { seed: 3631, fill: INK });
    T(bt, "búsqueda inversa: apareció el vídeo real", 540, 1340, { f: SERIF, s: 38, i: 1, a: "middle", c: "#FEDD00" });
    S.piece(bt, { at: 4.8, from: "bottom", dist: 240, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 3601 });
    T(cl, "una cara de confianza", 540, 272, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "leyendo una mentira", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      b1.setAttribute("width", (eo(seg(t, .9, 1.7)) * 190).toFixed(1));
      b2.setAttribute("width", (eo(seg(t, 1.2, 2.0)) * 156).toFixed(1));
    };
  } });

// 8 — la comprobación
DEF.push({ bg: "#0B3D2C", tr: "right",
  strip: { color: "#FEDD00", word: "Compruébalo", wordColor: INK, cx: 540, cy: 585, size: 200, wx: -30, maxW: 960, from: 1 },
  sub: { x: 30, y: 780, w: 1020, h: 660 },
  label: { text: "ANTES DE REENVIAR", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["El truco ya no es mentir en boca del candidato: es ponerla en boca de alguien",
        "en quien ya confías. Si te llega algo enorme, búscalo en la web del noticiero."],
  build(S) {
    const g = S.sub;
    const fw = E("g", {}, g);
    paper(fw, 70, 850, 420, 300, { seed: 3711, fill: "#E7E2D6" });
    pix(fw, "REENVIADO", 108, 886, 3, "#777");
    E("rect", { x: 104, y: 944, width: 350, height: 54, rx: 10, fill: "#FFFDF5", stroke: "#BFB8A6", "stroke-width": 4 }, fw);
    E("rect", { x: 104, y: 1014, width: 280, height: 54, rx: 10, fill: "#FFFDF5", stroke: "#BFB8A6", "stroke-width": 4 }, fw);
    E("rect", { x: 104, y: 1084, width: 320, height: 40, rx: 10, fill: "#C9C2B0" }, fw);
    S.piece(fw, { at: .5, from: "left", dist: 440, r: -1.5 });
    const br = E("g", {}, g);
    paper(br, 580, 850, 420, 300, { seed: 3721, fill: "#FFFDF5" });
    E("rect", { x: 610, y: 884, width: 360, height: 56, rx: 28, fill: "#E7E2D6", stroke: "#BFB8A6", "stroke-width": 4 }, br);
    E("circle", { cx: 648, cy: 912, r: 13, fill: "none", stroke: "#555", "stroke-width": 5 }, br);
    E("path", { d: "M658 922 L672 936", ...stroke("#555", 5) }, br);
    pix(br, "LA WEB DEL NOTICIERO", 684, 904, 2, "#555");
    T(br, "si lo dijo de verdad,", 790, 1016, { f: SERIF, s: 34, i: 1, a: "middle" });
    T(br, "va a estar ahí", 790, 1066, { f: SERIF, s: 36, i: 1, a: "middle", c: "#1B4FA0" });
    S.piece(br, { at: 2.2, from: "right", dist: 400, r: 1.2 });
    const fg = E("g", {}, g);
    brFlag(fg, 440, 1180, 190, 3731);
    S.piece(fg, { at: 3.6, from: "pop", r: 1 });
    const bt = E("g", {}, g);
    paper(bt, 90, 1250, 320, 150, { seed: 3741, fill: INK });
    T(bt, "¿y ese señor", 250, 1310, { f: SERIF, s: 34, i: 1, a: "middle", c: "#fff" });
    T(bt, "existe?", 250, 1360, { f: SERIF, s: 38, i: 1, a: "middle", c: "#FEDD00" });
    S.piece(bt, { at: 4.2, from: "bottom", dist: 250, r: -1 });
    const b2 = E("g", {}, g);
    paper(b2, 660, 1250, 320, 150, { seed: 3751, fill: INK });
    T(b2, "si solo existe", 820, 1310, { f: SERIF, s: 32, i: 1, a: "middle", c: "#fff" });
    T(b2, "en el reenvío, no", 820, 1360, { f: SERIF, s: 32, i: 1, a: "middle", c: RED });
    S.piece(b2, { at: 4.8, from: "bottom", dist: 250, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 3701 });
    T(cl, "no te mienten en boca", 540, 268, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "del candidato: lo hacen", 540, 332, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "en boca de quien confías", 540, 396, { f: SERIF, s: 44, i: 1, a: "middle", c: "#FEDD00" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const ar = harrow(g, 500, 1000, 572, 1000, { c: RED, w: 9, bend: -.35 });
    return (t) => ar.set(seg(t, 2.6, 3.3));
  } });

// fin — fuentes
DEF.push({ bg: "#151515", tr: "left", dur: 7.5,
  strip: { color: RED, word: "Fuentes", wordColor: "#FFFDF5", cx: 540, cy: 330, size: 250, wx: -40, h: 280, from: -1 },
  sub: { x: 50, y: 520, w: 980, h: 1110, at: .4 },
  label: { text: "VERIFICADO", x: 640, y: 150, r: 4, px: 6, at: 1.2 },
  cap: [],
  build(S) {
    const g = S.sub;
    E("path", { d: torn(70, 545, 940, 1060, 3831, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["Primera vuelta", "TSE, 4 de octubre de 2026: Flávio Bolsonaro 47,2% y Lula 44,9% de los válidos"],
      ["Los votantes falsos", "Aos Fatos, 24 de agosto: 50 vídeos de falsas entrevistas, 7,4 millones de visitas"],
      ["Sin aviso", "En el 18% no había ninguna indicación de que fueran generados con IA"],
      ["TikTok", "Retiró todos los contenidos señalados por infringir sus normas"],
      ["VigIA", "Agencia Lupa y Recod.ai (Unicamp): 920 contenidos del 16 de agosto al 28 de septiembre"],
      ["La etiqueta", "Solo 371 de los 920 estaban señalados; 554 eran deepfakes"],
      ["Perfiles oficiales", "29 deepfakes salieron de perfiles de candidatos o partidos; 525, de usuarios"],
      ["La encuesta falsa", "Lupa, 8 de septiembre: búsqueda inversa y un detector de IA; el original era de diciembre"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 28, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 24, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 170);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja la cara de ninguna", 540, 1686, { s: 28, w: 600, c: "#ddd", a: "middle" });
    T(fl, "persona real: ni de los candidatos ni de la presentadora.", 540, 1732, { s: 28, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
