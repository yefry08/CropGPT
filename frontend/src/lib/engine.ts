/**
 * In-browser port of backend/cropmatch/matching.py (and the scoring half of techniques.rank) for the static
 * build. Given a parcel result computed by the Python backend and new group weights, it re-runs the weighted
 * Mahalanobis matching against the reference grid and rescores the techniques. Constraint checks do not depend
 * on weights, so the Python-computed checks are reused as-is. frontend/scripts/check-engine.ts verifies this
 * port against Python output.
 */
import type { Analog, CellSummary, DimDelta, Group, QueryResult, Technique } from "./api"

export interface EngineData {
  features: { key: string; group: Group; label: string; unit: string; source: string }[]
  groups: Group[]
  min_shared_dims: number
  max_condition_number: number
  cells: { cell_id: string; lat: number; lon: number; region_id: string | null; region_name: string | null; country: string | null }[]
  X: (number | null)[][]
  mu: (number | null)[]
  sd: (number | null)[]
  cov: (number | null)[][]
}

const NO_REGION = "No comparable reference cell in the source region, so similarity is not available"

const fin = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v)
const orNull = (v: number): number | null => (Number.isFinite(v) ? v : null)
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Cyclic Jacobi eigen-decomposition of a small symmetric matrix. */
function jacobi(A: number[][]): { values: number[]; vectors: number[][] } {
  const n = A.length
  const a = A.map((r) => r.slice())
  const v: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q]
    if (off < 1e-24) break
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (a[p][q] === 0) continue
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c
        for (let k = 0; k < n; k++) {
          const akp = a[k][p], akq = a[k][q]
          a[k][p] = c * akp - s * akq
          a[k][q] = s * akp + c * akq
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k], aqk = a[q][k]
          a[p][k] = c * apk - s * aqk
          a[q][k] = s * apk + c * aqk
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k][p], vkq = v[k][q]
          v[k][p] = c * vkp - s * vkq
          v[k][q] = s * vkp + c * vkq
        }
      }
    }
  }
  return { values: a.map((r, i) => r[i]), vectors: v }
}

/** Inverse of cov[D, D] if it is positive definite and well conditioned, else null (weighted Euclidean). */
function inverseOrNull(cov: (number | null)[][], D: number[], maxCond: number): number[][] | null {
  const S: number[][] = D.map((i) => D.map((j) => cov[i][j] as number))
  if (!S.every((r) => r.every((x) => fin(x)))) return null
  const { values, vectors } = jacobi(S)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  if (!(lo > 1e-9) || hi / lo > maxCond) return null
  const k = D.length
  const inv = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  for (let i = 0; i < k; i++)
    for (let j = 0; j < k; j++) {
      let sum = 0
      for (let m = 0; m < k; m++) sum += (vectors[i][m] * vectors[j][m]) / values[m]
      inv[i][j] = sum
    }
  return inv
}

function quadForm(u: number[], inv: number[][]): number {
  let s = 0
  for (let i = 0; i < u.length; i++) {
    let row = 0
    for (let j = 0; j < u.length; j++) row += inv[i][j] * u[j]
    s += u[i] * row
  }
  return s
}

export function rematch(eng: EngineData, base: QueryResult, weights: Record<Group, number>): QueryResult {
  const F = eng.features
  const nF = F.length
  const values = base.profile.values
  const Z = eng.X.map((row) => row.map((x, i) => (fin(x) && fin(eng.mu[i]) && fin(eng.sd[i]) ? (x - (eng.mu[i] as number)) / (eng.sd[i] as number) : NaN)))
  const zt = F.map((f, i) => {
    const x = values[f.key]
    return fin(x) && fin(eng.mu[i]) && fin(eng.sd[i]) ? (x - (eng.mu[i] as number)) / (eng.sd[i] as number) : NaN
  })
  const avail = zt.map((z) => Number.isFinite(z))

  // group weights -> dimension weights (matching.dim_weights)
  const gw: Record<Group, number> = { ...base.match.group_weights_requested, ...weights }
  const present = eng.groups.filter((g) => F.some((f, i) => f.group === g && avail[i]) && (gw[g] ?? 0) > 0)
  const total = present.reduce((s, g) => s + gw[g], 0)
  const w = new Array<number>(nF).fill(0)
  const effective = Object.fromEntries(eng.groups.map((g) => [g, 0])) as Record<Group, number>
  for (const g of present) {
    const idx = F.map((f, i) => (f.group === g && avail[i] ? i : -1)).filter((i) => i >= 0)
    effective[g] = gw[g] / total
    for (const i of idx) w[i] = effective[g] / idx.length
  }

  // distances (matching.distances)
  const tAvail = zt.map((z, i) => Number.isFinite(z) && w[i] > 0)
  const nT = tAvail.filter(Boolean).length
  const n = eng.cells.length
  const d = new Array<number>(n).fill(NaN)
  const method: (string | null)[] = new Array(n).fill(null)
  const shared = new Array<number>(n).fill(0)
  const inverses = new Map<string, number[][] | null>()
  for (let j = 0; j < n; j++) {
    const D: number[] = []
    for (let i = 0; i < nF; i++) if (tAvail[i] && Number.isFinite(Z[j][i])) D.push(i)
    shared[j] = D.length
    if (nT === 0 || D.length < eng.min_shared_dims * nT) continue
    const key = D.join(",")
    if (!inverses.has(key)) inverses.set(key, inverseOrNull(eng.cov, D, eng.max_condition_number))
    const inv = inverses.get(key)!
    const sw = D.reduce((s, i) => s + w[i], 0)
    const u = D.map((i) => (zt[i] - Z[j][i]) * Math.sqrt(w[i]))
    const d2 = (inv ? quadForm(u, inv) : u.reduce((s, x) => s + x * x, 0)) / sw
    d[j] = Math.sqrt(Math.max(0, d2))
    method[j] = inv ? "mahalanobis" : "weighted_euclidean"
  }

  // percentiles: share of comparable cells strictly farther away
  const sorted = d.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  const nv = sorted.length
  const pct = d.map((x) => {
    if (!Number.isFinite(x)) return NaN
    let lo = 0, hi = nv
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sorted[mid] <= x) lo = mid + 1
      else hi = mid
    }
    return (100 * (nv - lo)) / nv
  })

  const summary = (j: number): CellSummary => ({
    ...eng.cells[j],
    distance: d[j],
    similarity_percentile: pct[j],
    method: method[j] as string,
    shared_dims: shared[j],
  })

  const explain = (j: number): Pick<Analog, "method" | "dimensions" | "drivers" | "divergences"> => {
    const used = F.map((_, i) => Number.isFinite(zt[i]) && Number.isFinite(Z[j][i]) && w[i] > 0)
    const D = used.map((u, i) => (u ? i : -1)).filter((i) => i >= 0)
    const contrib = new Array<number>(nF).fill(0)
    let how = "weighted_euclidean"
    if (D.length) {
      const u = D.map((i) => (zt[i] - Z[j][i]) * Math.sqrt(w[i]))
      const sw = D.reduce((s, i) => s + w[i], 0)
      const inv = inverseOrNull(eng.cov, D, eng.max_condition_number)
      if (inv) how = "mahalanobis"
      D.forEach((i, a) => {
        if (inv) {
          let row = 0
          for (let b = 0; b < D.length; b++) row += inv[a][b] * u[b]
          contrib[i] = (u[a] * row) / sw
        } else contrib[i] = (u[a] * u[a]) / sw
      })
    }
    const dims: DimDelta[] = F.map((f, i) => {
      const tv = values[f.key] ?? null
      const av = eng.X[j][i]
      const avv = fin(av) ? av : null
      return {
        key: f.key, label: f.label, group: f.group, unit: f.unit,
        target: tv, analog: avv, delta: tv !== null && avv !== null ? tv - avv : null,
        z_target: orNull(zt[i]), z_analog: orNull(Z[j][i]),
        z_delta: used[i] ? orNull(zt[i] - Z[j][i]) : null,
        weight: w[i], used: used[i], contribution: contrib[i],
      }
    })
    const usable = dims.filter((x) => x.used)
    const drivers = [...usable].sort((a, b) => Math.abs(a.z_delta!) - Math.abs(b.z_delta!) || b.weight - a.weight).slice(0, 3)
    const divergences = [...usable].sort((a, b) => b.contribution - a.contribution).slice(0, 3)
    return { method: how, dimensions: dims, drivers: drivers.map((x) => x.key), divergences: divergences.map((x) => x.key) }
  }

  const order = d
    .map((x, j) => [x, j] as const)
    .filter(([x]) => Number.isFinite(x))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([, j]) => j)
  const regional: number[] = []
  const seen = new Set<string>()
  for (const j of order) {
    const rid = eng.cells[j].region_id
    if (!rid || seen.has(rid)) continue
    seen.add(rid)
    regional.push(j)
  }
  const regionBest: Record<string, CellSummary> = Object.fromEntries(regional.map((j) => [eng.cells[j].region_id as string, summary(j)]))
  const analogs: Analog[] = regional.slice(0, 5).map((j) => ({ ...summary(j), ...explain(j) }))

  const quantile = (q: number) => {
    if (!nv) return null
    const pos = (nv - 1) * q
    const lo = Math.floor(pos), hi = Math.ceil(pos)
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
  }

  const match: QueryResult["match"] = {
    n_reference_cells: n,
    n_comparable_cells: nv,
    n_excluded_cells: n - nv,
    dimensions_used: F.filter((_, i) => avail[i]).map((f) => f.key),
    dimensions_missing: F.filter((_, i) => !avail[i]).map((f) => f.key),
    group_weights_requested: gw,
    group_weights_effective: effective,
    analogs,
    region_best: regionBest,
    nearest_cells: order.slice(0, 5).map(summary),
    distance_quantiles: nv ? Object.fromEntries([1, 5, 25, 50, 75, 95].map((q) => [String(q), quantile(q / 100)])) : {},
  }

  // technique scoring (techniques.rank); constraint checks are weight-independent and reused
  const ranked: Technique[] = []
  const blocked: Technique[] = []
  for (const t of [...base.techniques.ranked, ...base.techniques.blocked]) {
    const best = regionBest[t.region_id] ?? null
    const sim = best ? best.similarity_percentile / 100 : null
    const fails = t.constraint_checks.filter((c) => c.status === "fail")
    const entry: Technique = { ...t, analog_cell: best, analog_similarity: sim }
    delete entry.blocked_reasons
    if (fails.length) {
      blocked.push({ ...entry, transferability: 0, blocked_reasons: fails.map((c) => c.text) })
    } else if (sim === null) {
      blocked.push({ ...entry, transferability: null, blocked_reasons: [NO_REGION] })
    } else {
      ranked.push({ ...entry, transferability: sim * t.constraint_satisfaction })
    }
  }
  ranked.sort((a, b) => (b.transferability as number) - (a.transferability as number) || cmpStr(a.id, b.id))
  blocked.sort((a, b) => (b.analog_similarity ?? 0) - (a.analog_similarity ?? 0) || cmpStr(a.id, b.id))

  const tag = eng.groups.map((g) => Math.round((gw[g] ?? 0) * 100)).join("-")
  return {
    ...base,
    id: `${base.id}-w${tag}`,
    generated_at: new Date().toISOString(),
    match,
    techniques: { ranked, blocked, n_techniques: ranked.length + blocked.length },
    static_pdf: null,
  }
}
