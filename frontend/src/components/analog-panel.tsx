import { useState } from "react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

import { AnalogMap } from "@/components/analog-map"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GridPoint, QueryResult } from "@/lib/api"
import { GROUP_HEX, fmt, signed } from "@/lib/format"
import { cn } from "@/lib/utils"

const SHORT: Record<string, string> = {
  mat: "MAT", temp_seasonality: "T seas.", tmax_warmest: "Tmax", tmin_coldest: "Tmin", annual_precip: "Precip",
  precip_seasonality: "P seas.", aridity_index: "Aridity", et_annual: "ET", wue: "WUE", ndwi_dry: "NDWI",
  ndmi_dry: "NDMI", s1_vv_dry: "S1 VV", ph: "pH", soc: "SOC", clay: "Clay", sand: "Sand", cec: "CEC",
  bdod: "Bulk d.", cfvo: "Coarse", elevation: "Elev.", slope: "Slope", insolation: "Insol.",
  ndvi_amplitude: "NDVI amp", growing_season_days: "Season",
}

const clampZ = (v: number | null) => (v === null ? 0 : Math.max(-3, Math.min(3, v)))

export function AnalogPanel({ result, grid }: { result: QueryResult; grid: GridPoint[] }) {
  const [sel, setSel] = useState(0)
  const m = result.match
  const analogs = m.analogs
  const a = analogs[Math.min(sel, analogs.length - 1)]
  const labels = Object.fromEntries(result.profile.features.map((f) => [f.key, f.label]))

  if (!a) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global analogs</CardTitle>
          <CardDescription>No innovation-region cell shares enough dimensions with this parcel to be compared.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const radar = a.dimensions.filter((d) => d.used).map((d) => ({ dim: SHORT[d.key] ?? d.key, parcel: clampZ(d.z_target), analog: clampZ(d.z_analog) }))
  const byContribution = [...a.dimensions].filter((d) => d.used).sort((x, y) => y.contribution - x.contribution)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global analogs</CardTitle>
        <CardDescription>
          Best-matching reference cell in each documented innovation region, ranked by weighted Mahalanobis distance.
          Similarity percentile = share of the {m.n_comparable_cells.toLocaleString()} comparable reference cells that are
          farther from your parcel. It is a rank, not a probability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="h-[380px]">
            <AnalogMap result={result} grid={grid} selected={sel} onSelect={setSel} />
          </div>
          <ol className="space-y-2">
            {analogs.map((x, i) => (
              <li key={x.cell_id}>
                <button
                  type="button"
                  onClick={() => setSel(i)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    i === sel ? "border-cyan/70 bg-cyan/5" : "border-border hover:border-cyan/40",
                    i >= 3 && "opacity-80",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="num text-xs text-cyan">{i + 1}</span>
                      <span className="text-sm font-semibold">{x.region_name}</span>
                    </div>
                    <span className="num text-sm text-cyan">{x.similarity_percentile.toFixed(1)}</span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {x.country} · cell {x.lat.toFixed(2)}, {x.lon.toFixed(2)}
                      {i >= 3 ? " · not on map" : ""}
                    </span>
                    <span>percentile</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {x.drivers.map((k) => (
                      <Badge key={k} variant="default" title="closest dimension">
                        ≈ {labels[k]}
                      </Badge>
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-5 border-t border-border pt-5 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="eyebrow mb-1">Why #{sel + 1} matched — {a.region_name}</div>
            <p className="text-[11px] text-muted-foreground">
              z-scores of your parcel (amber) and the analog cell (cyan) on each shared dimension, clipped to ±3.
              Distance {fmt(a.distance)} ({a.method.replace("_", " ")}), {a.shared_dims} shared dimensions.
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke="#1a2330" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#8793a5", fontSize: 10 }} />
                  <PolarRadiusAxis domain={[-3, 3]} tick={false} axisLine={false} />
                  <Radar name="Your parcel" dataKey="parcel" stroke="#f2b45a" fill="#f2b45a" fillOpacity={0.18} strokeWidth={1.6} />
                  <Radar name="Analog" dataKey="analog" stroke="#5ec8e5" fill="#5ec8e5" fillOpacity={0.12} strokeWidth={1.6} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0a0f17", border: "1px solid #1a2330", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => signed(Number(v), 2)}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="eyebrow mb-2">Per-dimension deltas, largest contribution to distance first</div>
            <table className="w-full min-w-[520px] text-[12px]">
              <thead className="text-left text-[11px] text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">Dimension</th>
                  <th className="py-1 text-right font-medium">Parcel</th>
                  <th className="py-1 text-right font-medium">Analog</th>
                  <th className="py-1 text-right font-medium">Δz</th>
                  <th className="py-1 pl-3 font-medium">Share of d²</th>
                </tr>
              </thead>
              <tbody>
                {byContribution.map((d) => {
                  const total = byContribution.reduce((s, x) => s + Math.max(0, x.contribution), 0) || 1
                  const share = Math.max(0, d.contribution) / total
                  return (
                    <tr key={d.key} className="border-t border-border/60">
                      <td className="py-1.5">
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: GROUP_HEX[d.group] }} />
                        {d.label}
                        {a.divergences.includes(d.key) ? <span className="ml-1.5 text-[10px] text-warn">diverges</span> : null}
                      </td>
                      <td className="num py-1.5 text-right">{fmt(d.target, d.unit)}</td>
                      <td className="num py-1.5 text-right text-cyan">{fmt(d.analog, d.unit)}</td>
                      <td className="num py-1.5 text-right">{signed(d.z_delta, 2)}</td>
                      <td className="py-1.5 pl-3">
                        <div className="h-1.5 w-24 rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-warn/80" style={{ width: `${share * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {a.dimensions
                  .filter((d) => !d.used)
                  .map((d) => (
                    <tr key={d.key} className="border-t border-border/60 text-muted-foreground">
                      <td className="py-1.5 italic">{d.label}</td>
                      <td colSpan={4} className="py-1.5 text-right text-[11px] italic">
                        not compared (not available for {d.target === null ? "the parcel" : "this cell"})
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
