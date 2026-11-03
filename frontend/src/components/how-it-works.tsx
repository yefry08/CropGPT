function FieldSVG() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Water icon top-left */}
      <circle cx="28" cy="30" r="14" fill="#0ea5e9" opacity="0.15" />
      <path d="M28 18c-4 6-9 11-9 17a9 9 0 0018 0c0-6-5-11-9-17z" fill="#38bdf8" />
      {/* Climate icon top-right */}
      <circle cx="212" cy="30" r="14" fill="#f59e0b" opacity="0.15" />
      <rect x="209" y="21" width="6" height="11" rx="3" fill="#fbbf24" />
      <circle cx="212" cy="35" r="4.5" fill="#f59e0b" />
      {/* Terrain icon top-center */}
      <circle cx="120" cy="13" r="12" fill="#818cf8" opacity="0.15" />
      <polygon points="120,5 112,21 128,21" fill="#a5b4fc" />
      <polygon points="120,5 112,21 117,21" fill="white" opacity="0.25" />
      {/* Soil icon bottom-left */}
      <circle cx="24" cy="133" r="14" fill="#92400e" opacity="0.15" />
      <rect x="16" y="127" width="16" height="3" rx="1.5" fill="#b45309" />
      <rect x="16" y="132" width="16" height="3" rx="1.5" fill="#78350f" />
      <rect x="16" y="137" width="16" height="3" rx="1.5" fill="#451a03" />
      {/* Vegetation icon bottom-right */}
      <circle cx="216" cy="133" r="14" fill="#22c55e" opacity="0.15" />
      <path d="M216 143c0 0-9-14 0-19c9 5 0 19 0 19z" fill="#4ade80" />
      <line x1="216" y1="143" x2="216" y2="124" stroke="#16a34a" strokeWidth="1.5" />
      {/* Connector dashes */}
      <line x1="81" y1="56" x2="42" y2="38" stroke="#f2b45a" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.5" />
      <line x1="159" y1="56" x2="198" y2="38" stroke="#f2b45a" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.5" />
      <line x1="120" y1="44" x2="120" y2="24" stroke="#f2b45a" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.5" />
      <line x1="78" y1="78" x2="38" y2="124" stroke="#f2b45a" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.5" />
      <line x1="162" y1="78" x2="202" y2="124" stroke="#f2b45a" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.5" />
      {/* Isometric field — top face */}
      <polygon points="120,44 170,72 120,100 70,72" fill="#14532d" />
      {/* Left wall */}
      <polygon points="70,72 120,100 120,118 70,90" fill="#0f3d1f" />
      {/* Right wall */}
      <polygon points="120,100 170,72 170,90 120,118" fill="#0d3318" />
      {/* Crop rows (4 parallel lines on top face) */}
      <line x1="83" y1="67" x2="157" y2="77" stroke="#4ade80" strokeWidth="1.2" opacity="0.55" />
      <line x1="92" y1="61" x2="148" y2="83" stroke="#4ade80" strokeWidth="1.2" opacity="0.55" />
      <line x1="102" y1="55" x2="138" y2="89" stroke="#4ade80" strokeWidth="1.2" opacity="0.55" />
      <line x1="111" y1="48" x2="129" y2="95" stroke="#4ade80" strokeWidth="1.2" opacity="0.55" />
      {/* Center origin dot */}
      <circle cx="120" cy="72" r="3" fill="#f2b45a" opacity="0.9" />
    </svg>
  )
}

function GlobeSVG() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Globe */}
      <circle cx="120" cy="80" r="58" fill="#0c1f3f" opacity="0.85" />
      <circle cx="120" cy="80" r="58" stroke="#1e3a6a" strokeWidth="1.5" />
      {/* Latitude ellipses */}
      <ellipse cx="120" cy="62" rx="50" ry="11" stroke="#1e3a6a" strokeWidth="0.8" />
      <ellipse cx="120" cy="80" rx="58" ry="15" stroke="#1e3a6a" strokeWidth="0.8" />
      <ellipse cx="120" cy="98" rx="50" ry="11" stroke="#1e3a6a" strokeWidth="0.8" />
      {/* Longitude */}
      <line x1="120" y1="22" x2="120" y2="138" stroke="#1e3a6a" strokeWidth="0.8" />
      {/* Continent blobs (simplified) */}
      <path d="M73 54c-3 5-4 14-3 22s-2 15 3 21 8 4 13 0 7-12 6-20-4-16-7-20c-4-4-9-7-12-3z" fill="#1a4a2a" opacity="0.55" />
      <path d="M125 57c-5 2-8 7-7 14s-5 14-1 20 9 7 14 3 8-11 6-19c-2-8 0-18-4-20-3-1-6 0-8 2z" fill="#1a4a2a" opacity="0.55" />
      <path d="M121 48c-4-2-7 0-6 4s5 7 9 6 8-4 6-8c-2-3-6-3-9-2z" fill="#1a4a2a" opacity="0.55" />
      <path d="M137 48c-6-2-9 4-5 10s12 8 18 6 12-7 10-12-9-7-14-7c-4 0-7 2-9 3z" fill="#1a4a2a" opacity="0.55" />
      {/* DR (active parcel — amber) */}
      <circle cx="88" cy="72" r="5.5" fill="#f2b45a" />
      <circle cx="88" cy="72" r="11" fill="#f2b45a" opacity="0.2" />
      <circle cx="88" cy="72" r="16" fill="#f2b45a" opacity="0.08" />
      {/* Analog dots (cyan) */}
      <circle cx="124" cy="89" r="4" fill="#5ec8e5" />
      <circle cx="150" cy="56" r="4" fill="#5ec8e5" />
      <circle cx="135" cy="70" r="4" fill="#5ec8e5" />
      <circle cx="78" cy="93" r="4" fill="#5ec8e5" />
      <circle cx="161" cy="74" r="4" fill="#5ec8e5" />
      {/* Connection lines DR → analogs */}
      <line x1="88" y1="72" x2="124" y2="89" stroke="#5ec8e5" strokeWidth="1" strokeDasharray="3,2" opacity="0.65" />
      <line x1="88" y1="72" x2="150" y2="56" stroke="#5ec8e5" strokeWidth="1" strokeDasharray="3,2" opacity="0.65" />
      <line x1="88" y1="72" x2="135" y2="70" stroke="#5ec8e5" strokeWidth="1" strokeDasharray="3,2" opacity="0.65" />
      <line x1="88" y1="72" x2="78" y2="93" stroke="#5ec8e5" strokeWidth="1" strokeDasharray="3,2" opacity="0.65" />
      <line x1="88" y1="72" x2="161" y2="74" stroke="#5ec8e5" strokeWidth="1" strokeDasharray="3,2" opacity="0.65" />
      {/* Similarity labels */}
      <text x="108" y="85" fontSize="7" fill="#5ec8e5" opacity="0.9" fontFamily="monospace">96%</text>
      <text x="121" y="60" fontSize="7" fill="#5ec8e5" opacity="0.9" fontFamily="monospace">93%</text>
      <text x="115" y="69" fontSize="7" fill="#5ec8e5" opacity="0.9" fontFamily="monospace">91%</text>
    </svg>
  )
}

function TechniquesSVG() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {/* Shadow */}
      <ellipse cx="120" cy="140" rx="46" ry="6" fill="black" opacity="0.12" />
      {/* Document body */}
      <rect x="72" y="18" width="96" height="116" rx="8" fill="#f8fafc" />
      <rect x="72" y="18" width="96" height="116" rx="8" stroke="#e2e8f0" strokeWidth="1.5" />
      {/* Clipboard top */}
      <rect x="97" y="12" width="46" height="16" rx="6" fill="#cbd5e1" />
      <rect x="109" y="9" width="22" height="10" rx="4" fill="#94a3b8" />
      {/* Header */}
      <rect x="84" y="36" width="72" height="5" rx="2.5" fill="#94a3b8" opacity="0.7" />
      <rect x="84" y="44" width="50" height="3" rx="1.5" fill="#cbd5e1" />
      <line x1="84" y1="54" x2="156" y2="54" stroke="#e2e8f0" strokeWidth="1" />
      {/* Item 1 — approved */}
      <circle cx="92" cy="66" r="8.5" fill="#dcfce7" />
      <path d="M88 66l3 3 6-6" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="105" y="61" width="40" height="4" rx="2" fill="#86efac" opacity="0.75" />
      <rect x="105" y="68" width="28" height="3" rx="1.5" fill="#bbf7d0" opacity="0.75" />
      {/* Item 2 — approved */}
      <circle cx="92" cy="88" r="8.5" fill="#dcfce7" />
      <path d="M88 88l3 3 6-6" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="105" y="83" width="46" height="4" rx="2" fill="#86efac" opacity="0.75" />
      <rect x="105" y="90" width="32" height="3" rx="1.5" fill="#bbf7d0" opacity="0.75" />
      {/* Item 3 — blocked */}
      <circle cx="92" cy="110" r="8.5" fill="#fee2e2" />
      <line x1="88" y1="110" x2="97" y2="110" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="105" y="105" width="38" height="4" rx="2" fill="#fca5a5" opacity="0.7" />
      <line x1="105" y1="107" x2="143" y2="107" stroke="#dc2626" strokeWidth="1.2" opacity="0.5" />
      <rect x="105" y="112" width="26" height="3" rx="1.5" fill="#fecaca" opacity="0.7" />
      {/* Badge */}
      <rect x="166" y="72" width="54" height="22" rx="11" fill="#0f172a" />
      <text x="193" y="87" fontSize="7.5" fill="#f2b45a" textAnchor="middle" fontFamily="monospace" fontWeight="bold">65 técnicas</text>
      {/* Arrow */}
      <path d="M166 83 L158 83" stroke="#f2b45a" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.75" />
      <polygon points="158,80 152,83 158,86" fill="#f2b45a" opacity="0.75" />
    </svg>
  )
}

interface StepCardProps {
  step: string
  title: string
  description: string
  figure: React.ReactNode
}

function StepCard({ step, title, description, figure }: StepCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-[#05070d] p-4">
        {figure}
      </div>
      <div>
        <p className="text-[10px] font-mono tracking-widest text-muted-foreground">{step}</p>
        <h3 className="mt-1 text-[15px] font-semibold">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-4 pt-10">
      <p className="eyebrow text-center">Cómo funciona</p>
      <h2 className="mt-2 text-center text-2xl font-semibold tracking-tight">
        Tres pasos del análisis análogo
      </h2>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <StepCard
          step="PASO 01"
          title="Huella biofísica de tu parcela"
          description="24 dimensiones de agua, suelo, clima, terreno y vegetación se extraen desde satélite y bases globales. Cada dimensión recibe un peso ajustable."
          figure={<FieldSVG />}
        />
        <StepCard
          step="PASO 02"
          title="Búsqueda global de análogos"
          description="La distancia de Mahalanobis localiza los lugares más cercanos en una cuadrícula global de 2 000 celdas. El percentil de similitud mide qué tan buenos son los análogos."
          figure={<GlobeSVG />}
        />
        <StepCard
          step="PASO 03"
          title="Técnicas transferibles y bloqueadas"
          description="65 técnicas agrícolas citadas se evalúan contra las condiciones reales de tu parcela. Las bloqueadas se muestran con la razón — no se ocultan."
          figure={<TechniquesSVG />}
        />
      </div>
    </section>
  )
}
