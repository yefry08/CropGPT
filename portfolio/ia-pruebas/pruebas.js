/* ia-pruebas: extra cut-out props for the "unintended model actions" reel. Generic drawn shapes only: no real logos, seals,
   insignia or people. Load after collage.js. */

// browser window with a web form; fill (0..1) types the text lines, sent=true shows the button pressed
const P_form = (c, fill = 0, sent = false) => { ink(c, R(-280, -230, 560, 460, 16), PA.paper); ink(c, R(-280, -230, 560, 50, 16), PA.steel);
  if (SIL) return; c.save(); [[-245, -205, PA.red], [-215, -205, PA.yellow], [-185, -205, PA.green]].forEach(([x, y, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); });
  c.strokeStyle = PA.grey; c.lineWidth = 3; [[-240, -150, 480, 44], [-240, -85, 480, 44], [-240, -20, 480, 130]].forEach(([x, y, w, h]) => c.strokeRect(x, y, w, h));
  c.fillStyle = PA.ink; const n = Math.floor(fill * 5); for (let i = 0; i < n; i++) c.fillRect(-225, 0 + i * 22, i === 4 ? 200 : 420, 8);
  c.fillStyle = sent ? PA.green : PA.ink; c.beginPath(); c.roundRect(60, 140, 180, 60, 10); c.fill(); c.restore(); };

// a generic star badge
const P_badge = (c) => { const p = new Path2D(); for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + i / 14 * TAU, r = i % 2 ? 125 : 175; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath();
  ink(c, p, PA.yellow); halftone(c, p); ink(c, CIRC(0, 0, 90), PA.navy); const s = new Path2D(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? 26 : 60; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); ink(c, s, PA.yellow, PA.ink, 3); };

// a passport booklet
const P_passport = (c) => { ink(c, R(-140, -190, 280, 380, 14), PA.navy); halftone(c, R(-140, -190, 280, 380, 14), 'rgba(255,255,255,.12)'); ink(c, CIRC(0, -30, 70), null, PA.yellow, 6);
  if (SIL) return; c.save(); c.fillStyle = PA.yellow; c.fillRect(-80, 90, 160, 12); c.fillRect(-60, 120, 120, 10); c.restore(); };

// spam funnel / filter
const P_funnel = (c) => { const p = POLY([[-220, -160], [220, -160], [50, 40], [50, 180], [-50, 220], [-50, 40]]); ink(c, p, PA.steel); halftone(c, p, 'rgba(0,0,0,.15)');
  ink(c, R(-240, -190, 480, 40, 10), PA.redD); };

// an unplugged cable: plug on the left, socket on the right; gap (0..1) pulls them apart
const P_plug = (c, gap = 1) => { const g = 30 + gap * 130; c.save(); c.translate(-g, 0); ink(c, R(-300, -12, 200, 24, 10), PA.ink); ink(c, R(-110, -60, 110, 120, 16), PA.red);
  ink(c, R(0, -40, 50, 16, 4), PA.steel); ink(c, R(0, 24, 50, 16, 4), PA.steel); c.restore();
  c.save(); c.translate(g, 0); ink(c, R(0, -80, 130, 160, 16), PA.cream); ink(c, R(20, -40, 14, 22, 3), PA.ink); ink(c, R(20, 18, 14, 22, 3), PA.ink); c.restore(); };
