/* ia-robots: extra cut-out props for the "robots into molten steel" reel. Generic drawn shapes only: the humanoid is not any
   company's design, no logos, no real people. Load after collage.js. */

// a generic humanoid robot, full body; arm (0..1) raises the right arm, thumb=true adds a thumbs-up
const P_humanoid = (c, arm = 0, thumb = false) => {
  ink(c, R(-55, -260, 110, 110, 30), PA.steel); ink(c, R(-40, -230, 80, 34, 12), PA.ink); if (!SIL) { c.save(); c.fillStyle = PA.sky; c.fillRect(-30, -222, 60, 18); c.restore(); }
  ink(c, R(-30, -150, 60, 24, 6), PA.grey); ink(c, R(-95, -130, 190, 210, 26), PA.cream); halftone(c, R(-95, -130, 190, 210, 26));
  ink(c, R(-70, 80, 55, 190, 18), PA.steel); ink(c, R(15, 80, 55, 190, 18), PA.steel);
  ink(c, R(-140, -120, 44, 170, 18), PA.steel);
  c.save(); c.translate(118, -110); c.rotate(-arm * 2.6); ink(c, R(-22, 0, 44, 170, 18), PA.steel);
  if (thumb) { ink(c, CIRC(0, 180, 28), PA.steel); ink(c, R(-8, 190, 16, 50, 8), PA.steel); } c.restore(); };

// a ladle / furnace mouth with molten steel; glow (0..1) pulses
const P_furnace = (c, glow = 1) => { const body = POLY([[-300, -60], [300, -60], [250, 220], [-250, 220]]); ink(c, body, PA.ink); halftone(c, body, 'rgba(255,255,255,.08)');
  ink(c, R(-320, -90, 640, 50, 14), PA.steel); const melt = new Path2D(); melt.ellipse(0, -65, 290, 30, 0, 0, TAU); ink(c, melt, PA.orange);
  if (SIL) return; c.save(); c.globalAlpha = .5 + .5 * glow; c.fillStyle = PA.yellow; c.beginPath(); c.ellipse(0, -65, 200, 18, 0, 0, TAU); c.fill(); c.restore(); };

// an air mattress
const P_airbag = (c) => { ink(c, R(-280, -70, 560, 140, 50), PA.orange); halftone(c, R(-280, -70, 560, 140, 50));
  if (SIL) return; c.save(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 4; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 100, -60); c.lineTo(i * 100, 60); c.stroke(); } c.restore(); };

// a lithium battery
const P_battery = (c) => { ink(c, R(-110, -200, 220, 400, 24), PA.green); ink(c, R(-45, -235, 90, 40, 8), PA.steel); halftone(c, R(-110, -200, 220, 400, 24));
  if (SIL) return; c.save(); c.fillStyle = PA.yellow; c.beginPath(); [[20, -110], [-50, 20], [0, 20], [-20, 120], [50, -20], [0, -20]].forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.restore(); };

// a metal ingot
const P_ingot = (c) => { const top = POLY([[-200, -40], [200, -40], [240, 20], [-240, 20]]); ink(c, R(-240, 20, 480, 90, 6), PA.grey); ink(c, top, '#c9ced4'); halftone(c, top, 'rgba(0,0,0,.12)'); };
