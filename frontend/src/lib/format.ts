import type { Group } from "@/lib/api"

export const NA = "not available"

export function fmt(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return NA
  const a = Math.abs(v)
  const s =
    a === 0 ? "0" : a < 1 ? v.toFixed(3) : a < 10 ? v.toFixed(2) : a < 100 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US")
  return unit && unit !== "index" && unit !== "ratio" ? `${s} ${unit}` : s
}

export function signed(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—"
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}`
}

export const GROUP_COLOR: Record<Group, string> = {
  climate: "var(--g-climate)",
  water: "var(--g-water)",
  soil: "var(--g-soil)",
  terrain: "var(--g-terrain)",
  vegetation: "var(--g-vegetation)",
}

export const GROUP_HEX: Record<Group, string> = {
  climate: "#f2b45a",
  water: "#5ec8e5",
  soil: "#c9a27e",
  terrain: "#a99cf0",
  vegetation: "#6fcf97",
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function evidenceLabel(status: string): { text: string; tone: "default" | "warn" | "outline" } {
  switch (status) {
    case "doi_verified":
      return { text: "DOI verified (Crossref title match)", tone: "default" }
    case "doi_verified_metadata":
      return { text: "DOI verified (Crossref author/year/journal)", tone: "default" }
    case "url_ok":
      return { text: "link reachable", tone: "default" }
    case "no_link":
      return { text: "no verified link", tone: "outline" }
    default:
      return { text: status.replace(/_/g, " "), tone: "warn" }
  }
}
