// «El algoritmo que hace los turnos»: scenes (inserted into the paper-collage engine by build.py)
// No real person is drawn: the nurses are anonymous figures in scrubs. What the nurses report is
// shown as their account; the companies' replies get a scene of their own (6).
const DEF = [];

// ---------- props ----------
function nurse(g, cx, cy, s, o = {}) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  const scrub = o.scrub || "#2E8B8B", skin = o.skin || "#E8C3A0";
  E("path", { d: "M-78 150 C-72 44 -38 16 0 16 C38 16 72 44 78 150 Z", fill: scrub, stroke: "#1E5F5F", "stroke-width": 5 }, k);
  E("path", { d: "M-26 16 L0 70 L26 16 Z", fill: "#FFFDF5" }, k);
  E("circle", { cx: 0, cy: -42, r: 48, fill: skin, stroke: "#C49A76", "stroke-width": 4 }, k);
  E("path", { d: "M-50 -58 C-44 -104 44 -104 50 -58 C30 -78 -30 -78 -50 -58 Z", fill: o.hair || "#3A2F28" }, k);
  E("rect", { x: 14, y: 70, width: 34, height: 48, rx: 5, fill: "#FFFDF5", stroke: "#B9B3A6", "stroke-width": 3 }, k);
  if (o.senior) { E("circle", { cx: -40, cy: 76, r: 20, fill: "#FFD23F", stroke: INK, "stroke-width": 4 }, k);
    E("path", { d: "M-40 64 l5 11 l12 2 l-9 9 l3 12 l-11 -6 l-11 6 l3 -12 l-9 -9 l12 -2 Z", fill: INK }, k); }
  return k;
}

function hospital(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -230, y: -190, width: 460, height: 350, rx: 10, fill: "#E7E2D6", stroke: "#8C8575", "stroke-width": 6 }, k);
  E("rect", { x: -230, y: -250, width: 460, height: 64, rx: 8, fill: "#C9C2B0", stroke: "#8C8575", "stroke-width": 6 }, k);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++)
    E("rect", { x: -196 + c * 66, y: -160 + r * 76, width: 46, height: 52, rx: 5, fill: "#9FC3DE", stroke: "#8C8575", "stroke-width": 4 }, k);
  E("rect", { x: -54, y: 60, width: 108, height: 100, rx: 6, fill: "#5E6B78", stroke: "#36404A", "stroke-width": 5 }, k);
  E("path", { d: "M-26 -238 h52 v-30 h-52 Z", fill: "#C9C2B0" }, k);
  E("path", { d: "M-14 -300 h28 v22 h22 v28 h-22 v22 h-28 v-22 h-22 v-28 h22 Z", fill: RED, stroke: "#8E1B1B", "stroke-width": 5 }, k);
  return k;
}

function roster(g, x, y, cols, rows, cw, ch, picked) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, on = picked.includes(i);
    const k = E("rect", { x: x + c * cw, y: y + r * ch, width: cw - 10, height: ch - 10, rx: 6,
      fill: "#EFEADF", stroke: "#C5BEAE", "stroke-width": 3 }, g);
    cells.push({ k, on, x: x + c * cw, y: y + r * ch });
  }
  return cells;
}

function badge(g, x, y, w, h, tag, col, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  E("rect", { x: x + 14, y: y + 14, width: w - 28, height: 46, rx: 6, fill: col }, k);
  pix(k, tag, x + w / 2, y + 28, 3, "#fff", "middle");
  E("circle", { cx: x + w / 2, cy: y + 104, r: 26, fill: "#DCD6C8" }, k);
  E("path", { d: `M${x + w / 2 - 30} ${y + 158} C${x + w / 2 - 26} ${y + 128} ${x + w / 2 + 26} ${y + 128} ${x + w / 2 + 30} ${y + 158} Z`, fill: "#DCD6C8" }, k);
  for (let i = 0; i < 2; i++) E("rect", { x: x + 24, y: y + 176 + i * 20, width: w - 48 - i * 24, height: 10, rx: 5, fill: "#DCD6C8" }, k);
  return k;
}

function envelope(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -110, y: -74, width: 220, height: 148, rx: 8, fill: "#FFFDF5", stroke: "#B9B3A6", "stroke-width": 5 }, k);
  E("path", { d: "M-110 -74 L0 10 L110 -74", ...stroke("#B9B3A6", 5) }, k);
  return k;
}

function office(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("rect", { x: -120, y: -220, width: 240, height: 380, rx: 8, fill: "#4A5260", stroke: "#272D36", "stroke-width": 6 }, k);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++)
    E("rect", { x: -96 + c * 68, y: -196 + r * 60, width: 48, height: 40, rx: 4, fill: r === 2 && c === 1 ? "#FFD23F" : "#6E7886" }, k);
  E("rect", { x: -40, y: 90, width: 80, height: 70, rx: 5, fill: "#2F3741" }, k);
  return k;
}

function statement(g, x, y, w, h, who, lines, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  E("rect", { x: x + 20, y: y + 20, width: pixW(who, 4) + 24, height: 48, fill: INK }, k);
  pix(k, who, x + 32, y + 34, 4, "#fff");
  T(k, "“", x + 22, y + 170, { f: SERIF, s: 130, c: "#D6D0C2" });
  lines.forEach((s, i) => T(k, s, x + w / 2, y + 128 + i * 52, { f: SERIF, s: 36, i: 1, a: "middle" }));
  return k;
}

// =====================================================================
// 1 — cincuenta turnos
DEF.push({ bg: "#107C72", tr: "left",
  strip: { color: "#FFFDF5", word: "Cincuenta", wordColor: INK, cx: 540, cy: 590, size: 225, wx: -30, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "CUATRO MESES", x: 96, y: 1392, r: -4 },
  cap: ["Una enfermera de cuidados intensivos pidió 50 turnos concretos en cuatro meses,", "y más de la mitad de las veces el programa le puso otros."],
  build(S) {
    const g = S.sub;
    const sheet = E("g", {}, g);
    paper(sheet, 70, 850, 700, 470, { seed: 6111, fill: "#FFFDF5" });
    pix(sheet, "CUADRANTE", 420, 890, 4, "#666", "middle");
    const picked = [1, 3, 6, 8, 11, 13, 16, 18, 21, 24, 27, 29, 32, 34, 37, 39, 42, 44, 47, 49];
    const cells = roster(sheet, 110, 930, 10, 5, 62, 72, picked);
    const moved = picked.filter((_, i) => i % 2 === 0);
    const card = E("g", {}, g);
    paper(card, 800, 960, 220, 260, { seed: 6121, fill: INK });
    const n = T(card, "0", 910, 1090, { s: 96, a: "middle", w: 900, c: "#FFD23F" });
    pix(card, "CAMBIADOS", 910, 1130, 3, "#fff", "middle");
    S.piece(sheet, { at: .5, from: "left", dist: 560, r: -2 });
    S.piece(card, { at: 2.8, from: "right", dist: 380, r: 4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6101 });
    T(cl, "pidió unos turnos,", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "le dieron otros", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cells.forEach((c, i) => {
        const on = picked.includes(i), q = seg(t, .9 + (i % 10) * .04, 1.2 + (i % 10) * .04);
        c.k.setAttribute("opacity", q.toFixed(2));
        if (!on) return;
        const gone = moved.includes(i) ? seg(t, 2.0 + (i % 7) * .09, 2.4 + (i % 7) * .09) : 0;
        c.k.setAttribute("fill", gone > .5 ? "#E8402A" : "#2E8B8B");
        c.k.setAttribute("transform", gone > 0 ? `translate(${(gone * (i % 3 - 1) * 64).toFixed(1)} ${(gone * 72).toFixed(1)})` : "");
      });
      n.textContent = Math.round(lerp(0, 27, eo(seg(t, 3.2, 4.2))));
    };
  } });

// 2 — qué es Timpani
DEF.push({ bg: "#27476E", tr: "right",
  strip: { color: "#FFD23F", word: "Timpani", wordColor: INK, cx: 540, cy: 600, size: 270, wx: -110, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "130 DE 190", x: 96, y: 1392, r: -4 },
  cap: ["Lo hace Timpani, el sistema que la mayor cadena de hospitales de EE. UU.", "construyó con Palantir y ya usa en unos 130 de sus 190 centros."],
  build(S) {
    const g = S.sub;
    const hs = E("g", {}, g); hospital(hs, 340, 1090, .74);
    const app = E("g", {}, g);
    paper(app, 650, 870, 350, 350, { seed: 6211, fill: "#FFFDF5" });
    const drum = E("g", {}, app);
    E("path", { d: "M700 1010 L730 1130 L870 1130 L900 1010 Z", fill: "#B06A2E", stroke: "#6E3F17", "stroke-width": 5 }, drum);
    E("ellipse", { cx: 800, cy: 1010, rx: 100, ry: 34, fill: "#E8DCC4", stroke: "#6E3F17", "stroke-width": 5 }, drum);
    for (let i = 0; i < 5; i++) E("circle", { cx: 712 + i * 44, cy: 1026, r: 7, fill: "#6E3F17" }, drum);
    const stick = E("line", { x1: 800, y1: 940, x2: 800, y2: 880, ...stroke("#8A6A3A", 9) }, app);
    E("circle", { cx: 800, cy: 876, r: 14, fill: "#E8DCC4", stroke: "#6E3F17", "stroke-width": 4 }, app);
    pix(app, "TIMPANI", 800, 1160, 5, INK, "middle");
    const bar = E("g", {}, g);
    paper(bar, 70, 1290, 940, 120, { seed: 6221, fill: "#FFFDF5" });
    const dots = [];
    for (let i = 0; i < 19; i++) dots.push(E("rect", { x: 110 + i * 47, y: 1320, width: 34, height: 60, rx: 6, fill: "#D8D2C4" }, bar));
    S.piece(hs, { at: .5, from: "bottom", dist: 560, r: -2 });
    S.piece(app, { at: 1.5, from: "right", dist: 440, r: 3 });
    S.piece(bar, { at: 2.6, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6201 });
    T(cl, "lleva el compás", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "de 130 hospitales", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      stick.setAttribute("y2", (880 + Math.abs(Math.sin(t * 3)) * 42).toFixed(1));
      dots.forEach((d, i) => d.setAttribute("fill", i < Math.round(13 * eo(seg(t, 3.0, 4.2))) ? "#FFD23F" : "#D8D2C4"));
    };
  } });

// 3 — la única veterana
DEF.push({ bg: "#C62828", tr: "left",
  strip: { color: "#1B1B1B", word: "Sola", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 300, wx: -160, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LA ÚNICA VETERANA", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["Ella cuenta que acabó siendo la única veterana del turno con cuatro novatas,", "y que tuvo que retrasar a los pacientes más graves para ir guiándolas."],
  build(S) {
    const g = S.sub;
    const team = E("g", {}, g);
    const n0 = nurse(team, 180, 1120, .84, { senior: true, scrub: "#0F5F5F" });
    const rest = [0, 1, 2, 3].map(i => nurse(team, 420 + i * 168, 1134, .68, { scrub: "#7FBEBE", hair: ["#3A2F28", "#5A4030", "#2A2420", "#4A3A2A"][i] }));
    const tags = [["VETERANA", 96, 1296, INK], ["NOVATA", 362, 1304, "#555"], ["NOVATA", 530, 1304, "#555"], ["NOVATA", 698, 1304, "#555"], ["NOVATA", 866, 1304, "#555"]]
      .map(([tx, x, y, c], i) => { const k = E("g", {}, g);
        E("rect", { x, y, width: pixW(tx, 3) + 18, height: 34, fill: i ? "#FFFDF5" : "#FFD23F" }, k);
        pix(k, tx, x + 9, y + 9, 3, c); return k; });
    const wait = E("g", {}, g);
    paper(wait, 700, 860, 300, 180, { seed: 6311, fill: "#FFFDF5" });
    pix(wait, "EL MÁS GRAVE", 850, 900, 3, "#666", "middle");
    T(wait, "espera", 850, 990, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(team, { at: .5, from: "bottom", dist: 520, r: -1 });
    S.piece(wait, { at: 3.0, from: "top", dist: 320, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6301 });
    T(cl, "no es que falte gente:", 540, 278, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "falta experiencia", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => tags.forEach((k, i) => k.style.opacity = eo(seg(t, 1.4 + i * .22, 1.7 + i * .22)).toFixed(2));
  } });

// 4 — los días libres
DEF.push({ bg: "#D9A400", tr: "right",
  strip: { color: "#FFFDF5", word: "Días libres", wordColor: INK, cx: 540, cy: 600, size: 215, wx: -20, maxW: 960, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "LO ADMITE LA EMPRESA", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["El hospital admite que programa al personal en el 1% de los días libres pedidos;", "las enfermeras dicen que antes eso no pasaba nunca."],
  build(S) {
    const g = S.sub;
    const cal = E("g", {}, g);
    paper(cal, 80, 860, 560, 460, { seed: 6411, fill: "#FFFDF5" });
    E("rect", { x: 80, y: 860, width: 560, height: 78, fill: INK }, cal);
    pix(cal, "MI MES", 360, 886, 5, "#fff", "middle");
    const days = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const i = r * 5 + c, red = i === 7 || i === 12;
      days.push({ el: E("rect", { x: 120 + c * 100, y: 970 + r * 84, width: 78, height: 64, rx: 7, fill: red ? "#F6C9C9" : "#EFEADF", stroke: red ? RED : "#D5CEBE", "stroke-width": 4 }, cal), red });
    }
    const stamp = E("g", { }, g);
    E("rect", { x: 300, y: 1078, width: 230, height: 70, rx: 8, fill: "none", stroke: RED, "stroke-width": 7 }, stamp);
    pix(stamp, "TE TOCA", 415, 1100, 5, RED, "middle");
    const pc = E("g", {}, g);
    paper(pc, 700, 930, 300, 300, { seed: 6421, fill: INK });
    const num = T(pc, "0%", 850, 1080, { s: 92, a: "middle", w: 900, c: "#FFD23F" });
    pix(pc, "DE LOS DÍAS", 850, 1130, 3, "#fff", "middle");
    pix(pc, "LIBRES PEDIDOS", 850, 1166, 3, "#fff", "middle");
    S.piece(cal, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(pc, { at: 2.6, from: "right", dist: 400, r: 4 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6401 });
    T(cl, "antes era cero;", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "ahora le pasa a todas", 540, 352, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q = eb(seg(t, 1.5, 1.9));
      stamp.style.opacity = q > 0 ? 1 : 0;
      sxf(stamp, 415, 1113, 1 + (1 - q) * .8, -8);
      num.textContent = (eo(seg(t, 3.0, 3.8)) > .5 ? "1" : "0") + "%";
      days.forEach((d, i) => d.el.setAttribute("opacity", seg(t, .9 + (i % 5) * .05, 1.2 + (i % 5) * .05).toFixed(2)));
    };
  } });

// 5 — la oficina central
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "Denegado", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -50, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "OFICINA CENTRAL", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Antes lo arreglaba el supervisor del centro;", "ahora la reclamación va a una oficina central que contesta sin explicar nada."],
  build(S) {
    const g = S.sub;
    const of = E("g", {}, g); office(of, 850, 1080, .95);
    const env = E("g", {}, g); envelope(env, 260, 1000, .9);
    const path = drawable(E("path", { d: "M390 990 C530 910 640 920 720 980", ...stroke("#FFFDF5", 7), "stroke-dasharray": "none" }, g));
    const back = E("g", {}, g); envelope(back, 250, 1250, .86);
    const st = E("g", { transform: "rotate(-9 470 1226)" }, back);
    E("rect", { x: 346, y: 1190, width: 248, height: 72, rx: 8, fill: "#FFFDF5" }, st);
    E("rect", { x: 346, y: 1190, width: 248, height: 72, rx: 8, fill: "none", stroke: RED, "stroke-width": 7 }, st);
    pix(st, "DENEGADO", 470, 1213, 5, RED, "middle");
    const path2 = drawable(E("path", { d: "M720 1190 C640 1300 500 1320 390 1286", ...stroke("#FFFDF5", 7) }, g));
    S.piece(of, { at: .6, from: "right", dist: 460, r: 2 });
    S.piece(env, { at: 1.2, from: "left", dist: 400, r: -3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6501 });
    T(cl, "ya no decide", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "quien te conoce", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      path.set(seg(t, 1.9, 2.6));
      path2.set(seg(t, 3.0, 3.7));
      const q = eb(seg(t, 3.4, 3.9));
      back.style.opacity = q > 0 ? 1 : 0;
      back.setAttribute("transform", `translate(0 ${((1 - q) * -90).toFixed(1)})`);
    };
  } });

// 6 — la versión de las empresas
DEF.push({ bg: "#C7C1B2", tr: "right",
  strip: { color: "#1B1B1B", word: "Responden", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 225, wx: -40, maxW: 950, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "SU VERSIÓN", x: 96, y: 1392, r: -4 },
  cap: ["La cadena responde que la decisión final la toman las jefas de enfermería,", "y Palantir, que su software solo presenta la información y que decide el cliente."],
  build(S) {
    const g = S.sub;
    const a = statement(g, 60, 850, 440, 400, "EL HOSPITAL", ["la decisión final", "la toman las jefas", "de enfermería,", "no el programa"], 6611);
    const b = statement(g, 560, 900, 440, 400, "PALANTIR", ["el software solo", "presenta la", "información;", "decide el cliente"], 6621);
    const foot = E("g", {}, g);
    paper(foot, 120, 1290, 820, 110, { seed: 6631, fill: INK });
    T(foot, "«más del 98% mezclan competencias y experiencia»", 530, 1360, { s: 32, a: "middle", c: "#FFD23F", w: 700 });
    S.piece(a, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(b, { at: 1.4, from: "right", dist: 520, r: 2 });
    S.piece(foot, { at: 3.0, from: "bottom", dist: 260, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6601 });
    T(cl, "las dos empresas", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "dicen lo mismo:", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 7 — radiología
DEF.push({ bg: "#E2641A", tr: "left",
  strip: { color: "#FFFDF5", word: "Otra ficha", wordColor: INK, cx: 540, cy: 600, size: 225, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "RADIOLOGÍA", x: 96, y: 1392, r: -4 },
  cap: ["En una cadena de radiología, otra herramienta de la misma plataforma", "vinculó peticiones al paciente equivocado e inventó datos personales."],
  build(S) {
    const g = S.sub;
    const ord = E("g", {}, g);
    paper(ord, 70, 860, 380, 420, { seed: 6711, fill: "#FFFDF5" });
    pix(ord, "ORDEN MÉDICA", 260, 900, 4, "#666", "middle");
    for (let i = 0; i < 6; i++) E("path", { d: `M110 ${970 + i * 44} q90 ${i % 2 ? 10 : -10} 200 0`, ...stroke("#B9B3A6", 6) }, ord);
    pix(ord, "PACIENTE A", 260, 1230, 4, INK, "middle");
    const pat = [0, 1].map(i => { const k = E("g", {}, g), y = 860 + i * 230;
      paper(k, 600, y, 400, 200, { seed: 6721 + i, fill: "#FFFDF5" });
      E("circle", { cx: 680, cy: y + 86, r: 36, fill: "#DCD6C8" }, k);
      pix(k, i ? "PACIENTE B" : "PACIENTE A", 850, y + 60, 4, INK, "middle");
      for (let j = 0; j < 2; j++) E("rect", { x: 740, y: y + 104 + j * 30, width: 210 - j * 70, height: 14, rx: 7, fill: "#DCD6C8" }, k);
      return k; });
    const arrow = harrow(g, 460, 1070, 600, 1180, { c: RED, w: 10, bend: -.2, hl: 34 });
    const made = E("g", {}, g);
    paper(made, 600, 1300, 400, 110, { seed: 6731, fill: INK });
    T(made, "y datos inventados", 800, 1372, { f: SERIF, s: 42, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(ord, { at: .5, from: "left", dist: 480, r: -2 });
    S.piece(pat[0], { at: 1.2, from: "right", dist: 440, r: 2 });
    S.piece(pat[1], { at: 1.6, from: "right", dist: 440, r: -2 });
    S.piece(made, { at: 3.4, from: "bottom", dist: 280, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6701 });
    T(cl, "no es solo el turno:", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "también la ficha", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => arrow.set(seg(t, 2.4, 3.2));
  } });

// 8 — ocho ciudades
DEF.push({ bg: "#1E7A52", tr: "right",
  strip: { color: "#FFD23F", word: "Ocho", wordColor: INK, cx: 540, cy: 590, size: 300, wx: -150, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "27 AGO. 2026", x: 96, y: 1392, r: -4 },
  cap: ["El 27 de agosto de 2026, cientos de enfermeras cortaron el tráfico", "en ocho ciudades pidiendo que los hospitales rompan con Palantir."],
  build(S) {
    const g = S.sub;
    const map = E("g", {}, g);
    paper(map, 70, 840, 620, 440, { seed: 6811, fill: "#EDE6D4" });
    E("path", { d: "M130 960 C210 900 300 930 360 900 C430 866 520 890 620 880 L640 1040 C560 1100 520 1180 430 1200 C330 1222 220 1180 150 1120 Z", fill: "#D9D0B8", stroke: "#BDB29A", "stroke-width": 5 }, map);
    const pins = [[190, 1000], [230, 1120], [330, 980], [420, 1060], [500, 930], [560, 1030], [620, 1120], [300, 1180]].map(([x, y]) => {
      const k = E("g", {}, map);
      E("path", { d: `M${x} ${y} C${x - 28} ${y - 30} ${x - 22} ${y - 70} ${x} ${y - 70} C${x + 22} ${y - 70} ${x + 28} ${y - 30} ${x} ${y} Z`, fill: RED, stroke: "#fff", "stroke-width": 4 }, k);
      E("circle", { cx: x, cy: y - 46, r: 10, fill: "#fff" }, k);
      return k; });
    const nr = E("g", {}, g); nurse(nr, 830, 1180, .82, { scrub: "#E8402A" });
    const sign = E("g", {}, g);
    paper(sign, 700, 850, 320, 190, { seed: 6821, fill: "#FFFDF5" });
    T(sign, "fuera", 860, 930, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(sign, "de los hospitales", 860, 1000, { f: SERIF, s: 40, i: 1, a: "middle", c: RED });
    E("line", { x1: 845, y1: 1040, x2: 812, y2: 1240, ...stroke("#8A6A3A", 14) }, sign);
    S.piece(map, { at: .5, from: "left", dist: 520, r: -2 });
    S.piece(nr, { at: 1.6, from: "bottom", dist: 420, r: 2 });
    S.piece(sign, { at: 2.2, from: "top", dist: 380, r: -3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 6801 });
    T(cl, "ya no es una queja:", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "es un conflicto", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => pins.forEach((p, i) => { const q = eb(seg(t, 1.2 + i * .16, 1.5 + i * .16));
      p.style.opacity = q > 0 ? 1 : 0;
      p.setAttribute("transform", `translate(0 ${((1 - q) * -60).toFixed(1)}) scale(1)`); });
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
      ["WIRED", "Reportaje sobre Timpani en HCA Healthcare y Rayus Radiology"],
      ["Timpani", "Construido con Palantir Foundry; desde 2023 en ~130 de 190 centros"],
      ["El 1% de días libres", "Cifra de la propia HCA; las enfermeras dicen que antes era cero"],
      ["HCA responde", "Deciden las jefas de enfermería; «más del 98% mezclan experiencia»"],
      ["Palantir responde", "«El cliente es responsable de los datos y las decisiones»"],
      ["National Nurses United", "~10.000 de 100.000 enfermeras; un conflicto camino de arbitraje"],
      ["Una demanda", "Una exempleada alega represalias y borrado de datos: sin respuesta judicial"],
      ["27 de agosto de 2026", "Protestas en ocho ciudades para sacar a Palantir de los hospitales"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 30, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 26, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
