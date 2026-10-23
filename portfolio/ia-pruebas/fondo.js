/* ia-fondo: extra cut-out props for the hedge-fund reel. Drawn shapes only: no logos, no real people, no company marks.
   Load after collage.js. */

// stock chart on a paper card; t (0..1) draws the line: up, up, then a crash
const P_chart = (c, t = 1, crash = true) => { ink(c, R(-260, -190, 520, 380, 14), PA.paper); if (SIL) return;
  c.save(); c.strokeStyle = 'rgba(60,40,20,.18)'; c.lineWidth = 2; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-230, -190 + i * 76); c.lineTo(230, -190 + i * 76); c.stroke(); } c.restore();
  const pts = crash ? [[-220, 120], [-160, 80], [-100, 90], [-40, 10], [20, -40], [70, -130], [110, -150], [150, -20], [190, 90], [225, 150]]
                    : [[-220, 150], [-160, 120], [-100, 125], [-40, 60], [20, 30], [80, -40], [140, -90], [190, -120], [225, -160]];
  const n = Math.max(2, Math.ceil(pts.length * clamp(t, 0, 1))); c.save(); c.lineWidth = 10; c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = crash && n > 7 ? PA.red : PA.green; c.beginPath(); pts.slice(0, n).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore(); };

// essay: stapled pages with ruled lines
const P_doc = (c) => { ink(c, R(-170, -220, 340, 440, 6), PA.cream); ink(c, R(-190, -235, 340, 440, 6), PA.paper); if (SIL) return;
  c.save(); c.fillStyle = PA.ink; for (let i = 0; i < 11; i++) c.fillRect(-160, -150 + i * 30, i % 4 === 3 ? 160 : 270, 7); c.fillRect(-160, -200, 200, 18); c.restore();
  c.save(); c.strokeStyle = PA.steel; c.lineWidth = 5; c.beginPath(); c.moveTo(-170, -215); c.lineTo(-135, -215); c.stroke(); c.restore(); };

// a coin with a dollar sign
const P_coin = (c) => { ink(c, CIRC(0, 0, 70), PA.yellow); halftone(c, CIRC(0, 0, 70)); ink(c, CIRC(0, 0, 50), null, PA.kraftD, 4); if (SIL) return;
  c.save(); c.fillStyle = PA.kraftD; c.font = `700 70px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, 4); c.restore(); };

// a seesaw: one coin on the left (own money) against four borrowed on the right
const P_lever = (c, tilt = 0) => { ink(c, POLY([[-50, 150], [50, 150], [0, 60]]), PA.steel); c.save(); c.translate(0, 55); c.rotate(tilt);
  ink(c, R(-330, -14, 660, 28, 6), PA.kraftD); c.restore(); };

// a chip with pins
const P_chip = (c) => { ink(c, R(-120, -120, 240, 240, 14), PA.navy); for (let i = 0; i < 5; i++) { const o = -88 + i * 44;
    ink(c, R(o - 8, -150, 16, 30, 3), PA.steel, PA.ink, 3); ink(c, R(o - 8, 120, 16, 30, 3), PA.steel, PA.ink, 3); ink(c, R(-150, o - 8, 30, 16, 3), PA.steel, PA.ink, 3); ink(c, R(120, o - 8, 30, 16, 3), PA.steel, PA.ink, 3); }
  ink(c, R(-60, -60, 120, 120, 8), PA.teal); halftone(c, R(-60, -60, 120, 120, 8), 'rgba(255,255,255,.2)'); };

// an old desk phone (the margin call)
const P_phone = (c, t = 0) => { const sh = SIL ? 0 : Math.sin(t * 60) * 6; c.save(); c.translate(sh, 0);
  ink(c, POLY([[-200, 150], [200, 150], [150, -20], [-150, -20]]), PA.red); halftone(c, POLY([[-200, 150], [200, 150], [150, -20], [-150, -20]]));
  ink(c, R(-230, -110, 460, 80, 40), PA.redD); ink(c, CIRC(0, 70, 55), PA.cream); c.restore(); };

// a price tag with a string
const P_tag = (c) => { const p = POLY([[-200, -110], [140, -110], [230, 0], [140, 110], [-200, 110]]); ink(c, p, PA.yellow); halftone(c, p); ink(c, CIRC(150, 0, 18), PA.cream); };

// a safe
const P_safe = (c) => { ink(c, R(-200, -200, 400, 400, 20), PA.steel); halftone(c, R(-200, -200, 400, 400, 20)); ink(c, R(-160, -160, 320, 320, 12), '#8a929c');
  ink(c, CIRC(0, 0, 80), PA.cream); ink(c, CIRC(0, 0, 18), PA.ink); if (SIL) return;
  c.save(); c.strokeStyle = PA.ink; c.lineWidth = 6; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 62, Math.sin(a) * 62); c.lineTo(Math.cos(a) * 74, Math.sin(a) * 74); c.stroke(); } c.restore(); };
