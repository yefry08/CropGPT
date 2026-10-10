// Tipos centrales de Tensión Global. Todo el estado es JSON-serializable.

export type Side = 'W' | 'E'; // W = Occidente, E = Bloque Oriental
export const other = (s: Side): Side => (s === 'W' ? 'E' : 'W');
export const SIDE_NAME: Record<Side, string> = { W: 'Occidente', E: 'Bloque Oriental' };

export type Region = 'EU' | 'AS' | 'ME' | 'AF' | 'AM';
export const REGIONS: Region[] = ['EU', 'AS', 'ME', 'AF', 'AM'];
export const REGION_NAME: Record<Region, string> = {
  EU: 'Europa',
  AS: 'Asia',
  ME: 'Medio Oriente',
  AF: 'África',
  AM: 'Américas',
};

export type Era = 1 | 2 | 3 | 4 | 5;
export type CountryId = string;
export type CardId = string;

/** 'me' = quien se beneficia del evento; 'foe' = su rival. */
export type SideRef = 'me' | 'foe' | Side;

export interface FreeOpts {
  region?: Region;
  regions?: Region[];
  /** Máximo de puntos por país. */
  max?: number;
  /** add: colocar influencia propia. remove: quitar influencia rival. */
  mode?: 'add' | 'remove';
  /** Solo en países donde ya hay influencia propia. */
  own?: boolean;
}

export type Eff =
  | { k: 'inf'; s: SideRef; c: CountryId; n: number }
  | { k: 'rem'; s: SideRef; c: CountryId; n: number }
  | { k: 'vp'; s: SideRef; n: number }
  | { k: 'tension'; n: number }
  | { k: 'setTension'; n: number }
  | { k: 'tech'; s: SideRef }
  | { k: 'risk'; n: number }
  | { k: 'cap'; s: SideRef; n: number }
  | { k: 'free'; s: SideRef; n: number; o: FreeOpts }
  | { k: 'war'; c: CountryId; vp: number }
  | { k: 'if'; s: Side; then: Eff[]; else: Eff[] };

export type CardKind = 'hist' | 'ai' | 'gen' | 'score';
export type CardOwner = Side | 'N';

export interface CardDef {
  id: CardId;
  name: string;
  year: string;
  era: Era;
  kind: CardKind;
  owner: CardOwner;
  ops: number;
  blurb: string;
  eff: Eff[];
  /** El evento retira la carta del juego tras activarse. */
  removed?: boolean;
  region?: Region; // cartas de puntuación
}

export interface CountryDef {
  id: CountryId;
  name: string;
  short: string;
  region: Region;
  stab: number;
  key: boolean;
  from: Era;
  until: Era;
  /** [lon, lat] de la ficha. */
  anchor: [number, number];
  /** Códigos ISO numéricos (world-atlas) o 'n:Nombre' para polígonos sin id. */
  iso: string[];
  /** Desplazamiento de la ficha en unidades del mapa base (px a zoom 1). */
  off?: [number, number];
}

export interface Influence {
  W: number;
  E: number;
}

export type Pending =
  | { kind: 'free'; side: Side; n: number; o: FreeOpts; cardId: CardId }
  | { kind: 'ops'; side: Side; mode: 'influence' | 'coup'; ops: number; cardId: CardId };

export type LogKind =
  | 'info'
  | 'play'
  | 'event'
  | 'inf'
  | 'coup'
  | 'war'
  | 'tech'
  | 'score'
  | 'era'
  | 'tension'
  | 'ia'
  | 'over';

export interface LogEntry {
  id: number;
  turn: number;
  round: number;
  side?: Side;
  kind: LogKind;
  text: string;
  /** Texto en inglés. */
  en?: string;
  dice?: { value: number; label: string; labelEn?: string; side?: Side };
}

export interface Placement {
  c: CountryId;
  n: number;
}

export type Action =
  | { type: 'playEvent'; card: CardId }
  | { type: 'playOps'; card: CardId; kind: 'influence' | 'coup' }
  | { type: 'playTech'; card: CardId }
  | { type: 'playScore'; card: CardId }
  | { type: 'commitInfluence'; placements: Placement[] }
  | { type: 'commitCoup'; target: CountryId }
  | { type: 'skipOps' }
  | { type: 'resolveFree'; placements: Placement[] };

export interface GameState {
  v: 1;
  seed: number;
  rng: number;
  turn: number; // 1..10
  round: number; // 1..6
  era: Era;
  active: Side;
  phase: 'play' | 'over';
  winner: Side | 'draw' | null;
  endReason: string | null;
  endReasonEn?: string | null;
  /** > 0 favorece a Occidente; < 0 al Bloque Oriental. */
  vp: number;
  /** 5 (calma) → 1 (guerra nuclear). */
  tension: number;
  influence: Record<CountryId, Influence>;
  tech: Record<Side, number>;
  techTried: Record<Side, boolean>;
  cap: Record<Side, number>;
  risk: number;
  firstCoupDone: Record<Side, boolean>;
  hands: Record<Side, CardId[]>;
  deck: CardId[];
  discard: CardId[];
  removed: CardId[];
  queue: Pending[];
  log: LogEntry[];
  logSeq: number;
  ussrDissolved: boolean;
  version: number;
}

export interface RegionScoreSide {
  controlled: number;
  keyControlled: number;
  nearRival: number;
  status: 'none' | 'presence' | 'domination' | 'control';
  base: number;
  total: number;
}

export interface RegionScore {
  region: Region;
  keyTotal: number;
  total: number;
  W: RegionScoreSide;
  E: RegionScoreSide;
  /** Positivo favorece a Occidente. */
  net: number;
}
