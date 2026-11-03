import { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Search, Wrench, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CATEGORY_META,
  FAULT_DATABASE,
  searchFaults,
  type FaultCategory,
  type FaultEntry,
} from "@/lib/fault-database"
import { cn } from "@/lib/utils"

const SEVERITY_STYLE: Record<FaultEntry["severity"], string> = {
  baja:     "bg-green-500/15 text-green-400 border-green-500/30",
  media:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  alta:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  crítica:  "bg-red-500/15 text-red-400 border-red-500/30",
}

function FaultCard({ fault, defaultOpen = false }: { fault: FaultEntry; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const cat = CATEGORY_META[fault.category]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">{cat.emoji}</span>
          <div className="min-w-0">
            <p className="font-medium text-[14px] leading-snug">{fault.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{cat.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", SEVERITY_STYLE[fault.severity])}>
            {fault.severity}
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-5 pt-4 space-y-5">
          {/* Symptoms */}
          <div>
            <p className="eyebrow mb-2">Síntomas</p>
            <ul className="space-y-1">
              {fault.symptoms.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Causes */}
          <div>
            <p className="eyebrow mb-2">Causas posibles</p>
            <ul className="space-y-1">
              {fault.causes.map((c) => (
                <li key={c} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-yellow-500/70" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Immediate actions */}
          <div className="rounded-lg border border-orange-500/25 bg-orange-500/5 p-3">
            <p className="eyebrow mb-2 text-orange-400">⚡ Acciones inmediatas</p>
            <ul className="space-y-1">
              {fault.immediate.map((a) => (
                <li key={a} className="flex items-start gap-2 text-[12px] text-orange-200/80">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400/70 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Step-by-step plan */}
          <div>
            <p className="eyebrow mb-3">Plan de contingencia — paso a paso</p>
            <ol className="space-y-3">
              {fault.steps.map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium">{step.action}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Tools + time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="flex items-center gap-1.5 eyebrow mb-2">
                <Wrench className="h-3 w-3" /> Herramientas
              </p>
              <ul className="space-y-0.5">
                {fault.tools.map((t) => (
                  <li key={t} className="text-[11px] text-muted-foreground">• {t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <p className="flex items-center gap-1.5 eyebrow mb-2">
                <Clock className="h-3 w-3" /> Tiempo estimado
              </p>
              <p className="num text-lg font-semibold">{fault.time}</p>
              <div className="mt-3">
                <p className="eyebrow mb-1.5">Prevención</p>
                <ul className="space-y-0.5">
                  {fault.prevention.map((p) => (
                    <li key={p} className="text-[11px] text-muted-foreground">• {p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function FaultDetector() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<FaultCategory | null>(null)
  const [results, setResults] = useState<FaultEntry[]>(() => FAULT_DATABASE.slice(0, 3))
  const [searched, setSearched] = useState(true)

  function detect() {
    if (!query.trim() && activeCategory === null) {
      setResults(FAULT_DATABASE.slice(0, 3))
    } else {
      setResults(searchFaults(query, activeCategory))
    }
    setSearched(true)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") detect()
  }

  return (
    <section id="fault-detector" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-8 md:px-5 md:py-12">
      <div className="border-t border-orange-500/30 pt-10">
        {/* Visual banner */}
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-500/8 to-transparent p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
            <Zap className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-orange-400/80">Sistema de diagnóstico agrícola</p>
            <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">
              Detector de Fallas y Plan de Contingencia
            </h2>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              Describe el problema de cualquier estructura, máquina o sistema de tu finca. El sistema identifica la falla, sus causas y genera un plan de corrección <strong className="text-foreground">paso a paso</strong>.
            </p>
          </div>
        </div>

        <Card className="mt-6 p-5 space-y-4">
          {/* Category selector */}
          <div>
            <p className="text-[12px] text-muted-foreground mb-2">Filtrar por categoría (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_META) as FaultCategory[]).map((cat) => {
                const m = CATEGORY_META[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory((c) => (c === cat ? null : cat))}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                      activeCategory === cat
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Query input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ej: bomba no arranca, techo invernadero roto, grano con temperatura alta…"
                className="w-full rounded-lg border border-border bg-muted py-2.5 pl-9 pr-3 text-[13px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
            <Button onClick={detect} className="shrink-0">
              Detectar falla
            </Button>
          </div>

          {/* Hint */}
          {!searched && (
            <p className="text-[11px] text-muted-foreground">
              Puedes escribir síntomas en español natural — "no sube el implemento", "se calienta el motor", "gorgojo en el arroz", etc.
            </p>
          )}
        </Card>

        {/* Results */}
        {searched && (
          <div className="mt-6 space-y-3">
            {results.length === 0 ? (
              <Card className="p-5 text-center text-[13px] text-muted-foreground">
                No se encontraron fallas coincidentes. Intenta con otros términos o selecciona una categoría.
              </Card>
            ) : (
              <>
                <p className="text-[12px] text-muted-foreground">
                  {results.length} falla{results.length > 1 ? "s" : ""} encontrada{results.length > 1 ? "s" : ""} — haz clic para ver el plan de contingencia completo
                </p>
                {results.map((f, i) => (
                  <FaultCard key={f.id} fault={f} defaultOpen={i === 0} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
