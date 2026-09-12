import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ZBar } from "@/components/z-bar"
import type { Group, QueryResult } from "@/lib/api"
import { GROUP_COLOR, GROUP_HEX, MONTHS, NA, fmt, signed, titleCase } from "@/lib/format"

const tooltipStyle = {
  contentStyle: { background: "#0a0f17", border: "1px solid #1a2330", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#8793a5" },
  itemStyle: { color: "#e6ebf2" },
}

export function ProfilePanel({ result }: { result: QueryResult }) {
  const p = result.profile
  const groups: Group[] = ["climate", "water", "soil", "terrain", "vegetation"]
  const dry = new Set(p.dry_quarter_months ?? [])
  const precip = (p.monthly_precip_mm ?? []).map((v, i) => ({ m: MONTHS[i], v, dry: dry.has(i + 1) }))
  const ndvi = (p.ndvi_climatology ?? []).map((v, i) => ({ doy: 1 + 16 * i, v }))

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Parcel biophysical profile</CardTitle>
            <CardDescription>
              Raw value, and position against the reference grid (dot = z-score, centre line = grid mean, track = ±3 SD).
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={p.n_available === 24 ? "default" : "warn"}>{p.n_available}/24 dimensions</Badge>
            <Badge variant="outline">{fmt(result.parcel.area_km2, "km²")}</Badge>
            <Badge
              variant="outline"
              title={
                p.land_cover
                  ? Object.entries(p.land_cover.composition)
                      .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`)
                      .join("\n")
                  : undefined
              }
            >
              Land cover: {p.land_cover ? `${p.land_cover.label} ${Math.round(p.land_cover.share * 100)}% (${p.land_cover.product} ${p.land_cover.year})` : NA}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLOR[g] }} />
                <span className="eyebrow">{g}</span>
              </div>
              <ul className="space-y-2">
                {p.features
                  .filter((f) => f.group === g)
                  .map((f) => {
                    const v = p.values[f.key]
                    const z = p.z[f.key]
                    const miss = p.missing[f.key]
                    return (
                      <li key={f.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                        <span className="truncate text-[13px] text-secondary-foreground" title={`${f.label} — ${f.source}`}>
                          {f.label}
                        </span>
                        <span className={v === null ? "text-xs italic text-muted-foreground" : "num text-[13px]"} title={miss}>
                          {fmt(v, f.unit)}
                        </span>
                        {v === null ? (
                          <span className="col-span-2 text-[11px] leading-snug text-warn/90">{miss}</span>
                        ) : (
                          <div className="col-span-2 flex items-center gap-2">
                            <ZBar z={z} color={GROUP_HEX[g]} />
                            <span className="num w-10 text-right text-[11px] text-muted-foreground">{signed(z, 1)}</span>
                          </div>
                        )}
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <div className="eyebrow mb-1">Monthly precipitation</div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              WorldClim 1970–2000 normals. Highlighted: driest quarter, used as the Sentinel-1/2 observation window
              ({(p.dry_quarter_months ?? []).map((m) => MONTHS[m - 1]).join(", ") || NA}).
            </p>
            {precip.length ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={precip} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <XAxis dataKey="m" tick={{ fill: "#8793a5", fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={{ fill: "#8793a5", fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => [`${fmt(Number(v))} mm`, "precip"]} />
                    <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                      {precip.map((d) => (
                        <Cell key={d.m} fill={d.dry ? "#f2b45a" : "#5ec8e5"} fillOpacity={d.dry ? 0.95 : 0.55} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground">{NA}</p>
            )}
          </div>
          <div>
            <div className="eyebrow mb-1">NDVI seasonal curve</div>
            <p className="mb-2 text-[11px] text-muted-foreground">
              MOD13Q1 16-day composites, median across 2023–2025. Amplitude and growing-season length come from this curve.
            </p>
            {ndvi.length ? (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ndvi} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                    <XAxis dataKey="doy" tick={{ fill: "#8793a5", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, "auto"]} tick={{ fill: "#8793a5", fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip {...tooltipStyle} labelFormatter={(d) => `day of year ${d}`} formatter={(v) => [fmt(Number(v)), "NDVI"]} />
                    <Line dataKey="v" stroke="#6fcf97" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground">{NA}</p>
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
            <dt className="text-muted-foreground">Soil</dt>
            <dd>{p.soil_method ?? NA}</dd>
            <dt className="text-muted-foreground">PET</dt>
            <dd className="num">{fmt(p.pet_annual_mm, "mm/yr")} (Hargreaves)</dd>
            <dt className="text-muted-foreground">Sentinel-2</dt>
            <dd>{p.s2_scenes?.length ? `${p.s2_scenes.length} scenes, ${p.s2_scenes.map((s) => s.date).join(", ")}` : NA}</dd>
            <dt className="text-muted-foreground">Sentinel-1</dt>
            <dd>{p.s1_scenes?.length ? `${p.s1_scenes.length} scenes (${titleCase(p.s1_scenes[0].orbit ?? "")})` : NA}</dd>
            <dt className="text-muted-foreground">MODIS ET</dt>
            <dd>{p.modis_et_years?.length ? p.modis_et_years.join(", ") : NA}</dd>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
