import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/rng';
import {
  DOMAIN_BEATS,
  WAR_CARDS,
  WAR_CARD,
  createWar,
  warChoose,
  warPlay,
  warScore,
  warTotal,
  type WarState,
} from '../src/war';

/** Pone la carta `id` en la mano de `p` intercambiándola con su primera carta (sin duplicar). */
function put(s: WarState, p: 'p1' | 'p2', id: string) {
  const piles = [s.hands.p1, s.hands.p2, s.decks.p1, s.decks.p2, s.won.p1, s.won.p2];
  for (const pile of piles) {
    const i = pile.indexOf(id);
    if (i >= 0) {
      pile[i] = s.hands[p][0];
      s.hands[p][0] = id;
      return;
    }
  }
}

const total = (s: WarState) => warTotal(s, 'p1') + warTotal(s, 'p2') + s.pot.length;

describe('Guerra de cartas', () => {
  it('40 cartas, 8 por dominio, mismo poder total por dominio y ciclo de ventaja completo', () => {
    expect(WAR_CARDS).toHaveLength(40);
    const by: Record<string, number[]> = {};
    for (const c of WAR_CARDS) (by[c.domain] ??= []).push(c.power);
    for (const d in by) {
      expect(by[d]).toHaveLength(8);
      expect(by[d].reduce((a, b) => a + b, 0)).toBe(44);
    }
    const targets = new Set(Object.values(DOMAIN_BEATS));
    expect(targets.size).toBe(5);
    for (const c of WAR_CARDS) expect(c.name.en && c.blurb.en && c.name.es && c.blurb.es).toBeTruthy();
  });

  it('reparte 20 cartas a cada uno y 5 en mano', () => {
    const s = createWar(1);
    expect(warTotal(s, 'p1')).toBe(20);
    expect(warTotal(s, 'p2')).toBe(20);
    expect(s.hands.p1).toHaveLength(5);
  });

  it('la ventaja de dominio suma 2', () => {
    // ciber (aiwar 9) contra espacio (orbital 9): 11 frente a 9
    expect(warScore('w_aiwar', 'w_orbital')).toBe(11);
    expect(warScore('w_orbital', 'w_aiwar')).toBe(9);
  });

  it('gana la carta más fuerte y se lleva ambas', () => {
    let s = createWar(3);
    put(s, 'p1', 'w_robots'); // tierra 9
    put(s, 'p2', 'w_piracy'); // mar 2 (tierra vence a mar)
    s = warPlay(s, 'p1', 'w_robots');
    expect(s.chosen.p1).toBe('w_robots');
    s = warPlay(s, 'p2', 'w_piracy');
    expect(s.last?.winner).toBe('p1');
    expect(s.won.p1).toEqual(expect.arrayContaining(['w_robots', 'w_piracy']));
    expect(s.hands.p1).toHaveLength(5);
    expect(total(s)).toBe(40);
  });

  it('un empate abre una «guerra»: 3 boca abajo cada uno y otra carta; el ganador se lleva todo', () => {
    let s = createWar(5);
    put(s, 'p1', 'w_blitz'); // tierra 8
    put(s, 'p2', 'w_navaldrones'); // mar 8... tierra vence a mar → no es empate
    put(s, 'p2', 'w_swarm'); // aire 8 vence a tierra → 10 vs 8, tampoco
    put(s, 'p2', 'w_grid'); // ciber 8 vs tierra 8: sin ventaja → empate
    s = warPlay(s, 'p1', 'w_blitz');
    s = warPlay(s, 'p2', 'w_grid');
    expect(s.atWar).toBe(true);
    expect(s.faceDown).toBe(6);
    expect(s.pot).toHaveLength(8);
    expect(total(s)).toBe(40);
    put(s, 'p1', 'w_hyper');
    put(s, 'p2', 'w_airlift');
    s = warPlay(s, 'p1', 'w_hyper');
    s = warPlay(s, 'p2', 'w_airlift');
    expect(s.atWar).toBe(false);
    expect(s.last?.winner).toBe('p1');
    expect(s.last?.won).toBe(10);
    expect(s.last?.clashes).toHaveLength(2);
    expect(total(s)).toBe(40);
  });

  it('valida la carta y el turno', () => {
    const s = createWar(7);
    expect(() => warPlay(s, 'p1', 'no-existe')).toThrow();
    const s2 = warPlay(s, 'p1', s.hands.p1[0]);
    expect(() => warPlay(s2, 'p1', s2.hands.p1[0])).toThrow(/Ya elegiste/);
  });

  it('las partidas terminan, conservan las 40 cartas y la IA Normal supera a la Fácil', () => {
    let normalWins = 0;
    let decided = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = makeRng(seed);
      let s = createWar(seed);
      const lv = seed % 2 ? { p1: 'normal', p2: 'easy' } : { p1: 'easy', p2: 'normal' };
      let guard = 0;
      while (s.phase === 'choose' && guard++ < 500) {
        s = warPlay(s, 'p1', warChoose(s, 'p1', lv.p1 as 'normal' | 'easy', r));
        s = warPlay(s, 'p2', warChoose(s, 'p2', lv.p2 as 'normal' | 'easy', r));
        expect(total(s)).toBe(40);
      }
      expect(s.phase).toBe('over');
      if (s.winner === 'draw') continue;
      decided++;
      if ((seed % 2 && s.winner === 'p1') || (!(seed % 2) && s.winner === 'p2')) normalWins++;
    }
    expect(normalWins / decided).toBeGreaterThan(0.55);
  });
});
