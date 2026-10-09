import { playAIGame } from '../src/sim';
const [a, b] = [process.argv[2] as any, process.argv[3] as any];
let wa = 0, n = 0;
for (let seed = 1; seed <= 60; seed++) {
  if (playAIGame(seed, { W: a, E: b }).winner === 'W') wa++;
  if (playAIGame(seed, { W: b, E: a }).winner === 'E') wa++;
  n += 2;
}
console.log(`${a} vs ${b}: ${a} gana ${((100 * wa) / n).toFixed(0)}%`);
