/* paper-collage kit (from ia-warhammer): paper-collage kit — kraft/coloured paper with grain, sunburst rays, cut-out props with a white
   paper border and drop shadow, label-tape headlines, torn caption strips, flip-number tiles, whip-pan cuts.
   Props are drawn shapes (no photos, no logos, no real people). Load after kit.js. */
const PA = { kraft: '#c99a5b', kraftD: '#a77a42', cream: '#efe4cc', paper: '#f6efdf', red: '#c8382e', redD: '#9e2a22', teal: '#1f4d55',
  navy: '#1b2433', sky: '#9cc7d3', ink: '#1d1a17', grey: '#8d877b', steel: '#6f7782', orange: '#e0702b', green: '#3c7d4f', yellow: '#f0c44c' };
const SANSB = '"Liberation Sans", Arial, sans-serif', SERIF = '"Liberation Serif", "DejaVu Serif", serif';

function makeClock(order) { const st = {}; let at = 0; order.forEach(k => { st[k] = at; at += D(k); }); return { st, total: at }; }
function beatOf(tau, d, fr) { let i = 0; while (i < fr.length && tau >= d * fr[i]) i++; return i; }
function since(tau, d, fr, i) { return tau - (i ? d * fr[i - 1] : 0); }
const pop = t => t <= 0 ? 0 : t >= 1 ? 1 : easeOutBack(clamp(t, 0, 1), 1.4);

// ---------- paper (each background is painted once into a layer and reused: grain is too slow per frame) ----------
const BG = {};
function cachedBg(c, key, paint) { if (!BG[key]) { const L = layer(), g = L.getContext('2d'); paint(g); BG[key] = L; } blit(c, BG[key]); }
function paperBg(c, base, seed = 1, o = {}) { cachedBg(c, `p${base}${seed}${o.band || ''}${o.bandY || ''}`, g => paperPaint(g, base, seed, o)); }
function paperPaint(c, base, seed, o) { resetT(c); c.fillStyle = base; c.fillRect(0, 0, W, H);
  grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 5000, '#000', .05, seed, 2); grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 3000, '#fff', .05, seed + 1, 2);
  const r = rng(seed + 7); c.save(); c.strokeStyle = 'rgba(60,40,20,.10)'; c.lineWidth = 1.2; for (let i = 0; i < 120; i++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 8 + r() * 26; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); } c.restore();
  if (o.band) { c.fillStyle = o.band; c.fillRect(0, o.bandY ?? H * .62, W, H); grain(c, rectPath(0, o.bandY ?? H * .62, W, H), [0, 0, W, H], 2500, '#000', .06, seed + 3, 2); }
  const g = c.createRadialGradient(CX, CY, H * .3, CX, CY, H * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,15,0,.28)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function rays(c, cx, cy, n, c1, c2, rot = 0) { cachedBg(c, `r${cx}${cy}${n}${c1}${c2}`, g => raysPaint(g, cx, cy, n, c1, c2, 0)); }
function raysPaint(c, cx, cy, n, c1, c2, rot) { resetT(c); c.fillStyle = c1; c.fillRect(0, 0, W, H); c.fillStyle = c2;
  for (let i = 0; i < n; i++) { const a0 = rot + i / n * TAU, a1 = a0 + TAU / n / 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a0) * 3000, cy + Math.sin(a0) * 3000); c.lineTo(cx + Math.cos(a1) * 3000, cy + Math.sin(a1) * 3000); c.fill(); }
  grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 5000, '#000', .06, 3, 2); const g = c.createRadialGradient(cx, cy, 200, cx, cy, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,10,0,.35)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }

// ---------- cut-out: draw a prop twice — first as a fat white silhouette with a shadow (the paper border), then the art ----------
// prop(c, sil): when sil is true, every fill/stroke must use the paper colour and strokes get thicker
function cutout(c, prop, x, y, t, o = {}) { if (t <= 0) return; const { rot = 0, s = 1, border = 16 } = o, k = pop(t);
  c.save(); c.translate(x, y + (1 - clamp(t * 1.5, 0, 1)) * 60); c.rotate(rot + (1 - k) * .15); c.scale(s * k, s * k);
  c.save(); c.shadowColor = 'rgba(20,10,0,.45)'; c.shadowBlur = 22; c.shadowOffsetX = 8; c.shadowOffsetY = 12; SIL = border; prop(c, true); c.restore();
  SIL = 0; prop(c, false); c.restore(); }
let SIL = 0;
// fill+stroke helper that honours the silhouette pass
function ink(c, path, fill, stroke = PA.ink, w = 4) { if (SIL) { c.fillStyle = PA.paper; c.strokeStyle = PA.paper; c.lineWidth = w + SIL * 2; c.lineJoin = 'round'; if (fill) c.fill(path); c.stroke(path); return; }
  if (fill) { c.fillStyle = fill; c.fill(path); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(path); } }
const DOTS = {};
function halftone(c, path, col = 'rgba(0,0,0,.18)', step = 9) { if (SIL) return;
  if (!DOTS[col]) { const t = document.createElement('canvas'); t.width = t.height = step * 2; const g = t.getContext('2d'); g.fillStyle = col;
    [[0, 0], [step, 0], [step / 2, step], [step * 1.5, step], [0, step * 2], [step * 2, step * 2], [step * 2, 0]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, step * .22, 0, TAU); g.fill(); }); DOTS[col] = c.createPattern(t, 'repeat'); }
  c.save(); c.fillStyle = DOTS[col]; c.fill(path); c.restore(); }
const R = (x, y, w, h, r = 0) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
const CIRC = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
const POLY = pts => { const p = new Path2D(); pts.forEach(([a, b], i) => i ? p.lineTo(a, b) : p.moveTo(a, b)); p.closePath(); return p; };

// ---------- typography ----------
// label tape: condensed bold capitals on a slightly ragged strip; style 'black' | 'red' | 'white' | 'yellow'
function tape(c, s, x, y, t, o = {}) { if (t <= 0) return; const { size = 96, rot = -.02, style = 'black' } = o, k = pop(t);
  const [bg, fg] = { black: [PA.ink, '#f4eee2'], red: [PA.red, '#fff6ea'], white: ['#f4eee2', PA.ink], yellow: [PA.yellow, PA.ink] }[style];
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.font = `700 ${size}px ${SANSB}`; const w = c.measureText(s).width * .78 + size * .6, h = size * 1.18;
  c.shadowColor = 'rgba(20,10,0,.4)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = bg; const r = rng(s.length);
  c.beginPath(); c.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 10; i++) c.lineTo(-w / 2 + w * i / 10, -h / 2 + (r() - .5) * 5); for (let i = 0; i <= 6; i++) c.lineTo(w / 2 + (r() - .5) * 8, -h / 2 + h * i / 6);
  for (let i = 10; i >= 0; i--) c.lineTo(-w / 2 + w * i / 10, h / 2 + (r() - .5) * 5); c.closePath(); c.fill(); c.shadowColor = 'transparent';
  c.scale(.78, 1); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, size * .05); c.restore(); }
function stamp(c, s, x, y, t, o = {}) { if (t <= 0) return; const { size = 110, rot = -.12, col = PA.red } = o, k = t < 1 ? 1 + 1.2 * (1 - easeOut(clamp(t, 0, 1))) : 1;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.globalAlpha = clamp(t * 4, 0, 1) * .92; c.font = `700 ${size}px ${SANSB}`; const w = c.measureText(s).width * .8 + size * .5;
  c.strokeStyle = col; c.lineWidth = 8; c.strokeRect(-w / 2, -size * .7, w, size * 1.35); c.scale(.8, 1); c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, size * .05); c.restore(); }
function serif(c, s, x, y, t, o = {}) { if (t <= 0) return; const { size = 56, col = PA.ink, italic = false, align = 'center' } = o; c.save(); c.globalAlpha = clamp(t * 3, 0, 1); c.font = `${italic ? 'italic ' : ''}700 ${size}px ${SERIF}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore(); }
// torn paper caption at the bottom, text in serif
function strip(c, lines, t, o = {}) { if (t <= 0) return; const { y = 1590, size = 46 } = o; resetT(c); c.save(); c.font = `700 ${size}px ${SERIF}`;
  const w = Math.max(...lines.map(l => c.measureText(l).width)) + 80, h = lines.length * size * 1.25 + 40, x = CX - w / 2, top = y - h / 2, r = rng(lines.join('').length);
  c.globalAlpha = clamp(t * 4, 0, 1); c.shadowColor = 'rgba(20,10,0,.35)'; c.shadowBlur = 12; c.shadowOffsetY = 6; c.fillStyle = PA.paper; c.beginPath(); c.moveTo(x, top);
  for (let i = 0; i <= 24; i++) c.lineTo(x + w * i / 24, top + (r() - .5) * 8); for (let i = 24; i >= 0; i--) c.lineTo(x + w * i / 24, top + h + (r() - .5) * 8); c.closePath(); c.fill();
  c.shadowColor = 'transparent'; c.fillStyle = PA.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; lines.forEach((l, i) => c.fillText(l, CX, top + 20 + size * .62 + i * size * 1.25)); c.restore(); }
// flip tiles for dates / numbers
function tiles(c, s, x, y, t, o = {}) { if (t <= 0) return; const { size = 120, bg = PA.paper, fg = PA.ink } = o, n = s.length, w = size * .8, gap = 12, x0 = x - (n * w + (n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) { const ti = clamp((t - i * .12) * 2.5, 0, 1); if (ti <= 0) continue; const sq = Math.abs(Math.cos((1 - ti) * Math.PI / 2 * 3)); c.save(); c.translate(x0 + i * (w + gap) + w / 2, y); c.scale(1, ti < 1 ? sq : 1);
    c.shadowColor = 'rgba(20,10,0,.4)'; c.shadowBlur = 10; c.shadowOffsetY = 6; c.fillStyle = bg; c.fillRect(-w / 2, -size * .62, w, size * 1.24); c.shadowColor = 'transparent';
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-w / 2, -1, w, 2); c.fillStyle = fg; c.font = `700 ${size}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s[i], 0, size * .06); c.restore(); } }

// ---------- whip-pan into each scene ----------
function whipIn(c, tau, fn) { const u = clamp(tau / .3, 0, 1); if (u >= 1) { fn(); return; } const off = (1 - easeOut(u)) * W * .9;
  c.save(); resetT(c); c.translate(-off, 0); c.filter = `blur(${(1 - u) * 18}px)`; fn(); c.restore(); c.filter = 'none'; }

// ---------- props (all are prop(c, sil) and drawn around 0,0) ----------
const P_robot = (c) => { // a generic iron automaton head, not a franchise design
  ink(c, R(-150, -170, 300, 320, 60), PA.steel); halftone(c, R(-150, -170, 300, 320, 60)); ink(c, R(-110, -60, 220, 70, 20), PA.ink);
  if (!SIL) { c.fillStyle = PA.red; c.shadowColor = PA.red; c.shadowBlur = 24; c.beginPath(); c.arc(-50, -25, 18, 0, TAU); c.arc(50, -25, 18, 0, TAU); c.fill(); c.shadowColor = 'transparent'; }
  ink(c, R(-80, 50, 160, 50, 10), PA.cream); if (!SIL) { c.strokeStyle = PA.ink; c.lineWidth = 4; for (let i = -60; i <= 60; i += 30) { c.beginPath(); c.moveTo(i, 50); c.lineTo(i, 100); c.stroke(); } }
  ink(c, R(-20, -230, 40, 60, 8), PA.steel); ink(c, CIRC(0, -240, 22), PA.red); ink(c, R(-190, -60, 40, 120, 12), PA.steel); ink(c, R(150, -60, 40, 120, 12), PA.steel); };
const P_cog = (c) => { const p = new Path2D(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 150 : 180; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath();
  ink(c, p, PA.kraftD); halftone(c, p); ink(c, CIRC(0, 0, 70), PA.cream); };
const P_db = (c) => { const top = new Path2D(); top.ellipse(0, -140, 150, 45, 0, 0, TAU); const body = new Path2D(); body.moveTo(-150, -140); body.lineTo(-150, 140); body.ellipse(0, 140, 150, 45, 0, Math.PI, 0, true); body.lineTo(150, -140); body.closePath();
  ink(c, body, PA.sky); halftone(c, body); if (!SIL) { c.strokeStyle = PA.ink; c.lineWidth = 4; [-40, 50].forEach(y => { c.beginPath(); c.ellipse(0, y, 150, 45, 0, 0, Math.PI); c.stroke(); }); } ink(c, top, '#c7e2ea'); };
const P_key = (c) => { const p = new Path2D(); p.arc(-120, 0, 70, 0, TAU); ink(c, p, PA.yellow); halftone(c, p); ink(c, CIRC(-120, 0, 25), PA.cream);
  ink(c, POLY([[-55, -18], [170, -18], [170, 18], [150, 18], [150, 55], [120, 55], [120, 18], [95, 18], [95, 45], [70, 45], [70, 18], [-55, 18]]), PA.yellow); };
const P_laptop = (c) => { ink(c, R(-220, -170, 440, 280, 18), PA.steel); ink(c, R(-195, -148, 390, 236, 8), PA.navy);
  if (!SIL) { c.font = `400 26px ${SANSB}`; c.fillStyle = '#9fe0b0'; ['> tarea de staging', '> error de credenciales', '> buscar clave…', '> borrar volumen'].forEach((l, i) => c.fillText(l, -175, -105 + i * 44)); }
  ink(c, POLY([[-270, 110], [270, 110], [240, 150], [-240, 150]]), '#d9d2c2'); };
const P_car = (c) => { const b = POLY([[-230, 40], [-200, -30], [-110, -50], [-60, -110], [90, -110], [150, -50], [230, -30], [240, 40]]); ink(c, b, PA.red); halftone(c, b);
  ink(c, POLY([[-45, -95], [70, -95], [115, -50], [-90, -50]]), '#cfe6ee'); ink(c, CIRC(-130, 45, 48), PA.ink); ink(c, CIRC(130, 45, 48), PA.ink); ink(c, CIRC(-130, 45, 18), PA.grey); ink(c, CIRC(130, 45, 18), PA.grey); };
const P_watch = (c, t = 0) => { ink(c, R(-30, -205, 60, 40, 8), PA.steel); ink(c, CIRC(0, 0, 170), PA.cream); ink(c, CIRC(0, 0, 140), '#fff'); if (SIL) return;
  c.fillStyle = PA.red; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 140, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(t, 0, 1)); c.closePath(); c.globalAlpha = .85; c.fill(); c.globalAlpha = 1;
  c.strokeStyle = PA.ink; c.lineWidth = 8; c.lineCap = 'round'; const a = -Math.PI / 2 + TAU * clamp(t, 0, 1); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 120, Math.sin(a) * 120); c.stroke(); };
const P_calendar = (c) => { ink(c, R(-160, -170, 320, 340, 16), PA.paper); ink(c, R(-160, -170, 320, 80, 16), PA.red); if (SIL) return;
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-160, -90 + i * 52); c.lineTo(160, -90 + i * 52); c.stroke(); } };
const P_box = (c) => { ink(c, POLY([[-260, -120], [260, -120], [260, 170], [-260, 170]]), PA.kraftD); halftone(c, POLY([[-260, -120], [260, -120], [260, 170], [-260, 170]]), 'rgba(0,0,0,.12)'); ink(c, POLY([[-260, -120], [-200, -190], [200, -190], [260, -120]]), PA.kraft); };
const P_card = (c) => { ink(c, R(-300, -80, 600, 160, 10), PA.paper); if (!SIL) { c.strokeStyle = 'rgba(200,56,46,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-250, -80); c.lineTo(-250, 80); c.stroke(); } };
const P_counter = (c) => { ink(c, R(-280, -40, 560, 200, 10), PA.teal); ink(c, R(-300, -70, 600, 40, 8), PA.kraftD); ink(c, R(-160, -260, 320, 180, 10), PA.paper); };
