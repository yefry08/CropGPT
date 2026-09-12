import { rematch, type EngineData } from "./engine"

export type Group = "climate" | "water" | "soil" | "terrain" | "vegetation"

export interface FeatureDef {
  key: string
  group: Group
  label: string
  unit: string
  source: string
}

export interface RefStat {
  key: string
  mean: number | null
  sd: number | null
  n: number
  p05: number | null
  p95: number | null
}

export interface Region {
  id: string
  name: string
  country: string
  bboxes: number[][]
  added?: boolean
}

export interface Fixture {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  radius_km: number
  note?: string
}

export interface Meta {
  mode: "offline" | "live"
  features: FeatureDef[]
  groups: Group[]
  default_weights: Record<Group, number>
  regions: Region[]
  categories: string[]
  n_techniques: number
  reference_stats: RefStat[]
  reference_cells: number
  fixtures: Fixture[]
  /** true in the static build (precomputed fixture results, matching re-run in the browser) */
  static?: boolean
}

export interface GridPoint {
  cell_id: string
  lat: number
  lon: number
  region_id: string | null
  n_available: number
}

export interface DimDelta {
  key: string
  label: string
  group: Group
  unit: string
  target: number | null
  analog: number | null
  delta: number | null
  z_target: number | null
  z_analog: number | null
  z_delta: number | null
  weight: number
  used: boolean
  contribution: number
}

export interface CellSummary {
  cell_id: string
  lat: number
  lon: number
  region_id: string | null
  region_name: string | null
  country: string | null
  distance: number
  similarity_percentile: number
  method: string
  shared_dims: number
}

export interface Analog extends CellSummary {
  dimensions: DimDelta[]
  drivers: string[]
  divergences: string[]
}

export interface ConstraintCheck {
  feature: string
  op: string
  threshold: number | number[]
  target_value: number | null
  status: "pass" | "fail" | "unknown"
  rule: string
  text: string
}

export interface EvidenceCheck {
  status: string
  registered_title?: string
  container?: string
  year?: number
  http_status?: number
  checked_at?: string
}

export interface Technique {
  id: string
  region_id: string
  region_name: string
  region_country: string | null
  technique: string
  category: string
  crops: string[]
  requires: Record<string, number | number[]>
  requires_basis: string
  capital_tier: string
  documented_effect: string
  evidence_source: string
  evidence_doi: string | null
  evidence_url: string | null
  adaptation_notes: string
  analog_cell: CellSummary | null
  analog_similarity: number | null
  constraint_checks: ConstraintCheck[]
  constraint_satisfaction: number
  unverified_constraints: string[]
  transferability: number | null
  blocked_reasons?: string[]
  evidence_check: EvidenceCheck
}

export interface SourceStatus {
  source: string
  dimensions: string[]
  ok: boolean
  seconds: number
  note: string | null
}

export interface AuditEntry {
  ts: string
  source: string
  product_id: string
  acquisition_date: string
  processing_level: string
  url: string | null
  mode: string
  [k: string]: unknown
}

export interface QueryResult {
  id: string
  status: "ok" | "no_data"
  message?: string
  engine_version: string
  generated_at: string
  mode: string
  parcel: {
    name: string | null
    key: string
    geometry: GeoJSON.Polygon
    centroid: { lat: number; lon: number }
    area_km2: number
    vector_cache: string | null
    vector_computed_at: string
    vector_mode: string
  }
  profile: {
    features: FeatureDef[]
    values: Record<string, number | null>
    missing: Record<string, string>
    n_available: number
    z: Record<string, number | null>
    reference_stats: RefStat[]
    land_cover: { label: string; share: number; year: string; product: string; composition: Record<string, number> } | null
    dry_quarter_months: number[] | null
    monthly_precip_mm: number[] | null
    pet_annual_mm: number | null
    ndvi_climatology: number[] | null
    soil_method: string | null
    s2_scenes: { id: string; date: string; valid_px: number }[] | null
    s1_scenes: { id: string; date: string; orbit: string }[] | null
    modis_et_years: number[] | null
  }
  match: {
    n_reference_cells: number
    n_comparable_cells: number
    n_excluded_cells: number
    dimensions_used: string[]
    dimensions_missing: string[]
    group_weights_requested: Record<Group, number>
    group_weights_effective: Record<Group, number>
    analogs: Analog[]
    region_best: Record<string, CellSummary>
    nearest_cells: CellSummary[]
    distance_quantiles: Record<string, number | null>
  }
  techniques: { ranked: Technique[]; blocked: Technique[]; n_techniques: number }
  /** Static build only: path of the precomputed PDF brief (default weights); null when weights were changed. */
  static_pdf?: string | null
  sources: SourceStatus[]
  source_notes: string[]
  provenance: AuditEntry[]
  disclaimers: string[]
}

export interface QueryBody {
  fixture_id?: string
  lat?: number
  lon?: number
  radius_km?: number
  polygon?: GeoJSON.Polygon
  name?: string
  weights?: Record<Group, number>
}

async function asJson<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => null)
  if (!r.ok && r.status !== 409) {
    const detail = data && typeof data === "object" && "detail" in data ? String(data.detail) : r.statusText
    throw new Error(detail || `HTTP ${r.status}`)
  }
  return data as T
}

/** Static build (VITE_STATIC=1): no server; data comes from files written by scripts/export_static.py. */
const STATIC = import.meta.env.VITE_STATIC === "1"
const staticPath = (p: string) => `static-api/${p}`
let enginePromise: Promise<EngineData> | null = null

async function staticQuery(body: QueryBody): Promise<QueryResult> {
  if (!body.fixture_id) {
    throw new Error("This static demo serves the three recorded parcels. Defining a new parcel needs the Python server in live mode (make demo-live).")
  }
  const res = await fetch(staticPath(`results/${body.fixture_id}.json`)).then((r) => asJson<QueryResult>(r))
  const req = res.match.group_weights_requested
  const w = body.weights
  const unchanged = !w || (Object.keys(req) as Group[]).every((g) => Math.abs((w[g] ?? 0) - req[g]) < 1e-12)
  if (unchanged) return { ...res, static_pdf: staticPath(`results/${body.fixture_id}.pdf`) }
  enginePromise ??= fetch(staticPath("engine.json")).then((r) => asJson<EngineData>(r))
  return rematch(await enginePromise, res, w)
}

export const api = {
  isStatic: STATIC,
  meta: () => fetch(STATIC ? staticPath("meta.json") : "/api/meta").then((r) => asJson<Meta>(r)),
  grid: () => fetch(STATIC ? staticPath("grid.json") : "/api/grid").then((r) => asJson<GridPoint[]>(r)),
  query: (body: QueryBody) =>
    STATIC
      ? staticQuery(body)
      : fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(
          (r) => asJson<QueryResult>(r),
        ),
  jsonUrl: (id: string) => `/api/results/${id}?download=1`,
  pdfUrl: (id: string) => `/api/results/${id}/pdf`,
}
