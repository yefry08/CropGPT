import type { Influence } from './types';

/** Influencia inicial (afinada con la simulación de equilibrio, ver test/balance.test.ts). */
export const INITIAL_INFLUENCE: Record<string, Partial<Influence>> = {
  uk: { W: 5 },
  de: { W: 4 },
  ca: { W: 2 },
  ir: { W: 1 },
  il: { W: 1 },
  jp: { W: 1 },
  sy: { E: 2 },
  iq: { E: 1 },
  kp: { E: 3 },
  dde: { E: 3 },
  fi: { E: 1 },
  // Estados satélite de Europa central (afinado con la simulación de equilibrio).
  pl: { E: 2 },
  cz: { E: 1 },
  hu: { E: 1 },
  ro: { E: 1 },
};

/** Compensación inicial de PV (positivo = Occidente). */
export const START_VP = 0;
export const HAND_SIZE = 7;
export const ROUNDS_PER_TURN = 6;
export const TOTAL_TURNS = 10;
