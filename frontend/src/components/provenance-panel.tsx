import { useMemo, useState } from "react"
import { Check, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { QueryResult } from "@/lib/api"

export function ProvenancePanel({ result }: { result: QueryResult }) {
  const [all, setAll] = useState(false)
  const reads = useMemo(() => result.provenance.filter((e) => e.processing_level !== "catalogue search"), [result])
  const shown = all ? reads : reads.slice(0, 25)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data sources and audit trail</CardTitle>
        <CardDescription>
          Every external read is logged with source, product ID, acquisition date and processing level. The vector was{" "}
          {result.parcel.vector_mode === "offline" ? "replayed from recorded raw responses" : "computed from live requests"} on{" "}
          {result.parcel.vector_computed_at.slice(0, 10)}
          {result.parcel.vector_cache === "hit" ? " and served from the on-disk vector cache" : ""}. App mode: {result.mode}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead className="text-left text-[11px] text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">Source</th>
                <th className="py-1 font-medium">Dimensions</th>
                <th className="py-1 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.sources.map((s) => (
                <tr key={s.source} className="border-t border-border/60 align-top">
                  <td className="py-1.5 pr-3 font-medium">{s.source}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{s.dimensions.join(", ")}</td>
                  <td className="py-1.5">
                    {s.ok ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Check className="h-3.5 w-3.5" /> retrieved
                      </span>
                    ) : (
                      <span className="inline-flex items-start gap-1 text-warn">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {s.note ?? "missing"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {result.source_notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span className="text-warn">•</span>
              {n}
            </li>
          ))}
        </ul>

        <div className="overflow-x-auto">
          <div className="eyebrow mb-2">
            Raw reads ({reads.length}) — scenes, granules and files behind this result
          </div>
          <table className="w-full min-w-[760px] text-[11px]">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">Source</th>
                <th className="py-1 font-medium">Product ID</th>
                <th className="py-1 font-medium">Acquisition</th>
                <th className="py-1 font-medium">Processing level</th>
              </tr>
            </thead>
            <tbody className="num">
              {shown.map((e, i) => (
                <tr key={i} className="border-t border-border/50 align-top">
                  <td className="py-1 pr-3 font-sans text-secondary-foreground">{e.source}</td>
                  <td className="break-all py-1 pr-3">{e.product_id}</td>
                  <td className="py-1 pr-3 whitespace-nowrap">{e.acquisition_date}</td>
                  <td className="py-1 font-sans text-muted-foreground">{e.processing_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reads.length > 25 ? (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll((a) => !a)}>
              {all ? "Show fewer" : `Show all ${reads.length}`}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
