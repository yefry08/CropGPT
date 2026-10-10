import { COUNTRY_EN } from './i18n';
import type { CountryDef, CountryId, Era, Region } from './types';

type Row = [
  id: string,
  name: string,
  short: string,
  region: Region,
  stab: number,
  key: boolean,
  anchor: [number, number],
  iso: string[],
  from?: Era,
  until?: Era,
];

// Estabilidad y países clave (*) según el diseño. iso = ids numéricos de world-atlas.
const ROWS: Row[] = [
  // ——— Europa ———
  ['uk', 'Reino Unido', 'R. Unido', 'EU', 5, false, [-2, 53.2], ['826']],
  ['fr', 'Francia', 'Francia', 'EU', 3, true, [2.5, 46.7], ['250']],
  ['de', 'Alemania Occ.', 'Alemania', 'EU', 4, true, [9.3, 50.4], ['276']],
  ['dde', 'Alemania Or.', 'Alem. Or.', 'EU', 3, true, [12.9, 52.4], [], 1, 3],
  ['pl', 'Polonia', 'Polonia', 'EU', 3, true, [19.4, 52.0], ['616']],
  ['cz', 'Checoslovaquia', 'Checosl.', 'EU', 3, false, [17.2, 49.5], ['203', '703']],
  ['hu', 'Hungría', 'Hungría', 'EU', 3, false, [19.4, 47.1], ['348']],
  ['es', 'España', 'España', 'EU', 2, false, [-3.7, 40.0], ['724']],
  ['it', 'Italia', 'Italia', 'EU', 2, true, [12.6, 42.8], ['380']],
  ['yu', 'Yugoslavia/Serbia', 'Yugoslavia', 'EU', 3, false, [19.0, 44.2], ['688', '191', '705', '070', '807', '499', 'n:Kosovo']],
  ['ro', 'Rumanía', 'Rumanía', 'EU', 3, false, [24.9, 45.9], ['642']],
  ['gr', 'Grecia', 'Grecia', 'EU', 2, false, [22.0, 39.2], ['300']],
  ['tr', 'Turquía', 'Turquía', 'EU', 2, false, [35.0, 39.0], ['792']],
  ['fi', 'Finlandia', 'Finlandia', 'EU', 4, false, [26.0, 63.5], ['246']],
  ['ua', 'Ucrania', 'Ucrania', 'EU', 2, true, [31.5, 49.0], ['804'], 4],
  ['ge', 'Georgia', 'Georgia', 'EU', 1, false, [43.4, 42.2], ['268'], 4],
  // ——— Medio Oriente ———
  ['il', 'Israel', 'Israel', 'ME', 4, true, [35.0, 31.4], ['376']],
  ['lb', 'Líbano', 'Líbano', 'ME', 1, false, [35.9, 33.9], ['422']],
  ['sy', 'Siria', 'Siria', 'ME', 2, false, [38.3, 35.0], ['760']],
  ['jo', 'Jordania', 'Jordania', 'ME', 2, false, [36.5, 31.0], ['400']],
  ['eg', 'Egipto', 'Egipto', 'ME', 2, true, [30.0, 26.5], ['818']],
  ['ly', 'Libia', 'Libia', 'ME', 2, true, [17.5, 27.0], ['434']],
  ['iq', 'Irak', 'Irak', 'ME', 3, true, [43.5, 33.2], ['368']],
  ['ir', 'Irán', 'Irán', 'ME', 2, true, [54.0, 32.5], ['364']],
  ['sa', 'Arabia Saudí', 'A. Saudí', 'ME', 3, true, [45.0, 24.0], ['682']],
  ['ae', 'Emiratos', 'Emiratos', 'ME', 2, false, [54.3, 24.3], ['784'], 4],
  // ——— Asia ———
  ['af', 'Afganistán', 'Afganistán', 'AS', 2, false, [66.0, 34.0], ['004']],
  ['pk', 'Pakistán', 'Pakistán', 'AS', 2, true, [69.5, 29.5], ['586']],
  ['in', 'India', 'India', 'AS', 3, true, [79.0, 22.0], ['356']],
  ['cn', 'China', 'China', 'AS', 3, true, [103.0, 35.0], ['156']],
  ['kp', 'Corea del Norte', 'C. Norte', 'AS', 3, true, [127.2, 40.2], ['408']],
  ['kr', 'Corea del Sur', 'C. Sur', 'AS', 3, true, [127.9, 36.3], ['410']],
  ['jp', 'Japón', 'Japón', 'AS', 4, true, [138.0, 36.5], ['392']],
  ['tw', 'Taiwán', 'Taiwán', 'AS', 3, true, [121.0, 23.7], ['158']],
  ['vn', 'Vietnam', 'Vietnam', 'AS', 1, false, [106.0, 16.5], ['704']],
  ['th', 'Tailandia', 'Tailandia', 'AS', 2, true, [101.0, 15.5], ['764']],
  ['ph', 'Filipinas', 'Filipinas', 'AS', 2, false, [122.0, 12.5], ['608']],
  ['id', 'Indonesia', 'Indonesia', 'AS', 1, false, [115.0, -2.0], ['360']],
  ['kz', 'Kazajistán', 'Kazajistán', 'AS', 2, false, [67.0, 48.5], ['398'], 4],
  // ——— África ———
  ['ma', 'Marruecos', 'Marruecos', 'AF', 3, false, [-6.5, 32.0], ['504']],
  ['dz', 'Argelia', 'Argelia', 'AF', 2, true, [3.0, 28.0], ['012']],
  ['sahel', 'Sahel', 'Sahel', 'AF', 1, false, [1.5, 15.5], ['466', '562', '854']],
  ['ng', 'Nigeria', 'Nigeria', 'AF', 1, true, [8.1, 9.5], ['566']],
  ['sd', 'Sudán', 'Sudán', 'AF', 1, false, [29.5, 12.0], ['729', '728']],
  ['et', 'Etiopía', 'Etiopía', 'AF', 1, false, [39.5, 8.5], ['231']],
  ['cg', 'Congo', 'Congo', 'AF', 1, true, [23.5, -3.5], ['180']],
  ['ke', 'Kenia', 'Kenia', 'AF', 2, false, [37.9, 0.5], ['404']],
  ['ao', 'Angola', 'Angola', 'AF', 1, true, [17.5, -12.0], ['024']],
  ['mz', 'Mozambique', 'Mozamb.', 'AF', 1, false, [35.0, -17.5], ['508']],
  ['za', 'Sudáfrica', 'Sudáfrica', 'AF', 3, true, [24.5, -29.5], ['710']],
  // ——— Américas ———
  ['ca', 'Canadá', 'Canadá', 'AM', 4, false, [-100.0, 58.0], ['124']],
  ['mx', 'México', 'México', 'AM', 2, true, [-102.0, 23.5], ['484']],
  ['cu', 'Cuba', 'Cuba', 'AM', 3, true, [-79.5, 21.8], ['192']],
  ['do', 'Rep. Dominicana', 'Rep. Dom.', 'AM', 1, false, [-70.5, 18.9], ['214']],
  ['gt', 'Guatemala', 'Guatemala', 'AM', 1, false, [-90.4, 15.6], ['320']],
  ['ni', 'Nicaragua', 'Nicaragua', 'AM', 1, false, [-85.2, 12.9], ['558']],
  ['pa', 'Panamá', 'Panamá', 'AM', 2, true, [-80.1, 8.5], ['591']],
  ['co', 'Colombia', 'Colombia', 'AM', 1, false, [-73.0, 4.0], ['170']],
  ['ve', 'Venezuela', 'Venezuela', 'AM', 2, true, [-66.0, 7.5], ['862']],
  ['pe', 'Perú', 'Perú', 'AM', 2, false, [-75.0, -10.0], ['604']],
  ['br', 'Brasil', 'Brasil', 'AM', 2, true, [-52.0, -10.0], ['076']],
  ['bo', 'Bolivia', 'Bolivia', 'AM', 2, false, [-64.5, -17.0], ['068']],
  ['cl', 'Chile', 'Chile', 'AM', 3, true, [-71.0, -33.0], ['152']],
  ['ar', 'Argentina', 'Argentina', 'AM', 2, true, [-65.0, -34.0], ['032']],
];

export const COUNTRIES: CountryDef[] = ROWS.map(
  ([id, name, short, region, stab, key, anchor, iso, from = 1, until = 5]) => ({
    id,
    name,
    short,
    region,
    stab,
    key,
    anchor,
    iso,
    from,
    until,
  }),
);

export const COUNTRY: Record<CountryId, CountryDef> = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));

/**
 * Desplazamientos de ficha (unidades del mapa base, px a zoom 1) donde el espacio es estrecho.
 * Generado con scripts/layout-chips.ts (minimiza solapes de fichas).
 */
export const CHIP_OFFSETS: Record<CountryId, [number, number]> = {
  de: [0, -26],
  dde: [-17, -41],
  pl: [9, -9],
  hu: [40, -40],
  it: [-9, 9],
  ro: [18, 7],
  tr: [24, -24],
  ge: [9, 9],
  il: [-13, 0],
  lb: [-12, -5],
  sy: [19, 0],
  jo: [-17, 41],
  iq: [0, 13],
  ir: [9, 9],
  sa: [-9, 9],
  kr: [-9, 9],
  vn: [9, -9],
  th: [-9, 9],
  sd: [9, -9],
  do: [9, 9],
  ni: [19, 0],
  ve: [9, -9],
  ar: [-5, 12],
};

export function isActive(id: CountryId, era: Era): boolean {
  const c = COUNTRY[id];
  return !!c && era >= c.from && era <= c.until;
}

const activeCache = new Map<Era, CountryId[]>();
export function activeIds(era: Era): CountryId[] {
  let a = activeCache.get(era);
  if (!a) {
    a = COUNTRIES.filter((c) => era >= c.from && era <= c.until).map((c) => c.id);
    activeCache.set(era, a);
  }
  return a;
}

/** Nombre mostrado: Alemania Occ. pasa a ser Alemania desde 1991. */
export function countryName(id: CountryId, era: Era, lang: 'es' | 'en' = 'es'): string {
  if (id === 'de' && era >= 4) return lang === 'en' ? 'Germany' : 'Alemania';
  if (lang === 'en') return COUNTRY_EN[id]?.[0] ?? id;
  return COUNTRY[id]?.name ?? id;
}

export function countryShort(id: CountryId, era: Era, lang: 'es' | 'en' = 'es'): string {
  if (id === 'de') return era >= 4 ? (lang === 'en' ? 'Germany' : 'Alemania') : lang === 'en' ? 'W. Germany' : 'Alem. Occ.';
  if (id === 'yu') return era >= 4 ? (lang === 'en' ? 'Serbia' : 'Serbia') : 'Yugoslavia';
  if (lang === 'en') return COUNTRY_EN[id]?.[1] ?? id;
  return COUNTRY[id]?.short ?? id;
}

// Adyacencias: [a, b, desde?, hasta?]. Fronteras reales y rutas marítimas obvias;
// donde se interpone un país no jugable se anota "vía".
type Adj = [string, string, Era?, Era?];
const ADJ: Adj[] = [
  // Europa
  ['uk', 'fr'], ['uk', 'ca'], ['fr', 'de'], ['fr', 'es'], ['fr', 'it'], ['fr', 'dz'],
  ['de', 'dde', 1, 3], ['de', 'cz'], ['de', 'pl', 4], ['dde', 'pl', 1, 3], ['dde', 'cz', 1, 3],
  ['pl', 'cz'], ['pl', 'ua', 4], ['pl', 'fi'],
  ['cz', 'hu'], ['hu', 'ro'], ['hu', 'yu'], ['hu', 'ua', 4], ['ro', 'yu'], ['ro', 'ua', 4],
  ['ro', 'tr'], // vía Bulgaria / mar Negro
  ['yu', 'gr'], ['yu', 'it'], ['gr', 'tr'], ['tr', 'sy'], ['tr', 'iq'], ['tr', 'ir'],
  ['tr', 'ge', 4], ['ge', 'ua', 4], ['es', 'ma'],
  // Medio Oriente
  ['il', 'lb'], ['il', 'sy'], ['il', 'jo'], ['il', 'eg'], ['lb', 'sy'], ['sy', 'iq'], ['sy', 'jo'],
  ['jo', 'iq'], ['jo', 'sa'], ['eg', 'ly'], ['eg', 'sd'], ['ly', 'dz'], ['ly', 'sd'], ['ly', 'sahel'],
  ['iq', 'sa'], ['iq', 'ir'], ['ir', 'af'], ['ir', 'pk'], ['ir', 'ae'], ['sa', 'ae'],
  // Asia
  ['af', 'pk'], ['af', 'cn'], ['af', 'kz', 4], ['pk', 'in'], ['pk', 'cn'], ['in', 'cn'],
  ['cn', 'kp'], ['cn', 'vn'], ['cn', 'tw'], ['cn', 'kz', 4], ['kp', 'kr'], ['kr', 'jp'],
  ['jp', 'tw'], ['jp', 'ph'], ['tw', 'ph'],
  ['vn', 'th'], // vía Laos y Camboya
  ['vn', 'ph'], ['th', 'id'], ['ph', 'id'], ['kz', 'ir', 4],
  // África
  ['ma', 'dz'], ['dz', 'sahel'], ['sahel', 'ng'],
  ['ng', 'cg'], // vía Camerún
  ['cg', 'ao'], ['cg', 'sd'], ['sd', 'et'], ['sd', 'ke'], ['et', 'ke'],
  ['ke', 'mz'], // vía Tanzania
  ['mz', 'za'],
  ['ao', 'za'], // vía Namibia
  // Américas
  ['mx', 'gt'],
  ['gt', 'ni'], // vía Honduras y El Salvador
  ['ni', 'pa'], // vía Costa Rica
  ['pa', 'co'], ['co', 've'], ['co', 'pe'], ['co', 'br'], ['ve', 'br'], ['ve', 'do'], ['cu', 'do'],
  ['pe', 'br'], ['pe', 'bo'], ['pe', 'cl'], ['br', 'bo'], ['br', 'ar'], ['bo', 'cl'], ['bo', 'ar'], ['cl', 'ar'],
];

const adjCache = new Map<Era, Record<CountryId, CountryId[]>>();

export function adjacency(era: Era): Record<CountryId, CountryId[]> {
  let m = adjCache.get(era);
  if (m) return m;
  m = {};
  for (const id of activeIds(era)) m[id] = [];
  for (const [a, b, since = 1, until = 5] of ADJ) {
    if (era < since || era > until) continue;
    if (!m[a] || !m[b]) continue;
    m[a].push(b);
    m[b].push(a);
  }
  adjCache.set(era, m);
  return m;
}

export function neighborsOf(id: CountryId, era: Era): CountryId[] {
  return adjacency(era)[id] ?? [];
}

export function adjacencyPairs(era: Era): [CountryId, CountryId][] {
  const out: [CountryId, CountryId][] = [];
  const m = adjacency(era);
  for (const a of Object.keys(m)) for (const b of m[a]) if (a < b) out.push([a, b]);
  return out;
}

/** Vecinos de EE.UU. (accesibles para Occidente) y de la URSS/Rusia (para el Bloque Oriental). */
export function superpowerNeighbors(side: 'W' | 'E', era: Era): CountryId[] {
  if (side === 'W') return ['ca', 'mx', 'cu', 'jp'];
  const base = ['fi', 'pl', 'ro', 'af', 'kp', 'cn'];
  return era >= 4 ? [...base, 'ua', 'ge', 'kz'] : base;
}

const snCache = new Map<string, Set<CountryId>>();
export function isSuperNeighbor(side: 'W' | 'E', id: CountryId, era: Era): boolean {
  const key = `${side}${era >= 4 ? 4 : 1}`;
  let set = snCache.get(key);
  if (!set) {
    set = new Set(superpowerNeighbors(side, era));
    snCache.set(key, set);
  }
  return set.has(id);
}

/** Repúblicas soviéticas: se pintan como parte de la URSS hasta 1991. */
export const SOVIET_ISO = [
  '643', '804', '112', '498', '440', '428', '233', '268', '051', '031', '398', '860', '795', '417', '762',
];
export const US_ISO = '840';
export const RUSSIA_ISO = '643';
export const CHINA_ISO = '156';
