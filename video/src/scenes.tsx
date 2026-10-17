import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CONTACT, NARRATION_LANG, PLATFORM_URL, SEVERITY, BRAND } from "../config.ts";
import { figures, fmtInt, type Manifest, type TimedCue } from "../timeline.ts";
import { Capture, Chip, GRAD, INK, MUTED, Reveal, gradText } from "./ui";

type P = { dur: number; cues: TimedCue[]; manifest: Manifest };

// On-screen words. Every phrase comes from the script; nothing is added.
const T = {
  en: {
    open: ["Public procurement data is", "open by law", "across Latin America."],
    tooTechnical: "But it is too technical for the people who need it most",
    smb: "Small businesses bidding on contracts",
    citizens: "Citizens asking where their money goes",
    flags: "Flags prices far above similar past contracts",
    similar: "Similar past contracts",
    thisOne: "This contract",
    illustrative: "Illustration",
    buyer: "Buyer", category: "Category", detail: "Contract detail",
    review: "Warrants review", verdict: "Never a verdict",
    demo: ["Search · Country · Buyer · Category", "Only anomalies", "Alert evidence"],
    phList: "Contract list · search and filters", phFilters: "Filters: country, buyer, category", phAnom: "Filter: only with anomalies", phDetail: "Contract detail with alert evidence", phHome: "Home page with counters", phSources: "Data sources by country",
    desc: "Contract description",
    llm: "Multilingual language model", llmSub: "Finds truly comparable purchases",
    stat: "Statistical layer", statSub: "Checks every country",
    agree: "Both signals agree → stronger alert",
    person: "A person always makes the final decision",
    high: "High deviation", rev: "Review", normal: "Normal",
    countries: "countries with live data", contracts: "contracts ingested", anomalies: "open anomalies", historical: "historical contracts used to validate the model", million: "million",
    oas: "Recognized by the Organization of American States",
    close: "Transparency should not depend on expensive tools or specialized knowledge.",
    urlPending: "[URL PENDIENTE]",
  },
  es: {
    open: ["Los datos de compras públicas son", "abiertos por ley", "en toda América Latina."],
    tooTechnical: "Pero son demasiado técnicos para quienes más los necesitan",
    smb: "Pequeñas empresas que compiten por contratos",
    citizens: "Ciudadanos que preguntan a dónde va su dinero",
    flags: "Señala precios muy por encima de contratos similares anteriores",
    similar: "Contratos similares anteriores",
    thisOne: "Este contrato",
    illustrative: "Ilustración",
    buyer: "Comprador", category: "Categoría", detail: "Detalle del contrato",
    review: "Amerita revisión", verdict: "Nunca un veredicto",
    demo: ["Búsqueda · País · Comprador · Categoría", "Solo anomalías", "Evidencia de la alerta"],
    phList: "Lista de contratos · búsqueda y filtros", phFilters: "Filtros: país, comprador, categoría", phAnom: "Filtro: solo con anomalías", phDetail: "Detalle del contrato con la evidencia", phHome: "Portada con los contadores", phSources: "Fuentes de datos por país",
    desc: "Descripción del contrato",
    llm: "Modelo de lenguaje multilingüe", llmSub: "Encuentra compras realmente comparables",
    stat: "Capa estadística", statSub: "Revisa cada país",
    agree: "Ambas señales coinciden → alerta más sólida",
    person: "Una persona siempre toma la decisión final",
    high: "Desviación alta", rev: "Revisar", normal: "Normal",
    countries: "países con datos en vivo", contracts: "contratos ingeridos", anomalies: "anomalías abiertas", historical: "contratos históricos usados para validar el modelo", million: "millones",
    oas: "Reconocido por la Organización de los Estados Americanos",
    close: "La transparencia no debería depender de herramientas costosas ni de conocimiento especializado.",
    urlPending: "[URL PENDIENTE]",
  },
}[NARRATION_LANG];

const Page: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ padding: "110px 150px 190px", ...style }}>{children}</AbsoluteFill>
);

const Wordmark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontSize: size, fontWeight: 800, letterSpacing: -2, ...gradText }}>Contractor AI</div>
);

// Scene 1: the problem.
const Problem: React.FC<P> = ({ cues }) => (
  <Page style={{ justifyContent: "center" }}>
    <Reveal at={cues[0].from}>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5 }}>
        {T.open[0]} <span style={gradText}>{T.open[1]}</span>
        <br />
        {T.open[2]}
      </div>
    </Reveal>
    <Reveal at={cues[1].from} style={{ marginTop: 70 }}>
      <div style={{ fontSize: 44, color: MUTED, fontWeight: 600 }}>{T.tooTechnical}</div>
    </Reveal>
    <div style={{ display: "flex", gap: 28, marginTop: 40 }}>
      <Reveal at={cues[2].from}><Chip color={BRAND.primary}>{T.smb}</Chip></Reveal>
      <Reveal at={cues[2].from + 30}><Chip color={BRAND.secondary}>{T.citizens}</Chip></Reveal>
    </div>
  </Page>
);

// Scene 2: what it does. The bars are a schematic, labeled as such, with no values.
const Solution: React.FC<P> = ({ cues }) => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [cues[1].from, cues[1].from + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bars = [0.30, 0.34, 0.28, 0.32, 0.36];
  return (
    <Page style={{ justifyContent: "center" }}>
      <Reveal at={cues[0].from}><Wordmark size={96} /></Reveal>
      <Reveal at={cues[1].from} style={{ marginTop: 14 }}>
        <div style={{ fontSize: 46, fontWeight: 600 }}>{T.flags}</div>
      </Reveal>
      <div style={{ display: "flex", gap: 110, marginTop: 56, alignItems: "flex-end" }}>
        <Reveal at={cues[1].from}>
          <div style={{ display: "flex", gap: 22, alignItems: "flex-end", height: 330 }}>
            {bars.map((h, i) => <div key={i} style={{ width: 62, height: 330 * h * grow, borderRadius: 10, background: "#d1d5db" }} />)}
            <div style={{ width: 62, height: 330 * 0.95 * grow, borderRadius: 10, background: SEVERITY.high, marginLeft: 26 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 24, color: MUTED, fontWeight: 600, width: 540 }}>
            <span>{T.similar}</span><span style={{ color: SEVERITY.high }}>{T.thisOne}</span>
          </div>
          <div style={{ fontSize: 18, color: "#9ca3af", marginTop: 6 }}>{T.illustrative}</div>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 40 }}>
          <Reveal at={cues[2].from}><Chip color={INK}>{T.buyer}</Chip></Reveal>
          <Reveal at={cues[2].from + 15}><Chip color={INK}>{T.category}</Chip></Reveal>
          <Reveal at={cues[2].from + 30}><Chip color={INK}>{T.detail}</Chip></Reveal>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 40 }}>
          <Reveal at={cues[3].from}><Chip color={SEVERITY.review} size={40}>{T.review}</Chip></Reveal>
          <Reveal at={cues[3].from + 30}>
            <div style={{ fontSize: 34, fontWeight: 600, color: MUTED, paddingLeft: 30, textDecoration: "line-through", textDecorationColor: "#9ca3af" }}>{T.verdict}</div>
          </Reveal>
        </div>
      </div>
    </Page>
  );
};

// Scene 3: the live platform. One capture at a time, timed to the narration.
const Demo: React.FC<P> = ({ cues, dur, manifest }) => {
  const c = manifest.captures;
  const mid = Math.round((cues[0].from + cues[1].from) / 2);
  const beats = [
    { from: 0, to: mid, src: c.list, ph: T.phList, title: T.demo[0] },
    { from: mid, to: cues[1].from, src: c.filters, ph: T.phFilters, title: T.demo[0] },
    { from: cues[1].from, to: cues[2].from, src: c.anomalies, ph: T.phAnom, title: T.demo[1] },
    { from: cues[2].from, to: dur, src: c.detail, ph: T.phDetail, title: T.demo[2] },
  ];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 60 }}>
      {beats.map((b, i) => (
        <AbsoluteFill key={i} style={{ alignItems: "center", paddingTop: 56 }}>
          <Reveal at={b.from} until={i < beats.length - 1 ? b.to + 8 : undefined} dy={0}>
            <div style={{ fontSize: 40, fontWeight: 700, textAlign: "center", marginBottom: 26, color: i === 2 ? SEVERITY.high : INK }}>{b.title}</div>
            <Capture src={b.src} label={b.ph} width={1440} height={760} zoomFrom={b.from} />
          </Reveal>
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

// Scene 4: two independent signals, a human decision.
const Box: React.FC<{ title: string; sub?: string; color: string; w?: number }> = ({ title, sub, color, w = 520 }) => (
  <div style={{ width: w, padding: "30px 34px", borderRadius: 20, border: `2px solid ${color}`, background: `${color}0d` }}>
    <div style={{ fontSize: 36, fontWeight: 800, color }}>{title}</div>
    {sub && <div style={{ fontSize: 28, fontWeight: 600, color: MUTED, marginTop: 8 }}>{sub}</div>}
  </div>
);
const Arrow: React.FC = () => <div style={{ fontSize: 54, color: "#9ca3af", fontWeight: 400 }}>→</div>;

const HowAI: React.FC<P> = ({ cues }) => (
  <Page style={{ justifyContent: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
      <Reveal at={cues[0].from}><Box title={T.desc} color={INK} w={340} /></Reveal>
      <Reveal at={cues[0].from + 10}><Arrow /></Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <Reveal at={cues[0].from + 15}><Box title={T.llm} sub={T.llmSub} color={BRAND.primary} /></Reveal>
        <Reveal at={cues[2].from}><Box title={T.stat} sub={T.statSub} color={BRAND.secondary} /></Reveal>
      </div>
      <Reveal at={cues[3].from}><Arrow /></Reveal>
      <Reveal at={cues[3].from}>
        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 20 }}>
          <Chip color={SEVERITY.high} size={30}>{T.agree}</Chip>
        </div>
      </Reveal>
    </div>
    <Reveal at={cues[4].from} style={{ marginTop: 64 }}>
      <div style={{ fontSize: 52, fontWeight: 800, textAlign: "center" }}>{T.person}</div>
    </Reveal>
    <Reveal at={cues[4].from + 20} style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 24 }}>
      <Chip color={SEVERITY.high} size={26}>{T.high}</Chip>
      <Chip color={SEVERITY.review} size={26}>{T.rev}</Chip>
      <Chip color={SEVERITY.normal} size={26}>{T.normal}</Chip>
    </Reveal>
  </Page>
);

// Scene 5: one big figure at a time, next to the capture it comes from.
const Traction: React.FC<P> = ({ cues, dur, manifest }) => {
  const fg = figures(manifest);
  const c = manifest.captures;
  const items = [
    { n: String(fg.countries), l: T.countries, color: BRAND.primary, src: c.sources, ph: T.phSources },
    { n: fmtInt(fg.contracts), l: T.contracts, color: BRAND.secondary, src: c.home, ph: T.phHome },
    { n: fmtInt(fg.anomalies), l: T.anomalies, color: SEVERITY.high, src: c.home, ph: T.phHome },
    { n: `${fg.historicalMillions} ${T.million}`, l: T.historical, color: BRAND.primary, src: null, ph: "" },
  ];
  return (
    <AbsoluteFill>
      {items.map((it, i) => (
        <AbsoluteFill key={i} style={{ flexDirection: "row", alignItems: "center", padding: "0 130px 120px", gap: 80 }}>
          <Reveal at={cues[i].from} until={cues[i + 1].from + 6} style={{ flex: 1, textAlign: it.ph ? "left" : "center" }}>
            <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: -6, lineHeight: 1, color: it.color }}>{it.n}</div>
            <div style={{ fontSize: 50, fontWeight: 600, marginTop: 24, color: INK }}>{it.l}</div>
          </Reveal>
          {it.ph && (
            <Reveal at={cues[i].from + 6} until={cues[i + 1].from + 6}>
              <Capture src={it.src} label={it.ph} width={760} height={460} zoomFrom={cues[i].from} />
            </Reveal>
          )}
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 120 }}>
        <Reveal at={cues[4].from}>
          <div style={{ fontSize: 64, fontWeight: 800, textAlign: "center", maxWidth: 1400, lineHeight: 1.2 }}>
            <span style={gradText}>{T.oas}</span>
          </div>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 6: close with the URL and contact.
const Close: React.FC<P> = ({ cues }) => {
  const url = /^https?:\/\//.test(PLATFORM_URL) ? PLATFORM_URL.replace(/^https?:\/\//, "").replace(/\/$/, "") : T.urlPending;
  return (
    <Page style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Reveal at={cues[0].from}>
        <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.25, maxWidth: 1400 }}>{T.close}</div>
      </Reveal>
      <Reveal at={cues[1].from} style={{ marginTop: 60 }}>
        <div style={{ fontSize: 40, fontWeight: 600, color: MUTED }}>Yefry Núñez</div>
        <Wordmark size={120} />
      </Reveal>
      <Reveal at={cues[1].from + 25} style={{ marginTop: 36 }}>
        <div style={{ display: "inline-block", padding: "14px 34px", borderRadius: 999, background: GRAD, color: "#fff", fontSize: 38, fontWeight: 700 }}>{url}</div>
        <div style={{ fontSize: 32, color: MUTED, marginTop: 18, fontWeight: 600 }}>{CONTACT}</div>
      </Reveal>
    </Page>
  );
};

export const SCENE_COMPONENTS: Record<string, React.FC<P>> = {
  problem: Problem,
  solution: Solution,
  demo: Demo,
  ai: HowAI,
  traction: Traction,
  close: Close,
};
