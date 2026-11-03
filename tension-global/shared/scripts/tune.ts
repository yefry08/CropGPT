import { INITIAL_INFLUENCE } from '../src/setup';
import { runBalance } from '../src/sim';

// Uso: tsx scripts/tune.ts '{"pl":{"E":2}}' [partidas]
const patch = JSON.parse(process.argv[2] ?? '{}');
const n = Number(process.argv[3] ?? 100);
for (const [k, v] of Object.entries(patch)) INITIAL_INFLUENCE[k] = { ...(INITIAL_INFLUENCE[k] ?? {}), ...(v as object) };
const t = Date.now();
const r = runBalance(n, Number(process.argv[4] ?? 1000));
console.log(`${process.argv[2]}  →  W ${((100 * r.W) / n).toFixed(1)}%  E ${((100 * r.E) / n).toFixed(1)}%  empates ${r.draw}  avgVP ${r.avgVp.toFixed(1)}  (${Date.now() - t} ms)`);
