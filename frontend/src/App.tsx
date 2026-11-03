import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FileDown, FileJson, LoaderCircle, Satellite, Sprout, TriangleAlert } from "lucide-react"

import { AnalogPanel } from "@/components/analog-panel"
import { FaultDetector } from "@/components/fault-detector"
import { HowItWorksSection } from "@/components/how-it-works"
import { ParcelMap, draftRing, type ParcelDraft } from "@/components/parcel-map"
import { ProfilePanel } from "@/components/profile-panel"
import { ProvenancePanel } from "@/components/provenance-panel"
import { QueryPanel } from "@/components/query-panel"
import { TechniqueList } from "@/components/technique-list"
import AirlockHero from "@/components/ui/airlock-spaceship-hero"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { api, type Fixture, type GridPoint, type Group, type Meta, type QueryBody, type QueryResult } from "@/lib/api"
import { type FeaturedLocation } from "@/lib/featured-locations"
import { fmt } from "@/lib/format"

const FALLBACK_WEIGHTS: Record<Group, number> = { water: 0.3, soil: 0.25, climate: 0.25, terrain: 0.1, vegetation: 0.1 }

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [grid, setGrid] = useState<GridPoint[]>([])
  const [bootError, setBootError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ParcelDraft>({ mode: "circle", lat: null, lon: null, radiusKm: 2, vertices: [], closed: false })
  const [fixture, setFixture] = useState<string | null>(null)
  const [weights, setWeights] = useState<Record<Group, number>>(FALLBACK_WEIGHTS)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([api.meta(), api.grid()])
      .then(([m, g]) => {
        setMeta(m)
        setGrid(g)
        setWeights(m.default_weights)
      })
      .catch((e: Error) => setBootError(e.message))
  }, [])

  const pickFixture = useCallback((f: Fixture) => {
    setFixture(f.id)
    setDraft((d) => ({ ...d, mode: "circle", lat: f.lat, lon: f.lon, radiusKm: f.radius_km }))
  }, [])

  const onDraft = useCallback((d: ParcelDraft) => {
    setFixture(null)
    setDraft(d)
  }, [])

  const onFlyTo = useCallback((loc: FeaturedLocation) => {
    setFixture(null)
    setDraft((d) => ({ ...d, mode: "circle", lat: loc.lat, lon: loc.lon, radiusKm: loc.radiusKm }))
  }, [])

  const ring = draftRing(draft)
  const hasDraft = draft.mode === "circle" ? ring !== null : draft.closed && ring !== null
  // In static mode a custom parcel will show a friendly error; the button is still enabled so the user
  // discovers the limitation rather than wondering why it's disabled.
  const canRun = fixture !== null || hasDraft

  // Static build: the JSON export is the result object itself, offered as a local file.
  const jsonHref = useMemo(
    () => (result && api.isStatic ? URL.createObjectURL(new Blob([JSON.stringify(result, null, 1)], { type: "application/json" })) : null),
    [result],
  )
  useEffect(() => () => {
    if (jsonHref) URL.revokeObjectURL(jsonHref)
  }, [jsonHref])
  const pdfHref = result ? (api.isStatic ? (result.static_pdf ?? null) : api.pdfUrl(result.id)) : null

  async function run() {
    setLoading(true)
    setError(null)
    // Static mode with a custom parcel: show a helpful message instead of a server error.
    if (api.isStatic && !fixture) {
      setLoading(false)
      setError(
        "Este demo estático solo puede cargar los tres ejemplos precomputados (ver debajo del botón). " +
        "Para análisis en vivo de cualquier ubicación, clona el repositorio y ejecuta `make demo-live`.",
      )
      return
    }
    let body: QueryBody
    if (fixture) body = { fixture_id: fixture }
    else if (draft.mode === "circle") body = { lat: draft.lat!, lon: draft.lon!, radius_km: draft.radiusKm, name: "Custom parcel" }
    else body = { polygon: { type: "Polygon", coordinates: [ring!] }, name: "Drawn parcel" }
    body.weights = weights
    try {
      const res = await api.query(body)
      if (res.status !== "ok") {
        setResult(null)
        setError(res.message ?? "No result.")
      } else {
        setResult(res)
        requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const top = result?.match.analogs[0]

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <AirlockHero
        title="FIND YOUR FIELD'S TWIN"
        tagline="En algún lugar del mundo, un campo igual al tuyo ya tiene su manual."
        scrollHint="SCROLL"
        skipLabel="Ir al análisis"
      />

      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Sprout className="h-5 w-5 text-primary" />
            <span className="text-[15px] font-semibold tracking-tight">CropMatch</span>
            <span className="text-[13px] text-muted-foreground">Analog Engine</span>
          </div>
          <nav className="hidden items-center gap-5 text-[13px] text-muted-foreground md:flex">
            <a href="#parcel" className="hover:text-foreground">Parcela</a>
            <a href="#results" className="hover:text-foreground">Análogos</a>
            <a href="#techniques" className="hover:text-foreground">Técnicas</a>
            <a href="#sources" className="hover:text-foreground">Fuentes</a>
            <a href="#fault-detector" className="hover:text-foreground">Diagnóstico</a>
          </nav>
          <Badge variant={meta?.mode === "live" ? "default" : "warn"} title="DEMO_MODE">
            <Satellite className="h-3 w-3" /> {meta ? (meta.static ? "static demo" : `${meta.mode} mode`) : "connecting…"}
          </Badge>
        </div>
      </header>

      <HowItWorksSection />

      <section className="mx-auto max-w-7xl px-5 pb-6 pt-14">
        <p className="eyebrow">Matching analógico — no predicción de cosecha</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-[40px]">
          Descubre qué lugares del mundo comparten el suelo, agua y clima de tu parcela — y qué técnicas agropecuarias probadas ahí son transferibles a la República Dominicana.
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          CropMatch construye una huella biofísica de 24 dimensiones a partir de datos satelitales y edáficos, localiza sus análogos más cercanos en una cuadrícula global de referencia, y evalúa una biblioteca de técnicas agrícolas citadas contra las condiciones reales de la parcela. Las técnicas que no aplican se muestran con la razón — no se ocultan.
        </p>
        {meta ? (
          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Celdas de referencia", meta.reference_cells.toLocaleString()],
              ["Regiones de innovación", String(meta.regions.length)],
              ["Técnicas citadas", String(meta.n_techniques)],
              ["Dimensiones", String(meta.features.length)],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-border pl-3">
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
                <dd className="num mt-0.5 text-lg">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {meta && meta.reference_cells < 1900 ? (
          <div className="mt-6 flex max-w-3xl items-start gap-2 rounded-lg border border-warn/40 bg-warn/5 p-3 text-[13px] text-warn">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Build preliminar: la cuadrícula de referencia aún se está calculando ({meta.reference_cells.toLocaleString()} de 2 000 celdas).
            Los análogos y percentiles cambiarán cuando esté completa.
          </div>
        ) : null}
      </section>

      <section id="parcel" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-8">
        {bootError ? (
          <Card className="border-danger/40 p-5 text-sm text-danger">
            No se pudo conectar con la API ({bootError}). Iníciala con <code className="num">make demo</code>.
          </Card>
        ) : (
          <Card className="grid gap-0 overflow-hidden lg:grid-cols-[380px_1fr]">
            <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
              <QueryPanel
                mode={meta?.mode ?? "offline"}
                staticMode={api.isStatic}
                fixtures={meta?.fixtures ?? []}
                activeFixture={fixture}
                onPickFixture={pickFixture}
                draft={draft}
                onDraft={onDraft}
                onFlyTo={onFlyTo}
                weights={weights}
                onWeights={setWeights}
                defaultWeights={meta?.default_weights ?? FALLBACK_WEIGHTS}
                canRun={canRun && meta !== null}
                loading={loading}
                onRun={run}
              />
            </div>
            <div className="relative min-h-[460px] p-2">
              <ParcelMap
                draft={draft}
                onChange={onDraft}
                fixtures={meta?.fixtures ?? []}
                activeFixture={fixture}
                onPickFixture={pickFixture}
                staticMode={api.isStatic}
              />
            </div>
          </Card>
        )}
        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/5 p-3 text-[13px] text-warn">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {api.isStatic
              ? "Cargando la parcela y re-ejecutando el matching en tu navegador…"
              : meta?.mode === "live"
                ? "Consultando WorldClim, SoilGrids, Copernicus DEM, MODIS, Sentinel-2 y Sentinel-1. Una parcela nueva puede tardar un minuto."
                : "Reproduciendo respuestas grabadas…"}
          </div>
        ) : null}
      </section>

      {result ? (
        <div ref={resultsRef} id="results" className="mx-auto max-w-7xl scroll-mt-16 space-y-6 px-5 pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-8">
            <div>
              <p className="eyebrow">Result {result.id}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{result.parcel.name ?? "Parcel"}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {result.parcel.centroid.lat.toFixed(4)}, {result.parcel.centroid.lon.toFixed(4)} · {fmt(result.parcel.area_km2, "km²")} ·{" "}
                {result.profile.n_available}/24 dimensions
                {top ? ` · closest innovation region: ${top.region_name} (percentile ${top.similarity_percentile.toFixed(1)})` : ""} ·{" "}
                {result.techniques.ranked.length} transferable, {result.techniques.blocked.length} blocked
              </p>
            </div>
            <div className="no-print flex gap-2">
              <a
                href={jsonHref ?? api.jsonUrl(result.id)}
                download={api.isStatic ? `cropgpt-${result.id}.json` : undefined}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-secondary"
              >
                <FileJson className="h-4 w-4" /> JSON
              </a>
              {pdfHref ? (
                <a
                  href={pdfHref}
                  download={api.isStatic ? `cropgpt-brief-${result.id}.pdf` : undefined}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <FileDown className="h-4 w-4" /> PDF brief
                </a>
              ) : (
                <span
                  className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground"
                  title="The static demo ships PDF briefs precomputed at the default weights. Reset the weights to download it."
                >
                  <FileDown className="h-4 w-4" /> PDF at default weights only
                </span>
              )}
            </div>
          </div>
          {result.match.dimensions_missing.length ? (
            <div className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/5 p-3 text-[13px] text-warn">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Matched on {result.match.dimensions_used.length} of 24 dimensions. Missing: {result.match.dimensions_missing.join(", ")}. Group weights were
              renormalised over what is available.
            </div>
          ) : null}
          <ProfilePanel result={result} />
          <AnalogPanel key={result.id} result={result} grid={grid} />
          <div id="techniques" className="scroll-mt-16">
            <TechniqueList key={result.id} ranked={result.techniques.ranked} blocked={result.techniques.blocked} />
          </div>
          <div id="sources" className="scroll-mt-16">
            <ProvenancePanel result={result} />
          </div>
          <ul className="space-y-1 text-[12px] text-muted-foreground">
            {result.disclaimers.map((d) => (
              <li key={d}>• {d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <FaultDetector />

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 py-6 text-[11px] leading-relaxed text-muted-foreground">
          Data: WorldClim v2.1 · ISRIC SoilGrids v2.0 · Copernicus DEM GLO-90 (© DLR/Airbus, ESA) · MODIS collection 6.1 (NASA LP DAAC) ·
          Sentinel-1/2 (contains modified Copernicus Sentinel data) · Natural Earth. Hero footage by the Airlock hero asset set.
        </div>
      </footer>
    </main>
  )
}
