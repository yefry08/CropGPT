import { useState } from "react"
import { FEATURED_LOCATIONS, type FeaturedLocation } from "@/lib/featured-locations"

// SVG coordinate transforms:
// x = (lon + 72.0) / 3.7 * 480 + 10   [lon is negative, e.g. -70.5]
// y = (19.9 - lat) / 2.4 * 280 + 10

// DR border path (clockwise from NW — Monte Cristi)
const DR_PATH =
  "M 55,15 L 181,22 L 255,42 L 290,71 " +
  // Samaná peninsula bump (NE)
  "L 388,60 L 320,88 L 350,108 " +
  // East coast down to SE tip
  "L 486,158 L 481,185 " +
  // South coast westward
  "L 434,197 L 358,179 L 282,177 L 254,183 L 175,197 L 127,207 " +
  // Barahona / Cabo Beata
  "L 127,243 L 71,276 " +
  // Pedernales and western border back north
  "L 44,227 L 30,175 L 17,156 L 36,115 L 40,61 L 52,51 L 49,31 Z"

// Haiti polygon (fills the left side of the viewBox up to the DR border)
const HAITI_PATH =
  "M 0,0 L 55,15 L 49,31 L 52,51 L 40,61 L 36,115 L 17,156 L 30,175 L 44,227 L 71,276 L 0,276 Z"

interface ZonePin {
  loc: FeaturedLocation
  x: number
  y: number
  color: string
}

const ZONE_COLORS: Record<string, string> = {
  "cibao-central":    "#22c55e",
  "constanza":        "#0ea5e9",
  "azua":             "#f59e0b",
  "barahona":         "#f59e0b",
  "samana":           "#2dd4bf",
  "monte-plata-norte":"#22c55e",
  "san-jose-ocoa":    "#0ea5e9",
  "valverde-mao":     "#86efac",
  "neyba-enriquillo": "#f59e0b",
  "hato-mayor":       "#4ade80",
}

function lonToX(lon: number) { return (lon + 72.0) / 3.7 * 480 + 10 }
function latToY(lat: number) { return (19.9 - lat) / 2.4 * 280 + 10 }

const ZONE_PINS: ZonePin[] = FEATURED_LOCATIONS.map((loc) => ({
  loc,
  x: lonToX(loc.lon),
  y: latToY(loc.lat),
  color: ZONE_COLORS[loc.id] ?? "#22c55e",
}))

interface Props {
  onZoneSelect?: (loc: FeaturedLocation) => void
  activeZone?: string | null
}

export function DRMapSection({ onZoneSelect, activeZone }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const focused = hovered ?? activeZone ?? null

  const focusedPin = ZONE_PINS.find((p) => p.loc.id === focused)

  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-t border-border pt-10">
        <p className="eyebrow">🗺️ Mapa agropecuario</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          República Dominicana — Zonas Agrícolas
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Haz clic en cualquier zona para cargarla en el motor análogo. Cada zona representa un sistema productivo con condiciones biofísicas distintas.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Map */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0a1628]">
            <svg
              viewBox="0 0 500 300"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              style={{ display: "block" }}
            >
              {/* Ocean background */}
              <rect width="500" height="300" fill="#0a1628" />

              {/* Subtle ocean grid */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 42} x2="500" y2={i * 42} stroke="#0f2240" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 45} y1="0" x2={i * 45} y2="300" stroke="#0f2240" strokeWidth="0.5" />
              ))}

              {/* Haiti */}
              <path d={HAITI_PATH} fill="#121e1a" />
              <path d={HAITI_PATH} fill="none" stroke="#1e3028" strokeWidth="1" />
              <text x="22" y="130" fontSize="8" fill="#2a4030" fontFamily="system-ui" letterSpacing="1" fontWeight="600">
                HAITÍ
              </text>

              {/* DR main polygon */}
              <path d={DR_PATH} fill="#0f2a14" />
              {/* DR terrain shading — Cordillera Central dark ridge */}
              <path
                d="M 115,100 C 140,110 160,120 185,130 C 200,135 215,140 230,138 C 245,135 255,125 260,118 C 265,110 262,100 255,95"
                fill="#0d2510" strokeWidth="0"
              />
              {/* Northern coast band (fertile, greener) */}
              <path
                d="M 55,15 L 290,71 L 388,60 L 320,88 L 290,80 L 180,55 L 100,40 L 55,30 Z"
                fill="#112e18" opacity="0.6"
              />
              {/* Southern arid band */}
              <path
                d="M 70,200 L 175,190 L 250,195 L 310,200 L 370,205 L 430,205 L 480,185 L 480,210 L 430,220 L 360,215 L 290,210 L 210,210 L 130,218 L 71,276 L 44,227 Z"
                fill="#1a200a" opacity="0.5"
              />
              {/* DR border */}
              <path d={DR_PATH} fill="none" stroke="#1e4a26" strokeWidth="1.5" />

              {/* Ocean labels */}
              <text x="300" y="14" fontSize="8" fill="#1a3050" fontFamily="system-ui" letterSpacing="2" textAnchor="middle">
                OCÉANO ATLÁNTICO
              </text>
              <text x="300" y="295" fontSize="8" fill="#1a3050" fontFamily="system-ui" letterSpacing="2" textAnchor="middle">
                MAR CARIBE
              </text>

              {/* Subtle RD label */}
              <text x="230" y="145" fontSize="7" fill="#1a4a22" fontFamily="system-ui" letterSpacing="3" textAnchor="middle" fontWeight="700">
                REPÚBLICA DOMINICANA
              </text>

              {/* Capital Santo Domingo */}
              <circle cx="282" cy="181" r="4" fill="#f2b45a" opacity="0.9" />
              <polygon points="282,172 285,178 282,176 279,178" fill="#f2b45a" opacity="0.9" />
              <text x="287" y="185" fontSize="7" fill="#f2b45a" fontFamily="system-ui" opacity="0.8">Santo Domingo ★</text>

              {/* Santiago */}
              <circle cx="165" cy="62" r="2.5" fill="#aaa" opacity="0.6" />
              <text x="170" y="66" fontSize="6.5" fill="#888" fontFamily="system-ui">Santiago</text>

              {/* Zone pins */}
              {ZONE_PINS.map((pin) => {
                const isActive = focused === pin.loc.id
                const r = isActive ? 10 : 7
                return (
                  <g
                    key={pin.loc.id}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHovered(pin.loc.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => onZoneSelect?.(pin.loc)}
                  >
                    {isActive && (
                      <circle cx={pin.x} cy={pin.y} r={18} fill={pin.color} opacity={0.15} />
                    )}
                    <circle cx={pin.x} cy={pin.y} r={r} fill={pin.color} opacity={isActive ? 1 : 0.75} />
                    <circle cx={pin.x} cy={pin.y} r={r} fill="none" stroke={pin.color} strokeWidth={isActive ? 2 : 1} opacity={0.4} />
                    <text
                      x={pin.x}
                      y={pin.y + 4}
                      textAnchor="middle"
                      fontSize={isActive ? "9" : "8"}
                      fontFamily="system-ui"
                    >
                      {pin.loc.emoji}
                    </text>
                  </g>
                )
              })}

              {/* Tooltip on hover */}
              {focusedPin && (
                <g>
                  {/* Tooltip box — position depends on zone location */}
                  {(() => {
                    const tx = focusedPin.x > 350 ? focusedPin.x - 150 : focusedPin.x + 16
                    const ty = focusedPin.y > 230 ? focusedPin.y - 54 : focusedPin.y - 8
                    return (
                      <>
                        <rect x={tx} y={ty} width="140" height="48" rx="5" fill="#0a1628" stroke={focusedPin.color} strokeWidth="1" opacity="0.95" />
                        <text x={tx + 7} y={ty + 15} fontSize="8.5" fill="white" fontFamily="system-ui" fontWeight="600">
                          {focusedPin.loc.emoji} {focusedPin.loc.name}
                        </text>
                        <text x={tx + 7} y={ty + 26} fontSize="7" fill="#8793a5" fontFamily="system-ui">
                          {focusedPin.loc.region}
                        </text>
                        <foreignObject x={tx + 7} y={ty + 30} width="128" height="30">
                          <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: "6.5px", color: "#6b7280", lineHeight: "1.3", fontFamily: "system-ui" }}>
                            {focusedPin.loc.note}
                          </div>
                        </foreignObject>
                      </>
                    )
                  })()}
                </g>
              )}

              {/* Compass rose */}
              <g transform="translate(472, 24)">
                <circle cx="0" cy="0" r="12" fill="#0d1f30" stroke="#1e3a50" strokeWidth="1" />
                <polygon points="0,-9 2.5,-3 0,-5 -2.5,-3" fill="#f2b45a" />
                <polygon points="0,9 2.5,3 0,5 -2.5,3" fill="#444" />
                <polygon points="-9,0 -3,-2.5 -5,0 -3,2.5" fill="#444" />
                <polygon points="9,0 3,-2.5 5,0 3,2.5" fill="#444" />
                <text x="0" y="-12" textAnchor="middle" fontSize="6" fill="#f2b45a" fontFamily="system-ui" fontWeight="700">N</text>
              </g>
            </svg>
          </div>

          {/* Zone legend */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[400px] lg:max-h-none">
            <p className="text-[11px] text-muted-foreground mb-1">10 zonas — clic para cargar en el análisis</p>
            {ZONE_PINS.map((pin) => {
              const isActive = focused === pin.loc.id
              return (
                <button
                  key={pin.loc.id}
                  type="button"
                  onMouseEnter={() => setHovered(pin.loc.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onZoneSelect?.(pin.loc)}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                    isActive
                      ? "border-primary/50 bg-primary/8"
                      : "border-border hover:border-border/80 hover:bg-secondary/40"
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{pin.loc.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium leading-tight">{pin.loc.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{pin.loc.note}</p>
                  </div>
                  <div
                    className="h-2 w-2 rounded-full shrink-0 mt-1"
                    style={{ background: pin.color }}
                  />
                </button>
              )
            })}
            <div className="mt-2 flex flex-col gap-1 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Húmedo tropical</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500 inline-block" /> Montaña / altitude</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Semiárido / costa sur</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-400 inline-block" /> Húmedo costero</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
