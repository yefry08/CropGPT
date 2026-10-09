import { applyActionMut, createGame } from '../src/engine';
import { d6 } from '../src/rng';
import type { Action, CardId, GameState, Side } from '../src/types';

/** Estado limpio: sin influencia, manos controladas. */
export function blank(seed = 7): GameState {
  const s = createGame(seed);
  for (const id in s.influence) s.influence[id] = { W: 0, E: 0 };
  s.hands = { W: ['turing', 'turing', 'turing'], E: ['turing', 'turing', 'turing'] };
  s.log = [];
  return s;
}

/** Fija la mano (añade cartas de relleno para que el turno no avance solo). */
export function hand(s: GameState, side: Side, ids: CardId[]) {
  s.hands[side] = [...ids, 'turing', 'turing', 'turing'];
}

/** Ajusta el RNG para que la próxima tirada de d6 sea `v`. */
export function rig(s: GameState, v: number) {
  for (let r = 1; r < 100000; r++) {
    if (d6({ rng: r }) === v) {
      s.rng = r;
      return;
    }
  }
  throw new Error('no se pudo manipular el dado');
}

export function act(s: GameState, side: Side, a: Action) {
  applyActionMut(s, side, a);
}

export function setInf(s: GameState, c: string, w: number, e: number) {
  s.influence[c] = { W: w, E: e };
}
