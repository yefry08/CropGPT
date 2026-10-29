// Ready Recycling en la ciudad: una maqueta de barrio con seis estaciones Ready,
// un centro de acopio y su camión. Cuando un zafacón se llena avisa por radio al
// centro, la app lo lista y el camión sale a recoger solo los que están llenos.
// `node build.mjs` escribe ciudad.html; `--light` el tema claro; `--en` en inglés.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const lang = process.argv.includes("--en") ? "en" : "es";

const T = {
  es: {
    title: "Ready en la ciudad",
    hint: "Clic en un zafacón para llenarlo",
    page: "Ready en la ciudad",
    label: "Maqueta de un barrio con calles, edificios, un parque, seis estaciones de zafacones Ready y un centro de acopio con su camión. Cuando un zafacón se llena, envía un aviso por radio al centro de acopio y el camión sale a recogerlo siguiendo las calles.",
    keys: ["Camión de recolección y su ruta: lo que se mueve", "Aviso por radio de un zafacón lleno"],
    caption: "Cada estación Ready mide su llenado y avisa sola al centro de acopio cuando se llena. La app junta los avisos y el camión recorre solo las estaciones llenas por la ruta más corta, en vez de pasar por todas a horario fijo. Una cuadra de la maqueta equivale a unos 600 m, y el kilometraje del lector sale de la ruta que el camión realmente recorre.",
    appTitle: "App Ready · Centro de acopio",
    full: "LLENO", alert: "aviso enviado", ok: "operando", picked: "recogido",
    phases: { wait: "Esperando avisos", route: "Camión en ruta", back: "Regresando al centro" },
    fullCount: (n) => `${n} lleno${n === 1 ? "" : "s"}`,
    routeKm: (a, b) => `ruta ${a} km (todas: ${b} km)`,
    stage: "Ready en la ciudad: clic o Intro en una estación la llena",
    dec: ",",
    sites: ["Parque Colón", "Liceo", "Mercado", "Plaza", "Hospital", "Malecón"],
    depot: "Centro de acopio",
  },
  en: {
    title: "Ready in the city",
    hint: "Click a bin to fill it",
    page: "Ready in the city",
    label: "A model of a neighbourhood with streets, buildings, a park, six Ready bin stations and a collection centre with its truck. When a bin fills up it sends a radio alert to the collection centre, and the truck drives out along the streets to empty it.",
    keys: ["Collection truck and its route: what moves", "Radio alert from a full bin"],
    caption: "Each Ready station measures its own fill level and alerts the collection centre by itself when it is full. The app gathers the alerts, and the truck drives the shortest route through only the full stations, instead of visiting every bin on a fixed schedule. One block of the model is about 600 m, and the readout's distance comes from the route the truck actually drives.",
    appTitle: "Ready app · Collection centre",
    full: "FULL", alert: "alert sent", ok: "working", picked: "collected",
    phases: { wait: "Waiting for alerts", route: "Truck on its route", back: "Returning to the centre" },
    fullCount: (n) => `${n} full`,
    routeKm: (a, b) => `route ${a} km (all: ${b} km)`,
    stage: "Ready in the city: click or press Enter on a station to fill it",
    dec: ".",
    sites: ["Colón Park", "High school", "Market", "Square", "Hospital", "Seafront"],
    depot: "Collection centre",
  },
}[lang];

const WIDTH = 640;
const HEIGHT = 430;
const PLATE = { x: -118, y: -88, w: 236, d: 176, r: 6 };
const ROAD_W = 10;
const XS = [-60, 0, 60]; // north–south roads
const YS = [-40, 40]; // east–west roads
const DEPOT = { x: 66, y: -34, w: 44, d: 68, r: 2 };
const DOCK = [88, 40];
const BINS = [
  { at: [-69, -62], stop: [-60, -62] },
  { at: [-9, 12], stop: [0, 12] },
  { at: [22, 49], stop: [22, 40] },
  { at: [-30, -49], stop: [-30, -40] },
  { at: [51, -14], stop: [60, -14] },
  { at: [-92, 49], stop: [-92, 40] },
];
const ANTENNA = [102, -24, 46];
const KM_PER_UNIT = 0.01; // 1 unit ≈ 10 m: a 60-unit block ≈ 600 m

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -6, 0), [DEPOT.x, DEPOT.y, 34], [ANTENNA[0], ANTENNA[1], ANTENNA[2] + 4], [-100, -70, 30]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 40, elevation: 36 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const plan = (x0, y0, x1, y1, r = 1) => ({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), d: Math.abs(y1 - y0), r });

// ---------- ground: plate, asphalt, blocks with kerbs ----------
function ground() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -6, 6, P)}"/>`];
  for (const p of [[-104, -74], [104, -74], [-104, 74], [104, 74]].sort((a, b) => depth(...a) - depth(...b))) out.push(S(k.cylinder(p[0], p[1], 5, -9, 3, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf(PLATE, -6, 6, P, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(PLATE, -3, P, 6), { tone: "faint" }) }));
  // asphalt is the plate's top; blocks are raised kerbed slabs between the roads
  const xb = [PLATE.x + 4, ...XS.flatMap((x) => [x - ROAD_W / 2, x + ROAD_W / 2]), PLATE.x + PLATE.w - 4];
  const yb = [PLATE.y + 4, ...YS.flatMap((y) => [y - ROAD_W / 2, y + ROAD_W / 2]), PLATE.y + PLATE.d - 4];
  const blocks = [];
  for (let i = 0; i < xb.length; i += 2) for (let j = 0; j < yb.length; j += 2) blocks.push(plan(xb[i], yb[j], xb[i + 1], yb[j + 1], 2.5));
  blocks.sort((a, b) => depth(a.x + a.w / 2, a.y + a.d / 2) - depth(b.x + b.w / 2, b.y + b.d / 2));
  for (const b of blocks) {
    out.push(S(k.slabOf(b, 0, 1.2, P, 4, 0.4), { tone: "lo", crease: "faint" }));
    out.push(L(k.planOutline(k.insetPlan(b, 3), 1.2, P, 4), { tone: "faint" }));
  }
  // lane markings: dashes down the middle of each road, each a closed little slot
  const marks = [];
  for (const x of XS) for (let y = PLATE.y + 8; y < PLATE.y + PLATE.d - 8; y += 9) if (!YS.some((yy) => Math.abs(y + 2.5 - yy) < 7)) marks.push(k.planOutline({ x: x - 0.4, y, w: 0.8, d: 5, r: 0.4 }, 0.05, P, 2));
  for (const y of YS) for (let x = PLATE.x + 8; x < PLATE.x + PLATE.w - 8; x += 9) if (!XS.some((xx) => Math.abs(x + 2.5 - xx) < 7)) marks.push(k.planOutline({ x, y: y - 0.4, w: 5, d: 0.8, r: 0.4 }, 0.05, P, 2));
  out.push(L(marks.join(""), { tone: "faint" }));
  return out.join("");
}

// ---------- tall things, each a depth-sorted item ----------
const items = [];
const put = (x, y, svg) => items.push({ d: depth(x, y), svg });

function building(b, h) {
  const out = [S(k.slabOf(b, 1.2, h, P, 3, 0.5), { tone: "lo", crease: "faint", inner: L(k.sideSeam(b, 1.2 + h * 0.5, P, 3), { tone: "faint" }) })];
  const top = 1.2 + h;
  out.push(L(k.planOutline(k.insetPlan(b, 1.4), top, P, 3), { tone: "faint" }));
  // rooftop water tank (tinaco) on a little stand, as on most Dominican roofs
  const t = [b.x + b.w * 0.7, b.y + b.d * 0.35];
  out.push(S(k.slabOf({ x: t[0] - 2.4, y: t[1] - 2.4, w: 4.8, d: 4.8, r: 0.4 }, top, 0.8, P, 2), { tone: "lo" }));
  out.push(S(k.cylinder(t[0], t[1], 2.1, top + 0.8, 3.2, P, 20), { tone: "hi", inner: L(k.sideArc(t[0], t[1], 2.1, top + 2.4, P, 16), { tone: "faint" }) }));
  out.push(D(k.corners(b, 1.6).map(([x, y]) => at([x, y, top])), { size: 0.35 }));
  put(b.x + b.w / 2, b.y + b.d / 2, out.join(""));
}

function tree(x, y, r = 4) {
  put(x, y, S(k.cylinder(x, y, 0.7, 1.2, 4, P, 10), { tone: "lo" }) + S(G.sphereOf([x, y, 5.2 + r * 0.8], r, P), { tone: "mid" }));
}

function binStation(i) {
  const [x, y] = BINS[i].at;
  const out = [S(k.slabOf({ x: x - 7, y: y - 4.4, w: 14, d: 8.8, r: 1 }, 1.2, 0.6, P, 3), { tone: "mid" })];
  // three hexagonal modules in a row, the ones in the figure above at model scale
  const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, j) => [cx + r * Math.cos(((45 + 60 * j) * Math.PI) / 180), cy + r * Math.sin(((45 + 60 * j) * Math.PI) / 180)]);
  const kinds = ["plastico", "papel", "metal"];
  for (const [j, dx] of [[0, -4.2], [1, 0], [2, 4.2]].sort((a, b) => depth(x + a[1], y) - depth(x + b[1], y))) {
    out.push(`<g class="ct-bin" style="--cat:var(--ct-${kinds[j]})">${S(k.extrude(hex(x + dx, y, 2.4), 1.8, 7, P, { bevel: 0.3 }), { tone: "hi", crease: "lo" })}</g>`);
  }
  // status beacon on a short mast: its colour is the bin's state
  out.push(S(k.cylinder(x + 6, y - 3.4, 0.4, 1.8, 9, P, 8), { tone: "mid" }));
  out.push(`<g class="ct-beacon" data-bin="${i}">${D([at([x + 6, y - 3.4, 11.4])], { size: 2.2 })}</g>`);
  put(x, y, `<g class="ct-station" data-station="${i}" tabindex="0" role="button" aria-label="${T.sites[i]}">${out.join("")}</g>`);
}

function depot() {
  const d = DEPOT;
  const out = [S(k.slabOf(d, 1.2, 0.4, P, 3), { tone: "lo" })];
  const hall = { x: d.x + 6, y: d.y + 6, w: d.w - 12, d: d.d - 26, r: 1 };
  const h = 16;
  out.push(S(k.slabOf(hall, 1.6, h, P, 3, 0.6), { tone: "hi", crease: "lo", inner: L(k.sideSeam(hall, 1.6 + 6, P, 3), { tone: "faint" }) }));
  // sawtooth roof ribs, each running edge to edge across the hall
  const ribs = [];
  for (let y = hall.y + 4; y < hall.y + hall.d - 2; y += 5) ribs.push(k.lineOnTop([hall.x, y], [hall.x + hall.w, y], 1.6 + h, P));
  out.push(L(ribs.join(""), { tone: "lo" }));
  // loading bay facing the street, with a roller door
  const bay = { x: d.x + 12, y: hall.y + hall.d, w: 18, d: 6, r: 0.6 };
  out.push(S(k.slabOf(bay, 1.6, 7, P, 2, 0.3), { tone: "mid" }));
  // antenna mast on the roof: alerts from every station land here
  out.push(S(k.cylinder(ANTENNA[0], ANTENNA[1], 1.4, 1.6 + h, 1.2, P, 16), { tone: "mid" }));
  out.push(S(k.cylinder(ANTENNA[0], ANTENNA[1], 0.45, 1.6 + h + 1.2, ANTENNA[2] - h - 2.8, P, 10), { tone: "mid", crease: "none" }));
  out.push(`<g class="ct-mast">${D([at(ANTENNA)], { size: 1.3, tone: "hi" })}</g>`);
  put(d.x + d.w / 2, d.y + d.d / 2, out.join(""));
}

// ---------- the truck, built once per heading at the origin ----------
function truck(heading) {
  const a = (heading * Math.PI) / 180;
  const u = [Math.cos(a) * 1.4, Math.sin(a) * 1.4];
  const v = [-u[1], u[0]];
  const ring = (f0, f1, w0, w1) => [
    [u[0] * f0 + v[0] * w0, u[1] * f0 + v[1] * w0],
    [u[0] * f1 + v[0] * w0, u[1] * f1 + v[1] * w0],
    [u[0] * f1 + v[0] * w1, u[1] * f1 + v[1] * w1],
    [u[0] * f0 + v[0] * w1, u[1] * f0 + v[1] * w1],
  ];
  const parts = [];
  const add = (svg, f, w) => parts.push({ d: depth(u[0] * f + v[0] * w, u[1] * f + v[1] * w), svg });
  for (const f of [-4.2, 3.8]) for (const w of [-2.6, 2.6]) {
    const F = G.frameAlong([u[0] * f + v[0] * w, u[1] * f + v[1] * w, 2.1], [v[0] / 1.4, v[1] / 1.4, 0]);
    add(S(G.disc(-0.8, 0.8, 2.1, F, P), { tone: "lo" }), f, w * 1.2);
  }
  const body = [];
  body.push(S(k.extrude(ring(-6.5, 6.5, -2.4, 2.4), 1.7, 1.7, P), { tone: "lo" }));
  body.push(S(k.extrude(ring(-6.4, 2.2, -2.6, 2.6), 3.4, 7.8, P, { bevel: 0.3 }), { tone: "hi", lit: true, crease: "lo" }));
  body.push(S(k.extrude(ring(2.8, 6.5, -2.4, 2.4), 3.4, 5, P, { bevel: 0.3 }), { tone: "mid" }));
  body.push(S(k.extrude(ring(4.6, 6.4, -2.2, 2.2), 8.4, 0.4, P), { tone: "lo" }));
  parts.sort((p, q) => p.d - q.d);
  const back = parts.filter((p) => p.d <= depth(0, 0)).map((p) => p.svg);
  const front = parts.filter((p) => p.d > depth(0, 0)).map((p) => p.svg);
  return `<g data-heading="${heading}" style="display:none">${back.join("")}${body.join("")}${front.join("")}</g>`;
}

// ---------- assemble ----------
const builds = [
  [plan(-112, -82, -96, -50), 14], [plan(-86, -82, -68, -66), 9],
  [plan(-50, -82, -10, -62), 20], [plan(-48, -30, -14, -6), 12], [plan(-48, 0, -24, 30), 24],
  [plan(10, -82, 50, -50), 16], [plan(10, -30, 40, 0), 10], [plan(18, 8, 50, 30), 28],
  [plan(-50, 50, -6, 82), 12], [plan(30, 56, 54, 82), 18], [plan(70, 50, 110, 82), 10],
  [plan(70, -82, 110, -48), 22],
];
builds.forEach(([b, h]) => building(k.insetPlan(b, 2), Math.round(h * 0.5)));
// the park, west-middle block
[[-104, -24], [-92, -12], [-100, 4], [-86, 18], [-104, 26], [-80, -26]].forEach(([x, y], i) => tree(x, y, 3.4 + (i % 3) * 0.6));
BINS.forEach((_, i) => binStation(i));
depot();
items.sort((a, b) => a.d - b.d);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: T.label,
  body: [
    ground(),
    `<path data-part="route" class="iso-line ct-route" data-tone="lit" d=""/>`,
    `<g data-layer="tall">${items.map((it) => `<g data-d="${it.d.toFixed(3)}">${it.svg}</g>`).join("")}<g data-part="truck">${[0, 90, 180, 270].map(truck).join("")}</g></g>`,
    `<g data-part="links"></g>`,
  ],
});

const CSS = `
.iso{--ct-ok:#4fbf6a;--ct-warn:#e2a92a;--ct-full:#ff4a3d;--ct-plastico:#e0b43a;--ct-papel:#3f7fd0;--ct-metal:#c4473d;
  --k-s0:var(--anatomy-shade-0);--k-s1:var(--anatomy-shade-1);--k-s2:var(--anatomy-shade-2);--k-s3:var(--anatomy-shade-3);--k-top:var(--anatomy-top)}
.iso[data-theme="light"]{--ct-ok:#2f9a4e;--ct-warn:#c98a0b;--ct-full:#e2251a;--ct-plastico:#d9a521;--ct-papel:#2f6fc4;--ct-metal:#b83a30}
.ct-bin{--anatomy-shade-0:color-mix(in oklab,var(--cat) 60%,var(--k-s0));--anatomy-shade-1:color-mix(in oklab,var(--cat) 64%,var(--k-s1));--anatomy-shade-2:color-mix(in oklab,var(--cat) 68%,var(--k-s2));--anatomy-shade-3:color-mix(in oklab,var(--cat) 72%,var(--k-s3));--anatomy-top:color-mix(in oklab,var(--cat) 55%,var(--k-top))}
.ct-beacon circle{fill:var(--ct-ok);stroke:none;transition:fill .4s}
.ct-beacon[data-state="warn"] circle{fill:var(--ct-warn)}
.ct-beacon[data-state="full"] circle{fill:var(--ct-full)}
.ct-station{cursor:pointer;outline:none}
.ct-station:focus-visible .ct-bin .iso-edge{stroke:var(--anatomy-lit);stroke-width:1.2}
.ct-route{stroke-dasharray:1 3;stroke-width:1.1;stroke-linecap:round;opacity:.85}
.ct-link{stroke:var(--ct-full);stroke-width:.9;stroke-dasharray:2 5;animation:iso-flow 1200ms linear infinite;fill:none}
.ct-link-end{fill:var(--ct-full)}
.ct-app{margin-top:14px;border:1px solid var(--anatomy-mid);padding:10px 12px;font:12px/1.5 var(--anatomy-mono, ui-monospace, monospace);color:var(--anatomy-text)}
.ct-app-title{color:var(--anatomy-muted);letter-spacing:.08em;text-transform:uppercase;font-size:11px;margin-bottom:6px}
.ct-row{display:grid;grid-template-columns:1fr 90px 190px;gap:10px;align-items:center;padding:3px 0;border-top:1px dashed color-mix(in oklab,var(--anatomy-mid) 50%,transparent)}
.ct-bar{height:6px;background:color-mix(in oklab,var(--anatomy-mid) 35%,transparent);position:relative;overflow:hidden}
.ct-bar i{position:absolute;inset:0 auto 0 0;background:var(--ct-ok)}
.ct-row[data-state="warn"] .ct-bar i{background:var(--ct-warn)}
.ct-row[data-state="full"] .ct-bar i{background:var(--ct-full)}
.ct-row[data-state="full"] .ct-st{color:var(--ct-full);font-weight:700}
@media (max-width:560px){.ct-row{grid-template-columns:1fr 50px 150px}}
@media (prefers-reduced-motion:reduce){.ct-link{animation:none}}
`;

const app = `<div class="ct-app" aria-live="polite"><div class="ct-app-title">${T.appTitle}</div>${T.sites
  .map((name, i) => `<div class="ct-row" data-row="${i}"><span>${name}</span><span class="ct-bar"><i style="width:0%"></i></span><span class="ct-st"></span></div>`)
  .join("")}</div>`;

const live = `
const P = ${JSON.stringify(P)};
const XS = ${JSON.stringify(XS)}, YS = ${JSON.stringify(YS)}, PLATE = ${JSON.stringify(PLATE)};
const BINS = ${JSON.stringify(BINS)}, DOCK = ${JSON.stringify(DOCK)}, ANTENNA = ${JSON.stringify(ANTENNA)};
const KM = ${KM_PER_UNIT};
const TX = ${JSON.stringify({ full: T.full, alert: T.alert, ok: T.ok, picked: T.picked, phases: T.phases, dec: T.dec })};
const fullCount = ${T.fullCount.toString()};
const routeKm = ${T.routeKm.toString()};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const tall = svg.querySelector('[data-layer="tall"]');
const truckEl = svg.querySelector('[data-part="truck"]');
const routeEl = svg.querySelector('[data-part="route"]');
const linksEl = svg.querySelector('[data-part="links"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const statics = [...tall.children].filter((g) => g.dataset.d !== undefined);
const headings = Object.fromEntries([...truckEl.children].map((g) => [g.dataset.heading, g]));
const beacons = [...svg.querySelectorAll(".ct-beacon")];
const rows = [...document.querySelectorAll(".ct-row")];

// --- the street graph: intersections, road ends, the dock and every bin's stop ---
const key = (p) => p[0].toFixed(1) + "," + p[1].toFixed(1);
const x0 = PLATE.x + 6, x1 = PLATE.x + PLATE.w - 6, y0 = PLATE.y + 6, y1 = PLATE.y + PLATE.d - 6;
const segs = [...XS.map((x) => [[x, y0], [x, y1]]), ...YS.map((y) => [[x0, y], [x1, y]])];
const points = [DOCK, ...BINS.map((b) => b.stop)];
for (const x of XS) for (const y of YS) points.push([x, y]);
segs.forEach((s) => points.push(s[0], s[1]));
const nodes = new Map(points.map((p) => [key(p), p]));
const adj = new Map([...nodes.keys()].map((n) => [n, []]));
for (const [a, b] of segs) {
  const along = a[0] === b[0] ? 1 : 0;
  const on = [...nodes.values()].filter((p) => p[1 - along] === a[1 - along] && p[along] >= Math.min(a[along], b[along]) && p[along] <= Math.max(a[along], b[along])).sort((p, q) => p[along] - q[along]);
  for (let i = 1; i < on.length; i++) {
    const d = Math.abs(on[i][along] - on[i - 1][along]);
    adj.get(key(on[i])).push([key(on[i - 1]), d]);
    adj.get(key(on[i - 1])).push([key(on[i]), d]);
  }
}
function path(a, b) {
  const dist = new Map([[key(a), 0]]), prev = new Map(), todo = new Set(nodes.keys());
  while (todo.size) {
    let u = null;
    for (const n of todo) if (dist.has(n) && (u === null || dist.get(n) < dist.get(u))) u = n;
    if (u === null || u === key(b)) break;
    todo.delete(u);
    for (const [v, w] of adj.get(u)) if (todo.has(v) && (!dist.has(v) || dist.get(u) + w < dist.get(v))) { dist.set(v, dist.get(u) + w); prev.set(v, u); }
  }
  const out = [b];
  for (let n = key(b); n !== key(a); ) { n = prev.get(n); out.unshift(nodes.get(n)); }
  return { pts: out, len: dist.get(key(b)) };
}
// nearest-neighbour order through the stops, starting and ending at the dock
function plan(stops) {
  let here = DOCK, pts = [DOCK], len = 0, order = [];
  const left = [...stops];
  while (left.length) {
    left.sort((i, j) => path(here, BINS[i].stop).len - path(here, BINS[j].stop).len);
    const i = left.shift(), p = path(here, BINS[i].stop);
    pts.push(...p.pts.slice(1)); len += p.len; order.push({ bin: i, at: len }); here = BINS[i].stop;
  }
  const home = path(here, DOCK);
  pts.push(...home.pts.slice(1)); len += home.len;
  return { pts, len, order };
}
const allKm = plan(BINS.map((_, i) => i)).len * KM;

// --- state ---
const RATES = [0.055, 0.04, 0.07, 0.03, 0.05, 0.045];
let level = still.matches ? [1, 0.62, 1, 0.35, 0.8, 0.2] : [0.62, 0.3, 0.74, 0.12, 0.5, 0.4];
let alertAt = level.map(() => -1);
let phase = "wait", trip = null, travelled = 0, wait = 0, clock = 0, picked = level.map(() => -9);
const SPEED = 38; // model units per second
const fmt = (n) => n.toFixed(1).replace(".", TX.dec);

function pointAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    if (s <= d || i === pts.length - 1) {
      const f = d ? Math.min(1, s / d) : 0;
      const h = b[0] > a[0] ? 0 : b[0] < a[0] ? 180 : b[1] > a[1] ? 90 : 270;
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], h };
    }
    s -= d;
  }
}
// keep the truck in true painter's order among the buildings
function placeTruck(p, h) {
  const d = depthOf([p[0], p[1], 0], P);
  const next = statics.find((g) => +g.dataset.d > d) || null;
  if (truckEl.nextSibling !== next) tall.insertBefore(truckEl, next);
  for (const [k2, g] of Object.entries(headings)) g.style.display = +k2 === h ? "" : "none";
  truckEl.setAttribute("transform", translateAlong(P, [p[0], p[1], 0]));
}
function links() {
  const t = iso(ANTENNA, P);
  linksEl.innerHTML = level
    .map((l, i) => (l >= 1 && clock - alertAt[i] < 2.4 && alertAt[i] >= 0 ? (() => { const b = iso([BINS[i].at[0] + 6, BINS[i].at[1] - 3.4, 11.4], P); const m = [(b[0] + t[0]) / 2, Math.min(b[1], t[1]) - 26]; return '<path class="ct-link" d="M' + b[0].toFixed(1) + " " + b[1].toFixed(1) + " Q" + m[0].toFixed(1) + " " + m[1].toFixed(1) + " " + t[0].toFixed(1) + " " + t[1].toFixed(1) + '"/><circle class="ct-link-end" r="1.2" cx="' + t[0].toFixed(1) + '" cy="' + t[1].toFixed(1) + '"/>'; })() : ""))
    .join("");
}
function draw() {
  level.forEach((l, i) => {
    const st = l >= 1 ? "full" : l >= 0.75 ? "warn" : "ok";
    beacons[i].dataset.state = st;
    rows[i].dataset.state = st;
    rows[i].querySelector("i").style.width = Math.round(Math.min(1, l) * 100) + "%";
    const label = l >= 1 ? TX.full + " · " + TX.alert : clock - picked[i] < 3 ? TX.picked : Math.round(l * 100) + " % · " + TX.ok;
    const s = rows[i].querySelector(".ct-st");
    if (s.textContent !== label) s.textContent = label;
  });
  const full = level.filter((l) => l >= 1).length;
  const text = phase === "wait"
    ? fullCount(full) + " · " + TX.phases.wait
    : TX.phases[phase] + " · " + routeKm(fmt(trip.len * KM), fmt(allKm));
  if (readout.textContent !== text) readout.textContent = text;
  if (trip) {
    const at2 = pointAt(trip.pts, travelled);
    placeTruck(at2.p, at2.h);
    routeEl.setAttribute("d", pathOf(trip.pts.map(([x, y]) => iso([x, y, 0.3], P))));
  } else {
    placeTruck(DOCK, 0);
    routeEl.setAttribute("d", "");
  }
  links();
}
function dispatch() {
  const full = level.map((l, i) => (l >= 1 ? i : -1)).filter((i) => i >= 0);
  if (!full.length) return;
  trip = plan(full); travelled = 0; phase = "route";
}
function step(dt) {
  clock += dt;
  level = level.map((l, i) => {
    if (l >= 1) return l;
    const n = Math.min(1, l + RATES[i] * dt);
    if (n >= 1) alertAt[i] = clock;
    return n;
  });
  if (phase === "wait") {
    const full = level.filter((l) => l >= 1).length;
    wait = full ? wait + dt : 0;
    if (full >= 2 || wait > 4) dispatch();
  } else {
    travelled += SPEED * dt;
    for (const o of trip.order) if (travelled >= o.at && level[o.bin] >= 1 && o.done !== true) { level[o.bin] = 0; picked[o.bin] = clock; o.done = true; }
    if (phase === "route" && trip.order.every((o) => o.done)) phase = "back";
    if (travelled >= trip.len) { trip = null; phase = "wait"; wait = 0; }
  }
}
let frame = 0, last = 0, visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  step(dt);
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
const fill = (i) => { if (level[i] < 1) { level[i] = 1; alertAt[i] = clock; } draw(); run(); };
svg.querySelectorAll(".ct-station").forEach((g) => {
  const i = +g.dataset.station;
  g.addEventListener("click", () => fill(i));
  g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fill(i); } });
});
if (still.matches) { alertAt = level.map((l) => (l >= 1 ? 0 : -1)); dispatch(); travelled = trip ? trip.len * 0.35 : 0; }
draw();
`;

const body = k.plateHtml({
  fig: "Fig 2",
  title: T.title,
  hint: T.hint,
  readout: T.fullCount(0) + " · " + T.phases.wait,
  keys: [
    { mark: "lit", label: T.keys[0] },
    { mark: "red", label: T.keys[1] },
  ],
  caption: T.caption,
  body: `<div class="iso-stage" aria-label="${T.stage}">${svg}${app}</div>`,
});

const file = `ciudad${lang === "en" ? "-en" : ""}${theme === "light" ? "-light" : ""}.html`;
const html = k
  .pageHtml({ title: T.page, theme, body, script: kitScript() + live, width: 700 })
  .replace("</style>", CSS + "</style>")
  .replace('<html lang="en">', `<html lang="${lang}">`);
writeFileSync(join(HERE, file), html);
console.log("wrote", file, (html.length / 1024).toFixed(0) + " KB");
