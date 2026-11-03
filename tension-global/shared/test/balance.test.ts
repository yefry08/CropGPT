import { describe, expect, it } from 'vitest';
import { runBalanceAsync } from '../src/sim';

describe('equilibrio (simulación IA contra IA)', () => {
  it('en 500 partidas ningún bando gana más del 55 %', async () => {
    const r = await runBalanceAsync(500, 1);
    const pctW = r.W / r.games;
    const pctE = r.E / r.games;
    console.log(`Equilibrio — Occidente ${(pctW * 100).toFixed(1)}%, Bloque Oriental ${(pctE * 100).toFixed(1)}%, empates ${r.draw}, PV medio ${r.avgVp.toFixed(2)}`, r.byReason);
    expect(r.games).toBe(500);
    expect(pctW).toBeLessThanOrEqual(0.55);
    expect(pctE).toBeLessThanOrEqual(0.55);
  });
});
