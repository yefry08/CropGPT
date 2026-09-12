import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map as MLMap, StyleSpecification } from "maplibre-gl"
import { Search, Loader2 } from "lucide-react"

import type { Fixture } from "@/lib/api"
import { BASE_STYLE, offlineStyle, circleRing, EMPTY_FC } from "@/lib/geo"
import { FEATURED_LOCATIONS } from "@/lib/featured-locations"

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
  staticMode?: boolean
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

/** Click to place a circular parcel, or click vertices and double-click to close a polygon. */
export function ParcelMap({ draft, onChange, fixtures, activeFixture, onPickFixture, staticMode }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const latest = useRef({ draft, onChange })
  latest.current = { draft, onChange }
  const markers = useRef<maplibregl.Marker[]>([])

  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const featuredMarkers = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!el.current) return

    const tryStyle = (style: string | StyleSpecification, fallback: StyleSpecification | null) => {
      const m = new maplibregl.Map({
        container: el.current!,
        style: style as string | StyleSpecification,
        center: [0, 20],
        zoom: 1.8,
        doubleClickZoom: false,
        attributionControl: { compact: true },
      })

      if (fallback) {
        m.on("error", (e) => {
          const msg = String((e as { error?: { message?: string } }).error?.message ?? "")
          if (fallback && (msg.includes("style") || msg.includes("tiles") || msg.includes("Failed to fetch"))) {
            m.setStyle(fallback as string | StyleSpecification)
          }
        })
      }

      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
      m.on("load", () => {
        m.addSource("parcel", { type: "geojson", data: EMPTY_FC })
        m.addSource("vertices", { type: "geojson", data: EMPTY_FC })
        m.addLayer({ id: "parcel-fill", type: "fill", source: "parcel", paint: { "fill-color": "#f2b45a", "fill-opacity": 0.18 } })
        m.addLayer({ id: "parcel-line", type: "line", source: "parcel", paint: { "line-color": "#f2b45a", "line-width": 1.8 } })
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
      return m
    }

    const m = tryStyle(BASE_STYLE, offlineStyle())
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

  // Fixture parcels as small dot markers on the map.
  useEffect(() => {
    const m = map.current
    if (!m) return
    markers.current.forEach((mk) => mk.remove())
    markers.current = fixtures.map((f) => {
      const node = document.createElement("button")
      node.type = "button"
      node.title = `${f.name} · ${f.country}`
      const active = f.id === activeFixture
      node.className =
        "h-3 w-3 rounded-full border-2 shadow-sm transition-all " +
        (active
          ? "border-[#f2b45a] bg-[#f2b45a] scale-150"
          : "border-[#f2b45a]/70 bg-[#f2b45a]/25 hover:bg-[#f2b45a]/60")
      node.addEventListener("click", (ev) => {
        ev.stopPropagation()
        onPickFixture(f)
      })
      return new maplibregl.Marker({ element: node, anchor: "center" }).setLngLat([f.lon, f.lat]).addTo(m)
    })
  }, [fixtures, activeFixture, onPickFixture])

  // Featured global location pins — placed once on mount, never removed.
  const featuredPlaced = useRef(false)
  useEffect(() => {
    const m = map.current
    if (!m || featuredPlaced.current) return
    const place = () => {
      if (featuredPlaced.current) return
      featuredPlaced.current = true
      featuredMarkers.current = FEATURED_LOCATIONS.map((loc) => {
        const node = document.createElement("button")
        node.type = "button"
        node.title = `${loc.emoji} ${loc.name} · ${loc.country}\n${loc.note}`
        node.className =
          "text-[11px] leading-none rounded-full border border-[#5ec8e5]/50 bg-[#05070d]/80 px-1.5 py-0.5 text-[#5ec8e5] shadow hover:bg-[#5ec8e5]/20 transition-colors"
        node.textContent = loc.emoji
        node.addEventListener("click", (ev) => {
          ev.stopPropagation()
          latest.current.onChange({ ...latest.current.draft, lat: loc.lat, lon: loc.lon, radiusKm: loc.radiusKm })
          map.current?.flyTo({ center: [loc.lon, loc.lat], zoom: 9, speed: 1.8 })
        })
        return new maplibregl.Marker({ element: node, anchor: "center" }).setLngLat([loc.lon, loc.lat]).addTo(m)
      })
    }
    if (m.isStyleLoaded()) place()
    else m.once("load", place)
  }, [])

  // Fly to parcel when set from outside the map.
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

  async function geocode(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setGeoError(null)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      const data: NominatimResult[] = await res.json()
      if (!data.length) { setGeoError("Location not found"); return }
      const { lat, lon } = data[0]
      const latN = parseFloat(lat), lonN = parseFloat(lon)
      onChange({ ...latest.current.draft, lat: latN, lon: lonN })
      map.current?.flyTo({ center: [lonN, latN], zoom: 10, speed: 1.8 })
    } catch {
      setGeoError("Search failed")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-xl">
      <div ref={el} className="h-full w-full" />

      {/* Geocoder overlay */}
      <form
        onSubmit={geocode}
        className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-border/60 bg-background/90 px-2 py-1 shadow-md backdrop-blur"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setGeoError(null) }}
          placeholder="Search any place…"
          className="w-44 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        {searching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </form>

      {geoError && (
        <div className="absolute left-2 top-10 z-10 rounded-md border border-warn/40 bg-background/95 px-2.5 py-1 text-[11px] text-warn shadow">
          {geoError}
        </div>
      )}

      {staticMode && (
        <div className="absolute bottom-2 left-2 right-10 z-10 rounded-md border border-border/50 bg-background/80 px-2.5 py-1.5 text-[10px] leading-snug text-muted-foreground backdrop-blur">
          Click a dot to load a precomputed example, or explore the map.
        </div>
      )}
    </div>
  )
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
