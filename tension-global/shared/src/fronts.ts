// «Dos Frentes»: simulación de crisis inspirada en los wargames sobre una guerra simultánea
// (Rusia contra el flanco este de la OTAN y China contra Taiwán). Escenario hipotético.
// Tú diriges a Occidente; la IA coordina los dos agresores. Lógica pura y determinista.
import { rand } from './rng';

export type FLang = 'es' | 'en';
type Bi = Record<FLang, string>;
export type Front = 'europe' | 'pacific';
export type FLevel = 'easy' | 'normal' | 'hard';
export type HybridArea = 'infra' | 'info' | 'econ';

export const F_WEEKS = 20;
export const F_LINE_MAX = 10;
export const F_AP = 3;
export const F_PLAN_MAX = 3;
export const F_RESOLVE_MAX = 3;

export interface FMember {
  id: string;
  name: Bi;
  /** 0 = rompe filas (bloquea el consenso) · 1 = dubitativo · 2 = dispuesto · 3 = firme. */
  resolve: number;
}

const MEMBERS: [string, string, string, number][] = [
  ['pl', 'Polonia', 'Poland', 3],
  ['baltic', 'Países bálticos', 'Baltic states', 3],
  ['nordic', 'Países nórdicos', 'Nordic countries', 3],
  ['uk', 'Reino Unido', 'United Kingdom', 3],
  ['fr', 'Francia', 'France', 2],
  ['de', 'Alemania', 'Germany', 2],
  ['it', 'Italia', 'Italy', 2],
  ['hu', 'Hungría', 'Hungary', 1],
];

export type FDecisionKind = 'flank' | 'sanctions';
export const F_DECISION: Record<FDecisionKind, { name: Bi; desc: Bi }> = {
  flank: {
    name: { es: 'Reforzar el flanco este', en: 'Reinforce the eastern flank' },
    desc: {
      es: 'Despliegue aliado completo: frente europeo −3, unidad +6 y disuasión (−1 presión rusa) durante 2 semanas.',
      en: 'Full allied deployment: European front −3, unity +6 and deterrence (−1 Russian pressure) for 2 weeks.',
    },
  },
  sanctions: {
    name: { es: 'Sanciones coordinadas', en: 'Coordinated sanctions' },
    desc: {
      es: 'Golpe económico conjunto: −0,5 presión media en ambos frentes durante 3 semanas, a costa de −10 resiliencia.',
      en: 'Joint economic blow: −0.5 average pressure on both fronts for 3 weeks, at a cost of −10 resilience.',
    },
  },
};

export interface FPending {
  kind: FDecisionKind;
  proposed: number;
  due: number;
}

export interface FLog {
  week: number;
  kind: 'you' | 'foe' | 'info' | 'good' | 'bad';
  text: Bi;
}

export interface FrontsState {
  rng: number;
  level: FLevel;
  week: number;
  ap: number;
  line: Record<Front, number>;
  unity: number;
  resilience: number;
  plan: number;
  focus: Front;
  members: FMember[];
  pending: FPending[];
  /** Semanas restantes de disuasión (flanco) y de sanciones. */
  deter: number;
  sanctions: number;
  /** Ataques híbridos que aún se pueden bloquear en cada área. */
  shield: Record<'infra' | 'info', number>;
  phase: 'plan' | 'over';
  result: null | 'deterrence' | 'held' | 'europe' | 'pacific' | 'unity';
  log: FLog[];
  /** Estadísticas para el informe final (las lecciones del ejercicio). */
  stats: { decisions: number; vetoes: number; delays: number[]; coalitions: number; hybrid: number; blocked: number };
  /** Último informe semanal de la IA (para destacar en pantalla). */
  report: FLog[];
}

export type FAction =
  | { t: 'decision'; kind: FDecisionKind }
  | { t: 'coalition' }
  | { t: 'pacific' }
  | { t: 'plan' }
  | { t: 'protect'; area: 'infra' | 'info' }
  | { t: 'diplomacy'; member: string }
  | { t: 'focus'; front: Front }
  | { t: 'end' };

export const F_COST: Record<Exclude<FAction['t'], 'focus' | 'end'>, number> = {
  decision: 2,
  coalition: 2,
  pacific: 2,
  plan: 2,
  protect: 1,
  diplomacy: 1,
};

const bi = (es: string, en: string): Bi => ({ es, en });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function createFronts(seed: number, level: FLevel = 'normal'): FrontsState {
  const s: FrontsState = {
    rng: seed | 0,
    level,
    week: 1,
    ap: F_AP,
    line: { europe: 1, pacific: 1 },
    unity: 70,
    resilience: 70,
    plan: 0,
    focus: 'pacific',
    members: MEMBERS.map(([id, es, en, r]) => ({ id, name: { es, en }, resolve: r })),
    pending: [],
    deter: 0,
    sanctions: 0,
    shield: { infra: 0, info: 0 },
    phase: 'plan',
    result: null,
    log: [],
    stats: { decisions: 0, vetoes: 0, delays: [], coalitions: 0, hybrid: 0, blocked: 0 },
    report: [],
  };
  s.log.push({
    week: 1,
    kind: 'info',
    text: bi(
      'Semana 1. Drones sobre aeropuertos europeos y maniobras chinas alrededor de Taiwán. Rusia concentra tropas junto al corredor de Suwałki.',
      'Week 1. Drones over European airports and Chinese drills around Taiwan. Russia masses troops near the Suwałki corridor.',
    ),
  });
  return s;
}

/** Miembros dubitativos o que rompen filas (resolución ≤ 1). */
export const hesitant = (s: FrontsState) => s.members.filter((m) => m.resolve <= 1).length;
/** Miembros firmes (resolución 3): los que se suman a una coalición de voluntarios. */
export const firm = (s: FrontsState) => s.members.filter((m) => m.resolve >= F_RESOLVE_MAX).length;
/** Semanas que tarda una decisión por consenso en aprobarse con el estado actual. */
export const decisionDelay = (s: FrontsState) => Math.max(1, 4 - s.plan + Math.floor(hesitant(s) / 2));
export const consensus = (s: FrontsState) => s.members.every((m) => m.resolve >= 1);
export const apPerWeek = (s: FrontsState) => F_AP + (s.plan >= 2 ? 1 : 0);
export const coalitionPower = (s: FrontsState) => Math.max(1, Math.floor(firm(s) / 2)) + (s.plan >= 3 ? 1 : 0);

/** Motivo por el que una acción no está permitida, o null. */
export function fBlocked(s: FrontsState, a: FAction, lang: FLang = 'es'): string | null {
  const t = (es: string, en: string) => (lang === 'en' ? en : es);
  if (s.phase !== 'plan') return t('La crisis terminó', 'The crisis is over');
  if (a.t === 'focus' || a.t === 'end') return null;
  if (s.ap < F_COST[a.t]) return t('No te quedan puntos de acción', 'Not enough action points');
  switch (a.t) {
    case 'decision':
      if (s.pending.some((p) => p.kind === a.kind)) return t('Ya está en debate', 'Already under debate');
      return null;
    case 'coalition':
      if (firm(s) < 2) return t('Hacen falta al menos 2 miembros firmes', 'At least 2 firm members are needed');
      return null;
    case 'plan':
      if (s.plan >= F_PLAN_MAX) return t('El plan conjunto ya está completo', 'The joint plan is already complete');
      return null;
    case 'diplomacy': {
      const m = s.members.find((x) => x.id === a.member);
      if (!m) return t('Miembro desconocido', 'Unknown member');
      if (m.resolve >= F_RESOLVE_MAX) return t('Ya es firme', 'Already firm');
      return null;
    }
    default:
      return null;
  }
}

function log(s: FrontsState, kind: FLog['kind'], text: Bi, report = false) {
  const e = { week: s.week, kind, text };
  s.log.push(e);
  if (report) s.report.push(e);
}

const pushLine = (s: FrontsState, f: Front, d: number) => {
  s.line[f] = clamp(s.line[f] + d, 0, F_LINE_MAX);
};

/** Aplica una acción de Occidente. Devuelve un estado nuevo. */
export function frontsAct(prev: FrontsState, a: FAction): FrontsState {
  const why = fBlocked(prev, a);
  if (why) throw new Error(why);
  const s: FrontsState = structuredClone(prev);
  if (a.t !== 'focus' && a.t !== 'end') s.ap -= F_COST[a.t];
  switch (a.t) {
    case 'focus':
      if (s.focus !== a.front) {
        s.focus = a.front;
        log(s, 'you', a.front === 'europe' ? bi('EE. UU. desplaza sus fuerzas a Europa.', 'The US shifts its forces to Europe.') : bi('EE. UU. desplaza sus fuerzas al Pacífico.', 'The US shifts its forces to the Pacific.'));
      }
      break;
    case 'decision': {
      const delay = decisionDelay(s);
      s.pending.push({ kind: a.kind, proposed: s.week, due: s.week + delay });
      log(s, 'you', bi(`Propones en el Consejo: «${F_DECISION[a.kind].name.es}». Debate previsto: ${delay} semana(s).`, `You table at the Council: “${F_DECISION[a.kind].name.en}”. Expected debate: ${delay} week(s).`));
      break;
    }
    case 'coalition': {
      const p = coalitionPower(s);
      pushLine(s, 'europe', -p);
      s.unity = clamp(s.unity - 2, 0, 100);
      s.stats.coalitions++;
      log(s, 'good', bi(`Coalición de voluntarios (${firm(s)} miembros firmes) actúa sin esperar al consenso: frente europeo −${p}. Los que quedan fuera protestan (unidad −2).`, `Coalition of the willing (${firm(s)} firm members) acts without waiting for consensus: European front −${p}. Those left out complain (unity −2).`));
      break;
    }
    case 'pacific': {
      const p = 2 + (s.plan >= 3 ? 1 : 0);
      pushLine(s, 'pacific', -p);
      log(s, 'good', bi(`Alianza regional en el Pacífico (Japón, Australia, Filipinas) escolta convoyes a Taiwán: frente del Pacífico −${p}.`, `Regional Pacific alliance (Japan, Australia, Philippines) escorts convoys to Taiwan: Pacific front −${p}.`));
      break;
    }
    case 'plan':
      s.plan++;
      log(s, 'good', bi(
        `Plan conjunto, fase ${s.plan}/${F_PLAN_MAX}: ${['', 'las decisiones se aprueban 1 semana antes', '+1 punto de acción por semana', 'coaliciones y alianzas más eficaces (+1)'][s.plan]}.`,
        `Joint plan, stage ${s.plan}/${F_PLAN_MAX}: ${['', 'decisions pass 1 week sooner', '+1 action point per week', 'coalitions and alliances more effective (+1)'][s.plan]}.`,
      ));
      break;
    case 'protect':
      s.shield[a.area] = Math.min(3, s.shield[a.area] + 2);
      s.resilience = clamp(s.resilience + 8, 0, 100);
      log(s, 'good', a.area === 'infra' ? bi('Proteges infraestructuras críticas: cables, redes eléctricas y aeropuertos (bloquea los próximos sabotajes).', 'You protect critical infrastructure: cables, power grids and airports (blocks upcoming sabotage).') : bi('Unidad contra la desinformación: verificación y respuesta rápida (bloquea las próximas campañas).', 'Counter-disinformation unit: fact-checking and rapid response (blocks upcoming campaigns).'));
      break;
    case 'diplomacy': {
      const m = s.members.find((x) => x.id === a.member)!;
      m.resolve++;
      log(s, 'good', bi(`Diplomacia con ${m.name.es}: su compromiso sube a ${m.resolve}/3.`, `Diplomacy with ${m.name.en}: its commitment rises to ${m.resolve}/3.`));
      break;
    }
    case 'end':
      endWeek(s);
      break;
  }
  return s;
}

interface Hybrid {
  id: string;
  area: HybridArea;
  name: Bi;
}
const HYBRID: Hybrid[] = [
  { id: 'cables', area: 'infra', name: bi('Corte de cables submarinos en el Báltico', 'Undersea cables cut in the Baltic') },
  { id: 'grid', area: 'infra', name: bi('Ciberataque contra la red eléctrica', 'Cyberattack on the power grid') },
  { id: 'drones', area: 'infra', name: bi('Drones sobre aeropuertos y bases', 'Drones over airports and bases') },
  { id: 'rail', area: 'infra', name: bi('Sabotaje ferroviario en rutas de suministro', 'Rail sabotage on supply routes') },
  { id: 'disinfo', area: 'info', name: bi('Campaña de desinformación', 'Disinformation campaign') },
  { id: 'deepfake', area: 'info', name: bi('Vídeo falso de un líder aliado', 'Deepfake of an allied leader') },
  { id: 'election', area: 'info', name: bi('Injerencia electoral', 'Election interference') },
  { id: 'offer', area: 'econ', name: bi('Oferta económica a cambio de neutralidad', 'Economic offer in exchange for neutrality') },
  { id: 'energy', area: 'econ', name: bi('Chantaje energético', 'Energy blackmail') },
];

const LEVEL: Record<FLevel, { press: number; hybrid: number }> = {
  easy: { press: 0.8, hybrid: 0 },
  normal: { press: 1, hybrid: 0 },
  hard: { press: 1.08, hybrid: 1 },
};

/** Miembro que la IA quiere desestabilizar: el más débil que aún no ha roto filas (para bloquear el consenso). */
function target(s: FrontsState): FMember | null {
  const live = s.members.filter((m) => m.resolve > 0);
  if (!live.length) return null;
  live.sort((a, b) => a.resolve - b.resolve || (rand(s) < 0.5 ? -1 : 1));
  return live[0];
}

function weaken(s: FrontsState, m: FMember, n: number, how: Bi) {
  m.resolve = Math.max(0, m.resolve - n);
  if (m.resolve === 0) {
    s.unity = clamp(s.unity - 8, 0, 100);
    log(s, 'bad', bi(`${how.es}: ${m.name.es} rompe filas y bloquea el consenso (unidad −8).`, `${how.en}: ${m.name.en} breaks ranks and blocks consensus (unity −8).`), true);
  } else log(s, 'bad', bi(`${how.es}: ${m.name.es} duda (compromiso ${m.resolve}/3).`, `${how.en}: ${m.name.en} wavers (commitment ${m.resolve}/3).`), true);
}

function hybridAttack(s: FrontsState) {
  // Si hay decisiones en debate, la IA prefiere atacar la cohesión política.
  const pool = s.pending.length && rand(s) < 0.6 ? HYBRID.filter((h) => h.area !== 'infra') : HYBRID;
  const h = pool[Math.floor(rand(s) * pool.length)];
  s.stats.hybrid++;
  if (h.area !== 'econ' && s.shield[h.area] > 0) {
    s.shield[h.area]--;
    s.stats.blocked++;
    log(s, 'good', bi(`${h.name.es}: neutralizado por tus defensas.`, `${h.name.en}: neutralized by your defenses.`), true);
    return;
  }
  switch (h.id) {
    case 'cables':
    case 'grid':
      s.resilience = clamp(s.resilience - 14, 0, 100);
      log(s, 'bad', bi(`${h.name.es}: resiliencia −14.`, `${h.name.en}: resilience −14.`), true);
      break;
    case 'drones':
      s.resilience = clamp(s.resilience - 8, 0, 100);
      s.unity = clamp(s.unity - 3, 0, 100);
      log(s, 'bad', bi(`${h.name.es}: resiliencia −8, unidad −3.`, `${h.name.en}: resilience −8, unity −3.`), true);
      break;
    case 'rail':
      s.resilience = clamp(s.resilience - 8, 0, 100);
      pushLine(s, 'europe', 1);
      log(s, 'bad', bi(`${h.name.es}: resiliencia −8 y frente europeo +1.`, `${h.name.en}: resilience −8 and European front +1.`), true);
      break;
    case 'deepfake':
      s.unity = clamp(s.unity - 6, 0, 100);
      log(s, 'bad', bi(`${h.name.es}: unidad −6.`, `${h.name.en}: unity −6.`), true);
      break;
    default: {
      const m = target(s);
      if (!m) break;
      const n = h.area === 'econ' && s.resilience < 40 ? 2 : 1;
      weaken(s, m, n, h.name);
      if (h.id === 'election') s.unity = clamp(s.unity - 2, 0, 100);
    }
  }
}

function resolveDecisions(s: FrontsState) {
  const due = s.pending.filter((p) => p.due <= s.week);
  s.pending = s.pending.filter((p) => p.due > s.week);
  for (const p of due) {
    const weeks = s.week - p.proposed;
    s.stats.delays.push(weeks);
    const blockers = s.members.filter((m) => m.resolve < 1);
    if (blockers.length) {
      s.stats.vetoes++;
      s.unity = clamp(s.unity - 6, 0, 100);
      log(s, 'bad', bi(
        `VETO tras ${weeks} semanas de debate: «${F_DECISION[p.kind].name.es}» bloqueada por ${blockers.map((m) => m.name.es).join(', ')} (unidad −6).`,
        `VETO after ${weeks} weeks of debate: “${F_DECISION[p.kind].name.en}” blocked by ${blockers.map((m) => m.name.en).join(', ')} (unity −6).`,
      ), true);
      continue;
    }
    s.stats.decisions++;
    if (p.kind === 'flank') {
      pushLine(s, 'europe', -3);
      s.unity = clamp(s.unity + 6, 0, 100);
      s.deter = 2;
    } else {
      s.sanctions = 3;
      s.resilience = clamp(s.resilience - 10, 0, 100);
    }
    log(s, 'good', bi(`Aprobada por unanimidad tras ${weeks} semanas: «${F_DECISION[p.kind].name.es}».`, `Unanimously approved after ${weeks} weeks: “${F_DECISION[p.kind].name.en}”.`), true);
  }
}

function pressure(s: FrontsState, f: Front): number {
  const L = LEVEL[s.level];
  let base = 0;
  if (f === 'europe') base = s.week < 3 ? 0.4 : s.week < 8 ? 1.7 : 2.4;
  else base = s.week < 4 ? 0.7 : s.week < 10 ? 1.8 : 2.5;
  base *= L.press;
  if (s.focus === f) base -= 1;
  if (f === 'europe' && s.deter > 0) base -= 1;
  if (s.sanctions > 0) base -= 0.5;
  if (s.resilience < 30) base += 0.5;
  // Parte fraccionaria → probabilidad de avanzar un punto más.
  const whole = Math.floor(Math.max(0, base));
  return whole + (rand(s) < Math.max(0, base) - whole ? 1 : 0);
}

function endWeek(s: FrontsState) {
  s.report = [];
  // 1. Ofensiva híbrida.
  const n = (s.week <= 6 ? 1 : 2) + LEVEL[s.level].hybrid;
  for (let i = 0; i < n; i++) hybridAttack(s);
  // 2. Presión militar en los dos frentes.
  for (const f of ['europe', 'pacific'] as Front[]) {
    const d = pressure(s, f);
    if (d > 0) {
      pushLine(s, f, d);
      log(s, 'foe', f === 'europe' ? bi(`Avance ruso en el Báltico: frente europeo +${d}.`, `Russian advance in the Baltic: European front +${d}.`) : bi(`China estrecha el bloqueo de Taiwán: frente del Pacífico +${d}.`, `China tightens the Taiwan blockade: Pacific front +${d}.`), true);
    }
  }
  // 3. Desgaste de la opinión pública.
  if (s.resilience < 30) {
    s.unity = clamp(s.unity - 4, 0, 100);
    log(s, 'bad', bi('Apagones y miedo: la opinión pública pide negociar (unidad −4).', 'Blackouts and fear: public opinion demands talks (unity −4).'), true);
  }
  s.resilience = clamp(s.resilience + 3, 0, 100);
  s.deter = Math.max(0, s.deter - 1);
  s.sanctions = Math.max(0, s.sanctions - 1);
  if (checkEnd(s)) return;
  // 4. Nueva semana.
  s.week++;
  s.ap = apPerWeek(s);
  resolveDecisions(s);
  if (checkEnd(s)) return;
  log(s, 'info', bi(`— Semana ${s.week} —`, `— Week ${s.week} —`));
}

function checkEnd(s: FrontsState): boolean {
  let r: FrontsState['result'] = null;
  if (s.line.europe >= F_LINE_MAX) r = 'europe';
  else if (s.line.pacific >= F_LINE_MAX) r = 'pacific';
  else if (s.unity <= 0) r = 'unity';
  else if (s.week >= F_WEEKS) r = s.line.europe <= 4 && s.line.pacific <= 4 ? 'deterrence' : 'held';
  if (!r) return false;
  s.phase = 'over';
  s.result = r;
  s.ap = 0;
  log(s, r === 'deterrence' || r === 'held' ? 'good' : 'bad', F_RESULT[r].title, true);
  return true;
}

export const fWon = (s: FrontsState) => s.result === 'deterrence' || s.result === 'held';

export const F_RESULT: Record<NonNullable<FrontsState['result']>, { title: Bi; text: Bi }> = {
  deterrence: {
    title: bi('Disuasión restablecida', 'Deterrence restored'),
    text: bi('Los dos agresores aceptan negociar: Occidente actuó a tiempo y unido.', 'Both aggressors agree to talks: the West acted in time and together.'),
  },
  held: {
    title: bi('Los frentes resisten', 'The fronts hold'),
    text: bi('Tras 20 semanas nadie ha ganado, pero ninguna línea se ha roto.', 'After 20 weeks nobody has won, but no line has broken.'),
  },
  europe: {
    title: bi('Cae el flanco este', 'The eastern flank falls'),
    text: bi('Rusia cierra el corredor de Suwałki y aísla a los países bálticos.', 'Russia closes the Suwałki corridor and cuts off the Baltic states.'),
  },
  pacific: {
    title: bi('Taiwán cae', 'Taiwan falls'),
    text: bi('El bloqueo asfixia a la isla y se rinde antes de que llegue ayuda.', 'The blockade strangles the island and it surrenders before help arrives.'),
  },
  unity: {
    title: bi('La alianza se fractura', 'The alliance fractures'),
    text: bi('Sin unidad, cada país negocia por su cuenta. La alianza ya no puede actuar.', 'Without unity, each country cuts its own deal. The alliance can no longer act.'),
  },
};

// ——— Jugador automático (para simulaciones y pruebas de equilibrio) ———
/** Estrategia sencilla y razonable: plan conjunto pronto, coaliciones, diplomacia con el eslabón débil y el foco donde más aprieta. */
export function frontsBot(s: FrontsState): FAction {
  const want: Front = s.line.pacific + 1 >= s.line.europe ? 'pacific' : 'europe';
  if (s.focus !== want) return { t: 'focus', front: want };
  const ok = (a: FAction) => !fBlocked(s, a);
  const weakest = [...s.members].sort((a, b) => a.resolve - b.resolve)[0];
  const tries: FAction[] = [];
  if (s.line.pacific >= 6) tries.push({ t: 'pacific' });
  if (s.line.europe >= 6) tries.push({ t: 'coalition' });
  if (weakest.resolve === 0) tries.push({ t: 'diplomacy', member: weakest.id });
  if (s.plan < 2 && s.week <= 6) tries.push({ t: 'plan' });
  if (consensus(s) && hesitant(s) <= 2) tries.push({ t: 'decision', kind: 'flank' });
  if (s.resilience < 45) tries.push({ t: 'protect', area: 'infra' });
  if (weakest.resolve <= 1) tries.push({ t: 'diplomacy', member: weakest.id });
  if (s.shield.info === 0 && s.pending.length) tries.push({ t: 'protect', area: 'info' });
  tries.push(s.line.pacific > s.line.europe ? { t: 'pacific' } : { t: 'coalition' });
  tries.push({ t: 'pacific' }, { t: 'coalition' }, { t: 'decision', kind: 'sanctions' }, { t: 'protect', area: 'info' });
  for (const a of tries) if (ok(a)) return a;
  return { t: 'end' };
}

/** Jugador aleatorio (referencia: debería perder casi siempre). */
export function frontsRandom(s: FrontsState, r: () => number): FAction {
  const base: FAction[] = [
    { t: 'coalition' },
    { t: 'pacific' },
    { t: 'plan' },
    { t: 'protect', area: 'infra' },
    { t: 'protect', area: 'info' },
    { t: 'decision', kind: 'flank' },
    { t: 'decision', kind: 'sanctions' },
  ];
  const opts = [...base, ...s.members.map((m): FAction => ({ t: 'diplomacy', member: m.id }))].filter((a) => !fBlocked(s, a));
  if (!opts.length || r() < 0.15) return { t: 'end' };
  return opts[Math.floor(r() * opts.length)];
}

export function playFronts(seed: number, level: FLevel, pick: (s: FrontsState) => FAction): FrontsState {
  let s = createFronts(seed, level);
  for (let i = 0; i < 2000 && s.phase === 'plan'; i++) s = frontsAct(s, pick(s));
  return s;
}
