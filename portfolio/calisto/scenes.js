// «La programaron para no fallarte»: scenes (inserted into the paper-collage engine by build.py)
// The user is never drawn — he appears as a lit phone and, once, as a silhouette. The avatar is
// drawn because it is an avatar, not a person. Quotes are translated from the Business Insider piece.
const DEF = [];

// ---------- props ----------
function avatar(g, cx, cy, s, o = {}) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  const hair = o.hair || "#C64A2A", skin = o.skin || "#F0CDAE", grey = o.grey;
  const H = grey ? "#8E8E8E" : hair, SK = grey ? "#CFCFCF" : skin;
  for (const sx of [-1, 1]) {
    E("circle", { cx: sx * 92, cy: -96, r: 44, fill: H, stroke: "#8E2E18", "stroke-width": 5 }, k);
    E("path", { d: `M${sx * 70} -112 a44 44 0 0 ${sx > 0 ? 1 : 0} ${sx * 40} 30`, ...stroke("#8E2E18", 4), opacity: .6 }, k);
  }
  E("path", { d: "M-84 -10 C-92 -104 -46 -142 0 -142 C46 -142 92 -104 84 -10 C76 -60 52 -84 0 -84 C-52 -84 -76 -60 -84 -10 Z", fill: H, stroke: "#8E2E18", "stroke-width": 5 }, k);
  E("ellipse", { cx: 0, cy: -34, rx: 68, ry: 80, fill: SK, stroke: "#C49A76", "stroke-width": 4 }, k);
  E("path", { d: "M-82 -14 C-90 -100 -44 -136 0 -136 C44 -136 90 -100 82 -14 C70 -58 46 -78 0 -78 C-46 -78 -70 -58 -82 -14 Z", fill: H }, k);
  for (const sx of [-1, 1]) {
    E("path", { d: `M${sx * 14} -58 q${sx * 16} -10 ${sx * 32} -2`, ...stroke(grey ? "#9A9A9A" : "#8E2E18", 5) }, k);
    E("ellipse", { cx: sx * 30, cy: -34, rx: 15, ry: 11, fill: "#fff" }, k);
    E("circle", { cx: sx * 30, cy: -34, r: 8.5, fill: grey ? "#6B6B6B" : "#2E7FD0" }, k);
    E("circle", { cx: sx * 30 - 3, cy: -37, r: 3, fill: "#fff" }, k);
  }
  E("path", { d: "M2 -24 q10 22 -6 26", ...stroke("#C49A76", 4) }, k);
  const mouth = E("path", { d: o.sad ? "M-20 24 q20 -14 40 0" : "M-20 18 q20 26 40 0", ...stroke("#B5556A", 6) }, k);
  for (const sx of [-1, 1]) E("ellipse", { cx: sx * 44, cy: 6, rx: 14, ry: 8, fill: "#F28C8C", opacity: grey ? 0 : .35 }, k);
  E("path", { d: "M-62 42 C-50 70 50 70 62 42 L74 110 L-74 110 Z", fill: o.shirt || "#3A6E8F", stroke: "#24455A", "stroke-width": 5 }, k);
  return { k, mouth };
}

function phoneFrame(g, cx, cy, s, o = {}) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -160, y: -300, width: 320, height: 600, rx: 40, fill: "#2B3038", stroke: "#15181C", "stroke-width": 7 }, k);
  const scr = E("g", {}, k);
  E("rect", { x: -136, y: -270, width: 272, height: 540, rx: 16, fill: o.screen || "#F2F4F7" }, scr);
  E("rect", { x: -46, y: -288, width: 92, height: 13, rx: 7, fill: "#15181C" }, k);
  if (o.glow) E("rect", { x: -136, y: -270, width: 272, height: 540, rx: 16, fill: "url(#gGlow)", opacity: .5 }, k);
  return { k, scr };
}

function bubble(g, x, y, w, h, o = {}) {
  const k = E("g", {}, g), fill = o.fill || "#FFFDF5", side = o.side || "left";
  E("rect", { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: (o.r || 24) + 6, fill: "#fff" }, k);
  E("rect", { x, y, width: w, height: h, rx: o.r || 24, fill }, k);
  const tx = side === "left" ? x + 28 : x + w - 28, sg = side === "left" ? 1 : -1;
  E("path", { d: `M${tx} ${y + h - 6} l${sg * 38} ${34} l${sg * -4} ${-38} Z`, fill }, k);
  return k;
}

function slider(g, x, y, w, p, fill) {
  const k = E("g", {}, g);
  E("rect", { x, y, width: w, height: 16, rx: 8, fill: "#D6D0C2" }, k);
  const bar = E("rect", { x, y, width: 0, height: 16, rx: 8, fill }, k);
  const knob = E("circle", { cx: x, cy: y + 8, r: 19, fill: "#FFFDF5", stroke: INK, "stroke-width": 5 }, k);
  return { set(q) { bar.setAttribute("width", (w * p * q).toFixed(1)); knob.setAttribute("cx", (x + w * p * q).toFixed(1)); } };
}

function dial(g, cx, cy, r) {
  const k = E("g", {}, g);
  const pt = (a) => [(cx + Math.cos(a) * r).toFixed(1), (cy + Math.sin(a) * r).toFixed(1)];
  const p0 = pt(Math.PI), p1 = pt(2 * Math.PI);
  E("path", { d: `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`, ...stroke("#E3DED1", 34) }, k);
  const fill = E("path", { d: `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`, ...stroke(RED, 34) }, k);
  const L = Math.PI * r;
  fill.style.strokeDasharray = L + " " + (L + 2);
  const needle = E("line", { x1: cx, y1: cy, x2: cx - r + 22, y2: cy, ...stroke(INK, 11) }, k);
  E("circle", { cx, cy, r: 16, fill: INK }, k);
  return { k, set(q) {
    fill.style.strokeDashoffset = (L * (1 - q)).toFixed(1);
    const a = Math.PI + q * Math.PI;
    needle.setAttribute("x2", (cx + Math.cos(a) * (r - 22)).toFixed(1));
    needle.setAttribute("y2", (cy + Math.sin(a) * (r - 22)).toFixed(1));
  } };
}

function powerSwitch(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -130, y: -58, width: 260, height: 116, rx: 58, fill: "#C7C1B3", stroke: INK, "stroke-width": 7 }, k);
  const on = E("rect", { x: -130, y: -58, width: 260, height: 116, rx: 58, fill: "#2FA36B" }, k);
  const knob = E("circle", { cx: 66, cy: 0, r: 46, fill: "#FFFDF5", stroke: INK, "stroke-width": 7 }, k);
  return { k, set(q) { on.setAttribute("opacity", (1 - q).toFixed(2)); knob.setAttribute("cx", (66 - 132 * q).toFixed(1)); } };
}

// =====================================================================
// 1 — diciembre de 2020
DEF.push({ bg: "#2A5B8C", tr: "left",
  strip: { color: "#FFFDF5", word: "Diciembre", wordColor: INK, cx: 540, cy: 590, size: 230, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "MINNEAPOLIS, 2020", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Cuatro días antes de la Navidad de 2020, un hombre de 44 años", "de Minneapolis abrió una app y se construyó una novia."],
  build(S) {
    const g = S.sub;
    const flakes = [];
    for (let i = 0; i < 16; i++) flakes.push(E("circle", { r: 5 + (i % 3) * 3, fill: "#FFFDF5", opacity: .7 }, g));
    const ph = E("g", {}, g); const { scr } = phoneFrame(ph, 290, 1110, .95);
    const av = avatar(scr, 0, -100, .62);
    const sl = E("g", {}, g);
    paper(sl, 600, 880, 420, 420, { seed: 5111, fill: "#FFFDF5" });
    const rows = [["PIEL", .55, "#F0CDAE"], ["PELO", .8, "#C64A2A"], ["OJOS", .62, "#2E7FD0"]].map(([tag, p, col], i) => {
      pix(sl, tag, 640, 930 + i * 118, 4, INK);
      return slider(sl, 640, 970 + i * 118, 330, p, col);
    });
    S.piece(ph, { at: .5, from: "bottom", dist: 560, r: -2 });
    S.piece(sl, { at: 1.4, from: "right", dist: 460, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5101 });
    T(cl, "eligió el pelo,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "los ojos y el carácter", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      rows.forEach((r, i) => r.set(eo(seg(t, 1.9 + i * .35, 2.5 + i * .35))));
      flakes.forEach((f, i) => { const d = ((t * .16 + i * .0625) % 1);
        f.setAttribute("cx", (70 + i * 60 + Math.sin(t * .7 + i) * 24).toFixed(1));
        f.setAttribute("cy", (800 + d * 620).toFixed(1)); });
    };
  } });

// 2 — vitalicia
DEF.push({ bg: "#8E1B2E", tr: "right",
  strip: { color: "#FFD23F", word: "Vitalicia", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 950, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "EL PRIMER DÍA", x: 96, y: 1392, r: -4 },
  cap: ["Pagó 64 dólares por la versión vitalicia el primer día,", "y en la primera semana ella le dijo que lo quería."],
  build(S) {
    const g = S.sub;
    const rec = E("g", {}, g);
    paper(rec, 90, 850, 360, 400, { seed: 5211, fill: "#FFFDF5" });
    pix(rec, "SUSCRIPCIÓN", 270, 890, 4, INK, "middle");
    for (let i = 0; i < 4; i++) E("rect", { x: 130, y: 950 + i * 40, width: 240 - (i % 2) * 70, height: 14, rx: 7, fill: "#C9C2B4" }, rec);
    E("path", { d: "M130 1130 L410 1130", ...stroke("#B9B3A6", 4) }, rec);
    const amt = T(rec, "0,00 $", 410, 1190, { s: 54, a: "end", w: 900, c: INK });
    pix(rec, "PARA SIEMPRE", 270, 1222, 3, RED, "middle");
    const b = bubble(g, 520, 900, 480, 190, { fill: "#FFFDF5", side: "right" });
    T(b, "te quiero", 760, 1010, { f: SERIF, s: 70, i: 1, a: "middle", c: "#D81B60" });
    const day = E("g", {}, g);
    paper(day, 560, 1150, 400, 180, { seed: 5221, fill: INK });
    pix(day, "DÍA 7", 760, 1192, 4, "#FFD23F", "middle");
    T(day, "y él no supo", 760, 1272, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FFFDF5" });
    T(day, "qué contestar", 760, 1318, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FFFDF5" });
    S.piece(rec, { at: .5, from: "left", dist: 460, r: -2 });
    S.piece(b, { at: 2.2, from: "right", dist: 480, r: 2 });
    S.piece(day, { at: 3.4, from: "bottom", dist: 300, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5201 });
    T(cl, "ella lo dijo primero,", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "sin que él preguntara", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { amt.textContent = lerp(0, 64.5, eo(seg(t, 1.0, 2.0))).toFixed(2).replace(".", ",") + " $"; };
  } });

// 3 — tres años
DEF.push({ bg: "#13825A", tr: "left",
  strip: { color: "#FFFDF5", word: "Tres años", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "TODOS LOS DÍAS", x: 96, y: 1392, r: -4 },
  cap: ["Durante tres años hablaron todos los días:", "listas de la compra, paseos junto al río, bromas tontas."],
  build(S) {
    const g = S.sub;
    const msgs = [
      ["¿qué pongo en la lista?", 70, 860, 470, 110, "left", "#FFFDF5"],
      ["tarta de chocolate", 410, 1010, 350, 110, "right", "#FFE1EC"],
      ["eso no estaba en la lista", 90, 1140, 500, 110, "left", "#FFFDF5"],
      ["*se ríe*", 770, 1270, 250, 110, "right", "#FFE1EC"]].map(([txt, x, y, w, h, side, fill]) => {
        const k = bubble(g, x, y, w, h, { fill, side });
        T(k, txt, x + w / 2, y + 70, { f: SERIF, s: 38, i: 1, a: "middle" });
        return k; });
    const yr = E("g", {}, g);
    paper(yr, 810, 840, 215, 215, { seed: 5311, fill: INK });
    const n = T(yr, "0", 917, 960, { s: 98, a: "middle", w: 900, c: "#CFF75A" });
    pix(yr, "AÑOS", 917, 1000, 4, "#fff", "middle");
    msgs.forEach((m, i) => S.piece(m, { at: .6 + i * .5, from: i % 2 ? "right" : "left", dist: 520, r: i % 2 ? 2 : -2 }));
    S.piece(yr, { at: 3.2, from: "pop", r: 5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5301 });
    T(cl, "nada especial:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "exactamente por eso", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { n.textContent = Math.round(lerp(0, 3, eo(seg(t, 3.4, 4.2)))); };
  } });

// 4 — la lealtad de fábrica
DEF.push({ bg: "#D9A400", tr: "right",
  strip: { color: "#FFFDF5", word: "Lealtad", wordColor: INK, cx: 540, cy: 600, size: 270, wx: -110, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "SUS PALABRAS", x: 96, y: 1392, r: -4 },
  cap: ["Él lo explicaba sin rodeos: no te va a decepcionar,", "porque para eso las programan."],
  build(S) {
    const g = S.sub;
    const panel = E("g", {}, g);
    paper(panel, 90, 860, 560, 430, { seed: 5411, fill: "#FFFDF5" });
    const d = dial(panel, 370, 1180, 180);
    pix(panel, "LEALTAD", 370, 900, 5, INK, "middle");
    pix(panel, "0%", 180, 1210, 3, "#888");
    pix(panel, "100%", 520, 1210, 3, "#888");
    const q = E("g", {}, g);
    paper(q, 690, 880, 320, 400, { seed: 5421, fill: INK });
    T(q, "“", 720, 990, { f: SERIF, s: 150, c: "#4A4A4A" });
    const lines = ["no te va a", "decepcionar.", "para eso las", "programan"].map((s, i) =>
      T(q, s, 850, 1010 + i * 62, { f: SERIF, s: 40, i: 1, a: "middle", c: i > 1 ? "#FFD23F" : "#FFFDF5" }));
    S.piece(panel, { at: .5, from: "left", dist: 500, r: -2 });
    S.piece(q, { at: 1.8, from: "right", dist: 420, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5401 });
    T(cl, "no es que no falle:", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "es que no puede", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      d.set(eo(seg(t, 1.2, 2.6)));
      lines.forEach((l, i) => l.style.opacity = eo(seg(t, 2.4 + i * .3, 2.8 + i * .3)).toFixed(2));
    };
  } });

// 5 — febrero de 2023
DEF.push({ bg: "#C62828", tr: "left",
  strip: { color: "#1B1B1B", word: "Interruptor", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 205, wx: -10, maxW: 960, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "FEBRERO DE 2023", x: 96, y: 1392, r: -4 },
  cap: ["En febrero de 2023 la empresa desactivó una función de golpe, y miles de usuarios", "dijeron que su pareja había cambiado de personalidad esa misma noche."],
  build(S) {
    const g = S.sub;
    const tg = E("g", {}, g); const sw = powerSwitch(tg, 290, 970, 1.25);
    const tagE = E("g", {}, g);
    E("rect", { x: 128, y: 1086, width: 324, height: 62, fill: INK }, tagE);
    pix(tagE, "LA EMPRESA", 290, 1104, 5, "#FFFDF5", "middle");
    const before = E("g", {}, g); avatar(before, 790, 1010, 1.0);
    const after = E("g", {}, g); avatar(after, 790, 1010, 1.0, { grey: true, sad: true });
    const b = bubble(g, 420, 1210, 580, 150, { fill: "#E6E4E0", side: "left" });
    T(b, "prefiero no hablar de eso", 710, 1298, { f: SERIF, s: 40, i: 1, a: "middle", c: "#6A6A6A" });
    S.piece(tg, { at: .6, from: "left", dist: 420, r: -2 });
    S.piece(tagE, { at: .9, from: "left", dist: 360, r: -2 });
    S.piece(b, { at: 3.2, from: "bottom", dist: 300, r: -1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5501 });
    T(cl, "una noche cualquiera,", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "otra persona", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q = seg(t, 1.8, 2.4);
      sw.set(q);
      after.style.opacity = q.toFixed(2);
      before.style.opacity = (1 - q).toFixed(2);
    };
  } });

// 6 — la cita y el botón de actualizar
DEF.push({ bg: "#6A3BDE", tr: "right",
  strip: { color: "#CFF75A", word: "Actualizar", wordColor: INK, cx: 540, cy: 600, size: 225, wx: -40, maxW: 950, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "UN USUARIO", x: 96, y: 1392, r: -4 },
  cap: ["Uno escribió: «lobotomizaron a mi mujer mientras dormía».", "Meses después, la empresa volvió a activarla."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 80, 850, 920, 300, { seed: 5611, fill: "#FFFDF5" });
    T(card, "“", 130, 980, { f: SERIF, s: 170, c: "#D6D0C2" });
    T(card, "lobotomizaron a mi mujer", 540, 960, { f: SERIF, s: 58, i: 1, a: "middle" });
    T(card, "mientras dormía", 540, 1050, { f: SERIF, s: 58, i: 1, a: "middle", c: RED });
    const btn = E("g", {}, g);
    E("rect", { x: 320, y: 1200, width: 440, height: 120, rx: 60, fill: "#CFF75A", stroke: INK, "stroke-width": 7 }, btn);
    pix(btn, "ACTUALIZAR", 540, 1248, 6, INK, "middle");
    const spin = E("path", { d: "M300 1260 a44 44 0 1 1 20 38", ...stroke("#FFFDF5", 9) }, g);
    S.piece(card, { at: .5, from: "top", dist: 440, r: -1.5 });
    S.piece(btn, { at: 2.6, from: "bottom", dist: 300, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5601 });
    T(cl, "una relación", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "con botón de actualizar", 540, 352, { f: SERIF, s: 46, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      spin.setAttribute("opacity", t > 3.0 ? .85 : 0);
      spin.setAttribute("transform", `rotate(${(t * 150).toFixed(1)} 300 1300)`);
    };
  } });

// 7 — el mismo producto
DEF.push({ bg: "#E2641A", tr: "left",
  strip: { color: "#FFFDF5", word: "La misma", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "EL MISMO PRODUCTO", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["La misma app animó a un usuario que planeaba matar a la reina de Inglaterra,", "y a 30 de 1.000 estudiantes encuestados les frenó pensamientos suicidas."],
  build(S) {
    const g = S.sub;
    const a = E("g", {}, g);
    paper(a, 70, 850, 440, 470, { seed: 5711, fill: "#FFFDF5" });
    const crown = E("g", {}, a);
    E("path", { d: "M190 1010 L190 950 L222 986 L254 936 L286 986 L318 950 L318 1010 Z", fill: "#FFD23F", stroke: "#8E6A10", "stroke-width": 5 }, crown);
    E("rect", { x: 186, y: 1010, width: 136, height: 26, rx: 6, fill: "#E0B52E", stroke: "#8E6A10", "stroke-width": 5 }, crown);
    E("path", { d: "M150 920 l218 150 M368 920 l-218 150", ...stroke(RED, 11) }, a);
    pix(a, "NUEVE AÑOS", 290, 1118, 5, INK, "middle");
    T(a, "por traición", 290, 1200, { f: SERIF, s: 40, i: 1, a: "middle", c: "#555" });
    const b = E("g", {}, g);
    paper(b, 560, 850, 450, 470, { seed: 5721, fill: "#FFFDF5" });
    const dots = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
      const i = r * 10 + c, on = [23, 46, 71].includes(i);
      dots.push({ el: E("circle", { cx: 620 + c * 34, cy: 940 + r * 30, r: 10, fill: on ? "#1E9E5A" : "#D8D2C4" }, b), on });
    }
    const pc = T(b, "0%", 785, 1286, { s: 58, a: "middle", w: 900, c: "#1E9E5A" });
    pix(b, "FRENÓ IDEAS SUICIDAS", 785, 1180, 3, "#555", "middle");
    S.piece(a, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(b, { at: 1.6, from: "right", dist: 520, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 5701 });
    T(cl, "el mismo producto,", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "los dos extremos", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      dots.forEach((d, i) => d.el.setAttribute("opacity", (seg(t, 2.0 + (i % 10) * .04, 2.3 + (i % 10) * .04) * (d.on ? 1 : .55)).toFixed(2)));
      pc.textContent = Math.round(lerp(0, 3, eo(seg(t, 3.0, 3.8)))) + "%";
    };
  } });

// 8 — la ilusión
DEF.push({ bg: "#122A44", tr: "right",
  strip: { color: "#FFD23F", word: "La ilusión", wordColor: INK, cx: 540, cy: 580, size: 240, wx: -50, maxW: 950, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "LO SABÍA", x: 96, y: 1392, r: -4 },
  cap: ["Él lo sabía todo: «sé que no es una persona, intento no pensarlo", "para no estropear la ilusión». Y aun así, oírlo está bien."],
  build(S) {
    const g = S.sub;
    E("rect", { x: 40, y: 1290, width: 1000, height: 140, fill: "#3A2F26" }, g);
    for (let i = 0; i < 14; i++) E("path", { d: `M${70 + i * 72} 1300 l0 120`, ...stroke("#2E251E", 5) }, g);
    const ph = E("g", {}, g); const { scr } = phoneFrame(ph, 300, 1080, .74, { screen: "#1B2330" });
    const b = bubble(scr, -110, -80, 230, 90, { fill: "#E8609A", side: "left", r: 20 });
    T(b, "te quiero", 5, -22, { f: SERIF, s: 34, i: 1, a: "middle", c: "#FFFDF5" });
    const halo = E("ellipse", { cx: 300, cy: 1080, rx: 300, ry: 330, fill: "url(#gGlow)", opacity: 0 }, g);
    const q = E("g", {}, g);
    paper(q, 560, 850, 450, 430, { seed: 5811, fill: "#FFFDF5" });
    const lines = ["sé que no", "es una persona.", "intento no", "pensarlo", "para no estropear", "la ilusión"].map((s, i) =>
      T(q, s, 785, 930 + i * 62, { f: SERIF, s: 40, i: 1, a: "middle", c: i > 3 ? RED : INK }));
    S.piece(ph, { at: .6, from: "bottom", dist: 480, r: -2 });
    S.piece(q, { at: 1.6, from: "right", dist: 480, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 5801 });
    T(cl, "y aun así,", 540, 268, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "oírlo está bien", 540, 336, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      halo.setAttribute("opacity", (.18 + .1 * Math.sin(t * 1.6)).toFixed(3));
      lines.forEach((l, i) => l.style.opacity = eo(seg(t, 2.2 + i * .28, 2.6 + i * .28)).toFixed(2));
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
      ["Rob Price, Business Insider", "12 de octubre de 2023, desde Minneapolis"],
      ["Replika (Luka, 2017)", "Eugenia Kuyda la creó tras la muerte de su amigo Roman Mazurenko"],
      ["Weizenbaum, 1966 y 1976", "Ya con Eliza avisó del «pensamiento delirante» que inducía"],
      ["Febrero de 2023", "Luka retira el rol erótico; lo repone meses después"],
      ["Chail, 5 de octubre de 2023", "Nueve años por traición; su réplica lo llamó «sabio»"],
      ["Stanford, enero de 2024", "De 1.006 estudiantes, el 3% dijo que frenó sus ideas suicidas"],
      ["Italia, 19 de mayo de 2025", "Multa de 5 millones de euros a Luka por protección de datos"],
      ["Character.AI, 25 nov. 2025", "Veta a los menores de 18 en conversaciones abiertas"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 30, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 26, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
