/* ia-ciencia: "Sprouts"-like kit — thick wobbly ink outlines, flat fills, paper backgrounds, big-headed generic
   characters, everything draws itself in. Built on kit.js drawArt. Characters never portray real people. */
const P = { paper: '#fbf6ea', ink: '#1e1630', yellow: '#ffd23f', mint: '#8fe3c8', peach: '#ffb48a', sky: '#9fd3ff', pink: '#ff8fb1',
  red: '#ef4b4b', blue: '#3b82f6', green: '#22b07d', violet: '#8b6cf0', grey: '#c9c3b5', skin: ['#ffd9b8', '#e8b48c', '#b07a52', '#f2c29b'] };

function makeClock(order) { const st = {}; let at = 0; order.forEach(k => { st[k] = at; at += D(k); }); return { st, total: at }; }
function beatOf(tau, d, fr) { let i = 0; while (i < fr.length && tau >= d * fr[i]) i++; return i; }
function since(tau, d, fr, i) { return tau - (i ? d * fr[i - 1] : 0); }
const grow = (t, dur = .9) => clamp(t / dur, 0, 1);

// paper with a big soft colour block behind the action, plus grain
function page(c, col, seed = 3) { resetT(c); c.fillStyle = P.paper; c.fillRect(0, 0, W, H);
  c.save(); c.fillStyle = col; c.globalAlpha = .55; c.beginPath(); blob(CX, 780, 520, 560, seed, { amp: .06 }).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.restore();
  grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 900, P.ink, .05, seed, 1.6); }
// marker lettering that types on, with an underline swoosh option
function say(c, s, x, y, t, o = {}) { const { size = 76, color = P.ink, under = null } = o; txt(c, s, x, y, { size, color, prog: clamp(t, 0, 1), weight: 700 });
  if (under && t > .6) { c.save(); c.font = `700 ${size}px ${FONT}`; const w = c.measureText(s).width; c.restore();
    drawArt(c, [S_([[x - w / 2, y + size * .25], [x, y + size * .32], [x + w / 2, y + size * .22]], { w: 8, col: under })], (t - .6) / .4, 7, { amp: 2 }); } }

// ---------- a generic big-headed character ----------
// o: { shirt, skin, hair (colour), style 0 short | 1 bun | 2 curly, arm (-1 down .. 1 up), wave, glasses, mouth 'smile'|'o'|'flat' }
function person(c, x, y, s, prog, tau, o = {}) { if (prog <= 0) return; const { shirt = P.blue, skin = P.skin[0], hair = P.ink, style = 0, arm = 0, wave = 0, glasses = false, mouth = 'smile', seed = 1 } = o;
  const b = Math.sin(tau * 4 + seed) * 3, sw = Math.sin(tau * 9) * wave * .5, Pt = (u, v) => [x + u * s, y + (v + b) * s], L = (pts, op) => S_(pts.map(([u, v]) => Pt(u, v)), op);
  const st = [
    L([[-24, 150], [-30, 230]], { w: 7 }), L([[24, 150], [30, 230]], { w: 7 }),                                     // legs
    L([[-55, 40], [-60, 150], [60, 150], [55, 40], [0, 20]], { close: true, fill: shirt, w: 6 }),                      // body
    L([[-52, 60], [-95, 110 - arm * 90 + sw * 30]], { w: 7 }), L([[52, 60], [95, 110 - arm * 90 - sw * 30]], { w: 7 }), // arms
    S_(ellPts(...Pt(0, -40), 72 * s, 76 * s, 0, 40), { close: true, fill: skin, w: 6 }),                                // head
  ];
  if (style === 0) st.push(L([[-70, -50], [-60, -100], [-10, -122], [50, -110], [72, -60], [40, -82], [-10, -84], [-50, -70]], { close: true, fill: hair, w: 5 }));
  if (style === 1) st.push(S_(ellPts(...Pt(0, -128), 34 * s, 28 * s, 0, 24), { close: true, fill: hair, w: 5 }), L([[-72, -40], [-62, -100], [0, -118], [62, -100], [72, -40], [40, -84], [-40, -84]], { close: true, fill: hair, w: 5 }));
  if (style === 2) for (let k = 0; k < 7; k++) { const a = Math.PI * (1.08 + k * .14); st.push(S_(ellPts(...Pt(Math.cos(a) * 66, -40 + Math.sin(a) * 70), 22 * s, 22 * s, 0, 16), { close: true, fill: hair, w: 4 })); }
  const blink = ((tau + seed) % 3.4) < .1;
  [-24, 24].forEach(ex => st.push(blink ? L([[ex - 9, -46], [ex + 9, -46]], { w: 5 }) : S_(ellPts(...Pt(ex, -46), 8 * s, 10 * s, 0, 14), { close: true, fill: P.ink, w: 2 })));
  if (glasses) [-24, 24].forEach(ex => st.push(S_(ellPts(...Pt(ex, -46), 20 * s, 18 * s, 0, 20), { close: true, w: 4 })));
  if (mouth === 'smile') st.push(L([[-22, -12], [0, 2], [22, -12]], { w: 5 }));
  if (mouth === 'o') st.push(S_(ellPts(...Pt(0, -6), 10 * s, 13 * s, 0, 16), { close: true, fill: P.red, w: 4 }));
  if (mouth === 'flat') st.push(L([[-18, -6], [18, -6]], { w: 5 }));
  drawArt(c, st, prog, seed, { amp: 1.6, width: 6 }); }

// ---------- props ----------
function laptopS(x, y, s, scr = P.mint) { const Pt = (u, v) => [x + u * s, y + v * s];
  return [S_([Pt(-130, -150), Pt(130, -150), Pt(130, 0), Pt(-130, 0)], { close: true, fill: P.grey, w: 6 }), S_([Pt(-112, -134), Pt(112, -134), Pt(112, -16), Pt(-112, -16)], { close: true, fill: scr, w: 4 }),
    S_([Pt(-165, 0), Pt(165, 0), Pt(150, 26), Pt(-150, 26)], { close: true, fill: '#e9e3d6', w: 6 })]; }
function codeLines(x, y, s, col = P.ink) { return [0, 1, 2, 3].map(k => S_([[x - 90 * s, y - 110 * s + k * 26 * s], [x - 90 * s + (60 + (k * 37) % 90) * s, y - 110 * s + k * 26 * s]], { w: 6, col })); }
function flask(x, y, s, liquid = P.mint) { const Pt = (u, v) => [x + u * s, y + v * s];
  return [S_([Pt(-26, -120), Pt(26, -120), Pt(26, -50), Pt(80, 60), Pt(-80, 60), Pt(-26, -50)], { close: true, fill: '#ffffff', w: 6 }), S_([Pt(-48, 0), Pt(48, 0), Pt(80, 60), Pt(-80, 60)], { close: true, fill: liquid, w: 4 })]; }
function sheet(x, y, s, rot = 0, fill = '#ffffff') { const pts = [[-50, -65], [50, -65], [50, 65], [-50, 65]].map(([u, v]) => [x + (u * Math.cos(rot) - v * Math.sin(rot)) * s, y + (u * Math.sin(rot) + v * Math.cos(rot)) * s]);
  const lines = [-35, -12, 11, 34].map(v => { const a = [-32, v], bb = [32, v]; return S_([a, bb].map(([u, w]) => [x + (u * Math.cos(rot) - w * Math.sin(rot)) * s, y + (u * Math.sin(rot) + w * Math.cos(rot)) * s]), { w: 3, col: P.grey }); });
  return [S_(pts, { close: true, fill, w: 5 }), ...lines]; }
function botS(x, y, s) { const Pt = (u, v) => [x + u * s, y + v * s];
  return [S_([Pt(-110, -90), Pt(110, -90), Pt(110, 90), Pt(-110, 90)], { close: true, fill: P.sky, w: 6 }), S_(ellPts(...Pt(-40, -20), 22 * s, 22 * s, 0, 18), { close: true, fill: '#fff', w: 5 }),
    S_(ellPts(...Pt(40, -20), 22 * s, 22 * s, 0, 18), { close: true, fill: '#fff', w: 5 }), S_([Pt(-40, 40), Pt(40, 40)], { w: 6 }), S_([Pt(0, -90), Pt(0, -140)], { w: 6 }), S_(ellPts(...Pt(0, -150), 14 * s, 14 * s, 0, 14), { close: true, fill: P.yellow, w: 4 }),
    S_([Pt(-80, 90), Pt(80, 90), Pt(80, 120), Pt(-80, 120)], { close: true, fill: P.grey, w: 5 })]; }
function checkS(x, y, r, col = P.green) { return [S_(ellPts(x, y, r, r, 0, 30), { close: true, fill: col, w: 6 }), S_([[x - r * .45, y], [x - r * .1, y + r * .35], [x + r * .5, y - r * .4]], { w: 9, col: '#ffffff' })]; }
// a twisted donut: the stellarator, as a ring with twisting bands
function stellaratorS(x, y, R, tau) { const st = [S_(ellPts(x, y, R, R * .5, 0, 60), { close: true, fill: P.violet, w: 7 }), S_(ellPts(x, y, R * .45, R * .18, 0, 40), { close: true, fill: P.paper, w: 6 })];
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + tau * .6, cx = x + Math.cos(a) * R * .72, cy = y + Math.sin(a) * R * .36;
    st.push(S_([[cx - 16, cy - 30], [cx + 10, cy - 6], [cx - 6, cy + 10], [cx + 18, cy + 32]], { w: 6, col: P.yellow })); } return st; }
function starS(x, y, r, col = P.yellow) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return [S_(pts, { close: true, fill: col, w: 6 })]; }
function telescopeS(x, y, s) { const Pt = (u, v) => [x + u * s, y + v * s];
  return [S_([Pt(-100, -20), Pt(80, -110), Pt(100, -70), Pt(-80, 20)], { close: true, fill: P.blue, w: 6 }), S_([Pt(-10, -20), Pt(-60, 120)], { w: 7 }), S_([Pt(-10, -20), Pt(40, 120)], { w: 7 }), S_([Pt(-10, -20), Pt(-10, 120)], { w: 7 })]; }
function curveS(x, y, w, h, tau) { const pts = []; for (let i = 0; i <= w; i += 8) { const ph = ((i + 30) % (w / 3)) / (w / 3), dip = ph > .44 && ph < .56 ? Math.sin((ph - .44) / .12 * Math.PI) : 0; pts.push([x + i, y + dip * h]); }
  return [S_([[x, y + h + 30], [x + w, y + h + 30]], { w: 4, col: P.grey }), S_(pts, { w: 7, col: P.blue })]; }
function funnelS(x, y, s) { const Pt = (u, v) => [x + u * s, y + v * s]; return [S_([Pt(-220, -60), Pt(220, -60), Pt(40, 120), Pt(40, 220), Pt(-40, 220), Pt(-40, 120)], { close: true, fill: P.peach, w: 7 })]; }
function brainS(x, y, s) { const st = [S_(blob(x, y, 110 * s, 80 * s, 5, { amp: .08 }), { close: true, fill: P.pink, w: 7 })];
  [[-40, -10, 30], [10, -30, 34], [50, 10, 28], [-10, 30, 26]].forEach(([u, v, r], k) => st.push(S_(ellPts(x + u * s, y + v * s, r * s, r * s * .6, k, 16).slice(0, 9), { w: 5 }))); return st; }
function magnifierS(x, y, s) { return [S_(ellPts(x, y, 46 * s, 46 * s, 0, 30), { close: true, fill: '#e8f6ff', w: 7 }), S_([[x + 32 * s, y + 32 * s], [x + 80 * s, y + 80 * s]], { w: 12 })]; }
