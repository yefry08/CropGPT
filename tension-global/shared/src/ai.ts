import { CARD } from './cards';
import { COUNTRY, activeIds } from './countries';
import { applyActionMut, cloneLite, freeTargets } from './engine';
import {
  TECH_NAMES,
  TECH_VP_FIRST,
  TECH_VP_SECOND,
  accessibleIn,
  controllerOf,
  coupBlockedReason,
  coupBonus,
  coupStrength,
  coupTargets,
  infOf,
  scoreRegion,
  techScore,
} from './rules';
import { TECH_CAP_MILESTONES } from './rules';
import type { Action, CardId, CountryId, GameState, Influence, Pending, Placement, Region, Side } from './types';
import { REGIONS, other } from './types';
import { eventBlockedReason, techBlockedReason } from './engine';

export type AILevel = 'easy' | 'normal' | 'hard';
export interface AIOptions {
  level: AILevel;
  rand: () => number;
}

const NOISE: Record<AILevel, number> = { easy: 2.6, normal: 0.6, hard: 0.12 };
const IMPORTANCE: Record<Region, number> = { EU: 1.3, AS: 1.1, ME: 1.0, AM: 0.9, AF: 0.7 };

type RW = Record<Region, number>;

/** Multiplicador de interés por región: sube si tengo la carta de puntuación o se acerca el final. */
function regionWeights(s: GameState, side: Side): RW {
  const rw = {} as RW;
  for (const r of REGIONS) {
    let w = IMPORTANCE[r];
    const holds = s.hands[side].some((id) => id !== '?' && CARD[id].region === r);
    if (holds) w += 1.1;
    if (s.turn >= 9) w += 0.5;
    if (s.turn >= 10) w += 0.8;
    rw[r] = w;
  }
  return rw;
}

function ctlValue(c: CountryId, rw: RW): number {
  const def = COUNTRY[c];
  return (def.key ? 1.8 : 0.7) * rw[def.region];
}

/** Valor local (desde la perspectiva de `side`) de una combinación de influencias en un país. */
function localScore(side: Side, c: CountryId, w: number, e: number, rw: RW): number {
  const K = ctlValue(c, rw);
  const inf: Influence = { W: w, E: e };
  const ctl = controllerOf(inf, c);
  let v = 0;
  if (ctl === side) v += K;
  else if (ctl === other(side)) v -= K;
  const mine = side === 'W' ? w : e;
  const foe = side === 'W' ? e : w;
  const st = COUNTRY[c].stab;
  v += 0.35 * K * Math.max(-1, Math.min(1, (mine - foe) / (2 * st)));
  return v;
}

/** Valoración global (mayor = mejor para `side`). */
export function evaluate(s: GameState, side: Side): number {
  let net = s.vp * 2.2;
  const wReg = Math.min(1, 0.3 + 0.07 * s.turn);
  for (const r of REGIONS) net += wReg * scoreRegion(s, r).net;
  for (const id of activeIds(s.era)) {
    const c = controllerOf(s.influence[id], id);
    if (c) net += (c === 'W' ? 1 : -1) * 0.2;
  }
  net += (s.tech.W - s.tech.E) * 1.3 + (s.cap.W - s.cap.E) * 1.0;
  if (s.era >= 4 && s.risk >= 6) {
    const a = techScore(s, 'W');
    const b = techScore(s, 'E');
    const pen = (s.risk - 5) * 0.6;
    if (a > b) net -= pen;
    else if (b > a) net += pen;
  }
  const t = Math.max(0, 4 - s.tension);
  return (side === 'W' ? net : -net) - 0.6 * Math.pow(t, 1.5);
}

/** Peso de un punto de "puntuación si se puntuara ahora" para la región. */
function regionVPWeights(s: GameState, side: Side): RW {
  const w = {} as RW;
  const base = Math.min(1, 0.3 + 0.07 * s.turn) * 0.85;
  for (const r of REGIONS) {
    const holds = s.hands[side].some((id) => id !== '?' && CARD[id].region === r);
    w[r] = base + (holds ? 1.1 : 0) + (s.turn >= 10 ? 0.4 : 0);
  }
  return w;
}

function regionNet(ts: GameState, region: Region, side: Side): number {
  const n = scoreRegion(ts, region).net;
  return side === 'W' ? n : -n;
}

// ——— Planificación de influencia ———
function copyInf(s: GameState): Record<CountryId, Influence> {
  const t: Record<CountryId, Influence> = {};
  for (const id in s.influence) t[id] = { W: s.influence[id].W, E: s.influence[id].E };
  return t;
}

function merge(ps: Placement[]): Placement[] {
  const out: Placement[] = [];
  for (const p of ps) {
    const last = out[out.length - 1];
    if (last && last.c === p.c) last.n += p.n;
    else out.push({ ...p });
  }
  return out;
}

function planInfluence(s: GameState, side: Side, ops: number, rw: RW, opts: AIOptions): { placements: Placement[]; value: number } {
  const tmp = copyInf(s);
  const ts: GameState = { ...s, influence: tmp };
  const vw = regionVPWeights(s, side);
  const baseNet = {} as Record<Region, number>;
  for (const r of REGIONS) baseNet[r] = regionNet(ts, r, side);
  const ids = activeIds(s.era);
  const noise = NOISE[opts.level];
  const out: Placement[] = [];
  let value = 0;
  let left = ops;
  while (left > 0) {
    let best: CountryId | null = null;
    let bestScore = -Infinity;
    let bestGain = 0;
    let bestCost = 1;
    for (const c of ids) {
      if (!accessibleIn(tmp, s.era, side, c)) continue;
      const cur = tmp[c];
      const cost = controllerOf(cur, c) === other(side) ? 2 : 1;
      if (cost > left) continue;
      const before = localScore(side, c, cur.W, cur.E, rw);
      const after = side === 'W' ? localScore(side, c, cur.W + 1, cur.E, rw) : localScore(side, c, cur.W, cur.E + 1, rw);
      const reg = COUNTRY[c].region;
      cur[side] += 1;
      const dReg = vw[reg] * (regionNet(ts, reg, side) - baseNet[reg]);
      cur[side] -= 1;
      const tot = after - before + dReg;
      const sc = tot / cost + (opts.rand() - 0.5) * noise * 0.5;
      if (sc > bestScore) {
        bestScore = sc;
        best = c;
        bestGain = tot;
        bestCost = cost;
      }
    }
    if (!best) break;
    tmp[best][side] += 1;
    baseNet[COUNTRY[best].region] = regionNet(ts, COUNTRY[best].region, side);
    left -= bestCost;
    value += bestGain;
    out.push({ c: best, n: 1 });
  }
  return { placements: merge(out), value };
}

function planCoup(s: GameState, side: Side, ops: number, rw: RW, opts: AIOptions): { target: CountryId | null; value: number } {
  const bonus = coupBonus(s, side);
  const noise = NOISE[opts.level];
  const tmp = copyInf(s);
  const ts: GameState = { ...s, influence: tmp };
  const vw = regionVPWeights(s, side);
  let best: CountryId | null = null;
  let bestV = -Infinity;
  for (const c of coupTargets(s, side)) {
    const def = COUNTRY[c];
    // Nunca un golpe en país clave con Tensión 2 o menos.
    if (def.key && s.tension - 1 < 2) continue;
    const cur = s.influence[c];
    const before = localScore(side, c, cur.W, cur.E, rw);
    let sum = 0;
    const reg = def.region;
    const baseR = regionNet(ts, reg, side);
    const t = tmp[c];
    for (let d = 1; d <= 6; d++) {
      const str = coupStrength(d, ops, bonus, c);
      if (str <= 0) continue;
      const foeHave = side === 'W' ? cur.E : cur.W;
      const rem = Math.min(foeHave, str);
      const extra = str - rem;
      const nw = side === 'W' ? cur.W + extra : cur.W - rem;
      const ne = side === 'W' ? cur.E - rem : cur.E + extra;
      t.W = nw;
      t.E = ne;
      sum += localScore(side, c, nw, ne, rw) - before + vw[reg] * (regionNet(ts, reg, side) - baseR);
    }
    t.W = cur.W;
    t.E = cur.E;
    let v = sum / 6;
    if (def.key) v -= 0.5 + 0.5 * (5 - s.tension);
    v += (opts.rand() - 0.5) * noise;
    if (v > bestV) {
      bestV = v;
      best = c;
    }
  }
  return { target: best, value: best ? bestV : -Infinity };
}

function planFree(s: GameState, side: Side, p: Extract<Pending, { kind: 'free' }>, rw: RW, opts: AIOptions): Placement[] {
  const targets = freeTargets(s, side, p.o);
  const max = p.o.max ?? 99;
  const tmp = copyInf(s);
  const ts: GameState = { ...s, influence: tmp };
  const vw = regionVPWeights(s, side);
  const used: Record<string, number> = {};
  const out: Placement[] = [];
  for (let i = 0; i < p.n; i++) {
    let best: CountryId | null = null;
    let bestScore = -Infinity;
    for (const c of targets) {
      if ((used[c] ?? 0) >= max) continue;
      const cur = tmp[c];
      if (p.o.mode === 'remove') {
        if ((side === 'W' ? cur.E : cur.W) <= 0) continue;
      } else if (p.o.own && cur[side] <= 0) continue;
      const before = localScore(side, c, cur.W, cur.E, rw);
      let w = cur.W;
      let e = cur.E;
      if (p.o.mode === 'remove') {
        if (side === 'W') e--;
        else w--;
      } else if (side === 'W') w++;
      else e++;
      const reg = COUNTRY[c].region;
      const baseR = regionNet(ts, reg, side);
      const oldW = cur.W;
      const oldE = cur.E;
      cur.W = w;
      cur.E = e;
      const dReg = vw[reg] * (regionNet(ts, reg, side) - baseR);
      cur.W = oldW;
      cur.E = oldE;
      const sc = localScore(side, c, w, e, rw) - before + dReg + (opts.rand() - 0.5) * NOISE[opts.level] * 0.5;
      if (sc > bestScore) {
        bestScore = sc;
        best = c;
      }
    }
    if (!best) break;
    used[best] = (used[best] ?? 0) + 1;
    if (p.o.mode === 'remove') tmp[best][other(side)]--;
    else tmp[best][side]++;
    out.push({ c: best, n: 1 });
  }
  return merge(out);
}

// ——— Simulación de candidatos ———
type Cand = { action: Action; value: number };

/** Resuelve (con la política voraz) todo lo pendiente que no es del turno principal. */
function drainQueue(s: GameState, rootSide: Side, opts: AIOptions, stopAtOps: boolean) {
  let guard = 12;
  while (s.queue.length && s.phase === 'play' && guard-- > 0) {
    const head = s.queue[0];
    if (stopAtOps && head.kind === 'ops') return;
    const a = pendingAction(s, head.side, opts);
    try {
      applyActionMut(s, head.side, a);
    } catch {
      return;
    }
  }
  void rootSide;
}

function pendingAction(s: GameState, side: Side, opts: AIOptions): Action {
  const head = s.queue[0];
  const rw = regionWeights(s, side);
  if (head.kind === 'free') return { type: 'resolveFree', placements: planFree(s, side, head, rw, opts) };
  if (head.mode === 'influence') {
    const plan = planInfluence(s, side, head.ops, rw, opts);
    return plan.placements.length ? { type: 'commitInfluence', placements: plan.placements } : { type: 'skipOps' };
  }
  const plan = planCoup(s, side, head.ops, rw, opts);
  return plan.target ? { type: 'commitCoup', target: plan.target } : { type: 'skipOps' };
}

function simulate(s: GameState, side: Side, a: Action, opts: AIOptions): GameState | null {
  const c = cloneLite(s);
  try {
    applyActionMut(c, side, a);
    // Resolver lo pendiente del rival y los eventos (no el propio paso de operaciones).
    let guard = 12;
    while (c.queue.length && c.phase === 'play' && guard-- > 0) {
      const head = c.queue[0];
      if (head.kind === 'ops' && head.side === side) break;
      applyActionMut(c, head.side, pendingAction(c, head.side, opts));
    }
    return c;
  } catch {
    return null;
  }
}

function terminal(s: GameState, side: Side): number | null {
  if (s.phase !== 'over') return null;
  return s.winner === side ? 1000 : s.winner === 'draw' ? 0 : -1000;
}

function candidatesFor(s: GameState, side: Side, opts: AIOptions): Cand[] {
  const rw = regionWeights(s, side);
  const base = evaluate(s, side);
  const noise = NOISE[opts.level];
  const out: Cand[] = [];
  const hand = s.hands[side].filter((id) => id !== '?');
  const seen = new Set<CardId>();
  for (const id of hand) {
    if (seen.has(id)) continue;
    seen.add(id);
    const card = CARD[id];
    const nz = () => (opts.rand() - 0.5) * 2 * noise;

    if (card.kind === 'score' && card.region) {
      const net = (side === 'W' ? 1 : -1) * scoreRegion(s, card.region).net;
      out.push({ action: { type: 'playScore', card: id }, value: net > 0 ? 3 + 1.6 * net + nz() : -500 + net });
      continue;
    }

    // Evento propio / neutral
    if (!eventBlockedReason(side, id)) {
      const sim = simulate(s, side, { type: 'playEvent', card: id }, opts);
      if (sim) {
        const t = terminal(sim, side);
        const v = t !== null ? t : evaluate(sim, side) - base + 0.8; // pequeña preferencia por usar eventos propios
        out.push({ action: { type: 'playEvent', card: id }, value: v + nz() });
      }
    }

    // Evento rival (si se juega por operaciones): su efecto previo
    const rivalCard = card.owner === other(side);
    let rivalDelta = 0;
    let afterRival: GameState = s;
    if (rivalCard) {
      const sim = simulate(s, side, { type: 'playOps', card: id, kind: 'influence' }, opts);
      if (sim) {
        afterRival = sim;
        rivalDelta = evaluate(sim, side) - base;
      }
    }
    // Operaciones: influencia
    {
      const st = rivalCard ? afterRival : s;
      const head = st.queue.find((p) => p.kind === 'ops');
      const ops = head ? head.ops : card.ops;
      const plan = planInfluence(st, side, ops, rw, opts);
      out.push({ action: { type: 'playOps', card: id, kind: 'influence' }, value: plan.value + rivalDelta + nz() });
    }
    // Operaciones: golpe
    {
      const st = rivalCard ? afterRival : s;
      const head = st.queue.find((p) => p.kind === 'ops');
      const ops = head ? head.ops : card.ops;
      const plan = planCoup(st, side, ops, rw, opts);
      if (plan.target) out.push({ action: { type: 'playOps', card: id, kind: 'coup' }, value: plan.value + rivalDelta + nz() });
    }
    // Carrera tecnológica
    if (!techBlockedReason(s, side, id)) {
      const idx = s.tech[side];
      const limit = s.tech[side] < s.tech[other(side)] ? 4 : 3;
      const p = limit / 6;
      const first = s.tech[other(side)] <= idx;
      const vp = first ? TECH_VP_FIRST[idx] : TECH_VP_SECOND[idx];
      const capBonus = TECH_CAP_MILESTONES.includes(idx) ? 1.2 : 0;
      const eraAI = idx === TECH_NAMES.length - 1 ? -0.5 : 0;
      let v = p * (vp * 2.2 + 1.3 + capBonus + eraAI) - (1 - p) * 0.2;
      if (rivalCard) v += -Math.min(0, rivalDelta); // evita su evento
      out.push({ action: { type: 'playTech', card: id }, value: v + nz() });
    }
  }
  return out;
}

export function chooseAction(s: GameState, side: Side, opts: AIOptions): Action {
  if (s.queue.length) return pendingAction(s, side, opts);
  const cands = candidatesFor(s, side, opts);
  if (cands.length === 0) {
    // Mano inesperada (p. ej. solo cartas '?'): no hay nada que hacer.
    throw new Error('La IA no tiene acciones');
  }
  cands.sort((a, b) => b.value - a.value);
  if (opts.level === 'easy' && opts.rand() < 0.15) {
    const pool = cands.filter((c) => c.value > -400);
    if (pool.length) return pool[Math.floor(opts.rand() * pool.length)].action;
  }
  if (opts.level === 'hard' && cands.length > 1) {
    // Más profundidad: simula el resultado completo de las 3 mejores y compara la valoración final.
    const base = evaluate(s, side);
    let best = cands[0];
    let bestV = -Infinity;
    for (const c of cands.slice(0, 3)) {
      if (c.value < -400) continue;
      const sim = simulate(s, side, c.action, opts);
      if (!sim) continue;
      if (sim.queue.length && sim.queue[0].side === side) drainQueue(sim, side, opts, false);
      const t = terminal(sim, side);
      const v = t !== null ? t : evaluate(sim, side) - base;
      const mixed = 0.5 * v + 0.5 * c.value;
      if (mixed > bestV) {
        bestV = mixed;
        best = c;
      }
    }
    return best.action;
  }
  return cands[0].action;
}

/** Ejecuta pasos de la IA hasta que le toque a otro (útil en simulaciones). */
export function sideToAct(s: GameState): Side {
  return s.queue.length ? s.queue[0].side : s.active;
}
