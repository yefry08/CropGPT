import { describe, expect, it } from 'vitest';
import { CARD } from '../src/cards';
import { COUNTRY, activeIds } from '../src/countries';
import { applyActionMut, createGame, techBlockedReason } from '../src/engine';
import { chooseAction } from '../src/ai';
import { makeRng } from '../src/rng';
import { playAIGame } from '../src/sim';
import type { GameState, Side } from '../src/types';
import { act, blank, hand, rig, setInf } from './helpers';

/** Juega una carta cualquiera por ops (sin colocar nada) hasta cerrar la ronda 6. */
function finishTurn(s: GameState) {
  s.round = 6;
  s.active = 'W';
  s.hands.W = ['cumbre', 'turing', 'turing'];
  act(s, 'W', { type: 'playOps', card: 'cumbre', kind: 'influence' });
  act(s, 'W', { type: 'commitInfluence', placements: [] });
}

describe('estructura temporal', () => {
  it('el Bloque Oriental juega primero; 6 rondas por turno y 10 turnos', () => {
    const s = createGame(1);
    expect(s.active).toBe('E');
    expect(s.turn).toBe(1);
    expect(s.round).toBe(1);
    expect(s.hands.W).toHaveLength(7);
    expect(s.hands.E).toHaveLength(7);
    // E juega, luego W, luego la ronda 2 empieza con E
    const e = s.hands.E.find((c) => CARD[c].kind !== 'score')!;
    act(s, 'E', { type: 'playOps', card: e, kind: 'influence' });
    if (s.queue.length) {
      // puede haber colocaciones libres del evento rival; las resolvemos vacías
      while (s.queue.length) {
        const h = s.queue[0];
        act(s, h.side, h.kind === 'free' ? { type: 'resolveFree', placements: [] } : { type: 'commitInfluence', placements: [] });
      }
    }
    expect(s.active).toBe('W');
    const w = s.hands.W.find((c) => CARD[c].kind !== 'score')!;
    act(s, 'W', { type: 'playOps', card: w, kind: 'influence' });
    while (s.queue.length) {
      const h = s.queue[0];
      act(s, h.side, h.kind === 'free' ? { type: 'resolveFree', placements: [] } : { type: 'commitInfluence', placements: [] });
    }
    expect(s.round).toBe(2);
    expect(s.active).toBe('E');
  });
  it('una partida IA contra IA recorre 10 turnos y termina', () => {
    let hasFinal = false;
    for (let seed = 1; seed <= 40 && !hasFinal; seed++) {
      const r = playAIGame(seed);
      expect(r.state.phase).toBe('over');
      if (r.turns === 10) hasFinal = true;
    }
    expect(hasFinal).toBe(true);
  });
});

describe('Tensión', () => {
  it('sube 1 al inicio de cada turno, con tope 5', () => {
    const s = blank();
    s.tension = 3;
    finishTurn(s);
    expect(s.turn).toBe(2);
    expect(s.tension).toBe(4);
    finishTurn(s);
    expect(s.tension).toBe(5);
    finishTurn(s);
    expect(s.tension).toBe(5);
  });
});

describe('carrera tecnológica', () => {
  it('exige ops mínimos por hito y solo una vez por turno', () => {
    const s = blank();
    s.active = 'E';
    hand(s, 'E', ['cumbre', 'otan', 'ayuda']); // cumbre 1 op, otan 4 ops
    expect(techBlockedReason(s, 'E', 'cumbre')).toMatch(/2\+ ops/);
    rig(s, 3);
    act(s, 'E', { type: 'playTech', card: 'otan' }); // carta rival: su evento NO se activa
    expect(s.influence.tr.W).toBe(0);
    expect(s.tech.E).toBe(1);
    expect(s.vp).toBe(-2); // primero en Satélite
    expect(s.discard).toContain('otan');
    s.active = 'E';
    expect(techBlockedReason(s, 'E', 'ayuda')).toMatch(/este turno/);
  });
  it('éxito con 3 o menos; 4 o menos si vas por detrás', () => {
    const s = blank();
    s.active = 'E';
    hand(s, 'E', ['ayuda']);
    rig(s, 4);
    act(s, 'E', { type: 'playTech', card: 'ayuda' });
    expect(s.tech.E).toBe(0); // 4 con ventaja neutra: fracaso

    const t = blank();
    t.tech.W = 2; // E va por detrás
    t.active = 'E';
    hand(t, 'E', ['ayuda']);
    rig(t, 4);
    act(t, 'E', { type: 'playTech', card: 'ayuda' });
    expect(t.tech.E).toBe(1);
    expect(t.vp).toBe(-1); // Satélite: llega segundo (W ya lo tenía) → 1 PV
  });
  it('PV: 2/1/3/1/2/2/3/4 al primero y 1/0/1/0/1/1/1/2 al segundo', async () => {
    const { TECH_VP_FIRST, TECH_VP_SECOND, TECH_MIN_OPS, TECH_NAMES } = await import('../src/rules');
    expect(TECH_VP_FIRST).toEqual([2, 1, 3, 1, 2, 2, 3, 4]);
    expect(TECH_VP_SECOND).toEqual([1, 0, 1, 0, 1, 1, 1, 2]);
    expect(TECH_MIN_OPS).toEqual([2, 2, 2, 3, 3, 3, 3, 4]);
    expect(TECH_NAMES).toHaveLength(8);
  });
  it('ARPANET otorga +1 Capacidad de IA', () => {
    const s = blank();
    s.tech.E = 3; // el siguiente es ARPANET (3 ops)
    s.active = 'E';
    hand(s, 'E', ['otan']);
    rig(s, 1);
    act(s, 'E', { type: 'playTech', card: 'otan' });
    expect(s.tech.E).toBe(4);
    expect(s.cap.E).toBe(1);
  });
});

describe('Riesgo y Capacidad de IA', () => {
  it('el Riesgo no se mueve antes de la era 4', () => {
    const s = blank();
    s.era = 3;
    s.active = 'W';
    hand(s, 'W', ['alphago']);
    act(s, 'W', { type: 'playEvent', card: 'alphago' });
    expect(s.risk).toBe(0);
    expect(s.cap.W).toBe(1);
  });
  it('con Riesgo ≥ 8 al final del turno hay Incidente: pierde 3 PV quien tiene más tecnología', () => {
    const s = blank();
    s.turn = 8;
    s.era = 4;
    s.risk = 8;
    s.cap.W = 3;
    s.cap.E = 0;
    s.tension = 5;
    finishTurn(s);
    expect(s.vp).toBe(-3); // pierde Occidente: 3 PV para el Bloque Oriental
    expect(s.risk).toBe(5);
    expect(s.tension).toBe(5); // el incidente la baja a 4 y sube 1 al inicio del siguiente turno
  });
  it('Riesgo 10: ambos pierden 5 PV (el marcador se acerca al centro) y vuelve a 5', () => {
    const s = blank();
    s.era = 4;
    s.risk = 9;
    s.vp = 8;
    s.active = 'W';
    hand(s, 'W', ['alphago']); // +1 riesgo
    act(s, 'W', { type: 'playEvent', card: 'alphago' });
    expect(s.risk).toBe(5);
    expect(s.vp).toBeLessThan(8);
  });
  it('las cartas de seguridad bajan el Riesgo', () => {
    const s = blank();
    s.era = 5;
    s.risk = 6;
    s.active = 'W';
    hand(s, 'W', ['bletchley']);
    act(s, 'W', { type: 'playEvent', card: 'bletchley' });
    expect(s.risk).toBe(4);
  });
});

describe('cambio de era', () => {
  it('al iniciar la era 4 se disuelve la URSS', () => {
    const s = blank();
    s.turn = 6;
    s.era = 3;
    s.tension = 3;
    setInf(s, 'dde', 2, 3);
    setInf(s, 'de', 4, 0);
    for (const c of ['pl', 'cz', 'hu', 'af', 'et']) setInf(s, c, 0, 2);
    finishTurn(s);
    expect(s.turn).toBe(7);
    expect(s.era).toBe(4);
    expect(s.ussrDissolved).toBe(true);
    expect(s.influence.de.W).toBe(6); // 4 + 2 de Alemania Oriental
    expect(s.influence.dde).toEqual({ W: 0, E: 0 });
    for (const c of ['pl', 'cz', 'hu', 'af', 'et']) expect(s.influence[c].E).toBe(1);
    expect(s.tension).toBe(5);
    expect(activeIds(4)).toEqual(expect.arrayContaining(['ua', 'ge', 'kz', 'ae']));
    expect(activeIds(4)).not.toContain('dde');
  });
  it('salen las cartas de la era anterior y entran las nuevas; genéricas y puntuación se mantienen', () => {
    const s = createGame(21);
    s.turn = 2; // el siguiente turno (3) abre la era 2
    s.round = 6;
    s.active = 'W';
    const kept = [...s.deck, ...s.discard];
    expect(kept.some((id) => CARD[id].era === 1 && CARD[id].kind === 'hist')).toBe(true);
    const w = s.hands.W.find((c) => CARD[c].kind !== 'score')!;
    act(s, 'W', { type: 'playOps', card: w, kind: 'influence' });
    while (s.queue.length) {
      const h = s.queue[0];
      act(s, h.side, h.kind === 'free' ? { type: 'resolveFree', placements: [] } : { type: 'commitInfluence', placements: [] });
    }
    expect(s.era).toBe(2);
    for (const id of s.deck) {
      const c = CARD[id];
      expect(c.kind === 'gen' || c.kind === 'score' || c.era === 2).toBe(true);
    }
    const all = new Set([...s.deck, ...s.hands.W, ...s.hands.E, ...s.discard]);
    expect(all.has('score_af') && all.has('score_am')).toBe(true);
    expect(s.removed.some((id) => CARD[id].era === 1 && CARD[id].kind === 'hist')).toBe(true);
  });
});

describe('IA rival', () => {
  it('es determinista con la misma semilla', () => {
    const a = playAIGame(77);
    const b = playAIGame(77);
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
  });
  it('nunca pierde por Tensión (ni en Fácil, Normal o Difícil)', () => {
    for (const level of ['easy', 'normal', 'hard'] as const) {
      for (let seed = 200; seed < 215; seed++) {
        const r = playAIGame(seed, { W: level, E: level });
        expect(r.reason).not.toMatch(/Tensión nuclear/);
      }
    }
  });
  it('no hace golpes en países clave con Tensión 2 o menos', () => {
    for (let seed = 300; seed < 320; seed++) {
      const s = createGame(seed);
      const rand = makeRng(seed);
      let guard = 0;
      while (s.phase === 'play' && guard++ < 3000) {
        const side: Side = s.queue.length ? s.queue[0].side : s.active;
        const a = chooseAction(s, side, { level: 'normal', rand });
        if (a.type === 'commitCoup') {
          if (COUNTRY[a.target].key) expect(s.tension).toBeGreaterThanOrEqual(3);
        }
        applyActionMut(s, side, a);
      }
    }
  });
  it('el nivel Normal supera claramente al Fácil', () => {
    let normal = 0;
    let n = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const asW = playAIGame(seed, { W: 'normal', E: 'easy' });
      const asE = playAIGame(seed, { W: 'easy', E: 'normal' });
      if (asW.winner === 'W') normal++;
      if (asE.winner === 'E') normal++;
      n += 2;
    }
    expect(normal / n).toBeGreaterThan(0.55);
  });
});
