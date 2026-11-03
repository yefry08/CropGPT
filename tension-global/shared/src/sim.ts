import { chooseAction, type AILevel } from './ai';
import { applyActionMut, createGame } from './engine';
import { makeRng } from './rng';
import type { GameState, Side } from './types';

export interface SimResult {
  winner: Side | 'draw';
  vp: number;
  turns: number;
  reason: string;
  state: GameState;
  steps: number;
}

/** Juega una partida completa IA contra IA (determinista según la semilla). */
export function playAIGame(seed: number, levels: Record<Side, AILevel> = { W: 'normal', E: 'normal' }): SimResult {
  const s = createGame(seed);
  const rand = makeRng(seed ^ 0x9e3779b9);
  let steps = 0;
  while (s.phase === 'play') {
    if (++steps > 4000) throw new Error(`Partida ${seed} no termina`);
    const side: Side = s.queue.length ? s.queue[0].side : s.active;
    const a = chooseAction(s, side, { level: levels[side], rand });
    applyActionMut(s, side, a);
  }
  return { winner: s.winner as Side | 'draw', vp: s.vp, turns: s.turn, reason: s.endReason ?? '', state: s, steps };
}

export interface BalanceReport {
  games: number;
  W: number;
  E: number;
  draw: number;
  byReason: Record<string, number>;
  avgVp: number;
}

export function runBalance(n: number, firstSeed = 1, levels?: Record<Side, AILevel>): BalanceReport {
  const rep: BalanceReport = { games: n, W: 0, E: 0, draw: 0, byReason: {}, avgVp: 0 };
  for (let i = 0; i < n; i++) {
    const r = playAIGame(firstSeed + i, levels);
    if (r.winner === 'W') rep.W++;
    else if (r.winner === 'E') rep.E++;
    else rep.draw++;
    const key = r.reason.replace(/[+-]?\d+/g, 'N').slice(0, 40);
    rep.byReason[key] = (rep.byReason[key] ?? 0) + 1;
    rep.avgVp += r.vp / n;
  }
  return rep;
}

/** Igual que runBalance pero cede el control al bucle de eventos entre tandas (para no bloquear a Vitest). */
export async function runBalanceAsync(n: number, firstSeed = 1, levels?: Record<Side, AILevel>, chunk = 20): Promise<BalanceReport> {
  const rep: BalanceReport = { games: n, W: 0, E: 0, draw: 0, byReason: {}, avgVp: 0 };
  for (let i = 0; i < n; i++) {
    const r = playAIGame(firstSeed + i, levels);
    if (r.winner === 'W') rep.W++;
    else if (r.winner === 'E') rep.E++;
    else rep.draw++;
    const key = r.reason.replace(/[+-]?\d+/g, 'N').slice(0, 40);
    rep.byReason[key] = (rep.byReason[key] ?? 0) + 1;
    rep.avgVp += r.vp / n;
    if ((i + 1) % chunk === 0) await new Promise((res) => setTimeout(res, 0));
  }
  return rep;
}
