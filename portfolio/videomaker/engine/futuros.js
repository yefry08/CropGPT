/* ia-futuros: extra cut-out props for the "12 futures" reel (Tegmark's Life 3.0 scenarios). Generic drawn shapes only: no book
   cover, no real people, no film imagery. Load after collage.js. */

// a simple gorilla head
const P_gorilla = (c) => { ink(c, CIRC(0, 0, 170), '#3b3530'); ink(c, CIRC(-150, -20, 45), '#3b3530'); ink(c, CIRC(150, -20, 45), '#3b3530');
  const face = new Path2D(); face.ellipse(0, 40, 115, 110, 0, 0, TAU); ink(c, face, '#7a6a5c'); if (SIL) return;
  c.save(); c.fillStyle = '#3b3530'; c.fillRect(-100, -40, 200, 26); c.fillStyle = PA.ink; [[-45, 0], [45, 0]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 14, 0, TAU); c.fill(); });
  c.beginPath(); c.ellipse(-22, 55, 14, 9, 0, 0, TAU); c.ellipse(22, 55, 14, 9, 0, 0, TAU); c.fill(); c.lineWidth = 6; c.strokeStyle = PA.ink; c.beginPath(); c.moveTo(-40, 105); c.quadraticCurveTo(0, 95, 40, 105); c.stroke(); c.restore(); };

// a generic person (paper doll); col sets the shirt
const P_person = (c, col = PA.teal) => { ink(c, CIRC(0, -150, 55), PA.kraft); ink(c, R(-70, -90, 140, 190, 30), col); ink(c, R(-60, 95, 50, 130, 16), PA.navy); ink(c, R(10, 95, 50, 130, 16), PA.navy); };

// a bird cage (golden cage when gold=true)
const P_cage = (c, gold = false) => { const col = gold ? PA.yellow : PA.steel; ink(c, R(-200, 180, 400, 40, 10), col); const dome = new Path2D(); dome.moveTo(-180, 180); dome.lineTo(-180, -60); dome.quadraticCurveTo(0, -280, 180, -60); dome.lineTo(180, 180);
  ink(c, dome, null, col, 12); if (SIL) { ink(c, dome, PA.paper); return; } c.save(); c.strokeStyle = col; c.lineWidth = 8; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 52, 180); c.lineTo(i * 52, -60 - (3 - Math.abs(i)) * 40); c.stroke(); } c.restore();
  ink(c, CIRC(0, -240, 22), col); };

// a watching eye
const P_eye = (c, t = 0) => { const p = new Path2D(); p.moveTo(-250, 0); p.quadraticCurveTo(0, -200, 250, 0); p.quadraticCurveTo(0, 200, -250, 0); ink(c, p, PA.paper);
  ink(c, CIRC(Math.sin(t) * 40, 0, 85), PA.teal); ink(c, CIRC(Math.sin(t) * 40, 0, 38), PA.ink); };

// a shield
const P_shield = (c) => { const p = new Path2D('M0,-220 L180,-160 C180,40 120,150 0,220 C-120,150 -180,40 -180,-160 Z'); ink(c, p, PA.teal); halftone(c, p, 'rgba(255,255,255,.15)');
  const s = new Path2D('M0,-140 L100,-105 C100,10 70,80 0,130 C-70,80 -100,10 -100,-105 Z'); ink(c, s, PA.cream); };

// a crown
const P_crown = (c) => { const p = POLY([[-200, 100], [-220, -110], [-110, -10], [0, -150], [110, -10], [220, -110], [200, 100]]); ink(c, p, PA.yellow); halftone(c, p);
  ink(c, R(-210, 90, 420, 50, 8), PA.kraftD); [-120, 0, 120].forEach(x => ink(c, CIRC(x, 115, 14), PA.red)); };

// equals sign on a card
const P_equal = (c) => { ink(c, R(-180, -150, 360, 300, 20), PA.paper); ink(c, R(-110, -70, 220, 40, 10), PA.green); ink(c, R(-110, 30, 220, 40, 10), PA.green); };

// a big hand from the shadows (protector)
const P_hand = (c) => { const p = new Path2D('M-200,200 L-200,-20 C-200,-60 -150,-60 -150,-20 L-150,-160 C-150,-200 -100,-200 -100,-160 L-100,-200 C-100,-240 -50,-240 -50,-200 L-50,-180 C-50,-220 0,-220 0,-180 L0,-120 C0,-160 50,-160 50,-120 L50,200 Z');
  ink(c, p, 'rgba(30,36,51,.85)', PA.ink, 4); };
