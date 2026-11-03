// «Guerra de cartas»: variante con decisiones del clásico juego de cartas «Guerra».
// Cada carta es un escenario hipotético de conflicto futuro (2027–2040). Lógica pura y determinista.
import { rand, shuffle } from './rng';

export type WarLang = 'es' | 'en';
export type Domain = 'land' | 'sea' | 'air' | 'cyber' | 'space';
export type WarPlayer = 'p1' | 'p2';
export const WAR_DOMAINS: Domain[] = ['cyber', 'space', 'air', 'land', 'sea'];
/** Ciclo de ventaja: cada dominio vence al siguiente (+2). Ciber → Espacio → Aire → Tierra → Mar → Ciber. */
export const DOMAIN_BEATS: Record<Domain, Domain> = { cyber: 'space', space: 'air', air: 'land', land: 'sea', sea: 'cyber' };
export const DOMAIN_BONUS = 2;
export const DOMAIN_NAME: Record<Domain, Record<WarLang, string>> = {
  land: { es: 'Tierra', en: 'Land' },
  sea: { es: 'Mar', en: 'Sea' },
  air: { es: 'Aire', en: 'Air' },
  cyber: { es: 'Ciber', en: 'Cyber' },
  space: { es: 'Espacio', en: 'Space' },
};
export const DOMAIN_WHY: Record<Domain, Record<WarLang, string>> = {
  cyber: { es: 'el ciberataque ciega los satélites', en: 'cyberattacks blind satellites' },
  space: { es: 'los satélites guían los ataques aéreos', en: 'satellites guide air strikes' },
  air: { es: 'el dominio aéreo aplasta a las fuerzas terrestres', en: 'air superiority crushes ground forces' },
  land: { es: 'los misiles costeros cierran el mar', en: 'coastal missiles close the sea' },
  sea: { es: 'cortar cables submarinos apaga las redes', en: 'cutting undersea cables shuts down networks' },
};

export interface WarCard {
  id: string;
  year: number;
  power: number;
  domain: Domain;
  name: Record<WarLang, string>;
  blurb: Record<WarLang, string>;
}

const C: WarCard[] = [];
const card = (id: string, domain: Domain, power: number, year: number, es: string, en: string, bes: string, ben: string) =>
  C.push({ id, domain, power, year, name: { es, en }, blurb: { es: bes, en: ben } });

// ——— Tierra ———
card('w_border', 'land', 3, 2029, 'Escaramuza fronteriza en alta montaña', 'High-mountain border skirmish', 'Patrullas rivales chocan en una frontera sin demarcar.', 'Rival patrols clash on an undemarcated border.');
card('w_blitz', 'land', 8, 2033, 'Invasión blindada relámpago', 'Armored blitz invasion', 'Columnas acorazadas cruzan una frontera en pocas horas.', 'Armored columns cross a border within hours.');
card('w_urban', 'land', 2, 2028, 'Insurgencia urbana', 'Urban insurgency', 'Milicias irregulares disputan el control de una capital.', 'Irregular militias contest control of a capital.');
card('w_water', 'land', 5, 2034, 'Guerra por el agua', 'Water war', 'Una gran presa desata un conflicto entre países río abajo y río arriba.', 'A mega-dam sparks conflict between upstream and downstream states.');
card('w_corridor', 'land', 6, 2031, 'Toma de un corredor estratégico', 'Strategic corridor seizure', 'Una franja de territorio clave para el comercio cambia de manos.', 'A strip of land vital to trade changes hands.');
card('w_peace', 'land', 4, 2030, 'Cascos azules multinacionales', 'Multinational peacekeepers', 'Una fuerza internacional se interpone entre dos ejércitos.', 'An international force deploys between two armies.');
card('w_robots', 'land', 9, 2038, 'Ofensiva de robots terrestres', 'Ground-robot offensive', 'Unidades autónomas avanzan sin soldados en primera línea.', 'Autonomous units advance with no soldiers on the front line.');
card('w_trench', 'land', 7, 2027, 'Trincheras bajo enjambres de drones', 'Drone-swarmed trench war', 'Un frente estancado donde cada movimiento es vigilado desde el aire.', 'A frozen front where every move is watched from above.');
// ——— Mar ———
card('w_strait', 'sea', 7, 2030, 'Bloqueo de un estrecho', 'Strait blockade', 'Una armada cierra un paso marítimo por el que pasa el comercio mundial.', 'A navy closes a chokepoint used by global trade.');
card('w_islands', 'sea', 5, 2029, 'Choque por islas en disputa', 'Clash over disputed islands', 'Guardacostas y buques de guerra se enfrentan junto a unos islotes.', 'Coast guards and warships face off near contested islets.');
card('w_cables', 'sea', 6, 2032, 'Guerra de cables submarinos', 'Undersea cable war', 'Cortes misteriosos aíslan a un país de internet.', 'Mysterious cuts cut a country off from the internet.');
card('w_navaldrones', 'sea', 8, 2035, 'Enjambre de drones navales', 'Naval drone swarm', 'Cientos de embarcaciones no tripuladas atacan a una flota.', 'Hundreds of uncrewed boats attack a fleet.');
card('w_piracy', 'sea', 2, 2028, 'Piratería en rutas comerciales', 'Shipping-lane piracy', 'Ataques a mercantes disparan el precio de los seguros.', 'Attacks on merchant ships send insurance costs soaring.');
card('w_arctic', 'sea', 4, 2036, 'Carrera por el Ártico', 'Arctic race', 'El deshielo abre rutas y yacimientos que varios Estados reclaman.', 'Melting ice opens routes and deposits claimed by several states.');
card('w_amphib', 'sea', 9, 2031, 'Gran desembarco anfibio', 'Major amphibious landing', 'Una operación anfibia a gran escala sobre una costa defendida.', 'A large-scale amphibious assault on a defended coast.');
card('w_convoy', 'sea', 3, 2027, 'Escolta de convoyes', 'Convoy escort', 'Buques de guerra protegen a los petroleros en una zona caliente.', 'Warships shield tankers through a hot zone.');
// ——— Aire ———
card('w_swarm', 'air', 8, 2030, 'Enjambre de drones autónomos', 'Autonomous drone swarm', 'Miles de drones baratos saturan las defensas.', 'Thousands of cheap drones saturate air defenses.');
card('w_hyper', 'air', 9, 2033, 'Ataque hipersónico', 'Hypersonic strike', 'Misiles a más de cinco veces la velocidad del sonido.', 'Missiles flying at over five times the speed of sound.');
card('w_nofly', 'air', 3, 2028, 'Zona de exclusión aérea', 'No-fly zone', 'Patrullas aéreas vigilan un cielo cerrado.', 'Air patrols police a closed sky.');
card('w_sixth', 'air', 7, 2035, 'Duelo de cazas de sexta generación', 'Sixth-generation dogfight', 'Aviones furtivos guiados por copilotos de IA.', 'Stealth jets flown alongside AI wingmen.');
card('w_airlift', 'air', 2, 2029, 'Puente aéreo humanitario', 'Humanitarian airlift', 'Aviones de carga abastecen a una ciudad sitiada.', 'Cargo planes supply a besieged city.');
card('w_shield', 'air', 6, 2032, 'Escudo antimisiles en capas', 'Layered missile shield', 'Varias capas de interceptores protegen las ciudades.', 'Several layers of interceptors protect the cities.');
card('w_infra', 'air', 5, 2031, 'Bombardeo de infraestructuras', 'Infrastructure air strikes', 'Ataques contra puentes, puertos y centrales.', 'Strikes on bridges, ports and power plants.');
card('w_recon', 'air', 4, 2027, 'Drones espía de gran altitud', 'High-altitude spy drones', 'Vigilancia permanente sobre el frente enemigo.', 'Persistent surveillance over the enemy front.');
// ——— Ciber ———
card('w_grid', 'cyber', 8, 2030, 'Apagón de la red eléctrica', 'Power-grid blackout', 'Un ataque informático deja a oscuras a millones de personas.', 'A cyberattack leaves millions in the dark.');
card('w_ransom', 'cyber', 4, 2028, 'Secuestro informático de puertos', 'Port ransomware', 'Las terminales de contenedores quedan paralizadas.', 'Container terminals grind to a halt.');
card('w_deepfake', 'cyber', 5, 2029, 'Deepfake de una declaración de guerra', 'Deepfake declaration of war', 'Un vídeo falso de un jefe de Estado desata el pánico.', 'A fake video of a head of state triggers panic.');
card('w_aiwar', 'cyber', 9, 2036, 'IA ofensiva autónoma', 'Autonomous offensive AI', 'Un sistema de IA encuentra y explota fallos más rápido que cualquier defensa.', 'An AI system finds and exploits flaws faster than any defender.');
card('w_finance', 'cyber', 6, 2031, 'Sabotaje del sistema financiero', 'Financial-system sabotage', 'Los pagos y las bolsas dejan de funcionar durante días.', 'Payments and markets stop working for days.');
card('w_disinfo', 'cyber', 3, 2027, 'Guerra de desinformación', 'Disinformation war', 'Campañas masivas dividen a la opinión pública.', 'Mass campaigns split public opinion.');
card('w_command', 'cyber', 7, 2034, 'Intrusión en el mando militar', 'Military command breach', 'Hackers se infiltran en las redes de mando y control.', 'Hackers infiltrate command-and-control networks.');
card('w_chips', 'cyber', 2, 2032, 'Robo de diseños de chips', 'Chip-design theft', 'Espionaje industrial sobre la tecnología más codiciada.', 'Industrial espionage on the most coveted technology.');
// ——— Espacio ———
card('w_asat', 'space', 8, 2031, 'Ataque antisatélite', 'Anti-satellite strike', 'Un misil destruye un satélite militar en órbita.', 'A missile destroys a military satellite in orbit.');
card('w_gps', 'space', 4, 2028, 'Interferencia masiva de GPS', 'Mass GPS jamming', 'Barcos y aviones pierden la navegación por satélite.', 'Ships and planes lose satellite navigation.');
card('w_moon', 'space', 6, 2039, 'Base lunar en disputa', 'Contested lunar base', 'Dos programas espaciales reclaman el mismo cráter con hielo.', 'Two space programs claim the same ice-rich crater.');
card('w_rockets', 'space', 3, 2033, 'Cohetes reutilizables militares', 'Military reusable rockets', 'Lanzamientos casi diarios para reponer satélites.', 'Near-daily launches to replace satellites.');
card('w_orbital', 'space', 9, 2040, 'Arma orbital de energía dirigida', 'Orbital directed-energy weapon', 'Un láser en órbita capaz de inutilizar otros satélites.', 'An orbital laser able to disable other satellites.');
card('w_constel', 'space', 5, 2030, 'Constelación de vigilancia', 'Surveillance constellation', 'Miles de satélites observan cada movimiento de tropas.', 'Thousands of satellites track every troop movement.');
card('w_kessler', 'space', 7, 2035, 'Cascada de chatarra espacial', 'Space-debris cascade', 'Una colisión en cadena vuelve inutilizable una órbita.', 'A chain of collisions makes an orbit unusable.');
card('w_asteroid', 'space', 2, 2038, 'Escolta de minería de asteroides', 'Asteroid-mining escort', 'Naves armadas protegen las primeras minas espaciales.', 'Armed craft guard the first space mines.');

export const WAR_CARDS: WarCard[] = C;
export const WAR_CARD: Record<string, WarCard> = Object.fromEntries(C.map((c) => [c.id, c]));

export const WAR_HAND = 5;
export const WAR_FACE_DOWN = 3;
export const WAR_MAX_ROUNDS = 40;

export interface WarBattle {
  round: number;
  /** Cartas jugadas boca arriba en cada choque de esta batalla (más de una si hubo «guerra»). */
  clashes: { p1: string; p2: string; s1: number; s2: number }[];
  /** Cartas puestas boca abajo en las guerras. */
  faceDown: number;
  winner: WarPlayer | 'none';
  won: number;
}

export interface WarState {
  rng: number;
  round: number;
  decks: Record<WarPlayer, string[]>;
  hands: Record<WarPlayer, string[]>;
  won: Record<WarPlayer, string[]>;
  /** Bote en juego durante una «guerra» (cartas ya comprometidas). */
  pot: string[];
  /** Jugadas de esta batalla en curso (choques previos si hay guerra). */
  clashes: WarBattle['clashes'];
  faceDown: number;
  /** Carta elegida y aún no revelada. */
  chosen: Record<WarPlayer, string | null>;
  atWar: boolean;
  phase: 'choose' | 'over';
  winner: WarPlayer | 'draw' | null;
  last: WarBattle | null;
  history: WarBattle[];
}

export const other2 = (p: WarPlayer): WarPlayer => (p === 'p1' ? 'p2' : 'p1');

export function warScore(own: string, foe: string): number {
  const a = WAR_CARD[own];
  const b = WAR_CARD[foe];
  return a.power + (DOMAIN_BEATS[a.domain] === b.domain ? DOMAIN_BONUS : 0);
}

export function warTotal(s: WarState, p: WarPlayer): number {
  return s.decks[p].length + s.hands[p].length + s.won[p].length;
}

function drawOne(s: WarState, p: WarPlayer): string | null {
  if (!s.decks[p].length && s.won[p].length) {
    s.decks[p] = shuffle(s, s.won[p]);
    s.won[p] = [];
  }
  return s.decks[p].pop() ?? null;
}

function refill(s: WarState, p: WarPlayer) {
  while (s.hands[p].length < WAR_HAND) {
    const c = drawOne(s, p);
    if (!c) break;
    s.hands[p].push(c);
  }
}

export function createWar(seed: number): WarState {
  const s: WarState = {
    rng: seed | 0,
    round: 1,
    decks: { p1: [], p2: [] },
    hands: { p1: [], p2: [] },
    won: { p1: [], p2: [] },
    pot: [],
    clashes: [],
    faceDown: 0,
    chosen: { p1: null, p2: null },
    atWar: false,
    phase: 'choose',
    winner: null,
    last: null,
    history: [],
  };
  const deck = shuffle(s, WAR_CARDS.map((c) => c.id));
  s.decks.p1 = deck.filter((_, i) => i % 2 === 0);
  s.decks.p2 = deck.filter((_, i) => i % 2 === 1);
  refill(s, 'p1');
  refill(s, 'p2');
  return s;
}

function finish(s: WarState, why?: WarPlayer) {
  s.phase = 'over';
  if (why) {
    s.winner = why;
    return;
  }
  const a = warTotal(s, 'p1');
  const b = warTotal(s, 'p2');
  s.winner = a > b ? 'p1' : b > a ? 'p2' : 'draw';
}

/** Elige carta. Cuando ambos han elegido, se resuelve el choque. Devuelve un estado nuevo. */
export function warPlay(prev: WarState, p: WarPlayer, cardId: string): WarState {
  if (prev.phase !== 'choose') throw new Error('La partida terminó');
  if (prev.chosen[p]) throw new Error('Ya elegiste carta');
  if (!prev.hands[p].includes(cardId)) throw new Error('Esa carta no está en tu mano');
  const s: WarState = structuredClone(prev);
  s.hands[p] = s.hands[p].filter((c) => c !== cardId);
  s.chosen[p] = cardId;
  if (s.chosen.p1 && s.chosen.p2) resolve(s);
  return s;
}

function resolve(s: WarState) {
  const c1 = s.chosen.p1!;
  const c2 = s.chosen.p2!;
  s.chosen = { p1: null, p2: null };
  const s1 = warScore(c1, c2);
  const s2 = warScore(c2, c1);
  s.clashes.push({ p1: c1, p2: c2, s1, s2 });
  s.pot.push(c1, c2);
  if (s1 === s2) {
    // ¡Guerra! Cada bando compromete 3 cartas boca abajo y juega otra de su mano.
    for (const p of ['p1', 'p2'] as WarPlayer[]) {
      for (let i = 0; i < WAR_FACE_DOWN; i++) {
        const c = drawOne(s, p);
        if (!c) break;
        s.pot.push(c);
        s.faceDown++;
      }
      refill(s, p);
    }
    const out1 = s.hands.p1.length === 0;
    const out2 = s.hands.p2.length === 0;
    if (out1 || out2) {
      const winner: WarPlayer | 'none' = out1 && out2 ? 'none' : out1 ? 'p2' : 'p1';
      closeBattle(s, winner);
      if (winner === 'none') finish(s);
      else finish(s, winner);
      return;
    }
    s.atWar = true;
    return;
  }
  closeBattle(s, s1 > s2 ? 'p1' : 'p2');
  refill(s, 'p1');
  refill(s, 'p2');
  if (!s.hands.p1.length || !s.hands.p2.length) finish(s, !s.hands.p1.length && !s.hands.p2.length ? undefined : s.hands.p1.length ? 'p1' : 'p2');
  else if (s.round > WAR_MAX_ROUNDS) finish(s);
}

function closeBattle(s: WarState, winner: WarPlayer | 'none') {
  const battle: WarBattle = { round: s.round, clashes: s.clashes, faceDown: s.faceDown, winner, won: s.pot.length };
  if (winner !== 'none') s.won[winner].push(...s.pot);
  else {
    // Nadie puede seguir: el bote se reparte.
    s.pot.forEach((c, i) => s.won[i % 2 ? 'p2' : 'p1'].push(c));
  }
  s.pot = [];
  s.clashes = [];
  s.faceDown = 0;
  s.atWar = false;
  s.last = battle;
  s.history.push(battle);
  s.round++;
}

// ——— IA ———
export type WarAILevel = 'easy' | 'normal';

/** Cartas que la IA no ha visto (posibles cartas del rival). No mira la mano rival. */
function unseen(s: WarState, me: WarPlayer): string[] {
  const seen = new Set<string>([...s.hands[me], ...s.won[me], ...s.decks[me]]);
  for (const b of s.history) for (const c of b.clashes) (seen.add(c.p1), seen.add(c.p2));
  for (const c of s.clashes) (seen.add(c.p1), seen.add(c.p2));
  const pool = WAR_CARDS.map((c) => c.id).filter((id) => !seen.has(id));
  return pool.length ? pool : WAR_CARDS.map((c) => c.id);
}

export function warChoose(s: WarState, me: WarPlayer, level: WarAILevel, r: () => number): string {
  const hand = s.hands[me];
  if (level === 'easy') return hand[Math.floor(r() * hand.length)];
  const foes = unseen(s, me);
  const stake = s.pot.length + 2;
  let best = hand[0];
  let bestV = -Infinity;
  for (const c of hand) {
    let win = 0;
    let tie = 0;
    for (const f of foes) {
      const a = warScore(c, f);
      const b = warScore(f, c);
      if (a > b) win++;
      else if (a === b) tie++;
    }
    const pw = win / foes.length;
    const pt = tie / foes.length;
    // Valor esperado del botín menos el coste de gastar una carta fuerte en una batalla barata.
    const v = pw * stake - (1 - pw - pt) * stake + pt * 0.5 - WAR_CARD[c].power * (s.atWar ? 0.02 : 0.12) + r() * 0.05;
    if (v > bestV) {
      bestV = v;
      best = c;
    }
  }
  return best;
}

export function warRand(s: { rng: number }): number {
  return rand(s);
}
