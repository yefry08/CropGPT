import { cn } from "@/lib/utils"

/** Position of a z-score on a −3…+3 track; the centre line is the reference-grid mean. */
export function ZBar({ z, color, second, className }: { z: number | null; color: string; second?: number | null; className?: string }) {
  const pos = (v: number) => ((Math.max(-3, Math.min(3, v)) + 3) / 6) * 100
  return (
    <div className={cn("relative h-2 w-full rounded-full bg-secondary", className)} aria-hidden="true">
      <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
      {second !== null && second !== undefined && Number.isFinite(second) ? (
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan bg-background"
          style={{ left: `${pos(second)}%` }}
        />
      ) : null}
      {z !== null && Number.isFinite(z) ? (
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${pos(z)}%`, background: color }}
        />
      ) : null}
    </div>
  )
}
