import { runBalance } from '../src/sim';
const n = Number(process.argv[2] ?? 100);
const t = Date.now();
const r = runBalance(n, Number(process.argv[3] ?? 1));
console.log(JSON.stringify(r, null, 1));
console.log(`W ${((100 * r.W) / n).toFixed(1)}%  E ${((100 * r.E) / n).toFixed(1)}%  empates ${r.draw}  (${Date.now() - t} ms)`);
