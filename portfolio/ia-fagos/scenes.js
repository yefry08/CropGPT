// «La IA escribió. La célula decidió»: scenes (inserted into the paper-collage engine by build.py)
const DEF = [];

// a cut-out bacteriophage: icosahedral head, collar, tail, spider legs
function phage(g, cx, cy, s = 1, o = {}) {
  const p = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g), col = o.col || "#7B3FE4", dark = o.dark || "#4A1F96";
  const R = 92, hx = [], hy = [];
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; hx.push(Math.cos(a) * R); hy.push(Math.sin(a) * R); }
  const head = hx.map((x, i) => [x, hy[i] - 150]);
  E("path", { d: pts2d(head), fill: col, stroke: dark, "stroke-width": 5, "stroke-linejoin": "round" }, p);
  for (let k = 0; k < 6; k++) E("line", { x1: 0, y1: -150, x2: head[k][0], y2: head[k][1], stroke: dark, "stroke-width": 3, opacity: .55 }, p);
  E("path", { d: `M${head[4][0]} ${head[4][1]} L0 -150 L${head[5][0]} ${head[5][1]} Z`, fill: "#fff", opacity: .3 }, p);
  E("rect", { x: -34, y: -62, width: 68, height: 22, rx: 6, fill: dark }, p);
  E("rect", { x: -22, y: -40, width: 44, height: 96, fill: col, stroke: dark, "stroke-width": 4 }, p);
  for (let k = 0; k < 5; k++) E("line", { x1: -22, y1: -30 + k * 20, x2: 22, y2: -30 + k * 20, stroke: dark, "stroke-width": 3, opacity: .6 }, p);
  E("rect", { x: -40, y: 56, width: 80, height: 16, rx: 5, fill: dark }, p);
  const legs = [];
  for (const sx of [-1, 1]) for (const d of [0, 1, 2]) {
    const x1 = sx * (18 + d * 12), y1 = 72, x2 = sx * (52 + d * 34), y2 = 112 + d * 6, x3 = sx * (62 + d * 40), y3 = 168 - d * 4;
    legs.push(E("path", { d: `M${x1} ${y1} L${x2} ${y2} L${x3} ${y3}`, ...stroke(dark, 9) }, p));
  }
  return { p, legs };
}
// rod-shaped bacterium
function bacterium(g, cx, cy, w, h, col, o = {}) {
  const b = E("g", { transform: `translate(${cx} ${cy}) rotate(${o.rot || 0})` }, g);
  E("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: col, stroke: o.dark || "#1A7A4A", "stroke-width": 5 }, b);
  E("ellipse", { cx: -w * .18, cy: -h * .22, rx: w * .22, ry: h * .16, fill: "#fff", opacity: .45 }, b);
  E("path", { d: `M${-w * .2} ${h * .1} q${w * .2} ${h * .18} ${w * .4} 0`, ...stroke(o.dark || "#1A7A4A", 4), opacity: .5 }, b);
  for (const sx of [-1, 1]) E("path", { d: `M${sx * w / 2} 0 q${sx * 26} -14 ${sx * 46} 6 q${sx * 18} 18 ${sx * 38} 2`, ...stroke(o.dark || "#1A7A4A", 4) }, b);
  return b;
}
function pill(g, cx, cy, rot, a = "#E8402A", b = "#FFFDF5") {
  const p = E("g", { transform: `translate(${cx} ${cy}) rotate(${rot})` }, g);
  E("rect", { x: -70, y: -28, width: 70, height: 56, rx: 28, fill: a, stroke: "#8c2718", "stroke-width": 4 }, p);
  E("rect", { x: 0, y: -28, width: 70, height: 56, rx: 28, fill: b, stroke: "#9a9a9a", "stroke-width": 4 }, p);
  E("rect", { x: -54, y: -18, width: 28, height: 10, rx: 5, fill: "#fff", opacity: .55 }, p);
  return p;
}

// 1 — dieciséis
DEF.push({ bg: "#0E9AA7", tr: "left",
  strip: { color: "#FFFDF5", word: "16", wordColor: INK, cx: 540, cy: 620, size: 300, wx: -230, from: -1 },
  sub: { x: 110, y: 790, w: 880, h: 620 },
  label: { text: "FUNCIONARON", x: 90, y: 1392, r: -4 },
  cap: ["Una IA escribió genomas de virus que no existían,", "y 16 de ellos funcionaron de verdad."],
  build(S) {
    const g = S.sub, cx = 540, cy = 1100;
    E("ellipse", { cx: cx + 10, cy: cy + 24, rx: 300, ry: 296, fill: "rgba(0,0,0,.25)" }, g);
    E("circle", { cx, cy, r: 296, fill: "#D8D2BE", stroke: "#B7AF95", "stroke-width": 6 }, g);
    E("circle", { cx, cy, r: 272, fill: "#C9C2A6" }, g);
    const dish = E("clipPath", { id: "dishClip" }, g); E("circle", { cx, cy, r: 272 }, dish);
    const inner = E("g", { "clip-path": "url(#dishClip)" }, g), r = rng(11);
    for (let i = 0; i < 260; i++) { const a = r() * 6.3, d = Math.sqrt(r()) * 268;
      E("circle", { cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, r: 5 + r() * 7, fill: "#B3AC8C", opacity: .5 }, inner); }
    const plaques = [];
    for (let i = 0; i < 16; i++) { const a = r() * 6.3, d = Math.sqrt(r()) * 232, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d, rr = 22 + r() * 16;
      const pg = E("g", {}, inner);
      E("circle", { cx: px, cy: py, r: rr, fill: "#F7F3E4" }, pg);
      E("circle", { cx: px, cy: py, r: rr, fill: "none", stroke: "#A89F80", "stroke-width": 3 }, pg);
      E("circle", { cx: px - rr * .3, cy: py - rr * .3, r: rr * .35, fill: "#fff", opacity: .7 }, pg);
      plaques.push({ pg, px, py }); }
    E("path", { d: `M${cx - 240} ${cy - 180} A272 272 0 0 1 ${cx - 80} ${cy - 258}`, ...stroke("#fff", 20), opacity: .5 }, g);
    E("circle", { cx, cy, r: 296, fill: "none", stroke: "rgba(255,255,255,.5)", "stroke-width": 10 }, g);
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 401 });
    const num = T(cl, "0", 320, 390, { s: 190, w: 900, c: RED, a: "middle", ls: -6 });
    T(cl, "virus diseñados", 560, 300, { f: SERIF, s: 50, i: 1 });
    T(cl, "por IA que", 560, 356, { f: SERIF, s: 50, i: 1 });
    T(cl, "funcionaron", 560, 412, { f: SERIF, s: 50, i: 1, c: RED });
    S.piece(cl, { at: .9, from: "top", r: -2 });
    const hc = hcircle(g, cx, cy, 310, 308, { seed: 12, c: "#fff", w: 11 });
    return (t) => {
      plaques.forEach((o, i) => { const p = eb(seg(t, 2.0 + i * .13, 2.35 + i * .13)); sxf(o.pg, o.px, o.py, p); o.pg.style.opacity = p > 0 ? 1 : 0; });
      num.textContent = String(Math.round(16 * eo(seg(t, 2.0, 4.1))));
      hc.set(eo(seg(t, 4.4, 5.2)));
    };
  } });

// 2 — solo bacterias
DEF.push({ bg: "#2443D6", tr: "up",
  strip: { color: "#FFD23F", word: "Bacterias", wordColor: INK, cx: 540, cy: 600, size: 270, maxW: 820, wx: -120, from: 1 },
  sub: { x: 90, y: 760, w: 900, h: 660 },
  label: { text: "SOLO BACTERIAS", x: 70, y: 1392, r: -4 },
  cap: ["Son bacteriófagos: virus que solo atacan bacterias,", "probados con cepas de laboratorio de E. coli."],
  build(S) {
    const g = S.sub;
    const bac = bacterium(g, 420, 1180, 420, 210, "#2EC46E");
    const ph = phage(g, 420, 905, .95);
    const hit = E("g", { opacity: 0 }, g);
    for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + (k - 3.5) * .34;
      E("line", { x1: 420 + Math.cos(a) * 80, y1: 1080 + Math.sin(a) * 70, x2: 420 + Math.cos(a) * 128, y2: 1080 + Math.sin(a) * 112, ...stroke("#FFD23F", 8) }, hit); }
    // human crossed out
    const hl = S.layer("front", 700, 920, 320, 440);
    const hg = E("g", { opacity: .95 }, hl);
    E("circle", { cx: 860, cy: 1020, r: 48, fill: "#F2C9A4", stroke: "#B98A5E", "stroke-width": 4 }, hg);
    E("path", { d: "M860 1072 q-74 12 -86 112 q-4 44 10 96 l152 0 q14 -52 10 -96 q-12 -100 -86 -112 Z", fill: "#9AB7D8", stroke: "#52708F", "stroke-width": 4 }, hg);
    E("path", { d: "M826 980 q34 -26 68 0 q-6 -34 -34 -34 q-28 0 -34 34 Z", fill: "#5a4632" }, hg);
    const x1 = drawable(E("path", { d: "M740 960 Q860 1120 985 1288", ...stroke(RED, 16) }, hl));
    const x2 = drawable(E("path", { d: "M985 960 Q860 1120 740 1288", ...stroke(RED, 16) }, hl));
    const no = T(hl, "no humanos", 860, 1348, { f: SERIF, s: 40, i: 1, c: "#fff", a: "middle" });
    S.piece(hl, { at: 3.2, from: "right", r: 4 });
    const tl = S.layer("front", 90, 150, 900, 320);
    paper(tl, 110, 172, 860, 270, { seed: 411 });
    T(tl, "bacteriófago =", 540, 268, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(tl, "virus que come bacterias", 540, 340, { f: SERIF, s: 54, i: 1, a: "middle", c: BLUE });
    pix(tl, "E. COLI DE LABORATORIO", 540, 390, 4, "#666", "middle");
    S.piece(tl, { at: 1.0, from: "left", r: -2 });
    return (t) => {
      const land = eio(seg(t, 1.4, 2.4));
      ph.p.setAttribute("transform", `translate(420 ${(905 - 190 * (1 - land) + Math.sin(t * 1.6) * 6).toFixed(1)}) scale(.95)`);
      ph.legs.forEach((l, i) => l.setAttribute("transform", `rotate(${(Math.sin(t * 4 + i) * 5 * (1 - land) + land * (i < 3 ? -7 : 7)).toFixed(1)} 0 72)`));
      hit.setAttribute("opacity", t > 2.4 ? (.5 + .5 * Math.sin(t * 9)).toFixed(2) : 0);
      bac.setAttribute("transform", `translate(420 ${(1180 + Math.sin(t * 1.3) * 5).toFixed(1)}) rotate(${(Math.sin(t * .9) * 2).toFixed(2)})`);
      x1.set(eo(seg(t, 4.0, 4.4))); x2.set(eo(seg(t, 4.4, 4.8))); no.style.opacity = seg(t, 4.8, 5.2);
    };
  } });

// 3 — la receta
DEF.push({ bg: "#F6B400", tr: "right",
  strip: { color: "#FFFDF5", word: "Receta", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: -1 },
  sub: { x: 110, y: 790, w: 880, h: 620 },
  label: { text: "FI X174", x: 96, y: 1392, r: -4 },
  cap: ["El modelo partió del fago ΦX174,", "uno de los genomas más conocidos y pequeños que existen."],
  build(S) {
    const g = S.sub;
    E("path", { d: "M160 1330 L540 1270 L920 1330 L920 1360 L540 1300 L160 1360 Z", fill: "#8E5826" }, g);
    const book = E("g", {}, g);
    for (const sx of [-1, 1]) {
      E("path", { d: `M540 1280 L${540 + sx * 376} 1222 L${540 + sx * 376} 902 L540 960 Z`, fill: "#FFFDF5", stroke: "#CFC6AE", "stroke-width": 4 }, book);
      for (let k = 1; k < 4; k++) E("path", { d: `M${540 + sx * 8} ${1280 - k * 8} L${540 + sx * 372} ${1222 - k * 8}`, ...stroke("#DED6C0", 3) }, book);
      for (let k = 0; k < 7; k++) E("line", { x1: 540 + sx * 60, y1: 1012 + k * 34, x2: 540 + sx * 330, y2: 1012 + k * 34 - sx * 18, stroke: "#C9C1AE", "stroke-width": 5 }, book);
    }
    E("path", { d: "M540 960 L540 1280", ...stroke("#B6AC92", 5) }, book);
    // DNA helix rising out of the book
    const dna = E("g", {}, g), rungs = [];
    const P = (k, s) => { const y = 1000 - k * 26, ph = k * .42, x = 540 + s * 64 * Math.sin(ph); return [x, y, Math.cos(ph) * s]; };
    const A = [], B = [];
    for (let k = 0; k <= 22; k++) { A.push(P(k, 1).slice(0, 2)); B.push(P(k, -1).slice(0, 2)); }
    const sA = drawable(E("path", { d: "M" + A.map(p => p.join(" ")).join("L"), ...stroke("#2443D6", 11) }, dna));
    const sB = drawable(E("path", { d: "M" + B.map(p => p.join(" ")).join("L"), ...stroke(RED, 11) }, dna));
    for (let k = 0; k <= 22; k++) { const a = P(k, 1), b = P(k, -1);
      rungs.push(E("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...stroke("#FFD23F", 7), opacity: 0 }, dna)); }
    const letters = [];
    for (let k = 1; k < 22; k += 3) { const a = P(k, 1); letters.push(T(dna, "ACGT"[(k / 3 | 0) % 4], a[0] + 24, a[1] + 8, { f: MONO, s: 30, w: 800, c: INK, opacity: 0 })); }
    // the model virus in the margin
    const ml = S.layer("front", 700, 170, 320, 420);
    paper(ml, 720, 190, 280, 360, { seed: 421 });
    const mp = phage(ml, 860, 310, .62, { col: "#1E9E5A", dark: "#10663A" });
    pix(ml, "EL ORIGINAL", 860, 520, 4, "#666", "middle");
    S.piece(ml, { at: 1.3, from: "right", r: 5 });
    const nl = S.layer("front", 80, 160, 580, 340);
    paper(nl, 100, 182, 540, 280, { seed: 431 });
    T(nl, "5.386", 370, 330, { s: 120, w: 900, a: "middle", ls: -3 });
    T(nl, "letras de ADN", 370, 394, { f: SERIF, s: 42, i: 1, a: "middle" });
    pix(nl, "GENOMA DIMINUTO", 370, 212, 4, "#666", "middle");
    S.piece(nl, { at: 3.4, from: "left", r: -3 });
    return (t) => {
      sA.set(eo(seg(t, 1.4, 3.0))); sB.set(eo(seg(t, 1.5, 3.1)));
      rungs.forEach((r, i) => r.setAttribute("opacity", seg(t, 1.7 + i * .06, 1.95 + i * .06)));
      letters.forEach((l, i) => l.style.opacity = seg(t, 2.6 + i * .12, 2.9 + i * .12));
      dna.setAttribute("transform", `translate(0 ${(Math.sin(t * 1.2) * 5).toFixed(1)})`);
      mp.p.setAttribute("transform", `translate(860 ${(310 + Math.sin(t * 1.5) * 7).toFixed(1)}) scale(.62)`);
    };
  } });

// 4 — 16 de ~300
DEF.push({ bg: "#E8402A", tr: "up",
  strip: { color: "#FFFDF5", word: "285", wordColor: INK, cx: 540, cy: 590, size: 300, wx: -200, from: 1 },
  sub: { x: 70, y: 780, w: 940, h: 620 },
  label: { text: "LA CELULA JUZGA", x: 70, y: 1392, r: -4 },
  cap: ["De unos 300 diseños probados, solo 16 llegaron a funcionar:", "la célula fue el juez."],
  build(S) {
    const g = S.sub;
    // 300 dots; 16 light up
    const cols = 25, rows = 12, x0 = 150, y0 = 830, dx = 31, dy = 31, dots = [], lit = new Set();
    const r = rng(17); while (lit.size < 16) lit.add(Math.floor(r() * 300));
    for (let i = 0; i < 300; i++) { const cxp = x0 + (i % cols) * dx, cyp = y0 + Math.floor(i / cols) * dy;
      dots.push({ el: E("circle", { cx: cxp, cy: cyp, r: 11, fill: "#F7C9C0", stroke: "#B33322", "stroke-width": 2 }, g), on: lit.has(i), cx: cxp, cy: cyp }); }
    const barL = S.layer("front", 70, 1230, 940, 230);
    paper(barL, 100, 1248, 880, 196, { seed: 441 });
    const bg1 = E("rect", { x: 150, y: 1290, width: 0, height: 52, rx: 8, fill: "#C9C1AE" }, barL);
    const bg2 = E("rect", { x: 150, y: 1360, width: 0, height: 52, rx: 8, fill: "#1E9E5A" }, barL);
    const t1 = T(barL, "", 170, 1328, { s: 34, w: 800, c: "#333" }), t2 = T(barL, "", 170, 1398, { s: 34, w: 800, c: "#fff" });
    S.piece(barL, { at: 3.4, from: "bottom", dist: 700, r: 0 });
    return (t) => {
      dots.forEach((d, i) => { const p = eb(seg(t, .8 + i * .006, 1.0 + i * .006)); sxf(d.el, d.cx, d.cy, p); d.el.style.opacity = p > 0 ? 1 : 0;
        if (d.on) { const q = eo(seg(t, 2.6, 3.4)); d.el.setAttribute("fill", q > .5 ? "#FFD23F" : "#F7C9C0");
          d.el.setAttribute("r", (11 + q * 7 + (q > .5 ? Math.sin(t * 6 + i) * 1.5 : 0)).toFixed(1)); d.el.setAttribute("stroke", q > .5 ? INK : "#B33322"); } });
      const p1 = eo(seg(t, 3.7, 4.6)), p2 = eo(seg(t, 4.3, 5.0));
      bg1.setAttribute("width", (760 * p1).toFixed(1)); bg2.setAttribute("width", (41 * p2).toFixed(1));
      t1.textContent = p1 > .25 ? "~300 diseños probados" : ""; t2.setAttribute("x", p2 > 0 ? 210 : 170);
      t2.setAttribute("fill", "#1E9E5A"); t2.textContent = p2 > .4 ? "16 funcionaron" : "";
    };
  } });

// 5 — nuevos
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "Nuevos", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -160, from: -1 },
  sub: { x: 70, y: 790, w: 940, h: 600 },
  label: { text: "DISTINTOS", x: 96, y: 1392, r: -4 },
  cap: ["No eran copias:", "se separaban de sus parientes naturales en cientos de puntos del genoma."],
  build(S) {
    const g = S.sub, r = rng(23), n = 46, x0 = 150, w = 780, cw = w / n;
    const rowY = [900, 1040], labels = ["natural", "diseñado por IA"];
    const cells = [[], []];
    rowY.forEach((y, k) => {
      paper(g, x0 - 12, y - 12, w + 24, 96, { seed: 451 + k, j: 5, shadow: k === 1 });
      T(g, labels[k], x0, y - 26, { f: SERIF, s: 34, i: 1, c: k ? "#fff" : "#DCD5F2" });
      for (let i = 0; i < n; i++) { const base = Math.floor(r() * 4), col = ["#2443D6", "#1E9E5A", "#FFD23F", RED][base];
        cells[k].push({ el: E("rect", { x: x0 + i * cw + 1.5, y, width: cw - 3, height: 72, fill: col }, g), base }); }
    });
    // differences: recolour the AI row and mark them
    const diffIdx = []; for (let i = 0; i < n; i++) if (r() < .34) diffIdx.push(i);
    const marks = diffIdx.map(i => E("rect", { x: x0 + i * cw - 1, y: 1032, width: cw + 2, height: 88, fill: "none", stroke: "#fff", "stroke-width": 4, opacity: 0 }, g));
    const cl = S.layer("front", 90, 1180, 900, 260);
    paper(cl, 110, 1200, 860, 210, { seed: 461 });
    const num = T(cl, "0", 300, 1352, { s: 120, w: 900, c: RED, a: "middle", ls: -4 });
    T(cl, "diferencias con su", 520, 1300, { f: SERIF, s: 44, i: 1 });
    T(cl, "pariente más cercano", 520, 1356, { f: SERIF, s: 44, i: 1 });
    S.piece(cl, { at: 3.6, from: "bottom", dist: 600, r: 0 });
    return (t) => {
      cells.forEach((row, k) => row.forEach((c, i) => { const p = eb(seg(t, .8 + k * .5 + i * .02, 1.0 + k * .5 + i * .02));
        c.el.setAttribute("transform", `translate(0 ${((1 - p) * 60).toFixed(1)})`); c.el.style.opacity = p; }));
      const sw = seg(t, 2.8, 3.4);
      diffIdx.forEach((i, k) => { const on = sw > k / diffIdx.length;
        cells[1][i].el.setAttribute("fill", on ? ["#FF6EC7", "#5CE1FF", "#FFD23F", "#CFF75A"][k % 4] : ["#2443D6", "#1E9E5A", "#FFD23F", RED][cells[1][i].base]);
        marks[k].setAttribute("opacity", on ? (.55 + .45 * Math.sin(t * 5 + k)).toFixed(2) : 0); });
      num.textContent = t < 3.9 ? "0" : Math.round(400 * eo(seg(t, 3.9, 5.2))) + "+";
    };
  } });

// 6 — la resistencia
DEF.push({ bg: "#FF7A1A", tr: "right",
  strip: { color: "#141414", word: "Resistencia", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 250, maxW: 860, wx: -110, from: 1 },
  sub: { x: 90, y: 780, w: 900, h: 640 },
  label: { text: "SE RINDIO", x: 96, y: 1392, r: -4 },
  cap: ["Frente a bacterias que resistían al virus original,", "una mezcla de estos fagos consiguió vencerlas."],
  build(S) {
    const g = S.sub, bx = 540, by = 1180;
    const bac = bacterium(g, bx, by, 440, 220, "#2EC46E");
    const shieldD = `M${bx} ${by - 230} L${bx + 220} ${by - 150} L${bx + 220} ${by + 30} Q${bx + 220} ${by + 180} ${bx} ${by + 250} Q${bx - 220} ${by + 180} ${bx - 220} ${by + 30} L${bx - 220} ${by - 150} Z`;
    const sh = E("g", {}, g);
    E("path", { d: shieldD, fill: "rgba(120,200,255,.42)", stroke: "#2EA8E8", "stroke-width": 9 }, sh);
    E("path", { d: `M${bx - 150} ${by - 110} Q${bx - 170} ${by + 10} ${bx - 120} ${by + 110}`, ...stroke("#fff", 14), opacity: .6 }, sh);
    const crack = drawable(E("path", { d: `M${bx - 40} ${by - 230} l50 110 l-70 40 l80 120 l-30 90 l60 110`, ...stroke("#fff", 9) }, sh));
    const pieces = [[-1, -14], [1, 12]].map(([s, rot]) => { const pg = E("g", {}, g); return { pg, s, rot }; });
    // three phages of the cocktail
    const ph = [[300, 850, .62, "#7B3FE4", "#4A1F96"], [540, 800, .66, "#E8367F", "#9E1C52"], [780, 850, .62, "#2EA8E8", "#145E88"]].map(([x, y, s, c, d]) => ({ ...phage(g, x, y, s, { col: c, dark: d }), x, y, s }));
    const cl = S.layer("front", 90, 150, 900, 300);
    paper(cl, 110, 172, 860, 250, { seed: 471 });
    T(cl, "una mezcla,", 540, 272, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "no un solo fago", 540, 344, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    pix(cl, "COCTEL", 540, 388, 4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      ph.forEach((o, i) => { const dive = eio(seg(t, 2.2 + i * .25, 3.6 + i * .25));
        o.p.setAttribute("transform", `translate(${o.x} ${(o.y + dive * 200 + Math.sin(t * 2 + i) * 8).toFixed(1)}) scale(${o.s})`);
        o.p.style.opacity = 1 - seg(t, 4.0 + i * .2, 4.4 + i * .2); });
      crack.set(eo(seg(t, 3.9, 4.8)));
      const brk = eo(seg(t, 4.9, 5.8));
      sh.style.opacity = (1 - brk * .9).toFixed(2);
      sh.setAttribute("transform", `translate(${(brk * -40).toFixed(1)} ${(brk * 30).toFixed(1)}) rotate(${(brk * -8).toFixed(1)} ${bx} ${by})`);
      bac.setAttribute("transform", `translate(${bx} ${(by + Math.sin(t * 1.4) * 5).toFixed(1)}) rotate(${(Math.sin(t * 1.1) * 2 - brk * 6).toFixed(2)}) scale(${(1 - brk * .12).toFixed(3)})`);
    };
  } });

// 7 — ¿para qué sirve?
DEF.push({ bg: "#E8367F", tr: "up",
  strip: { color: "#FFFDF5", word: "¿Para qué?", wordColor: INK, cx: 540, cy: 620, size: 260, maxW: 880, wx: -90, from: -1 },
  sub: { x: 90, y: 820, w: 900, h: 560 },
  label: { text: "ANTIBIOTICOS", x: 70, y: 1392, r: -4 },
  cap: ["La promesa es la terapia con fagos", "contra bacterias que ya no responden a los antibióticos."],
  build(S) {
    const g = S.sub;
    // left: pills crossed out
    const pills = E("g", {}, g);
    E("ellipse", { cx: 310, cy: 1300, rx: 170, ry: 30, fill: "rgba(0,0,0,.18)" }, pills);
    pill(pills, 250, 1150, -18); pill(pills, 360, 1230, 12); pill(pills, 260, 1280, -6, "#2443D6");
    const x1 = drawable(E("path", { d: "M120 1060 Q320 1200 500 1340", ...stroke("#fff", 16) }, g));
    const x2 = drawable(E("path", { d: "M500 1060 Q320 1200 120 1340", ...stroke("#fff", 16) }, g));
    T(g, "ya no funcionan", 310, 1398, { f: SERIF, s: 38, i: 1, c: "#fff", a: "middle" });
    // right: phage vial
    const vial = E("g", {}, g);
    E("path", { d: "M700 1040 L880 1040 L880 1090 L856 1110 L856 1330 Q856 1372 790 1372 Q724 1372 724 1330 L724 1110 L700 1090 Z", fill: "rgba(255,255,255,.35)", stroke: "#fff", "stroke-width": 7 }, vial);
    const liq = E("clipPath", { id: "vialClip" }, g);
    E("path", { d: "M724 1110 L856 1110 L856 1330 Q856 1372 790 1372 Q724 1372 724 1330 Z" }, liq);
    const lg = E("g", { "clip-path": "url(#vialClip)" }, vial);
    const lv = E("rect", { x: 718, y: 1372, width: 150, height: 300, fill: "#7B3FE4" }, lg);
    const mini = [];
    for (let i = 0; i < 5; i++) mini.push(phage(lg, 744 + (i % 3) * 46, 1180 + (i % 2) * 70, .17, { col: "#CFF75A", dark: "#7FA81F" }));
    E("rect", { x: 696, y: 1028, width: 188, height: 26, rx: 8, fill: "#fff" }, vial);
    E("path", { d: "M740 1130 L740 1320", ...stroke("#fff", 10), opacity: .45 }, vial);
    const ar = harrow(g, 530, 1180, 660, 1180, { bend: -.28, c: "#fff", w: 9, hl: 30 });
    const sl = S.layer("front", 80, 140, 330, 400);
    portrait(sl, 110, 160, { seed: 481, name: "LABORATORIO", hair: "fringe", hairC: "#3b2b1f", suit: "#F2F4F7", shirt: "#CFE3F5", halo: "#CFF75A", glasses: true });
    S.piece(sl, { at: 1.2, from: "left", r: -4 });
    const tl = S.layer("front", 450, 170, 570, 340);
    paper(tl, 470, 190, 530, 290, { seed: 491 });
    T(tl, "terapia", 735, 290, { f: SERIF, s: 72, i: 1, a: "middle" });
    T(tl, "con fagos", 735, 368, { f: SERIF, s: 72, i: 1, a: "middle", c: RED });
    pix(tl, "UNA VIA, NO UNA CURA", 735, 420, 3.5, "#666", "middle");
    S.piece(tl, { at: 2.4, from: "right", r: 3 });
    return (t) => {
      x1.set(eo(seg(t, 2.0, 2.5))); x2.set(eo(seg(t, 2.4, 2.9)));
      const fill = eo(seg(t, 3.4, 4.6)); lv.setAttribute("y", (1372 - 262 * fill).toFixed(1));
      mini.forEach((m, i) => { const yy = 1180 + (i % 2) * 70 + Math.sin(t * 2 + i) * 10;
        m.p.setAttribute("transform", `translate(${744 + (i % 3) * 46} ${yy.toFixed(1)}) scale(.17)`); m.p.style.opacity = fill > .45 ? 1 : 0; });
      ar.set(eo(seg(t, 3.0, 3.6)));
    };
  } });

// 8 — cautela
DEF.push({ bg: "#123C5A", tr: "left",
  strip: { color: "#FFE14D", word: "Cautela", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -150, from: 1 },
  sub: { x: 90, y: 780, w: 900, h: 640 },
  label: { text: "REVISAR", x: 96, y: 1392, r: -4 },
  cap: ["Por eso importa cómo se revisan estas secuencias y quién responde:", "la IA escribió, pero la célula decidió."],
  build(S) {
    const g = S.sub, cx = 540, cy = 1060;
    // magnifier over a strip of sequence
    const strip = E("g", {}, g);
    paper(strip, 150, 1180, 780, 110, { seed: 501 });
    const r = rng(29), letters = [];
    for (let i = 0; i < 30; i++) letters.push(T(strip, "ACGT"[Math.floor(r() * 4)], 178 + i * 25, 1252, { f: MONO, s: 40, w: 800, c: ["#2443D6", "#1E9E5A", "#B8860B", RED][Math.floor(r() * 4)] }));
    const lens = E("g", {}, g), R = 150;
    const hg = E("g", { transform: `rotate(42 ${cx} ${cy})` }, lens);
    E("rect", { x: cx + R + 4, y: cy - 16, width: 46, height: 32, fill: "url(#gMetal)" }, hg);
    E("rect", { x: cx + R + 46, y: cy - 26, width: 200, height: 52, rx: 24, fill: "url(#gDark)" }, hg);
    E("circle", { cx, cy, r: R, fill: "rgba(225,242,255,.5)" }, lens);
    E("path", { d: `M${cx - 110} ${cy - 70} A130 130 0 0 1 ${cx + 20} ${cy - 128}`, ...stroke("#fff", 14), opacity: .7 }, lens);
    E("circle", { cx, cy, r: R, fill: "none", stroke: "url(#gMetal)", "stroke-width": 30 }, lens);
    E("circle", { cx, cy, r: R - 15, fill: "none", stroke: "#4a4f55", "stroke-width": 2.5 }, lens);
    const stamp = E("g", { opacity: 0 }, g), sx = 760, sy = 980;
    E("circle", { cx: sx, cy: sy, r: 96, fill: "none", stroke: "#1E9E5A", "stroke-width": 10 }, stamp);
    T(stamp, "REVISADO", sx, sy + 10, { s: 34, w: 900, c: "#1E9E5A", a: "middle", ls: 1 });
    T(stamp, "ANTES", sx, sy + 52, { s: 30, w: 900, c: "#1E9E5A", a: "middle" });
    stamp.setAttribute("transform", `rotate(-14 ${sx} ${sy})`);
    const cl = S.layer("front", 80, 150, 920, 340);
    paper(cl, 100, 172, 880, 290, { seed: 511 });
    T(cl, "la IA escribió,", 540, 288, { f: SERIF, s: 62, i: 1, a: "middle" });
    const l2 = T(cl, "", 540, 374, { f: SERIF, s: 62, i: 1, a: "middle", c: RED });
    const ul = drawable(E("path", { d: "M250 400 Q540 420 830 394", ...stroke(RED, 8) }, cl));
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      lens.setAttribute("transform", `translate(${(Math.sin(t * .75) * 250).toFixed(1)} ${(Math.sin(t * 1.3) * 22).toFixed(1)})`);
      letters.forEach((l, i) => { const d = Math.abs(178 + i * 25 - (cx + Math.sin(t * .75) * 250));
        l.setAttribute("font-size", d < 150 ? 48 : 40); l.setAttribute("opacity", d < 150 ? 1 : .55); });
      const sp = eb(seg(t, 4.2, 4.6)); stamp.setAttribute("opacity", sp > 0 ? .95 : 0);
      stamp.setAttribute("transform", `rotate(-14 ${sx} ${sy}) translate(${sx} ${sy}) scale(${(1.3 - .3 * sp).toFixed(3)}) translate(${-sx} ${-sy})`);
      l2.textContent = t > 3.0 ? "pero la célula decidió" : "";
      ul.set(eo(seg(t, 5.0, 5.8)));
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
    E("path", { d: torn(70, 545, 940, 1060, 571, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["King et al., Science, 6 ago 2026", "Generative design of bacteriophages with genome language models"],
      ["bioRxiv, 12 sep 2025", "Versión preprint del mismo trabajo"],
      ["Stanford News, 2026", "AI designs a novel E. coli killer"],
      ["Arc Institute", "Evo 2: modelo de lenguaje de genomas"],
      ["Nature, 2026", "Genome modeling and design across all domains of life"],
      ["Phys.org, ago 2026", "Sixteen AI-designed viruses offer a new route"],
      ["University of Reading, 2026", "Comentario de expertos sobre el estudio"],
      ["Asimov Press", "AI-Designed Phages"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 625 + i * 118;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 30, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    T(fl, "Resumen divulgativo: no describe métodos de laboratorio.", 540, 1736, { s: 27, w: 500, c: "#aaa", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
