import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map as MLMap } from "maplibre-gl"

import type { Fixture } from "@/lib/api"
import { baseStyle, circleRing, EMPTY_FC } from "@/lib/geo"

export interface ParcelDraft {
  mode: "circle" | "polygon"
  lat: number | null
  lon: number | null
  radiusKm: number
  vertices: [number, number][]
  closed: boolean
}

export function draftRing(d: ParcelDraft): [number, number][] | null {
  if (d.mode === "circle") return d.lat === null || d.lon === null ? null : circleRing(d.lat, d.lon, d.radiusKm)
  if (d.vertices.length < 3) return null
  return [...d.vertices, d.vertices[0]]
}

interface Props {
  draft: ParcelDraft
  onChange: (d: ParcelDraft) => void
  fixtures: Fixture[]
  activeFixture: string | null
  onPickFixture: (f: Fixture) => void
}

/** Click to place a circular parcel, or click vertices and double-click to close a polygon. */
export function ParcelMap({ draft, onChange, fixtures, activeFixture, onPickFixture }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const latest = useRef({ draft, onChange })
  latest.current = { draft, onChange }
  const markers = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!el.current) return
    const m = new maplibregl.Map({
      container: el.current,
      style: baseStyle(),
      center: [-60, -15],
      zoom: 2.2,
      doubleClickZoom: false,
      attributionControl: { compact: true },
    })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    m.on("load", () => {
      m.addSource("parcel", { type: "geojson", data: EMPTY_FC })
      m.addSource("vertices", { type: "geojson", data: EMPTY_FC })
      m.addLayer({ id: "parcel-fill", type: "fill", source: "parcel", paint: { "fill-color": "#f2b45a", "fill-opacity": 0.22 } })
      m.addLayer({ id: "parcel-line", type: "line", source: "parcel", paint: { "line-color": "#f2b45a", "line-width": 1.6 } })
      m.addLayer({
        id: "vertices",
        type: "circle",
        source: "vertices",
        paint: { "circle-radius": 4, "circle-color": "#05070d", "circle-stroke-color": "#f2b45a", "circle-stroke-width": 1.5 },
      })
      paint(m, latest.current.draft)
    })
    m.on("click", (e) => {
      const { draft: d, onChange: set } = latest.current
      const { lng, lat } = e.lngLat
      if (d.mode === "circle") set({ ...d, lat, lon: lng })
      else if (d.closed) set({ ...d, vertices: [[lng, lat]], closed: false })
      else set({ ...d, vertices: [...d.vertices, [lng, lat]] })
    })
    m.on("dblclick", (e) => {
      e.preventDefault()
      const { draft: d, onChange: set } = latest.current
      if (d.mode === "polygon" && d.vertices.length >= 3) set({ ...d, closed: true })
    })
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const m = map.current
    if (m && m.isStyleLoaded()) paint(m, draft)
  }, [draft])

  // Fixture parcels as HTML markers (the offline basemap has no glyphs for text layers).
  useEffect(() => {
    const m = map.current
    if (!m) return
    markers.current.forEach((mk) => mk.remove())
    markers.current = fixtures.map((f) => {
      const node = document.createElement("button")
      node.type = "button"
      node.title = `${f.name} (${f.country})`
      node.className =
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow transition-colors " +
        (f.id === activeFixture
          ? "border-[#f2b45a] bg-[#f2b45a] text-[#1b1203]"
          : "border-[#f2b45a]/60 bg-[#05070d]/85 text-[#f2b45a] hover:bg-[#f2b45a]/20")
      node.textContent = f.name
      node.addEventListener("click", (ev) => {
        ev.stopPropagation()
        onPickFixture(f)
      })
      return new maplibregl.Marker({ element: node, anchor: "bottom", offset: [0, -6] }).setLngLat([f.lon, f.lat]).addTo(m)
    })
  }, [fixtures, activeFixture, onPickFixture])

  // Fly to a parcel when it is set from outside the map (fixture pick, typed coordinates).
  const lastCenter = useRef<string>("")
  useEffect(() => {
    const m = map.current
    if (!m || draft.mode !== "circle" || draft.lat === null || draft.lon === null) return
    const key = `${draft.lat.toFixed(3)},${draft.lon.toFixed(3)}`
    if (key === lastCenter.current) return
    lastCenter.current = key
    const b = m.getBounds()
    if (!b.contains([draft.lon, draft.lat]) || m.getZoom() < 6) {
      m.flyTo({ center: [draft.lon, draft.lat], zoom: Math.max(m.getZoom(), 9.5), speed: 1.6 })
    }
  }, [draft.lat, draft.lon, draft.mode])

  return <div ref={el} className="h-full min-h-[380px] w-full overflow-hidden rounded-xl" />
}

function paint(m: MLMap, d: ParcelDraft) {
  const ring = draftRing(d)
  const parcel = m.getSource("parcel") as GeoJSONSource | undefined
  const verts = m.getSource("vertices") as GeoJSONSource | undefined
  if (!parcel || !verts) return
  const open = d.mode === "polygon" && !d.closed && d.vertices.length >= 2
  parcel.setData({
    type: "FeatureCollection",
    features: ring
      ? [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } }]
      : open
        ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: d.vertices } }]
        : [],
  })
  verts.setData({
    type: "FeatureCollection",
    features:
      d.mode === "polygon"
        ? d.vertices.map((v) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: v } }))
        : [],
  })
}
