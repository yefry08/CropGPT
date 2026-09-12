import { useMemo, useState } from "react"
import { Ban, Check, ChevronDown, CircleHelp, ExternalLink, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Technique } from "@/lib/api"
import { NA, evidenceLabel, titleCase } from "@/lib/format"
import { cn } from "@/lib/utils"

function Evidence({ t }: { t: Technique }) {
  const ev = evidenceLabel(t.evidence_check?.status ?? "not_checked")
  return (
    <div className="space-y-1 text-[11px] leading-snug">
      <p className="text-muted-foreground">{t.evidence_source}</p>
      <div className="flex flex-wrap items-center gap-2">
        {t.evidence_url ? (
          <a href={t.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan hover:underline">
            {t.evidence_doi ? `doi:${t.evidence_doi}` : "source"} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="italic text-muted-foreground">evidence link: {NA}</span>
        )}
        <Badge variant={ev.tone}>{ev.text}</Badge>
      </div>
    </div>
  )
}

function Checks({ t }: { t: Technique }) {
  if (!t.constraint_checks.length) return <p className="text-[11px] italic text-muted-foreground">No constraints declared.</p>
  return (
    <ul className="space-y-1 text-[11px]">
      {t.constraint_checks.map((c) => (
        <li key={c.feature + c.op} className="flex items-start gap-1.5">
          {c.status === "pass" ? (
            <Check className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
          ) : c.status === "fail" ? (
            <X className="mt-px h-3.5 w-3.5 shrink-0 text-danger" />
          ) : (
            <CircleHelp className="mt-px h-3.5 w-3.5 shrink-0 text-warn" />
          )}
          <span className={c.status === "fail" ? "text-danger" : "text-secondary-foreground"}>{c.text}</span>
        </li>
      ))}
    </ul>
  )
}

function RankedCard({ t, rank }: { t: Technique; rank: number }) {
  const [open, setOpen] = useState(rank <= 3)
  const score = t.transferability ?? 0
  return (
    <article className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-start gap-4">
        <div className="w-14 shrink-0 text-center">
          <div className="num text-xl font-semibold text-primary">{score.toFixed(2)}</div>
          <div className="mt-1 h-1 w-full rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${score * 100}%` }} />
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">transfer</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num text-[11px] text-muted-foreground">#{rank}</span>
            <Badge variant="secondary">{titleCase(t.category)}</Badge>
            <Badge variant="outline">capital: {t.capital_tier}</Badge>
            <Badge variant="outline" className="border-cyan/40 text-cyan">
              {t.region_name}
            </Badge>
          </div>
          <h4 className="mt-1.5 text-[15px] font-semibold leading-snug">{t.technique}</h4>
          <p className="mt-1 text-[12px] text-muted-foreground">
            similarity {t.analog_similarity?.toFixed(3) ?? NA} × constraints met {Math.round(t.constraint_satisfaction * 100)}%
            {t.unverified_constraints.length ? ` · ${t.unverified_constraints.length} not verifiable` : ""} · crops: {t.crops.join(", ")}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-secondary-foreground">
            <span className="text-muted-foreground">Documented effect: </span>
            {t.documented_effect}
          </p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-2 inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
            aria-expanded={open}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            Evidence, constraints and adaptation notes
          </button>
          {open ? (
            <div className="mt-3 grid gap-4 border-t border-border pt-3 md:grid-cols-2">
              <div className="space-y-3">
                <Evidence t={t} />
                <div>
                  <div className="eyebrow mb-1">Adaptation notes</div>
                  <p className="text-[12px] leading-relaxed text-secondary-foreground">{t.adaptation_notes}</p>
                </div>
              </div>
              <div>
                <div className="eyebrow mb-1">Constraint check against your parcel</div>
                <Checks t={t} />
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{t.requires_basis}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function TechniqueList({ ranked, blocked }: { ranked: Technique[]; blocked: Technique[] }) {
  const [cat, setCat] = useState<string | null>(null)
  const [limit, setLimit] = useState(10)
  const cats = useMemo(() => [...new Set([...ranked, ...blocked].map((t) => t.category))].sort(), [ranked, blocked])
  const shown = ranked.filter((t) => !cat || t.category === cat)
  const shownBlocked = blocked.filter((t) => !cat || t.category === cat)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transferable techniques</CardTitle>
          <CardDescription>
            Transferability = similarity of the source region's best analog cell (percentile ÷ 100) × share of the
            technique's constraints that your parcel verifiably meets. Constraints that cannot be checked lower the score;
            they are never assumed met.
          </CardDescription>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <Button size="sm" variant={cat === null ? "secondary" : "ghost"} onClick={() => setCat(null)}>
              All ({ranked.length})
            </Button>
            {cats.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? "secondary" : "ghost"} onClick={() => setCat(c)}>
                {titleCase(c)} ({ranked.filter((t) => t.category === c).length})
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {shown.slice(0, limit).map((t) => (
            <RankedCard key={t.id} t={t} rank={ranked.indexOf(t) + 1} />
          ))}
          {shown.length === 0 ? <p className="text-sm italic text-muted-foreground">No transferable technique in this category.</p> : null}
          {shown.length > limit ? (
            <Button variant="outline" className="w-full" onClick={() => setLimit((l) => l + 15)}>
              Show more ({shown.length - limit} remaining)
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-danger/25">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-danger" />
            <CardTitle>Blocked techniques ({shownBlocked.length})</CardTitle>
          </div>
          <CardDescription>
            These do not transfer: your parcel violates at least one of the technique's requirements. They are listed with
            the reason instead of being dropped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {shownBlocked.map((t) => (
              <li key={t.id} className="grid gap-1 py-2.5 md:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="text-[13px] font-medium">{t.technique}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.region_name} · {titleCase(t.category)} · analog similarity {t.analog_similarity?.toFixed(3) ?? NA}
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {(t.blocked_reasons ?? []).map((r) => (
                    <li key={r} className="flex items-start gap-1.5 text-[12px] text-danger">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
