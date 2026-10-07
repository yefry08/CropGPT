// «El nuevo complejo»: scenes (inserted into the paper-collage engine by build.py)
// Two hard rules, kept everywhere below: the film never claims this was the first killing by a
// machine, and it never links the arms company of scenes 4-5 to the Ukrainian test of scene 1.
// No person is drawn — machines, papers, money and contracts only.
const DEF = [];

// ---------- props ----------
// a fixed-wing attack drone seen from above
function drone(g, cx, cy, s, o = {}) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  const body = o.body || "#D8D2C4", dark = o.dark || "#6E6758";
  E("path", { d: "M0 -74 C14 -52 18 -20 18 14 L18 56 L-18 56 L-18 14 C-18 -20 -14 -52 0 -74 Z", fill: body, stroke: dark, "stroke-width": 6 }, k);
  E("path", { d: "M-16 -6 L-104 26 L-104 44 L-16 24 Z M16 -6 L104 26 L104 44 L16 24 Z", fill: o.wing || "#C9C2B0", stroke: dark, "stroke-width": 5 }, k);
  E("path", { d: "M-14 48 L-48 70 L-48 82 L-14 70 Z M14 48 L48 70 L48 82 L14 70 Z", fill: o.wing || "#C9C2B0", stroke: dark, "stroke-width": 5 }, k);
  E("circle", { cx: 0, cy: -46, r: 11, fill: o.eye || RED, stroke: dark, "stroke-width": 4 }, k);
  E("path", { d: "M-9 -66 q9 -12 18 0", ...stroke("#fff", 4), opacity: .5 }, k);
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

// a sheet of a report: ruled lines, some of them blacked out
function report(g, x, y, w, h, seed, redact) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  for (let i = 0; i < 9; i++) {
    const ly = y + 86 + i * (h - 118) / 9, lw = (w - 80) * (i % 3 === 2 ? .6 : .92);
    const black = redact && redact.includes(i);
    E("rect", { x: x + 40, y: ly, width: lw, height: 14, rx: 3, fill: black ? INK : "#CFC8B8" }, k);
  }
  return k;
}

// a signature on a dotted line
function signLine(g, x, y, w, col) {
  const k = E("g", {}, g);
  E("path", { d: `M${x} ${y} L${x + w} ${y}`, ...stroke("#9A9484", 4), "stroke-dasharray": "10 10" }, k);
  const sg = drawable(E("path", { d: `M${x + 14} ${y - 6} q22 -34 36 -4 q10 22 24 -10 q14 -30 30 2 q8 20 26 -12 q10 -18 22 4`, ...stroke(col || INK, 6) }, k));
  return { k, sg };
}

// a factory: shed roofs, chimney, smoke
function factory(g, x, y, w, h, seed) {
  const k = E("g", {}, g);
  E("rect", { x, y: y + 60, width: w, height: h - 60, rx: 4, fill: "#C9C2B0", stroke: "#6E6758", "stroke-width": 6 }, k);
  let d = "";
  for (let i = 0; i < 4; i++) { const sx = x + i * w / 4; d += `M${sx} ${y + 60} L${sx + w / 8} ${y + 10} L${sx + w / 4} ${y + 60} `; }
  E("path", { d, fill: "#D8D2C4", stroke: "#6E6758", "stroke-width": 6 }, k);
  for (let i = 0; i < 4; i++) E("rect", { x: x + 24 + i * w / 4, y: y + h - 120, width: w / 4 - 46, height: 70, rx: 3, fill: "#4A5560" }, k);
  E("rect", { x: x + w - 72, y: y - 110, width: 44, height: 174, fill: "#B5AE9C", stroke: "#6E6758", "stroke-width": 6 }, k);
  return k;
}

// a pentagon outline with a hole, the way a cut-out looks
function pentagon(g, cx, cy, r, fill, inner) {
  const pts = (rr) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(" L");
  const k = E("g", {}, g);
  E("path", { d: `M${pts(r)} Z M${pts(r * inner)} Z`, fill, "fill-rule": "evenodd", stroke: "#3A424C", "stroke-width": 6 }, k);
  return k;
}

// =====================================================================
// 1 — la prueba que sólo conocemos por su relato
DEF.push({ bg: "#1C2B1F", tr: "left",
  strip: { color: "#CFF75A", word: "Diez", wordColor: INK, cx: 540, cy: 590, size: 280, wx: -40, maxW: 900, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "UNA PRUEBA", x: 96, y: 1392, r: -4 },
  cap: ["Un fabricante ucraniano de drones contó que, en una prueba, diez drones",
        "atacaron por su cuenta en «modo Terminator». Lo contó él: no hay grabación."],
  build(S) {
    const g = S.sub;
    // ten drones, a loose V over a dark field
    const flock = E("g", {}, g), ds = [];
    for (let i = 0; i < 10; i++) {
      const col = i % 5, row = Math.floor(i / 5);
      const x = 180 + col * 170 + row * 86, y = 940 + row * 150;
      const w = E("g", {}, flock);
      drone(w, x, y, .62, { eye: i === 0 ? "#CFF75A" : RED });
      ds.push({ w, x, y, ph: i * .61 });
    }
    S.piece(flock, { at: .5, from: "top", dist: 420, r: -1 });
    const q = E("g", {}, g);
    paper(q, 120, 1145, 840, 205, { seed: 2111, fill: INK });
    T(q, "«modo Terminator»", 540, 1248, { f: SERIF, s: 62, i: 1, a: "middle", c: "#CFF75A" });
    T(q, "lo contó él; no hay grabación", 540, 1318, { f: SERIF, s: 38, i: 1, a: "middle", c: "#CFC8B8" });
    S.piece(q, { at: 2.6, from: "bottom", dist: 280, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2101 });
    T(cl, "un fabricante contó", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "que atacaron solos", 540, 348, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => ds.forEach((d, i) => {
      const dx = Math.sin(t * .9 + d.ph) * 16, dy = -clamp(seg(t, 1.0, 7.0)) * 70 + Math.cos(t * 1.3 + d.ph) * 10;
      d.w.setAttribute("transform", `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
      d.w.style.opacity = eo(seg(t, .5 + i * .08, .9 + i * .08)).toFixed(2);
    });
  } });

// 2 — el mismo titular, en 2021
DEF.push({ bg: "#331B46", tr: "right",
  strip: { color: "#FFD23F", word: "Otra vez", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 940, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "ONU, LIBIA, 2021", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["El mismo titular ya se publicó en 2021, con un informe de la ONU sobre Libia.",
        "Tampoco se pudo confirmar."],
  build(S) {
    const g = S.sub;
    const rp = E("g", {}, g);
    report(rp, 80, 850, 520, 520, 2211, [3, 4, 7]);
    E("rect", { x: 120, y: 886, width: pixW("INFORME ONU", 4) + 22, height: 46, fill: INK }, rp);
    pix(rp, "INFORME ONU", 131, 899, 4, "#fff");
    S.piece(rp, { at: .5, from: "left", dist: 460, r: -1.5 });
    const mp = E("g", {}, g);
    paper(mp, 650, 870, 330, 340, { seed: 2221, fill: "#E7E2D6" });
    E("path", { d: "M690 1050 L706 960 L772 934 L838 952 L906 930 L944 972 L930 1058 L872 1094 L792 1082 L724 1110 Z", fill: "#C98A3A", stroke: "#8C5A1E", "stroke-width": 6 }, mp);
    T(mp, "Libia", 815, 1172, { f: SERIF, s: 42, i: 1, a: "middle" });
    S.piece(mp, { at: 1.6, from: "right", dist: 380, r: 1 });
    const st = E("g", {}, g);
    stamp(st, 700, 1300, "tampoco se confirmó", -7, RED);
    S.piece(st, { at: 3.2, from: "pop", r: 0 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2201 });
    T(cl, "este titular ya salió", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "hace cuatro años", 540, 348, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const hc = hcircle(g, 815, 1010, 150, 112, { seed: 9, c: RED, w: 8 });
    return (t) => hc.set(seg(t, 2.2, 3.1));
  } });

// 3 — Eisenhower, 1961 (sin dibujar a nadie: la radio y la frase)
DEF.push({ bg: "#7A3214", tr: "left",
  strip: { color: "#FFFDF5", word: "1961", wordColor: INK, cx: 540, cy: 585, size: 290, wx: -30, maxW: 880, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "UN DISCURSO", x: 96, y: 1392, r: -4 },
  cap: ["Lo que sí es comprobable es quién fabrica estas armas.",
        "En 1961, Eisenhower avisó del complejo militar-industrial."],
  build(S) {
    const g = S.sub;
    // a wooden radio set with a dial and a speaker grille
    const rd = E("g", {}, g);
    E("rect", { x: 110, y: 880, width: 480, height: 330, rx: 18, fill: "url(#gWood)", stroke: "#4A2D12", "stroke-width": 7 }, rd);
    E("rect", { x: 146, y: 918, width: 240, height: 254, rx: 10, fill: "#2B1B0C" }, rd);
    for (let i = 0; i < 9; i++) E("rect", { x: 160, y: 932 + i * 28, width: 212, height: 12, rx: 6, fill: "#6E4A22" }, rd);
    E("circle", { cx: 488, cy: 1000, r: 56, fill: "#E7E2D6", stroke: "#4A2D12", "stroke-width": 6 }, rd);
    const needle = E("path", { d: "M488 1000 L488 952", ...stroke(RED, 7) }, rd);
    E("rect", { x: 430, y: 1098, width: 116, height: 44, rx: 8, fill: "#C9C2B0", stroke: "#4A2D12", "stroke-width": 5 }, rd);
    pix(rd, "1961", 488, 1110, 4, INK, "middle");
    S.piece(rd, { at: .5, from: "left", dist: 460, r: -1.5 });
    // waveform coming out of it
    const wv = E("g", {}, g), bars = [];
    for (let i = 0; i < 14; i++) bars.push(E("rect", { x: 644 + i * 26, y: 980, width: 17, height: 40, rx: 8, fill: "#FFD23F" }, wv));
    S.piece(wv, { at: 1.4, from: "right", dist: 300, r: 0 });
    const q = E("g", {}, g);
    paper(q, 110, 1195, 870, 175, { seed: 2311, fill: INK });
    T(q, "«complejo militar-industrial»", 545, 1272, { f: SERIF, s: 54, i: 1, a: "middle", c: "#FFD23F" });
    T(q, "discurso de despedida, 17 de enero", 545, 1336, { f: SERIF, s: 32, i: 1, a: "middle", c: "#CFC8B8" });
    S.piece(q, { at: 2.4, from: "bottom", dist: 260, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2301 });
    T(cl, "lo comprobable es", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "quién las fabrica", 540, 348, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      needle.setAttribute("transform", `rotate(${(Math.sin(t * 1.1) * 32).toFixed(1)} 488 1000)`);
      bars.forEach((b, i) => { const h = 22 + Math.abs(Math.sin(t * 3.1 + i * .7)) * 126 * clamp(seg(t, 1.5, 2.1));
        b.setAttribute("height", h.toFixed(1)); b.setAttribute("y", (1020 - h / 2).toFixed(1)); });
    };
  } });

// 4 — de las gafas de realidad virtual a la fábrica de armas
DEF.push({ bg: "#14384A", tr: "right",
  strip: { color: "#FFD23F", word: "2017", wordColor: INK, cx: 540, cy: 585, size: 290, wx: -30, maxW: 880, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "MISMO FUNDADOR", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["El chaval que vendió sus gafas de realidad virtual a Facebook por 2.000 millones",
        "salió de la empresa en 2017 y montó una fábrica de armas."],
  build(S) {
    const g = S.sub;
    // VR headset
    const vr = E("g", {}, g);
    E("rect", { x: 90, y: 900, width: 330, height: 200, rx: 46, fill: "#2B313A", stroke: "#11161C", "stroke-width": 7 }, vr);
    E("rect", { x: 122, y: 936, width: 124, height: 100, rx: 20, fill: "#4C86C6" }, vr);
    E("rect", { x: 264, y: 936, width: 124, height: 100, rx: 20, fill: "#4C86C6" }, vr);
    E("path", { d: "M138 950 q26 -16 52 2", ...stroke("#fff", 6), opacity: .55 }, vr);
    E("path", { d: "M420 940 q86 60 0 120", ...stroke("#2B313A", 16) }, vr);
    const price = E("g", {}, vr);
    paper(price, 110, 1130, 300, 110, { seed: 2411, fill: "#CFF75A" });
    T(price, "2.000 M $", 260, 1204, { f: SERIF, s: 54, i: 1, a: "middle" });
    S.piece(vr, { at: .5, from: "left", dist: 440, r: -1.5 });
    // factory with a drone leaving it
    const fc = E("g", {}, g);
    factory(fc, 600, 920, 380, 300, 2421);
    const d2 = E("g", {}, fc);
    drone(d2, 790, 1300, .5);
    S.piece(fc, { at: 2.2, from: "right", dist: 400, r: 1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2401 });
    T(cl, "vendió gafas de juguete,", 540, 272, { f: SERIF, s: 44, i: 1, a: "middle" });
    T(cl, "ahora vende armas", 540, 348, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    const ar = harrow(g, 440, 1160, 600, 1120, { c: RED, w: 9, bend: -.28 });
    return (t) => {
      ar.set(seg(t, 1.9, 2.6));
      const q = clamp(seg(t, 2.9, 4.4));
      d2.setAttribute("transform", `translate(0 ${(-q * 150).toFixed(1)})`);
      d2.style.opacity = q.toFixed(2);
    };
  } });

// 5 — la valoración y el contrato
DEF.push({ bg: "#3A1530", tr: "left",
  strip: { color: "#CFF75A", word: "30.500", wordColor: INK, cx: 540, cy: 595, size: 250, wx: -70, maxW: 940, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "EN UN AÑO", x: 96, y: 1392, r: -4 },
  cap: ["En un año pasó de valer 14.000 millones a 30.500, y se quedó el contrato de",
        "22.000 millones de gafas de combate que Microsoft no sacó adelante."],
  build(S) {
    const g = S.sub;
    const ch = E("g", {}, g);
    E("path", { d: torn(80, 850, 500, 500, 2511, 8, 24), fill: "url(#gPaper)" }, ch);
    E("path", { d: "M130 1300 L540 1300", ...stroke(INK, 6) }, ch);
    const b1 = E("rect", { x: 170, y: 1300, width: 110, height: 0, fill: "#9A9484" }, ch);
    const b2 = E("rect", { x: 380, y: 1300, width: 110, height: 0, fill: RED }, ch);
    T(ch, "2024", 225, 1342, { s: 28, a: "middle", c: "#555" });
    T(ch, "2025", 435, 1342, { s: 28, a: "middle", c: "#555" });
    const n1 = T(ch, "", 225, 1280, { f: SERIF, s: 34, i: 1, a: "middle" });
    const n2 = T(ch, "", 435, 1280, { f: SERIF, s: 34, i: 1, a: "middle", c: RED });
    pix(ch, "MILLONES DE DÓLARES", 130, 900, 3, INK);
    S.piece(ch, { at: .5, from: "left", dist: 450, r: -1.5 });
    const ct = E("g", {}, g);
    paper(ct, 630, 880, 350, 300, { seed: 2521, fill: "#FFD23F" });
    T(ct, "22.000 M $", 805, 980, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(ct, "gafas de combate", 805, 1040, { f: SERIF, s: 32, i: 1, a: "middle" });
    T(ct, "para el ejército", 805, 1084, { f: SERIF, s: 32, i: 1, a: "middle" });
    S.piece(ct, { at: 2.0, from: "right", dist: 380, r: 1.2 });
    const ms = E("g", {}, g);
    paper(ms, 650, 1230, 310, 160, { seed: 2531, fill: "#FFFDF5" });
    T(ms, "Microsoft", 805, 1306, { f: SERIF, s: 46, i: 1, a: "middle", c: "#777" });
    const xd = drawable(E("path", { d: "M682 1264 L930 1346 M930 1264 L682 1346", ...stroke(RED, 9) }, ms));
    T(ms, "lo perdió", 805, 1368, { s: 26, a: "middle", c: "#555" });
    S.piece(ms, { at: 3.6, from: "bottom", dist: 240, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2501 });
    T(cl, "el dinero no llega", 540, 272, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "de la nada: de contratos", 540, 348, { f: SERIF, s: 44, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q1 = eo(seg(t, .9, 2.0)), q2 = eo(seg(t, 1.6, 3.0));
      b1.setAttribute("height", (q1 * 138).toFixed(1)); b1.setAttribute("y", (1300 - q1 * 138).toFixed(1));
      b2.setAttribute("height", (q2 * 300).toFixed(1)); b2.setAttribute("y", (1300 - q2 * 300).toFixed(1));
      n1.textContent = q1 > .02 ? fmt(14000 * q1) : ""; n1.setAttribute("y", (1292 - q1 * 138).toFixed(1));
      n2.textContent = q2 > .02 ? fmt(30500 * q2) : ""; n2.setAttribute("y", (1292 - q2 * 300).toFixed(1));
      xd.set(seg(t, 4.2, 4.9));
    };
  } });

// 6 — el Pentágono y los cuatro laboratorios
DEF.push({ bg: "#0F3326", tr: "right",
  strip: { color: "#FFD23F", word: "Cuatro", wordColor: INK, cx: 540, cy: 590, size: 270, wx: -60, maxW: 920, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 660 },
  label: { text: "JULIO DE 2025", x: 96, y: 1392, r: -4 },
  cap: ["En julio de 2025, el Pentágono firmó con cuatro laboratorios de IA,",
        "hasta 200 millones de dólares cada uno."],
  build(S) {
    const g = S.sub;
    const pg = E("g", {}, g);
    pentagon(pg, 540, 902, 122, "#C9C2B0", .5);
    E("rect", { x: 540 - pixW("PENTÁGONO", 4) / 2 - 16, y: 1046, width: pixW("PENTÁGONO", 4) + 32, height: 60, fill: INK }, pg);
    pix(pg, "PENTÁGONO", 540, 1062, 4, "#fff", "middle");
    S.piece(pg, { at: .5, from: "top", dist: 400, r: -1 });
    const sigs = [], labs = [60, 305, 550, 795];
    labs.forEach((x, i) => {
      const k = E("g", {}, g), y = 1148;
      paper(k, x, y, 200, 205, { seed: 2611 + i, fill: i % 2 ? "#FFFDF5" : "#CFF75A" });
      E("rect", { x: x + 20, y: y + 20, width: pixW("LAB. IA", 3) + 16, height: 34, fill: INK }, k);
      pix(k, "LAB. IA", x + 28, y + 29, 3, "#fff");
      T(k, "hasta", x + 100, y + 96, { s: 25, a: "middle", c: "#555" });
      T(k, "200 M $", x + 100, y + 142, { f: SERIF, s: 38, i: 1, a: "middle", c: RED });
      sigs.push(signLine(k, x + 26, y + 184, 148, INK));
      S.piece(k, { at: 1.6 + i * .45, from: "bottom", dist: 300, r: -.8 + i * .5 });
    });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2601 });
    T(cl, "el cliente que paga", 540, 272, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "la IA es el ejército", 540, 348, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => sigs.forEach((v, i) => v.sg.set(seg(t, 2.6 + i * .45, 3.5 + i * .45)));
  } });

// 7 — no hay prohibición
DEF.push({ bg: "#8C1A2B", tr: "left",
  strip: { color: "#FFFDF5", word: "Permitido", wordColor: INK, cx: 540, cy: 595, size: 230, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 650 },
  label: { text: "SIN PROHIBICIÓN", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["No hay prohibición: la norma estadounidense solo pide «niveles apropiados de",
        "juicio humano», y la ley europea de IA no se aplica a lo militar."],
  build(S) {
    const g = S.sub;
    const us = E("g", {}, g);
    paper(us, 70, 850, 480, 400, { seed: 2711, fill: "#FFFDF5" });
    E("rect", { x: 108, y: 886, width: pixW("EE. UU.", 4) + 20, height: 46, fill: INK }, us);
    pix(us, "EE. UU.", 118, 899, 4, "#fff");
    const hl = E("rect", { x: 108, y: 972, width: 0, height: 118, fill: "#FFD23F" }, us);
    T(us, "«niveles apropiados", 310, 1018, { f: SERIF, s: 36, i: 1, a: "middle" });
    T(us, "de juicio humano»", 310, 1070, { f: SERIF, s: 36, i: 1, a: "middle" });
    T(us, "no dice quién, ni cuánto", 310, 1160, { s: 26, a: "middle", c: "#555" });
    T(us, "ni en qué momento", 310, 1198, { s: 26, a: "middle", c: "#555" });
    S.piece(us, { at: .5, from: "left", dist: 440, r: -1.5 });
    const eu = E("g", {}, g);
    paper(eu, 600, 850, 390, 400, { seed: 2721, fill: "#1B3A8C" });
    const stars = [];
    for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6;
      stars.push(star(eu, 795 + Math.cos(a) * 110, 1010 + Math.sin(a) * 110, 20, "#FFD23F")); }
    T(eu, "la ley de IA", 795, 1176, { f: SERIF, s: 38, i: 1, a: "middle", c: "#fff" });
    T(eu, "no se aplica a lo militar", 795, 1224, { s: 26, a: "middle", c: "#CFF75A" });
    S.piece(eu, { at: 1.8, from: "right", dist: 400, r: 1.2 });
    const bt = E("g", {}, g);
    paper(bt, 150, 1240, 780, 132, { seed: 2731, fill: INK });
    T(bt, "nadie ha prohibido nada", 540, 1322, { f: SERIF, s: 50, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bt, { at: 3.6, from: "bottom", dist: 240, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 320);
    paper(cl, 100, 172, 880, 270, { seed: 2701 });
    T(cl, "las dos normas", 540, 272, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "dejan el hueco abierto", 540, 348, { f: SERIF, s: 46, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      hl.setAttribute("width", (eo(seg(t, 1.0, 1.9)) * 404).toFixed(1));
      stars.forEach((s, i) => s.style.opacity = eo(seg(t, 2.1 + i * .08, 2.4 + i * .08)).toFixed(2));
    };
  } });

// 8 — la pregunta
DEF.push({ bg: "#161E30", tr: "right",
  strip: { color: "#FFD23F", word: "Contratos", wordColor: INK, cx: 540, cy: 585, size: 225, wx: -40, maxW: 950, from: 1 },
  sub: { x: 30, y: 780, w: 1020, h: 660 },
  label: { text: "LA PREGUNTA", x: 96, y: 1392, r: -4 },
  cap: ["La pregunta no es cuándo mató la primera máquina. Es quién decide dónde",
        "se queda el humano. Y hoy eso lo deciden contratos."],
  build(S) {
    const g = S.sub;
    // a slider: who decides, and how far the knob has travelled
    const sl = E("g", {}, g);
    paper(sl, 70, 850, 920, 290, { seed: 2811, fill: "#FFFDF5" });
    E("rect", { x: 140, y: 1000, width: 780, height: 26, rx: 13, fill: "#D6D0C2" }, sl);
    const fill = E("rect", { x: 140, y: 1000, width: 0, height: 26, rx: 13, fill: RED }, sl);
    const knob = E("g", {}, sl);
    E("circle", { cx: 0, cy: 1013, r: 40, fill: "#FFD23F", stroke: INK, "stroke-width": 7 }, knob);
    T(sl, "decide la persona", 150, 1096, { s: 28, c: "#555" });
    T(sl, "decide la máquina", 910, 1096, { s: 28, a: "end", c: RED });
    pix(sl, "DÓNDE SE QUEDA EL HUMANO", 530, 906, 4, INK, "middle");
    S.piece(sl, { at: .5, from: "top", dist: 380, r: -1 });
    // the contracts doing the deciding
    const cs = E("g", {}, g), sigs = [];
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 310, k = E("g", {}, cs);
      paper(k, x, 1155, 260, 205, { seed: 2821 + i, fill: i === 1 ? "#FFD23F" : "#E7E2D6" });
      for (let j = 0; j < 4; j++) E("rect", { x: x + 28, y: 1192 + j * 28, width: (j === 3 ? 120 : 200), height: 11, rx: 3, fill: "#BFB8A6" }, k);
      sigs.push(signLine(k, x + 28, 1330, 200, INK));
      S.piece(k, { at: 2.0 + i * .5, from: "bottom", dist: 300, r: -1 + i * .8 });
    }
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2801 });
    T(cl, "no es cuándo mató", 540, 268, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "una máquina: es quién", 540, 332, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "firma dónde se queda", 540, 396, { f: SERIF, s: 46, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const q = eo(seg(t, 1.0, 5.2)) * .78;
      fill.setAttribute("width", (780 * q).toFixed(1));
      knob.setAttribute("transform", `translate(${(140 + 780 * q).toFixed(1)} 0)`);
      sigs.forEach((s, i) => s.sg.set(seg(t, 2.6 + i * .5, 3.6 + i * .5)));
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
    E("path", { d: torn(70, 545, 940, 1060, 2931, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["La prueba ucraniana", "Relato de un fabricante de drones; sin grabación ni verificación independiente"],
      ["El antecedente", "Grupo de Expertos de la ONU sobre Libia, 2021: nada quedó confirmado"],
      ["Eisenhower", "Discurso de despedida, 17 de enero de 1961: «complejo militar-industrial»"],
      ["Las gafas de RV", "Oculus, vendida a Facebook por ~2.000 M $ en 2014; su fundador salió en 2017"],
      ["La empresa de armas", "Fundada en junio de 2017; 30.500 M $ en junio de 2025, frente a 14.000 M $"],
      ["Las gafas de combate", "Programa IVAS, ~22.000 M $, traspasado desde Microsoft en febrero de 2025"],
      ["Pentágono y laboratorios", "14 de julio de 2025: acuerdos de hasta 200 M $ con OpenAI, Anthropic, Google y xAI"],
      ["Las normas", "Directiva 3000.09 de Defensa; Reglamento Europeo de IA, art. 2: no militar"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 28, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 24, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 170);
    T(fl, "Ilustraciones, no imágenes reales. No se dibuja a ninguna persona.", 540, 1686, { s: 28, w: 600, c: "#ddd", a: "middle" });
    T(fl, "La empresa de armas no participó en la prueba ucraniana.", 540, 1732, { s: 28, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
