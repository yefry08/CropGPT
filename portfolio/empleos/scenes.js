// «Ni utopía ni distopía: el trabajo»: scenes (inserted into the paper-collage engine by build.py)
const DEF = [];

function person(g, cx, cy, s, shirt, skin = "#F2C9A4") {
  const p = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("path", { d: "M0 10 q-62 10 -74 94 q-4 38 8 84 l132 0 q12 -46 8 -84 q-12 -84 -74 -94 Z", fill: shirt, stroke: "rgba(0,0,0,.25)", "stroke-width": 4 }, p);
  E("circle", { cx: 0, cy: -34, r: 42, fill: skin, stroke: "#B98A5E", "stroke-width": 4 }, p);
  E("path", { d: "M-30 -54 q30 -24 60 0 q-6 -30 -30 -30 q-24 0 -30 30 Z", fill: "#3b2b1f" }, p);
  E("ellipse", { cx: -14, cy: -52, rx: 12, ry: 6, fill: "#fff", opacity: .4 }, p);
  return p;
}
function folder(g, x, y, w, h, col, label) {
  const f = E("g", {}, g);
  E("path", { d: `M${x} ${y + 26} V${y + h} H${x + w} V${y + 26} H${x + w * .46} L${x + w * .39} ${y} H${x + 10} Q${x} ${y} ${x} ${y + 10} Z`, fill: col }, f);
  E("path", { d: `M${x - 8} ${y + 60} H${x + w + 8} L${x + w - 6} ${y + h} H${x + 6} Z`, fill: "#FFC857" }, f);
  E("path", { d: `M${x - 8} ${y + 60} H${x + w + 8} L${x + w - 6} ${y + h} H${x + 6} Z`, fill: "url(#gHi)" }, f);
  if (label) T(f, label, x + w / 2, y + h - 26, { s: 28, w: 800, a: "middle" });
  return f;
}
function banknote(g, cx, cy, s, rot) {
  const b = E("g", { transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${s})` }, g);
  E("rect", { x: -90, y: -48, width: 180, height: 96, rx: 8, fill: "#CFE8C9", stroke: "#4E7A46", "stroke-width": 4 }, b);
  E("rect", { x: -78, y: -36, width: 156, height: 72, rx: 5, fill: "none", stroke: "#4E7A46", "stroke-width": 2 }, b);
  E("circle", { cx: 0, cy: 0, r: 26, fill: "#A9D3A1", stroke: "#4E7A46", "stroke-width": 3 }, b);
  T(b, "€", 0, 14, { s: 40, w: 900, c: "#2F5A2A", a: "middle" });
  return b;
}

// 1 — el dato a medias
DEF.push({ bg: "#E8402A", tr: "left",
  strip: { color: "#FFFDF5", word: "92", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -220, from: -1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "SE PIERDEN", x: 96, y: 1392, r: -4 },
  cap: ["El dato que asusta viene siempre a medias:", "se destruirán 92 millones de empleos y se crearán 170."],
  build(S) {
    const g = S.sub, cx = 540, cy = 980;
    E("path", { d: `M${cx - 70} 1390 L${cx + 70} 1390 L${cx + 50} 1340 L${cx - 50} 1340 Z`, fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 4 }, g);
    E("rect", { x: cx - 11, y: cy, width: 22, height: 346, fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, g);
    const beam = E("g", {}, g);
    E("rect", { x: cx - 330, y: cy - 12, width: 660, height: 22, rx: 11, fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, beam);
    E("circle", { cx, cy: cy - 2, r: 24, fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, g);
    const pans = [[-1, "#FFFDF5", INK, "92", "se destruyen"], [1, "#FFE14D", RED, "170", "se crean"]].map(([sd, fill, col, n, lab]) => {
      const pg = E("g", {}, g);
      for (const dx of [-90, 0, 90]) E("line", { x1: 0, y1: 0, x2: dx, y2: 150, stroke: "#9a6a10", "stroke-width": 3 }, pg);
      paper(pg, -120, 44, 240, 120, { seed: 1001 + sd, fill });
      T(pg, lab, 0, 84, { f: SERIF, s: 30, i: 1, a: "middle", c: "#444" });
      const num = T(pg, "0", 0, 148, { s: 66, w: 900, a: "middle", c: col, ls: -2 });
      E("path", { d: "M-136 150 Q0 206 136 150 Z", fill: "url(#gWarm)", stroke: "#9a6a10", "stroke-width": 3 }, pg);
      return { pg, sd, num, target: +n };
    });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1011 });
    T(cl, "millones de empleos", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "hasta 2030", 540, 350, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    pix(cl, "FORO ECONOMICO MUNDIAL, 2025", 540, 402, 3.4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const sw = eb(seg(t, 2.6, 4.2)), th = (lerp(-10, 9, sw) + Math.sin(t * 1.6) * 1.2) * Math.PI / 180;
      beam.setAttribute("transform", `rotate(${(th * 180 / Math.PI).toFixed(2)} ${cx} ${cy})`);
      pans.forEach((o, i) => {
        const x = cx + o.sd * 330 * Math.cos(th), y = cy + o.sd * 330 * Math.sin(th);
        o.pg.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        const p = eb(seg(t, 1.0 + i * .5, 1.4 + i * .5)); o.pg.style.opacity = p;
        o.num.textContent = Math.round(o.target * eo(seg(t, 1.4 + i * .6, 3.4 + i * .6)));
      });
    };
  } });

// 2 — el saldo
DEF.push({ bg: "#2443D6", tr: "up",
  strip: { color: "#FFD23F", word: "+78", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -180, from: 1 },
  sub: { x: 70, y: 790, w: 940, h: 620 },
  label: { text: "SALDO 2030", x: 96, y: 1392, r: -4 },
  cap: ["El Foro Económico Mundial calcula un saldo positivo de 78 millones para 2030,", "pero no son los mismos puestos ni las mismas personas."],
  build(S) {
    const g = S.sub;
    paper(g, 110, 810, 860, 560, { seed: 1021 });
    E("line", { x1: 180, y1: 1300, x2: 940, y2: 1300, ...stroke(INK, 5) }, g);
    const bars = [[-92, "#E8402A", "destruidos", 280], [170, "#1E9E5A", "creados", 500], [78, "#2443D6", "saldo", 720]].map(([v, c, lab, x]) => {
      const bg = E("g", {}, g), h = Math.abs(v) * 1.5;
      const r = E("rect", { x: x - 60, y: v > 0 ? 1300 - h : 1300, width: 120, height: 0, fill: c }, bg);
      const n = T(bg, "", x, v > 0 ? 1300 - h - 20 : 1300 + h + 56, { s: 44, w: 900, a: "middle", c });
      T(bg, lab, x, 1352, { f: SERIF, s: 34, i: 1, a: "middle" });
      return { r, n, v, h, x };
    });
    const note = T(g, "no son los mismos puestos", 540, 886, { f: SERIF, s: 44, i: 1, a: "middle", c: "#444" });
    const hc = hcircle(g, 720, 1180, 110, 190, { seed: 22 });
    const cl = S.layer("front", 620, 160, 380, 300);
    paper(cl, 640, 182, 340, 250, { seed: 1031, fill: "#FFE14D" });
    T(cl, "2023:", 810, 266, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "−14 millones", 810, 330, { f: SERIF, s: 42, i: 1, a: "middle", c: RED });
    pix(cl, "LA ESTIMACION CAMBIO", 810, 372, 3, "#555", "middle");
    S.piece(cl, { at: 4.6, from: "right", r: 5 });
    return (t) => {
      bars.forEach((b, i) => { const p = eo(seg(t, 1.0 + i * .5, 1.8 + i * .5)), h = b.h * p;
        b.r.setAttribute("height", h.toFixed(1));
        b.r.setAttribute("y", (b.v > 0 ? 1300 - h : 1300).toFixed(1));
        b.n.setAttribute("y", (b.v > 0 ? 1300 - h - 20 : 1300 + h + 56).toFixed(1));
        b.n.textContent = p > .15 ? (b.v > 0 ? "+" : "−") + Math.round(Math.abs(b.v) * p) : ""; });
      note.style.opacity = seg(t, 3.4, 3.9);
      hc.set(eo(seg(t, 3.8, 4.5)));
    };
  } });

// 3 — quién cae
DEF.push({ bg: "#F6B400", tr: "right",
  strip: { color: "#FFFDF5", word: "Oficina", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: -1 },
  sub: { x: 90, y: 780, w: 900, h: 640 },
  label: { text: "ADMINISTRATIVO", x: 70, y: 1392, r: -4 },
  cap: ["Los que más caen son los de oficina:", "cajeros, administrativos, teleoperadores y grabadores de datos."],
  build(S) {
    const g = S.sub;
    E("path", { d: "M180 1240 L900 1240 L940 1310 L140 1310 Z", fill: "#8E5826" }, g);
    E("rect", { x: 160, y: 1310, width: 760, height: 110, fill: "#7A4A26" }, g);
    const tray = E("g", {}, g);
    E("path", { d: "M240 1180 L520 1180 L560 1240 L200 1240 Z", fill: "#AEB7C2", stroke: "#6B747F", "stroke-width": 4 }, tray);
    const sheets = [];
    for (let i = 0; i < 9; i++) sheets.push(paper(tray, 258 + i * 2, 1120 - i * 14, 250, 40, { seed: 1041 + i, j: 4 }));
    const cabinet = E("g", {}, g);
    E("rect", { x: 660, y: 1020, width: 240, height: 220, rx: 8, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 5 }, cabinet);
    for (let k = 0; k < 3; k++) { E("rect", { x: 676, y: 1036 + k * 70, width: 208, height: 58, rx: 5, fill: "#EEF2F6", stroke: "#8d95a0", "stroke-width": 3 }, cabinet);
      E("rect", { x: 752, y: 1058 + k * 70, width: 56, height: 12, rx: 6, fill: "#8d95a0" }, cabinet); }
    const roles = ["cajeros", "administrativos", "teleoperadores", "grabadores de datos"].map((s, i) => {
      const y = 880 + i * 72, rg = E("g", {}, g);
      paper(rg, 150, y, 520, 56, { seed: 1051 + i, j: 4 });
      T(rg, s, 176, y + 42, { f: SERIF, s: 38, i: 1 });
      const st = drawable(E("path", { d: `M166 ${y + 30} Q400 ${y + 40} 660 ${y + 26}`, ...stroke(RED, 6) }, rg));
      return { rg, st, y };
    });
    const cl = S.layer("front", 640, 760, 380, 240);
    paper(cl, 660, 782, 340, 190, { seed: 1061, fill: "#FFFDF5" });
    T(cl, "los que", 830, 854, { f: SERIF, s: 42, i: 1, a: "middle" });
    T(cl, "más caen", 830, 916, { f: SERIF, s: 42, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "right", r: 4 });
    return (t) => {
      roles.forEach((o, i) => { const p = eb(seg(t, 1.2 + i * .35, 1.55 + i * .35));
        o.rg.style.opacity = p; o.rg.setAttribute("transform", `translate(${((1 - p) * -120).toFixed(1)} 0)`);
        o.st.set(eo(seg(t, 3.2 + i * .3, 3.6 + i * .3))); });
      sheets.forEach((s, i) => { const gone = seg(t, 4.6 + i * .12, 5.1 + i * .12);
        s.setAttribute("transform", `translate(${(gone * 260).toFixed(1)} ${(-gone * 120).toFixed(1)}) rotate(${(gone * 22).toFixed(1)})`);
        s.style.opacity = (1 - gone).toFixed(2); });
    };
  } });

// 4 — quién crece
DEF.push({ bg: "#10A36A", tr: "up",
  strip: { color: "#FFFDF5", word: "Crecen", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: 1 },
  sub: { x: 70, y: 790, w: 940, h: 620 },
  label: { text: "NUEVOS", x: 96, y: 1392, r: -4 },
  cap: ["A la vez crecen los especialistas en datos e IA,", "los oficios de la energía y los cuidados."],
  build(S) {
    const g = S.sub;
    const cols = [["datos e IA", "#2443D6", 200, 300], ["energía", "#FFC21A", 500, 230], ["cuidados", "#E8367F", 800, 260]].map(([lab, col, x, h], i) => {
      const cg = E("g", {}, g);
      const f = folder(cg, x - 110, 1290 - h, 220, h, col, "");
      T(cg, lab, x, 1358, { f: SERIF, s: 40, i: 1, a: "middle" });
      return { cg, f, x, h, i };
    });
    E("line", { x1: 120, y1: 1300, x2: 960, y2: 1300, ...stroke(INK, 5) }, g);
    const ups = cols.map((c, i) => harrow(g, c.x, 1300 - c.h + 60, c.x, 1300 - c.h - 70, { bend: 0, c: "#fff", w: 7, hl: 26 }));
    const icons = [["Σ", 200], ["⚡", 500], ["+", 800]].map(([s, x], i) => T(g, s, x, 1240, { s: 72, w: 900, a: "middle", c: "#fff" }));
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1071 });
    T(cl, "no todo se destruye:", 540, 280, { f: SERIF, s: 50, i: 1, a: "middle" });
    T(cl, "también aparecen oficios", 540, 352, { f: SERIF, s: 50, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      cols.forEach((c, i) => { const p = eb(seg(t, 1.0 + i * .45, 1.4 + i * .45));
        c.cg.setAttribute("transform", `translate(0 ${((1 - p) * 300).toFixed(1)})`); c.cg.style.opacity = p > 0 ? 1 : 0; });
      icons.forEach((o, i) => o.style.opacity = seg(t, 1.6 + i * .4, 1.9 + i * .4));
      ups.forEach((a, i) => a.set(eo(seg(t, 3.4 + i * .3, 3.9 + i * .3))));
    };
  } });

// 5 — Finlandia
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "560 €", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -170, from: -1 },
  sub: { x: 70, y: 790, w: 940, h: 620 },
  label: { text: "FINLANDIA", x: 96, y: 1392, r: -4 },
  cap: ["Finlandia probó una renta básica:", "2.000 parados cobraron 560 euros al mes durante dos años."],
  build(S) {
    const g = S.sub;
    const env = E("g", {}, g);
    E("rect", { x: 300, y: 1060, width: 480, height: 300, rx: 10, fill: "#FFFDF5", stroke: "#CFC6AE", "stroke-width": 5 }, env);
    const notes = [banknote(g, 420, 1070, .8, -12), banknote(g, 540, 1040, .8, 4), banknote(g, 660, 1068, .8, 14)];
    E("path", { d: "M300 1060 L540 1240 L780 1060 L780 1360 L300 1360 Z", fill: "#F3ECD9", stroke: "#CFC6AE", "stroke-width": 5, "stroke-linejoin": "round" }, env);
    E("path", { d: "M300 1060 L540 1240 L780 1060", fill: "none", stroke: "#CFC6AE", "stroke-width": 5 }, env);
    E("rect", { x: 320, y: 1280, width: 180, height: 14, rx: 7, fill: "#D8D0BC" }, env);
    const peeps = [];
    for (let i = 0; i < 6; i++) peeps.push(person(g, 190 + (i % 3) * 60, 1180 + Math.floor(i / 3) * 86, .36, ["#7FD3FF", "#FFC857", "#CFF75A"][i % 3]));
    const cal = E("g", {}, g);
    paper(cal, 790, 1040, 220, 200, { seed: 1081 });
    E("rect", { x: 790, y: 1040, width: 220, height: 46, fill: RED }, cal);
    pix(cal, "2017-2018", 900, 1056, 4, "#fff", "middle");
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) E("rect", { x: 812 + c * 36, y: 1106 + r * 40, width: 26, height: 26, rx: 4, fill: (r * 5 + c) < 12 ? "#C9C1AE" : "#EFE8D8" }, cal);
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1091 });
    const n = T(cl, "0", 320, 320, { s: 104, w: 900, a: "middle", c: RED, ls: -3 });
    T(cl, "parados", 320, 376, { f: SERIF, s: 40, i: 1, a: "middle" });
    T(cl, "560 € al mes", 740, 290, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "durante 2 años", 740, 354, { f: SERIF, s: 48, i: 1, a: "middle" });
    E("line", { x1: 520, y1: 220, x2: 520, y2: 410, stroke: "#C9C1AE", "stroke-width": 4 }, cl);
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      n.textContent = fmt(2000 * eo(seg(t, 1.4, 3.4)));
      notes.forEach((b, i) => { const p = eb(seg(t, 2.6 + i * .25, 3.0 + i * .25));
        b.setAttribute("transform", `translate(${420 + i * 120} ${(1070 - p * 60 + Math.sin(t * 2 + i) * 5).toFixed(1)}) rotate(${(-12 + i * 13).toFixed(1)}) scale(${(.8 * p).toFixed(3)})`); });
      peeps.forEach((p, i) => { const q = eb(seg(t, 1.2 + i * .14, 1.5 + i * .14));
        p.setAttribute("transform", `translate(${190 + (i % 3) * 60} ${(1180 + Math.floor(i / 3) * 86 + Math.sin(t * 1.6 + i) * 4).toFixed(1)}) scale(${(.36 * q).toFixed(3)})`); });
    };
  } });

// 6 — el resultado
DEF.push({ bg: "#0E9AA7", tr: "right",
  strip: { color: "#FFE14D", word: "6 días", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: 1 },
  sub: { x: 70, y: 800, w: 940, h: 600 },
  label: { text: "EL RESULTADO", x: 70, y: 1392, r: -4 },
  cap: ["El efecto en el empleo fue mínimo, unos 6 días más de trabajo al año;", "lo que mejoró claramente fue el bienestar."],
  build(S) {
    const g = S.sub;
    const cards = [["EMPLEO", "casi igual", "#FFFDF5", INK, 300], ["BIENESTAR", "mejor", "#CFF75A", "#1E7A46", 780]].map(([tag, val, fill, col, x], i) => {
      const cg = E("g", {}, g);
      paper(cg, x - 190, 900, 380, 380, { seed: 1101 + i, fill });
      E("rect", { x: x - 150, y: 930, width: pixW(tag, 4) + 24, height: 48, fill: INK }, cg);
      pix(cg, tag, x - 138, 942, 4, "#fff");
      T(cg, val, x, 1210, { f: SERIF, s: 54, i: 1, a: "middle", c: col });
      return { cg, x, i };
    });
    // flat line on the left card, rising line on the right
    const flat = drawable(E("path", { d: "M160 1110 Q300 1104 440 1112", ...stroke(INK, 8) }, g));
    const rise = drawable(E("path", { d: "M640 1150 Q760 1140 820 1070 Q880 1010 940 1000", ...stroke("#1E7A46", 8) }, g));
    const plus = T(g, "+6 días/año", 300, 1066, { f: SERIF, s: 38, i: 1, a: "middle", c: "#444" });
    const bl = S.layer("front", 80, 150, 920, 330);
    paper(bl, 100, 172, 880, 280, { seed: 1111 });
    T(bl, "menos estrés,", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(bl, "más seguridad económica", 540, 350, { f: SERIF, s: 46, i: 1, a: "middle", c: "#1E7A46" });
    pix(bl, "KELA Y VATT, RESULTADOS 2020", 540, 404, 3.4, "#666", "middle");
    S.piece(bl, { at: 3.6, from: "top", r: -2 });
    return (t) => {
      cards.forEach((o, i) => { const p = eb(seg(t, .9 + i * .5, 1.3 + i * .5));
        sxf(o.cg, o.x, 1090, p, (i ? 2 : -2) + Math.sin(t * 1.2 + i) * .8); o.cg.style.opacity = p > 0 ? 1 : 0; });
      flat.set(eo(seg(t, 1.6, 2.4))); plus.style.opacity = seg(t, 2.2, 2.6);
      rise.set(eo(seg(t, 2.8, 3.8)));
    };
  } });

// 7 — los luditas
DEF.push({ bg: "#FF7A1A", tr: "up",
  strip: { color: "#141414", word: "1811", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 300, wx: -180, from: -1 },
  sub: { x: 70, y: 780, w: 940, h: 640 },
  label: { text: "NED LUDD", x: 96, y: 1392, r: -4 },
  cap: ["En 1811, los luditas rompían telares.", "No odiaban la máquina: protestaban por salarios y condiciones."],
  build(S) {
    const g = S.sub;
    // loom
    const loom = E("g", {}, g);
    E("rect", { x: 170, y: 920, width: 44, height: 440, fill: "#7A4A26", stroke: "#4A2A12", "stroke-width": 4 }, loom);
    E("rect", { x: 560, y: 920, width: 44, height: 440, fill: "#7A4A26", stroke: "#4A2A12", "stroke-width": 4 }, loom);
    E("rect", { x: 150, y: 892, width: 474, height: 40, rx: 8, fill: "#8E5826", stroke: "#4A2A12", "stroke-width": 4 }, loom);
    E("rect", { x: 150, y: 1340, width: 474, height: 34, rx: 8, fill: "#8E5826", stroke: "#4A2A12", "stroke-width": 4 }, loom);
    const warp = [];
    for (let i = 0; i < 14; i++) warp.push(E("line", { x1: 236 + i * 24, y1: 936, x2: 236 + i * 24, y2: 1180, ...stroke("#F3ECD9", 5) }, loom));
    const cloth = E("rect", { x: 226, y: 1180, width: 340, height: 0, fill: "#E7D6B8", stroke: "#B9A27B", "stroke-width": 3 }, loom);
    for (let k = 0; k < 4; k++) E("line", { x1: 226, y1: 1200 + k * 34, x2: 566, y2: 1200 + k * 34, stroke: "#C9B089", "stroke-width": 3 }, loom);
    // hammer leaning (no people)
    const ham = E("g", { transform: "rotate(14 700 1200)" }, g);
    E("rect", { x: 686, y: 1030, width: 28, height: 330, rx: 10, fill: "url(#gHandle)" }, ham);
    E("rect", { x: 646, y: 982, width: 108, height: 62, rx: 10, fill: "url(#gMetal)", stroke: "#555", "stroke-width": 4 }, ham);
    E("rect", { x: 660, y: 994, width: 26, height: 18, rx: 5, fill: "#fff", opacity: .5 }, ham);
    // signed letter
    const note = E("g", {}, g);
    paper(note, 700, 1090, 300, 230, { seed: 1121 });
    for (let k = 0; k < 4; k++) E("rect", { x: 728, y: 1130 + k * 30, width: 240 - k * 26, height: 8, rx: 4, fill: "#C9C1AE" }, note);
    const sign = drawable(E("path", { d: "M728 1272 q30 -34 54 -4 q18 22 40 -10 q22 -30 48 2 q20 20 48 -16", ...stroke("#1E3F8F", 6) }, note));
    T(note, "Ned Ludd", 850, 1306, { f: SERIF, s: 32, i: 1, a: "middle", c: "#1E3F8F" });
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1131 });
    T(cl, "no contra la máquina:", 540, 278, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "contra cómo se usaba", 540, 350, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    pix(cl, "NED LUDD ERA UN NOMBRE INVENTADO", 540, 404, 3, "#666", "middle");
    S.piece(cl, { at: 3.0, from: "top", r: -2 });
    return (t) => {
      const w = eo(seg(t, 1.0, 2.6));
      cloth.setAttribute("height", (160 * w).toFixed(1));
      warp.forEach((l, i) => l.setAttribute("opacity", seg(t, .8 + i * .05, 1.0 + i * .05)));
      const hit = t > 3.2 && t < 3.9 ? Math.sin((t - 3.2) * 12) : 0;
      ham.setAttribute("transform", `rotate(${(14 - hit * 22).toFixed(1)} 700 1200)`);
      sign.set(eo(seg(t, 4.4, 5.4)));
      note.style.opacity = seg(t, 3.9, 4.3);
    };
  } });

// 8 — las reglas
DEF.push({ bg: "#123C5A", tr: "left",
  strip: { color: "#FFE14D", word: "Reglas", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -160, from: 1 },
  sub: { x: 70, y: 790, w: 940, h: 620 },
  label: { text: "DECIDIMOS", x: 96, y: 1392, r: -4 },
  cap: ["La lección no es frenar la técnica,", "sino no dejar que sus reglas las escriban solo unos pocos."],
  build(S) {
    const g = S.sub;
    E("ellipse", { cx: 540, cy: 1230, rx: 390, ry: 70, fill: "rgba(0,0,0,.18)" }, g);
    E("ellipse", { cx: 540, cy: 1170, rx: 380, ry: 96, fill: "#8E5826", stroke: "#4A2A12", "stroke-width": 5 }, g);
    E("ellipse", { cx: 540, cy: 1152, rx: 380, ry: 96, fill: "#A5693A", stroke: "#4A2A12", "stroke-width": 5 }, g);
    E("path", { d: "M260 1110 q120 -40 300 -36", ...stroke("#fff", 12), opacity: .25 }, g);
    const chairs = [[230, 1160], [540, 1096], [850, 1160]].map(([x, y], i) => {
      const cg = E("g", {}, g);
      E("rect", { x: x - 54, y: y - 150, width: 108, height: 130, rx: 12, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 4 }, cg);
      E("rect", { x: x - 60, y: y - 26, width: 120, height: 24, rx: 8, fill: "#AEB7C2", stroke: "#6B747F", "stroke-width": 4 }, cg);
      E("rect", { x: x - 46, y: y - 136, width: 28, height: 16, rx: 6, fill: "#fff", opacity: .5 }, cg);
      for (const sx of [-1, 1]) E("rect", { x: x + sx * 42 - 7, y: y - 2, width: 14, height: 56, rx: 6, fill: "#8d95a0" }, cg);
      return { cg, x, y };
    });
    const doc = E("g", {}, g);
    paper(doc, 400, 1118, 280, 170, { seed: 1141 });
    for (let k = 0; k < 4; k++) E("rect", { x: 428, y: 1152 + k * 26, width: 220 - k * 22, height: 8, rx: 4, fill: "#C9C1AE" }, doc);
    const sign = drawable(E("path", { d: "M430 1262 q26 -30 48 -4 q16 20 36 -8 q20 -26 44 2 q18 18 44 -14", ...stroke("#1E3F8F", 6) }, doc));
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 1151 });
    T(cl, "¿quién escribe", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "las reglas?", 540, 352, { f: SERIF, s: 64, i: 1, a: "middle", c: RED });
    const ul = drawable(E("path", { d: "M330 378 Q540 398 760 372", ...stroke(RED, 8) }, cl));
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      chairs.forEach((o, i) => { const p = eb(seg(t, 1.2 + i * .35, 1.6 + i * .35));
        o.cg.setAttribute("transform", `translate(0 ${((1 - p) * 160).toFixed(1)})`); o.cg.style.opacity = p > 0 ? 1 : 0; });
      doc.style.opacity = seg(t, 2.6, 3.0);
      sign.set(eo(seg(t, 3.4, 4.6)));
      ul.set(eo(seg(t, 4.6, 5.4)));
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
    E("path", { d: torn(70, 545, 940, 1060, 1171, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["Foro Económico Mundial, 2025", "Future of Jobs Report: 170 M creados, 92 M destruidos"],
      ["Foro Económico Mundial, 2023", "Estimación anterior: 69 M creados, 83 M destruidos a 2027"],
      ["Kela (Finlandia)", "Experimento de renta básica 2017-2018, 560 € al mes"],
      ["VATT y Ministerio de Sanidad", "Resultados 2020: empleo casi igual, mejor bienestar"],
      ["Historiografía ludita", "Nottingham, 1811-1816; Ned Ludd era un nombre inventado"],
      ["Frame Breaking Act, 1812", "Romper telares pasó a castigarse con la pena de muerte"],
      ["Nota", "Las cifras de empleo son proyecciones de encuestas a empresas"],
      ["Nota", "No son los mismos puestos ni las mismas personas"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 29, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
