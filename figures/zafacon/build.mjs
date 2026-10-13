// Zafacón inteligente de Ready Recycling: un panal de cinco módulos hexagonales,
// el de plástico abierto en corte para enseñar la placa de compresión, los sensores,
// el ESP32 y la energía. `node build.mjs` escribe zafacon.html; `--light` el tema claro.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 440;

// World units are centimetres. Hexagons have a vertex pointing at the viewer (45°),
// so each module shows two faces: k = 0 (normal 75°) and k = 5 (normal 15°).
const R = M.R; // outer circumradius of a module
const WALL = 1.6;
const GAP = 1.6;
const DC = Math.sqrt(3) * R + GAP;
const Z = M.Z;

const rad = (a) => (a * Math.PI) / 180;
const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const add = (c, v, s = 1) => [c[0] + v[0] * s, c[1] + v[1] * s];
const hexPts = (c, r) => Array.from({ length: 6 }, (_, i) => add(c, dir(45 + 60 * i), r));
const vertex = (c, r, i) => add(c, dir(45 + 60 * (((i % 6) + 6) % 6)), r);
const normalOf = (i) => 75 + 60 * i;
const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

const CELLS = [
  { key: "metal", name: "Metal", at: add([0, 0], dir(195), DC), entry: "metal" },
  { key: "organico", name: "Orgánico", at: add([0, 0], dir(255), DC), entry: "organico" },
  { key: "papel", name: "Papel y cartón", at: add([0, 0], dir(135), DC), entry: "papel" },
  { key: "vidrio", name: "Vidrio", at: add([0, 0], dir(315), DC), entry: "vidrio" },
  { key: "plastico", name: "Plástico", at: [0, 0], entry: "plastico", cut: true },
];

const fitPoints = [];
for (const cell of CELLS) for (const [x, y] of hexPts(cell.at, R + 1.2)) fitPoints.push([x, y, 0], [x, y, Z.capTop]);
fitPoints.push([...add([0, 0], dir(225), 27), Z.capTop + Z.lift + 15]);
for (const [x, y] of hexPts([0, 0], R + 1.2)) fitPoints.push([x, y, Z.capTop + Z.lift]);
const P = k.fitProjection(fitPoints, WIDTH, HEIGHT, { pad: 26, azimuth: 45 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth2 = (p) => k.depthOf([p[0], p[1], 0], P);
const byDepth = (list, get = (x) => x) => [...list].sort((a, b) => depth2(get(a)) - depth2(get(b)));
const poly3 = (points, closed = false) => k.pathOf(points.map(at), closed);

// A box lying on the floor, rotated: centre, length along `angle`, width across it.
const boxRing = (c, len, wid, angle) => {
  const u = dir(angle);
  const v = dir(angle + 90);
  return [
    add(add(c, u, -len / 2), v, -wid / 2),
    add(add(c, u, len / 2), v, -wid / 2),
    add(add(c, u, len / 2), v, wid / 2),
    add(add(c, u, -len / 2), v, wid / 2),
  ];
};
const box = (c, len, wid, angle, z, h, bevel = 0) => k.extrude(boxRing(c, len, wid, angle), z, h, P, { bevel });

// A frame on the outer face i of the cell at c: s is out of the face, x along it, y up.
const faceFrame = (c, i, z = 0, outward = R * Math.cos(Math.PI / 6)) => {
  const n = dir(normalOf(i));
  const o = add(c, n, outward);
  return G.frameOf([o[0], o[1], z], [n[0], n[1], 0], [...dir(normalOf(i) + 90), 0], [0, 0, 1]);
};
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const roundRect = (x0, y0, x1, y1, r, steps = 4) => {
  const out = [];
  const cs = [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180], [x1 - r, y0 + r, 270]];
  for (const [cx, cy, a0] of cs) for (let j = 0; j <= steps; j++) { const a = rad(a0 + (90 * j) / steps); out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
};
const facePoint = (F, s, x, y) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];
const facePoly = (F, s, pts, closed = true) => k.pathOf(pts.map(([x, y]) => at(facePoint(F, s, x, y))), closed);

// One wall slab of a cut module: face i between fractions f0 and f1 of its length.
function wallRing(c, i, f0, f1, rOut = R, t = WALL) {
  const n = dir(normalOf(i));
  const a = vertex(c, rOut, i);
  const b = vertex(c, rOut, i + 1);
  const rIn = rOut - t / Math.cos(Math.PI / 6);
  const outer = (f) => lerp2(a, b, f);
  const inner = (f) => (f <= 0 ? vertex(c, rIn, i) : f >= 1 ? vertex(c, rIn, i + 1) : add(outer(f), n, -t));
  return [outer(f0), outer(f1), inner(f1), inner(f0)];
}

const tint = (key, body) => `<g class="zf-tint" style="--cat:var(--zf-${key})">${body}</g>`;
const band = (key, body) => `<g class="zf-band" style="--cat:var(--zf-${key})">${body}</g>`;

function feet(c) {
  const out = [];
  for (const p of byDepth(hexPts(c, R - 5))) {
    out.push(S(k.cylinder(p[0], p[1], 3.4, Z.floor, 0.8, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(p[0], p[1], 2.2, Z.floor + 0.8, Z.plinth - Z.floor - 0.8, P, 20), { tone: "mid", crease: "none" }));
  }
  return out.join("");
}

function plinth(c) {
  const ring = hexPts(c, R - 2.5);
  return S(k.extrude(ring, Z.plinth, Z.body - Z.plinth, P, {}), { tone: "lo" });
}

// The entry ("boca") on face 0 of each module: its shape is the first sort.
function shifted(F, dx) { return G.frameOf(add2(F.o, F.u, dx), F.a, F.u, F.v); }
function entry(c, kind, dx = 0, cut = false) {
  const F = shifted(faceFrame(c, 0, Z.entry), dx);
  const out = [];
  const hole = (d) => `<path class="zf-hole" d="${d}"/>`;
  if (kind === "plastico" || kind === "vidrio" || kind === "metal") {
    const [rIn, rOut] = kind === "plastico" ? [5.6, 7.6] : kind === "vidrio" ? [4.6, 6.6] : [3.4, 5.2];
    const FC = G.frameOf(F.o, F.a, F.u, F.v);
    out.push(S(G.ringBand(0, 1.3, rIn, rOut, FC, P), { tone: "mid" }));
    out.push(hole(G.circleOf(FC, 1.3, rIn, P)));
    out.push(L(G.arcOf(FC, 1.3, rIn, P, { inward: true, least: -1 }), { tone: "lo" }));
    if (kind === "vidrio") out.push(L(G.spokesOf(FC, 1.25, 0.6, rIn - 0.2, 8, P), { tone: "lo" }), L(G.circleOf(FC, 1.25, 0.6, P), { tone: "lo" }));
    if (kind === "plastico") out.push(`<g class="zf-ring"${cut ? ' data-part="ring"' : ""}>${L(G.circleOf(FC, 1.3, rIn + 1, P), { tone: "faint" })}</g>`);
  } else if (kind === "papel") {
    out.push(S(G.prismOf(F, roundRect(-10.5, -2.6, 10.5, 2.6, 2.4), 0, 1.1, P), { tone: "mid" }));
    out.push(`<path class="zf-hole" d="${facePoly(F, 1.12, roundRect(-9, -1.1, 9, 1.1, 1))}"/>`);
  } else {
    out.push(S(G.prismOf(F, rect(-8, -6.5, 8, 6.5), 0, 0.7, P), { tone: "mid" }));
    out.push(S(G.prismOf(F, rect(-6.6, -5.4, 6.6, 4.6), 0.7, 1.4, P), { tone: "hi" }));
    out.push(S(G.prismOf(F, roundRect(-3, -4.2, 3, -2.8, 0.6), 1.4, 2.4, P), { tone: "mid" }));
    out.push(S(G.prismOf(F, rect(-6.6, 4.6, 6.6, 5.6), 0.7, 1.6, P), { tone: "lo" }));
  }
  return out.join("");
}

// The status LED above the entry, and its bezel.
function led(c, cut) {
  const F = faceFrame(c, 0, Z.led);
  const FL = G.frameOf(add2(F.o, F.u, 9), F.a, F.u, F.v);
  return S(G.disc(0, 0.6, 2, FL, P), { tone: "mid" }) + `<g${cut ? ' data-part="led"' : ""} class="zf-led">${S(G.disc(0.6, 1.2, 1.2, FL, P), { tone: "lo" })}</g>`;
}
function add2(o, v, s) { return [o[0] + v[0] * s, o[1] + v[1] * s, o[2] + v[2] * s]; }

// A label plate under the entry: three rule lines stand for printed text.
function labelPlate(c, dx = 0) {
  const F = shifted(faceFrame(c, 0, Z.label), dx);
  const out = [S(G.prismOf(F, roundRect(-7, -3, 7, 3, 0.8), 0, 0.5, P), { tone: "mid" })];
  [[-5, 1.2, 5], [-5, 0, 2.6], [-5, -1.2, 3.8]].forEach(([x0, y, x1]) => out.push(L(k.pathOf([at(facePoint(F, 0.5, x0, y)), at(facePoint(F, 0.5, x1, y))]), { tone: "lo", free: true })));
  out.push(D([at(facePoint(F, 0.5, -6.2, 0)), at(facePoint(F, 0.5, 6.2, 0))], { size: 0.4 }));
  return out.join("");
}

// The ribbon of category colour round the head of each module.
function colourBand(c, key, skipWindow = false) {
  const ring = hexPts(c, R + 0.5);
  if (!skipWindow) return band(key, S(k.extrude(ring, Z.band, Z.bandH, P, {}), { tone: "mid", inner: L(k.ringSeam(ring, Z.band + Z.bandH / 2, P), { tone: "faint" }) }));
  const out = [];
  out.push(band(key, S(k.extrude(wallRing(c, 0, 0, 1, R + 0.5, 2.1), Z.band, Z.bandH, P, {}), { tone: "mid" })));
  out.push(band(key, S(k.extrude(wallRing(c, 5, 0, 1, R + 0.5, 2.1), Z.band, Z.bandH, P, {}), { tone: "mid" })));
  return out.join("");
}

function cap(c, key, lift = 0) {
  const ring = hexPts(c, R + 1.2);
  const z0 = Z.cap + lift, z1 = Z.capTop + lift;
  const out = [S(k.extrude(ring, z0, z1 - z0, P, { bevel: 0.8 }), { tone: "mid", inner: L(k.ringSeam(ring, z0 + 1.4, P), { tone: "faint" }) })];
  out.push(L(k.onTop(hexPts(c, R - 2.4), z1, P, true), { tone: "faint" }));
  out.push(D(hexPts(c, R - 4.4).map(([x, y]) => at([x, y, z1])), { size: 0.45 }));
  if (!lift) {
    // the category disc inlaid in the lid, and a recessed lifting grip behind it
    const d = add(c, dir(45), 4);
    out.push(band(key, S(k.cylinder(d[0], d[1], 7.5, z1, 0.4, P, 48), { tone: "mid", crease: "none" })));
    out.push(L(k.ring(d[0], d[1], 5.4, z1 + 0.4, P, 40), { tone: "faint" }));
    out.push(L(k.onTop(boxRing(add(c, dir(225), 13), 14, 3, 135), z1, P, true), { tone: "lo" }));
  }
  return out.join("");
}

function module(cell) {
  const { at: c, key } = cell;
  const out = [];
  out.push(`<path class="iso-halo" d="${k.extrude(hexPts(c, R), Z.floor, 0.1, P).fill}"/>`);
  out.push(feet(c), plinth(c));
  const ring = hexPts(c, R);
  const seams = L(k.ringSeam(ring, Z.seam, P), { tone: "faint" }) + L(k.ringSeam(ring, Z.body + 2.4, P), { tone: "faint" });
  out.push(tint(key, S(k.extrude(ring, Z.body, Z.cap - Z.body, P, {}), { tone: "mid", inner: seams })));
  out.push(colourBand(c, key));
  out.push(tint(key, entry(c, cell.entry)), labelPlate(c), led(c, false));
  out.push(cap(c, key));
  return out.join("");
}

// ---------- the cut module (plástico) ----------
const C0 = [0, 0];
const SENSOR = add(C0, dir(45), M.SENSOR_R);
const LOAD_CELLS = [15, 135, 255].map((a) => add(C0, dir(a), 19));

function backWalls() {
  const out = [];
  for (const i of [3, 2, 4, 1]) out.push(S(k.extrude(wallRing(C0, i, 0, 1), Z.body, Z.cap - Z.body, P, {}), { tone: "mid" }));
  return `<g class="zf-cavity">${out.join("")}</g>`;
}

// Electronics on the inner face of the back wall (k = 2, normal 195°, facing the window).
const FW = (() => {
  const n = dir(15);
  const o = add(C0, dir(195), R * Math.cos(Math.PI / 6) - WALL);
  return G.frameOf([o[0], o[1], 0], [n[0], n[1], 0], [...dir(105), 0], [0, 0, 1]);
})();
const W = (s, x, y) => facePoint(FW, s, x, y);

function electronics() {
  const out = [];
  const pr = (poly, s0, s1, style) => out.push(S(G.prismOf(FW, poly, s0, s1, P), style));
  // backplate with four screws
  pr(roundRect(-12.5, 87, 12.5, 102.6, 0.8), 0, 0.6, { tone: "mid" });
  out.push(D([[-11.4, 88.1], [11.4, 88.1], [-11.4, 101.5], [11.4, 101.5]].map(([x, y]) => at(W(0.6, x, y))), { size: 0.45 }));
  // terminal strip with eight screw terminals
  pr(rect(-11, 99.6, 11, 101.2), 0.6, 1.8, { tone: "mid" });
  out.push(D(Array.from({ length: 8 }, (_, j) => at(W(1.8, -9.6 + j * 2.74, 100.4))), { size: 0.42, tone: "hi" }));
  // ESP32 dev board (2.8 × 5.5 cm) with its shielded module and pin headers
  pr(rect(-10.6, 91.2, -7.8, 96.7), 0.6, 1.0, { tone: "mid" });
  pr(rect(-10.3, 94.3, -8.1, 96.4), 1.0, 1.35, { tone: "hi" });
  out.push(L(k.pathOf([at(W(1.35, -9.9, 95.9)), at(W(1.35, -8.5, 95.9))]), { tone: "lo", free: true }));
  out.push(D(Array.from({ length: 7 }, (_, j) => [-10.35, 91.5 + j * 0.42]).concat(Array.from({ length: 7 }, (_, j) => [-8.05, 91.5 + j * 0.42])).map(([x, y]) => at(W(1.0, x, y))), { size: 0.28, tone: "lo" }));
  // LoRaWAN radio module
  pr(rect(-6.8, 93.2, -4.6, 95.4), 0.6, 1.0, { tone: "mid" });
  pr(rect(-6.4, 93.6, -5.0, 95.0), 1.0, 1.25, { tone: "hi" });
  // charge controller for the solar panel, with an inductor
  pr(rect(-3.4, 96.6, 0.8, 98.8), 0.6, 1.0, { tone: "mid" });
  pr(rect(-2.6, 97.1, -1.0, 98.4), 1.0, 1.9, { tone: "hi" });
  // temperature sensor (fire risk)
  pr(roundRect(3.0, 96.8, 4.6, 98.6, 0.5), 0.6, 1.5, { tone: "hi" });
  // battery tray and three 18650 cells lying along the wall
  pr(rect(1.2, 88.4, 10.6, 95.6), 0.6, 1.0, { tone: "lo" });
  for (const y of [94.0, 92.0, 90.0]) {
    const F = G.frameOf(W(1.0 + 0.95, 2.2, y), FW.u, FW.a, FW.v);
    out.push(S(G.disc(0, 6.5, 0.9, F, P), { tone: "hi" }));
    out.push(S(G.disc(6.5, 6.75, 0.36, F, P), { tone: "mid" }));
  }
  // wires: ESP32 → terminals, controller → battery, LoRa coax up to the lid antenna
  out.push(k.wireSvg(at(W(1.0, -9.2, 96.7)), at(W(1.8, -9.6, 99.6)), { size: 0.45 }));
  out.push(k.wireSvg(at(W(1.0, -5.7, 95.4)), at(W(1.8, -4.1, 99.6)), { size: 0.45 }));
  out.push(k.wireSvg(at(W(1.0, 0.2, 96.6)), at(W(1.0, 2.4, 95.6)), { size: 0.45 }));
  out.push(k.wireSvg(at(W(1.5, 3.8, 98.6)), at(W(1.8, 4.1, 99.6)), { size: 0.45 }));
  // solar lead from the rim gland down the wall to the charge controller
  out.push(k.wireSvg(at(W(0.2, -15.4, Z.cap - 2.4)), at(W(1.0, -1.2, 98.8)), { via: [at(W(0.2, -15.4, 101.2))], size: 0.45, ends: "to" }));
  // load-cell cable runs down the wall to the weighing tray
  out.push(k.wireSvg(at(W(0.6, -0.8, 87)), at(W(0.3, -0.8, Z.tray + 0.1)), { size: 0.5, ends: "from" }));
  return out.join("");
}

function trayAndCells() {
  const out = [];
  for (const [x, y] of byDepth(LOAD_CELLS)) {
    out.push(S(k.cylinder(x, y, 4, Z.body, 1, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 3, Z.body + 1, 3.6, P, 28), { tone: "hi", inner: L(k.sideArc(x, y, 3, Z.body + 3, P, 20), { tone: "faint" }) }));
    out.push(S(k.cylinder(x, y, 1.4, Z.body + 4.6, Z.tray - Z.body - 4.6, P, 16), { tone: "mid" }));
  }
  const ring = hexPts(C0, R - 4.6);
  out.push(S(k.extrude(ring, Z.tray, Z.trayTop - Z.tray, P, { bevel: 0.6 }), { tone: "mid" }));
  out.push(L(k.onTop(hexPts(C0, R - 7.5), Z.trayTop, P, true), { tone: "faint" }));
  return out.join("");
}

// PET bottle, 500 ml: 20.5 cm long, 6.4 cm across.
const BOTTLE = [[0, 2.7], [0.5, 3.15, 1], [1.2, 3.2], [12.6, 3.2], [13.8, 3.05, 1], [15.6, 2.3, 1], [17.2, 1.45, 1], [18.0, 1.3], [18.0, 1.5], [20.4, 1.5]];
function bottle(o, axis) {
  const F = G.frameAlong(o, axis);
  const cap = G.frameAlong(G.add3(o, G.mul3(G.unit3(axis), 18)), axis);
  return S(G.solidOf(BOTTLE.slice(0, 8), F, P), { tone: "hi", inner: L(G.arcOf(F, 6, 3.2, P), { tone: "faint" }) + L(G.arcOf(F, 9, 3.2, P), { tone: "faint" }) }) + S(G.disc(0, 2.4, 1.5, cap, P), { tone: "mid" });
}
const TOP_REF = 50;
const LYING = [[-9, 7, 18], [7, -9, 104], [11, 9, 152], [-12, -7, 62]];
function topBottles() {
  const list = LYING.map(([x, y, a]) => { const d = dir(a); return { c: [x, y], o: [x - d[0] * 10, y - d[1] * 10, TOP_REF + 2], a: [d[0], d[1], 0] }; });
  return byDepth(list, (b) => b.c).map((b) => bottle(b.o, b.a)).join("");
}
const DROP_AT = add(C0, dir(70), 14);
const DROP_REF = 60;
function dropBottle() {
  const a = G.unit3([0.35, -0.25, -1]);
  return bottle([DROP_AT[0] - a[0] * 10, DROP_AT[1] - a[1] * 10, DROP_REF - a[2] * 10], a);
}

function plate() {
  const out = [];
  const ring = hexPts(C0, M.PLATE_R);
  const top = Z.plateHome + M.PLATE_T;
  const ribs = hexPts(C0, M.PLATE_R - 1.2).map(([x, y]) => L(k.lineOnTop(add(C0, dir(Math.atan2(y, x) * 180 / Math.PI), 3.4), [x, y], top, P), { tone: "lo" })).join("");
  out.push(S(k.extrude(ring, Z.plateHome, M.PLATE_T, P, { bevel: 0.8 }), { tone: "hi", lit: true, crease: "lo", inner: ribs + L(k.onTop(hexPts(C0, M.PLATE_R - 6), top, P, true), { tone: "lo" }) }));
  out.push(`<path class="zf-hole" d="${k.ring(SENSOR[0], SENSOR[1], 1.5, top, P, 20)}"/>`, L(k.ring(SENSOR[0], SENSOR[1], 2.3, top, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 3.4, top, 1.6, P, 28), { tone: "mid", inner: "" }));
  out.push(D(Array.from({ length: 4 }, (_, j) => at([Math.cos(j * Math.PI / 2 + 0.6) * 2.4, Math.sin(j * Math.PI / 2 + 0.6) * 2.4, top + 1.6])), { size: 0.35 }));
  return out.join("");
}

function head() {
  const out = [];
  // actuator body, gland and motor hang from the cross beam under the lid
  out.push(S(k.cylinder(0, 0, 1.9, Z.gland, Z.actuator - Z.gland, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 2.6, Z.actuator, Z.gear - Z.actuator, P, 28), { tone: "mid", inner: L(k.sideArc(0, 0, 2.6, Z.actuator + 2, P, 20), { tone: "faint" }) }));
  const mc = add(C0, dir(315), 6.4);
  out.push(S(k.cylinder(mc[0], mc[1], 2.3, Z.actuator - 1, Z.gear - Z.actuator + 1, P, 24), { tone: "hi", inner: L(k.knurl(mc[0], mc[1], 2.3, Z.actuator - 0.2, Z.gear - 0.6, 14, P), { tone: "faint" }) }));
  out.push(S(box(add(C0, dir(315), 3), 12, 6, 135, Z.gear, Z.beam - Z.gear, 0.4), { tone: "mid" }));
  out.push(D([add(C0, dir(315), -1.6), add(C0, dir(315), 7.6)].map(([x, y]) => at([x, y, Z.beam])), { size: 0.35 }));
  // cross beam between the walls at 135° and 315°
  const half = R * Math.cos(Math.PI / 6) - WALL;
  out.push(S(box(C0, half * 2, 4.4, 135, Z.beam, Z.beamTop - Z.beam, 0.5), { tone: "mid", inner: "" }));
  out.push(L(k.onTop(boxRing(C0, half * 2, 1.4, 135), Z.beamTop, P, true), { tone: "faint" }));
  out.push(D([-20, -8, 8, 20].map((s) => at([...add(C0, dir(135), s), Z.beamTop])), { size: 0.4 }));
  // the ToF bracket and the VL53L0X board looking down through the plate's hole
  const armC = add(C0, dir(45), (2.2 + M.SENSOR_R + 1.6) / 2);
  out.push(S(box(armC, M.SENSOR_R + 1.6 - 2.2, 2, 45, Z.beam - 1.4, 1.4, 0.3), { tone: "mid" }));
  out.push(S(box(SENSOR, 3, 2.6, 45, Z.tof, Z.beam - 1.4 - Z.tof, 0.3), { tone: "hi" }));
  out.push(S(k.cylinder(SENSOR[0], SENSOR[1], 0.6, Z.lens, Z.tof - Z.lens, P, 14), { tone: "lo" }));
  // harness along the beam: terminals → motor, terminals → ToF board
  const along = (s, z) => [...add(C0, dir(135), s), z];
  out.push(k.wireSvg(at(along(half - 0.4, Z.beamTop)), at([...add(C0, dir(315), -1.0), Z.beamTop]), { size: 0.5 }));
  out.push(k.wireSvg(at([...add(C0, dir(45), 1.4), Z.beamTop]), at([...SENSOR, Z.beam - 1.4]), { via: [at([...add(C0, dir(45), 2.2), Z.beam - 1.4])], size: 0.5, ends: "to" }));
  return out.join("");
}

// Front walls: k = 0 whole, k = 5 cut into a sill, a header and two jambs round the window.
function frontWalls() {
  const out = [];
  // the corner round the front vertex is cut away between the sill and the header
  const pieces = [
    [5, 0, 1, Z.body, Z.sill], [0, 0, 1, Z.body, Z.sill],
    [5, 0, 1 - M.CUT5, Z.sill, Z.header], [0, M.CUT0, 1, Z.sill, Z.header],
    [5, 0, 1, Z.header, Z.cap], [0, 0, 1, Z.header, Z.cap],
  ];
  for (const [i, f0, f1, z0, z1] of pieces) out.push(tint("plastico", S(k.extrude(wallRing(C0, i, f0, f1), z0, z1 - z0, P, {}), { tone: "mid" })));
  return out.join("");
}

function solar(lift) {
  const out = [];
  const c = add(C0, dir(45), 3);
  const base = Z.capTop + lift;
  out.push(S(box(c, 30, 17, 135, base, 0.9, 0.4), { tone: "mid" }));
  const top = base + 0.9;
  const u = dir(135);
  const v = dir(225);
  const pt = (a, b) => add(add(c, u, a), v, b);
  const inner = [pt(-14, -7.5), pt(14, -7.5), pt(14, 7.5), pt(-14, 7.5)];
  out.push(`<path class="zf-cell" d="${k.onTop(inner, top, P, true)}"/>`);
  const grid = [];
  for (let j = 1; j < 6; j++) grid.push(k.lineOnTop(pt(-14 + j * 28 / 6, -7.5), pt(-14 + j * 28 / 6, 7.5), top, P));
  for (let j = 1; j < 3; j++) grid.push(k.lineOnTop(pt(-14, -7.5 + j * 5), pt(14, -7.5 + j * 5), top, P));
  out.push(L(grid.join(""), { tone: "faint" }), L(k.onTop(inner, top, P, true), { tone: "lo" }));
  // whip antenna for LoRaWAN / 4G at the back corner of the lid
  const ant = add(C0, dir(225), 26);
  out.push(S(k.cylinder(ant[0], ant[1], 1.6, base, 1.4, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(ant[0], ant[1], 0.55, base + 1.4, 12, P, 14), { tone: "mid", crease: "none", inner: L(k.sideArc(ant[0], ant[1], 0.55, base + 5, P, 10), { tone: "faint" }) }));
  out.push(`<g data-part="ant">${D([at([ant[0], ant[1], base + 13.4])], { size: 0.9, tone: "hi" })}</g>`);
  return out.join("");
}

// clips that join neighbouring modules across the gap, on the lids
function clips() {
  const out = [];
  for (let a = 0; a < CELLS.length; a++) for (let b = a + 1; b < CELLS.length; b++) {
    const A = CELLS[a].at, B = CELLS[b].at;
    if (Math.hypot(A[0] - B[0], A[1] - B[1]) > DC + 0.5 || CELLS[a].cut || CELLS[b].cut) continue;
    const mid = lerp2(A, B, 0.5);
    const ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
    out.push({ mid, svg: S(box(mid, 9, 4, ang, Z.capTop, 0.7, 0.3), { tone: "mid" }) + D([add(mid, dir(ang), -3), add(mid, dir(ang), 3)].map(([x, y]) => at([x, y, Z.capTop + 0.7])), { size: 0.4 }) });
  }
  return byDepth(out, (o) => o.mid).map((o) => o.svg).join("");
}

function cutModule() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.extrude(hexPts(C0, R), Z.floor, 0.1, P).fill}"/>`);
  out.push(feet(C0), plinth(C0));
  out.push(backWalls(), `<g class="zf-cavity">${electronics()}</g>`);
  out.push(trayAndCells());
  out.push(`<g data-part="pile"></g>`);
  out.push(`<g data-part="top" opacity="0">${topBottles()}</g>`);
  out.push(`<g data-part="drop" opacity="0">${dropBottle()}</g>`);
  out.push(`<path data-part="beam-low" class="iso-line zf-beam" data-tone="lit" d=""/>`);
  out.push(`<g data-part="plate">${plate()}</g>`);
  out.push(`<g data-part="rod"></g>`);
  out.push(head());
  out.push(`<path data-part="beam-up" class="iso-line zf-beam" data-tone="lit" d=""/>`);
  out.push(frontWalls());
  out.push(colourBand(C0, "plastico", true));
  out.push(tint("plastico", entry(C0, "plastico", M.ENTRY_DX, true)), labelPlate(C0, M.ENTRY_DX), led(C0, true));
  out.push(L(k.onTop(hexPts(C0, R - WALL / 2 / Math.cos(Math.PI / 6)), Z.cap, P, true), { tone: "lo" }));
  out.push(solarCable(), cap(C0, "plastico", Z.lift), solar(Z.lift));
  return out.join("");
}

// the solar lead hangs from the lifted lid to a gland on the back rim, then runs down to the charge controller
function solarCable() {
  const corner = vertex(C0, R - WALL, 2);
  const gland = add(corner, dir(15), 2.2);
  const out = [S(k.cylinder(gland[0], gland[1], 1.1, Z.cap - 2.4, 2.4, P, 16), { tone: "mid" })];
  const lid = add(C0, dir(195), 18);
  out.push(k.wireSvg(at([gland[0], gland[1], Z.cap]), at([lid[0], lid[1], Z.cap + Z.lift]), { via: [at([gland[0], gland[1], Z.cap + 6]), at([lid[0] + 1, lid[1], Z.cap + Z.lift - 8])], size: 0.5, ends: "from" }));
  return out.join("");
}

const others = byDepth(CELLS.filter((c) => !c.cut), (c) => c.at);
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Cinco zafacones hexagonales de plástico reciclado acoplados en panal, uno por tipo de residuo. El de plástico está abierto en corte: dentro se ven la placa de compresión colgada de un actuador lineal, el sensor de distancia que mide el llenado, la bandeja sobre tres celdas de carga, la placa con el ESP32, la radio y la batería, y en la tapa el panel solar y la antena.",
  body: [...others.map(module), clips(), cutModule()],
});

const CSS = `
.iso{--k-s0:var(--anatomy-shade-0);--k-s1:var(--anatomy-shade-1);--k-s2:var(--anatomy-shade-2);--k-s3:var(--anatomy-shade-3);--k-top:var(--anatomy-top);
  --zf-plastico:#e0b43a;--zf-papel:#3f7fd0;--zf-vidrio:#3c9a5c;--zf-metal:#c4473d;--zf-organico:#8a5a32;--zf-hole:#050505;--zf-cell:#16233a;--zf-alert:#ff4a3d}
.iso[data-theme="light"]{--zf-plastico:#d9a521;--zf-papel:#2f6fc4;--zf-vidrio:#2f8a4e;--zf-metal:#b83a30;--zf-organico:#7d4f2a;--zf-hole:#2c2c30;--zf-cell:#3a4f72;--zf-alert:#e2251a}
.zf-tint{--anatomy-shade-0:color-mix(in oklab,var(--cat) 16%,var(--k-s0));--anatomy-shade-1:color-mix(in oklab,var(--cat) 16%,var(--k-s1));--anatomy-shade-2:color-mix(in oklab,var(--cat) 16%,var(--k-s2));--anatomy-shade-3:color-mix(in oklab,var(--cat) 16%,var(--k-s3));--anatomy-top:color-mix(in oklab,var(--cat) 14%,var(--k-top))}
.zf-band{--anatomy-shade-0:color-mix(in oklab,var(--cat) 62%,var(--k-s0));--anatomy-shade-1:color-mix(in oklab,var(--cat) 66%,var(--k-s1));--anatomy-shade-2:color-mix(in oklab,var(--cat) 70%,var(--k-s2));--anatomy-shade-3:color-mix(in oklab,var(--cat) 74%,var(--k-s3));--anatomy-top:color-mix(in oklab,var(--cat) 70%,var(--k-top))}
.iso[data-theme="light"] .zf-cavity{--anatomy-shade-0:#d2d2d0;--anatomy-shade-1:#d8d8d6;--anatomy-shade-2:#dddddb;--anatomy-shade-3:#e2e2e0;--anatomy-top:#e6e6e4}
.iso:not([data-theme="light"]) .zf-cavity{--anatomy-shade-0:#0e0e0e;--anatomy-shade-1:#121212;--anatomy-shade-2:#151515;--anatomy-shade-3:#181818;--anatomy-top:#1b1b1b}
.zf-hole{fill:var(--zf-hole);stroke:none}
.zf-cell{fill:var(--zf-cell);stroke:none;opacity:.85}
.zf-beam{stroke-dasharray:.01 2.2;stroke-width:1.3;stroke-linecap:round}
.zf-led .iso-top,.zf-led .iso-shade{transition:fill .4s}
.zf-led[data-on] .iso-top,.zf-led[data-on] .iso-shade,.zf-led[data-on] .iso-fill{fill:var(--zf-alert)}
.zf-led[data-on] .iso-edge{stroke:var(--zf-alert)}
.zf-ring[data-on] .iso-line{stroke:var(--zf-alert);stroke-width:1.4}
[data-part="ant"][data-on] circle{fill:var(--zf-alert);stroke:var(--zf-alert)}
.zf-chips{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font:inherit;font-size:12px;color:var(--anatomy-muted)}
.zf-chip{display:inline-flex;align-items:center;gap:7px}
.zf-chip i{width:11px;height:11px;border-radius:2px;background:var(--c);display:inline-block}
`;

// crushed bottles seen in the faces of the compacted bale: [face, fraction along it, height share]
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const SPECKS = Array.from({ length: 70 }, () => [rnd() < 0.5 ? 0 : 5, 0.06 + rnd() * 0.88, rnd(), 0.35 + rnd() * 0.35]);

const live = `
const P = ${JSON.stringify(P)};
const M = ${JSON.stringify(M.CONST)};
const Z = ${JSON.stringify(Z)};
const SENSOR = ${JSON.stringify(SENSOR)};
const DROP_AT = ${JSON.stringify(DROP_AT)};
const SPECKS = ${JSON.stringify(SPECKS.map((v) => v.map((n) => +n.toFixed(3))))};
const TOP_REF = ${TOP_REF}, DROP_REF = ${DROP_REF};
${M.stepSource}
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector('[data-part="' + name + '"]');
const pileEl = q("pile"), topEl = q("top"), dropEl = q("drop"), plateEl = q("plate"), rodEl = q("rod");
const ringEl = q("ring"), lowEl = q("beam-low"), upEl = q("beam-up"), ledEl = q("led"), antEl = q("ant");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const hex = (r) => Array.from({ length: 6 }, (_, i) => [r * Math.cos((45 + 60 * i) * Math.PI / 180), r * Math.sin((45 + 60 * i) * Math.PI / 180)]);
const PILE = hex(M.PILE_R), BAG = hex(M.PILE_R - 0.6);
let state = initial(still.matches);
let frame = 0, last = 0, visible = false, lastPile = "";
const onFace = (ring, i, f, z) => { const a = ring[i], b = ring[(i + 1) % 6]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, z]; };
function pileSvg(s) {
  const out = [];
  const zc = Z.trayTop + s.hc;
  if (s.hc > 0.05) {
    const seams = s.layers.slice(0, -1).map((h) => lineSvg(ringSeam(PILE, Z.trayTop + h, P), { tone: "lo" })).join("");
    const specks = SPECKS.filter((p) => p[2] * s.hc > 0.8 && p[2] * s.hc < s.hc - 0.8).map((p) => iso(onFace(PILE, p[0], p[1], Z.trayTop + p[2] * s.hc), P));
    out.push(solidSvg(extrude(PILE, Z.trayTop, s.hc, P, {}), { tone: "mid", inner: seams + dotsSvg(specks, { size: 0.55, tone: "lo" }) }));
    out.push(lineSvg(onTop(hex(M.PILE_R - 4), zc, P, true), { tone: "faint" }));
  }
  if (s.hl > 0.05) {
    const folds = [[0, 0.3], [0, 0.72], [5, 0.22], [5, 0.6], [5, 0.86]].map(([i, f]) => pathOf([iso(onFace(BAG, i, f, zc), P), iso(onFace(BAG, i, f, zc + s.hl), P)])).join("");
    out.push(solidSvg(extrude(BAG, zc, s.hl, P, {}), { tone: "lo", inner: lineSvg(folds, { tone: "faint" }) }));
  }
  return out.join("");
}
function draw() {
  const s = state;
  const key = s.hc.toFixed(2) + "/" + s.hl.toFixed(2) + "/" + s.layers.length;
  if (key !== lastPile) { pileEl.innerHTML = pileSvg(s); lastPile = key; }
  const top = Z.trayTop + s.hc + s.hl;
  const show = Math.min(1, Math.max(0, (s.hl - 2) / 4));
  topEl.setAttribute("opacity", show.toFixed(2));
  if (show > 0) {
    const crush = Math.min(1, Math.max(0.35, (s.zp - top) / 2.2));
    const [bx, by] = iso([0, 0, top], P), [rx, ry] = iso([0, 0, TOP_REF], P);
    topEl.setAttribute("transform", "translate(" + bx.toFixed(2) + " " + by.toFixed(2) + ") scale(1 " + crush.toFixed(3) + ") translate(" + (-rx).toFixed(2) + " " + (-ry).toFixed(2) + ")");
  }
  if (s.drop) {
    dropEl.setAttribute("opacity", "1");
    dropEl.setAttribute("transform", translateAlong(P, [0, 0, s.drop.z - DROP_REF]));
  } else dropEl.setAttribute("opacity", "0");
  plateEl.setAttribute("transform", translateAlong(P, [0, 0, s.zp - Z.plateHome]));
  const boss = s.zp + M.PLATE_T + 1.6;
  rodEl.innerHTML = Z.gland - boss > 0.05 ? solidSvg(cylinder(0, 0, 1.4, boss, Z.gland - boss, P, 18), { tone: "hi", crease: "none" }) : "";
  const below = s.zp - 0.1;
  lowEl.setAttribute("d", below - top > 0.5 ? pathOf([iso([SENSOR[0], SENSOR[1], below], P), iso([SENSOR[0], SENSOR[1], top], P)]) : "");
  upEl.setAttribute("d", pathOf([iso([SENSOR[0], SENSOR[1], Z.lens], P), iso([SENSOR[0], SENSOR[1], s.zp + M.PLATE_T + 0.1], P)]));
  const on = s.phase === "full" && (still.matches || Math.floor(s.t * 2) % 2 === 0);
  ledEl.toggleAttribute("data-on", on);
  antEl.toggleAttribute("data-on", s.phase === "full");
  ringEl.toggleAttribute("data-on", s.phase === "full");
  const text = say(s);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  state = step(state, dt);
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const feed = () => { state = addBottles(state, 6); draw(); run(); };
stage.addEventListener("click", feed);
stage.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); feed(); }
  if (event.key === "c" || event.key === "C") { event.preventDefault(); state = press(state); draw(); run(); }
});
draw();
`;

const chips = `<div class="zf-chips" aria-hidden="true">${[
  ["plastico", "Plástico · boca redonda"],
  ["papel", "Papel y cartón · ranura"],
  ["vidrio", "Vidrio · boca con aletas"],
  ["metal", "Metal · boca pequeña"],
  ["organico", "Orgánico · compuerta"],
].map(([key, label]) => `<span class="zf-chip"><i style="--c:var(--zf-${key})"></i>${label}</span>`).join("")}</div>`;

const plateBody = k.plateHtml({
  fig: "Fig 1",
  title: "Zafacón inteligente · Ready Recycling",
  hint: "Clic: echar botellas · C: compactar",
  readout: M.say(M.initial(false)),
  keys: [
    { mark: "lit", label: "Placa de compresión y haz del sensor ToF: lo que se mueve" },
    { mark: "raised", label: "Cuerpo de HDPE reciclado, corte en el módulo de plástico" },
  ],
  caption:
    "Cada módulo mide 68 cm de vértice a vértice y 108 cm de alto, y encaja con sus vecinos en panal mediante grapas en la tapa. En el de plástico, el VL53L0X del travesaño mide la distancia hasta los residuos a través de un orificio en la placa. Cuando el nivel llega al 85 %, el ESP32 activa el actuador lineal de 12 V, que baja la placa y reduce las botellas sueltas un 65 %. Las celdas de carga bajo la bandeja pesan lo acumulado, y el sensor de temperatura vigila el riesgo de incendio. Cuando ni compactando queda sitio, el módulo avisa al centro de acopio por Wi-Fi o LoRaWAN. Lo alimentan la batería de 18650 y el panel solar de la tapa, que aquí aparece levantada para ver el interior. En el recorrido, cuatro compactaciones dejan caber unas 197 botellas de 500 ml donde sueltas cabrían 84.",
  body: `<div class="iso-stage" tabindex="0" role="button" aria-label="Zafacón inteligente: Intro o clic echa botellas, C compacta">${svg}</div>`,
}).replace("</figure>", `${chips}</figure>`);

const file = theme === "light" ? "zafacon-light.html" : "zafacon.html";
const html = k.pageHtml({ title: "Zafacón inteligente", theme, body: plateBody, script: kitScript() + live, width: 680 }).replace("</style>", CSS + "</style>").replace('<html lang="en">', '<html lang="es">');
writeFileSync(join(HERE, file), html);
console.log("wrote", file, (html.length / 1024).toFixed(0) + " KB");
