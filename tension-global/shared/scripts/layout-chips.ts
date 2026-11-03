// Calcula los desplazamientos de ficha (CHIP_OFFSETS) minimizando solapes.
// Uso: npx tsx scripts/layout-chips.ts   → imprime el objeto para pegar en src/countries.ts
import { geoNaturalEarth1 } from 'd3-geo';
import { COUNTRIES } from '../src/countries';

const W = 1100;
const H = 560;
const base = geoNaturalEarth1();
const k0 = base.scale();
const [, t0y] = base.translate();
const top = base([0, 78])![1];
const bot = base([0, -56])![1];
const left = base([-180, 0])![0];
const right = base([180, 0])![0];
const m = Math.min(W / (right - left), H / (bot - top));
const cyU = ((top + bot) / 2 - t0y) / k0;
const proj = geoNaturalEarth1().scale(k0 * m).translate([W / 2, H / 2 - m * k0 * cyU]);



const pts = COUNTRIES.map((c) => ({ id: c.id, p: proj(c.anchor) as [number, number] }));

// Escalas de zoom a evaluar; el tamaño de ficha y el tope de desplazamiento replican MapView.tsx.
const SCALES = [1, 1.5, 2.2, 3, 4.5, 7];
const aOf = (k: number) => Math.min(1.12, 0.5 + 0.24 * Math.log2(k + 0.6));
const box = (k: number) => {
  const a = aOf(k);
  const compact = a < 0.78;
  return { w: (compact ? 48 : 64) * a, h: (compact ? 18 : 32) * a };
};

const dirs = 16;
const radii = [0, 13, 19, 26, 34, 44, 56];
const cands: [number, number][] = [[0, 0]];
for (const r of radii.slice(1)) for (let i = 0; i < dirs; i++) cands.push([Math.round(r * Math.cos((i / dirs) * 2 * Math.PI)), Math.round(r * Math.sin((i / dirs) * 2 * Math.PI))]);

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const n = pts.length;
const pos = (i: number, o: [number, number], k: number): [number, number] => [k * pts[i].p[0] + Math.min(k, 3) * o[0], k * pts[i].p[1] + Math.min(k, 3) * o[1]];

function pairCost(i: number, oi: [number, number], j: number, oj: [number, number]): number {
  let c = 0;
  for (const k of SCALES) {
    const { w, h } = box(k);
    const [xi, yi] = pos(i, oi, k);
    const [xj, yj] = pos(j, oj, k);
    const ox = w + 2 - Math.abs(xi - xj);
    const oy = h + 2 - Math.abs(yi - yj);
    if (ox > 0 && oy > 0) c += (ox * oy) / (k * k); // normalizado a unidades de mapa
    // no tapar el punto de anclaje de otro país
    const ax = k * pts[j].p[0];
    const ay = k * pts[j].p[1];
    if (Math.abs(xi - ax) < w / 2 && Math.abs(yi - ay) < h / 2) c += 14;
  }
  return c;
}

let best: [number, number][] = [];
let bestCost = Infinity;
for (let restart = 0; restart < 10; restart++) {
  const off: [number, number][] = pts.map(() => [0, 0]);
  const cost = (i: number, o: [number, number]) => {
    let c = Math.hypot(o[0], o[1]) * 1.2;
    // la ficha debe quedar más cerca de su propio país que de cualquier otro (sin ambigüedad)
    if (o[0] !== 0 || o[1] !== 0) {
      const cx = pts[i].p[0] + o[0];
      const cy = pts[i].p[1] + o[1];
      const own = Math.hypot(o[0], o[1]);
      for (let j = 0; j < n; j++) if (j !== i && Math.hypot(cx - pts[j].p[0], cy - pts[j].p[1]) < own + 4) c += 45;
    }
    for (let j = 0; j < n; j++) if (j !== i) c += pairCost(i, o, j, off[j]) * 5;
    return c;
  };
  for (let sweep = 0; sweep < 10; sweep++) {
    const order = [...Array(n).keys()].sort(() => rnd() - 0.5);
    for (const i of order) {
      let bi = off[i];
      let bc = cost(i, bi);
      for (const o of cands) {
        const c = cost(i, o) + rnd() * 0.4;
        if (c < bc) {
          bc = c;
          bi = o;
        }
      }
      off[i] = bi;
    }
  }
  let total = 0;
  for (let i = 0; i < n; i++) total += cost(i, off[i]);
  if (total < bestCost) {
    bestCost = total;
    best = off.map((o) => [...o] as [number, number]);
  }
}

let overlaps = 0;
for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (pairCost(i, best[i], j, best[j]) > 6) overlaps++;
console.error(`coste ${bestCost.toFixed(0)}, pares con solape ${overlaps}`);
const lines = pts
  .map((q, i) => ({ id: q.id, o: best[i] }))
  .filter((x) => x.o[0] !== 0 || x.o[1] !== 0)
  .map((x) => `  ${x.id}: [${x.o[0]}, ${x.o[1]}],`);
console.log(`export const CHIP_OFFSETS: Record<CountryId, [number, number]> = {\n${lines.join('\n')}\n};`);
