import type { GameState, Side } from './types';

/**
 * Vista de un jugador: solo ve su mano. La del rival y el mazo se sustituyen por marcadores '?'
 * (se conserva la cantidad). `viewer = null` es el espectador (no ve ninguna mano).
 */
export function viewFor(state: GameState, viewer: Side | null): GameState {
  const hide = (n: number) => Array.from({ length: n }, () => '?');
  return {
    ...state,
    rng: 0,
    seed: 0,
    hands: {
      W: viewer === 'W' ? state.hands.W : hide(state.hands.W.length),
      E: viewer === 'E' ? state.hands.E : hide(state.hands.E.length),
    },
    deck: hide(state.deck.length),
  };
}
