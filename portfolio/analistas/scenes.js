// «El trabajo que enseñaba el oficio»: scenes (inserted into the paper-collage engine by build.py)
// Nobody is drawn: the executives quoted are real people, so their words go on cards, not in mouths.
// The analysts are anonymous paper figures.
const DEF = [];

// ---------- props ----------
function laptop(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-230 120 L230 120 L270 170 L-270 170 Z", fill: "#B9C0C8", stroke: "#6E7884", "stroke-width": 6 }, k);
  E("rect", { x: -210, y: -160, width: 420, height: 282, rx: 12, fill: "#2B3038", stroke: "#15181C", "stroke-width": 6 }, k);
  const scr = E("g", {}, k);
  E("rect", { x: -188, y: -138, width: 376, height: 238, rx: 6, fill: "#EEF1F5" }, scr);
  E("rect", { x: -170, y: -120, width: 160, height: 14, rx: 7, fill: "#C3BCAE" }, scr);
  E("rect", { x: -170, y: -92, width: 130, height: 100, rx: 6, fill: "#9FC3DE" }, scr);
  for (let i = 0; i < 4; i++) E("rect", { x: -20, y: -92 + i * 28, width: 190 - i * 30, height: 14, rx: 7, fill: "#C3BCAE" }, scr);
  for (let i = 0; i < 3; i++) E("rect", { x: -170, y: 24 + i * 24, width: 340 - i * 70, height: 12, rx: 6, fill: "#DCD6C8" }, scr);
  return { k, scr };
}

function mug(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-60 -60 L60 -60 L48 70 L-48 70 Z", fill: "#FFFDF5", stroke: "#B9B3A6", "stroke-width": 6 }, k);
  E("path", { d: "M60 -40 q46 10 36 50 q-10 34 -44 30", ...stroke("#B9B3A6", 10) }, k);
  E("ellipse", { cx: 0, cy: -60, rx: 60, ry: 16, fill: "#6B4A2E" }, k);
  const steam = [];
  for (let i = 0; i < 3; i++) steam.push(E("path", { d: `M${-30 + i * 30} -80 q14 -24 0 -46 q-14 -22 0 -44`, ...stroke("#FFFDF5", 6), opacity: 0 }, k));
  return { k, steam };
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

function cvSheet(g, x, y, w, h, seed, rot) {
  const k = E("g", { }, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  E("circle", { cx: x + 34, cy: y + 34, r: 16, fill: "#DCD6C8" }, k);
  for (let i = 0; i < 4; i++) E("rect", { x: x + 62, y: y + 20 + i * 18, width: w - 90 - (i % 2) * 30, height: 9, rx: 4, fill: "#DCD6C8" }, k);
  if (rot) k.setAttribute("transform", `rotate(${rot} ${x + w / 2} ${y + h / 2})`);
  return k;
}

function figure(g, cx, cy, s, fill) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-50 76 C-46 16 -26 0 0 0 C26 0 46 16 50 76 Z", fill }, k);
  E("circle", { cx: 0, cy: -32, r: 28, fill }, k);
  return k;
}

function docCard(g, x, y, w, h, title, seed, fill) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: fill || "#FFFDF5" });
  E("rect", { x: x + 20, y: y + 20, width: pixW(title, 3) + 18, height: 38, fill: INK }, k);
  pix(k, title, x + 29, y + 30, 3, "#fff");
  for (let i = 0; i < 7; i++) E("rect", { x: x + 24, y: y + 80 + i * 24, width: w - 48 - (i % 3) * 40, height: 11, rx: 5, fill: "#D6D0C2" }, k);
  return k;
}

// =====================================================================
// 1 — las noches en vela
DEF.push({ bg: "#1B2A3C", tr: "left",
  strip: { color: "#FFFDF5", word: "Noches", wordColor: INK, cx: 540, cy: 590, size: 270, wx: -110, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LAS 4 DE LA MAÑANA", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["Noches en vela montando diapositivas, meter números en una hoja de cálculo", "y pulir documentos que quizá no lea nadie."],
  build(S) {
    const g = S.sub;
    E("rect", { x: 40, y: 1310, width: 1000, height: 120, fill: "#2E3A4A" }, g);
    const lp = E("g", {}, g); const { scr } = laptop(lp, 420, 1110, .86);
    const mg = E("g", {}, g); const { steam } = mug(mg, 820, 1230, .62);
    const cl2 = clockFace(g, 860, 930, 92);
    const slides = [0, 1, 2].map(i => { const k = E("g", {}, g);
      paper(k, 90, 860 + i * 70, 180, 60, { seed: 9111 + i, fill: "#FFFDF5" });
      E("rect", { x: 104, y: 876 + i * 70, width: 60, height: 28, rx: 4, fill: "#9FC3DE" }, k);
      E("rect", { x: 174, y: 882 + i * 70, width: 80, height: 10, rx: 5, fill: "#D6D0C2" }, k);
      return k; });
    S.piece(lp, { at: .5, from: "bottom", dist: 520, r: -1.5 });
    S.piece(mg, { at: 1.4, from: "right", dist: 300, r: 2 });
    S.piece(cl2.k, { at: 2.0, from: "top", dist: 320, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9101 });
    T(cl, "el peaje de entrada", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "a la banca de inversión", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cl2.set(Math.PI * .67 + t * .04);
      steam.forEach((s2, i) => s2.setAttribute("opacity", (t > 1.9 ? .35 + .25 * Math.sin(t * 2 + i) : 0).toFixed(2)));
      slides.forEach((s2, i) => s2.style.opacity = eo(seg(t, 2.4 + i * .3, 2.7 + i * .3)).toFixed(2));
    };
  } });

// 2 — doscientas plazas
DEF.push({ bg: "#8E1B2E", tr: "right",
  strip: { color: "#FFD23F", word: "El peaje", wordColor: INK, cx: 540, cy: 600, size: 260, wx: -90, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "200 PLAZAS", x: 96, y: 1392, r: -4 },
  cap: ["Era el peaje para entrar en Wall Street: decenas de miles de aspirantes", "para unas 200 plazas por banco, y más de 100.000 dólares de sueldo inicial."],
  build(S) {
    const g = S.sub;
    const pile = E("g", {}, g);
    const cvs = [];
    for (let i = 0; i < 9; i++) cvs.push(cvSheet(pile, 90 + (i % 3) * 30, 1230 - i * 26, 320, 110, 9211 + i, -6 + (i % 3) * 6));
    const door = E("g", {}, g);
    paper(door, 560, 860, 420, 480, { seed: 9221, fill: "#FFFDF5" });
    E("rect", { x: 620, y: 960, width: 300, height: 56, rx: 10, fill: INK }, door);
    pix(door, "200 PLAZAS", 770, 974, 5, "#FFD23F", "middle");
    T(door, "decenas de miles", 770, 920, { f: SERIF, s: 36, i: 1, a: "middle", c: "#555" });
    const pay = E("g", {}, door);
    E("path", { d: "M650 1080 L890 1080", ...stroke("#C9C2B4", 5) }, pay);
    const n = T(pay, "0 $", 890, 1150, { s: 62, a: "end", w: 900, c: INK });
    pix(pay, "SUELDO INICIAL", 770, 1200, 3, "#666", "middle");
    pix(pay, "MÁS BONUS", 770, 1250, 3, "#666", "middle");
    S.piece(pile, { at: .5, from: "left", dist: 460, r: -2 });
    S.piece(door, { at: 1.6, from: "right", dist: 460, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9201 });
    T(cl, "dos años de infierno", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "a cambio del billete", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cvs.forEach((c, i) => c.style.opacity = seg(t, .9 + i * .09, 1.2 + i * .09).toFixed(2));
      n.textContent = fmt(Math.round(lerp(0, 100000, eo(seg(t, 2.6, 3.8))))) + " $";
    };
  } });

// 3 — menos de un segundo
DEF.push({ bg: "#D9A400", tr: "left",
  strip: { color: "#FFFDF5", word: "Un segundo", wordColor: INK, cx: 540, cy: 600, size: 215, wx: -20, maxW: 960, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "MENOS DE 1 SEG.", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Ahora un banco prueba una herramienta que convierte esa presentación", "en el documento legal de salida a bolsa en menos de un segundo."],
  build(S) {
    const g = S.sub;
    const deck = docCard(g, 70, 900, 270, 360, "PRESENTACIÓN", 9311);
    const box = E("g", {}, g);
    E("rect", { x: 400, y: 960, width: 240, height: 230, rx: 18, fill: "#3B4654", stroke: "#1E2630", "stroke-width": 6 }, box);
    E("rect", { x: 428, y: 990, width: 184, height: 80, rx: 8, fill: "#556375" }, box);
    for (let i = 0; i < 4; i++) E("circle", { cx: 452 + i * 46, cy: 1030, r: 14, fill: i % 2 ? "#FFD23F" : "#CFF75A" }, box);
    pix(box, "IA", 520, 1110, 6, "#FFFDF5", "middle");
    const s1 = docCard(g, 700, 900, 290, 360, "S-1", 9321, "#EAF3E6");
    const a1 = harrow(g, 350, 1080, 395, 1080, { c: RED, w: 9, bend: 0, hl: 26 });
    const a2 = harrow(g, 650, 1080, 695, 1080, { c: RED, w: 9, bend: 0, hl: 26 });
    const watch = E("g", {}, g);
    paper(watch, 360, 1280, 340, 130, { seed: 9331, fill: INK });
    const nt = T(watch, "0,00 s", 530, 1368, { s: 56, a: "middle", w: 900, c: "#FFD23F" });
    S.piece(deck, { at: .5, from: "left", dist: 460, r: -2 });
    S.piece(box, { at: 1.2, from: "top", dist: 320, r: 1 });
    S.piece(s1, { at: 2.2, from: "right", dist: 460, r: 2 });
    S.piece(watch, { at: 3.0, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9301 });
    T(cl, "lo que era un fin de semana", 540, 278, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(cl, "cabe en un parpadeo", 540, 352, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      a1.set(seg(t, 1.6, 2.0)); a2.set(seg(t, 2.4, 2.8));
      nt.textContent = lerp(0, .9, eo(seg(t, 3.2, 4.0))).toFixed(2).replace(".", ",") + " s";
    };
  } });

// 4 — dos tercios
DEF.push({ bg: "#C62828", tr: "right",
  strip: { color: "#1B1B1B", word: "Dos tercios", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 215, wx: -20, maxW: 960, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "SE HA PLANTEADO", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Dentro de esos bancos se ha llegado a plantear recortar hasta dos tercios", "la contratación de analistas junior, y bajarles el sueldo."],
  build(S) {
    const g = S.sub;
    const sheet = E("g", {}, g);
    paper(sheet, 70, 850, 640, 470, { seed: 9411, fill: "#FFFDF5" });
    const figs = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) {
      const i = r * 10 + c;
      figs.push({ el: figure(sheet, 124 + c * 60, 940 + r * 84, .42, "#44566C"), off: i % 3 !== 0 });
    }
    const crossG = E("g", {}, sheet);
    const card = E("g", {}, g);
    paper(card, 740, 930, 270, 300, { seed: 9421, fill: INK });
    const n = T(card, "0", 875, 1070, { s: 92, a: "middle", w: 900, c: "#FFD23F" });
    pix(card, "DE CADA 3", 875, 1110, 3, "#fff", "middle");
    pix(card, "FUERA", 875, 1160, 3, "#fff", "middle");
    S.piece(sheet, { at: .5, from: "left", dist: 540, r: -2 });
    S.piece(card, { at: 2.6, from: "right", dist: 400, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9401 });
    T(cl, "no es un despido:", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "es una puerta que se cierra", 540, 352, { f: SERIF, s: 40, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      figs.forEach((f, i) => { const q = seg(t, .9 + (i % 10) * .04, 1.2 + (i % 10) * .04);
        const gone = f.off ? seg(t, 1.8 + (i % 7) * .09, 2.2 + (i % 7) * .09) : 0;
        f.el.setAttribute("opacity", (q * (1 - gone * .85)).toFixed(2)); });
      n.textContent = Math.round(lerp(0, 2, eo(seg(t, 3.0, 3.8))));
    };
  } });

// 5 — las dos frases
DEF.push({ bg: "#2B6F4E", tr: "left",
  strip: { color: "#CFF75A", word: "Dos frases", wordColor: INK, cx: 540, cy: 600, size: 225, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "TEXTUAL", x: 96, y: 1392, r: -4 },
  cap: ["Un directivo lo dice sin anestesia: la idea fácil es sustituir a los junior por una herramienta.", "Otro responde que hará el trabajo más interesante."],
  build(S) {
    const g = S.sub;
    const a = E("g", {}, g);
    paper(a, 70, 860, 440, 300, { seed: 9511, fill: "#FFFDF5" });
    T(a, "“", 100, 980, { f: SERIF, s: 130, c: "#D6D0C2" });
    T(a, "la idea fácil es", 290, 980, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(a, "que sustituyes a los", 290, 1036, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(a, "junior por una IA", 290, 1092, { f: SERIF, s: 40, i: 1, a: "middle", c: RED });
    pix(a, "UN BANCO", 290, 1130, 3, "#888", "middle");
    const b = E("g", {}, g);
    paper(b, 540, 1010, 460, 320, { seed: 9521, fill: "#FFFDF5" });
    T(b, "“", 570, 1130, { f: SERIF, s: 130, c: "#D6D0C2" });
    T(b, "10 horas en", 770, 1120, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(b, "10 segundos; hará", 770, 1176, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(b, "el trabajo más interesante", 770, 1232, { f: SERIF, s: 34, i: 1, a: "middle", c: "#1E9E5A" });
    pix(b, "OTRO BANCO", 770, 1280, 3, "#888", "middle");
    const vs = E("g", {}, g);
    E("circle", { cx: 520, cy: 980, r: 54, fill: INK }, vs);
    pix(vs, "VS", 520, 964, 5, "#FFD23F", "middle");
    S.piece(a, { at: .6, from: "left", dist: 480, r: -2 });
    S.piece(b, { at: 1.8, from: "right", dist: 480, r: 1.5 });
    S.piece(vs, { at: 3.0, from: "pop", r: -6 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9501 });
    T(cl, "los dos pueden", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "tener razón", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 6 — la escuela que desaparece
DEF.push({ bg: "#6A3BDE", tr: "right",
  strip: { color: "#FFD23F", word: "La escuela", wordColor: INK, cx: 540, cy: 600, size: 225, wx: -40, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LA PREGUNTA", x: 96, y: 1392, r: -4 },
  cap: ["Pero ese trabajo aburrido era la escuela: si nadie lo hace, nadie aprende,", "y nadie sabe de dónde van a salir los banqueros de dentro de diez años."],
  build(S) {
    const g = S.sub;
    const steps = [["SOCIO", 420, 870, 260], ["DIRECTOR", 360, 980, 380], ["ASOCIADO", 300, 1090, 500]].map(([tx, x, y, w], i) => {
      const k = E("g", {}, g);
      paper(k, x, y, w, 100, { seed: 9611 + i, fill: "#FFFDF5" });
      pix(k, tx, x + w / 2, y + 36, 4, INK, "middle");
      return k; });
    const miss = E("g", {}, g);
    E("rect", { x: 240, y: 1210, width: 620, height: 110, rx: 8, fill: "none", stroke: "#FFFDF5", "stroke-width": 7, "stroke-dasharray": "22 16" }, miss);
    pix(miss, "ANALISTA", 550, 1250, 5, "#FFFDF5", "middle");
    const q = E("g", {}, g);
    paper(q, 70, 860, 200, 200, { seed: 9621, fill: INK });
    T(q, "?", 170, 1010, { s: 120, a: "middle", w: 900, c: "#FFD23F" });
    steps.forEach((s2, i) => S.piece(s2, { at: .7 + i * .5, from: "top", dist: 340, r: -1 + i }));
    S.piece(miss, { at: 2.6, from: "bottom", dist: 260, r: 0 });
    S.piece(q, { at: 3.4, from: "left", dist: 300, r: -4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9601 });
    T(cl, "quitas el primer escalón:", 540, 278, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "¿y los demás?", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 7 — dos años después
DEF.push({ bg: "#1F5FA8", tr: "left",
  strip: { color: "#FFFDF5", word: "Dos años", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LO QUE DIJERON", x: 96, y: 1392, r: -4 },
  cap: ["Dos años después, el mismo banco anunció contener la plantilla apoyándose en la IA,", "y meses más tarde su jefe dijo que la IA no está quitando empleos."],
  build(S) {
    const g = S.sub;
    const a = E("g", {}, g);
    paper(a, 70, 860, 440, 300, { seed: 9711, fill: "#FFFDF5" });
    pix(a, "MEMO INTERNO · 2025", 290, 900, 3, "#888", "middle");
    T(a, "«contener el", 290, 1000, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(a, "crecimiento de", 290, 1056, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(a, "la plantilla»", 290, 1112, { f: SERIF, s: 42, i: 1, a: "middle", c: RED });
    const b = E("g", {}, g);
    paper(b, 540, 1010, 460, 300, { seed: 9721, fill: "#FFFDF5" });
    pix(b, "EN PÚBLICO · MESES DESPUÉS", 770, 1050, 3, "#888", "middle");
    T(b, "«la IA no está", 770, 1150, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(b, "quitando empleos", 770, 1206, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(b, "en banca»", 770, 1262, { f: SERIF, s: 42, i: 1, a: "middle", c: "#1E9E5A" });
    const ar = harrow(g, 420, 1170, 600, 1030, { c: "#FFD23F", w: 9, bend: .3, hl: 30 });
    S.piece(a, { at: .6, from: "left", dist: 480, r: -2 });
    S.piece(b, { at: 2.0, from: "right", dist: 480, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 9701 });
    T(cl, "la profecía", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "aún no se ha cumplido", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => ar.set(seg(t, 3.0, 3.8));
  } });

// 8 — el dato de fuera
DEF.push({ bg: "#13735E", tr: "right",
  strip: { color: "#FFD23F", word: "Trece", wordColor: INK, cx: 540, cy: 590, size: 290, wx: -140, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "22-25 AÑOS", x: 96, y: 1392, r: -4 },
  cap: ["Lo que sí se mide está fuera de la banca: desde que llegó la IA generativa, el empleo", "de los de 22 a 25 años en los oficios más expuestos ha caído un 13%."],
  build(S) {
    const g = S.sub;
    const ch = E("g", {}, g);
    paper(ch, 70, 850, 700, 470, { seed: 9811, fill: "#FFFDF5" });
    E("path", { d: "M150 1250 L730 1250", ...stroke("#B9B3A6", 5) }, ch);
    E("path", { d: "M150 900 L150 1250", ...stroke("#B9B3A6", 5) }, ch);
    const up = drawable(E("path", { d: "M160 1120 C280 1100 420 1086 560 1070 C640 1062 690 1058 720 1056", ...stroke("#1E9E5A", 9) }, ch));
    const dn = drawable(E("path", { d: "M160 1120 C280 1136 420 1170 560 1198 C640 1214 690 1224 720 1230", ...stroke(RED, 11) }, ch));
    pix(ch, "MAYORES", 540, 1012, 3, "#1E9E5A");
    pix(ch, "22-25 AÑOS", 520, 1268, 3, RED);
    const card = E("g", {}, g);
    paper(card, 812, 1000, 220, 270, { seed: 9821, fill: INK });
    const n = T(card, "0%", 922, 1132, { s: 74, a: "middle", w: 900, c: RED });
    pix(card, "DE EMPLEO", 922, 1172, 3, "#fff", "middle");
    pix(card, "EN RELATIVO", 922, 1212, 3, "#9AA3AE", "middle");
    S.piece(ch, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(card, { at: 2.8, from: "right", dist: 380, r: .5 });
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 9801 });
    T(cl, "los veteranos siguen;", 540, 268, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "los que empiezan, no", 540, 336, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      up.set(seg(t, 1.2, 2.2)); dn.set(seg(t, 1.6, 2.8));
      n.textContent = "-" + Math.round(lerp(0, 13, eo(seg(t, 3.0, 4.0)))) + "%";
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
      ["Rob Copeland, The New York Times", "10 de abril de 2024"],
      ["La entrada", "~200 plazas por banco; el sueldo arranca por encima de 100.000 $"],
      ["Menos de un segundo", "Una herramienta convierte una presentación en el folleto de salida a bolsa"],
      ["Hasta dos tercios", "Recorte de analistas junior planteado dentro de los bancos"],
      ["Accenture", "La IA podría sustituir o complementar casi el 75% de las horas"],
      ["Las dos citas", "Deutsche Bank y JPMorgan, textuales en el reportaje"],
      ["Dos años después", "Memo de 2025: contener plantilla con IA. Su jefe, en público: no quita empleos"],
      ["Stanford, agosto de 2025", "−13% relativo de empleo en 22-25 años en los oficios más expuestos"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 29, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 25, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
