/**
 * Parity check: the in-browser matching (src/lib/engine.ts) must reproduce the Python backend.
 *   1. default weights: rematch(result) vs the Python result itself
 *   2. custom weights:  rematch(result, w) vs Python results.run(..., weights=w)
 * Run after `uv run python scripts/export_static.py --parity`:
 *   node scripts/check-engine.ts
 */
import { readFileSync } from "node:fs"

import { rematch, type EngineData } from "../src/lib/engine.ts"
import type { QueryResult } from "../src/lib/api.ts"

const read = <T>(p: string): T => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf-8")) as T
const eng = read<EngineData>("../static-export/engine.json")
const meta = read<{ fixtures: { id: string }[] }>("../static-export/meta.json")

let failures = 0
const close = (a: number | null, b: number | null, tol = 1e-7) =>
  (a === null && b === null) || (a !== null && b !== null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))
function expect(ok: boolean, msg: string) {
  if (!ok) {
    failures++
    console.log("  FAIL", msg)
  }
}

function compare(label: string, ts: QueryResult, py: QueryResult) {
  const a = ts.match, b = py.match
  expect(a.n_comparable_cells === b.n_comparable_cells, `${label}: comparable ${a.n_comparable_cells} vs ${b.n_comparable_cells}`)
  expect(JSON.stringify(a.analogs.map((x) => x.cell_id)) === JSON.stringify(b.analogs.map((x) => x.cell_id)), `${label}: analog cells differ`)
  a.analogs.forEach((x, i) => {
    const y = b.analogs[i]
    if (!y) return
    expect(close(x.distance, y.distance), `${label}: distance ${x.distance} vs ${y.distance}`)
    expect(close(x.similarity_percentile, y.similarity_percentile), `${label}: percentile ${x.similarity_percentile} vs ${y.similarity_percentile}`)
    expect(x.method === y.method, `${label}: method ${x.method} vs ${y.method}`)
    expect(JSON.stringify(x.drivers) === JSON.stringify(y.drivers), `${label}: drivers ${x.drivers} vs ${y.drivers}`)
    expect(JSON.stringify(x.divergences) === JSON.stringify(y.divergences), `${label}: divergences ${x.divergences} vs ${y.divergences}`)
    x.dimensions.forEach((d, k) => expect(close(d.contribution, y.dimensions[k].contribution, 1e-6), `${label}: contribution ${d.key}`))
  })
  for (const [rid, c] of Object.entries(b.region_best)) {
    expect(!!a.region_best[rid] && close(a.region_best[rid].similarity_percentile, c.similarity_percentile), `${label}: region ${rid}`)
  }
  expect(JSON.stringify(ts.techniques.ranked.map((t) => t.id)) === JSON.stringify(py.techniques.ranked.map((t) => t.id)), `${label}: ranked order differs`)
  ts.techniques.ranked.forEach((t, i) => expect(close(t.transferability, py.techniques.ranked[i]?.transferability ?? null), `${label}: score ${t.id}`))
  expect(JSON.stringify(ts.techniques.blocked.map((t) => t.id)) === JSON.stringify(py.techniques.blocked.map((t) => t.id)), `${label}: blocked order differs`)
  ts.techniques.blocked.forEach((t, i) =>
    expect(JSON.stringify(t.blocked_reasons) === JSON.stringify(py.techniques.blocked[i]?.blocked_reasons), `${label}: reasons ${t.id}`),
  )
}

for (const { id } of meta.fixtures) {
  const base = read<QueryResult>(`../static-export/results/${id}.json`)
  compare(`${id} default`, rematch(eng, base, base.match.group_weights_requested), base)
  const custom = read<QueryResult>(`../static-export-parity/${id}_custom.json`)
  compare(`${id} custom`, rematch(eng, base, custom.match.group_weights_requested), custom)
  console.log(`${id}: checked default + custom weights`)
}
console.log(failures ? `${failures} mismatches` : "engine parity OK")
process.exit(failures ? 1 : 0)
