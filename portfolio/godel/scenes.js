// «La frase que no se puede demostrar»: scenes (inserted into the paper-collage engine by build.py)
// Two real people are drawn as cut-out illustrations, from photographs: Kurt Gödel (as he looked
// around 1930) and Roger Penrose. Hilbert, Turing, Putnam and Chalmers are named, never drawn.
const DEF = [];

// ---------- faces ----------
// A cut-out portrait card built for a likeness: narrow head and heavy round glasses for Gödel,
// broad head and white wavy hair for Penrose.
function face(g, x, y, o) {
  const w = 300, h = 392, cx = x + w / 2, hy = y + 168;
  const skin = o.skin, shade = o.shade, hair = o.hair, rim = "#1C1A17";
  paper(g, x, y, w, h, { seed: o.seed || 31, fill: o.card || "#FFFDF5" });
  const cid = "fc" + (UID++), cp = E("clipPath", { id: cid }, g);
  E("rect", { x: x + 5, y: y + 5, width: w - 10, height: h - 10 }, cp);
  const p = E("g", { "clip-path": `url(#${cid})` }, g);
  E("circle", { cx, cy: hy + 16, r: 132, fill: o.halo, opacity: .92 }, p);

  // neck and shoulders
  E("path", { d: `M${cx - 26} ${hy + 56} h52 v66 h-52 Z`, fill: shade }, p);
  E("path", { d: `M${x + 8} ${y + h} C${x + 16} ${y + 318} ${cx - 76} ${y + 292} ${cx - 42} ${y + 282} L${cx + 42} ${y + 282} C${cx + 76} ${y + 292} ${x + w - 16} ${y + 318} ${x + w - 8} ${y + h} Z`, fill: o.suit }, p);
  E("path", { d: `M${cx - 42} ${y + 282} L${cx} ${y + 360} L${cx + 42} ${y + 282} Z`, fill: o.shirt }, p);
  if (o.tie) E("path", { d: `M${cx - 10} ${y + 296} L${cx + 10} ${y + 296} L${cx + 15} ${y + 362} L${cx} ${y + 380} L${cx - 15} ${y + 362} Z`, fill: o.tie }, p);
  E("path", { d: `M${cx - 42} ${y + 282} L${cx - 14} ${y + 358} L${cx - 64} ${y + 310} Z M${cx + 42} ${y + 282} L${cx + 14} ${y + 358} L${cx + 64} ${y + 310} Z`, fill: "rgba(0,0,0,.2)" }, p);

  // ears, head
  for (const s of [-1, 1]) E("ellipse", { cx: cx + s * (o.rx + 2), cy: hy + 10, rx: 13, ry: o.ear || 22, fill: shade }, p);
  E("ellipse", { cx, cy: hy, rx: o.rx, ry: o.ry, fill: skin }, p);
  E("path", { d: `M${cx + o.rx - 16} ${hy - o.ry + 18} C${cx + o.rx + 16} ${hy - 30} ${cx + o.rx + 10} ${hy + 44} ${cx + 10} ${hy + o.ry - 4} C${cx + o.rx - 8} ${hy + 40} ${cx + o.rx - 4} ${hy - 24} ${cx + o.rx - 16} ${hy - o.ry + 18} Z`, fill: shade, opacity: .5 }, p);

  if (o.who === "godel") {
    // dark hair: high hairline, receding temples, combed back from a left parting
    E("path", { d: `M${cx - 56} ${hy - 16} C${cx - 74} ${hy - 76} ${cx - 30} ${hy - 112} ${cx + 8} ${hy - 108} C${cx + 56} ${hy - 104} ${cx + 74} ${hy - 70} ${cx + 62} ${hy - 14} C${cx + 54} ${hy - 46} ${cx + 40} ${hy - 58} ${cx + 4} ${hy - 54} C${cx - 26} ${hy - 50} ${cx - 46} ${hy - 34} ${cx - 56} ${hy - 16} Z`, fill: hair }, p);
    for (let k = 0; k < 4; k++) E("path", { d: `M${cx - 24 + k * 19} ${hy - 58} C${cx - 14 + k * 19} ${hy - 74} ${cx + 4 + k * 19} ${hy - 82} ${cx + 20 + k * 19} ${hy - 80}`, ...stroke("#4A4440", 3) }, p);
    E("path", { d: `M${cx + 22} ${hy - 104} C${cx + 16} ${hy - 88} ${cx + 13} ${hy - 72} ${cx + 16} ${hy - 58}`, ...stroke("#5C5551", 4) }, p);
  } else {
    // full white hair: a soft mass that covers the temples and falls past the ears
    E("path", { d: `M${cx - 84} ${hy + 44} C${cx - 100} ${hy - 40} ${cx - 60} ${hy - 110} ${cx + 4} ${hy - 108} C${cx + 72} ${hy - 106} ${cx + 100} ${hy - 44} ${cx + 84} ${hy + 44} C${cx + 76} ${hy - 8} ${cx + 60} ${hy - 38} ${cx + 16} ${hy - 44} C${cx - 24} ${hy - 48} ${cx - 62} ${hy - 24} ${cx - 84} ${hy + 44} Z`, fill: hair }, p);
    for (let k = 0; k < 8; k++) E("path", { d: `M${cx - 70 + k * 19} ${hy - 34 - (k % 2) * 10} C${cx - 58 + k * 19} ${hy - 64} ${cx - 34 + k * 19} ${hy - 84} ${cx - 14 + k * 19} ${hy - 80}`, ...stroke("#C4BFB6", 4) }, p);
    for (const s of [-1, 1]) E("path", { d: `M${cx + s * 80} ${hy - 10} C${cx + s * 96} ${hy + 26} ${cx + s * 88} ${hy + 52} ${cx + s * 68} ${hy + 60}`, ...stroke(hair, 20) }, p);
  }

  // brows, eyes, glasses
  for (const s of [-1, 1]) {
    E("path", { d: `M${cx + s * 13} ${hy - 26} Q${cx + s * 29} ${hy - (o.who === "godel" ? 34 : 38)} ${cx + s * 45} ${hy - 26}`, ...stroke(o.brow, o.who === "godel" ? 5 : 8) }, p);
    E("ellipse", { cx: cx + s * 28, cy: hy - 6, rx: 10, ry: 6.5, fill: "#fff" }, p);
    E("circle", { cx: cx + s * 28, cy: hy - 6, r: 5.4, fill: "#2a1d14" }, p);
    E("circle", { cx: cx + s * 28 - 2, cy: hy - 8, r: 1.9, fill: "#fff" }, p);
  }
  if (o.who === "godel") {
    for (const s of [-1, 1]) {
      E("circle", { cx: cx + s * 28, cy: hy - 6, r: 25, fill: "rgba(255,255,255,.14)", stroke: rim, "stroke-width": 5.5 }, p);
      E("path", { d: `M${cx + s * 52} ${hy - 10} L${cx + s * (o.rx + 4)} ${hy - 2}`, ...stroke(rim, 4) }, p);
    }
    E("path", { d: `M${cx - 4} ${hy - 12} Q${cx} ${hy - 18} ${cx + 4} ${hy - 12}`, ...stroke(rim, 5) }, p);
  } else {
    for (const s of [-1, 1]) {
      E("rect", { x: cx + s * 28 - 27, y: hy - 25, width: 54, height: 40, rx: 11, fill: "rgba(255,255,255,.14)", stroke: rim, "stroke-width": 5 }, p);
      E("path", { d: `M${cx + s * 56} ${hy - 14} L${cx + s * (o.rx + 4)} ${hy - 6}`, ...stroke(rim, 4) }, p);
    }
    E("path", { d: `M${cx - 2} ${hy - 12} h4`, ...stroke(rim, 5) }, p);
  }

  // nose, mouth, cheeks
  E("path", { d: `M${cx + 2} ${hy + 4} Q${cx + 11} ${hy + 30} ${cx - 5} ${hy + 34}`, ...stroke(shade, 4) }, p);
  if (o.who === "godel") E("path", { d: `M${cx - 19} ${hy + 54} Q${cx} ${hy + 60} ${cx + 19} ${hy + 53}`, ...stroke("#8a3b2b", 4.5) }, p);
  else {
    E("path", { d: `M${cx - 25} ${hy + 50} Q${cx} ${hy + 76} ${cx + 25} ${hy + 50}`, ...stroke("#8a3b2b", 4.5) }, p);
    for (const s of [-1, 1]) E("path", { d: `M${cx + s * 31} ${hy + 40} Q${cx + s * 36} ${hy + 52} ${cx + s * 29} ${hy + 60}`, ...stroke(shade, 3), opacity: .6 }, p);
  }
  for (const s of [-1, 1]) E("ellipse", { cx: cx + s * 38, cy: hy + 30, rx: 12, ry: 7, fill: "#F28C8C", opacity: .28 }, p);
  E("ellipse", { cx: cx - 24, cy: hy - 56, rx: 20, ry: 9, fill: "#fff", opacity: .3 }, p);

  if (o.top) pix(g, o.top, cx, y + 20, 3, "#777", "middle");
  const tw = pixW(o.name, 4) + 26;
  E("rect", { x: cx - tw / 2, y: y + h - 32, width: tw, height: 54, fill: "#111" }, g);
  pix(g, o.name, cx, y + h - 17, 4, "#fff", "middle");
}

const GODEL = { who: "godel", rx: 58, ry: 80, ear: 24, skin: "#EFD2B4", shade: "#D0A882", hair: "#262220",
  brow: "#262220", suit: "#2B2F38", shirt: "#FFFDF5", tie: "#55331F", halo: "#FFD23F", card: "#FFFDF5" };
const PENROSE = { who: "penrose", rx: 66, ry: 74, ear: 20, skin: "#F0C6A2", shade: "#D3A079", hair: "#EDEAE4",
  brow: "#C9C4BB", suit: "#36414C", shirt: "#CFE2F2", halo: "#7FD4E8", card: "#FFFDF5" };

// ---------- props ----------
function radio(g, cx, cy, s) {
  const k = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g);
  E("ellipse", { cx: 0, cy: 212, rx: 210, ry: 26, fill: "rgba(0,0,0,.25)" }, k);
  E("path", { d: "M-196 200 L-196 -40 A196 196 0 0 1 196 -40 L196 200 Z", fill: "#8B5A2B", stroke: "#4E2F13", "stroke-width": 6 }, k);
  E("path", { d: "M-170 190 L-170 -34 A170 170 0 0 1 170 -34 L170 190 Z", fill: "#A06B33" }, k);
  E("path", { d: "M-150 60 L-150 -24 A150 150 0 0 1 150 -24 L150 60 Z", fill: "#5C3A18" }, k);
  for (let i = 0; i < 11; i++) E("rect", { x: -134 + i * 26, y: -118, width: 13, height: 170, rx: 6, fill: "#C8A268", opacity: .85 }, k);
  E("circle", { cx: 0, cy: 118, r: 62, fill: "#F3E5C8", stroke: "#4E2F13", "stroke-width": 6 }, k);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + i * .0875);
    E("line", { x1: Math.cos(a) * 46, y1: 118 - Math.sin(a) * 46, x2: Math.cos(a) * 54, y2: 118 - Math.sin(a) * 54, ...stroke("#4E2F13", 3) }, k); }
  const needle = E("line", { x1: 0, y1: 118, x2: 0, y2: 66, ...stroke("#C62828", 5) }, k);
  E("circle", { cx: 0, cy: 118, r: 9, fill: "#4E2F13" }, k);
  for (const sx of [-1, 1]) E("circle", { cx: sx * 118, cy: 126, r: 26, fill: "#3A2412", stroke: "#1E1208", "stroke-width": 4 }, k);
  E("path", { d: "M-150 -100 C-110 -140 -40 -156 0 -156", ...stroke("#fff", 7), opacity: .22 }, k);
  return { k, needle };
}

function brickWall(g, x, y, w, h, rows, seed, bw = 72) {
  const k = E("g", {}, g), bh = h / rows, r = rng(seed);
  for (let i = 0; i < rows; i++) {
    const off = (i % 2) * (bw / 2);
    for (let j = -1; x - off + j * bw < x + w; j++) {
      const bx = x - off + j * bw + 3, cx0 = Math.max(x, bx), cw = Math.min(x + w, bx + bw - 6) - cx0;
      if (cw < 5) continue;
      E("rect", { x: cx0, y: y + i * bh + 4, width: cw, height: bh - 8, rx: 4,
        fill: ["#B8563C", "#A84C34", "#C25E42"][Math.floor(r() * 3)], stroke: "#7C3220", "stroke-width": 3 }, k);
    }
  }
  E("rect", { x: x - 10, y: y - 16, width: w + 20, height: 20, rx: 5, fill: "#8E3C27" }, k);
  return k;
}

function stampCard(g, x, y, w, h, title, sub, ok, seed) {
  const k = E("g", {}, g);
  paper(k, x, y, w, h, { seed, fill: "#FFFDF5" });
  const tw = pixW(title, 4) + 22;
  E("rect", { x: x + 24, y: y + 24, width: tw, height: 48, fill: INK }, k);
  pix(k, title, x + 35, y + 38, 4, "#fff");
  T(k, sub, x + w / 2, y + h / 2 + 14, { f: SERIF, s: 38, i: 1, a: "middle", w: 400 });
  const sg = E("g", { transform: `rotate(-9 ${x + w / 2} ${y + h - 70})` }, k);
  E("circle", { cx: x + w / 2, cy: y + h - 70, r: 38, fill: "none", stroke: ok ? "#1E9E5A" : RED, "stroke-width": 6, opacity: .85 }, sg);
  if (ok) E("path", { d: `M${x + w / 2 - 16} ${y + h - 70} l12 14 l22 -26`, ...stroke("#1E9E5A", 7) }, sg);
  else { E("path", { d: `M${x + w / 2 - 15} ${y + h - 85} l30 30 M${x + w / 2 + 15} ${y + h - 85} l-30 30`, ...stroke(RED, 7) }, sg); }
  return k;
}

// =====================================================================
// 1 — Königsberg, la radio
DEF.push({ bg: "#8E1B2E", tr: "left",
  strip: { color: "#F3E5C8", word: "Sabremos", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -60, maxW: 940, from: -1 },
  sub: { x: 90, y: 800, w: 900, h: 600 },
  label: { text: "RADIO, 1930", x: 96, y: 1392, r: -4 },
  cap: ["El 8 de septiembre de 1930, Hilbert cerró su discurso por la radio:", "«debemos saber, sabremos»."],
  build(S) {
    const g = S.sub;
    const rw = E("g", {}, g), { k, needle } = radio(rw, 540, 1070, 1.02);
    const waves = [];
    for (let i = 0; i < 3; i++) waves.push(drawable(E("path", { d: `M${770 + i * 46} ${900} A${90 + i * 46} ${90 + i * 46} 0 0 1 ${770 + i * 46} ${1080}`, ...stroke("#F3E5C8", 7) }, g)));
    S.piece(rw, { at: .5, from: "bottom", dist: 700, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1101 });
    T(cl, "el último sueño de", 540, 278, { f: SERIF, s: 52, i: 1, a: "middle" });
    T(cl, "las matemáticas", 540, 352, { f: SERIF, s: 52, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      needle.setAttribute("x2", (Math.sin(t * .8) * 26).toFixed(1));
      waves.forEach((w, i) => w.set(seg(t, 1.6 + i * .3, 2.2 + i * .3) * (.75 + .25 * Math.sin(t * 3 - i))));
    };
  } });

// 2 — la máquina de reglas
DEF.push({ bg: "#D9A400", tr: "right",
  strip: { color: "#FFFDF5", word: "Reglas", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -120, from: 1 },
  sub: { x: 60, y: 790, w: 960, h: 620 },
  label: { text: "SIN HUECOS", x: 96, y: 1392, r: -4 },
  cap: ["Soñaba con una máquina de reglas capaz de demostrar,", "tarde o temprano, toda verdad matemática."],
  build(S) {
    const g = S.sub;
    const m = E("g", {}, g);
    E("rect", { x: 340, y: 930, width: 400, height: 250, rx: 18, fill: "#3B4654", stroke: "#1E2630", "stroke-width": 6 }, m);
    E("rect", { x: 368, y: 958, width: 344, height: 104, rx: 10, fill: "#556375" }, m);
    for (let i = 0; i < 6; i++) E("circle", { cx: 398 + i * 57, cy: 1010, r: 16, fill: i % 2 ? "#FFD23F" : "#CFF75A" }, m);
    E("path", { d: "M340 930 L410 862 L670 862 L740 930 Z", fill: "#556375", stroke: "#1E2630", "stroke-width": 6 }, m);
    E("rect", { x: 150, y: 1186, width: 780, height: 26, rx: 13, fill: "#2A323C" }, m);
    for (let i = 0; i < 9; i++) E("circle", { cx: 176 + i * 95, cy: 1199, r: 7, fill: "#49535F" }, m);
    const gear = E("g", {}, m);
    E("circle", { cx: 788, cy: 1070, r: 46, fill: "#2A323C" }, gear);
    for (let i = 0; i < 8; i++) { const a2 = i * Math.PI / 4;
      E("rect", { x: 788 + Math.cos(a2) * 52 - 10, y: 1070 + Math.sin(a2) * 52 - 10, width: 20, height: 20, rx: 4, fill: "#2A323C" }, gear); }
    E("circle", { cx: 788, cy: 1070, r: 14, fill: "#D9A400" }, gear);
    const axiom = E("g", {}, m);
    paper(axiom, 460, 740, 160, 96, { seed: 1211, fill: "#FFFDF5" });
    pix(axiom, "AXIOMAS", 540, 778, 3, INK, "middle");
    const outs = [0, 1, 2].map((i) => {
      const og = E("g", {}, m);
      paper(og, 180 + i * 250, 1230, 210, 118, { seed: 1221 + i, fill: "#FFFDF5" });
      pix(og, "TEOREMA", 285 + i * 250, 1264, 3, INK, "middle");
      E("path", { d: `M${256 + i * 250} 1304 l16 18 l30 -36`, ...stroke("#1E9E5A", 8) }, og);
      return og; });
    S.piece(m, { at: .5, from: "bottom", dist: 640, r: -1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1201 });
    T(cl, "toda verdad,", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "con su demostración", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      gear.setAttribute("transform", `rotate(${(t * 48).toFixed(1)} 788 1070)`);
      const drop = seg(t, 1.3, 2.1);
      axiom.setAttribute("transform", `translate(0 ${(drop * 110).toFixed(1)})`);
      axiom.style.opacity = (1 - seg(t, 2.0, 2.3)).toFixed(2);
      outs.forEach((o, i) => { const q = eb(seg(t, 2.3 + i * .45, 2.8 + i * .45));
        o.style.opacity = q > 0 ? 1 : 0;
        o.setAttribute("transform", `translate(${((1 - q) * -160).toFixed(1)} 0)`); });
    };
  } });

// 3 — el día antes
DEF.push({ bg: "#1F4FD8", tr: "left",
  strip: { color: "#FFD23F", word: "El día antes", wordColor: INK, cx: 540, cy: 600, size: 240, wx: -40, maxW: 960, from: -1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "7 SEPT 1930", x: 96, y: 1392, r: -4 },
  cap: ["El día antes, en esa misma ciudad, un joven de 24 años", "ya lo había refutado, y casi nadie se dio cuenta."],
  build(S) {
    const g = S.sub;
    const fg = E("g", {}, g);
    face(E("g", { transform: "translate(60 848) scale(1.26)" }, fg), 0, 0, { ...GODEL, name: "GODEL, 1930", top: "VIENA" });
    const cal = E("g", {}, g);
    paper(cal, 590, 880, 390, 390, { seed: 1311, fill: "#FFFDF5" });
    E("rect", { x: 590, y: 880, width: 390, height: 84, fill: "#1B1B1B" }, cal);
    pix(cal, "SEPT. 1930", 785, 908, 4, "#fff", "middle");
    T(cal, "7", 785, 1160, { s: 190, a: "middle", c: INK, w: 900 });
    pix(cal, "KONIGSBERG", 785, 1222, 3, "#555", "middle");
    const ring = hcircle(cal, 785, 1098, 136, 112, { seed: 7, c: RED, w: 10 });
    const murmur = [];
    for (let i = 0; i < 4; i++) murmur.push(E("circle", { cx: 470 + i * 12, cy: 950, r: 5 + i * 2, fill: "#FFFDF5", opacity: 0 }, g));
    S.piece(fg, { at: .5, from: "bottom", dist: 700, r: -3 });
    S.piece(cal, { at: 1.5, from: "right", dist: 620, r: 3 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1301 });
    T(cl, "ya estaba refutado:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "nadie lo escuchó", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      ring.set(seg(t, 2.6, 3.5));
      murmur.forEach((m, i) => { const f = ((t * .5 + i * .22) % 1);
        m.setAttribute("cy", (950 - f * 90).toFixed(1));
        m.setAttribute("opacity", t > 2.0 ? ((1 - f) * .45).toFixed(2) : 0); });
    };
  } });

// 4 — la numeración de Gödel
DEF.push({ bg: "#13825A", tr: "right",
  strip: { color: "#FFFDF5", word: "Números", wordColor: INK, cx: 540, cy: 600, size: 270, wx: -110, from: 1 },
  sub: { x: 50, y: 790, w: 980, h: 640 },
  label: { text: "NUMERACION", x: 96, y: 1392, r: -4 },
  cap: ["Su truco fue dar un número a cada fórmula,", "para que las matemáticas pudieran hablar de sí mismas."],
  build(S) {
    const g = S.sub;
    const top = E("g", {}, g);
    paper(top, 180, 860, 720, 170, { seed: 1411, fill: "#FFFDF5" });
    const syms = ["∀", "x", "¬", "(", "x", "=", "0", ")"];
    const chips = syms.map((s, i) => { const cg = E("g", {}, top);
      T(cg, s, 250 + i * 86, 975, { f: SERIF, s: 72, a: "middle", w: 700 }); return cg; });
    const arrow = harrow(g, 540, 1104, 540, 1162, { c: "#FFD23F", w: 9, bend: .12, hl: 26 });
    const bot = E("g", {}, g);
    paper(bot, 120, 1170, 840, 190, { seed: 1421, fill: "#FFD23F" });
    const num = T(bot, "0", 540, 1298, { s: 92, a: "middle", w: 900, c: INK, ls: -2 });
    const nums = syms.map((_, i) => E("text", { x: 250 + i * 86, y: 1082, "font-family": SANS, "font-size": 34, "font-weight": 700,
      fill: "#CFF75A", "text-anchor": "middle" }, g));
    const codes = [2, 3, 5, 7, 11, 13, 17, 19];
    nums.forEach((n, i) => n.textContent = codes[i]);
    S.piece(top, { at: .5, from: "top", dist: 520, r: -1.5 });
    S.piece(bot, { at: 2.6, from: "bottom", dist: 420, r: 1.5 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1401 });
    T(cl, "las matemáticas", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "hablando de sí mismas", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      chips.forEach((c, i) => { const q = seg(t, 1.2 + i * .1, 1.5 + i * .1);
        c.style.opacity = (.35 + .65 * q).toFixed(2); });
      nums.forEach((n, i) => n.style.opacity = seg(t, 1.5 + i * .1, 1.8 + i * .1).toFixed(2));
      arrow.set(seg(t, 2.4, 3.0));
      const q = seg(t, 3.0, 4.4);
      num.textContent = q <= 0 ? "" : fmt(Math.round(lerp(1, 8623190, eo(q))));
    };
  } });

// 5 — la frase
DEF.push({ bg: "#D8341F", tr: "left",
  strip: { color: "#1B1B1B", word: "Trampa", wordColor: "#FFFDF5", cx: 540, cy: 600, size: 280, wx: -100, from: -1 },
  sub: { x: 50, y: 800, w: 980, h: 620 },
  label: { text: "AUTORREFERENCIA", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["Y escribió esta: «esta frase no se puede demostrar».", "Si fuera falsa, las matemáticas demostrarían una mentira."],
  build(S) {
    const g = S.sub;
    const card = E("g", {}, g);
    paper(card, 110, 900, 860, 320, { seed: 1511, fill: "#FFFDF5" });
    T(card, "«Esta frase no se", 540, 1020, { f: SERIF, s: 70, i: 1, a: "middle" });
    T(card, "puede demostrar»", 540, 1110, { f: SERIF, s: 70, i: 1, a: "middle" });
    pix(card, "G", 540, 1160, 4, "#777", "middle");
    const loop = [];
    for (let i = 0; i < 2; i++) loop.push(harrow(g, i ? 880 : 200, i ? 1020 : 1070, i ? 880 : 200, i ? 1250 : 1250,
      { c: "#FFD23F", w: 9, bend: i ? .55 : -.55, hl: 30 }));
    const back = harrow(g, 880, 1258, 230, 1258, { c: "#FFD23F", w: 9, bend: .1, hl: 30 });
    S.piece(card, { at: .5, from: "bottom", dist: 560, r: -2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1501 });
    T(cl, "verdadera,", 540, 278, { f: SERIF, s: 56, i: 1, a: "middle" });
    T(cl, "pero indemostrable", 540, 352, { f: SERIF, s: 56, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      loop.forEach((l, i) => l.set(seg(t, 1.6 + i * .25, 2.3 + i * .25)));
      back.set(seg(t, 2.2, 3.0));
    };
  } });

// 6 — el muro: basta con multiplicar
DEF.push({ bg: "#6A3BDE", tr: "right",
  strip: { color: "#CFF75A", word: "Muro", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -160, from: 1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "BASTA MULTIPLICAR", x: 96, y: 1392, r: -4, px: 6 },
  cap: ["El muro no es de los sistemas complicados: le basta con que", "sepan multiplicar y puedan listar sus reglas."],
  build(S) {
    const g = S.sub;
    const wall = brickWall(g, 478, 846, 124, 560, 9, 61);
    const left = stampCard(g, 46, 900, 400, 430, "SOLO SUMAR", "completo", true, 1611);
    const right = stampCard(g, 634, 900, 400, 430, "Y MULTIPLICAR", "incompleto", false, 1621);
    S.piece(wall, { at: .6, from: "top", dist: 620, r: 0 });
    S.piece(left, { at: 1.4, from: "left", dist: 540, r: -2 });
    S.piece(right, { at: 2.0, from: "right", dist: 540, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1601 });
    T(cl, "no es cuestión", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "de complejidad", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return () => {};
  } });

// 7 — Penrose
DEF.push({ bg: "#E2641A", tr: "left",
  strip: { color: "#FFFDF5", word: "Penrose", wordColor: INK, cx: 540, cy: 600, size: 250, wx: -70, maxW: 940, from: -1 },
  sub: { x: 40, y: 800, w: 1000, h: 620 },
  label: { text: "MICROTUBULOS", x: 486, y: 1392, r: -4 },
  cap: ["Penrose lleva desde 1989 diciendo que nosotros vemos esa verdad desde fuera,", "y que por eso ninguna máquina de reglas nos igualará."],
  build(S) {
    const g = S.sub;
    const fg = E("g", {}, g);
    face(E("g", { transform: "translate(50 856) scale(1.3)" }, fg), 0, 0, { ...PENROSE, name: "PENROSE", top: "OXFORD" });
    const box = E("g", {}, g);
    E("rect", { x: 560, y: 1040, width: 400, height: 290, rx: 14, fill: "none", stroke: "#1B1B1B", "stroke-width": 9, "stroke-dasharray": "22 16" }, box);
    pix(box, "SISTEMA DE REGLAS", 760, 1282, 3, "#1B1B1B", "middle");
    const man = E("g", {}, g);
    const limb = "M800 1006 l0 108 M800 1030 l-54 46 M800 1030 l56 -44 M800 1114 l-40 72 M800 1114 l44 68";
    E("path", { d: limb, ...stroke("#FFFDF5", 15) }, man);
    E("path", { d: limb, ...stroke("#1B1B1B", 5) }, man);
    E("circle", { cx: 800, cy: 966, r: 36, fill: "#FFFDF5", stroke: "#1B1B1B", "stroke-width": 6 }, man);
    S.piece(fg, { at: .5, from: "bottom", dist: 700, r: -3 });
    S.piece(box, { at: 1.6, from: "right", dist: 520, r: 2 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1701 });
    T(cl, "su tesis:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "nos salimos del sistema", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      man.setAttribute("transform", `translate(0 ${(Math.sin(t * 1.4) * 8 - eo(seg(t, 2.8, 3.8)) * 26).toFixed(1)})`);
    };
  } });

// 8 — el mismo muro para los dos
DEF.push({ bg: "#13304F", tr: "right",
  strip: { color: "#FFD23F", word: "Iguales", wordColor: INK, cx: 540, cy: 600, size: 290, wx: -130, from: 1 },
  sub: { x: 40, y: 790, w: 1000, h: 640 },
  label: { text: "MISMO MURO", x: 96, y: 1392, r: -4 },
  cap: ["Pero ese salto exige saber que uno nunca se contradice:", "justo lo que Gödel demostró que no se puede demostrar."],
  build(S) {
    const g = S.sub;
    const mk = (x, kind, seed) => {
      const k = E("g", {}, g);
      paper(k, x, 900, 340, 340, { seed, fill: "#FFFDF5" });
      if (kind === "brain") {
        E("path", { d: `M${x + 86} ${1090} C${x + 56} ${1050} ${x + 70} ${996} ${x + 112} ${990} C${x + 126} ${956} ${x + 180} ${950} ${x + 198} ${978} C${x + 244} ${966} ${x + 276} ${1004} ${x + 262} ${1044} C${x + 276} ${1084} ${x + 240} ${1118} ${x + 196} ${1110} C${x + 166} ${1136} ${x + 108} ${1126} ${x + 86} ${1090} Z`, fill: "#F0A3A3", stroke: "#8A3B4B", "stroke-width": 6 }, k);
        for (let i = 0; i < 4; i++) E("path", { d: `M${x + 106 + i * 36} ${1012 + (i % 2) * 18} C${x + 126 + i * 36} ${1046} ${x + 108 + i * 36} ${1066} ${x + 128 + i * 36} ${1092}`, ...stroke("#C96D7E", 5) }, k);
      } else {
        E("rect", { x: x + 108, y: 982, width: 124, height: 124, rx: 10, fill: "#2B3038", stroke: "#11151A", "stroke-width": 5 }, k);
        E("rect", { x: x + 132, y: 1006, width: 76, height: 76, rx: 6, fill: "#5CE1FF", opacity: .85 }, k);
        for (const [dx, dy, n] of [[0, -1, 5], [0, 1, 5], [-1, 0, 5], [1, 0, 5]])
          for (let i = 0; i < n; i++) {
            const px0 = x + 108 + (dx ? (dx > 0 ? 124 : 0) : 22 + i * 20), py0 = 982 + (dy ? (dy > 0 ? 124 : 0) : 22 + i * 20);
            E("line", { x1: px0, y1: py0, x2: px0 + dx * 24, y2: py0 + dy * 24, ...stroke("#2B3038", 6) }, k);
          }
      }
      pix(k, kind === "brain" ? "NOSOTROS" : "LA MAQUINA", x + 170, 1170, 4, INK, "middle");
      return k;
    };
    const a = mk(90, "brain", 1811), b = mk(570, "chip", 1821);
    const ring = hcircle(g, 540, 1070, 490, 230, { seed: 9, c: RED, w: 11 });
    const tag = E("g", {}, g);
    paper(tag, 360, 1268, 500, 112, { seed: 1831, fill: INK });
    T(tag, "el mismo límite", 610, 1342, { f: SERIF, s: 52, i: 1, a: "middle", c: "#FFD23F" });
    S.piece(a, { at: .6, from: "left", dist: 520, r: -2 });
    S.piece(b, { at: 1.1, from: "right", dist: 520, r: 2 });
    S.piece(tag, { at: 3.6, from: "bottom", dist: 300, r: -1 });
    const cl = S.layer("front", 80, 150, 920, 330);
    paper(cl, 100, 172, 880, 280, { seed: 1801 });
    T(cl, "la objeción:", 540, 278, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "¿y si nos contradecimos?", 540, 352, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => { ring.set(seg(t, 2.2, 3.4)); };
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
      ["Gödel, 1931", "«Sobre proposiciones formalmente indecidibles», Monatshefte"],
      ["Königsberg, 7 sept. 1930", "Lo anunció de pasada; solo von Neumann reaccionó"],
      ["Hilbert, 8 sept. 1930", "«Wir müssen wissen, wir werden wissen», por la radio"],
      ["El alcance real", "Sistemas consistentes, con axiomas listables, que sepan multiplicar"],
      ["Presburger, 1929 · Tarski", "Solo con suma, la aritmética sí es completa y decidible"],
      ["Church y Turing, 1936", "El mismo muro en el cómputo: no hay método para todo"],
      ["Penrose, 1989 y 1994", "La idea ya era de J. R. Lucas, 1961. Orch-OR: sin confirmar"],
      ["Putnam, Chalmers, Feferman", "El salto exige saberse consistente, y además nos equivocamos"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 27, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
