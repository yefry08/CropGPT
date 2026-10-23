/* /social kit: lettering, captions, self-drawing line art with flat fills, props and palettes.
   Load after core.js:  <script src="timing.js"></script><script src="core.js"></script><script src="kit.js"></script>
   Then: setPalette('rainbow' | 'blue-red' | 'ink'), write scenes, call defineFilm (see film-16x9.html). */
const PALETTES_SOCIAL = {
  // white paper, six inks (the AI-safety short, the OpenAI–Hugging Face video)
  rainbow: { paper: '#ffffff', ink: '#1e1630', C: { blue: '#1f6fd1', pink: '#ff3d8b', yellow: '#ffc61a', green: '#16a86a', orange: '#ff7a1a', violet: '#7a4fd8', red: '#e5322d', grey: '#9aa3b5', lblue: '#e6eeff', lred: '#ffe8e7' },
             accents: ['blue', 'pink', 'yellow', 'green', 'orange', 'violet'] },
  // only blue and red on white (the Navier-Stokes video)
  'blue-red': { paper: '#ffffff', ink: '#16307a', C: { blue: '#1f4fd1', red: '#e5322d', lblue: '#e6eeff', lred: '#ffe8e7', navy: '#16307a', pink: '#e5322d', yellow: '#1f4fd1', green: '#1f4fd1', orange: '#e5322d', violet: '#1f4fd1', grey: '#9aa3b5' },
                accents: ['blue', 'red'] },
  // warm paper and dark ink with violet/red accents (the Palantir video, Santo Domingo)
  ink: { paper: '#f3e6cf', ink: '#1e1630', C: { blue: '#2b5fb8', pink: '#c8473f', yellow: '#e79256', green: '#2f7d5a', orange: '#e79256', violet: '#5b3fa8', red: '#c8473f', grey: '#8a7f6e', lblue: '#ece2f7', lred: '#f6dcd6' },
         accents: ['violet', 'red', 'blue'] },
  // "motion promo" register: pure black, light is the subject, neon spectrum cyan → violet → magenta
  neon: { paper: '#000000', ink: '#f2f6ff', C: { cyan: '#22e4ff', blue: '#3d7bff', violet: '#9b5cff', magenta: '#ff3dd1', pink: '#ff5fa2', orange: '#ff8a3d', yellow: '#ffd23d', green: '#3dffb0', red: '#ff3d5a', grey: '#6f7894', navy: '#0b1230',
          lblue: 'rgba(34,228,255,0.10)', lred: 'rgba(255,61,90,0.12)' }, accents: ['cyan', 'blue', 'violet', 'magenta', 'pink', 'orange'] },
};
let C = {}, RAINBOW = [];
function setPalette(name = 'rainbow') {
  const p = PALETTES_SOCIAL[name]; if (!p) throw new Error('unknown palette ' + name);
  usePalette(makePalette({ paper: p.paper, paperBand: null, ink: p.ink }, 'paperInk'));
  C = { ...p.C }; RAINBOW = p.accents.map(k => C[k]);
  FONT = name === 'neon' ? '"Liberation Sans", "DejaVu Sans", "Helvetica Neue", Arial, sans-serif' : '"Comic Neue", "Comic Sans MS", cursive';
}
let FONT = '"Comic Neue", "Comic Sans MS", cursive';   // setPalette('neon') switches to a clean sans
const D = id => window.SECTION_DURS[id];

// ---------- lettering ----------
function txt(c, s, x, y, o = {}) {
  const { size = 56, weight = 700, color = PAL.ink, align = 'center', prog = 1, rainbow = false, bg = false } = o;
  const n = Math.ceil(s.length * clamp(prog, 0, 1)); if (!n) return;
  c.save(); c.font = `${weight} ${size}px ${FONT}`; c.textBaseline = 'alphabetic';
  const w = c.measureText(s.slice(0, n)).width, x0 = align === 'center' ? x - c.measureText(s).width / 2 : align === 'right' ? x - w : x;
  if (bg) { c.fillStyle = PAL.paper; c.fillRect(x0 - 12, y - size * .95, (align === 'center' ? c.measureText(s).width : w) + 24, size * 1.25); }
  if (!rainbow) { c.textAlign = 'left'; c.fillStyle = color; c.fillText(s.slice(0, n), x0, y); c.restore(); return; }
  let cx = x0; c.textAlign = 'left';
  for (let i = 0; i < n; i++) { c.fillStyle = s[i] === ' ' ? PAL.ink : RAINBOW[i % RAINBOW.length]; c.fillText(s[i], cx, y); cx += c.measureText(s[i]).width; }
  c.restore();
}
const type = (tau, a, b) => sm(a, b, tau, x => x);
function caption(c, lines, tau, t0, dur = 1.8, t1 = Infinity, o = {}) {
  if (tau < t0 - .3 || tau > t1) return;
  const { size = H > W ? 58 : 50, y0 = H > W ? 1420 : 958 } = o, lh = size * 1.25, total = lines.reduce((a, l) => a + l.length, 0);
  resetT(c); const f = sm(t0 - .3, t0, tau) * (1 - sm(t1 - .3, t1, tau));
  c.save(); c.globalAlpha = .95 * f; c.fillStyle = PAL.paper; c.fillRect(0, y0 - size * 1.1, W, lh * lines.length + size * .5);
  c.globalAlpha = f; let acc = 0;
  lines.forEach((l, k) => { const a = acc / total, b = (acc + l.length) / total; acc += l.length;
    txt(c, l, CX, y0 + k * lh, { size, prog: sm(t0 + a * dur, t0 + b * dur, tau, x => x) }); });
  c.restore();
}

// ---------- line art with flat colour fills ----------
function drawArt(c, strokes, prog, seed, o = {}) {
  const { amp = 1.4, width = 3.4 } = o, L = strokes.map(s => pathLength(s.p, s.close)), tot = L.reduce((a, b) => a + b, 0) || 1;
  let acc = 0; c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  strokes.forEach((st, k) => {
    const a = acc / tot, b = (acc + L[k]) / tot; acc += L[k];
    const p = clamp((prog - a) / Math.max(1e-6, b - a), 0, 1); if (p <= 0) return;
    if (st.fill && st.close) { const fp = sm(.75, 1, p); if (fp > 0) { c.save(); c.globalAlpha = .92 * fp; c.fillStyle = st.fill; c.beginPath();
      st.p.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.restore(); } }
    c.strokeStyle = st.col || PAL.ink; c.lineWidth = st.w || width;
    if (st.dash) c.setLineDash(st.dash); else c.setLineDash([]);
    if (p >= 1) wob(c, st.p, amp, seed + k, !!st.close, { pressure: .45 }); else selfDraw(c, st.p, p, seed + k, amp, !!st.close);
  });
  c.setLineDash([]); c.restore();
}
const S_ = (p, o = {}) => ({ p, ...o });
const box = (x, y, w, h, o) => S_(rectPts(x, y, w, h), { close: true, ...o });
const ln = (x0, y0, x1, y1, o) => S_([[x0, y0], [x1, y1]], o);
const circ = (x, y, r, o) => S_(ellPts(x, y, r, r, 0, 36), { close: true, ...o });
function arrow(x0, y0, x1, y1, o = {}) { const h = o.head ?? 24, a = Math.atan2(y1 - y0, x1 - x0);
  return S_([[x0, y0], [x1, y1], [x1 - h * Math.cos(a - .45), y1 - h * Math.sin(a - .45)], [x1, y1], [x1 - h * Math.cos(a + .45), y1 - h * Math.sin(a + .45)]], o); }
function push(c, tau, dur, z1 = 1.035) { cam(c, CX, CY, lerp(1, z1, sm(0, dur, tau, easeInOutSine))); }
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');   // 1.200 / 70.000 (Spanish grouping)
const fade = (tau, a, b) => sm(a - .4, a + .2, tau) * (1 - sm(b - .4, b + .2, tau));

// ---------- props ----------
// a small agent robot: head, antenna, two eyes; colour by index
function robot(x, y, s = 1, col = C.blue) { return [box(x - 34 * s, y - 28 * s, 68 * s, 56 * s, { fill: col, w: 3 }), ln(x, y - 28 * s, x, y - 48 * s, { w: 3 }), circ(x, y - 54 * s, 7 * s, { fill: C.yellow, w: 2.4 }),
  circ(x - 14 * s, y - 6 * s, 7 * s, { fill: '#ffffff', w: 2 }), circ(x + 14 * s, y - 6 * s, 7 * s, { fill: '#ffffff', w: 2 }), ln(x - 12 * s, y + 14 * s, x + 12 * s, y + 14 * s, { w: 2.6 })]; }
function server(x, y, col = C.grey, label) { const s = [box(x - 110, y - 150, 220, 300, { fill: '#f2f4f8', w: 4 })];
  for (let k = 0; k < 4; k++) { s.push(box(x - 90, y - 130 + k * 70, 180, 52, { fill: col, w: 2.6 }), circ(x + 62, y - 104 + k * 70, 7, { fill: C.green, w: 2 })); } return s; }
function cloud(x, y, col = C.blue) { const p = []; [[-110, 0, 60], [-50, -40, 70], [30, -50, 75], [100, -10, 60], [20, 30, 70], [-70, 35, 55]].forEach(([dx, dy, r]) => {
  for (let a = 0; a <= TAU; a += .3) p.push([x + dx + Math.cos(a) * r, y + dy + Math.sin(a) * r * .75]); });
  return [S_(ellPts(x, y, 175, 85, 0, 48), { close: true, fill: '#e8f1ff', w: 4, col })]; }
function cylinder(x, y, col) { return [box(x - 80, y - 60, 160, 140, { fill: col, w: 3.4 }), S_(ellPts(x, y - 60, 80, 24, 0, 30), { close: true, fill: '#ffffff', w: 3.4 }),
  S_(ellPts(x, y + 80, 80, 24, 0, 30).slice(0, 16), { w: 3.4 })]; }
function warn(x, y, s = 1) { return [S_([[x, y - 60 * s], [x + 66 * s, y + 52 * s], [x - 66 * s, y + 52 * s]], { close: true, fill: C.yellow, w: 4 }), ln(x, y - 22 * s, x, y + 16 * s, { w: 7 }), circ(x, y + 34 * s, 5 * s, { fill: PAL.ink, w: 2 })]; }
function check(x, y, col = C.green) { return [circ(x, y, 46, { fill: col, w: 3.4 }), S_([[x - 22, y], [x - 6, y + 18], [x + 24, y - 20]], { w: 7, col: '#ffffff' })]; }
function cross(x, y, col = C.red) { return [circ(x, y, 46, { fill: col, w: 3.4 }), ln(x - 18, y - 18, x + 18, y + 18, { w: 7, col: '#ffffff' }), ln(x + 18, y - 18, x - 18, y + 18, { w: 7, col: '#ffffff' })]; }
function bubble(x, y, w, h, col, tailLeft = true) { const t = tailLeft ? [[x + 40, y + h], [x + 20, y + h + 40], [x + 80, y + h]] : [[x + w - 80, y + h], [x + w - 20, y + h + 40], [x + w - 40, y + h]];
  return [S_([[x, y], [x + w, y], [x + w, y + h], ...(tailLeft ? [] : t), ...(tailLeft ? [[x + 80, y + h], [x + 20, y + h + 40], [x + 40, y + h]] : []), [x, y + h]], { close: true, fill: col, w: 3.4 })]; }


// ---------- layout helpers ----------
function card(c, x, y, w, h, fill, col, prog, seed) { drawArt(c, [box(x, y, w, h, { fill, w: 4, col })], prog, seed); }
function bullet(c, s, x, y, prog, col = PAL.ink, size = 42) { if (prog <= 0) return; c.save(); c.fillStyle = col; c.beginPath(); c.arc(x, y - size * .32, 9, 0, TAU); c.fill(); c.restore(); txt(c, s, x + 30, y, { size, weight: 400, align: 'left', prog }); }
// a spiral that tightens as it spins: fluids, "seeing stones", whirlpools
function vortex(c, x, y, r, tau, prog, col = C.red) { if (prog <= 0) return; const turns = 4 + tau * .8, pts = [];
  for (let a = 0; a < turns * TAU * prog; a += .08) { const rr = r * Math.exp(-a / (turns * 1.6)); pts.push([x + Math.cos(a + tau * 2) * rr, y + Math.sin(a + tau * 2) * rr]); }
  c.save(); c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); c.restore(); }
// a quiet score: plucks on a pentatonic scale, a low cue on each cut, a closing chord. order = scene ids.
function quietScore(order, tenseFrom = -1, tenseTo = -1) { return function (ac, t0, dest) {
  const m = ac.createGain(); m.gain.value = .5; m.connect(dest);
  const total = order.reduce((a, k) => a + D(k), 0); let at = 0; const starts = order.map(k => { const s = at; at += D(k); return s; });
  for (let t = .4; t < total - 2; t += 1) { const k = Math.round(t), tense = tenseFrom >= 0 && t >= starts[tenseFrom] && t < starts[tenseTo];
    note(ac, m, pentHz(tense ? 0 : 1, [0, 2, 4, 3, 1, 4, 2, 0][k % 8], tense ? 220 : 262), t0, t, 1.6, 'triangle', k % 4 ? .045 : .07); }
  starts.slice(1).forEach(t => note(ac, m, 131, t0, t, 2, 'sine', .14));
  [262, 330, 392].forEach(f => note(ac, m, f, t0, total - 6, 5, 'triangle', .06)); }; }
// film from an ordered list of [id, sceneFn]; durations come from timing.js
function socialFilm(ar, scenes, score) { const width = ar === '9:16' ? 1080 : 1920;
  defineFilm({ format: { ar, width }, fps: 24, score: score || quietScore(scenes.map(s => s[0])), timeline: scenes.map(([id, fn]) => ({ name: id, dur: D(id), fn })) }); }

// ---------- neon register (setPalette('neon')): glow, typing flash, rings, shockwaves, glass tiles ----------
// spectrum position 0..1 → cyan, blue, violet, magenta, orange (cool open → warm close)
function spectrum(f) { const K = ['#22e4ff', '#3d7bff', '#9b5cff', '#ff3dd1', '#ff8a3d'], x = clamp(f, 0, 1) * (K.length - 1), i = Math.min(K.length - 2, Math.floor(x)), t = x - i;
  const h = k => [1, 3, 5].map(j => parseInt(K[k].slice(j, j + 2), 16)), a = h(i), b = h(i + 1); return `rgb(${a.map((v, j) => Math.round(lerp(v, b[j], t))).join(',')})`; }
// typed line: characters appear in order; the newest one flashes in the accent colour and cools to white
function typeGlow(c, s, x, y, prog, o = {}) {
  const { size = 72, weight = 700, accent = C.cyan, color = PAL.ink, align = 'center', glow = 18 } = o;
  const n = Math.ceil(s.length * clamp(prog, 0, 1)); if (!n) return;
  c.save(); c.font = `${weight} ${size}px ${FONT}`; c.textBaseline = 'alphabetic';
  const full = c.measureText(s).width; let cx = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
  const frac = s.length * clamp(prog, 0, 1) - (n - 1);
  for (let i = 0; i < n; i++) { const last = i === n - 1 && prog < 1;
    c.shadowColor = last ? accent : color; c.shadowBlur = last ? glow * 2 : glow * .5; c.fillStyle = last && frac < .999 ? accent : color;
    c.fillText(s[i], cx, y); cx += c.measureText(s[i]).width; }
  c.restore();
}
// a glowing number/word that slams in (scale overshoot) with a bloom behind it
function slam(c, s, x, y, t, o = {}) { if (t <= 0) return; const { size = 180, color = C.magenta } = o, k = t < 1 ? 1 + .35 * Math.sin(Math.PI * t) * (1 - t) : 1;
  c.save(); c.translate(x, y); c.scale(k * Math.min(1, t * 3), k * Math.min(1, t * 3));
  const g = c.createRadialGradient(0, -size * .35, 0, 0, -size * .35, size * 1.6); g.addColorStop(0, color.startsWith('#') ? color + '55' : color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(-size * 2, -size * 2, size * 4, size * 3);
  c.font = `700 ${size}px ${FONT}`; c.textAlign = 'center'; c.shadowColor = color; c.shadowBlur = 40; c.fillStyle = '#ffffff'; c.fillText(s, 0, 0); c.restore(); }
// expanding ring(s): p 0..1 over its life
function ring(c, x, y, r0, r1, p, col = C.cyan, w = 4) { if (p <= 0 || p >= 1) return; c.save(); c.globalAlpha = (1 - p) * .9; c.strokeStyle = col; c.lineWidth = w * (1 - p * .6);
  c.shadowColor = col; c.shadowBlur = 24; c.beginPath(); c.arc(x, y, lerp(r0, r1, easeOut(p)), 0, TAU); c.stroke(); c.restore(); }
function shockwave(c, x, y, tau, t0, col = C.magenta) { for (let k = 0; k < 3; k++) ring(c, x, y, 20, 900, (tau - t0 - k * .18) / 1.4, col, 6 - k); }
// dark matte glass tile with a light edge and an inner glow; prog draws it in
function glassTile(c, x, y, w, h, col, prog, o = {}) { if (prog <= 0) return; const a = clamp(prog, 0, 1), r = o.r ?? 28;
  c.save(); c.globalAlpha = a; const path = new Path2D(); path.roundRect(x, y + (1 - a) * 30, w, h, r);
  const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0.02)');
  c.fillStyle = '#05070f'; c.fill(path); c.fillStyle = g; c.fill(path); c.shadowColor = col; c.shadowBlur = 30; c.strokeStyle = col; c.lineWidth = 2.5; c.stroke(path); c.restore(); }
// soft coloured light behind the subject
function bloom(c, x, y, r, col, a = .5) { if (a <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore(); }
function blackFrame(c) { resetT(c); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }

setPalette('rainbow');   // default; films call setPalette(...) again after loading the kit
