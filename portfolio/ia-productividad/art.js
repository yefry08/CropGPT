/* ia-ciencia: neon line-art shared by the 16:9 film and the reel. Load after kit.js.
   Faces are generic illustrated characters, not portraits: real people only appear as name cards. */

// ---------- clock: spectrum position across the whole film ----------
function makeClock(order) { const st = {}; let at = 0; order.forEach(k => { st[k] = at; at += D(k); }); return { st, total: at }; }
function beatOf(tau, d, fr) { let i = 0; while (i < fr.length && tau >= d * fr[i]) i++; return i; }
function since(tau, d, fr, i) { return tau - (i ? d * fr[i - 1] : 0); }
function label(c, s, x, y, t, size = 40, col = C.grey) { typeGlow(c, s, x, y, clamp(t * 2, 0, 1), { size, color: col, glow: 6, accent: col, weight: 400 }); }

// glowing stroke helper
function glow(c, col, w = 4, blur = 18) { c.strokeStyle = col; c.lineWidth = w; c.shadowColor = col; c.shadowBlur = blur; c.lineCap = 'round'; c.lineJoin = 'round'; }
function strokePts(c, pts, prog = 1, close = false) { if (pts.length < 2) return; const n = Math.min(pts.length, Math.max(2, Math.ceil(pts.length * clamp(prog, 0, 1)))); c.beginPath();
  for (let i = 0; i < n; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); if (close && prog >= 1) c.closePath(); c.stroke(); }

// ---------- a generic face in neon line art: smooth contours, soft fills, blinks, talks, breathes ----------
// o: { hair: 0 short | 1 long | 2 curly, glasses, talk (0..1 mouth activity), look (-1..1 gaze), prog (draw-in) }
function smoothStroke(c, pts, close = false) { const q = smoothPts(pts, close, 4); c.beginPath(); q.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (close) c.closePath(); c.stroke(); return q; }
function smoothFill(c, pts, fill) { const q = smoothPts(pts, true, 4); c.beginPath(); q.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fill; c.fill(); }
function face(c, x, y, s, col, tau, o = {}) {
  const { hair = 0, glasses = false, talk = 0, look = 0, prog = 1, seed = 1 } = o; if (prog <= 0) return;
  const br = breathe(tau, 3.2, seed * .13) * 4 * s, blink = (((tau + seed * .7) % 3.7) < .12) ? .08 : 1, P = (u, v) => [u * s, v * s];
  const head = []; for (let k = 0; k < 40; k++) { const th = k / 40 * TAU; head.push(P(90 * Math.sin(th) * (1 - .26 * Math.max(0, -Math.cos(th)) ** 1.4), -112 * Math.cos(th) + 6)); }
  c.save(); c.translate(x, y - br); c.globalAlpha = clamp(prog * 1.6, 0, 1);
  bloom(c, 0, 0, 300 * s, col, .2);
  // torso: shoulders, collar
  const torso = [P(-190, 300), P(-170, 220), P(-110, 190), P(-42, 168), P(0, 205), P(42, 168), P(110, 190), P(170, 220), P(190, 300)];
  smoothFill(c, torso.concat([P(190, 320), P(-190, 320)]), alpha(col, .10)); glow(c, col, 4.5 * s, 18); smoothStroke(c, torso);
  smoothStroke(c, [P(-40, 120), P(-38, 168)]); smoothStroke(c, [P(40, 120), P(38, 168)]);
  smoothStroke(c, [P(-42, 168), P(-20, 196), P(0, 205)]); smoothStroke(c, [P(42, 168), P(20, 196), P(0, 205)]);
  // hair behind the head (long)
  if (hair === 1) { const back = [P(-104, -10), P(-110, 90), P(-90, 160), P(-60, 150), P(60, 150), P(90, 160), P(110, 90), P(104, -10), P(80, -100), P(0, -130), P(-80, -100)];
    smoothFill(c, back, alpha(col, .22)); glow(c, col, 3.5 * s, 12); smoothStroke(c, back, true); }
  // head with a soft inner light
  const g = c.createRadialGradient(-20 * s, -30 * s, 10 * s, 0, 0, 130 * s); g.addColorStop(0, alpha(col, .22)); g.addColorStop(1, alpha(col, .04));
  smoothFill(c, head, g); smoothFill(c, head, 'rgba(0,0,0,.35)'); smoothFill(c, head, g);
  glow(c, col, 4.5 * s, 18); smoothStroke(c, head, true);
  // ears
  smoothStroke(c, [P(-88, -14), P(-104, -18), P(-108, 10), P(-96, 34), P(-86, 30)]); smoothStroke(c, [P(88, -14), P(104, -18), P(108, 10), P(96, 34), P(86, 30)]);
  // hair on top
  if (hair === 0) { const cap = [P(-90, -10), P(-96, -70), P(-60, -118), P(0, -130), P(62, -120), P(96, -72), P(90, -12), P(70, -60), P(30, -76), P(-20, -70), P(-60, -52)];
    smoothFill(c, cap, alpha(col, .35)); glow(c, PAL.ink, 3.4 * s, 10); smoothStroke(c, cap, true); }
  if (hair === 1) { const fringe = [P(-92, -20), P(-80, -96), P(0, -122), P(80, -96), P(92, -20), P(56, -70), P(10, -84), P(-40, -64)];
    smoothFill(c, fringe, alpha(col, .4)); glow(c, PAL.ink, 3.4 * s, 10); smoothStroke(c, fringe, true); }
  if (hair === 2) { glow(c, PAL.ink, 3.2 * s, 10); for (let k = 0; k < 11; k++) { const a = Math.PI * (1.02 + k * .096), cx = Math.cos(a) * 92 * s, cy = Math.sin(a) * 112 * s - 4 * s;
    c.fillStyle = alpha(col, .35); c.beginPath(); c.arc(cx, cy, 24 * s, 0, TAU); c.fill(); c.stroke(); } }
  // brows
  glow(c, PAL.ink, 4.2 * s, 8); smoothStroke(c, [P(-62, -40), P(-42, -48), P(-20, -44)]); smoothStroke(c, [P(20, -44), P(42, -48), P(62, -40)]);
  // almond eyes, iris, highlight
  [-40, 40].forEach(ex => { c.save(); c.translate(ex * s, -12 * s); c.scale(1, blink);
    const lid = [P(-22, 0), P(-10, -11), P(8, -11), P(22, 0), P(8, 9), P(-10, 9)]; smoothFill(c, lid, 'rgba(255,255,255,.92)'); glow(c, PAL.ink, 3 * s, 6); smoothStroke(c, lid, true);
    c.save(); c.beginPath(); c.ellipse(0, 0, 22 * s, 11 * s, 0, 0, TAU); c.clip(); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 16; c.beginPath(); c.arc(look * 7 * s, 0, 8.5 * s, 0, TAU); c.fill();
    c.fillStyle = '#05070f'; c.beginPath(); c.arc(look * 7 * s, 0, 4 * s, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(look * 7 * s + 3 * s, -3 * s, 2.2 * s, 0, TAU); c.fill(); c.restore(); c.restore(); });
  if (glasses) { glow(c, col, 3 * s, 12); [-40, 40].forEach(ex => { const q = new Path2D(); q.roundRect((ex - 32) * s, -34 * s, 64 * s, 44 * s, 14 * s); c.stroke(q); }); smoothStroke(c, [P(-8, -16), P(0, -20), P(8, -16)]); }
  // nose, cheeks, lips (open with talk)
  glow(c, PAL.ink, 3.4 * s, 6); smoothStroke(c, [P(-2, -6), P(-6, 22), P(-14, 34), P(-2, 40), P(10, 36)]);
  bloom(c, -52 * s, 30 * s, 26 * s, C.pink, .25); bloom(c, 52 * s, 30 * s, 26 * s, C.pink, .25);
  const m = talk * (.5 + .5 * Math.abs(Math.sin(tau * 11 + seed))) * 12 * s;
  glow(c, C.pink, 3.4 * s, 10); smoothStroke(c, [P(-26, 64), P(-10, 58), P(0, 61), P(10, 58), P(26, 64)]); smoothStroke(c, [P(-26, 64), P(0, 72 + m / s), P(26, 64)]);
  c.restore();
}

// ---------- a laptop with an AI agent working through data ----------
function laptop(c, x, y, s, tau, prog) { if (prog <= 0) return; c.save(); c.globalAlpha = clamp(prog * 1.5, 0, 1); bloom(c, x, y - 80 * s, 300 * s, C.orange, .22);
  glow(c, C.orange, 4 * s, 20); const scr = new Path2D(); scr.roundRect(x - 200 * s, y - 250 * s, 400 * s, 250 * s, 16 * s); c.stroke(scr);
  const base = [[x - 250 * s, y + 30 * s], [x + 250 * s, y + 30 * s], [x + 210 * s, y], [x - 210 * s, y]]; c.beginPath(); base.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.stroke();
  c.save(); c.clip(scr); c.font = `400 ${20 * s}px ${FONT}`; c.fillStyle = C.green; c.shadowColor = C.green; c.shadowBlur = 8;
  ['> agente: leer curva de luz', '> buscar caídas periódicas', '> prueba 31/74 ok', '> prueba 32/74 ok', '> predecir siguiente tránsito'].forEach((l, k) => {
    const n = Math.max(0, Math.floor((tau * 14 - k * 18))); c.fillText(l.slice(0, n), x - 180 * s, y - 210 * s + k * 40 * s); });
  c.restore(); c.restore(); }

// ---------- the stellarator: a twisted ring of plasma, drawn as glowing strands ----------
function stellarator(c, x, y, R, tau, prog = 1, o = {}) { if (prog <= 0) return; const { strands = 5, tilt = .42, period = 5 } = o;
  c.save(); bloom(c, x, y, R * 1.6, C.violet, .25 * prog);
  for (let k = 0; k < strands; k++) { const pts = [], off = k / strands * TAU;
    for (let u = 0; u <= TAU + .01; u += .02) { const tw = period * u + off + tau * .8, a = R * .28;
      const rr = R + a * Math.cos(tw); pts.push([x + rr * Math.cos(u), y + (rr * Math.sin(u)) * tilt + a * Math.sin(tw)]); }
    glow(c, spectrum(k / (strands - 1) * .8), 3.2, 22); c.globalAlpha = .85; strokePts(c, pts, prog); }
  // plasma particles running along the core
  c.globalAlpha = 1; for (let i = 0; i < 26; i++) { const u = (i / 26 * TAU + tau * 1.3) % TAU, tw = period * u + tau * .8, rr = R + R * .1 * Math.cos(tw);
    c.fillStyle = '#ffffff'; c.shadowColor = C.magenta; c.shadowBlur = 20; c.beginPath(); c.arc(x + rr * Math.cos(u), y + rr * Math.sin(u) * tilt + R * .1 * Math.sin(tw), 4, 0, TAU); c.fill(); }
  c.restore(); }

// ---------- a star's light curve with periodic dips (illustration, not the real data) ----------
function lightCurve(c, x, y, w, h, prog, tau) { if (prog <= 0) return; const pts = [], per = w / 3.2;
  for (let i = 0; i <= w * prog; i += 3) { const ph = ((i + 40) % per) / per, dip = ph > .45 && ph < .55 ? Math.sin((ph - .45) / .1 * Math.PI) : 0;
    pts.push([x + i, y + h * .3 + dip * h * .45 + Math.sin(i * .9 + tau * 6) * 3]); }
  c.save(); glow(c, C.grey, 1.5, 0); c.globalAlpha = .5; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.moveTo(x, y); c.lineTo(x, y + h); c.stroke();
  c.globalAlpha = 1; glow(c, C.cyan, 3.5, 16); strokePts(c, pts); c.restore(); }

// ---------- a starfield with one star that breathes ----------
function stars(c, tau, n = 160, seed = 7) { const r = rng(seed); c.save(); for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * .85, s = r() * 2 + .4, tw = .5 + .5 * Math.sin(tau * (1 + r() * 2) + i);
  c.globalAlpha = .25 + .6 * tw; c.fillStyle = '#ffffff'; c.fillRect(x, y, s, s); } c.restore(); }
function star(c, x, y, r, tau, dim = 0) { const k = 1 - dim * .55; bloom(c, x, y, r * 6, C.orange, .55 * k); c.save(); c.fillStyle = '#fff6e0'; c.shadowColor = C.orange; c.shadowBlur = 50 * k; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }

// ---------- padlock with a lattice (post-quantum) ----------
function padlock(c, x, y, s, prog, tau) { if (prog <= 0) return; c.save(); c.globalAlpha = clamp(prog * 1.4, 0, 1); bloom(c, x, y, 260 * s, C.green, .25);
  glow(c, C.green, 6 * s, 22); c.beginPath(); c.arc(x, y - 60 * s, 70 * s, Math.PI, 0); c.lineTo(x + 70 * s, y - 10 * s); c.moveTo(x - 70 * s, y - 60 * s); c.lineTo(x - 70 * s, y - 10 * s); c.stroke();
  const p = new Path2D(); p.roundRect(x - 120 * s, y - 10 * s, 240 * s, 190 * s, 24 * s); c.stroke(p); c.save(); c.clip(p); glow(c, C.cyan, 1.6 * s, 6); c.globalAlpha *= .6;
  for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(x - 140 * s + i * 30 * s + (tau * 20 % 30) * s, y - 20 * s); c.lineTo(x + i * 30 * s - 20 * s, y + 200 * s); c.stroke(); } c.restore();
  c.fillStyle = C.green; c.beginPath(); c.arc(x, y + 70 * s, 16 * s, 0, TAU); c.fill(); c.restore(); }

// ---------- a plane over smooth air, turbulence pockets flagged ahead ----------
function plane(c, x, y, s, tau, prog) { if (prog <= 0) return; c.save(); c.globalAlpha = clamp(prog * 1.5, 0, 1);
  for (let k = 0; k < 5; k++) { const pts = []; for (let i = -700; i <= 700; i += 10) pts.push([x + i, y + 120 + k * 46 + Math.sin(i * .012 + tau * 2 + k) * (k === 2 && i > 150 && i < 450 ? 26 : 6)]);
    glow(c, k === 2 ? C.orange : C.blue, 2.2, 10); c.globalAlpha = .55; strokePts(c, pts); }
  c.globalAlpha = 1; glow(c, '#ffffff', 4 * s, 18); const b = Math.sin(tau * 1.6) * 4;
  strokePts(c, [[x - 160 * s, y + b], [x + 170 * s, y + b], [x + 200 * s, y - 12 * s + b], [x + 170 * s, y - 24 * s + b], [x - 150 * s, y - 24 * s + b], [x - 190 * s, y - 70 * s + b], [x - 160 * s, y + b]]);
  strokePts(c, [[x - 20 * s, y - 12 * s + b], [x - 90 * s, y + 70 * s + b], [x - 50 * s, y + 70 * s + b], [x + 40 * s, y - 12 * s + b]]);
  ring(c, x + 300, y + 212, 10, 90, (tau % 1.6) / 1.6, C.orange, 3); c.restore(); }

// ---------- falling code that turns into equations ----------
function codeRain(c, x, y, w, h, tau, morph = 0, seed = 3) { const r = rng(seed), code = ['if (x) {', 'return y;', 'for i in n:', '</>', 'def f():', '{ }', '=>'], sci = ['F = m·a', 'Δx · Δp', 'f(x) dx', 'ΔE = 0', 'x + y', 'n + 1', 'Δt']   // no superscripts or math symbols: they hang headless Chrome's font fallback here;
  c.save(); c.font = `400 34px ${FONT}`; c.textAlign = 'center';
  for (let i = 0; i < 22; i++) { const cx = x + r() * w, sp = 60 + r() * 90, cy = y + ((r() * h + tau * sp) % h), m = clamp(morph * 1.6 - r() * .6, 0, 1), s = m > .5 ? sci[i % sci.length] : code[i % code.length];
    c.globalAlpha = .35 + .5 * Math.sin(Math.PI * (cy - y) / h); c.fillStyle = m > .5 ? C.magenta : C.cyan; c.fillText(s, cx, cy); }   // no shadowBlur on this text: it stalls headless Chrome intermittently
  c.restore(); }

// ---------- a progress bar that glows ----------
function bar(c, x, y, w, h, v, col, prog = 1) { if (prog <= 0) return; c.save(); c.globalAlpha = clamp(prog * 2, 0, 1); const p = new Path2D(); p.roundRect(x, y, w, h, h / 2);
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.stroke(p); const q = new Path2D(); q.roundRect(x, y, Math.max(h, w * clamp(v, 0, 1)), h, h / 2);
  c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 24; c.fill(q); c.restore(); }

// ---------- paper tiles cascading in (the 722 manuscripts) ----------
function paperRain(c, x, y, w, h, tau, prog, n = 60, seed = 11) { const r = rng(seed); c.save();
  for (let i = 0; i < n; i++) { const t = prog * 1.4 - i / n * .8; if (t <= 0) continue; const px = x + r() * w, py = y + r() * h, k = clamp(t * 2, 0, 1);
    c.globalAlpha = .25 + .45 * k; c.strokeStyle = spectrum(i / n); c.lineWidth = 1.6; c.shadowColor = c.strokeStyle; c.shadowBlur = 10;
    c.save(); c.translate(px, py - (1 - k) * 60); c.rotate((r() - .5) * .4); c.strokeRect(-26, -34, 52, 68); for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(-16, -20 + j * 12); c.lineTo(16, -20 + j * 12); c.stroke(); } c.restore(); }
  c.restore(); }
