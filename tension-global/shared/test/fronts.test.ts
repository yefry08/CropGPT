import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/rng';
import {
  F_COST,
  F_WEEKS,
  createFronts,
  decisionDelay,
  fBlocked,
  fWon,
  frontsAct,
  frontsBot,
  frontsRandom,
  playFronts,
  type FrontsState,
} from '../src/fronts';

const endWeeks = (s: FrontsState, n: number) => {
  for (let i = 0; i < n && s.phase === 'plan'; i++) s = frontsAct(s, { t: 'end' });
  return s;
};

describe('Dos Frentes', () => {
  it('es determinista con la misma semilla', () => {
    const a = playFronts(42, 'normal', frontsBot);
    const b = playFronts(42, 'normal', frontsBot);
    expect(a).toEqual(b);
  });

  it('las acciones gastan puntos y se bloquean sin puntos', () => {
    let s = createFronts(1);
    s = frontsAct(s, { t: 'pacific' });
    expect(s.ap).toBe(3 - F_COST.pacific);
    expect(fBlocked(s, { t: 'coalition' })).not.toBeNull();
    expect(() => frontsAct(s, { t: 'plan' })).toThrow();
    // Cambiar el foco de EE. UU. es gratis.
    expect(frontsAct(s, { t: 'focus', front: 'europe' }).ap).toBe(s.ap);
  });

  it('una decisión por consenso tarda semanas y se aprueba si nadie rompe filas', () => {
    let s = createFronts(7);
    const delay = decisionDelay(s);
    expect(delay).toBeGreaterThanOrEqual(3);
    s = frontsAct(s, { t: 'decision', kind: 'flank' });
    expect(s.pending).toHaveLength(1);
    // Ningún ataque híbrido puede tumbar a nadie: blindamos a todos.
    for (const m of s.members) m.resolve = 3;
    s.shield = { infra: 3, info: 3 };
    s = endWeeks(s, delay);
    expect(s.pending).toHaveLength(0);
    expect(s.stats.decisions + s.stats.vetoes).toBe(1);
    expect(s.stats.delays[0]).toBe(delay);
  });

  it('un miembro que rompe filas veta la decisión', () => {
    let s = createFronts(3);
    s = frontsAct(s, { t: 'decision', kind: 'sanctions' });
    s.members.find((m) => m.id === 'hu')!.resolve = 0;
    const unity = s.unity;
    s = endWeeks(s, decisionDelay(s) + 1);
    expect(s.stats.vetoes).toBeGreaterThanOrEqual(1);
    expect(s.stats.decisions).toBe(0);
    expect(s.unity).toBeLessThan(unity);
  });

  it('el plan conjunto acorta los debates y da puntos de acción', () => {
    let s = createFronts(5);
    const before = decisionDelay(s);
    s.ap = 10;
    s = frontsAct(s, { t: 'plan' });
    s = frontsAct(s, { t: 'plan' });
    expect(decisionDelay(s)).toBe(before - 2);
    s = frontsAct(s, { t: 'end' });
    expect(s.ap).toBe(4);
  });

  it('la coalición exige miembros firmes', () => {
    const s = createFronts(9);
    for (const m of s.members) m.resolve = 2;
    expect(fBlocked(s, { t: 'coalition' })).not.toBeNull();
  });

  it('sin hacer nada se pierde', () => {
    const s = endWeeks(createFronts(11), 100);
    expect(s.phase).toBe('over');
    expect(fWon(s)).toBe(false);
    expect(s.week).toBeLessThan(F_WEEKS);
  });

  it('equilibrio: una estrategia sensata gana en Normal, el azar pierde y Difícil es más duro', () => {
    const N = 200;
    const rate = (lv: 'normal' | 'hard', bot: boolean) => {
      let w = 0;
      for (let i = 0; i < N; i++) {
        const r = makeRng(i + 1);
        if (fWon(playFronts(i * 7919 + 1, lv, bot ? frontsBot : (x) => frontsRandom(x, r)))) w++;
      }
      return w / N;
    };
    const normal = rate('normal', true);
    const hard = rate('hard', true);
    expect(normal).toBeGreaterThan(0.8);
    expect(hard).toBeLessThan(normal);
    expect(hard).toBeGreaterThan(0.05);
    expect(rate('normal', false)).toBeLessThan(0.1);
  });
});
