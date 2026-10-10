import { COUNTRY, activeIds, countryName, isActive, isSuperNeighbor, neighborsOf } from './countries';
import type { Lang } from './i18n';
import type { CountryId, GameState, Influence, Placement, Region, RegionScore, RegionScoreSide, Side } from './types';
import { other } from './types';

export const REGION_VALUES: Record<Region, [number, number, number]> = {
  EU: [3, 7, 12],
  AS: [3, 7, 9],
  ME: [3, 5, 7],
  AM: [2, 5, 7],
  AF: [1, 4, 6],
};

export const TECH_NAMES = [
  'Satélite',
  'Vuelo tripulado',
  'Alunizaje',
  'ARPANET',
  'GPS',
  'Internet global',
  'Smartphone',
  'IA avanzada',
];
export const TECH_MIN_OPS = [2, 2, 2, 3, 3, 3, 3, 4];
export const TECH_VP_FIRST = [2, 1, 3, 1, 2, 2, 3, 4];
export const TECH_VP_SECOND = [1, 0, 1, 0, 1, 1, 1, 2];
/** Hitos (índice) que además dan +1 Capacidad de IA. */
export const TECH_CAP_MILESTONES = [3, 5, 7];
export const MAX_CAP = 5;
export const MAX_RISK = 10;
export const VP_LIMIT = 20;

export function infOf(state: GameState, c: CountryId, s: Side): number {
  return state.influence[c]?.[s] ?? 0;
}

export function controllerOf(inf: Influence | undefined, c: CountryId): Side | null {
  if (!inf) return null;
  const st = COUNTRY[c].stab;
  if (inf.W >= st && inf.W - inf.E >= st) return 'W';
  if (inf.E >= st && inf.E - inf.W >= st) return 'E';
  return null;
}

export function controller(state: GameState, c: CountryId): Side | null {
  return controllerOf(state.influence[c], c);
}

/** 1 punto por ficha; 2 si el rival controla el país. */
export function placementCost(state: GameState, side: Side, c: CountryId): number {
  return controller(state, c) === other(side) ? 2 : 1;
}

export function accessibleIn(inf: Record<CountryId, Influence>, era: GameState['era'], side: Side, c: CountryId): boolean {
  if (!isActive(c, era) || !inf[c]) return false;
  if (inf[c][side] > 0) return true;
  if (isSuperNeighbor(side, c, era)) return true;
  for (const n of neighborsOf(c, era)) if (inf[n] && inf[n][side] > 0) return true;
  return false;
}

export function accessible(state: GameState, side: Side, c: CountryId): boolean {
  return accessibleIn(state.influence, state.era, side, c);
}

export function accessibleCountries(state: GameState, side: Side): CountryId[] {
  return activeIds(state.era).filter((c) => accessible(state, side, c));
}

export interface PlacementSim {
  error: string | null;
  influence: Record<CountryId, Influence>;
  spent: number;
}

/** Valida y simula colocaciones en orden (la influencia recién puesta abre nuevos vecinos). */
export function simulatePlacements(state: GameState, side: Side, ops: number, placements: Placement[], lang: Lang = 'es'): PlacementSim {
  const en = lang === 'en';
  const tmp: Record<CountryId, Influence> = {};
  for (const id in state.influence) tmp[id] = { W: state.influence[id].W, E: state.influence[id].E };
  let spent = 0;
  for (const p of placements) {
    if (!Number.isInteger(p.n) || p.n < 0) return { error: en ? 'Invalid amount' : 'Cantidad inválida', influence: tmp, spent };
    for (let i = 0; i < p.n; i++) {
      if (!accessibleIn(tmp, state.era, side, p.c)) return { error: en ? `${countryName(p.c, state.era, 'en')} is not reachable` : `${COUNTRY[p.c]?.name ?? p.c} no es accesible`, influence: tmp, spent };
      const cost = controllerOf(tmp[p.c], p.c) === other(side) ? 2 : 1;
      if (spent + cost > ops) return { error: en ? 'No operations points left' : 'No quedan puntos de operaciones', influence: tmp, spent };
      spent += cost;
      tmp[p.c][side] += 1;
    }
  }
  return { error: null, influence: tmp, spent };
}

export function coupBlockedReason(state: GameState, c: CountryId, lang: Lang = 'es'): string | null {
  const r = COUNTRY[c].region;
  const en = lang === 'en';
  if (r === 'EU' && state.tension <= 4) return en ? 'No coups in Europe at Tension 4 or lower' : 'Con Tensión 4 o menos no hay golpes en Europa';
  if (r === 'AS' && state.tension <= 3) return en ? 'No coups in Asia at Tension 3 or lower' : 'Con Tensión 3 o menos no hay golpes en Asia';
  if (r === 'ME' && state.tension <= 2) return en ? 'No coups in the Middle East at Tension 2 or lower' : 'Con Tensión 2 o menos no hay golpes en Medio Oriente';
  return null;
}

export function coupTargets(state: GameState, side: Side): CountryId[] {
  return activeIds(state.era).filter((c) => infOf(state, c, other(side)) > 0 && !coupBlockedReason(state, c));
}

/** +1 op por nivel de Capacidad de IA en el primer golpe de cada turno. */
export function coupBonus(state: GameState, side: Side): number {
  return state.firstCoupDone[side] ? 0 : state.cap[side];
}

export function coupStrength(die: number, ops: number, bonus: number, c: CountryId): number {
  return die + ops + bonus - 2 * COUNTRY[c].stab;
}

const regionCache = new Map<string, CountryId[]>();
export function regionCountries(era: GameState['era'], region: Region): CountryId[] {
  const k = `${era}${region}`;
  let a = regionCache.get(k);
  if (!a) {
    a = activeIds(era).filter((id) => COUNTRY[id].region === region);
    regionCache.set(k, a);
  }
  return a;
}

const keyCountCache = new Map<string, number>();

export function scoreRegion(state: GameState, region: Region): RegionScore {
  const ids = regionCountries(state.era, region);
  const ck = `${state.era}${region}`;
  let keyTotal = keyCountCache.get(ck);
  if (keyTotal === undefined) {
    keyTotal = ids.filter((id) => COUNTRY[id].key).length;
    keyCountCache.set(ck, keyTotal);
  }
  const mk = (): RegionScoreSide => ({ controlled: 0, keyControlled: 0, nearRival: 0, status: 'none', base: 0, total: 0 });
  const res = { W: mk(), E: mk() };
  for (const id of ids) {
    const ctl = controller(state, id);
    if (!ctl) continue;
    const r = res[ctl];
    r.controlled++;
    if (COUNTRY[id].key) r.keyControlled++;
    if (isSuperNeighbor(other(ctl), id, state.era)) r.nearRival++;
  }
  const vals = REGION_VALUES[region];
  for (const s of ['W', 'E'] as Side[]) {
    const me = res[s];
    const foe = res[other(s)];
    if (keyTotal > 0 && me.keyControlled === keyTotal && me.controlled > foe.controlled) {
      me.status = 'control';
      me.base = vals[2];
    } else if (
      me.controlled > foe.controlled &&
      me.keyControlled > foe.keyControlled &&
      me.keyControlled >= 1 &&
      me.controlled - me.keyControlled >= 1
    ) {
      me.status = 'domination';
      me.base = vals[1];
    } else if (me.controlled >= 1) {
      me.status = 'presence';
      me.base = vals[0];
    }
    me.total = me.base + me.keyControlled + me.nearRival;
  }
  return { region, keyTotal, total: ids.length, W: res.W, E: res.E, net: res.W.total - res.E.total };
}

export function techScore(state: GameState, s: Side): number {
  return state.tech[s] + state.cap[s];
}
