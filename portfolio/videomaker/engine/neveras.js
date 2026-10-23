/* ia-neveras: extra cut-out props for the supermarket-fridge hack reel. Generic drawn shapes only: no store or maker logos.
   Load after collage.js. */

// open supermarket fridge with shelves of goods; heat (0..1) turns the inside from cold blue to warm orange
const P_fridge = (c, heat = 0) => { ink(c, R(-230, -300, 460, 600, 14), PA.cream); const inner = R(-200, -250, 400, 500, 8);
  const lerp = (a, b) => Math.round(a + (b - a) * heat); ink(c, inner, `rgb(${lerp(156, 240)},${lerp(199, 140)},${lerp(211, 60)})`);
  if (SIL) return; const cols = [PA.red, PA.yellow, PA.green, PA.teal, PA.orange]; c.save();
  for (let s = 0; s < 4; s++) { c.fillStyle = PA.steel; c.fillRect(-200, -130 + s * 120, 400, 8); for (let i = 0; i < 5; i++) { c.fillStyle = cols[(i + s) % 5]; c.globalAlpha = 1 - heat * .35; c.fillRect(-185 + i * 76, -200 + s * 120, 60, 70 - (heat > .6 ? (i % 2) * 20 : 0)); } }
  c.restore(); };

// thermometer; v (0..1) fills the column
const P_thermo = (c, v = 0) => { ink(c, R(-40, -260, 80, 420, 40), PA.paper); ink(c, CIRC(0, 190, 70), PA.paper); if (SIL) return;
  c.save(); c.fillStyle = PA.red; c.beginPath(); c.arc(0, 190, 48, 0, TAU); c.fill(); const h = 40 + v * 340; c.fillRect(-18, 170 - h, 36, h + 20);
  c.strokeStyle = PA.ink; c.lineWidth = 3; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(40, -220 + i * 48); c.lineTo(58, -220 + i * 48); c.stroke(); } c.restore(); };

// a wall-mounted controller box with a small screen and a wifi arc
const P_ctrl = (c, t = 0) => { ink(c, R(-200, -150, 400, 300, 18), PA.steel); halftone(c, R(-200, -150, 400, 300, 18)); ink(c, R(-160, -110, 320, 130, 8), PA.navy);
  for (let i = 0; i < 3; i++) ink(c, CIRC(-90 + i * 90, 85, 26), [PA.red, PA.yellow, PA.green][i]);
  if (SIL) return; c.save(); c.fillStyle = PA.green; c.font = `700 56px ${SANSB}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DESHIELO', 0, -45); c.restore();
  c.save(); c.strokeStyle = PA.ink; c.lineWidth = 10; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.globalAlpha = (Math.sin(t * 5 - i) + 1) / 2; c.beginPath(); c.arc(0, -150, 50 + i * 45, -2.4, -.75); c.stroke(); } c.restore(); };

// a rubbish bin
const P_bin = (c) => { const body = POLY([[-170, -150], [170, -150], [140, 230], [-140, 230]]); ink(c, body, PA.green); halftone(c, body);
  ink(c, R(-200, -200, 400, 50, 12), PA.green); ink(c, R(-50, -235, 100, 40, 10), PA.green);
  if (SIL) return; c.save(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 8; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 70, -110); c.lineTo(i * 60, 190); c.stroke(); } c.restore(); };

// a paper flame; t flickers it
const P_flame = (c, t = 0) => { const k = 1 + Math.sin(t * 12) * .05; c.save(); c.scale(1, k);
  const outer = new Path2D('M0,-220 C80,-120 150,-40 120,60 C100,140 40,180 0,180 C-40,180 -100,140 -120,60 C-150,-40 -60,-90 -30,-170 C-10,-110 10,-130 0,-220 Z');
  ink(c, outer, PA.orange); const inner = new Path2D('M0,-80 C40,-20 70,30 55,90 C45,130 20,150 0,150 C-20,150 -50,130 -55,90 C-65,40 -20,0 0,-80 Z'); ink(c, inner, PA.yellow, null); c.restore(); };
