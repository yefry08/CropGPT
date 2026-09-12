import { Circle, LoaderCircle, Pentagon, Play, RotateCcw } from "lucide-react"

import type { ParcelDraft } from "@/components/parcel-map"
import { Button } from "@/components/ui/button"
import type { Fixture, Group } from "@/lib/api"
import { FEATURED_LOCATIONS, type FeaturedLocation } from "@/lib/featured-locations"
import { GROUP_COLOR } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Props {
  mode: string
  staticMode: boolean
  fixtures: Fixture[]
  activeFixture: string | null
  onPickFixture: (f: Fixture) => void
  draft: ParcelDraft
  onDraft: (d: ParcelDraft) => void
  onFlyTo: (loc: FeaturedLocation) => void
  weights: Record<Group, number>
  onWeights: (w: Record<Group, number>) => void
  defaultWeights: Record<Group, number>
  canRun: boolean
  loading: boolean
  onRun: () => void
}

const GROUPS: Group[] = ["water", "soil", "climate", "terrain", "vegetation"]

export function QueryPanel(p: Props) {
  const total = GROUPS.reduce((s, g) => s + p.weights[g], 0) || 1
  const d = p.draft
  const num = (v: string) => (v === "" || Number.isNaN(Number(v)) ? null : Number(v))

  return (
    <div className="space-y-6">
      {/* Featured global locations */}
      <section>
        <div className="eyebrow mb-2">Explore a location</div>
        <div className="flex flex-wrap gap-1.5">
          {FEATURED_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              type="button"
              title={loc.note}
              onClick={() => p.onFlyTo(loc)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
            >
              <span>{loc.emoji}</span>
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Click any location to fly the map there and pre-fill coordinates.
        </p>
      </section>

      {/* Parcel definition */}
      <section>
        <div className="eyebrow mb-2">Define your parcel</div>
        <div className="mb-3 inline-flex rounded-lg border border-border p-0.5">
          {(["circle", "polygon"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => p.onDraft({ ...d, mode: m })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px]",
                d.mode === m ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {m === "circle" ? <Circle className="h-3.5 w-3.5" /> : <Pentagon className="h-3.5 w-3.5" />}
              {m === "circle" ? "Point + radius" : "Draw polygon"}
            </button>
          ))}
        </div>

        {d.mode === "circle" ? (
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Latitude", "lat", -90, 90, 0.0001],
                ["Longitude", "lon", -180, 180, 0.0001],
                ["Radius km", "radiusKm", 0.05, 25, 0.1],
              ] as const
            ).map(([label, key, min, max, step]) => (
              <label key={key} className="text-[11px] text-muted-foreground">
                {label}
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={d[key] ?? ""}
                  onChange={(e) => {
                    const v = num(e.target.value)
                    p.onDraft({ ...d, [key]: key === "radiusKm" ? (v ?? 2) : v })
                  }}
                  className="num mt-1 w-full rounded-md border border-border bg-muted px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
                />
              </label>
            ))}
            <p className="col-span-3 text-[11px] text-muted-foreground">
              Or search the map, or click to drop a pin.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
            <span>
              {d.vertices.length} vertices{" "}
              {d.closed ? "· closed" : "· click to add points, double-click to close"}
            </span>
            <Button size="sm" variant="ghost" onClick={() => p.onDraft({ ...d, vertices: [], closed: false })}>
              <RotateCcw /> Clear
            </Button>
          </div>
        )}
      </section>

      {/* Weights */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">Dimension-group weights</span>
          <button
            type="button"
            className="text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => p.onWeights(p.defaultWeights)}
          >
            reset
          </button>
        </div>
        <div className="space-y-2">
          {GROUPS.map((g) => (
            <label key={g} className="grid grid-cols-[88px_1fr_40px] items-center gap-2 text-[12px]">
              <span className="flex items-center gap-1.5 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[g] }} />
                {g}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={p.weights[g]}
                onChange={(e) => p.onWeights({ ...p.weights, [g]: Number(e.target.value) })}
              />
              <span className="num text-right text-muted-foreground">
                {Math.round((p.weights[g] / total) * 100)}%
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Normalised to 100 %. Default: water 30, soil 25, climate 25, terrain 10, vegetation 10.
        </p>
      </section>

      {/* Run button */}
      <Button size="lg" className="w-full" disabled={!p.canRun || p.loading} onClick={p.onRun}>
        {p.loading ? <LoaderCircle className="animate-spin" /> : <Play />}
        {p.loading ? "Computing…" : "Find analogs"}
      </Button>

      {/* Precomputed examples (static mode only) */}
      {p.staticMode && p.fixtures.length > 0 && (
        <section className="border-t border-border pt-4">
          <div className="eyebrow mb-2">Precomputed examples</div>
          <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
            Three recorded results ship with this static demo. Load one instantly — weights can still be
            adjusted in your browser.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {p.fixtures.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => p.onPickFixture(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] transition-colors",
                  p.activeFixture === f.id
                    ? "border-parcel bg-parcel text-[#1b1203]"
                    : "border-parcel/40 text-parcel hover:bg-parcel/10",
                )}
              >
                {f.name}
                <span className="ml-1 opacity-60">· {f.country}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Offline mode hint (live server, non-static) */}
      {!p.staticMode && p.mode === "offline" && (
        <p className="text-[11px] text-muted-foreground">
          Offline mode — recorded responses for {p.fixtures.map((f) => f.name).join(", ")}. Other parcels
          need <code className="num">make demo-live</code>.
        </p>
      )}
    </div>
  )
}
