import { ALL_CARDS, CARD } from './cards';
import { COUNTRY, activeIds, countryName, isActive, neighborsOf } from './countries';
import { ERA_INFO } from './eras';
import { d6, shuffle } from './rng';
import {
  MAX_CAP,
  MAX_RISK,
  TECH_CAP_MILESTONES,
  TECH_MIN_OPS,
  TECH_NAMES,
  TECH_VP_FIRST,
  TECH_VP_SECOND,
  VP_LIMIT,
  accessible,
  controller,
  coupBlockedReason,
  coupBonus,
  coupStrength,
  coupTargets,
  infOf,
  regionCountries,
  scoreRegion,
  simulatePlacements,
  techScore,
} from './rules';
import { HAND_SIZE, INITIAL_INFLUENCE, ROUNDS_PER_TURN, START_VP, TOTAL_TURNS } from './setup';
import type {
  Action,
  CardId,
  CountryId,
  Eff,
  Era,
  FreeOpts,
  GameState,
  LogKind,
  Placement,
  Region,
  Side,
  SideRef,
} from './types';
import { REGIONS, REGION_NAME, SIDE_NAME, other } from './types';

export class GameError extends Error {}
const fail = (msg: string): never => {
  throw new GameError(msg);
};

// ——— Clonado ———
export function cloneState(s: GameState): GameState {
  return cloneWith(s, s.log.slice());
}

/** Copia sin historial (para simulaciones de la IA). */
export function cloneLite(s: GameState): GameState {
  return cloneWith(s, []);
}

function cloneWith(s: GameState, log: GameState['log']): GameState {
  const influence: GameState['influence'] = {};
  for (const id in s.influence) influence[id] = { W: s.influence[id].W, E: s.influence[id].E };
  return {
    ...s,
    influence,
    tech: { ...s.tech },
    techTried: { ...s.techTried },
    cap: { ...s.cap },
    firstCoupDone: { ...s.firstCoupDone },
    hands: { W: s.hands.W.slice(), E: s.hands.E.slice() },
    deck: s.deck.slice(),
    discard: s.discard.slice(),
    removed: s.removed.slice(),
    queue: s.queue.map((p) => ({ ...p })),
    log,
  };
}

// ——— Registro ———
function log(
  s: GameState,
  kind: LogKind,
  text: string,
  side?: Side,
  dice?: { value: number; label: string; side?: Side },
) {
  s.log.push({ id: ++s.logSeq, turn: s.turn, round: s.round, side, kind, text, dice });
}

const sideName = (x: Side) => SIDE_NAME[x];
const cname = (s: GameState, c: CountryId) => countryName(c, s.era);

// ——— Creación ———
export function createGame(seed: number = Date.now() | 0): GameState {
  const influence: GameState['influence'] = {};
  for (const c of Object.values(COUNTRY)) influence[c.id] = { W: 0, E: 0 };
  for (const [id, v] of Object.entries(INITIAL_INFLUENCE)) {
    influence[id].W = v.W ?? 0;
    influence[id].E = v.E ?? 0;
  }
  const s: GameState = {
    v: 1,
    seed,
    rng: seed | 0,
    turn: 1,
    round: 1,
    era: 1,
    active: 'E',
    phase: 'play',
    winner: null,
    endReason: null,
    vp: START_VP,
    tension: 5,
    influence,
    tech: { W: 0, E: 0 },
    techTried: { W: false, E: false },
    cap: { W: 0, E: 0 },
    risk: 0,
    firstCoupDone: { W: false, E: false },
    hands: { W: [], E: [] },
    deck: [],
    discard: [],
    removed: [],
    queue: [],
    log: [],
    logSeq: 0,
    ussrDissolved: false,
    version: 0,
  };
  log(s, 'info', 'Comienza la partida. El Bloque Oriental juega primero.');
  startTurn(s);
  return s;
}

// ——— Consultas ———
export function actingSide(s: GameState): Side {
  return s.queue.length ? s.queue[0].side : s.active;
}

export function techNextIndex(s: GameState, side: Side): number {
  return s.tech[side];
}

/** Motivo por el que una carta no puede usarse en carrera tecnológica, o null. */
export function techBlockedReason(s: GameState, side: Side, cardId: CardId): string | null {
  const card = CARD[cardId];
  if (!card || card.kind === 'score') return 'Las cartas de puntuación no sirven para tecnología';
  if (s.techTried[side]) return 'Ya intentaste un hito este turno';
  const idx = s.tech[side];
  if (idx >= TECH_NAMES.length) return 'Ya alcanzaste todos los hitos';
  if (card.ops < TECH_MIN_OPS[idx]) return `${TECH_NAMES[idx]} exige una carta de ${TECH_MIN_OPS[idx]}+ ops`;
  return null;
}

export function eventBlockedReason(side: Side, cardId: CardId): string | null {
  const card = CARD[cardId];
  if (!card) return 'Carta desconocida';
  if (card.kind === 'score') return 'Las cartas de puntuación solo se puntúan';
  if (card.owner !== 'N' && card.owner !== side) return 'El evento es del rival: solo se activa al jugarla por operaciones';
  return null;
}

// ——— VP, victoria y Tensión ———
function endGame(s: GameState, winner: Side | 'draw', reason: string) {
  if (s.phase === 'over') return;
  s.phase = 'over';
  s.winner = winner;
  s.endReason = reason;
  s.queue = [];
  log(s, 'over', winner === 'draw' ? `Empate. ${reason}` : `Gana ${sideName(winner)}. ${reason}`);
}

function addVP(s: GameState, side: Side, n: number) {
  if (n === 0 || s.phase === 'over') return;
  s.vp = Math.max(-VP_LIMIT, Math.min(VP_LIMIT, s.vp + (side === 'W' ? n : -n)));
  if (s.vp >= VP_LIMIT) endGame(s, 'W', `Alcanza ${VP_LIMIT} PV.`);
  else if (s.vp <= -VP_LIMIT) endGame(s, 'E', `Alcanza ${VP_LIMIT} PV.`);
}

/** Ambos bandos pierden n PV: el marcador se acerca al centro. */
function pullToCenter(s: GameState, n: number) {
  if (s.vp > 0) s.vp = Math.max(0, s.vp - n);
  else if (s.vp < 0) s.vp = Math.min(0, s.vp + n);
}

interface Ctx {
  me: Side; // beneficiario del evento
  actor: Side; // jugador que realiza la acción
  /** Evento rival activado por jugar su carta por operaciones. */
  viaOps: boolean;
  /** Efecto del sistema (no hay culpable). */
  system?: boolean;
}

function changeTension(s: GameState, delta: number, ctx: Ctx, why: string) {
  if (s.phase === 'over' || delta === 0) return;
  const before = s.tension;
  let t = Math.max(1, Math.min(5, before + delta));
  if (t <= 1 && delta < 0) {
    if (ctx.viaOps || ctx.system) t = 2;
    else {
      s.tension = 1;
      log(s, 'tension', `La Tensión llega a 1 (${why}).`, ctx.actor);
      endGame(s, other(ctx.actor), `La Tensión nuclear llegó a 1 por una acción de ${sideName(ctx.actor)}.`);
      return;
    }
  }
  s.tension = t;
  if (t !== before) log(s, 'tension', `Tensión ${before} → ${t} (${why}).`);
}

// ——— Tecnología e IA ———
function changeRisk(s: GameState, n: number) {
  if (s.era < 4 || s.phase === 'over') return;
  const before = s.risk;
  s.risk = Math.max(0, Math.min(MAX_RISK, s.risk + n));
  if (s.risk !== before) log(s, 'ia', `Riesgo de IA ${before} → ${s.risk}.`);
  if (s.risk >= MAX_RISK) {
    log(s, 'ia', 'Colapso por IA: ambos bandos pierden 5 PV (el marcador se acerca al centro) y la Tensión baja 2.');
    pullToCenter(s, 5);
    changeTension(s, -2, { me: 'W', actor: 'W', viaOps: false, system: true }, 'colapso por IA');
    s.risk = 5;
  }
}

function changeCap(s: GameState, side: Side, n: number) {
  const before = s.cap[side];
  s.cap[side] = Math.max(0, Math.min(MAX_CAP, before + n));
  if (s.cap[side] !== before) log(s, 'ia', `Capacidad de IA de ${sideName(side)}: ${before} → ${s.cap[side]}.`, side);
}

function advanceTech(s: GameState, side: Side) {
  const idx = s.tech[side];
  if (idx >= TECH_NAMES.length) return;
  s.tech[side] = idx + 1;
  const first = s.tech[other(side)] <= idx;
  const vp = first ? TECH_VP_FIRST[idx] : TECH_VP_SECOND[idx];
  log(
    s,
    'tech',
    `${sideName(side)} alcanza «${TECH_NAMES[idx]}» (${first ? 'primero' : 'segundo'}): ${vp} PV.`,
    side,
  );
  addVP(s, side, vp);
  if (TECH_CAP_MILESTONES.includes(idx)) changeCap(s, side, 1);
  if (idx === TECH_NAMES.length - 1) changeRisk(s, 1);
}

// ——— Efectos de eventos ———
const resolveSide = (ref: SideRef, me: Side): Side => (ref === 'me' ? me : ref === 'foe' ? other(me) : ref);

export function freeCapacity(s: GameState, side: Side, n: number, o: FreeOpts): number {
  const regs = o.regions ?? (o.region ? [o.region] : null);
  const max = o.max ?? 99;
  let cap = 0;
  for (const c of activeIds(s.era)) {
    if (regs && !regs.includes(COUNTRY[c].region)) continue;
    if (o.mode === 'remove') cap += Math.min(max, infOf(s, c, other(side)));
    else if (o.own) {
      if (infOf(s, c, side) > 0) cap += max;
    } else cap += max;
    if (cap >= n) return n;
  }
  return Math.min(cap, n);
}

function runEffects(s: GameState, effs: Eff[], ctx: Ctx, cardId: CardId) {
  for (const e of effs) {
    if (s.phase === 'over') return;
    switch (e.k) {
      case 'inf': {
        if (!isActive(e.c, s.era)) break;
        const side = resolveSide(e.s, ctx.me);
        s.influence[e.c][side] += e.n;
        log(s, 'inf', `${sideName(side)}: +${e.n} de influencia en ${cname(s, e.c)}.`, side);
        break;
      }
      case 'rem': {
        if (!isActive(e.c, s.era)) break;
        const side = resolveSide(e.s, ctx.me);
        const have = s.influence[e.c][side];
        const n = Math.min(have, e.n);
        if (n <= 0) break;
        s.influence[e.c][side] -= n;
        log(s, 'inf', `${sideName(side)}: −${n} de influencia en ${cname(s, e.c)}.`, side);
        break;
      }
      case 'vp': {
        const side = resolveSide(e.s, ctx.me);
        log(s, 'score', `${sideName(side)} ${e.n >= 0 ? 'gana' : 'pierde'} ${Math.abs(e.n)} PV.`, side);
        addVP(s, side, e.n);
        break;
      }
      case 'tension':
        changeTension(s, e.n, ctx, CARD[cardId].name);
        break;
      case 'setTension':
        if (e.n < s.tension) {
          log(s, 'tension', `Tensión ${s.tension} → ${e.n} (${CARD[cardId].name}).`);
          s.tension = e.n;
        }
        break;
      case 'tech':
        advanceTech(s, resolveSide(e.s, ctx.me));
        break;
      case 'risk':
        changeRisk(s, e.n);
        break;
      case 'cap':
        changeCap(s, resolveSide(e.s, ctx.me), e.n);
        break;
      case 'free': {
        const side = resolveSide(e.s, ctx.me);
        const n = freeCapacity(s, side, e.n, e.o);
        if (n > 0) s.queue.push({ kind: 'free', side, n, o: e.o, cardId });
        break;
      }
      case 'war':
        resolveWar(s, ctx.me, e.c, e.vp);
        break;
      case 'if':
        runEffects(s, ctx.me === e.s ? e.then : e.else, ctx, cardId);
        break;
    }
  }
}

function resolveWar(s: GameState, me: Side, c: CountryId, vp: number) {
  if (!isActive(c, s.era)) return;
  const foe = other(me);
  const hostile = neighborsOf(c, s.era).filter((n) => controller(s, n) === foe).length;
  const die = d6(s);
  const result = die - hostile;
  const label = `Guerra en ${cname(s, c)}: 1d6 = ${die}${hostile ? ` − ${hostile}` : ''} = ${result}`;
  if (result >= 4) {
    const foeInf = s.influence[c][foe];
    s.influence[c][foe] = 0;
    s.influence[c][me] += foeInf;
    log(s, 'war', `${label}. Victoria de ${sideName(me)}: sustituye ${foeInf} de influencia rival y gana ${vp} PV.`, me, {
      value: die,
      label,
      side: me,
    });
    addVP(s, me, vp);
  } else {
    log(s, 'war', `${label}. La guerra no logra cambiar la situación (se necesita 4+).`, me, { value: die, label, side: me });
  }
}

// ——— Mazo y turnos ———
function draw(s: GameState, side: Side) {
  const hand = s.hands[side];
  while (hand.length < HAND_SIZE) {
    if (s.deck.length === 0) {
      if (s.discard.length === 0) return;
      s.deck = shuffle(s, s.discard);
      s.discard = [];
      log(s, 'info', 'Se baraja el descarte para formar un nuevo mazo.');
    }
    hand.push(s.deck.pop()!);
  }
}

function rebuildDeck(s: GameState, era: Era) {
  const held = new Set<CardId>([...s.hands.W, ...s.hands.E]);
  const gone = new Set<CardId>(s.removed);
  const pool = [...s.deck, ...s.discard];
  const keep: CardId[] = [];
  for (const id of pool) {
    const c = CARD[id];
    if (c.kind === 'gen' || c.kind === 'score' || c.era === era) keep.push(id);
    else {
      s.removed.push(id); // cartas de la era anterior salen del juego
      gone.add(id);
    }
  }
  const inPool = new Set(keep);
  const fresh = ALL_CARDS.filter((c) => c.era === era && !held.has(c.id) && !gone.has(c.id) && !inPool.has(c.id)).map((c) => c.id);
  s.deck = shuffle(s, [...keep, ...fresh]);
  s.discard = [];
}

function dissolveUSSR(s: GameState) {
  s.ussrDissolved = true;
  const dde = s.influence['dde'];
  s.influence['de'].W += dde.W;
  dde.W = 0;
  dde.E = 0;
  for (const c of ['pl', 'cz', 'hu', 'af', 'et']) s.influence[c].E = Math.max(0, s.influence[c].E - 1);
}

function startTurn(s: GameState) {
  const era = (Math.ceil(s.turn / 2)) as Era;
  const newEra = s.turn % 2 === 1;
  s.era = era;
  s.round = 1;
  s.active = 'E';
  s.firstCoupDone = { W: false, E: false };
  s.techTried = { W: false, E: false };
  if (newEra) {
    const info = ERA_INFO[era];
    log(s, 'era', `Nueva era: ${info.title} (${info.years}).`);
    if (era === 4) {
      dissolveUSSR(s);
      s.risk = 3;
      log(
        s,
        'era',
        'Se disuelve la URSS: desaparece Alemania Oriental (su influencia occidental pasa a Alemania); aparecen Ucrania, Georgia, Kazajistán y Emiratos; el Bloque Oriental pierde 1 de influencia en Polonia, Chequia, Hungría, Afganistán y Etiopía.',
      );
    }
    rebuildDeck(s, era);
  }
  if (era === 4 && newEra) s.tension = 5;
  else s.tension = Math.min(5, s.tension + 1);
  draw(s, 'E');
  draw(s, 'W');
  log(s, 'info', `Turno ${s.turn} · ronda 1. Tensión ${s.tension}.`);
}

function scoreAndLog(s: GameState, region: Region, why: string) {
  const sc = scoreRegion(s, region);
  const st = (x: Side) => {
    const r = sc[x];
    const name = { none: 'sin presencia', presence: 'Presencia', domination: 'Dominio', control: 'Control' }[r.status];
    return `${sideName(x)} ${name} (${r.base} + ${r.keyControlled} clave + ${r.nearRival} vecinos = ${r.total})`;
  };
  const winner: Side | null = sc.net > 0 ? 'W' : sc.net < 0 ? 'E' : null;
  log(
    s,
    'score',
    `${why} ${REGION_NAME[region]}: ${st('W')}; ${st('E')}. ` +
      (winner ? `${sideName(winner)} gana ${Math.abs(sc.net)} PV.` : 'Sin cambios.'),
    winner ?? undefined,
  );
  if (winner) addVP(s, winner, Math.abs(sc.net));
}

function endTurn(s: GameState) {
  // Cartas de puntuación retenidas se puntúan solas.
  for (const side of ['E', 'W'] as Side[]) {
    for (const id of s.hands[side].slice()) {
      const c = CARD[id];
      if (c.kind !== 'score' || !c.region) continue;
      s.hands[side] = s.hands[side].filter((x) => x !== id);
      s.discard.push(id);
      scoreAndLog(s, c.region, `Puntuación automática de ${c.name.replace('Puntuación: ', '')} retenida por ${sideName(side)}:`);
      if (s.phase === 'over') return;
    }
  }
  if (s.era >= 4 && s.risk >= 8) {
    const a = techScore(s, 'W');
    const b = techScore(s, 'E');
    if (a === b) {
      log(s, 'ia', 'Incidente de IA: ambos bandos tienen igual tecnología y pierden 2 PV (el marcador se acerca al centro).');
      pullToCenter(s, 2);
    } else {
      const loser: Side = a > b ? 'W' : 'E';
      log(s, 'ia', `Incidente de IA: ${sideName(loser)}, con más tecnología, pierde 3 PV.`, loser);
      addVP(s, other(loser), 3);
    }
    changeTension(s, -1, { me: 'W', actor: 'W', viaOps: false, system: true }, 'incidente de IA');
    s.risk = 5;
    if (s.phase === 'over') return;
  }
  if (s.turn >= TOTAL_TURNS) {
    log(s, 'score', 'Puntuación final de 2026: se puntúan todas las regiones.');
    for (const r of REGIONS) {
      scoreAndLog(s, r, 'Final:');
      if (s.phase === 'over') return;
    }
    endGame(s, s.vp > 0 ? 'W' : s.vp < 0 ? 'E' : 'draw', `Puntuación final: ${s.vp > 0 ? '+' : ''}${s.vp} PV.`);
    return;
  }
  s.turn++;
  startTurn(s);
}

/** Pasa al siguiente jugador/ronda cuando no queda nada pendiente. */
function settle(s: GameState) {
  while (s.phase === 'play' && s.queue.length === 0) {
    if (s.active === 'E') s.active = 'W';
    else {
      s.round++;
      s.active = 'E';
    }
    if (s.round > ROUNDS_PER_TURN || (s.hands.E.length === 0 && s.hands.W.length === 0)) {
      endTurn(s);
      return;
    }
    if (s.hands[s.active].length > 0) {
      if (s.active === 'E') log(s, 'info', `Ronda ${s.round}.`);
      return;
    }
  }
}

// ——— Acciones ———
function takeFromHand(s: GameState, side: Side, id: CardId) {
  const i = s.hands[side].indexOf(id);
  if (i < 0) fail('Esa carta no está en tu mano');
  s.hands[side].splice(i, 1);
}

function sinkCard(s: GameState, id: CardId, retire: boolean) {
  if (retire) s.removed.push(id);
  else s.discard.push(id);
}

function validatePlacementsFree(s: GameState, side: Side, p: Extract<GameState['queue'][number], { kind: 'free' }>, placements: Placement[]) {
  const regs = p.o.regions ?? (p.o.region ? [p.o.region] : null);
  const max = p.o.max ?? 99;
  const per: Record<string, number> = {};
  let total = 0;
  const tmp = new Map<CountryId, { W: number; E: number }>();
  const get = (c: CountryId) => {
    let v = tmp.get(c);
    if (!v) {
      v = { W: s.influence[c].W, E: s.influence[c].E };
      tmp.set(c, v);
    }
    return v;
  };
  for (const pl of placements) {
    if (!isActive(pl.c, s.era)) fail('País no disponible');
    if (!Number.isInteger(pl.n) || pl.n < 0) fail('Cantidad inválida');
    if (regs && !regs.includes(COUNTRY[pl.c].region)) fail(`${cname(s, pl.c)} está fuera de la región permitida`);
    for (let i = 0; i < pl.n; i++) {
      per[pl.c] = (per[pl.c] ?? 0) + 1;
      total++;
      if (per[pl.c] > max) fail(`Máximo ${max} por país`);
      if (total > p.n) fail(`Solo puedes colocar ${p.n}`);
      const v = get(pl.c);
      if (p.o.mode === 'remove') {
        if (v[other(side)] <= 0) fail(`No hay influencia rival en ${cname(s, pl.c)}`);
        v[other(side)]--;
      } else {
        if (p.o.own && v[side] <= 0) fail(`Necesitas presencia en ${cname(s, pl.c)}`);
        v[side]++;
      }
    }
  }
  return tmp;
}

export function applyActionMut(s: GameState, side: Side, a: Action): void {
  if (s.phase === 'over') fail('La partida terminó');
  if (actingSide(s) !== side) fail('No es tu turno');
  const head = s.queue[0];

  switch (a.type) {
    case 'playEvent': {
      if (head) fail('Hay una acción pendiente');
      const why = eventBlockedReason(side, a.card);
      if (why) fail(why);
      takeFromHand(s, side, a.card);
      const card = CARD[a.card];
      log(s, 'play', `${sideName(side)} juega «${card.name}» como evento.`, side);
      sinkCard(s, a.card, !!card.removed);
      runEffects(s, card.eff, { me: side, actor: side, viaOps: false }, a.card);
      break;
    }
    case 'playOps': {
      if (head) fail('Hay una acción pendiente');
      const card = CARD[a.card];
      if (!card || card.kind === 'score') fail('Esa carta no sirve para operaciones');
      takeFromHand(s, side, a.card);
      log(s, 'play', `${sideName(side)} juega «${card.name}» por operaciones (${card.ops}) — ${a.kind === 'coup' ? 'golpe' : 'influencia'}.`, side);
      const rival = card.owner === other(side);
      sinkCard(s, a.card, rival && !!card.removed);
      if (rival) {
        log(s, 'event', `Se activa el evento rival «${card.name}».`, other(side));
        runEffects(s, card.eff, { me: other(side), actor: side, viaOps: true }, a.card);
      }
      if (s.phase === 'play') s.queue.push({ kind: 'ops', side, mode: a.kind, ops: card.ops, cardId: a.card });
      break;
    }
    case 'playTech': {
      if (head) fail('Hay una acción pendiente');
      const why = techBlockedReason(s, side, a.card);
      if (why) fail(why);
      takeFromHand(s, side, a.card);
      const card = CARD[a.card];
      const idx = s.tech[side];
      s.techTried[side] = true;
      s.discard.push(a.card);
      const limit = s.tech[side] < s.tech[other(side)] ? 4 : 3;
      const die = d6(s);
      const label = `Tecnología «${TECH_NAMES[idx]}»: 1d6 = ${die} (éxito con ${limit} o menos)`;
      log(s, 'play', `${sideName(side)} descarta «${card.name}» (${card.ops}) para la carrera tecnológica; su evento no se activa.`, side);
      if (die <= limit) {
        log(s, 'tech', `${label}. ¡Éxito!`, side, { value: die, label, side });
        advanceTech(s, side);
      } else log(s, 'tech', `${label}. Fracaso.`, side, { value: die, label, side });
      break;
    }
    case 'playScore': {
      if (head) fail('Hay una acción pendiente');
      const card = CARD[a.card];
      if (!card || card.kind !== 'score' || !card.region) fail('No es una carta de puntuación');
      takeFromHand(s, side, a.card);
      s.discard.push(a.card);
      log(s, 'play', `${sideName(side)} juega «${card.name}».`, side);
      scoreAndLog(s, card.region!, 'Puntuación de');
      break;
    }
    case 'commitInfluence': {
      if (!head || head.kind !== 'ops' || head.mode !== 'influence') fail('No hay influencia que colocar');
      const h = head as Extract<typeof head, { kind: 'ops' }>;
      const sim = simulatePlacements(s, side, h.ops, a.placements);
      if (sim.error) fail(sim.error);
      for (const id in sim.influence) s.influence[id] = sim.influence[id];
      const parts = a.placements.filter((p) => p.n > 0).map((p) => `${cname(s, p.c)} +${p.n}`);
      log(s, 'inf', `${sideName(side)} coloca influencia (${sim.spent}/${h.ops} ops): ${parts.join(', ') || 'nada'}.`, side);
      s.queue.shift();
      break;
    }
    case 'commitCoup': {
      if (!head || head.kind !== 'ops' || head.mode !== 'coup') fail('No hay un golpe pendiente');
      const h = head as Extract<typeof head, { kind: 'ops' }>;
      const c = a.target;
      if (!isActive(c, s.era)) fail('País no disponible');
      if (infOf(s, c, other(side)) <= 0) fail('No hay influencia rival en ese país');
      const blocked = coupBlockedReason(s, c);
      if (blocked) fail(blocked);
      const bonus = coupBonus(s, side);
      s.firstCoupDone[side] = true;
      const die = d6(s);
      const str = coupStrength(die, h.ops, bonus, c);
      const label = `Golpe en ${cname(s, c)}: 1d6 = ${die} + ${h.ops} ops${bonus ? ` + ${bonus} (IA)` : ''} − 2×${COUNTRY[c].stab} estabilidad = ${str}`;
      if (str > 0) {
        const foeHave = s.influence[c][other(side)];
        const removed = Math.min(foeHave, str);
        s.influence[c][other(side)] -= removed;
        const extra = str - removed;
        s.influence[c][side] += extra;
        log(s, 'coup', `${label}. Quita ${removed} de influencia rival${extra ? ` y coloca ${extra} propia` : ''}.`, side, { value: die, label, side });
      } else log(s, 'coup', `${label}. El golpe fracasa.`, side, { value: die, label, side });
      s.queue.shift();
      if (COUNTRY[c].key) changeTension(s, -1, { me: side, actor: side, viaOps: false }, `golpe en ${cname(s, c)}, país clave`);
      break;
    }
    case 'skipOps': {
      if (!head || head.kind !== 'ops') fail('Nada que omitir');
      const h = head as Extract<typeof head, { kind: 'ops' }>;
      if (h.mode === 'coup' && coupTargets(s, side).length > 0) fail('Hay objetivos válidos para el golpe');
      if (h.mode === 'influence' && activeIds(s.era).some((c) => accessible(s, side, c))) fail('Hay países donde colocar influencia');
      log(s, 'info', `${sideName(side)} no puede usar las operaciones.`, side);
      s.queue.shift();
      break;
    }
    case 'resolveFree': {
      if (!head || head.kind !== 'free') fail('No hay colocación pendiente');
      const h = head as Extract<typeof head, { kind: 'free' }>;
      const tmp = validatePlacementsFree(s, side, h, a.placements);
      for (const [c, v] of tmp) s.influence[c] = v;
      const parts = a.placements.filter((p) => p.n > 0).map((p) => `${cname(s, p.c)} ${h.o.mode === 'remove' ? '−' : '+'}${p.n}`);
      log(s, 'inf', `${sideName(side)} resuelve «${CARD[h.cardId].name}»: ${parts.join(', ') || 'sin cambios'}.`, side);
      s.queue.shift();
      break;
    }
    default:
      fail('Acción desconocida');
  }
  s.version++;
  settle(s);
}

/** Versión pura: devuelve un estado nuevo y no modifica el original. */
export function applyAction(state: GameState, side: Side, action: Action): GameState {
  const s = cloneState(state);
  applyActionMut(s, side, action);
  return s;
}

/** Colocaciones libres de cartas de evento (Plan Marshall, etc.). */
export function freeTargets(s: GameState, side: Side, o: FreeOpts): CountryId[] {
  const regs = o.regions ?? (o.region ? [o.region] : null);
  return activeIds(s.era).filter((c) => {
    if (regs && !regs.includes(COUNTRY[c].region)) return false;
    if (o.mode === 'remove') return infOf(s, c, other(side)) > 0;
    if (o.own) return infOf(s, c, side) > 0;
    return true;
  });
}

export { regionCountries };
