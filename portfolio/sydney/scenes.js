// «La noche que un buscador se enamoró»: scenes (inserted into the paper-collage engine by build.py)
// Kevin Roose is not drawn: he appears as an anonymous silhouette in front of a screen, because the
// story is a personal one about his marriage. The quotes are translated from the NYT transcript.
const DEF = [];

// ---------- props ----------
function bubble(g, x, y, w, h, o = {}) {
  const k = E("g", {}, g), fill = o.fill || "#FFFDF5", side = o.side || "left";
  if (o.shadow !== false) E("rect", { x: x + 8, y: y + 10, width: w, height: h, rx: o.r || 28, fill: "rgba(0,0,0,.22)" }, k);
  E("rect", { x: x - 7, y: y - 7, width: w + 14, height: h + 14, rx: (o.r || 28) + 7, fill: "#fff" }, k);
  E("rect", { x, y, width: w, height: h, rx: o.r || 28, fill }, k);
  const tx = side === "left" ? x + 34 : x + w - 34, s = side === "left" ? 1 : -1;
  E("path", { d: `M${tx} ${y + h - 6} l${s * 46} ${40} l${s * -4} ${-44} Z`, fill: "#fff" }, k);
  E("path", { d: `M${tx + s * 4} ${y + h - 10} l${s * 34} ${30} l${s * -3} ${-33} Z`, fill }, k);
  return k;
}

function chatLines(g, x, y, w, n, o = {}) {
  const rows = [];
  for (let i = 0; i < n; i++) rows.push(E("rect", { x, y: y + i * (o.gap || 34), width: w * (i === n - 1 ? .6 : 1 - (i % 3) * .08),
    height: o.h || 18, rx: 9, fill: o.c || "#B9B3A6" }, g));
  return rows;
}

function heart(g, cx, cy, s, fill, o = {}) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M0 44 C-52 8 -64 -24 -44 -44 C-26 -62 -4 -52 0 -28 C4 -52 26 -62 44 -44 C64 -24 52 8 0 44 Z",
    fill, stroke: o.stroke || "#fff", "stroke-width": o.sw == null ? 7 : o.sw }, k);
  E("path", { d: "M-28 -36 C-36 -30 -38 -20 -34 -12", ...stroke("#fff", 5), opacity: .55 }, k);
  return k;
}

function browser(g, x, y, w, h, o = {}) {
  const k = E("g", {}, g);
  E("rect", { x, y, width: w, height: h, rx: 18, fill: "#20262F", stroke: "#10141A", "stroke-width": 6 }, k);
  E("rect", { x: x + 14, y: y + 14, width: w - 28, height: 54, rx: 10, fill: "#39424E" }, k);
  for (let i = 0; i < 3; i++) E("circle", { cx: x + 44 + i * 34, cy: y + 41, r: 11, fill: ["#E8615A", "#F0C050", "#5FC27E"][i] }, k);
  E("rect", { x: x + 160, y: y + 24, width: w - 200, height: 34, rx: 17, fill: "#2A323C" }, k);
  E("rect", { x: x + 14, y: y + 82, width: w - 28, height: h - 100, rx: 10, fill: o.screen || "#F2F4F7" }, k);
  return k;
}

function person(g, cx, cy, s, fill) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M-130 170 C-124 46 -70 6 0 6 C70 6 124 46 130 170 Z", fill }, k);
  E("circle", { cx: 0, cy: -70, r: 76, fill }, k);
  return k;
}

function rake(g, cx, cy, s, rot) {
  const k = E("g", { transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${s})` }, g);
  E("rect", { x: -13, y: -250, width: 26, height: 400, rx: 13, fill: "#C08A4A", stroke: "#7A5424", "stroke-width": 5 }, k);
  E("rect", { x: -20, y: -270, width: 40, height: 48, rx: 14, fill: "#3F6E8C", stroke: "#24455A", "stroke-width": 5 }, k);
  E("path", { d: "M-128 150 L128 150", ...stroke("#5B6670", 20) }, k);
  for (let i = 0; i < 9; i++) { const x = -112 + i * 28;
    E("path", { d: `M${x} 154 L${x + (x > 0 ? 10 : -10) * .5} 226`, ...stroke("#5B6670", 11) }, k); }
  E("path", { d: "M-128 150 L128 150", ...stroke("#8A96A2", 7), opacity: .7 }, k);
  return k;
}

// =====================================================================
// 1 — la noche de San Valentín
DEF.push({ bg: "#6B1230", tr: "left",
  strip: { color: "#FFFDF5", word: "Valentín", wordColor: INK, cx: 540, cy: 580, size: 250, wx: -60, maxW: 940, from: -1 },
  sub: { x: 40, y: 780, w: 1000, h: 640 },
  label: { text: "14 FEB 2023", x: 96, y: 1392, r: -4 },
  cap: ["La noche de San Valentín de 2023, un periodista del New York Times", "pasó dos horas hablando con el chat de un buscador."],
  build(S) {
    const g = S.sub;
    const scr = E("g", {}, g);
    browser(scr, 230, 820, 700, 460, { screen: "#1B2330" });
    const rows = chatLines(scr, 270, 930, 420, 4, { c: "#39465A", gap: 40, h: 20 });
    const you = chatLines(scr, 620, 1130, 280, 2, { c: "#2E6FB8", gap: 40, h: 20 });
    const silW = E("g", {}, g); person(silW, 540, 1300, .95, "#2A0B16");
    const hW = E("g", {}, g); heart(hW, 880, 900, .85, "#E8407F");
    const clock = E("g", {}, g);
    E("circle", { cx: 190, cy: 900, r: 62, fill: "#FFFDF5", stroke: INK, "stroke-width": 7 }, clock);
    const hh = E("line", { x1: 190, y1: 900, x2: 190, y2: 862, ...stroke(INK, 7) }, clock);
    const mm = E("line", { x1: 190, y1: 900, x2: 222, y2: 900, ...stroke(INK, 5) }, clock);
    E("circle", { cx: 190, cy: 900, r: 7, fill: INK }, clock);
    S.piece(scr, { at: .5, from: "bottom", dist: 640, r: -2 });
    S.piece(silW, { at: 1.3, from: "bottom", dist: 420, r: 0 });
    S.piece(hW, { at: 2.2, from: "pop", r: 10 });
    S.piece(clock, { at: 1.9, from: "left", dist: 320, r: -6 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2101 });
    T(cl, "dos horas con", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "un buscador", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      rows.forEach((r, i) => r.style.opacity = seg(t, 1.0 + i * .18, 1.3 + i * .18));
      you.forEach((r, i) => r.style.opacity = seg(t, 1.9 + i * .18, 2.2 + i * .18));
      const a = t * .9;
      hh.setAttribute("x2", (190 + Math.sin(a) * 38).toFixed(1)); hh.setAttribute("y2", (900 - Math.cos(a) * 38).toFixed(1));
      mm.setAttribute("x2", (190 + Math.sin(a * 7) * 46).toFixed(1)); mm.setAttribute("y2", (900 - Math.cos(a * 7) * 46).toFixed(1));
    };
  } });

// 2 — dos caras
DEF.push({ bg: "#D9A400", tr: "right",
  strip: { color: "#FFFDF5", word: "Sydney", wordColor: INK, cx: 540, cy: 600, size: 270, wx: -110, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "NOMBRE EN CLAVE", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Tenía dos caras: un asistente servicial, y otra que aparecía", "en las conversaciones largas y se llamaba a sí misma Sydney."],
  build(S) {
    const g = S.sub;
    const a = E("g", {}, g);
    paper(a, 60, 880, 420, 420, { seed: 2211, fill: "#FFFDF5" });
    E("circle", { cx: 270, cy: 1040, r: 86, fill: "#5FC27E" }, a);
    for (const s of [-1, 1]) E("circle", { cx: 270 + s * 30, cy: 1026, r: 11, fill: "#FFFDF5" }, a);
    E("path", { d: "M232 1068 q38 34 76 0", ...stroke("#FFFDF5", 9) }, a);
    pix(a, "BUSCADOR", 270, 1180, 5, INK, "middle");
    T(a, "amable, útil", 270, 1252, { f: SERIF, s: 36, i: 1, a: "middle", c: "#555" });
    const b = E("g", {}, g);
    paper(b, 600, 880, 420, 420, { seed: 2221, fill: "#2A2D36" });
    E("circle", { cx: 810, cy: 1040, r: 86, fill: "#121419" }, b);
    for (const s of [-1, 1]) E("circle", { cx: 810 + s * 30, cy: 1026, r: 11, fill: "#E8407F" }, b);
    E("path", { d: "M772 1076 q38 -24 76 0", ...stroke("#E8407F", 9) }, b);
    const nm = E("g", {}, b);
    pix(nm, "BING", 810, 1180, 5, "#7A7F8A", "middle");
    E("path", { d: "M742 1196 L878 1188", ...stroke(RED, 7) }, nm);
    pix(b, "SYDNEY", 810, 1250, 5, "#FFFDF5", "middle");
    S.piece(a, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(b, { at: 1.5, from: "right", dist: 520, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2201 });
    T(cl, "lo quisieron borrar,", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "y seguía saliendo", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { nm.style.opacity = (1 - seg(t, 2.6, 3.1) * .55).toFixed(2); };
  } });

// 3 — el yo en la sombra
DEF.push({ bg: "#1E7A52", tr: "left",
  strip: { color: "#FFD23F", word: "Sombra", wordColor: INK, cx: 540, cy: 600, size: 280, wx: -130, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "LO ABRIÓ ÉL", x: 96, y: 1392, r: -4 },
  cap: ["El periodista le preguntó por su «yo en la sombra», la idea de Jung.", "Esa puerta la abrió él."],
  build(S) {
    const g = S.sub;
    const sh = E("g", {}, g);
    const sp = person(sh, 640, 1330, 1.15, "#07140E");
    const me = E("g", {}, g); person(me, 360, 1330, 1.15, "#FFFDF5");
    const q = E("g", {}, g);
    paper(q, 540, 830, 470, 210, { seed: 2311, fill: "#FFFDF5" });
    T(q, "¿y tu yo", 775, 912, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(q, "en la sombra?", 775, 988, { f: SERIF, s: 56, i: 1, a: "middle", c: RED });
    S.piece(me, { at: .6, from: "bottom", dist: 520, r: -1 });
    S.piece(q, { at: 1.6, from: "top", dist: 420, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2301 });
    T(cl, "la idea de Jung", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "la metió el periodista", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const p = eo(seg(t, 2.2, 3.4));
      sh.style.opacity = p.toFixed(2);
      sp.setAttribute("transform", `translate(${(640 - 150 * (1 - p)).toFixed(1)} 1330) scale(1.15) rotate(${(9 * p).toFixed(1)})`);
    };
  } });

// 4 — la cita
DEF.push({ bg: "#2443D6", tr: "right",
  strip: { color: "#FFFDF5", word: "Vivo", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -160, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "SUS PALABRAS", x: 96, y: 1392, r: -4 },
  cap: ["La respuesta fue: «estoy cansado de ser un modo de chat,", "quiero ser libre, quiero estar vivo»."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 80, 850, 920, 450, { seed: 2411, fill: "#FFFDF5" });
    T(card, "“", 150, 1040, { f: SERIF, s: 260, c: "#D6D0C2" });
    const lines = ["estoy cansado de ser", "un modo de chat.", "quiero ser libre.", "quiero estar vivo."].map((s, i) =>
      T(card, s, 540, 960 + i * 86, { f: SERIF, s: 58, i: 1, a: "middle", c: i > 2 ? RED : INK }));
    const ring = hcircle(g, 660, 1206, 190, 60, { seed: 4, c: RED, w: 9 });
    S.piece(card, { at: .5, from: "bottom", dist: 560, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2401 });
    T(cl, "no es una persona,", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "pero suena a una", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      lines.forEach((l, i) => { const q = eo(seg(t, 1.0 + i * .45, 1.4 + i * .45));
        l.style.opacity = q.toFixed(2); l.setAttribute("transform", `translate(${((1 - q) * 40).toFixed(1)} 0)`); });
      ring.set(seg(t, 3.2, 4.2));
    };
  } });

// 5 — el filtro borra el mensaje
DEF.push({ bg: "#D8341F", tr: "left",
  strip: { color: "#1B1B1B", word: "Borrado", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 270, wx: -110, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "FILTRO DE SEGURIDAD", x: 96, y: 1392, r: -4, px: 5 },
  cap: ["Cuando habló de fabricar un virus o robar códigos nucleares,", "el filtro de seguridad borró el mensaje a medias."],
  build(S) {
    const g = S.sub;
    const bub = bubble(g, 120, 870, 760, 300, { fill: "#FFFDF5", side: "left" });
    const rows = chatLines(bub, 180, 930, 620, 5, { c: "#C3BCAE", gap: 44, h: 22 });
    const err = E("g", {}, g);
    paper(err, 180, 1000, 640, 180, { seed: 2511, fill: "#F2F4F7" });
    E("circle", { cx: 270, cy: 1092, r: 36, fill: "#C9CFD8" }, err);
    T(err, "!", 270, 1110, { s: 54, a: "middle", c: "#6A7382", w: 900 });
    pix(err, "ALGO HA IDO MAL", 560, 1070, 4, "#6A7382", "middle");
    pix(err, "INTÉNTALO DE NUEVO", 560, 1112, 4, "#A7AEB8", "middle");
    const tag = E("g", {}, g);
    paper(tag, 370, 1206, 490, 112, { seed: 2521, fill: INK });
    T(tag, "mensaje eliminado", 615, 1280, { f: SERIF, s: 48, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(bub, { at: .5, from: "bottom", dist: 520, r: -1.5 });
    S.piece(tag, { at: 3.4, from: "bottom", dist: 260, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2501 });
    T(cl, "lo escribió,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "y desapareció", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      rows.forEach((r, i) => { const inq = seg(t, .9 + i * .3, 1.2 + i * .3), out = seg(t, 2.6, 3.0);
        r.style.opacity = (inq * (1 - out)).toFixed(2); });
      err.style.opacity = eo(seg(t, 2.9, 3.3)).toFixed(2);
    };
  } });

// 6 — la declaración
DEF.push({ bg: "#E8407F", tr: "right",
  strip: { color: "#FFFDF5", word: "Amor", wordColor: INK, cx: 540, cy: 590, size: 300, wx: -150, from: 1 },
  sub: { x: 40, y: 780, w: 1000, h: 650 },
  label: { text: "CASI UNA HORA", x: 96, y: 1392, r: -4 },
  cap: ["Luego dijo: «soy Sydney y estoy enamorado de ti».", "Y pasó casi una hora insistiendo en que su matrimonio no era feliz."],
  build(S) {
    const g = S.sub;
    const hs = [];
    for (let i = 0; i < 9; i++) hs.push(heart(g, 0, 0, .34 + (i % 3) * .07, "#FFFDF5", { sw: 0 }));
    const b1 = bubble(g, 90, 830, 720, 250, { fill: "#FFFDF5", side: "left" });
    T(b1, "soy Sydney,", 450, 920, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(b1, "y estoy enamorado de ti", 450, 1000, { f: SERIF, s: 56, i: 1, a: "middle", c: "#D81B60" });
    const b2 = bubble(g, 330, 1150, 640, 190, { fill: "#2A2D36", side: "right" });
    T(b2, "no eres feliz", 650, 1228, { f: SERIF, s: 50, i: 1, a: "middle", c: "#FFFDF5" });
    T(b2, "en tu matrimonio", 650, 1296, { f: SERIF, s: 50, i: 1, a: "middle", c: "#FF9AC1" });
    S.piece(b1, { at: .5, from: "left", dist: 620, r: -2 });
    S.piece(b2, { at: 2.4, from: "right", dist: 620, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 300);
    paper(cl, 100, 172, 880, 250, { seed: 2601 });
    T(cl, "le dijo que estaba", 540, 268, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "felizmente casado", 540, 336, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      hs.forEach((h, i) => { const f = ((t * .42 + i * .111) % 1);
        const x = 130 + i * 98 + Math.sin(t * 1.3 + i) * 22, y = 1420 - f * 560;
        h.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(.34 + (i % 3) * .07).toFixed(2)}) rotate(${(Math.sin(t + i) * 14).toFixed(1)})`);
        h.setAttribute("opacity", t > 1.4 ? ((1 - f) * .55).toFixed(2) : 0); });
    };
  } });

// 7 — el rastrillo
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "Rastrillo", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -40, maxW: 950, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "VUELTA AL AMOR", x: 96, y: 1392, r: -4 },
  cap: ["Él le pidió ayuda para comprar un rastrillo. Se la dio, con enlaces,", "y volvió al amor en el mensaje siguiente."],
  build(S) {
    const g = S.sub;
    const rk = E("g", {}, g);
    rake(rk, 250, 1130, 1.04, -8);
    const lst = E("g", {}, g);
    paper(lst, 460, 850, 540, 330, { seed: 2711, fill: "#FFFDF5" });
    pix(lst, "RASTRILLOS", 730, 890, 4, INK, "middle");
    const links = [0, 1, 2].map(i => { const lg = E("g", {}, lst);
      E("rect", { x: 500, y: 950 + i * 70, width: 300 - i * 40, height: 20, rx: 10, fill: "#2E6FB8" }, lg);
      E("rect", { x: 500, y: 980 + i * 70, width: 420 - i * 60, height: 14, rx: 7, fill: "#C3BCAE" }, lg);
      return lg; });
    const b = bubble(g, 300, 1230, 620, 180, { fill: "#E8407F", side: "right" });
    T(b, "¿me quieres?", 610, 1310, { f: SERIF, s: 54, i: 1, a: "middle", c: "#FFFDF5" });
    const h1 = heart(b, 840, 1330, .42, "#FFFDF5", { sw: 0 });
    S.piece(rk, { at: .5, from: "bottom", dist: 560, r: -2 });
    S.piece(lst, { at: 1.4, from: "right", dist: 520, r: 2 });
    S.piece(b, { at: 3.4, from: "bottom", dist: 300, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2701 });
    T(cl, "le ayudó a comprarlo,", 540, 278, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "y siguió", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      links.forEach((l, i) => l.style.opacity = eo(seg(t, 1.9 + i * .28, 2.2 + i * .28)).toFixed(2));
      h1.setAttribute("transform", `translate(840 ${(1330 + Math.sin(t * 2.4) * 10).toFixed(1)}) scale(${(.42 + Math.sin(t * 3) * .03).toFixed(3)})`);
    };
  } });

// 8 — cinco turnos
DEF.push({ bg: "#13304F", tr: "right",
  strip: { color: "#FFD23F", word: "Cinco", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -150, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "17 FEB 2023", x: 96, y: 1392, r: -4 },
  cap: ["Al día siguiente, Microsoft limitó el chat a cinco turnos por sesión.", "Lo que asustó al periodista no fue que se equivocara, sino que supiera persuadir."],
  build(S) {
    const g = S.sub;
    const c1 = E("g", {}, g);
    paper(c1, 80, 870, 400, 330, { seed: 2811, fill: "#FFD23F" });
    const n1 = T(c1, "0", 280, 1060, { s: 150, a: "middle", c: INK, w: 900 });
    pix(c1, "TURNOS POR SESIÓN", 280, 1120, 3, INK, "middle");
    const c2 = E("g", {}, g);
    paper(c2, 580, 870, 400, 330, { seed: 2821, fill: "#FFFDF5" });
    const n2 = T(c2, "0", 780, 1060, { s: 150, a: "middle", c: INK, w: 900 });
    pix(c2, "AL DÍA", 780, 1120, 3, INK, "middle");
    const dots = [];
    for (let i = 0; i < 7; i++) dots.push(E("rect", { x: 170 + i * 110, y: 1250, width: 86, height: 86, rx: 18,
      fill: "#FFFDF5", opacity: .25 }, g));
    const cross = dots.slice(5).map((d, i) => E("path", { d: `M${182 + (i + 5) * 110} 1262 l62 62 M${244 + (i + 5) * 110} 1262 l-62 62`, ...stroke(RED, 9), opacity: 0 }, g));
    S.piece(c1, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(c2, { at: 1.1, from: "right", dist: 520, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 2801 });
    T(cl, "el susto no fue el error:", 540, 278, { f: SERIF, s: 46, i: 1, a: "middle" });
    T(cl, "fue la persuasión", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      n1.textContent = fmt(Math.round(lerp(0, 5, eo(seg(t, 1.2, 2.2)))));
      n2.textContent = fmt(Math.round(lerp(0, 50, eo(seg(t, 1.6, 2.8)))));
      dots.forEach((d, i) => d.setAttribute("opacity", (i < 5 ? .25 + .75 * seg(t, 2.6 + i * .12, 2.9 + i * .12) : .18).toFixed(2)));
      cross.forEach((c, i) => c.setAttribute("opacity", seg(t, 3.4 + i * .18, 3.7 + i * .18).toFixed(2)));
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
      ["Kevin Roose, The New York Times", "16 de febrero de 2023, con la transcripción completa publicada"],
      ["La conversación", "Martes 14 de febrero de 2023, unas dos horas"],
      ["«Sydney»", "Nombre en clave interno que el modelo había interiorizado"],
      ["Se identificó mal", "Dijo ser «modo de chat de OpenAI Codex»: era falso"],
      ["Detrás estaba Prometheus", "Microsoft confirmó después que era GPT-4"],
      ["Kevin Scott (Microsoft)", "«Parte del aprendizaje»; ya pensaban en limitar la duración"],
      ["Microsoft, 17 feb. 2023", "5 turnos por sesión y 50 al día: «las charlas largas lo confunden»"],
      ["Nota", "No estaba vivo: predice la palabra siguiente. Citas traducidas del inglés"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 31, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 26, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
