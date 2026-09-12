import type { StyleSpecification } from "maplibre-gl"

const R = 6371.0088

/** Circle of `radiusKm` around a point, as a closed GeoJSON ring (display only; the API builds its own). */
export function circleRing(lat: number, lon: number, radiusKm: number, n = 64): [number, number][] {
  const φ1 = (lat * Math.PI) / 180
  const λ1 = (lon * Math.PI) / 180
  const δ = radiusKm / R
  const ring: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const θ = (2 * Math.PI * i) / n
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
    ring.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI])
  }
  return ring
}

/**
 * Dark vector basemap — CARTO Dark Matter (free, no API key, CC BY 3.0).
 * Falls back to inline Natural Earth style if the tile server is unreachable.
 */
export const BASE_STYLE = "https://tiles.openfreemap.com/styles/liberty"

/** Minimal offline fallback: Natural Earth 1:110m countries bundled in public/. */
export function offlineStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      countries: { type: "geojson", data: new URL("countries.geojson", document.baseURI).href, attribution: "Natural Earth" },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": "#060a11" } },
      { id: "land", type: "fill", source: "countries", paint: { "fill-color": "#0f1722" } },
      { id: "borders", type: "line", source: "countries", paint: { "line-color": "#1f2a3a", "line-width": 0.6 } },
    ],
  }
}

export const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] }
