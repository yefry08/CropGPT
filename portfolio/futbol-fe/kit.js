/* Documentary kit for «El Espíritu Santo y el patrocinador».
   Built on core.js: paper backdrop, hand-drawn annotation, camera. 16:9, 1920x1080 logical units.
   No photographs are used anywhere: every face is a drawing, and every drawing is labelled. */

const SANS = '"Liberation Sans", "DejaVu Sans", Arial, sans-serif';
const MONO = '"DejaVu Sans Mono", ui-monospace, monospace';
const HAND = '"Comic Neue", "Comic Sans MS", cursive';
const SERIF_F = '"Liberation Serif", "Bitstream Charter", Georgia, serif';

const LOOK = makePalette({
  paper: '#ece5d6', paperBand: null, ink: '#17181c', night: '#141a24',
  chalk: '#f2ece0', chalkDim: '#8d8a80', guide: 'rgba(23,24,28,.30)',
  fills: ['#1f7a4c', '#e8b61f', '#1b3a8c', '#c8382f', '#6f6557', '#d9d2c2'],
  shade: '#4a4336', light: '#fbf7ee', blush: '#c8382f',
  accents: ['#c8382f', '#1f7a4c', '#e8b61f', '#1b3a8c'], inks: ['#17181c', '#c8382f'], finish: 'pencil',
});
const RED = '#c8382f', GREEN = '#1f7a4c', YELLOW = '#e8b61f', BLUE = '#1b3a8c', INK = '#17181c';

// ---------- type ----------
// A condensed grotesque is faked by squeezing the available sans horizontally.
function tw(c, str, o = {}) { const { size = 60, weight = 700, family = SANS, squeeze = 1 } = o; c.save(); c.font = `${weight} ${size}px ${family}`; const w = c.measureText(str).width * squeeze; c.restore(); return w; }
function txt(c, str, x, y, o = {}) {
  const { size = 60, weight = 700, family = SANS, squeeze = 1, color = PAL.ink, align = 'left', al = 1, p = 1, rise = 0, track = 0 } = o;
  if (al <= 0 || p <= 0) return 0;
  c.save(); c.font = `${weight} ${size}px ${family}`; c.textBaseline = 'alphabetic'; c.globalAlpha = al; c.fillStyle = color;
  const raw = track ? null : c.measureText(str).width, w = (track ? str.split('').reduce((a, ch) => a + c.measureText(ch).width + track, -track) : raw) * squeeze;
  const x0 = align === 'middle' || align === 'center' ? x - w / 2 : align === 'end' || align === 'right' ? x - w : x;
  if (p < 1) { c.beginPath(); c.rect(x0 - 6, y - size * 1.1, w * easeOut(p) + 12, size * 1.5); c.clip(); }
  c.translate(x0, y + (1 - (p < 1 ? easeOut(p) : 1)) * rise); c.scale(squeeze, 1);
  if (track) { let cx = 0; for (const ch of str) { c.fillText(ch, cx, 0); cx += c.measureText(ch).width + track; } } else c.fillText(str, 0, 0);
  c.restore(); return w;
}
// head: the big statement line. Condensed, heavy, wiped in from the left.
const head = (c, s, x, y, o = {}) => txt(c, s, x, y, { size: 96, weight: 700, squeeze: .88, rise: 18, ...o });
// kicker: the small monospace label above a block
const kicker = (c, s, x, y, o = {}) => txt(c, s, x, y, { size: 26, weight: 700, family: MONO, track: 3, color: alpha(PAL.ink, .72), ...o });
const cap = (c, s, x, y, o = {}) => txt(c, s, x, y, { size: 34, weight: 400, family: SERIF_F, color: alpha(PAL.ink, .82), ...o });

function wrap(c, str, maxW, o = {}) {
  const { size = 44, weight = 400, family = SERIF_F, squeeze = 1 } = o;
  c.save(); c.font = `${weight} ${size}px ${family}`;
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width * squeeze > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); c.restore(); return lines;
}
function para(c, str, x, y, maxW, o = {}) {
  const { lh = 1.36, size = 42, weight = 400, family = SANS, squeeze = 1, p = 1, stagger = .18, ...rest } = o;
  const font = { size, weight, family, squeeze };
  const lines = wrap(c, str, maxW, font);
  lines.forEach((l, i) => txt(c, l, x, y + i * size * lh, { ...font, ...rest, p: clamp((p - i * stagger) / (1 - stagger * (lines.length - 1) || 1), 0, 1) }));
  return lines.length * size * lh;
}

// ---------- frame furniture ----------
function bg(c, o = {}) {
  const { dark = 0, seed = 5 } = o;
  backdrop(c, dark ? mix(PAL.paper, PAL.night, dark) : PAL.paper, { vignette: .2, spot: .22, seed });
}
// the running band: chapter name on the left, a hairline progress rule
function band(c, chapter, u, o = {}) {
  const { al = 1 } = o; if (al <= 0) return; resetT(c);
  c.save(); c.globalAlpha = al;
  c.fillStyle = alpha(PAL.ink, .9); c.fillRect(0, H - 64, W, 64);
  txt(c, chapter, 56, H - 24, { size: 24, family: MONO, weight: 700, track: 4, color: PAL.paper });
  c.fillStyle = alpha(PAL.paper, .22); c.fillRect(56, H - 76, W - 112, 3);
  c.fillStyle = RED; c.fillRect(56, H - 76, (W - 112) * clamp(u, 0, 1), 3);
  c.restore();
}
function sourceTag(c, s, o = {}) {
  const { al = 1 } = o; if (al <= 0) return; resetT(c);
  txt(c, s, W - 56, H - 100, { size: 22, family: MONO, weight: 400, color: alpha(PAL.ink, .55), align: 'end', al });
}
// a torn paper card to hold art or a figure
function card(c, x, y, w, h, o = {}) {
  const { seed = 3, fill = PAL.light, rot = 0, p = 1, shadow = true } = o; if (p <= 0) return;
  const k = easeOutBack(clamp(p, 0, 1)); c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.scale(k, k); c.translate(-w / 2, -h / 2);
  const pts = warp(rectPts(0, 0, w, h), seed, 3.2, true, 26), path = polyPath(pts, true);
  if (shadow) { c.save(); c.translate(5, 7); c.fillStyle = 'rgba(0,0,0,.18)'; c.fill(path); c.restore(); }
  c.fillStyle = fill; c.fill(path);
  grain(c, path, [0, 0, w, h], Math.round(w * h / 420), shade(fill, .45), .05, seed + 4, 1.5);
  c.restore();
}
// hand-drawn ring around something that matters
function ring(c, cx, cy, rx, ry, p, o = {}) {
  const { color = RED, w = 7, seed = 11 } = o; if (p <= 0) return;
  c.save(); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  selfDraw(c, ellPts(cx, cy, rx, ry, (rng(seed)() - .5) * .3, 54), clamp(p, 0, 1), seed, 3, true); c.restore();
}
function underline(c, x0, x1, y, p, o = {}) {
  const { color = RED, w = 8, seed = 5 } = o; if (p <= 0) return;
  c.save(); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round';
  selfDraw(c, [[x0, y], [(x0 + x1) / 2, y + 4], [x1, y - 2]], clamp(p, 0, 1), seed, 2.4, false); c.restore();
}
function arrow(c, a, b, p, o = {}) {
  const { color = RED, w = 7, seed = 7, bend = .22 } = o; if (p <= 0) return;
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const pts = []; for (let i = 0; i <= 24; i++) pts.push(bez(a, [mx, my], [mx, my], b, i / 24));
  c.save(); c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  selfDraw(c, pts, clamp(p * 1.25, 0, 1), seed, 2, false);
  const q = clamp((p - .72) * 3.6, 0, 1);
  if (q > 0) { const ang = Math.atan2(b[1] - my, b[0] - mx), hl = 34;
    selfDraw(c, [[b[0] - hl * Math.cos(ang - .45), b[1] - hl * Math.sin(ang - .45)], b, [b[0] - hl * Math.cos(ang + .45), b[1] - hl * Math.sin(ang + .45)]], q, seed + 2, 1.6, false); }
  c.restore();
}
// a number that counts up as it lands
function bigNum(c, value, x, y, o = {}) {
  const { p = 1, size = 220, color = PAL.ink, suffix = '', decimals = 0, align = 'middle' } = o; if (p <= 0) return;
  const v = value * easeOutQuint(clamp(p, 0, 1));
  const s = (decimals ? v.toFixed(decimals) : String(Math.round(v))).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace('.', decimals ? ',' : '.');
  txt(c, s + suffix, x, y, { size, weight: 700, squeeze: .86, color, align });
}

// ---------- charts ----------
function bars(c, items, o = {}) {
  const { x = 300, y = 820, w = 1320, bh = 62, gap = 26, p = 1, max = null, label = true, fmtv = v => v } = o;
  const mx = max ?? Math.max(...items.map(i => i.v));
  items.forEach((it, k) => {
    const yy = y + k * (bh + gap), q = clamp((p - k * .12) * 1.6, 0, 1), ww = w * (it.v / mx) * easeOut(q);
    c.save(); c.fillStyle = alpha(PAL.ink, .10); c.fillRect(x, yy, w, bh); c.restore();
    c.save(); c.fillStyle = it.c || GREEN; c.fillRect(x, yy, ww, bh);
    grain(c, rectPath(x, yy, ww, bh), [x, yy, ww, bh], Math.round(ww / 3), shade(it.c || GREEN, .4), .07, 20 + k, 1.4); c.restore();
    txt(c, it.k, x - 24, yy + bh * .72, { size: 34, weight: 700, align: 'end', color: PAL.ink, al: q });
    if (label && q > .55) txt(c, fmtv(it.v * easeOut(q)), x + ww + 18, yy + bh * .72, { size: 34, weight: 700, color: it.c || GREEN, al: clamp((q - .55) * 3, 0, 1) });
  });
}
// two lines converging: the census
function lines2(c, series, o = {}) {
  const { x = 420, y = 240, w = 1080, h = 520, p = 1, ymax = 70, xs = [2000, 2010, 2022] } = o;
  c.save(); c.strokeStyle = alpha(PAL.ink, .18); c.lineWidth = 1.5;
  for (let g = 0; g <= 7; g++) { const yy = y + h * g / 7; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke();
    txt(c, (ymax - g * ymax / 7).toFixed(0) + '%', x - 18, yy + 10, { size: 26, family: MONO, weight: 400, align: 'end', color: alpha(PAL.ink, .5) }); }
  c.restore();
  xs.forEach((v, i) => txt(c, String(v), x + w * i / (xs.length - 1), y + h + 46, { size: 30, family: MONO, weight: 700, align: 'middle', color: alpha(PAL.ink, .7) }));
  series.forEach((s, si) => {
    const pts = s.v.map((v, i) => [x + w * i / (s.v.length - 1), y + h * (1 - v / ymax)]);
    const q = clamp((p - si * .18) * 1.5, 0, 1);
    c.save(); c.strokeStyle = s.c; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
    selfDraw(c, pts, q, 30 + si, 1.6, false); c.restore();
    const n = Math.min(pts.length - 1, Math.floor(q * (pts.length - 1) + .001));
    for (let i = 0; i <= n; i++) { c.save(); c.fillStyle = s.c; c.beginPath(); c.arc(pts[i][0], pts[i][1], 9, 0, TAU); c.fill(); c.restore();
      if (q > .92 || i < n) txt(c, s.v[i].toFixed(1).replace('.', ',') + '%', pts[i][0], pts[i][1] - 26, { size: 30, weight: 700, align: 'middle', color: s.c }); }
    if (q > .9) txt(c, s.k, pts[pts.length - 1][0] + 26, pts[pts.length - 1][1] + 10, { size: 36, weight: 700, color: s.c, al: clamp((q - .9) * 10, 0, 1) });
  });
}

// ---------- Brazil, simplified ----------
// Anchor points are real lon/lat; the outline is deliberately coarse and is labelled as simplified.
const BR_OUTLINE = [[-69.9,1.1],[-67.1,2.8],[-64.0,4.1],[-60.0,5.2],[-59.8,3.9],[-56.5,2.0],[-51.6,4.4],[-50.0,0.0],[-44.3,-2.5],[-38.5,-3.7],[-35.2,-5.8],[-34.8,-7.1],[-35.7,-9.7],[-38.5,-12.9],[-39.0,-17.8],[-40.3,-20.3],[-43.2,-22.9],[-48.5,-25.4],[-48.6,-28.5],[-52.2,-32.0],[-53.4,-33.7],[-57.6,-30.2],[-56.0,-27.4],[-54.6,-25.6],[-57.9,-22.1],[-58.2,-19.8],[-60.0,-16.3],[-61.0,-13.5],[-65.3,-9.8],[-70.0,-11.0],[-73.9,-7.5],[-72.9,-5.1],[-70.0,-4.1],[-69.4,-1.4]];
const BR_BOX = { lon0: -74, lon1: -34, lat0: 5.5, lat1: -34 };
function brProj(o = {}) {
  const { x = 560, y = 120, w = 800 } = o, h = w * ((BR_BOX.lat0 - BR_BOX.lat1) / (BR_BOX.lon1 - BR_BOX.lon0)) * .92;
  return ([lon, lat]) => [x + w * (lon - BR_BOX.lon0) / (BR_BOX.lon1 - BR_BOX.lon0), y + h * (BR_BOX.lat0 - lat) / (BR_BOX.lat0 - BR_BOX.lat1)];
}
function brazil(c, o = {}) {
  const { p = 1, fill = alpha(PAL.ink, .08), stroke: col = alpha(PAL.ink, .75), w = 800, x = 560, y = 120, lw = 5, seed = 41 } = o;
  if (p <= 0) return brProj(o);
  const P = brProj({ x, y, w }), pts = BR_OUTLINE.map(P), path = polyPath(smoothPts(pts, true, 4, .9), true);
  c.save(); c.fillStyle = fill; c.globalAlpha = clamp(p * 1.4, 0, 1); c.fill(path);
  grain(c, path, [x, y, w, w * 1.1], 900, shade(PAL.paper, .5), .05, seed, 1.6);
  c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = 1;
  selfDraw(c, pts, clamp(p * 1.2, 0, 1), seed, 2.2, true); c.restore();
  return P;
}
function dot(c, P, lonlat, o = {}) {
  const { p = 1, color = RED, r = 11, label = '', side = 1, size = 30 } = o; if (p <= 0) return;
  const [x, y] = P(lonlat), k = easeOutBack(clamp(p, 0, 1));
  c.save(); c.fillStyle = color; c.beginPath(); c.arc(x, y, r * k, 0, TAU); c.fill();
  c.strokeStyle = alpha(color, .45); c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * k * 2.1, 0, TAU); c.stroke(); c.restore();
  if (label) txt(c, label, x + side * (r + 14), y + 10, { size, weight: 700, color: PAL.ink, align: side > 0 ? 'left' : 'end', al: clamp((p - .4) * 2.2, 0, 1) });
}

// ---------- football ----------
function shirt(c, x, y, s, o = {}) {
  const { body = '#d9d2c2', trim = INK, p = 1, sponsor = null, num = null } = o; if (p <= 0) return;
  const k = easeOutBack(clamp(p, 0, 1)); c.save(); c.translate(x, y); c.scale(s * k, s * k);
  const pts = [[-34,-30],[-18,-40],[-8,-34],[8,-34],[18,-40],[34,-30],[46,-10],[32,2],[26,-4],[26,44],[-26,44],[-26,-4],[-32,2],[-46,-10]];
  const path = polyPath(smoothPts(pts, true, 3, .55), true);
  c.fillStyle = body; c.fill(path); c.strokeStyle = trim; c.lineWidth = 3.2; c.stroke(path);
  c.beginPath(); c.moveTo(-8, -34); c.quadraticCurveTo(0, -24, 8, -34); c.stroke();
  if (sponsor) { c.fillStyle = alpha(trim, .9); c.fillRect(-19, 2, 38, 11); }
  if (num) { c.fillStyle = trim; c.font = '700 26px ' + SANS; c.textAlign = 'center'; c.fillText(num, 0, 36); }
  c.restore();
}
function ball(c, x, y, r, o = {}) {
  const { p = 1, rot = 0 } = o; if (p <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(clamp(p, 0, 1), clamp(p, 0, 1));
  c.fillStyle = PAL.light; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.strokeStyle = INK; c.lineWidth = r * .09; c.stroke();
  c.fillStyle = INK; const pent = [];
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; pent.push([Math.cos(a) * r * .34, Math.sin(a) * r * .34]); }
  c.fill(polyPath(pent, true));
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5 + TAU / 10; c.save(); c.translate(Math.cos(a) * r * .72, Math.sin(a) * r * .72); c.rotate(a + Math.PI / 2);
    const q = []; for (let j = 0; j < 5; j++) { const b = -Math.PI / 2 + j * TAU / 5; q.push([Math.cos(b) * r * .24, Math.sin(b) * r * .24]); } c.fill(polyPath(q, true)); c.restore(); }
  c.restore();
}

// ---------- drawn portraits ----------
// Every portrait is an illustration, never a photograph, and is always captioned with the name.
// Likeness is carried by head shape, hairline, facial hair and expression — not by tracing a photo.
const FACES = {
  neymar: {
    skin: '#c88d5f', shade: '#9c6840', faceW: .80, faceH: 1.04, jaw: .62, chin: 1.12,
    hair: '#241a12', hairline: 'fade', top: '#d8b267',
    brow: { w: 8, col: '#241a12', lift: 6, tilt: .10 },
    eye: { w: 16, h: 9.5, drop: 0 }, nose: { len: 30, w: 8 },
    mouth: { w: 24, smile: 9, teeth: .5 }, beard: { kind: 'chin', col: '#241a12', al: .4 },
    ear: 1, earring: true, lines: 0, cloth: { kind: 'shirt', col: '#efe9dc' },
  },
  alves: {
    skin: '#5f3a21', shade: '#3f2514', faceW: .97, faceH: .95, jaw: .86, chin: .94,
    hair: '#15100c', hairline: 'buzz', top: null,
    brow: { w: 10, col: '#15100c', lift: 4, tilt: .05 },
    eye: { w: 16.5, h: 10, drop: 0 }, nose: { len: 27, w: 12 },
    mouth: { w: 30, smile: 13, teeth: .9 }, beard: { kind: 'goatee', col: '#15100c', al: 1 },
    ear: 1.1, earring: false, lines: .2, cloth: { kind: 'shirt', col: '#efe9dc' },
  },
  lula: {
    skin: '#c69b7b', shade: '#9b7154', faceW: 1.04, faceH: .96, jaw: .98, chin: .92,
    hair: '#dcd6c9', hairline: 'receded', top: null,
    brow: { w: 11, col: '#d8d2c6', lift: 9, tilt: .02 },
    eye: { w: 15, h: 8, drop: 3 }, nose: { len: 32, w: 13 },
    mouth: { w: 30, smile: 12, teeth: .8 }, beard: { kind: 'full', col: '#dcd6c9', al: 1 },
    ear: 1.1, earring: false, lines: 1, cloth: { kind: 'suit', col: '#2b3340', shirt: '#f4f1ea', tie: '#c8382f' },
  },
  flavio: {
    skin: '#d2a177', shade: '#a97a52', faceW: .97, faceH: 1.0, jaw: .92, chin: 1.04,
    hair: '#2a231a', hairline: 'side', top: null,
    brow: { w: 9, col: '#2a231a', lift: 5, tilt: -.04 },
    eye: { w: 15.5, h: 8.5, drop: 1 }, nose: { len: 33, w: 11 },
    mouth: { w: 27, smile: 1, teeth: 0 }, beard: { kind: 'chin', col: '#2a231a', al: .16 },
    ear: 1, earring: false, lines: .35, cloth: { kind: 'suit', col: '#1d2634', shirt: '#f6f4ee', tie: '#1b3a8c' },
  },
};
function portrait(c, who, x, y, s, o = {}) {
  const f = FACES[who]; if (!f) throw new Error('unknown face: ' + who);
  const { p = 1, name = null, role = 'ilustración', tau = 0, headband = false } = o; if (p <= 0) return;
  const k = easeOutBack(clamp(p, 0, 1));
  const RW = 70 * f.faceW, RH = 86 * f.faceH, JY = 62 * f.chin, JW = RW * f.jaw;
  c.save(); c.translate(x, y); c.scale(s * k, s * k); c.translate(0, Math.sin(tau * 1.05) * 1.6);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // ---- clothing
  const cl = f.cloth;
  c.fillStyle = cl.kind === 'suit' ? cl.col : cl.col;
  c.beginPath(); c.moveTo(-124, 230); c.bezierCurveTo(-116, 146, -66, 118, -38, 110);
  c.lineTo(38, 110); c.bezierCurveTo(66, 118, 116, 146, 124, 230); c.closePath(); c.fill();
  if (cl.kind === 'suit') {
    c.fillStyle = cl.shirt; c.beginPath(); c.moveTo(-30, 112); c.lineTo(0, 182); c.lineTo(30, 112); c.closePath(); c.fill();
    c.fillStyle = cl.tie; c.beginPath(); c.moveTo(-8, 126); c.lineTo(8, 126); c.lineTo(12, 206); c.lineTo(0, 222); c.lineTo(-12, 206); c.closePath(); c.fill();
    c.strokeStyle = alpha('#000', .35); c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(-30, 112); c.lineTo(-14, 208); c.moveTo(30, 112); c.lineTo(14, 208); c.stroke();
  } else { c.strokeStyle = alpha(f.shade, .5); c.lineWidth = 2.6; c.beginPath(); c.arc(0, 108, 34, .25, Math.PI - .25); c.stroke(); }
  c.strokeStyle = alpha(INK, .42); c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(-124, 230); c.bezierCurveTo(-116, 146, -66, 118, -38, 110); c.stroke();
  c.beginPath(); c.moveTo(124, 230); c.bezierCurveTo(116, 146, 66, 118, 38, 110); c.stroke();
  // ---- neck
  c.fillStyle = f.shade; c.beginPath(); c.moveTo(-24, 40); c.lineTo(24, 40); c.lineTo(26, 120); c.lineTo(-26, 120); c.closePath(); c.fill();
  // ---- ears
  c.fillStyle = f.skin; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * (RW - 2), 4, 11 * f.ear, 19 * f.ear, 0, 0, TAU); c.fill(); }
  // ---- head: cranium + tapering jaw, drawn as one silhouette
  c.beginPath();
  c.moveTo(-RW, -4);
  c.bezierCurveTo(-RW, -RH * .95, -RW * .52, -RH * 1.12, 0, -RH * 1.12);
  c.bezierCurveTo(RW * .52, -RH * 1.12, RW, -RH * .95, RW, -4);
  c.bezierCurveTo(RW, 30, JW + 6, JY - 22, JW * .62, JY);
  c.bezierCurveTo(JW * .3, JY + 14, -JW * .3, JY + 14, -JW * .62, JY);
  c.bezierCurveTo(-JW - 6, JY - 22, -RW, 30, -RW, -4);
  c.closePath(); c.fill();
  // cheek shading
  c.save(); c.globalAlpha = .18; c.fillStyle = f.shade;
  for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * RW * .66, 16, 15, 30, sd * .2, 0, TAU); c.fill(); } c.restore();
  // ---- hair
  c.fillStyle = f.hair;
  if (f.hairline === 'fade') {
    c.beginPath(); c.moveTo(-RW - 1, -10);
    c.bezierCurveTo(-RW - 2, -RH * .92, -RW * .5, -RH * 1.14, 0, -RH * 1.14);
    c.bezierCurveTo(RW * .5, -RH * 1.14, RW + 2, -RH * .92, RW + 1, -10);
    c.bezierCurveTo(RW * .84, -42, RW * .5, -RH * .66, 0, -RH * .66);
    c.bezierCurveTo(-RW * .5, -RH * .66, -RW * .84, -42, -RW - 1, -10); c.closePath(); c.fill();
    if (f.top) { c.fillStyle = f.top; c.beginPath();
      c.moveTo(-RW * .80, -RH * .92); c.bezierCurveTo(-RW * .62, -RH * 1.18, RW * .62, -RH * 1.18, RW * .80, -RH * .92);
      c.bezierCurveTo(RW * .52, -RH * 1.02, -RW * .52, -RH * 1.02, -RW * .80, -RH * .92); c.closePath(); c.fill();
      c.save(); c.globalAlpha = .28; c.fillStyle = f.hair; c.beginPath();
      c.moveTo(-RW * .80, -RH * .92); c.bezierCurveTo(-RW * .6, -RH * 1.02, RW * .6, -RH * 1.02, RW * .80, -RH * .92);
      c.bezierCurveTo(RW * .5, -RH * .96, -RW * .5, -RH * .96, -RW * .80, -RH * .92); c.closePath(); c.fill(); c.restore(); }
  }
  if (f.hairline === 'buzz') { c.save(); c.globalAlpha = .92; c.beginPath();
    c.moveTo(-RW - 1, -6); c.bezierCurveTo(-RW - 2, -RH * .94, -RW * .5, -RH * 1.13, 0, -RH * 1.13);
    c.bezierCurveTo(RW * .5, -RH * 1.13, RW + 2, -RH * .94, RW + 1, -6);
    c.bezierCurveTo(RW * .9, -26, RW * .5, -RH * .52, 0, -RH * .5);
    c.bezierCurveTo(-RW * .5, -RH * .52, -RW * .9, -26, -RW - 1, -6); c.closePath(); c.fill(); c.restore(); }
  if (f.hairline === 'receded') {
    c.beginPath(); c.moveTo(-RW - 2, 12);
    c.bezierCurveTo(-RW - 3, -RH * .82, -RW * .68, -RH * 1.16, 0, -RH * 1.15);
    c.bezierCurveTo(RW * .68, -RH * 1.16, RW + 3, -RH * .82, RW + 2, 12);
    c.bezierCurveTo(RW * .9, -24, RW * .74, -RH * .70, RW * .22, -RH * .78);
    c.bezierCurveTo(-RW * .28, -RH * .86, -RW * .8, -RH * .46, -RW - 2, 12); c.closePath(); c.fill();
  }
  if (f.hairline === 'side') {
    c.beginPath(); c.moveTo(-RW - 1, -16);
    c.bezierCurveTo(-RW - 2, -RH * .9, -RW * .46, -RH * 1.12, RW * .12, -RH * 1.08);
    c.bezierCurveTo(RW * .66, -RH * 1.02, RW + 1, -RH * .84, RW + 1, -16);
    c.bezierCurveTo(RW * .82, -48, RW * .3, -RH * .74, -RW * .34, -RH * .68);
    c.bezierCurveTo(-RW * .62, -RH * .64, -RW * .9, -46, -RW - 1, -16); c.closePath(); c.fill();
  }
  // ---- facial hair
  const B = f.beard;
  if (B && B.kind) {
    c.save(); c.globalAlpha = B.al; c.fillStyle = B.col;
    if (B.kind === 'full') {
      c.beginPath(); c.moveTo(-RW * .96, -2);
      c.bezierCurveTo(-RW * .92, 34, -JW - 4, JY - 18, -JW * .62, JY + 4);
      c.bezierCurveTo(-JW * .3, JY + 20, JW * .3, JY + 20, JW * .62, JY + 4);
      c.bezierCurveTo(JW + 4, JY - 18, RW * .92, 34, RW * .96, -2);
      c.bezierCurveTo(RW * .72, 24, RW * .5, 18, RW * .34, 26);
      c.bezierCurveTo(RW * .2, 44, -RW * .2, 44, -RW * .34, 26);
      c.bezierCurveTo(-RW * .5, 18, -RW * .72, 24, -RW * .96, -2); c.closePath(); c.fill();
      // moustache
      c.beginPath(); c.ellipse(0, 34, 26, 11, 0, 0, TAU); c.fill();
    }
    if (B.kind === 'goatee') {
      c.beginPath(); c.ellipse(0, 46, 30, 24, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0, 28, 24, 9, 0, 0, TAU); c.fill();
      c.globalAlpha = B.al * .35;
      c.beginPath(); c.moveTo(-RW * .9, 6); c.bezierCurveTo(-RW * .8, 40, -JW * .8, JY, 0, JY + 6);
      c.bezierCurveTo(JW * .8, JY, RW * .8, 40, RW * .9, 6);
      c.bezierCurveTo(RW * .6, 30, -RW * .6, 30, -RW * .9, 6); c.closePath(); c.fill();
    }
    if (B.kind === 'chin') { c.globalAlpha = B.al;
      c.beginPath(); c.ellipse(0, 50, 22, 15, 0, 0, TAU); c.fill();
      c.globalAlpha = B.al * .6; c.beginPath(); c.ellipse(0, 28, 19, 7, 0, 0, TAU); c.fill(); }
    c.restore();
  }
  // ---- brows
  c.strokeStyle = f.brow.col; c.lineWidth = f.brow.w; 
  for (const sd of [-1, 1]) { c.beginPath();
    c.moveTo(sd * 13, -24 - f.brow.lift + sd * f.brow.tilt * 20);
    c.quadraticCurveTo(sd * 32, -34 - f.brow.lift, sd * 50, -24 - f.brow.lift - sd * f.brow.tilt * 14); c.stroke(); }
  // ---- eyes
  const blink = (Math.sin(tau * .9 + 1.7) > .985) ? .12 : 1;
  for (const sd of [-1, 1]) {
    c.fillStyle = PAL.light; c.beginPath(); c.ellipse(sd * 31, -2 + f.eye.drop, f.eye.w, f.eye.h * blink, 0, 0, TAU); c.fill();
    c.fillStyle = '#2a1f17'; c.beginPath(); c.arc(sd * 31 + Math.sin(tau * .55) * 1.8, -1 + f.eye.drop, 6.6 * Math.max(.3, blink), 0, TAU); c.fill();
    c.fillStyle = PAL.light; c.beginPath(); c.arc(sd * 31 + 2.4, -4 + f.eye.drop, 2.1, 0, TAU); c.fill();
    c.strokeStyle = alpha(f.shade, .8); c.lineWidth = 2.6;
    c.beginPath(); c.ellipse(sd * 31, -2 + f.eye.drop, f.eye.w, f.eye.h * blink, 0, Math.PI, TAU); c.stroke();
  }
  // ---- nose
  c.strokeStyle = alpha(f.shade, .9); c.lineWidth = 4.2;
  c.beginPath(); c.moveTo(-2, -4); c.lineTo(-f.nose.w * .6, f.nose.len);
  c.quadraticCurveTo(0, f.nose.len + 7, f.nose.w * .6, f.nose.len); c.stroke();
  // ---- mouth
  const M = f.mouth, my = JY * .62;
  c.strokeStyle = alpha(f.shade, .95); c.lineWidth = 4.4;
  c.beginPath(); c.moveTo(-M.w, my); c.quadraticCurveTo(0, my + M.smile, M.w, my); c.stroke();
  if (M.teeth > 0) { c.save(); c.fillStyle = PAL.light; c.globalAlpha = M.teeth;
    c.beginPath(); c.moveTo(-M.w * .86, my + 1); c.quadraticCurveTo(0, my + M.smile * .95, M.w * .86, my + 1);
    c.quadraticCurveTo(0, my + 3, -M.w * .86, my + 1); c.closePath(); c.fill(); c.restore(); }
  // ---- age lines
  if (f.lines > 0) { c.save(); c.globalAlpha = .34 * f.lines; c.strokeStyle = f.shade; c.lineWidth = 3;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * (M.w + 12), my - 24); c.quadraticCurveTo(sd * (M.w + 20), my - 6, sd * (M.w + 6), my + 8); c.stroke(); }
    if (f.lines > .8) for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-RW * .5, -RH * .78 + i * 13); c.quadraticCurveTo(0, -RH * .86 + i * 13, RW * .5, -RH * .78 + i * 13); c.stroke(); }
    c.restore(); }
  if (f.earring) { c.fillStyle = '#d8c98a'; for (const sd of [-1, 1]) { c.beginPath(); c.arc(sd * (RW - 2), 22 * f.ear, 4.6, 0, TAU); c.fill(); } }
  if (headband) { c.fillStyle = PAL.light; c.beginPath();
    c.moveTo(-RW - 1, -RH * .56); c.bezierCurveTo(-RW * .5, -RH * .78, RW * .5, -RH * .78, RW + 1, -RH * .56);
    c.lineTo(RW + 1, -RH * .36); c.bezierCurveTo(RW * .5, -RH * .58, -RW * .5, -RH * .58, -RW - 1, -RH * .36); c.closePath(); c.fill();
    c.fillStyle = INK; c.font = '700 15px ' + SANS; c.textAlign = 'center'; c.fillText('100% JESUS', 0, -RH * .5); }
  // contour
  c.strokeStyle = alpha(INK, .30); c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(-RW, -4);
  c.bezierCurveTo(-RW, -RH * .95, -RW * .52, -RH * 1.12, 0, -RH * 1.12);
  c.bezierCurveTo(RW * .52, -RH * 1.12, RW, -RH * .95, RW, -4);
  c.bezierCurveTo(RW, 30, JW + 6, JY - 22, JW * .62, JY);
  c.bezierCurveTo(JW * .3, JY + 14, -JW * .3, JY + 14, -JW * .62, JY);
  c.bezierCurveTo(-JW - 6, JY - 22, -RW, 30, -RW, -4);
  c.closePath(); c.stroke();
  c.restore();
  if (name) {
    const ny = y + s * 262;
    txt(c, name, x, ny, { size: Math.min(44, 30 * s), weight: 700, align: 'middle', color: PAL.ink, al: clamp((p - .3) * 2, 0, 1) });
    if (role) txt(c, role, x, ny + Math.min(40, 28 * s), { size: Math.min(28, 20 * s), family: MONO, weight: 400, align: 'middle', color: alpha(PAL.ink, .55), al: clamp((p - .5) * 2, 0, 1) });
  }
}

// ---------- chapter card ----------
function chapterCard(c, n, title, sub2, t, o = {}) {
  const { dur = 4 } = o; resetT(c);
  c.fillStyle = PAL.night; c.fillRect(0, 0, W, H);
  grain(c, rectPath(0, 0, W, H), [0, 0, W, H], 2600, '#ffffff', .035, 60 + n, 1.7);
  const p = sm(.1, 1.1, t), q = sm(.5, 1.7, t), fade = 1 - sm(dur - .5, dur, t);
  c.save(); c.globalAlpha = fade;
  txt(c, String(n).padStart(2, '0'), CX, CY - 110, { size: 190, weight: 700, squeeze: .8, align: 'middle', color: alpha(PAL.paper, .16), p: 1, al: sm(0, .8, t) });
  txt(c, title.toUpperCase(), CX, CY + 10, { size: 104, weight: 700, squeeze: .86, align: 'middle', color: PAL.paper, p, track: 2 });
  c.fillStyle = RED; const bw = 190 * sm(.7, 1.4, t); c.fillRect(CX - bw / 2, CY + 54, bw, 6);
  txt(c, sub2, CX, CY + 132, { size: 36, family: MONO, weight: 400, align: 'middle', color: alpha(PAL.paper, .66), p: q });
  c.restore();
}
