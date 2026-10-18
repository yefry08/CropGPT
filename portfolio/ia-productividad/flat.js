/* ia-productividad: flat illustration kit (rounded shapes, flat colours, soft shadows, coloured backgrounds).
   Characters are generic "bean" people, not portraits. Load after kit.js. */
const K = { night: '#16183f', deep: '#1f2160', violet: '#3a2a7a', teal: '#21c7b4', mint: '#7ef0c8', yellow: '#ffcf3f', orange: '#ff8a3d',
  pink: '#ff5d8f', red: '#ff4d5a', blue: '#3fa7ff', sky: '#9fd8ff', white: '#ffffff', ink: '#14143a', grey: '#8f93c4', steel: '#5b6099',
  skins: ['#f6c9a6', '#d39a6e', '#8f5b3c', '#f1b98f'], shirts: ['#ff8a3d', '#21c7b4', '#ff5d8f', '#3fa7ff', '#ffcf3f'] };
const SANS = '"Liberation Sans", "DejaVu Sans", Arial, sans-serif';

// ---------- clock and beats ----------
function makeClock(order) { const st = {}; let at = 0; order.forEach(k => { st[k] = at; at += D(k); }); return { st, total: at }; }
function beatOf(tau, d, fr) { let i = 0; while (i < fr.length && tau >= d * fr[i]) i++; return i; }
function since(tau, d, fr, i) { return tau - (i ? d * fr[i - 1] : 0); }
const pop = t => t <= 0 ? 0 : t >= 1 ? 1 : easeOutBack(clamp(t, 0, 1), 1.6);

// ---------- background: flat gradient sky with soft circles ----------
function sky(c, top, bottom, seed = 1, tau = 0) { resetT(c); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = rng(seed); c.save(); for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H * .6, s = 1 + r() * 2.5; c.globalAlpha = .25 + .35 * Math.sin(tau * 1.5 + i); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); } c.restore(); }
function ground(c, y, col) { c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(W / 2, y - 40, W, y); c.lineTo(W, H); c.lineTo(0, H); c.fill(); c.restore(); }

// ---------- primitives with a soft drop shadow ----------
function drop(c, on = true) { if (on) { c.shadowColor = 'rgba(8,8,40,.35)'; c.shadowBlur = 24; c.shadowOffsetY = 10; } else { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; } }
function rr(c, x, y, w, h, r, fill, sh = true) { c.save(); drop(c, sh); c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); c.restore(); }
function dot(c, x, y, r, fill, sh = false) { c.save(); drop(c, sh); c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }
function T(c, s, x, y, t, o = {}) { if (t <= 0) return; const { size = 72, color = K.white, weight = 800, align = 'center', sh = true } = o, k = pop(t);
  c.save(); c.translate(x, y); c.scale(k, k); c.globalAlpha = clamp(t * 3, 0, 1); c.font = `${weight} ${size}px ${SANS}`; c.textAlign = align; c.textBaseline = 'middle';
  if (sh) { c.shadowColor = 'rgba(8,8,40,.45)'; c.shadowBlur = 0; c.shadowOffsetY = size * .07; } c.fillStyle = color; c.fillText(s, 0, 0); c.restore(); }
function pill(c, s, x, y, t, bg, o = {}) { if (t <= 0) return; const { size = 44, color = K.white } = o, k = pop(t); c.save(); c.font = `800 ${size}px ${SANS}`; const w = c.measureText(s).width + size * 1.2, h = size * 1.7;
  c.translate(x, y); c.scale(k, k); rr(c, -w / 2, -h / 2, w, h, h / 2, bg); c.restore(); T(c, s, x, y + 2, t, { size, color, sh: false }); }

// ---------- a bean person: rounded body, round head, big eyes; bobs and blinks ----------
function bean(c, x, y, s, tau, o = {}) { const { shirt = K.orange, skin = K.skins[0], hair = K.ink, look = 0, happy = true, arm = 0, seed = 1, t = 1 } = o; if (t <= 0) return;
  const bob = Math.sin(tau * 3 + seed) * 4 * s, blink = ((tau + seed) % 3.3) < .1 ? .1 : 1, k = pop(t);
  c.save(); c.translate(x, y + bob); c.scale(s * k, s * k);
  rr(c, -55, 10, 110, 150, 50, shirt);                                         // body
  c.save(); c.strokeStyle = shirt; c.lineWidth = 22; c.lineCap = 'round';       // arms
  c.beginPath(); c.moveTo(-45, 50); c.lineTo(-75, 110 - arm * 60); c.moveTo(45, 50); c.lineTo(78, 105 - arm * 70 + Math.sin(tau * 8) * arm * 8); c.stroke(); c.restore();
  dot(c, -75, 112 - arm * 60, 13, skin); dot(c, 78, 107 - arm * 70, 13, skin);
  dot(c, 0, -40, 62, skin, true);                                              // head
  c.save(); c.fillStyle = hair; c.beginPath(); c.arc(0, -52, 62, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(10, -70, -60, -48); c.fill(); c.restore();
  [-22, 22].forEach(ex => { c.save(); c.translate(ex, -38); c.scale(1, blink); dot(c, 0, 0, 14, K.white); dot(c, look * 5, 1, 7, K.ink); dot(c, look * 5 + 3, -2, 2.4, K.white); c.restore(); });
  c.save(); c.strokeStyle = K.ink; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); if (happy) c.arc(0, -14, 14, .2, Math.PI - .2); else { c.moveTo(-12, -6); c.lineTo(12, -6); } c.stroke(); c.restore();
  dot(c, -40, -22, 9, 'rgba(255,93,143,.35)'); dot(c, 40, -22, 9, 'rgba(255,93,143,.35)');
  c.restore(); }

// ---------- props ----------
function clockFace(c, x, y, r, tau, speed = 1, t = 1) { if (t <= 0) return; const k = pop(t); c.save(); c.translate(x, y); c.scale(k, k);
  dot(c, 0, 0, r, K.white, true); dot(c, 0, 0, r * .86, '#eef1ff'); c.fillStyle = K.steel; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.arc(Math.cos(a) * r * .72, Math.sin(a) * r * .72, r * .045, 0, TAU); c.fill(); }
  c.strokeStyle = K.ink; c.lineCap = 'round'; c.lineWidth = r * .07; c.save(); c.rotate(tau * speed * .5); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * .45); c.stroke(); c.restore();
  c.strokeStyle = K.orange; c.lineWidth = r * .05; c.save(); c.rotate(tau * speed * 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * .68); c.stroke(); c.restore(); dot(c, 0, 0, r * .07, K.orange); c.restore(); }
function laptop(c, x, y, s, tau, glowCol = K.teal) { c.save(); c.translate(x, y); c.scale(s, s); rr(c, -120, -150, 240, 150, 14, K.steel); rr(c, -106, -138, 212, 126, 8, glowCol, false);
  c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) c.fillRect(-90, -120 + i * 26, 60 + ((tau * 80 + i * 47) % 100), 10); rr(c, -150, 0, 300, 18, 9, '#3d417a'); c.restore(); }
function desk(c, x, y, w) { rr(c, x - w / 2, y, w, 26, 10, '#6b4fb8'); rr(c, x - w / 2 + 30, y + 26, 22, 160, 8, '#4d3a8a', false); rr(c, x + w / 2 - 52, y + 26, 22, 160, 8, '#4d3a8a', false); }
function crt(c, x, y, s, t, scr = K.mint) { if (t <= 0) return; const k = pop(t); c.save(); c.translate(x, y); c.scale(s * k, s * k); rr(c, -70, -70, 140, 120, 16, '#e7e1cf'); rr(c, -54, -56, 108, 84, 10, scr, false);
  c.fillStyle = 'rgba(20,20,58,.5)'; c.fillRect(-42, -42, 50, 8); c.fillRect(-42, -26, 70, 8); rr(c, -30, 50, 60, 14, 6, '#cfc8b2', false); rr(c, -60, 64, 120, 16, 8, '#e7e1cf'); c.restore(); }
function chartCard(c, x, y, w, h, t, p) { if (t <= 0) return; const k = pop(t); c.save(); c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.translate(-w / 2, -h / 2);
  rr(c, 0, 0, w, h, 30, K.white); c.strokeStyle = '#d8dcf5'; c.lineWidth = 4; c.beginPath(); c.moveTo(60, 40); c.lineTo(60, h - 60); c.lineTo(w - 40, h - 60); c.stroke();
  const up = [], flat = []; for (let i = 0; i <= (w - 120) * p; i += 8) { const u = i / (w - 120); up.push([60 + i, h - 60 - (h - 140) * u ** 1.4]); flat.push([60 + i, h - 120 - Math.sin(u * 8) * 8]); }
  c.lineCap = 'round'; c.lineJoin = 'round'; [[up, K.orange], [flat, K.pink]].forEach(([pts, col]) => { if (pts.length < 2) return; c.strokeStyle = col; c.lineWidth = 14; c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); });
  c.restore(); }
function cloudPuff(c, x, y, r, a) { c.save(); c.globalAlpha = a; c.fillStyle = '#d9dcf2'; [[0, 0, 1], [-.8, .2, .7], [.8, .25, .75], [0, .4, .8]].forEach(([dx, dy, k]) => { c.beginPath(); c.arc(x + dx * r, y + dy * r, r * k, 0, TAU); c.fill(); }); c.restore(); }
function bolt(c, x, y, s, col = K.yellow) { c.save(); c.translate(x, y); c.scale(s, s); drop(c, true); c.fillStyle = col; c.beginPath(); [[-10, -40], [18, -40], [4, -8], [22, -8], [-14, 44], [-4, 6], [-20, 6]].forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill(); c.restore(); }
function wheel(c, x, y, r, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); dot(c, 0, 0, r, col, true); dot(c, 0, 0, r * .72, K.night); c.strokeStyle = col; c.lineWidth = r * .16; for (let j = 0; j < 6; j++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(j * TAU / 6) * r * .72, Math.sin(j * TAU / 6) * r * .72); c.stroke(); } dot(c, 0, 0, r * .2, col); c.restore(); }
function machine(c, x, y, col, tau, i) { rr(c, x - 70, y - 60, 140, 120, 18, col); rr(c, x - 50, y - 40, 60, 30, 8, 'rgba(255,255,255,.35)', false); wheel(c, x + 38, y + 20, 22, tau * 4 + i, K.steel); }
// the 1900 factory: mode 0 = steam engine + line shaft, 1 = electric motor on the same shaft, 2 = redesigned, one motor per machine
function factory(c, x, y, w, tau, mode, t) { if (t <= 0) return; const k = pop(t), n = 4, gap = w / n; c.save(); c.translate(x + w / 2, y); c.scale(k, k); c.translate(-(x + w / 2), -y);
  rr(c, x - 30, y - 40, w + 60, 560, 36, '#2b2d72'); c.fillStyle = '#34378a'; c.beginPath(); [[x - 30, y - 30], [x + w * .25, y - 170], [x + w * .5, y - 30], [x + w * .75, y - 170], [x + w + 30, y - 30]].forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.fill();
  rr(c, x - 30, y + 470, w + 60, 50, 20, '#22245e', false);
  for (let i = 0; i < n; i++) { const mx = x + gap * (i + .5), my = y + 380; machine(c, mx, my, K.shirts[i], tau, i); bean(c, mx - 10, my - 190 + 40, .55, tau, { shirt: K.shirts[(i + 2) % 5], skin: K.skins[i % 4], seed: i, arm: .3 });
    if (mode < 2) { c.save(); c.strokeStyle = K.orange; c.lineWidth = 6; c.setLineDash([16, 10]); c.lineDashOffset = -tau * 60; c.beginPath(); c.moveTo(mx - 20, y + 70); c.lineTo(mx + 20, my - 60); c.stroke(); c.restore(); }
    else { dot(c, mx + 50, my - 80, 30, K.yellow, true); bolt(c, mx + 50, my - 80, .55, K.orange); } }
  if (mode < 2) { rr(c, x, y + 60, w, 18, 9, '#9a7b55'); const ex = x + w / 2; // line shaft and the prime mover
    if (mode === 0) { rr(c, ex - 70, y + 110, 140, 110, 20, '#7d4f3b'); wheel(c, ex, y + 70, 54, tau * 3, '#c9874f'); for (let j = 0; j < 4; j++) { const u = (tau * .5 + j / 4) % 1; cloudPuff(c, ex + 120 + u * 60, y - 120 - u * 220, 26 + u * 30, 1 - u); } rr(c, ex + 90, y - 140, 50, 140, 10, '#7d4f3b'); }
    else { dot(c, ex, y + 140, 70, K.yellow, true); bolt(c, ex, y + 140, 1.2, K.orange); wheel(c, ex, y + 70, 54, tau * 3, '#c9874f'); } }
  c.restore(); }
function hourglass(c, x, y, s, p, tau) { c.save(); c.translate(x, y); c.scale(s, s); rr(c, -90, -150, 180, 26, 12, '#c9874f'); rr(c, -90, 124, 180, 26, 12, '#c9874f');
  c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(-70, -124); c.lineTo(70, -124); c.lineTo(10, 0); c.lineTo(70, 124); c.lineTo(-70, 124); c.lineTo(-10, 0); c.closePath(); c.fill();
  c.fillStyle = K.yellow; const a = 1 - p; c.beginPath(); c.moveTo(-60 * a, -10 - 100 * a); c.lineTo(60 * a, -10 - 100 * a); c.lineTo(0, -6); c.fill(); c.beginPath(); c.moveTo(-60 * p, 120); c.lineTo(60 * p, 120); c.lineTo(0, 120 - 90 * p); c.fill(); c.restore(); }
function building(c, x, y, s, col) { rr(c, x - 22 * s, y - 50 * s, 44 * s, 50 * s, 6 * s, col, false); c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) c.fillRect(x - 13 * s + i * 16 * s, y - 40 * s + j * 18 * s, 9 * s, 10 * s); }
function robo(c, x, y, s, tau) { c.save(); c.translate(x, y + Math.sin(tau * 3) * 6); c.scale(s, s); rr(c, -60, -50, 120, 100, 30, '#dfe4ff'); rr(c, -42, -30, 84, 46, 20, K.night, false);
  dot(c, -18, -8, 9, K.teal); dot(c, 18, -8, 9, K.teal); c.fillStyle = '#dfe4ff'; c.fillRect(-4, -78, 8, 30); dot(c, 0, -82, 10, K.pink); c.restore(); }
