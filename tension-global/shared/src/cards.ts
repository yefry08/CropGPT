import { COUNTRY, countryName } from './countries';
import type { CardDef, CardId, CardOwner, Eff, Era, FreeOpts, Region, Side, SideRef } from './types';
import { REGION_NAME } from './types';

// ——— Constructores de efectos ———
const I = (s: SideRef, c: string, n: number): Eff => ({ k: 'inf', s, c, n });
const R = (s: SideRef, c: string, n: number): Eff => ({ k: 'rem', s, c, n });
const X = (s: SideRef, c: string): Eff => ({ k: 'rem', s, c, n: 99 });
const V = (s: SideRef, n: number): Eff => ({ k: 'vp', s, n });
const T = (n: number): Eff => ({ k: 'tension', n });
const TS = (n: number): Eff => ({ k: 'setTension', n });
const TECH = (s: SideRef): Eff => ({ k: 'tech', s });
const RISK = (n: number): Eff => ({ k: 'risk', n });
const CAP = (s: SideRef, n: number): Eff => ({ k: 'cap', s, n });
const FREE = (s: SideRef, n: number, o: FreeOpts = {}): Eff => ({ k: 'free', s, n, o });
const WAR = (c: string, vp: number): Eff => ({ k: 'war', c, vp });
const IF = (s: Side, then: Eff[], els: Eff[] = []): Eff => ({ k: 'if', s, then, else: els });

const CARDS: CardDef[] = [];
function add(
  era: Era,
  id: string,
  name: string,
  year: string | number,
  owner: CardOwner,
  ops: number,
  blurb: string,
  eff: Eff[],
  removed = false,
  kind: CardDef['kind'] = 'hist',
) {
  CARDS.push({ id, name, year: String(year), era, kind, owner, ops, blurb, eff, removed: removed || undefined });
}
const ai = (era: Era, id: string, name: string, year: string | number, owner: CardOwner, ops: number, blurb: string, eff: Eff[], removed = false) =>
  add(era, id, name, year, owner, ops, blurb, eff, removed, 'ai');
const gen = (era: Era, id: string, name: string, year: string, ops: number, blurb: string, eff: Eff[]) =>
  add(era, id, name, year, 'N', ops, blurb, eff, false, 'gen');

// ═══════════════ ERA 1 · Telón de Acero (1947–1962) ═══════════════
add(1, 'marshall', 'Plan Marshall', 1948, 'W', 3, 'Programa estadounidense de ayuda económica para reconstruir Europa occidental.', [FREE('W', 4, { region: 'EU', max: 2 })], true);
add(1, 'berlin', 'Bloqueo de Berlín', 1948, 'E', 3, 'La URSS corta el acceso terrestre a Berlín Occidental; Occidente responde con un puente aéreo.', [R('W', 'de', 2), I('E', 'dde', 1), T(-1)]);
add(1, 'otan', 'OTAN', 1949, 'W', 4, 'Se funda la alianza militar del Atlántico Norte.', [I('W', 'de', 1), I('W', 'it', 1), I('W', 'tr', 2), I('W', 'gr', 1)], true);
add(1, 'varsovia', 'Pacto de Varsovia', 1955, 'E', 3, 'Alianza militar de la URSS y sus aliados europeos.', [I('E', 'dde', 1), I('E', 'pl', 2), I('E', 'cz', 1), I('E', 'hu', 1)], true);
add(1, 'corea', 'Guerra de Corea', '1950–53', 'N', 2, 'Corea del Norte invade el sur; intervienen fuerzas de la ONU y de China.', [IF('W', [WAR('kp', 2)], [WAR('kr', 2)])]);
add(1, 'china49', 'Revolución China', 1949, 'E', 3, 'El Partido Comunista toma el poder y proclama la República Popular.', [X('W', 'cn'), I('E', 'cn', 3)], true);
add(1, 'cuba59', 'Revolución Cubana', 1959, 'E', 3, 'Un movimiento revolucionario derroca al gobierno de Batista.', [R('W', 'cu', 3), I('E', 'cu', 3)], true);
add(1, 'misiles', 'Crisis de los misiles', 1962, 'N', 3, 'Trece días de enfrentamiento por misiles soviéticos desplegados en Cuba.', [TS(2), V('me', 2)], true);
add(1, 'suez', 'Crisis de Suez', 1956, 'E', 3, 'Reino Unido, Francia e Israel intervienen en Egipto tras la nacionalización del canal.', [R('W', 'fr', 1), R('W', 'uk', 1), R('W', 'il', 1), I('E', 'eg', 2)]);
add(1, 'hungria56', 'Hungría 1956', 1956, 'E', 4, 'Un levantamiento en Budapest es reprimido por tropas soviéticas.', [X('W', 'hu'), I('E', 'hu', 2), V('W', 1)]);
add(1, 'guatemala54', 'Guatemala 1954', 1954, 'W', 2, 'Un golpe de Estado, apoyado desde el exterior, depone al presidente Árbenz.', [X('E', 'gt'), I('W', 'gt', 2)]);
add(1, 'iran53', 'Irán 1953', 1953, 'W', 2, 'Un golpe depone al primer ministro Mosaddeq y refuerza al sah.', [X('E', 'ir'), I('W', 'ir', 2)]);
add(1, 'bandung', 'Conferencia de Bandung', 1955, 'N', 2, 'Países de Asia y África se reúnen y promueven el no alineamiento.', [FREE('me', 3, { regions: ['AS', 'AF'], max: 1 })]);
add(1, 'sputnik', 'Sputnik', 1957, 'E', 2, 'La URSS pone en órbita el primer satélite artificial.', [TECH('E')], true);
add(1, 'descolonizacion', 'Descolonización', '1945–60', 'E', 4, 'Decenas de territorios de África y Asia alcanzan la independencia.', [FREE('E', 4, { regions: ['AF', 'AS'], max: 1 })]);
add(1, 'truman', 'Doctrina Truman', 1947, 'W', 1, 'EE.UU. se compromete a apoyar a gobiernos que enfrentan presiones externas.', [I('W', 'gr', 2), I('W', 'tr', 2)], true);
add(1, 'japon', 'Ocupación de Japón', '1945–52', 'W', 3, 'Japón es reconstruido bajo administración aliada y firma un tratado de seguridad.', [I('W', 'jp', 3), I('W', 'kr', 1)], true);
add(1, 'dbp', 'Dien Bien Phu', 1954, 'E', 2, 'Derrota francesa en Indochina y acuerdos de Ginebra.', [X('W', 'vn'), I('E', 'vn', 2), R('W', 'fr', 1)]);
add(1, 'grecia46', 'Guerra civil griega', '1946–49', 'E', 2, 'Enfrentamiento entre el gobierno griego y fuerzas comunistas.', [I('E', 'gr', 2), R('W', 'gr', 1)]);
add(1, 'bombasu', 'Bomba atómica soviética', 1949, 'E', 4, 'La URSS realiza su primera prueba nuclear.', [V('E', 2), T(-1)], true);

// ═══════════════ ERA 2 · Coexistencia y crisis (1962–1979) ═══════════════
add(2, 'vietnam', 'Guerra de Vietnam', '1965–73', 'N', 3, 'Intervención estadounidense en el conflicto entre Vietnam del Norte y del Sur.', [WAR('vn', 2), I('me', 'th', 1)]);
add(2, 'praga', 'Primavera de Praga', 1968, 'W', 3, 'Reformas en Checoslovaquia seguidas de la intervención del Pacto de Varsovia.', [I('W', 'cz', 1), V('W', 1), R('E', 'cz', 1)]);
add(2, 'seisdias', 'Guerra de los Seis Días', 1967, 'N', 2, 'Israel se enfrenta a Egipto, Siria y Jordania.', [IF('W', [WAR('eg', 2)], [WAR('il', 2)])]);
add(2, 'yomkipur', 'Yom Kipur y embargo', 1973, 'E', 3, 'Guerra árabe-israelí seguida de un embargo petrolero.', [I('E', 'eg', 1), I('E', 'sy', 2), V('E', 1)]);
add(2, 'chile73', 'Chile 1973', 1973, 'W', 2, 'Un golpe militar pone fin al gobierno de Allende.', [X('E', 'cl'), I('W', 'cl', 2)]);
add(2, 'salt', 'SALT I', 1972, 'N', 2, 'Primer acuerdo de limitación de armas estratégicas entre EE.UU. y la URSS.', [T(1), V('me', 1)]);
add(2, 'nixon', 'Nixon en China', 1972, 'W', 2, 'Primera visita de un presidente estadounidense a la República Popular.', [V('W', 2), I('W', 'cn', 1)], true);
add(2, 'angola75', 'Angola', 1975, 'E', 3, 'Independencia y guerra civil entre movimientos con apoyos externos.', [R('W', 'ao', 2), I('E', 'ao', 3), I('W', 'za', 1)]);
add(2, 'saigon', 'Caída de Saigón', 1975, 'E', 3, 'Las fuerzas del norte toman la capital survietnamita.', [X('W', 'vn'), I('E', 'vn', 2), V('E', 2)], true);
add(2, 'bangladesh', 'Guerra de Bangladés', 1971, 'N', 2, 'Guerra indo-pakistaní por la independencia de Pakistán Oriental.', [I('me', 'in', 2), R('foe', 'pk', 1)]);
add(2, 'watergate', 'Watergate', 1974, 'E', 2, 'El escándalo político lleva a la renuncia del presidente estadounidense.', [V('E', 2)], true);
add(2, 'apolo', 'Apolo 11', 1969, 'W', 2, 'Primera misión tripulada que llega a la superficie lunar.', [TECH('W')], true);
add(2, 'petroleo', 'Crisis del petróleo', 1973, 'E', 3, 'El aumento de precios del crudo golpea a economías industrializadas.', [R('W', 'jp', 1), R('W', 'uk', 1), I('E', 'ly', 2)]);
add(2, 'sandinista', 'Revolución Sandinista', 1979, 'E', 3, 'El Frente Sandinista derroca al gobierno de Somoza.', [X('W', 'ni'), I('E', 'ni', 3)], true);
add(2, 'iran79', 'Revolución Iraní', 1979, 'E', 3, 'La monarquía cae y se establece la República Islámica.', [X('W', 'ir'), I('E', 'ir', 2)], true);
add(2, 'campdavid', 'Acuerdos de Camp David', 1978, 'W', 2, 'Egipto e Israel negocian un marco de paz con mediación estadounidense.', [I('W', 'eg', 2), R('E', 'eg', 2), V('W', 1)], true);
add(2, 'condor', 'Operación Cóndor', '1975–83', 'W', 3, 'Coordinación de servicios de seguridad de varios gobiernos del Cono Sur.', [I('W', 'ar', 2), I('W', 'bo', 1), I('W', 'cl', 1), R('E', 'bo', 1)]);
add(2, 'dom65', 'Intervención en Rep. Dominicana', 1965, 'W', 2, 'EE.UU. despliega tropas durante la guerra civil dominicana.', [X('E', 'do'), I('W', 'do', 3)]);
add(2, 'ogaden', 'Guerra del Ogadén', '1977–78', 'E', 2, 'Etiopía y Somalia combaten con apoyo soviético y cubano al bando etíope.', [X('W', 'et'), I('E', 'et', 2)]);

// ═══════════════ ERA 3 · Ocaso de la Guerra Fría (1979–1991) ═══════════════
add(3, 'afg79', 'Afganistán 1979', 1979, 'E', 3, 'La URSS interviene militarmente en Afganistán.', [X('W', 'af'), I('E', 'af', 2), T(-1)]);
add(3, 'ciclon', 'Operación Ciclón', '1979–89', 'W', 3, 'Programa de apoyo a la resistencia afgana.', [R('E', 'af', 3), I('W', 'pk', 2), I('W', 'af', 1)]);
add(3, 'iranirak', 'Guerra Irán–Irak', '1980–88', 'N', 2, 'Largo conflicto entre dos grandes productores de petróleo.', [IF('W', [WAR('ir', 2)], [WAR('iq', 2)])]);
add(3, 'malvinas', 'Guerra de las Malvinas', 1982, 'W', 2, 'Argentina y el Reino Unido combaten por el control de las islas.', [R('E', 'ar', 2), I('W', 'uk', 1), V('W', 1)]);
add(3, 'solidaridad', 'Solidaridad', 1980, 'W', 2, 'Surge el primer sindicato independiente del bloque soviético.', [I('W', 'pl', 3)], true);
add(3, 'ide', 'Iniciativa de Defensa Estratégica', 1983, 'W', 4, 'Programa estadounidense de defensa antimisiles y tecnología avanzada.', [TECH('W'), V('W', 1)], true);
add(3, 'ablearcher', 'Able Archer 83', 1983, 'N', 4, 'Un ejercicio de la OTAN es interpretado por Moscú como posible preparativo bélico.', [T(-1), V('me', 1)], true);
add(3, 'chernobil', 'Chernóbil', 1986, 'W', 2, 'El accidente nuclear tiene consecuencias políticas y económicas en la URSS.', [R('E', 'pl', 1), R('E', 'hu', 1), V('W', 1)], true);
add(3, 'perestroika', 'Perestroika', 1985, 'E', 4, 'Reformas económicas y de apertura política en la URSS.', [T(1), V('E', 2)], true);
add(3, 'panama89', 'Panamá 1989', 1989, 'W', 2, 'EE.UU. interviene militarmente en Panamá.', [X('E', 'pa'), I('W', 'pa', 3)], true);
add(3, 'contras', 'Contras', '1981–90', 'W', 3, 'Conflicto interno en Nicaragua con apoyo externo a los distintos bandos.', [R('E', 'ni', 3), I('W', 'ni', 1), I('W', 'gt', 1)]);
add(3, 'muro', 'Caída del Muro de Berlín', 1989, 'W', 3, 'Se abren las fronteras entre las dos Alemanias.', [I('W', 'dde', 3), R('E', 'dde', 2), V('W', 1)], true);
add(3, 'rev89', 'Revoluciones de 1989', 1989, 'W', 3, 'Cambios políticos en Polonia, Hungría, Checoslovaquia y Rumanía.', [R('E', 'pl', 1), R('E', 'hu', 1), R('E', 'cz', 1), R('E', 'ro', 1), I('W', 'cz', 1), I('W', 'hu', 1)], true);
add(3, 'apartheid', 'Fin del apartheid', '1990–94', 'N', 2, 'Sudáfrica desmantela el sistema de segregación legal.', [IF('W', [I('W', 'za', 2), R('E', 'za', 1)], [I('E', 'za', 2), R('W', 'za', 1)])]);
add(3, 'tiananmen', 'Tiananmén', 1989, 'W', 3, 'Protestas en Pekín terminan con una intervención militar.', [R('E', 'cn', 1), V('W', 2)]);
add(3, 'reagan', 'Doctrina Reagan', 1985, 'W', 4, 'Apoyo a movimientos y gobiernos opuestos a la influencia soviética.', [FREE('W', 4, { regions: ['AF', 'AS', 'AM'], max: 2 })], true);
add(3, 'libano82', 'Líbano 1982', 1982, 'N', 2, 'Invasión israelí y presencia de fuerzas multinacionales en el Líbano.', [R('foe', 'lb', 2), I('me', 'lb', 1)]);

// ═══════════════ ERA 4 · Momento unipolar (1991–2008) ═══════════════
add(4, 'golfo91', 'Guerra del Golfo', '1990–91', 'W', 3, 'Una coalición liderada por EE.UU. expulsa a Irak de Kuwait.', [X('E', 'iq'), I('W', 'iq', 1), I('W', 'sa', 1), V('W', 1)], true);
add(4, 'yugoslavia', 'Guerras de Yugoslavia', '1991–95', 'N', 3, 'La disolución de Yugoslavia desemboca en varios conflictos armados.', [IF('W', [R('E', 'yu', 2), I('W', 'yu', 2)], [R('W', 'yu', 2), I('E', 'yu', 2)])]);
add(4, 'kosovo', 'Kosovo', 1999, 'W', 3, 'Campaña aérea de la OTAN durante el conflicto en Kosovo.', [R('E', 'yu', 2), V('W', 1)]);
add(4, 'congo', 'Guerras del Congo', '1996–2003', 'N', 3, 'Conflictos regionales tras el genocidio de Ruanda.', [WAR('cg', 2)]);
add(4, 'otan99', 'Ampliación de la OTAN', '1999–2004', 'W', 3, 'Países de Europa central y oriental ingresan en la alianza.', [I('W', 'pl', 2), I('W', 'cz', 1), I('W', 'hu', 1), I('W', 'ro', 1)], true);
add(4, 'once_s', '11-S y guerra contra el terrorismo', 2001, 'W', 3, 'Tras los atentados en EE.UU. se lanzan operaciones en Asia Central.', [I('W', 'af', 2), I('W', 'pk', 1), I('W', 'kz', 1)], true);
add(4, 'irak03', 'Irak 2003', 2003, 'W', 3, 'Una coalición invade Irak y derroca a su gobierno.', [X('E', 'iq'), I('W', 'iq', 2), T(-1)], true);
add(4, 'bolivariana', 'Revolución Bolivariana', '1999–', 'E', 3, 'Venezuela inicia un proyecto político con alianzas en América Latina.', [X('W', 've'), I('E', 've', 2), I('E', 'bo', 1), I('E', 'cu', 1)]);
add(4, 'chinaascenso', 'Ascenso de China', '2000–', 'E', 3, 'Crecimiento económico y mayor presencia internacional de China.', [I('E', 'cn', 2), I('E', 'kz', 1), TECH('E')]);
add(4, 'colores', 'Revoluciones de colores', '2003–05', 'W', 3, 'Cambios de gobierno tras protestas en Georgia, Ucrania y otros países.', [R('E', 'ge', 2), R('E', 'ua', 2), I('W', 'ge', 2), I('W', 'ua', 2)]);
add(4, 'georgia08', 'Georgia 2008', 2008, 'E', 2, 'Conflicto armado entre Georgia y Rusia por Osetia del Sur y Abjasia.', [R('W', 'ge', 2), I('E', 'ge', 1), V('E', 1)]);
add(4, 'internet', 'Internet global', '1990s', 'N', 3, 'La red mundial se masifica y cambia la economía y la política.', [TECH('me'), CAP('me', 1), RISK(1)]);
add(4, 'crisis08', 'Crisis financiera de 2008', 2008, 'E', 3, 'La crisis bancaria afecta a las economías avanzadas.', [R('W', 'uk', 1), R('W', 'es', 1), R('W', 'fr', 1), V('E', 1)]);
add(4, 'washington', 'Consenso de Washington', '1989–2000', 'W', 3, 'Conjunto de reformas económicas promovidas en América Latina.', [FREE('W', 4, { region: 'AM', max: 2 })]);
add(4, 'marearosa', 'Marea rosa', '1998–2015', 'E', 3, 'Gobiernos de izquierda llegan al poder en varios países latinoamericanos.', [FREE('E', 4, { region: 'AM', max: 2 })]);
add(4, 'nk06', 'Prueba nuclear norcoreana', 2006, 'E', 2, 'Corea del Norte realiza su primera prueba de un dispositivo nuclear.', [T(-1), I('E', 'kp', 2), R('W', 'kr', 1), V('E', 1)]);
add(4, 'munich07', 'Discurso de Múnich', 2007, 'E', 2, 'Rusia critica públicamente el orden de seguridad posterior a la Guerra Fría.', [R('W', 'de', 1), R('W', 'pl', 1), V('E', 1)]);

// ═══════════════ ERA 5 · Orden multipolar (2008–2026) ═══════════════
add(5, 'primavera', 'Primavera Árabe', '2011', 'N', 3, 'Oleada de protestas y cambios políticos en el norte de África y Oriente Medio.', [FREE('me', 3, { region: 'ME', max: 1 }), R('foe', 'eg', 1)]);
add(5, 'libia11', 'Libia 2011', 2011, 'W', 3, 'Una intervención internacional acompaña la caída del gobierno libio.', [R('E', 'ly', 3), I('W', 'ly', 1)]);
add(5, 'siria', 'Guerra civil siria', '2011–', 'N', 3, 'Conflicto con múltiples actores locales y extranjeros.', [WAR('sy', 2), I('me', 'lb', 1)]);
add(5, 'crimea', 'Crimea 2014', 2014, 'E', 3, 'Rusia incorpora Crimea; la mayoría de los Estados no reconoce la anexión.', [I('E', 'ua', 2), R('W', 'ua', 2), V('E', 1)]);
add(5, 'ucrania22', 'Ucrania 2022', 2022, 'N', 4, 'Rusia lanza una invasión a gran escala de Ucrania.', [IF('W', [R('E', 'ua', 2), I('W', 'ua', 3), I('W', 'pl', 1)], [R('W', 'ua', 2), I('E', 'ua', 3), V('E', 1)])]);
add(5, 'finlandia', 'Finlandia y Suecia en la OTAN', '2023–24', 'W', 2, 'Dos países nórdicos abandonan su neutralidad militar y se suman a la alianza.', [I('W', 'fi', 3), R('E', 'fi', 2)], true);
add(5, 'franja', 'Franja y la Ruta', '2013–', 'E', 3, 'Iniciativa china de infraestructura y financiación en decenas de países.', [FREE('E', 4, { regions: ['AS', 'AF'], max: 2 })]);
add(5, 'gaza23', 'Gaza 2023', 2023, 'N', 3, 'Una escalada armada en Gaza tiene repercusiones regionales y diplomáticas.', [IF('W', [I('W', 'il', 1), I('W', 'jo', 1), I('W', 'eg', 1)], [R('W', 'jo', 1), I('E', 'lb', 1), I('E', 'sy', 1)]), T(-1)]);
add(5, 'taiwan', 'Estrecho de Taiwán', '2022–', 'N', 3, 'Aumentan los ejercicios militares y las visitas políticas en torno a Taiwán.', [IF('W', [I('W', 'tw', 2), I('W', 'jp', 1)], [R('W', 'tw', 2), I('E', 'cn', 1)]), T(-1)]);
add(5, 'chips', 'Guerra de los chips', '2018–', 'N', 3, 'Aranceles y restricciones comerciales sobre semiconductores.', [IF('W', [I('W', 'tw', 2), CAP('W', 1)], [I('E', 'cn', 1), CAP('E', 1)])]);
add(5, 'sahelgolpes', 'Golpes en el Sahel', '2020–23', 'E', 3, 'Cambios de gobierno por la vía militar en varios países del Sahel.', [R('W', 'sahel', 2), I('E', 'sahel', 3)]);
add(5, 'vacunas', 'Diplomacia de vacunas', 2021, 'N', 2, 'Los Estados donan y venden vacunas contra la COVID-19 a otros países.', [FREE('me', 3, { regions: ['AF', 'AM', 'AS'], max: 1 })]);
add(5, 'sudan23', 'Sudán 2023', 2023, 'N', 3, 'Estalla un conflicto armado entre las fuerzas militares y paramilitares sudanesas.', [WAR('sd', 1)]);
add(5, 'abraham', 'Acuerdos de Abraham', 2020, 'W', 3, 'Normalización de relaciones entre Israel y varios Estados árabes.', [I('W', 'ae', 2), I('W', 'ma', 1), I('W', 'sd', 1), I('W', 'il', 1)], true);
add(5, 'doce_dias', 'Guerra de los 12 días', 2025, 'N', 4, 'Un intercambio militar de doce días entre Israel e Irán, con ataques a instalaciones nucleares.', [IF('W', [R('E', 'ir', 2)], [R('W', 'il', 1), I('E', 'ir', 1)]), T(-1)]);
add(5, 'brics', 'BRICS ampliado', '2024', 'E', 3, 'El grupo incorpora a nuevos miembros y socios.', [I('E', 'ir', 1), I('E', 'eg', 1), I('E', 'et', 1), I('E', 'ae', 1), I('E', 'br', 1)], true);
add(5, 'indpak25', 'India–Pakistán 2025', 2025, 'N', 2, 'Enfrentamiento militar de pocos días entre dos potencias nucleares.', [IF('W', [I('W', 'in', 2), R('E', 'in', 1)], [I('E', 'pk', 2), R('W', 'pk', 1)]), T(-1)]);
add(5, 'venezuela', 'Crisis venezolana', '2013–', 'N', 2, 'Tensión política, sanciones y migración en Venezuela.', [IF('W', [R('E', 've', 2), I('W', 've', 1)], [R('W', 've', 2), I('E', 've', 1)])]);
add(5, 'aukus', 'AUKUS y el Quad', '2021', 'W', 3, 'Cooperación de seguridad entre EE.UU., Japón, India, Australia y el Reino Unido.', [I('W', 'jp', 1), I('W', 'in', 1), I('W', 'ph', 1), R('E', 'ph', 1)], true);

// ═══════════════ Carrera de IA ═══════════════
ai(1, 'turing', 'Test de Turing', 1950, 'N', 1, 'Alan Turing propone una prueba para valorar si una máquina puede imitar a un humano.', [CAP('me', 1)]);
ai(1, 'dartmouth', 'Conferencia de Dartmouth', 1956, 'N', 2, 'Se acuña el término «inteligencia artificial» como campo de investigación.', [CAP('me', 1), V('me', 1)]);
ai(2, 'inviernos', 'Inviernos de la IA', '1974/1987', 'N', 2, 'Recortes de financiación tras expectativas incumplidas en la investigación de IA.', [CAP('W', -1), CAP('E', -1), RISK(-1)]);
ai(4, 'deepblue', 'Deep Blue vence a Kaspárov', 1997, 'W', 3, 'Un ordenador de IBM gana una partida de ajedrez al campeón mundial.', [CAP('W', 1), V('W', 1), RISK(1)]);
ai(5, 'alexnet', 'AlexNet e ImageNet', 2012, 'N', 3, 'Una red neuronal profunda revoluciona el reconocimiento de imágenes.', [CAP('me', 1), RISK(1)]);
ai(5, 'alphago', 'AlphaGo', 2016, 'W', 3, 'Un programa de DeepMind vence al campeón de Go Lee Sedol en Seúl.', [CAP('W', 1), V('W', 1), I('W', 'kr', 1), RISK(1)]);
ai(5, 'vigilancia', 'Vigilancia algorítmica', 2017, 'N', 3, 'Se extienden sistemas de reconocimiento facial y análisis de datos a gran escala.', [FREE('me', 2, { max: 1 }), RISK(1)]);
ai(5, 'chatgpt', 'ChatGPT', 2022, 'W', 3, 'Se lanza un asistente conversacional de uso masivo basado en modelos de lenguaje.', [CAP('W', 1), V('W', 1), RISK(2)]);
ai(5, 'chipsexp', 'Controles de exportación de chips', 2022, 'W', 3, 'EE.UU. restringe la venta de semiconductores avanzados a China.', [CAP('E', -1), I('W', 'tw', 1), I('W', 'kr', 1)]);
ai(5, 'drones', 'Drones autónomos en Ucrania', 2023, 'N', 3, 'Se generaliza el uso de drones con funciones autónomas en el campo de batalla.', [CAP('me', 1), RISK(1)]);
ai(5, 'bletchley', 'Cumbre de Seguridad de IA de Bletchley', 2023, 'N', 2, 'Veintiocho países firman una declaración sobre los riesgos de la IA de frontera.', [RISK(-2), V('me', 1)]);
ai(5, 'euia', 'Ley de IA de la UE', 2024, 'W', 2, 'La Unión Europea aprueba un reglamento por niveles de riesgo para la IA.', [RISK(-2), I('W', 'de', 1), I('W', 'fr', 1)]);
ai(5, 'deepfakes', 'Deepfakes electorales', 2024, 'N', 3, 'Contenido sintético se usa para influir en campañas electorales.', [FREE('me', 2, { mode: 'remove', max: 1 }), RISK(1)]);
ai(5, 'deepseek', 'DeepSeek', 2025, 'E', 3, 'Un laboratorio chino publica modelos de alto rendimiento con menor coste declarado.', [CAP('E', 1), V('E', 1), RISK(1)]);
ai(5, 'stargate', 'Proyecto Stargate', 2025, 'W', 4, 'Anuncio de una gran inversión estadounidense en infraestructura de IA.', [CAP('W', 2), V('W', 1), RISK(2)]);
ai(5, 'datacenters', 'Centros de datos y energía', 2025, 'N', 3, 'El consumo eléctrico de la IA impulsa acuerdos energéticos y nuevos centros de datos.', [CAP('me', 1), I('me', 'sa', 1), I('me', 'ae', 1), RISK(1)]);
ai(5, 'institutos', 'Red de institutos de seguridad de IA', 2024, 'N', 2, 'Varios países crean una red de institutos que evalúan modelos avanzados.', [RISK(-2), T(1)]);
gen(4, 'talento', 'Talento de IA y fuga de cerebros', '2000–', 2, 'Investigadores e ingenieros se desplazan hacia los centros tecnológicos.', [CAP('me', 1), FREE('me', 2, { max: 1 })]);

// ═══════════════ Genéricas reciclables ═══════════════
gen(1, 'ayuda', 'Ayuda militar', '—', 3, 'Suministro de armas y equipo a gobiernos aliados.', [FREE('me', 2, { own: true, max: 2 })]);
gen(1, 'propaganda', 'Propaganda', '—', 2, 'Campañas de información dirigidas a opinión pública extranjera.', [FREE('me', 2, { mode: 'remove', max: 1 })]);
gen(1, 'espionaje', 'Red de espionaje', '—', 2, 'Operaciones de inteligencia que debilitan a los servicios rivales.', [FREE('me', 3, { mode: 'remove', max: 1 })]);
gen(1, 'cumbre', 'Cumbre diplomática', '—', 1, 'Reunión de alto nivel que reduce las tensiones.', [T(1)]);
gen(1, 'asesores', 'Asesores militares', '—', 2, 'Envío de personal técnico a países donde ya hay presencia.', [FREE('me', 3, { own: true, max: 1 })]);

// ═══════════════ Puntuación ═══════════════
const scoreCard = (era: Era, id: string, region: Region) =>
  CARDS.push({
    id,
    name: `Puntuación: ${REGION_NAME[region]}`,
    year: '—',
    era,
    kind: 'score',
    owner: 'N',
    ops: 0,
    blurb: `Se evalúa la situación de ${REGION_NAME[region]} (Presencia, Dominio o Control).`,
    eff: [],
    region,
  });
scoreCard(1, 'score_eu', 'EU');
scoreCard(1, 'score_as', 'AS');
scoreCard(1, 'score_me', 'ME');
scoreCard(2, 'score_af', 'AF');
scoreCard(2, 'score_am', 'AM');

export const ALL_CARDS: CardDef[] = CARDS;
export const CARD: Record<CardId, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// ——— Texto de efectos (generado desde los datos para que nunca discrepe de la mecánica) ———
export function describeEffects(card: CardDef, era: Era = 5): string[] {
  if (card.kind === 'score' && card.region) return [`Puntúa ${REGION_NAME[card.region]} ahora.`];
  const ownerName = (s: SideRef): string => {
    if (s === 'W') return 'Occidente';
    if (s === 'E') return 'el Bloque Oriental';
    if (card.owner === 'N') return s === 'me' ? 'quien juega la carta' : 'su rival';
    const mine: Side = card.owner;
    const side: Side = s === 'me' ? mine : mine === 'W' ? 'E' : 'W';
    return side === 'W' ? 'Occidente' : 'el Bloque Oriental';
  };
  const sideAdj = (s: SideRef): string => {
    const n = ownerName(s);
    return n === 'Occidente' ? 'occidental' : n === 'el Bloque Oriental' ? 'oriental' : n === 'su rival' ? 'rival' : 'propia';
  };
  const cn = (c: string) => countryName(c, era);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const out: string[] = [];
  const walk = (effs: Eff[], into: string[]) => {
    for (const e of effs) {
      switch (e.k) {
        case 'inf':
          into.push(`+${e.n} de influencia ${sideAdj(e.s)} en ${cn(e.c)}.`);
          break;
        case 'rem':
          into.push(
            e.n >= 99
              ? `Elimina toda la influencia ${sideAdj(e.s)} en ${cn(e.c)}.`
              : `−${e.n} de influencia ${sideAdj(e.s)} en ${cn(e.c)}.`,
          );
          break;
        case 'vp':
          into.push(e.n >= 0 ? `${cap(ownerName(e.s))} gana ${e.n} PV.` : `${cap(ownerName(e.s))} pierde ${-e.n} PV.`);
          break;
        case 'tension':
          into.push(e.n < 0 ? `La Tensión baja ${-e.n}.` : `La Tensión sube ${e.n}.`);
          break;
        case 'setTension':
          into.push(`La Tensión baja a ${e.n}.`);
          break;
        case 'tech':
          into.push(`${cap(ownerName(e.s))} avanza un hito en la carrera tecnológica.`);
          break;
        case 'risk':
          into.push(`Riesgo de IA ${e.n > 0 ? '+' : '−'}${Math.abs(e.n)} (activo desde la era 4).`);
          break;
        case 'cap':
          into.push(`Capacidad de IA de ${ownerName(e.s)} ${e.n > 0 ? '+' : '−'}${Math.abs(e.n)}.`);
          break;
        case 'free': {
          const regs = e.o.regions ?? (e.o.region ? [e.o.region] : null);
          const where = regs ? `en ${regs.map((r) => REGION_NAME[r]).join(' / ')}` : 'en cualquier país';
          const mx = e.o.max ? ` (máx. ${e.o.max} por país)` : '';
          if (e.o.mode === 'remove')
            into.push(`${cap(ownerName(e.s))} quita ${e.n} de influencia rival ${where}${mx}.`);
          else
            into.push(
              `${cap(ownerName(e.s))} coloca ${e.n} de influencia ${where}${e.o.own ? ', solo donde ya tenga presencia' : ''}${mx}.`,
            );
          break;
        }
        case 'war':
          into.push(
            `Guerra en ${cn(e.c)}: 1d6 − 1 por cada vecino controlado por el rival; con 4+ gana ${e.vp} PV y sustituye la influencia rival.`,
          );
          break;
        case 'if': {
          const a: string[] = [];
          const b: string[] = [];
          walk(e.then, a);
          walk(e.else, b);
          const nm = e.s === 'W' ? 'Occidente' : 'el Bloque Oriental';
          const nm2 = e.s === 'W' ? 'el Bloque Oriental' : 'Occidente';
          if (a.length) into.push(`Si lo juega ${nm}: ${a.join(' ')}`);
          if (b.length) into.push(`Si lo juega ${nm2}: ${b.join(' ')}`);
          break;
        }
      }
    }
  };
  walk(card.eff, out);
  if (card.removed) out.push('Se retira del juego tras activarse.');
  // «Alem. Or.» + punto final → un solo punto
  return out.map((l) => l.replace(/\.\.(?!\.)/g, '.'));
}

/** ¿Tiene el evento algún efecto sobre la Tensión que podría bajarla? */
export function lowersTension(card: CardDef): boolean {
  const scan = (effs: Eff[]): boolean =>
    effs.some((e) => (e.k === 'tension' && e.n < 0) || (e.k === 'setTension') || (e.k === 'if' && (scan(e.then) || scan(e.else))));
  return scan(card.eff);
}

// Comprobación estática de ids de país (solo en pruebas/desarrollo).
export function validateCards(): string[] {
  const errs: string[] = [];
  const check = (id: string, where: string) => {
    if (!COUNTRY[id]) errs.push(`${where}: país desconocido ${id}`);
  };
  const walk = (effs: Eff[], where: string) => {
    for (const e of effs) {
      if (e.k === 'inf' || e.k === 'rem' || e.k === 'war') check(e.c, where);
      if (e.k === 'if') {
        walk(e.then, where);
        walk(e.else, where);
      }
    }
  };
  for (const c of CARDS) walk(c.eff, c.id);
  const ids = new Set<string>();
  for (const c of CARDS) {
    if (ids.has(c.id)) errs.push(`id duplicado ${c.id}`);
    ids.add(c.id);
  }
  return errs;
}
