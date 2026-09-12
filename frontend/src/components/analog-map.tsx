import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl"

import type { GridPoint, QueryResult } from "@/lib/api"
import { baseStyle, EMPTY_FC } from "@/lib/geo"

interface Props {
  result: QueryResult
  grid: GridPoint[]
  selected: number
  onSelect: (i: number) => void
  count?: number
}

/** World map: every reference cell as a faint dot, the parcel in amber, its top analogs in cyan. */
export function AnalogMap({ result, grid, selected, onSelect, count = 3 }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const ready = useRef(false)
  const latest = useRef({ result, grid, selected, onSelect, count })
  latest.current = { result, grid, selected, onSelect, count }

  useEffect(() => {
    if (!el.current) return
    const m = new maplibregl.Map({
      container: el.current,
      style: baseStyle(),
      center: [0, 10],
      zoom: 1,
      attributionControl: { compact: true },
      renderWorldCopies: false,
    })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    m.on("load", () => {
      m.addSource("grid", { type: "geojson", data: EMPTY_FC })
      m.addSource("links", { type: "geojson", data: EMPTY_FC })
      m.addLayer({
        id: "grid",
        type: "circle",
        source: "grid",
        paint: {
          "circle-radius": ["case", ["get", "regional"], 1.8, 1.2],
          "circle-color": ["case", ["get", "regional"], "#3b5566", "#243040"],
        },
      })
      m.addLayer({
        id: "links",
        type: "line",
        source: "links",
        paint: {
          "line-color": ["case", ["get", "active"], "#5ec8e5", "#5ec8e5"],
          "line-opacity": ["case", ["get", "active"], 0.9, 0.35],
          "line-width": ["case", ["get", "active"], 1.6, 1],
          "line-dasharray": [2, 2],
        },
      })
      ready.current = true
      draw(m)
    })
    map.current = m
    return () => {
      markers.current.forEach((mk) => mk.remove())
      m.remove()
      map.current = null
      ready.current = false
    }
  }, [])

  useEffect(() => {
    if (map.current && ready.current) draw(map.current)
  }, [result, grid, selected, count])

  function draw(m: MLMap) {
    const { result: r, grid: g, selected: sel, onSelect: pick, count: n } = latest.current
    const analogs = r.match.analogs.slice(0, n)
    const c = r.parcel.centroid
    ;(m.getSource("grid") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: g.map((p) => ({
        type: "Feature",
        properties: { regional: p.region_id !== null },
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      })),
    })
    ;(m.getSource("links") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: analogs.map((a, i) => ({
        type: "Feature",
        properties: { active: i === sel },
        geometry: { type: "LineString", coordinates: [[c.lon, c.lat], [a.lon, a.lat]] },
      })),
    })
    markers.current.forEach((mk) => mk.remove())
    const target = document.createElement("div")
    target.className = "h-3.5 w-3.5 rounded-full border-2 border-[#05070d] bg-[#f2b45a] shadow-[0_0_0_4px_rgba(242,180,90,0.25)]"
    target.title = r.parcel.name ?? "Your parcel"
    markers.current = [new maplibregl.Marker({ element: target }).setLngLat([c.lon, c.lat]).addTo(m)]
    analogs.forEach((a, i) => {
      const node = document.createElement("button")
      node.type = "button"
      node.title = `${a.region_name} — similarity percentile ${a.similarity_percentile.toFixed(1)}`
      node.className =
        "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold shadow " +
        (i === sel ? "border-[#05070d] bg-[#5ec8e5] text-[#04121a]" : "border-[#5ec8e5] bg-[#05070d] text-[#5ec8e5]")
      node.textContent = String(i + 1)
      node.addEventListener("click", () => pick(i))
      markers.current.push(new maplibregl.Marker({ element: node }).setLngLat([a.lon, a.lat]).addTo(m))
    })
    const pts: [number, number][] = [[c.lon, c.lat], ...analogs.map((a) => [a.lon, a.lat] as [number, number])]
    const lons = pts.map((p) => p[0])
    const lats = pts.map((p) => p[1])
    m.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 60, maxZoom: 4, duration: 800 },
    )
  }

  return <div ref={el} className="h-full min-h-[360px] w-full overflow-hidden rounded-xl" />
}
