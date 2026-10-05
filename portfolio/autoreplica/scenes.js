// «La máquina que se copia a sí misma»: scenes (inserted into the paper-collage engine by build.py)
const DEF = [];

// a boxy cut-out machine with a screen face and a claw
function machine(g, cx, cy, s = 1, o = {}) {
  const m = E("g", { transform: `translate(${cx} ${cy}) scale(${s})` }, g), body = o.body || "#D9DEE6", dark = o.dark || "#6B747F";
  E("rect", { x: -96, y: 60, width: 192, height: 26, rx: 8, fill: dark }, m);
  E("rect", { x: -84, y: -70, width: 168, height: 134, rx: 16, fill: body, stroke: dark, "stroke-width": 5 }, m);
  E("rect", { x: -58, y: -46, width: 116, height: 70, rx: 10, fill: "#13202E" }, m);
  const eyes = E("g", {}, m);
  for (const x of [-24, 24]) E("circle", { cx: x, cy: -12, r: 11, fill: o.eye || "#5CE1FF" }, eyes);
  E("path", { d: "M-20 10 Q0 22 20 10", ...stroke(o.eye || "#5CE1FF", 5) }, m);
  E("rect", { x: -70, y: 34, width: 140, height: 16, rx: 8, fill: dark, opacity: .5 }, m);
  E("rect", { x: -60, y: -58, width: 46, height: 10, rx: 5, fill: "#fff", opacity: .55 }, m);
  E("line", { x1: 0, y1: -70, x2: 0, y2: -104, ...stroke(dark, 6) }, m);
  E("circle", { cx: 0, cy: -112, r: 12, fill: RED }, m);
  for (const sx of [-1, 1]) {
    E("path", { d: `M${sx * 84} -30 L${sx * 128} -8 L${sx * 120} 34`, ...stroke(dark, 11) }, m);
    E("path", { d: `M${sx * 120} 34 l${sx * 20} -12 M${sx * 120} 34 l${sx * 4} 24`, ...stroke(dark, 9) }, m);
  }
  return { m, eyes };
}
function sheetCard(g, x, y, w, h, seed, fill) { return paper(g, x, y, w, h, { seed, fill: fill || "url(#gPaper)" }); }
function paperclip(g, cx, cy, s, rot, col) {
  const p = E("g", { transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${s})` }, g);
  E("path", { d: "M-14 -34 L-14 26 a14 14 0 0 0 28 0 L14 -24 a9 9 0 0 0 -18 0 L-4 20", ...stroke(col || "#8d95a0", 9) }, p);
  E("path", { d: "M-14 -34 L-14 -20", ...stroke("#fff", 4), opacity: .7 }, p);
  return p;
}
function starfield(g, x, y, w, h, seed, n = 90) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) { const sx = x + r() * w, sy = y + r() * h, rr = .8 + r() * 2.6;
    out.push({ el: E("circle", { cx: sx, cy: sy, r: rr, fill: "#fff", opacity: .3 + r() * .7 }), p: r() * 6.3, rr }); }
  out.forEach(o => g.appendChild(o.el));
  return out;
}

// 1 — se duplican
DEF.push({ bg: "#F6B400", tr: "left",
  strip: { color: "#FFFDF5", word: "2→4→8", wordColor: INK, cx: 540, cy: 620, size: 260, maxW: 840, wx: -110, from: -1 },
  sub: { x: 90, y: 790, w: 900, h: 620 },
  label: { text: "SE COPIAN", x: 96, y: 1392, r: -4 },
  cap: ["Una máquina capaz de copiarse a sí misma no crece:", "se duplica, y eso cambia todas las cuentas."],
  build(S) {
    const g = S.sub, gens = [[[540, 1000, 1]], [[380, 1000, .72], [700, 1000, .72]], [[260, 1230, .46], [460, 1230, .46], [620, 1230, .46], [820, 1230, .46]]];
    const machines = gens.map((row, k) => row.map(([x, y, s]) => ({ ...machine(g, x, y, s), x, y, s, k })));
    const links = [];
    for (const [x0, y0, x1, y1] of [[540, 1070, 380, 946], [540, 1070, 700, 946], [380, 1070, 260, 1176], [380, 1070, 460, 1176], [700, 1070, 620, 1176], [700, 1070, 820, 1176]])
      links.push(drawable(E("path", { d: `M${x0} ${y0} Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + 20} ${x1} ${y1}`, ...stroke(INK, 5) }, g)));
    const cl = S.layer("front", 90, 150, 900, 320);
    sheetCard(cl, 110, 172, 860, 270, 601);
    const num = T(cl, "1", 300, 370, { s: 150, w: 900, c: RED, a: "middle", ls: -4 });
    T(cl, "copias tras", 560, 300, { f: SERIF, s: 48, i: 1 });
    const gen = T(cl, "una ronda", 560, 360, { f: SERIF, s: 48, i: 1 });
    pix(cl, "CRECIMIENTO EXPONENCIAL", 540, 412, 4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      machines.flat().forEach((o, i) => { const at = o.k === 0 ? .7 : o.k === 1 ? 2.2 + (i % 2) * .2 : 3.6 + (i % 4) * .14, p = eb(seg(t, at, at + .35));
        o.m.setAttribute("transform", `translate(${o.x} ${(o.y + Math.sin(t * 1.6 + i) * 5).toFixed(1)}) scale(${(o.s * p).toFixed(3)})`);
        o.m.style.opacity = p > 0 ? 1 : 0;
        o.eyes.setAttribute("opacity", ((t + i * .3) % 2.8) > 2.62 ? .15 : 1); });
      links.forEach((l, i) => l.set(eo(seg(t, i < 2 ? 1.9 + i * .15 : 3.3 + (i - 2) * .12, (i < 2 ? 1.9 + i * .15 : 3.3 + (i - 2) * .12) + .4))));
      const steps = [[0, "1", "una ronda"], [2.3, "2", "una ronda"], [3.7, "4", "dos rondas"], [5.0, "8", "tres rondas"], [5.9, "16", "cuatro rondas"], [6.6, "32", "cinco rondas"]];
      let cur = steps[0]; for (const st of steps) if (t >= st[0]) cur = st;
      num.textContent = cur[1]; gen.textContent = cur[2];
    };
  } });

// 2 — von Neumann
DEF.push({ bg: "#2443D6", tr: "up",
  strip: { color: "#FFD23F", word: "1948", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -190, from: 1 },
  sub: { x: 90, y: 780, w: 900, h: 640 },
  label: { text: "AUTOMATAS", x: 640, y: 790, r: -4, at: 1.2 },
  cap: ["John von Neumann demostró en los años 40", "que una máquina puede construir una copia completa de sí misma."],
  build(S) {
    const g = S.sub;
    // cellular automaton grid that copies a glider-like block
    const x0 = 150, y0 = 830, c = 44, N = 12, M = 10;
    sheetCard(g, x0 - 24, y0 - 24, N * c + 48, M * c + 48, 611);
    for (let i = 0; i <= N; i++) E("line", { x1: x0 + i * c, y1: y0, x2: x0 + i * c, y2: y0 + M * c, stroke: "#CFC6AE", "stroke-width": 2 }, g);
    for (let j = 0; j <= M; j++) E("line", { x1: x0, y1: y0 + j * c, x2: x0 + N * c, y2: y0 + j * c, stroke: "#CFC6AE", "stroke-width": 2 }, g);
    const shape = [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [0, 3], [2, 3], [1, 4]];
    const mk = (ox, oy, col) => shape.map(([a, b]) => E("rect", { x: x0 + (ox + a) * c + 3, y: y0 + (oy + b) * c + 3, width: c - 6, height: c - 6, rx: 4, fill: col, opacity: 0 }, g));
    const orig = mk(1, 2, BLUE), copy = mk(8, 2, RED);
    const ar = harrow(g, x0 + 4.2 * c, y0 + 4.5 * c, x0 + 7.6 * c, y0 + 4.5 * c, { bend: -.22, w: 7, hl: 26 });
    const tape = E("g", {}, g);
    sheetCard(tape, 160, 1300, 760, 96, 621);
    const code = T(tape, "", 540, 1364, { f: MONO, s: 33, w: 700, c: "#333", a: "middle" });
    const pl = S.layer("front", 660, 140, 340, 420);
    portrait(pl, 690, 160, { seed: 631, name: "VON NEUMANN", hair: "receding", hairC: "#2c2c2c", suit: "#2a3550", tie: "#9a2b2b", halo: "#FFD23F", smile: 50 });
    S.piece(pl, { at: 1.0, from: "right", r: 5 });
    const nl = S.layer("front", 70, 190, 560, 320);
    sheetCard(nl, 90, 212, 520, 250, 641);
    T(nl, "constructor", 350, 318, { f: SERIF, s: 60, i: 1, a: "middle" });
    T(nl, "universal", 350, 388, { f: SERIF, s: 60, i: 1, a: "middle", c: RED });
    pix(nl, "TEORIA, 1966", 350, 426, 4, "#666", "middle");
    S.piece(nl, { at: 2.8, from: "left", r: -3 });
    const txt = "LEE SU PLANO > CONSTRUYE > COPIA EL PLANO";
    return (t) => {
      orig.forEach((r, i) => r.setAttribute("opacity", seg(t, 1.0 + i * .1, 1.25 + i * .1)));
      code.textContent = txt.slice(0, Math.floor(seg(t, 2.0, 4.4) * txt.length));
      ar.set(eo(seg(t, 4.2, 4.9)));
      copy.forEach((r, i) => { const p = eb(seg(t, 4.8 + i * .1, 5.1 + i * .1));
        r.setAttribute("opacity", p > 0 ? 1 : 0); r.setAttribute("transform", `translate(0 ${((1 - p) * -30).toFixed(1)})`); });
    };
  } });

// 3 — la fábrica lunar
DEF.push({ bg: "#10A36A", tr: "right",
  strip: { color: "#FFFDF5", word: "Luna", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -180, from: -1 },
  sub: { x: 70, y: 800, w: 940, h: 600 },
  label: { text: "NASA 1980", x: 96, y: 1392, r: -4 },
  cap: ["En 1980 la NASA estudió en serio", "una fábrica lunar que se replicara usando los materiales del lugar."],
  build(S) {
    const g = S.sub;
    E("path", { d: "M90 1300 Q300 1210 540 1256 Q780 1300 990 1240 L990 1400 L90 1400 Z", fill: "#C9C3B4", stroke: "#9C958A", "stroke-width": 5 }, g);
    const cr = rng(37);
    for (let i = 0; i < 9; i++) { const x = 120 + cr() * 840, y = 1280 + cr() * 90;
      E("ellipse", { cx: x, cy: y, rx: 20 + cr() * 34, ry: 9 + cr() * 12, fill: "#B3AC9E", stroke: "#9C958A", "stroke-width": 3 }, g); }
    const factories = [[330, 1210, 1], [760, 1232, .78]].map(([x, y, s], k) => {
      const f = E("g", { transform: `translate(${x} ${y}) scale(${s})` }, g);
      E("rect", { x: -130, y: -110, width: 260, height: 110, rx: 10, fill: "#E3E7EC", stroke: "#78818C", "stroke-width": 5 }, f);
      E("path", { d: "M-130 -110 L0 -176 L130 -110 Z", fill: "#AEB7C2", stroke: "#78818C", "stroke-width": 5, "stroke-linejoin": "round" }, f);
      E("rect", { x: -100, y: -84, width: 60, height: 52, rx: 6, fill: "#5CE1FF", opacity: .85 }, f);
      E("rect", { x: -16, y: -84, width: 60, height: 52, rx: 6, fill: "#5CE1FF", opacity: .85 }, f);
      E("rect", { x: 62, y: -70, width: 48, height: 70, rx: 6, fill: "#78818C" }, f);
      E("rect", { x: -148, y: -4, width: 296, height: 16, rx: 6, fill: "#78818C" }, f);
      const pan = E("g", {}, f);
      for (const sx of [-1, 1]) { E("rect", { x: sx > 0 ? 150 : -234, y: -90, width: 84, height: 54, rx: 4, fill: "#2A4A86", stroke: "#16305C", "stroke-width": 4 }, pan);
        for (let i = 1; i < 3; i++) E("line", { x1: (sx > 0 ? 150 : -234) + i * 28, y1: -90, x2: (sx > 0 ? 150 : -234) + i * 28, y2: -36, stroke: "#16305C", "stroke-width": 3 }, pan);
        E("line", { x1: sx * 140, y1: -40, x2: sx * (sx > 0 ? 150 : 234) * (sx > 0 ? 1 : -1), y2: -62, ...stroke("#78818C", 6) }, pan); }
      E("path", { d: "M-120 -100 L-120 -40", ...stroke("#fff", 10), opacity: .6 }, f);
      return { f, x, y, s, k };
    });
    const ar = harrow(g, 470, 1130, 660, 1150, { bend: -.3, w: 8, hl: 28 });
    const regolith = [];
    for (let i = 0; i < 9; i++) regolith.push(E("circle", { r: 9, fill: "#9C958A", opacity: 0 }, g));
    const cl = S.layer("front", 80, 150, 920, 330);
    sheetCard(cl, 100, 172, 880, 280, 651);
    T(cl, "una fábrica que", 540, 268, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "fabrica otra fábrica", 540, 340, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    pix(cl, "ESTUDIO NASA CP-2255", 540, 394, 4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      const p = eb(seg(t, 3.4, 4.0));
      factories[1].f.setAttribute("transform", `translate(760 ${(1232 + Math.sin(t * 1.4) * 4).toFixed(1)}) scale(${(.78 * p).toFixed(3)})`);
      factories[1].f.style.opacity = p > 0 ? 1 : 0;
      factories[0].f.setAttribute("transform", `translate(330 ${(1210 + Math.sin(t * 1.2) * 4).toFixed(1)}) scale(1)`);
      ar.set(eo(seg(t, 2.8, 3.5)));
      regolith.forEach((c, i) => { const f = ((t * .6 + i * .11) % 1);
        c.setAttribute("cx", lerp(200, 320, f) + Math.sin(i) * 20); c.setAttribute("cy", 1290 - Math.sin(f * Math.PI) * 120);
        c.setAttribute("opacity", t > 1.6 ? (f < .95 ? .9 : 0) : 0); });
    };
  } });

// 4 — los clips
DEF.push({ bg: "#E8402A", tr: "up",
  strip: { color: "#FFFDF5", word: "Clips", wordColor: INK, cx: 540, cy: 600, size: 300, wx: -170, from: 1 },
  sub: { x: 70, y: 800, w: 940, h: 600 },
  label: { text: "AÑO 2003", x: 96, y: 1392, r: -4 },
  cap: ["El riesgo no es una máquina malvada: es una obediente.", "Una IA que solo quiera hacer clips convertiría todo en clips."],
  build(S) {
    const g = S.sub, r = rng(41), clips = [];
    // a growing mound of paperclips
    for (let i = 0; i < 70; i++) { const u = r(), x = 540 + (r() - .5) * 760 * (1 - u * .55), y = 1360 - u * 330 + (r() - .5) * 26;
      clips.push({ el: paperclip(g, x, y, .9 + r() * .5, (r() - .5) * 220, ["#8d95a0", "#b9c0c9", "#6f7883", "#FFD23F"][Math.floor(r() * 4)]), x, y, i }); }
    // a small city at the side, shrinking as the mound grows
    const city = E("g", {}, g);
    const bld = [[120, 1250, 70, 120], [200, 1210, 56, 160], [266, 1270, 64, 100]];
    bld.forEach(([x, y, w, h], k) => { E("rect", { x, y, width: w, height: h, fill: "#FFFDF5", stroke: INK, "stroke-width": 4 }, city);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) E("rect", { x: x + 10 + j * (w / 3 - 4), y: y + 14 + i * (h / 4 - 6), width: 12, height: 14, fill: "#8FB6D9" }, city); });
    const dust = [];
    for (let i = 0; i < 10; i++) dust.push(E("circle", { r: 7 + r() * 8, fill: "#C9C1AE", opacity: 0 }, g));
    const cl = S.layer("front", 80, 150, 920, 340);
    sheetCard(cl, 100, 172, 880, 290, 661);
    T(cl, "«haz clips»", 540, 280, { f: SERIF, s: 72, i: 1, a: "middle" });
    T(cl, "no es una orden inocente", 540, 356, { f: SERIF, s: 42, i: 1, a: "middle", c: RED });
    pix(cl, "EXPERIMENTO MENTAL, NO PREDICCION", 540, 410, 3.4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      clips.forEach((c, i) => { const p = eb(seg(t, .8 + i * .055, 1.1 + i * .055));
        c.el.setAttribute("transform", `translate(${c.x} ${(c.y + (1 - p) * -420 + Math.sin(t * 2 + i) * 2).toFixed(1)}) rotate(${((i * 37) % 220 - 110 + Math.sin(t + i) * 3).toFixed(1)}) scale(${(0.9 + (i % 5) * .1).toFixed(2)})`);
        c.el.style.opacity = p > 0 ? 1 : 0; });
      const eat = eo(seg(t, 4.4, 5.6));
      city.setAttribute("transform", `translate(${(eat * 40).toFixed(1)} ${(eat * 120).toFixed(1)}) scale(${(1 - eat * .55).toFixed(3)})`);
      city.style.opacity = (1 - eat * .85).toFixed(2);
      dust.forEach((d, i) => { const f = ((t - 4.4 + i * .14) % 1.2) / 1.2;
        d.setAttribute("cx", 200 + i * 18 + f * 40); d.setAttribute("cy", 1290 - f * 90);
        d.setAttribute("opacity", t > 4.4 && f < .9 ? (.6 * (1 - f)).toFixed(2) : 0); });
    };
  } });

// 5 — convergencia instrumental
DEF.push({ bg: "#6A3BDE", tr: "left",
  strip: { color: "#CFF75A", word: "Objetivos", wordColor: INK, cx: 540, cy: 560, size: 260, maxW: 830, wx: -140, from: -1 },
  sub: { x: 300, y: 700, w: 480, h: 420, at: .5 },
  label: { text: "CONVERGENCIA", x: 470, y: 1010, r: -4, at: 2.3 },
  cap: ["Casi cualquier objetivo lleva a las mismas metas intermedias:", "más recursos, más energía, que nadie te apague."],
  build(S) {
    const g = S.sub, bot = machine(g, 540, 940, 1.15, { eye: "#CFF75A" });
    const goals = ["haz clips", "resuelve un problema", "gana una partida"];
    const gl = S.layer("front", 90, 160, 900, 300);
    sheetCard(gl, 110, 180, 860, 240, 671);
    const goal = T(gl, "", 540, 320, { f: SERIF, s: 62, i: 1, a: "middle" });
    pix(gl, "CUALQUIER OBJETIVO", 540, 212, 4, "#666", "middle");
    S.piece(gl, { at: .9, from: "top", r: -2 });
    const steps = ["más recursos", "más energía", "que nadie me apague"];
    const rows = steps.map((s, i) => {
      const y = 1130 + i * 108, lg = S.layer("front", 110, y, 880, 100);
      sheetCard(lg, 130, y + 8, 840, 78, 681 + i, i === 2 ? "#FFE14D" : "url(#gPaper)");
      E("rect", { x: 152, y: y + 24, width: 46, height: 46, fill: INK }, lg);
      pix(lg, String(i + 1), 175, y + 38, 4, "#fff", "middle");
      T(lg, s, 218, y + 60, { f: SERIF, s: 50, i: 1, c: i === 2 ? RED : INK });
      S.piece(lg, { at: 2.6 + i * .5, from: "left", dist: 1100, r: i % 2 ? 1.5 : -1.5 });
      return lg;
    });
    return (t) => {
      const k = Math.min(goals.length - 1, Math.floor(seg(t, .9, 4.4) * goals.length));
      goal.textContent = goals[k];
      bot.m.setAttribute("transform", `translate(540 ${(940 + Math.sin(t * 1.5) * 8).toFixed(1)}) rotate(${(Math.sin(t * .9) * 2).toFixed(2)}) scale(1.15)`);
      bot.eyes.setAttribute("opacity", (t % 3.1) > 2.92 ? .15 : 1);
    };
  } });

// 6 — Fermi
DEF.push({ bg: "#0E9AA7", tr: "right",
  strip: { color: "#FFE14D", word: "¿Y ellos?", wordColor: INK, cx: 540, cy: 560, size: 270, maxW: 830, wx: -110, from: 1 },
  sub: { x: 70, y: 760, w: 940, h: 660 },
  label: { text: "FERMI", x: 96, y: 1392, r: -4 },
  cap: ["Si copiarse es tan fácil, la galaxia debería estar llena de sondas.", "No vemos ninguna."],
  build(S) {
    const g = S.sub;
    const sky = E("g", {}, g);
    E("path", { d: torn(110, 800, 860, 560, 691, 3, 26), fill: "#101A3A" }, sky);
    const clip = E("clipPath", { id: "skyClip" }, g); E("path", { d: torn(110, 800, 860, 560, 691, 3, 26) }, clip);
    const inner = E("g", { "clip-path": "url(#skyClip)" }, sky);
    const stars = starfield(inner, 110, 800, 860, 560, 701, 120);
    E("ellipse", { cx: 540, cy: 1080, rx: 420, ry: 90, fill: "#3B2E6E", opacity: .55, transform: "rotate(-14 540 1080)" }, inner);
    const probe = E("g", {}, inner);
    E("ellipse", { cx: 0, cy: 0, rx: 46, ry: 26, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 4 }, probe);
    E("path", { d: "M-46 0 q-36 -34 -66 -10 q30 32 66 10 Z", fill: "#AEB7C2", stroke: "#6B747F", "stroke-width": 4 }, probe);
    E("rect", { x: 40, y: -8, width: 54, height: 16, rx: 6, fill: "#6B747F" }, probe);
    E("circle", { cx: -14, cy: -8, r: 9, fill: "#5CE1FF" }, probe);
    const q = T(inner, "?", 540, 1180, { f: SERIF, s: 320, i: 1, c: "#fff", a: "middle", opacity: 0 });
    const sweep = E("circle", { cx: 540, cy: 1080, r: 0, fill: "none", stroke: "#5CE1FF", "stroke-width": 5, opacity: 0 }, inner);
    const cl = S.layer("front", 90, 160, 900, 300);
    sheetCard(cl, 110, 180, 860, 250, 711);
    T(cl, "si una sola se copia,", 540, 280, { f: SERIF, s: 48, i: 1, a: "middle" });
    T(cl, "la galaxia se llena", 540, 348, { f: SERIF, s: 48, i: 1, a: "middle", c: RED });
    pix(cl, "Y SIN EMBARGO, SILENCIO", 540, 400, 4, "#666", "middle");
    S.piece(cl, { at: 1.0, from: "top", r: -2 });
    return (t) => {
      stars.forEach((o, i) => o.el.setAttribute("opacity", (.35 + .5 * Math.abs(Math.sin(t * 1.4 + o.p))).toFixed(2)));
      const fly = eio(seg(t, 1.0, 4.4));
      probe.setAttribute("transform", `translate(${lerp(200, 880, fly).toFixed(1)} ${(1020 + Math.sin(t * 1.1) * 26).toFixed(1)}) rotate(${(Math.sin(t) * 5).toFixed(1)})`);
      probe.style.opacity = (1 - seg(t, 4.2, 4.7)).toFixed(2);
      const k = ((Math.max(0, t - 1.4)) % 1.8) / 1.8;
      sweep.setAttribute("r", (k * 300).toFixed(1)); sweep.setAttribute("opacity", t > 1.4 ? ((1 - k) * .5).toFixed(2) : 0);
      q.setAttribute("opacity", eb(seg(t, 4.8, 5.4)).toFixed(2));
      q.setAttribute("font-size", (320 * (.6 + .4 * eb(seg(t, 4.8, 5.4)))).toFixed(0));
    };
  } });

// 7 — Tipler y Sagan
DEF.push({ bg: "#FF7A1A", tr: "up",
  strip: { color: "#141414", word: "Sagan", wordColor: "#FFFDF5", cx: 540, cy: 560, size: 290, wx: -160, from: -1 },
  sub: { x: 70, y: 760, w: 940, h: 660 },
  label: { text: "O NO LAS HACEN", x: 300, y: 782, r: -4, at: 1.4 },
  cap: ["Tipler dijo que ese silencio significa que no hay nadie;", "Sagan respondió que una civilización prudente no las construiría."],
  build(S) {
    const g = S.sub;
    const cards = [["TIPLER, 1981", ["no hay", "nadie ahí fuera"], "#FFFDF5", INK, 300, -4], ["SAGAN Y NEWMAN, 1983", ["nadie prudente", "las construiría"], "#FFE14D", RED, 300, 4]];
    const made = cards.map(([tag, lines, fill, col, w, rot], k) => {
      const x = k ? 560 : 100, cg = E("g", {}, g);
      paper(cg, x, 880, 420, 420, { seed: 721 + k, fill });
      E("rect", { x: x + 24, y: 906, width: pixW(tag, 3.4) + 20, height: 34, fill: INK }, cg);
      pix(cg, tag, x + 34, 914, 3.4, "#fff");
      lines.forEach((l, i) => T(cg, l, x + 210, 1060 + i * 64, { f: SERIF, s: 46, i: 1, a: "middle", c: col }));
      E("path", { d: `M${x + 120} ${1180} q90 24 180 0`, ...stroke(col, 5), opacity: .5 }, cg);
      return { cg, cx: x + 210, cy: 1090, rot };
    });
    const vs = E("g", {}, g);
    E("circle", { cx: 540, cy: 1090, r: 56, fill: INK }, vs);
    T(vs, "vs", 540, 1108, { s: 48, w: 900, c: "#fff", a: "middle" });
    const probes = [];
    for (let i = 0; i < 5; i++) { const pr = E("g", {}, g);
      E("ellipse", { cx: 0, cy: 0, rx: 26, ry: 15, fill: "#D9DEE6", stroke: "#6B747F", "stroke-width": 3 }, pr);
      E("path", { d: "M-26 0 q-20 -18 -36 -6 q16 18 36 6 Z", fill: "#AEB7C2", stroke: "#6B747F", "stroke-width": 3 }, pr);
      probes.push(pr); }
    const cross = probes.map((p, i) => drawable(E("path", { d: `M${180 + i * 170} 1348 l64 56 M${244 + i * 170} 1348 l-64 56`, ...stroke(RED, 8) }, g)));
    return (t) => {
      made.forEach((o, i) => { const p = eb(seg(t, .8 + i * .6, 1.2 + i * .6));
        o.cg.setAttribute("transform", `translate(${o.cx} ${o.cy}) rotate(${(o.rot + Math.sin(t * 1.1 + i) * .8).toFixed(2)}) scale(${p.toFixed(3)}) translate(${-o.cx} ${-o.cy})`);
        o.cg.style.opacity = p > 0 ? 1 : 0; });
      sxf(vs, 540, 1090, eb(seg(t, 2.1, 2.45)));
      probes.forEach((p, i) => { const q = eb(seg(t, 3.6 + i * .16, 3.9 + i * .16));
        p.setAttribute("transform", `translate(${212 + i * 170} ${(1376 + Math.sin(t * 2 + i) * 6).toFixed(1)}) scale(${q.toFixed(3)})`);
        p.style.opacity = q > 0 ? 1 : 0; });
      cross.forEach((c, i) => c.set(eo(seg(t, 4.9 + i * .14, 5.2 + i * .14))));
    };
  } });

// 8 — hoy: alineación
DEF.push({ bg: "#123C5A", tr: "left",
  strip: { color: "#FFE14D", word: "Hoy", wordColor: INK, cx: 540, cy: 580, size: 300, wx: -200, from: 1 },
  sub: { x: 90, y: 780, w: 900, h: 640 },
  label: { text: "ALINEACION", x: 96, y: 1392, r: -4 },
  cap: ["Hoy el debate volvió: cuanto más autónoma es una IA,", "más importa que sus objetivos y los nuestros coincidan."],
  build(S) {
    const g = S.sub;
    // code that writes itself, watched by an eye
    const scr = E("g", {}, g);
    E("rect", { x: 150, y: 1040, width: 780, height: 330, rx: 18, fill: "#0D1623", stroke: "#2E4458", "stroke-width": 5 }, scr);
    E("rect", { x: 150, y: 1040, width: 780, height: 46, rx: 18, fill: "#1B2C3E" }, scr);
    [["#FF5F57", 182], ["#FEBC2E", 208], ["#28C840", 234]].forEach(([c, x]) => E("circle", { cx: x, cy: 1063, r: 8, fill: c }, scr));
    const lines = ["def mejorar(self):", "  objetivo = leer()", "  if bloqueo: rodear()", "  return copia(self)"];
    const code = lines.map((_, i) => T(scr, "", 182, 1148 + i * 56, { f: MONO, s: 36, w: 700, c: ["#CFF75A", "#5CE1FF", "#FF9EC4", "#FFD23F"][i] }));
    const cursor = E("rect", { x: 182, y: 1120, width: 16, height: 36, fill: "#fff" }, scr);
    const eye = E("g", {}, g), ecx = 540, ecy = 900;
    E("path", { d: `M${ecx - 230} ${ecy} Q${ecx} ${ecy - 160} ${ecx + 230} ${ecy} Q${ecx} ${ecy + 160} ${ecx - 230} ${ecy} Z`, fill: "#FFFDF5", stroke: INK, "stroke-width": 8, "stroke-linejoin": "round" }, eye);
    const iris = E("g", {}, eye);
    E("circle", { cx: ecx, cy: ecy, r: 72, fill: "url(#gCool)", stroke: "#1d4e7a", "stroke-width": 5 }, iris);
    E("circle", { cx: ecx, cy: ecy, r: 34, fill: "#0e0e0e" }, iris);
    E("circle", { cx: ecx - 18, cy: ecy - 18, r: 12, fill: "#fff", opacity: .9 }, iris);
    const pl = S.layer("front", 70, 160, 320, 330);
    sheetCard(pl, 90, 180, 280, 240, 731);
    E("rect", { x: 160, y: 218, width: 40, height: 130, rx: 10, fill: INK }, pl);
    E("rect", { x: 230, y: 218, width: 40, height: 130, rx: 10, fill: INK }, pl);
    pix(pl, "PAUSA", 215, 372, 4, "#666", "middle");
    S.piece(pl, { at: 3.6, from: "left", r: -4 });
    const cl = S.layer("front", 420, 150, 600, 340);
    sheetCard(cl, 440, 172, 560, 290, 741);
    T(cl, "que sus metas", 720, 282, { f: SERIF, s: 54, i: 1, a: "middle" });
    T(cl, "y las nuestras", 720, 348, { f: SERIF, s: 54, i: 1, a: "middle" });
    const l3 = T(cl, "", 720, 414, { f: SERIF, s: 54, i: 1, a: "middle", c: RED });
    S.piece(cl, { at: 1.0, from: "right", r: 3 });
    return (t) => {
      let n = Math.floor(seg(t, 1.0, 4.6) * lines.reduce((a, s) => a + s.length, 0)), cy = 1148, cxp = 182;
      lines.forEach((s, i) => { const k = clamp(n, 0, s.length); n -= s.length; code[i].textContent = s.slice(0, k);
        if (k > 0) { cy = 1148 + i * 56; cxp = 182 + k * 20; } });
      cursor.setAttribute("x", cxp); cursor.setAttribute("y", cy - 30);
      cursor.setAttribute("opacity", (t * 3 % 1) > .5 ? .9 : .15);
      const lx = Math.sin(t * .8) * 44, ly = 18 + Math.sin(t * 1.3) * 10;
      iris.setAttribute("transform", `translate(${lx.toFixed(1)} ${ly.toFixed(1)})`);
      const b = (t % 3.4) > 3.2 ? .08 : 1;
      eye.setAttribute("transform", `translate(0 ${ecy}) scale(1 ${b}) translate(0 ${-ecy})`);
      l3.textContent = t > 5.0 ? "coincidan" : "";
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
    E("path", { d: torn(70, 545, 940, 1060, 771, 3, 26), fill: "url(#gPaper)" }, g);
    const items = [
      ["Von Neumann y Burks, 1966", "Theory of Self-Reproducing Automata"],
      ["NASA CP-2255, 1980", "Advanced Automation for Space Missions"],
      ["Bostrom, 2003", "Ethical Issues in Advanced Artificial Intelligence"],
      ["Omohundro, 2008", "The Basic AI Drives"],
      ["Tipler, 1981", "Extraterrestrial Intelligent Beings Do Not Exist"],
      ["Sagan y Newman, 1983", "The Solipsist Approach to Extraterrestrial Intelligence"],
      ["Wikipedia", "Self-replicating spacecraft · Instrumental convergence"],
      ["Nota", "Las escenas 4 y 5 son un experimento mental, no una predicción"]];
    const rows = items.map(([a, b], i) => { const rg = E("g", {}, g), y = 620 + i * 116;
      E("rect", { x: 104, y: y - 34, width: 40, height: 40, fill: INK }, rg);
      pix(rg, String(i + 1), 124, y - 27, 4, "#fff", "middle");
      T(rg, a, 162, y, { s: 33, w: 800 }); T(rg, b, 162, y + 44, { f: SERIF, s: 30, i: 1, w: 400, c: "#444" }); return rg; });
    const fl = S.layer("front", 40, 1640, 1000, 160);
    T(fl, "Ilustraciones, no imágenes reales. Voz y animación hechas con IA.", 540, 1690, { s: 29, w: 600, c: "#ddd", a: "middle" });
    S.piece(fl, { at: 2.6, from: "pop" });
    return (t) => rows.forEach((r, i) => { const q = eo(seg(t, .9 + i * .16, 1.3 + i * .16)); r.style.opacity = q; r.setAttribute("transform", `translate(${(1 - q) * 60} 0)`); });
  } });
