/* ia-barco: extra cut-out props for the "chatbot vs. Chinese ship" reel. Generic drawn shapes only: no flags, no insignia,
   no real people. Load after collage.js. */

// cargo ship with stacked containers
const P_ship = (c) => { const hull = POLY([[-330, 20], [330, 20], [270, 140], [-290, 140]]); ink(c, hull, PA.red); halftone(c, hull);
  ink(c, R(-300, 0, 600, 24, 4), PA.ink); ink(c, R(170, -150, 110, 150, 6), PA.cream); ink(c, R(200, -200, 30, 50, 4), PA.steel);
  const cols = [PA.teal, PA.orange, PA.yellow, PA.steel, PA.green];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) ink(c, R(-280 + i * 86, -60 - j * 58, 80, 54, 3), cols[(i + j * 2) % 5], PA.ink, 3);
  if (SIL) return; c.save(); c.fillStyle = PA.ink; for (let i = 0; i < 3; i++) c.fillRect(186 + i * 30, -120, 18, 16); c.restore(); };

// a generic jet seen from above
const P_plane = (c) => { const p = POLY([[0, -170], [22, -120], [24, -30], [190, 40], [190, 70], [24, 40], [18, 120], [70, 160], [70, 180], [0, 165], [-70, 180], [-70, 160], [-18, 120], [-24, 40], [-190, 70], [-190, 40], [-24, -30], [-22, -120]]);
  ink(c, p, PA.steel); halftone(c, p, 'rgba(0,0,0,.15)'); };

// chat bubble with typing dots; t animates the dots
const P_bubble = (c, t = 0, dots = true) => { const p = new Path2D(); p.roundRect(-240, -140, 480, 240, 40); p.moveTo(-120, 98); p.lineTo(-170, 170); p.lineTo(-40, 98);
  ink(c, p, PA.paper); if (SIL || !dots) return; for (let i = 0; i < 3; i++) { const a = .3 + .7 * (Math.sin(t * 8 - i) > 0 ? 1 : 0); c.save(); c.globalAlpha = a; c.fillStyle = PA.ink; c.beginPath(); c.arc(-70 + i * 70, -20, 22, 0, TAU); c.fill(); c.restore(); } };

// manila folder
const P_folder = (c) => { ink(c, POLY([[-250, -170], [-80, -170], [-50, -140], [250, -140], [250, 180], [-250, 180]]), PA.kraftD); ink(c, R(-250, -110, 500, 290, 8), PA.kraft); halftone(c, R(-250, -110, 500, 290, 8), 'rgba(0,0,0,.1)'); };

// radiation trefoil on a yellow disc
const P_trefoil = (c) => { ink(c, CIRC(0, 0, 170), PA.yellow); if (SIL) return; c.save(); c.fillStyle = PA.ink;
  for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; c.beginPath(); c.moveTo(Math.cos(a - .5) * 40, Math.sin(a - .5) * 40); c.arc(0, 0, 140, a - .5, a + .5); c.arc(0, 0, 40, a + .5, a - .5, true); c.fill(); }
  c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fill(); c.restore(); };

// a closed book
const P_book = (c) => { ink(c, R(-150, -200, 300, 400, 10), PA.teal); halftone(c, R(-150, -200, 300, 400, 10), 'rgba(255,255,255,.15)'); ink(c, R(-150, -200, 40, 400, 6), PA.navy);
  ink(c, R(-70, -120, 190, 60, 4), PA.cream); };

// magnifying glass
const P_lens = (c) => { c.save(); c.rotate(-Math.PI / 4); ink(c, R(-25, 120, 50, 190, 20), PA.kraftD); c.restore(); ink(c, CIRC(0, 0, 130), 'rgba(200,230,240,.6)', PA.ink, 18); };
