// «La cara equivocada»: scenes (inserted into the paper-collage engine by build.py)
// No real person's face is drawn. The three men appear as record cards with a blank, dotted
// face outline and a match score — the point of the piece is a face read wrongly by a machine.
const DEF = [];

// ---------- props ----------
function house(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -260, y: -60, width: 520, height: 240, rx: 8, fill: "#C8B89A", stroke: "#7E6E52", "stroke-width": 6 }, k);
  E("path", { d: "M-300 -60 L0 -210 L300 -60 Z", fill: "#7A4030", stroke: "#4A2419", "stroke-width": 6 }, k);
  E("rect", { x: -54, y: 40, width: 108, height: 140, rx: 5, fill: "#5E3A22", stroke: "#2F1C0F", "stroke-width": 5 }, k);
  E("circle", { cx: 32, cy: 112, r: 8, fill: "#F3E5C8" }, k);
  const win = E("g", {}, k);
  E("rect", { x: -214, y: 10, width: 150, height: 120, rx: 5, fill: "#FFD98A", stroke: "#2F1C0F", "stroke-width": 5 }, win);
  for (const [x, r] of [[-176, 20], [-114, 15]]) {
    E("circle", { cx: x, cy: 58, r, fill: "#2F1C0F" }, win);
    E("path", { d: `M${x - r - 4} 130 C${x - r - 2} ${100 - r} ${x + r + 2} ${100 - r} ${x + r + 4} 130 Z`, fill: "#2F1C0F" }, win);
  }
  E("rect", { x: 64, y: 10, width: 150, height: 120, rx: 5, fill: "#4E5A66", stroke: "#2F1C0F", "stroke-width": 5 }, k);
  return { k, win };
}

function cruiser(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -210, y: -40, width: 420, height: 110, rx: 26, fill: "#2B3038", stroke: "#15181C", "stroke-width": 6 }, k);
  E("path", { d: "M-130 -40 L-96 -118 L104 -118 L150 -40 Z", fill: "#39424E", stroke: "#15181C", "stroke-width": 6 }, k);
  E("rect", { x: -70, y: -110, width: 140, height: 62, rx: 6, fill: "#9FC3DE" }, k);
  const bar = E("g", {}, k);
  const l1 = E("rect", { x: -62, y: -152, width: 60, height: 34, rx: 8, fill: "#E8402A" }, bar);
  const l2 = E("rect", { x: 4, y: -152, width: 60, height: 34, rx: 8, fill: "#2E6FE8" }, bar);
  for (const x of [-120, 120]) { E("circle", { cx: x, cy: 70, r: 46, fill: "#1B1F24", stroke: "#0C0E11", "stroke-width": 5 }, k);
    E("circle", { cx: x, cy: 70, r: 18, fill: "#6E7784" }, k); }
  return { k, l1, l2 };
}

function phoneLive(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -140, y: -250, width: 280, height: 500, rx: 34, fill: "#2B3038", stroke: "#15181C", "stroke-width": 6 }, k);
  E("rect", { x: -118, y: -222, width: 236, height: 444, rx: 12, fill: "#1B2330" }, k);
  E("rect", { x: -40, y: -240, width: 80, height: 12, rx: 6, fill: "#15181C" }, k);
  const badge = E("g", {}, k);
  E("rect", { x: -100, y: -200, width: 128, height: 44, rx: 10, fill: "#E8402A" }, badge);
  pix(badge, "EN DIRECTO", -92, -187, 3, "#fff");
  E("path", { d: "M-20 40 q-44 -30 -44 -74 q0 -34 32 -34 q24 0 34 28 q10 -28 34 -28 q32 0 32 34 q0 44 -44 74 Z", fill: "#E8609A", opacity: .9 }, k);
  const notes = [];
  for (let i = 0; i < 5; i++) notes.push(E("circle", { r: 7, fill: "#FFD23F", opacity: 0 }, k));
  return { k, notes };
}

function mapCard(g, x, y, w, h, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#EDE6D4" });
  for (let i = 0; i < 5; i++) E("path", { d: `M${x + 20} ${y + 40 + i * 52} q${w / 3} ${i % 2 ? 24 : -24} ${w - 40} 0`, ...stroke("#CFC6AF", 7) }, k);
  for (let i = 0; i < 4; i++) E("path", { d: `M${x + 60 + i * 90} ${y + 20} q${i % 2 ? 20 : -20} ${h / 2} 0 ${h - 40}`, ...stroke("#CFC6AF", 7) }, k);
  return k;
}

function pin(g, cx, cy, fill) {
  const k = E("g", {}, g);
  E("path", { d: `M${cx} ${cy} C${cx - 44} ${cy - 46} ${cx - 34} ${cy - 110} ${cx} ${cy - 110} C${cx + 34} ${cy - 110} ${cx + 44} ${cy - 46} ${cx} ${cy} Z`, fill, stroke: "#fff", "stroke-width": 5 }, k);
  E("circle", { cx, cy: cy - 72, r: 16, fill: "#fff" }, k);
  return k;
}

function recordCard(g, x, y, w, h, o) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed: o.seed, fill: "#FFFDF5" });
  E("rect", { x, y, width: w, height: 56, fill: INK }, k);
  pix(k, o.tag, x + w / 2, y + 18, 4, "#fff", "middle");
  const fx = x + w / 2, fy = y + 190;
  E("rect", { x: x + 28, y: y + 80, width: w - 56, height: 230, rx: 8, fill: "#ECE6D8" }, k);
  E("ellipse", { cx: fx, cy: fy - 34, rx: 56, ry: 66, fill: "none", stroke: "#9A9280", "stroke-width": 6, "stroke-dasharray": "14 12" }, k);
  E("path", { d: `M${fx - 86} ${y + 300} C${fx - 78} ${y + 226} ${fx - 44} ${y + 204} ${fx} ${y + 204} C${fx + 44} ${y + 204} ${fx + 78} ${y + 226} ${fx + 86} ${y + 300} Z`, fill: "none", stroke: "#9A9280", "stroke-width": 6, "stroke-dasharray": "14 12" }, k);
  T(k, "?", fx, fy - 10, { s: 72, a: "middle", w: 900, c: "#C4BCA8" });
  const bar = E("rect", { x: x + 28, y: y + h - 86, width: 0, height: 30, rx: 15, fill: RED }, k);
  pix(k, o.note, x + 28, y + h - 42, 3, "#666");
  return { k, bar, full: w - 56 };
}

function personShape(g, cx, cy, s, fill) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-74 96 C-68 18 -38 -8 0 -8 C38 -8 68 18 74 96 Z", fill }, k);
  E("circle", { cx: 0, cy: -58, r: 42, fill }, k);
  return k;
}

// =====================================================================
// 1 — el césped de casa
DEF.push({ bg: "#13304F", tr: "left",
  strip: { color: "#FFFDF5", word: "El césped", wordColor: INK, cx: 540, cy: 580, size: 240, wx: -50, maxW: 940, from: -1 },
  sub: { x: 30, y: 780, w: 1020, h: 650 },
  label: { text: "DETROIT, 2020", x: 96, y: 1392, r: -4 },
  cap: ["En enero de 2020, la policía de Detroit detuvo a un hombre", "en el césped de su casa, delante de sus dos hijas."],
  build(S) {
    const g = S.sub;
    E("rect", { x: 30, y: 1300, width: 1020, height: 130, fill: "#2E6B47" }, g);
    for (let i = 0; i < 26; i++) E("path", { d: `M${60 + i * 38} 1330 l${(i % 3) - 1} -26`, ...stroke("#3F8257", 6) }, g);
    const hs = E("g", {}, g); const { win } = house(hs, 430, 1140, .82);
    const cr = E("g", {}, g); const { l1, l2 } = cruiser(cr, 860, 1250, .66);
    S.piece(hs, { at: .5, from: "bottom", dist: 520, r: -1 });
    S.piece(cr, { at: 1.6, from: "right", dist: 520, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4101 });
    T(cl, "no había más prueba", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "que un parecido", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const b = Math.sin(t * 6) > 0;
      l1.setAttribute("opacity", b ? 1 : .25); l2.setAttribute("opacity", b ? .25 : 1);
      win.style.opacity = (t > 2.2 ? 1 : .35).toString();
    };
  } });

// 2 — la coartada
DEF.push({ bg: "#8E1B2E", tr: "right",
  strip: { color: "#FFD23F", word: "Coartada", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -50, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "30 HORAS", x: 96, y: 1392, r: -4 },
  cap: ["Estaba a 80 km cantando en un directo de Instagram, pero pasó 30 horas", "en un calabozo antes de que nadie le preguntara dónde había estado."],
  build(S) {
    const g = S.sub;
    const mp = mapCard(g, 420, 850, 600, 400, 4211);
    const p1 = pin(mp, 560, 1130, "#2E6FE8"), p2 = pin(mp, 880, 1010, RED);
    const dash = drawable(E("path", { d: "M560 1100 Q720 1000 880 990", ...stroke(INK, 6), "stroke-dasharray": "none" }, mp));
    const km = E("g", {}, mp);
    paper(km, 630, 1120, 200, 86, { seed: 4221, fill: INK });
    T(km, "80 km", 730, 1180, { s: 48, a: "middle", w: 900, c: "#FFD23F" });
    const ph = E("g", {}, g); const { notes } = phoneLive(ph, 230, 1080, .62);
    const cell = E("g", {}, g);
    paper(cell, 420, 1270, 320, 130, { seed: 4231, fill: "#FFFDF5" });
    T(cell, "30 h", 500, 1370, { s: 68, w: 900, c: INK });
    for (let i = 0; i < 4; i++) E("line", { x1: 640 + i * 24, y1: 1292, x2: 640 + i * 24, y2: 1382, ...stroke("#5A626C", 9) }, cell);
    S.piece(ph, { at: .5, from: "left", dist: 460, r: -3 });
    S.piece(mp, { at: 1.3, from: "right", dist: 520, r: 2 });
    S.piece(cell, { at: 3.2, from: "bottom", dist: 300, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4201 });
    T(cl, "nadie le preguntó", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "dónde estaba", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      dash.set(seg(t, 2.0, 2.8));
      notes.forEach((n, i) => { const f = ((t * .7 + i * .2) % 1);
        n.setAttribute("cx", (-40 + Math.sin(t * 2 + i) * 26).toFixed(1));
        n.setAttribute("cy", (-200 - f * 120).toFixed(1));
        n.setAttribute("opacity", t > 1.0 ? ((1 - f) * .8).toFixed(2) : 0); });
    };
  } });

// 3 — los tatuajes
DEF.push({ bg: "#D9A400", tr: "left",
  strip: { color: "#FFFDF5", word: "Tatuajes", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 950, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "ESTABA TRABAJANDO", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["A otro hombre lo detuvieron estando en su puesto de trabajo:", "él tiene tatuajes en los brazos, y el del vídeo no tiene ninguno."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 70, 880, 320, 420, { seed: 4311, fill: "#FFFDF5" });
    pix(card, "FICHAJE", 230, 920, 4, INK, "middle");
    for (let i = 0; i < 5; i++) { const on = i === 2;
      E("rect", { x: 110, y: 980 + i * 58, width: 240, height: 40, rx: 6, fill: on ? "#CFF75A" : "#EFEADF" }, card);
      pix(card, ["LUN", "MAR", "MIÉ", "JUE", "VIE"][i], 124, 992 + i * 58, 3, "#666");
      if (on) pix(card, "08:00", 250, 992 + i * 58, 3, INK); }
    const ring = hcircle(card, 230, 1097, 140, 34, { seed: 6, c: RED, w: 8 });
    const arms = [["EL DETENIDO", "#C98A5E", true], ["EL DEL VÍDEO", "#C98A5E", false]].map(([tag, skin, tat], i) => {
      const k = E("g", {}, g), x = 500 + i * 270;
      paper(k, x, 880, 230, 420, { seed: 4321 + i, fill: "#FFFDF5" });
      E("circle", { cx: x + 116, cy: 988, r: 56, fill: skin, stroke: "#8E5B35", "stroke-width": 5 }, k);
      E("rect", { x: x + 72, y: 980, width: 88, height: 220, rx: 24, fill: skin, stroke: "#8E5B35", "stroke-width": 5 }, k);
      E("path", { d: `M${x + 76} 1192 q40 54 84 0 q10 42 -42 48 q-52 -6 -42 -48 Z`, fill: skin, stroke: "#8E5B35", "stroke-width": 5 }, k);
      if (tat) { for (let j = 0; j < 3; j++) E("path", { d: `M${x + 78} ${1026 + j * 46} l18 -10 l18 10 l18 -10 l16 10`, ...stroke("#4A3A5E", 7) }, k);
        E("path", { d: `M${x + 116} 1150 l9 19 l21 3 l-15 15 l4 21 l-19 -10 l-19 10 l4 -21 l-15 -15 l21 -3 Z`, fill: "none", stroke: "#4A3A5E", "stroke-width": 5 }, k); }
      pix(k, tag, x + 115, 1250, 3, INK, "middle");
      return k; });
    S.piece(card, { at: .5, from: "left", dist: 500, r: -2 });
    S.piece(arms[0], { at: 1.8, from: "bottom", dist: 420, r: 2 });
    S.piece(arms[1], { at: 2.4, from: "bottom", dist: 420, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4301 });
    T(cl, "bastaba con mirar", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "los dos brazos", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { ring.set(seg(t, 1.2, 2.0)); };
  } });

// 4 — diez días y una barra de 25 años
DEF.push({ bg: "#C62828", tr: "right",
  strip: { color: "#1B1B1B", word: "Diez días", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 230, wx: -40, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "HASTA 25 AÑOS", x: 96, y: 1392, r: -4 },
  cap: ["Un tercero pasó 10 días en prisión y se planteó declararse culpable,", "porque se enfrentaba a hasta 25 años por algo que no hizo."],
  build(S) {
    const g = S.sub;
    const rec = E("g", {}, g);
    paper(rec, 90, 850, 330, 400, { seed: 4411, fill: "#FFFDF5" });
    pix(rec, "RESGUARDO", 255, 890, 4, INK, "middle");
    for (let i = 0; i < 6; i++) E("rect", { x: 130, y: 950 + i * 42, width: 250 - (i % 3) * 50, height: 16, rx: 8, fill: "#C9C2B4" }, rec);
    pix(rec, "A 48 KM DEL HOTEL", 255, 1210, 3, RED, "middle");
    const days = E("g", {}, g);
    paper(days, 470, 850, 230, 230, { seed: 4421, fill: "#FFFDF5" });
    const nd = T(days, "0", 585, 990, { s: 104, a: "middle", w: 900, c: INK });
    pix(days, "DÍAS PRESO", 585, 1030, 3, "#666", "middle");
    const barG = E("g", {}, g);
    paper(barG, 470, 1120, 520, 220, { seed: 4431, fill: "#FFFDF5" });
    E("rect", { x: 510, y: 1200, width: 440, height: 46, rx: 23, fill: "#E3DED1" }, barG);
    const bar = E("rect", { x: 510, y: 1200, width: 0, height: 46, rx: 23, fill: RED }, barG);
    pix(barG, "PENA MAXIMA", 510, 1160, 3, "#666");
    const ny = T(barG, "0 años", 950, 1300, { s: 44, a: "end", w: 900, c: INK });
    const plea = E("g", {}, g);
    paper(plea, 740, 850, 250, 230, { seed: 4441, fill: INK });
    T(plea, "¿me declaro", 865, 940, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFFDF5" });
    T(plea, "culpable", 865, 990, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FFD23F" });
    T(plea, "sin serlo?", 865, 1040, { f: SERIF, s: 36, i: 1, a: "middle", c: "#FFFDF5" });
    S.piece(rec, { at: .5, from: "left", dist: 500, r: -2 });
    S.piece(days, { at: 1.2, from: "top", dist: 320, r: 2 });
    S.piece(barG, { at: 2.0, from: "bottom", dist: 320, r: -1 });
    S.piece(plea, { at: 3.4, from: "right", dist: 380, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4401 });
    T(cl, "lo barato era", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "aceptar la culpa", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      nd.textContent = Math.round(lerp(0, 10, eo(seg(t, 1.6, 2.4))));
      const q = eo(seg(t, 2.6, 3.8));
      bar.setAttribute("width", (440 * q).toFixed(1));
      ny.textContent = Math.round(lerp(0, 25, q)) + " años";
    };
  } });

// 5 — los tres
DEF.push({ bg: "#13825A", tr: "left",
  strip: { color: "#FFFDF5", word: "Los tres", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -70, maxW: 950, from: -1 },
  sub: { x: 30, y: 780, w: 1020, h: 650 },
  label: { text: "NADIE PREGUNTÓ", x: 96, y: 1392, r: -4 },
  cap: ["Los tres son padres, los tres son negros,", "y a ninguno le comprobaron la coartada antes de detenerlo."],
  build(S) {
    const g = S.sub;
    const cards = [["CASO 1", "COINCIDENCIA"], ["CASO 2", "COINCIDENCIA"], ["CASO 3", "COINCIDENCIA"]]
      .map(([tag, note], i) => recordCard(g, 60 + i * 325, 850, 290, 470, { seed: 4511 + i, tag, note }));
    const band = E("g", { transform: "rotate(-7 540 1180)" }, g);
    E("path", { d: torn(40, 1120, 1000, 120, 4531, 7, 26), fill: RED }, band);
    pix(band, "SIN COMPROBAR LA COARTADA", 540, 1158, 6, "#FFFDF5", "middle");
    cards.forEach((c, i) => S.piece(c.k, { at: .5 + i * .45, from: "bottom", dist: 520, r: -2 + i * 2 }));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4501 });
    T(cl, "la máquina señaló;", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "nadie comprobó", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cards.forEach((c, i) => c.bar.setAttribute("width", (c.full * eo(seg(t, 1.4 + i * .3, 2.2 + i * .3))).toFixed(1)));
      const bq = eb(seg(t, 2.8, 3.4));
      band.style.opacity = bq > 0 ? 1 : 0;
      band.setAttribute("transform", `translate(${((1 - bq) * -1100).toFixed(1)} 0) rotate(-7 540 1180)`);
    };
  } });

// 6 — uno de cada dos
DEF.push({ bg: "#6A3BDE", tr: "right",
  strip: { color: "#CFF75A", word: "La mitad", wordColor: INK, cx: 540, cy: 600, size: 260, wx: -90, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "GEORGETOWN LAW", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Las fotos de uno de cada dos adultos estadounidenses", "están en las bases que la policía consulta."],
  build(S) {
    const g = S.sub;
    const sheet = E("g", {}, g);
    paper(sheet, 70, 850, 700, 470, { seed: 4611, fill: "#FFFDF5" });
    const faces = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) {
      const x = 118 + c * 63, y = 898 + r * 70, k = E("g", {}, sheet), on = (r * 10 + c) % 2 === 0;
      E("circle", { cx: x, cy: y, r: 17, fill: "none", stroke: on ? RED : "#B9B3A6", "stroke-width": 4 }, k);
      E("path", { d: `M${x - 24} ${y + 48} C${x - 21} ${y + 22} ${x - 11} ${y + 16} ${x} ${y + 16} C${x + 11} ${y + 16} ${x + 21} ${y + 22} ${x + 24} ${y + 48} Z`, fill: "none", stroke: on ? RED : "#B9B3A6", "stroke-width": 4 }, k);
      faces.push({ k, on });
    }
    const card = E("g", {}, g);
    paper(card, 800, 950, 220, 270, { seed: 4621, fill: INK });
    T(card, "1", 910, 1070, { s: 96, a: "middle", w: 900, c: "#CFF75A" });
    T(card, "de cada 2", 910, 1140, { f: SERIF, s: 40, i: 1, a: "middle", c: "#fff" });
    S.piece(sheet, { at: .5, from: "left", dist: 560, r: -2 });
    S.piece(card, { at: 2.4, from: "right", dist: 380, r: 4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4601 });
    T(cl, "no hace falta", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "tener antecedentes", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => faces.forEach((f, i) => {
      const q = seg(t, .9 + (i % 10) * .04, 1.2 + (i % 10) * .04);
      f.k.style.opacity = (f.on ? q * (.3 + .7 * seg(t, 1.8, 2.6)) : q).toFixed(2);
    });
  } });

// 7 — al menos ocho
DEF.push({ bg: "#E2641A", tr: "left",
  strip: { color: "#FFFDF5", word: "Ocho", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -140, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "AL MENOS OCHO", x: 96, y: 1392, r: -4 },
  cap: ["En 2025 ya se conocían al menos 8 detenciones así: 7 de personas negras,", "y en todas la policía se había saltado las comprobaciones básicas."],
  build(S) {
    const g = S.sub;
    const sheet = E("g", {}, g);
    paper(sheet, 70, 860, 940, 300, { seed: 4711, fill: "#FFFDF5" });
    const figs = [];
    for (let i = 0; i < 8; i++) figs.push(personShape(sheet, 130 + i * 118, 1070, .72, i < 7 ? "#2B2A28" : "#C3BCAE"));
    const checks = [0, 1, 2].map(i => { const k = E("g", {}, g), y = 1200 + i * 78;
      paper(k, 70, y, 560, 64, { seed: 4721 + i, fill: "#FFFDF5" });
      T(k, ["coartada", "tatuajes", "ADN y huellas"][i], 130, y + 46, { f: SERIF, s: 38, i: 1 });
      E("path", { d: `M90 ${y + 20} l28 28 M118 ${y + 20} l-28 28`, ...stroke(RED, 8) }, k);
      return k; });
    const tag = E("g", {}, g);
    paper(tag, 680, 1210, 330, 190, { seed: 4731, fill: INK });
    pix(tag, "SIN COMPROBAR", 845, 1250, 3, "#fff", "middle");
    T(tag, "7 de 8", 845, 1352, { s: 66, a: "middle", w: 900, c: "#FFD23F" });
    S.piece(sheet, { at: .5, from: "bottom", dist: 480, r: -1.5 });
    checks.forEach((c, i) => S.piece(c, { at: 2.0 + i * .4, from: "left", dist: 420, r: -1 }));
    S.piece(tag, { at: 3.4, from: "right", dist: 360, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 4701 });
    T(cl, "no fueron tres:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "al menos ocho", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => figs.forEach((f, i) => {
      const q = eb(seg(t, .9 + i * .12, 1.3 + i * .12));
      f.setAttribute("transform", `translate(${130 + i * 118} ${(1070 + (1 - q) * 60).toFixed(1)}) scale(${(.72 * q).toFixed(3)})`);
      f.style.opacity = q > 0 ? 1 : 0; });
  } });

// 8 — la norma que faltaba
DEF.push({ bg: "#1F5FA8", tr: "right",
  strip: { color: "#FFD23F", word: "No basta", wordColor: INK, cx: 540, cy: 590, size: 250, wx: -70, maxW: 950, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "JUNIO DE 2024", x: 96, y: 1392, r: -4 },
  cap: ["En 2024, Detroit pagó 300.000 dólares e impuso la norma que faltaba:", "una coincidencia de la máquina no basta para detener a nadie."],
  build(S) {
    const g = S.sub;
    const chk = E("g", {}, g);
    paper(chk, 80, 850, 620, 250, { seed: 4811, fill: "#EAF3E6" });
    pix(chk, "CIUDAD DE DETROIT", 120, 890, 3, "#5A6B55");
    E("path", { d: "M120 1010 L560 1010", ...stroke("#9DB399", 5) }, chk);
    const amt = T(chk, "0 $", 560, 1000, { s: 76, a: "end", w: 900, c: INK });
    pix(chk, "ACUERDO CON ROBERT WILLIAMS", 120, 1046, 3, "#5A6B55");
    const rule = E("g", {}, g);
    paper(rule, 80, 1140, 920, 250, { seed: 4821, fill: "#FFFDF5" });
    T(rule, "una coincidencia", 540, 1232, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(rule, "no basta para detener", 540, 1312, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    const seal = E("g", {}, g);
    E("circle", { cx: 900, cy: 1012, r: 100, fill: "#0E3F76", stroke: "#FFD23F", "stroke-width": 9 }, seal);
    pix(seal, "AUDITORÍA", 900, 976, 3, "#FFD23F", "middle");
    pix(seal, "DE TODOS", 900, 1008, 3, "#FFD23F", "middle");
    pix(seal, "LOS CASOS", 900, 1040, 3, "#FFD23F", "middle");
    S.piece(chk, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(rule, { at: 2.4, from: "bottom", dist: 400, r: 1.5 });
    S.piece(seal, { at: 3.4, from: "pop", r: 0 });
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 4801 });
    T(cl, "tardó cuatro años", 540, 268, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "y tres vidas rotas", 540, 336, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { amt.textContent = fmt(Math.round(lerp(0, 300000, eo(seg(t, 1.2, 2.4))))) + " $"; };
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
      ["Khari Johnson, WIRED", "7 de marzo de 2022: Williams, Oliver y Parks"],
      ["Robert Williams", "Detroit, enero de 2020. 30 horas detenido; cargos retirados"],
      ["Michael Oliver", "Julio de 2019. Estaba trabajando; perdió su empleo"],
      ["Nijeer Parks", "Enero de 2019. 10 días preso; se enfrentaba a 25 años"],
      ["Georgetown Law", "Uno de cada dos adultos está en esas bases de datos"],
      ["James Craig, 2020", "Usado por sí solo, el sistema fallaría el 96% de las veces"],
      ["The Washington Post, enero 2025", "Al menos 8 detenciones erróneas; 7 de personas negras"],
      ["Acuerdo ACLU-Detroit, junio 2024", "300.000 $ y auditoría de los casos desde 2017"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 30, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 26, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja la cara de nadie.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
