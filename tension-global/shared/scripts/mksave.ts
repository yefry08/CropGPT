import { writeFileSync } from 'node:fs';
import { chooseAction, applyActionMut, createGame, makeRng, type GameState, type Side } from '../src/index';

// Genera partidas guardadas en un punto dado para pruebas visuales: tsx mksave.ts <turno> <ronda> <salida.json> [semilla]
const [turn, round, out, seedArg] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4], Number(process.argv[5] ?? 1)];
for (let seed = seedArg; seed < seedArg + 200; seed++) {
  const s: GameState = createGame(seed);
  const rand = makeRng(seed);
  while (s.phase === 'play' && !(s.turn === turn && s.round === round && !s.queue.length && s.active === 'W')) {
    const side: Side = s.queue.length ? s.queue[0].side : s.active;
    applyActionMut(s, side, chooseAction(s, side, { level: 'normal', rand }));
  }
  if (s.phase === 'play') {
    writeFileSync(out, JSON.stringify({ state: s, side: 'W', level: 'normal' }));
    console.log('guardado seed', seed, 'vp', s.vp, 'tension', s.tension);
    break;
  }
}
