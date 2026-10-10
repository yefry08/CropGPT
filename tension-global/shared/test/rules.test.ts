import { describe, expect, it } from 'vitest';
import { ALL_CARDS, CARD, describeEffects, validateCards } from '../src/cards';
import { COUNTRY, adjacency, activeIds, superpowerNeighbors } from '../src/countries';
import { GameError, applyAction, createGame } from '../src/engine';
import {
  accessible,
  controller,
  coupBlockedReason,
  coupTargets,
  placementCost,
  scoreRegion,
  simulatePlacements,
} from '../src/rules';
import { viewFor } from '../src/view';
import { act, blank, hand, rig, setInf } from './helpers';

describe('datos', () => {
  it('las cartas referencian países existentes y no se repiten', () => {
    expect(validateCards()).toEqual([]);
  });
  it('hay unas 20 cartas históricas por era y todas generan texto', () => {
    for (const era of [1, 2, 3, 4, 5]) {
      const n = ALL_CARDS.filter((c) => c.era === era && c.kind === 'hist').length;
      expect(n).toBeGreaterThanOrEqual(17);
      expect(n).toBeLessThanOrEqual(21);
    }
    for (const c of ALL_CARDS) if (c.kind !== 'score') expect(describeEffects(c).length).toBeGreaterThan(0);
  });
  it('la lista de países cumple estabilidades y claves del diseño', () => {
    expect(COUNTRY.uk.stab).toBe(5);
    expect(COUNTRY.fr).toMatchObject({ stab: 3, key: true });
    expect(COUNTRY.dde).toMatchObject({ stab: 3, key: true, until: 3 });
    expect(COUNTRY.ua).toMatchObject({ stab: 2, key: true, from: 4 });
    expect(COUNTRY.ge).toMatchObject({ stab: 1, key: false, from: 4 });
    expect(COUNTRY.sahel.iso).toEqual(['466', '562', '854']);
    expect(COUNTRY.cz.iso).toEqual(['203', '703']);
    expect(activeIds(1)).toHaveLength(60);
    expect(activeIds(4)).toHaveLength(63);
  });
  it('adyacencias simétricas y las rutas marítimas indicadas existen', () => {
    for (const era of [1, 4] as const) {
      const adj = adjacency(era);
      for (const a in adj) for (const b of adj[a]) expect(adj[b]).toContain(a);
    }
    const a1 = adjacency(1);
    for (const [x, y] of [['uk', 'ca'], ['cu', 'do'], ['do', 've'], ['es', 'ma'], ['fr', 'dz']]) expect(a1[x]).toContain(y);
    expect(superpowerNeighbors('W', 1)).toEqual(['ca', 'mx', 'cu', 'jp']);
    expect(superpowerNeighbors('E', 1)).toEqual(['fi', 'pl', 'ro', 'af', 'kp', 'cn']);
    expect(superpowerNeighbors('E', 4)).toEqual(expect.arrayContaining(['ua', 'ge', 'kz']));
  });
});

describe('control', () => {
  it('exige influencia ≥ estabilidad y ventaja ≥ estabilidad', () => {
    const s = blank();
    setInf(s, 'fr', 3, 0); // estabilidad 3
    expect(controller(s, 'fr')).toBe('W');
    setInf(s, 'fr', 4, 2); // ventaja 2 < 3
    expect(controller(s, 'fr')).toBeNull();
    setInf(s, 'fr', 5, 2);
    expect(controller(s, 'fr')).toBe('W');
    setInf(s, 'fr', 2, 0); // menos que la estabilidad
    expect(controller(s, 'fr')).toBeNull();
    setInf(s, 'fr', 0, 3);
    expect(controller(s, 'fr')).toBe('E');
  });
});

describe('influencia', () => {
  it('cuesta 2 en países controlados por el rival y 1 en el resto', () => {
    const s = blank();
    setInf(s, 'pl', 0, 3);
    expect(placementCost(s, 'W', 'pl')).toBe(2);
    expect(placementCost(s, 'E', 'pl')).toBe(1);
  });
  it('accesible: propia presencia, vecinos de ella o vecinos de tu superpotencia', () => {
    const s = blank();
    expect(accessible(s, 'W', 'ca')).toBe(true); // vecino de EE.UU.
    expect(accessible(s, 'E', 'ca')).toBe(false);
    expect(accessible(s, 'E', 'cn')).toBe(true); // vecino de la URSS
    expect(accessible(s, 'W', 'es')).toBe(false);
    setInf(s, 'fr', 1, 0);
    expect(accessible(s, 'W', 'es')).toBe(true); // vecino de Francia
    expect(accessible(s, 'W', 'dz')).toBe(true);
    expect(accessible(s, 'W', 'ma')).toBe(false);
  });
  it('las colocaciones encadenadas abren vecinos y respetan los puntos', () => {
    const s = blank();
    setInf(s, 'ca', 1, 0);
    // ca → uk (vecino) → fr (vecino de uk)
    const ok = simulatePlacements(s, 'W', 3, [{ c: 'uk', n: 1 }, { c: 'fr', n: 1 }, { c: 'es', n: 1 }]);
    expect(ok.error).toBeNull();
    expect(ok.spent).toBe(3);
    expect(simulatePlacements(s, 'W', 2, [{ c: 'uk', n: 1 }, { c: 'fr', n: 1 }, { c: 'es', n: 1 }]).error).toMatch(/puntos/);
    expect(simulatePlacements(s, 'W', 3, [{ c: 'es', n: 1 }]).error).toMatch(/accesible/);
  });
  it('commitInfluence aplica el coste doble y descuenta de las operaciones', () => {
    const s = blank();
    setInf(s, 'pl', 0, 3);
    setInf(s, 'de', 1, 0);
    hand(s, 'E', ['espionaje']);
    // E juega Ayuda militar (N, 3 ops) por operaciones; luego pone 3 en Finlandia (vecina URSS)
    hand(s, 'E', ['ayuda']);
    act(s, 'E', { type: 'playOps', card: 'ayuda', kind: 'influence' });
    act(s, 'E', { type: 'commitInfluence', placements: [{ c: 'fi', n: 3 }] });
    expect(s.influence.fi.E).toBe(3);
    expect(s.active).toBe('W');
  });
});

describe('golpes', () => {
  it('1d6 + ops − 2×estabilidad: quita influencia rival y el sobrante pasa a propia', () => {
    const s = blank();
    setInf(s, 'fr', 0, 2); // estab. 3 → con ops 4 y dado 5: 5+4−6 = 3 → quita 2, coloca 1
    s.tension = 5;
    s.active = 'W';
    // carta de 4 ops (evento propio: no se activa al jugarla por ops)
    hand(s, 'W', ['otan']);
    rig(s, 5);
    act(s, 'W', { type: 'playOps', card: 'otan', kind: 'coup' }); // evento propio: no se activa
    expect(s.influence.fr).toEqual({ W: 0, E: 2 });
    act(s, 'W', { type: 'commitCoup', target: 'fr' });
    expect(s.influence.fr).toEqual({ W: 1, E: 0 });
  });
  it('un resultado no positivo no cambia nada', () => {
    const s = blank();
    setInf(s, 'uk', 0, 5); // estab. 5
    s.active = 'W';
    hand(s, 'W', ['ayuda']);
    rig(s, 3);
    act(s, 'W', { type: 'playOps', card: 'ayuda', kind: 'coup' });
    act(s, 'W', { type: 'commitCoup', target: 'uk' }); // 3+3−10 < 0
    expect(s.influence.uk).toEqual({ W: 0, E: 5 });
  });
  it('requiere influencia rival en el país', () => {
    const s = blank();
    s.active = 'W';
    hand(s, 'W', ['ayuda']);
    act(s, 'W', { type: 'playOps', card: 'ayuda', kind: 'coup' });
    expect(() => act(s, 'W', { type: 'commitCoup', target: 'fr' })).toThrow(GameError);
  });
  it('la Tensión restringe golpes por región: 4 Europa, 3 Asia, 2 Medio Oriente', () => {
    const s = blank();
    for (const c of ['fr', 'jp', 'eg', 'ar']) setInf(s, c, 1, 1);
    s.tension = 5;
    expect(coupTargets(s, 'E').sort()).toEqual(['ar', 'eg', 'fr', 'jp']);
    s.tension = 4;
    expect(coupBlockedReason(s, 'fr')).toMatch(/Europa/);
    expect(coupTargets(s, 'E').sort()).toEqual(['ar', 'eg', 'jp']);
    s.tension = 3;
    expect(coupTargets(s, 'E').sort()).toEqual(['ar', 'eg']);
    s.tension = 2;
    expect(coupTargets(s, 'E')).toEqual(['ar']);
  });
  it('un golpe en país clave baja la Tensión 1; si llega a 1, pierde quien golpea', () => {
    const s = blank();
    setInf(s, 'ar', 0, 1); // clave
    s.tension = 4;
    s.active = 'W';
    hand(s, 'W', ['ayuda', 'cumbre']);
    act(s, 'W', { type: 'playOps', card: 'ayuda', kind: 'coup' });
    act(s, 'W', { type: 'commitCoup', target: 'ar' });
    expect(s.tension).toBe(3);

    const t = blank();
    setInf(t, 'ar', 0, 1);
    t.tension = 2;
    t.active = 'W';
    hand(t, 'W', ['ayuda']);
    act(t, 'W', { type: 'playOps', card: 'ayuda', kind: 'coup' });
    act(t, 'W', { type: 'commitCoup', target: 'ar' });
    expect(t.phase).toBe('over');
    expect(t.winner).toBe('E');
  });
  it('un golpe en país no clave no toca la Tensión', () => {
    const s = blank();
    setInf(s, 'bo', 0, 1);
    s.tension = 3;
    s.active = 'W';
    hand(s, 'W', ['ayuda']);
    act(s, 'W', { type: 'playOps', card: 'ayuda', kind: 'coup' });
    act(s, 'W', { type: 'commitCoup', target: 'bo' });
    expect(s.tension).toBe(3);
  });
  it('la Capacidad de IA suma ops solo al primer golpe del turno', () => {
    const s = blank();
    setInf(s, 'bo', 0, 9); // estab. 2
    s.cap.W = 2;
    s.active = 'W';
    hand(s, 'W', ['asesores', 'propaganda']); // 2 ops cada una
    rig(s, 4);
    act(s, 'W', { type: 'playOps', card: 'asesores', kind: 'coup' });
    act(s, 'W', { type: 'commitCoup', target: 'bo' }); // 4 + 2 + 2 − 4 = 4
    expect(s.influence.bo.E).toBe(5);
    s.active = 'W';
    rig(s, 4);
    act(s, 'W', { type: 'playOps', card: 'propaganda', kind: 'coup' });
    act(s, 'W', { type: 'commitCoup', target: 'bo' }); // 4 + 2 − 4 = 2
    expect(s.influence.bo.E).toBe(3);
  });
});

describe('puntuación de región', () => {
  it('Presencia, Dominio y Control con los valores del diseño', () => {
    const s = blank();
    // Africa (1/4/6): claves dz, ng, cg, ao, za
    setInf(s, 'ma', 3, 0);
    let sc = scoreRegion(s, 'AF');
    expect(sc.W.status).toBe('presence');
    expect(sc.W.base).toBe(1);
    expect(sc.net).toBe(1);
    setInf(s, 'dz', 2, 0); // clave
    setInf(s, 'ke', 2, 0);
    sc = scoreRegion(s, 'AF');
    expect(sc.W.status).toBe('domination'); // más países y más claves que el rival, con clave y no clave
    expect(sc.W.base).toBe(4);
    expect(sc.W.total).toBe(4 + 1);
    for (const c of ['ng', 'cg', 'ao', 'za']) setInf(s, c, COUNTRY[c].stab, 0);
    sc = scoreRegion(s, 'AF');
    expect(sc.W.status).toBe('control');
    expect(sc.W.base).toBe(6);
    expect(sc.W.keyControlled).toBe(5);
  });
  it('+1 por país controlado vecino de la superpotencia rival', () => {
    const s = blank();
    setInf(s, 'pl', 0, 3); // E controla Polonia (vecina de la URSS, no de EE.UU.)
    setInf(s, 'es', 0, 2);
    let sc = scoreRegion(s, 'EU');
    expect(sc.E.nearRival).toBe(0);
    setInf(s, 'pl', 3, 0); // W controla Polonia: vecino de la URSS (rival de W)
    setInf(s, 'es', 0, 0);
    sc = scoreRegion(s, 'EU');
    expect(sc.W.nearRival).toBe(1);
    expect(sc.W.total).toBe(3 + 1 /*clave*/ + 1);
    expect(sc.net).toBe(5);
  });
  it('el Dominio exige superar al rival en países y en claves', () => {
    const s = blank();
    setInf(s, 'fr', 3, 0); // clave
    setInf(s, 'es', 2, 0);
    setInf(s, 'de', 0, 4); // clave E
    setInf(s, 'dde', 0, 3); // clave E (era 1)
    const sc = scoreRegion(s, 'EU');
    expect(sc.W.status).toBe('presence'); // 2 países vs 2, 1 clave vs 2
    expect(sc.E.status).toBe('presence');
  });
  it('jugar la carta puntúa y una carta de puntuación retenida se puntúa sola al final del turno', () => {
    const s = blank();
    setInf(s, 'fr', 3, 0);
    s.active = 'E';
    hand(s, 'E', ['score_eu']);
    hand(s, 'W', ['score_as', 'ayuda']);
    setInf(s, 'jp', 4, 0); // Asia: presencia W + clave
    act(s, 'E', { type: 'playScore', card: 'score_eu' });
    expect(s.vp).toBe(-(0) + 3 + 1); // W: presencia 3 + clave 1 (nadie más)
    const before = s.vp;
    s.round = 6;
    s.active = 'W';
    act(s, 'W', { type: 'playOps', card: 'ayuda', kind: 'influence' });
    act(s, 'W', { type: 'commitInfluence', placements: [] });
    // fin de turno: score_as retenida se puntúa sola
    expect(s.turn).toBe(2);
    expect(s.hands.W).not.toContain('score_as');
    expect(s.vp).toBeGreaterThan(before);
  });
  it('las cartas de África y Américas no existen antes de la era 2', () => {
    const s = createGame(3);
    const all = [...s.deck, ...s.hands.W, ...s.hands.E];
    expect(all).not.toContain('score_af');
    expect(all).not.toContain('score_am');
    expect(all).toEqual(expect.arrayContaining(['score_eu', 'score_as', 'score_me']));
  });
});

describe('victoria inmediata', () => {
  it('20 PV ganan al instante', () => {
    const s = blank();
    s.vp = 19;
    s.active = 'W';
    hand(s, 'W', ['dartmouth']); // evento neutral: +1 PV propio
    act(s, 'W', { type: 'playEvent', card: 'dartmouth' });
    expect(s.phase).toBe('over');
    expect(s.winner).toBe('W');
  });
});

describe('vistas', () => {
  it('cada jugador ve solo su mano; el espectador ninguna', () => {
    const s = createGame(11);
    const vw = viewFor(s, 'W');
    expect(vw.hands.W).toEqual(s.hands.W);
    expect(vw.hands.E.every((x) => x === '?')).toBe(true);
    expect(vw.hands.E).toHaveLength(s.hands.E.length);
    expect(vw.deck.every((x) => x === '?')).toBe(true);
    const sp = viewFor(s, null);
    expect(sp.hands.W.every((x) => x === '?') && sp.hands.E.every((x) => x === '?')).toBe(true);
    expect(JSON.stringify(vw)).not.toContain(s.hands.E[0]);
  });
  it('rechaza acciones fuera de turno y con cartas ajenas', () => {
    const s = createGame(5);
    const w = s.hands.W[0];
    expect(() => applyAction(s, 'W', { type: 'playOps', card: w, kind: 'influence' })).toThrow(/turno/);
    expect(() => applyAction(s, 'E', { type: 'playOps', card: 'no-existe', kind: 'influence' })).toThrow();
  });
});

describe('cartas', () => {
  it('solo puede jugarse como evento una carta propia o neutral; la rival activa su evento por ops', () => {
    const s = blank();
    s.active = 'E';
    hand(s, 'E', ['otan', 'misiles']);
    expect(() => act(s, 'E', { type: 'playEvent', card: 'otan' })).toThrow(/rival/);
    act(s, 'E', { type: 'playOps', card: 'otan', kind: 'influence' }); // evento de OTAN se activa primero
    expect(s.influence.tr.W).toBe(2);
    expect(s.removed).toContain('otan'); // "se retira del juego"
    act(s, 'E', { type: 'commitInfluence', placements: [{ c: 'fi', n: 2 }] });
    expect(s.influence.fi.E).toBe(2);
  });
  it('la Crisis de los misiles baja la Tensión a 2 y da 2 PV a quien la juega', () => {
    const s = blank();
    s.active = 'E';
    hand(s, 'E', ['misiles']);
    act(s, 'E', { type: 'playEvent', card: 'misiles' });
    expect(s.tension).toBe(2);
    expect(s.vp).toBe(-2);
    expect(s.removed).toContain('misiles');
  });
  it('un evento propio que lleva la Tensión a 1 hace perder a quien lo juega', () => {
    const s = blank();
    s.tension = 2;
    s.active = 'E';
    hand(s, 'E', ['ablearcher']);
    act(s, 'E', { type: 'playEvent', card: 'ablearcher' });
    expect(s.tension).toBe(1);
    expect(s.winner).toBe('W');
  });
  it('un evento rival activado por ops que lleva la Tensión a 1 la deja en 2', () => {
    const s = blank();
    s.era = 4;
    s.tension = 2;
    s.active = 'E';
    hand(s, 'E', ['irak03']); // evento de Occidente con T−1
    act(s, 'E', { type: 'playOps', card: 'irak03', kind: 'influence' });
    expect(s.phase).toBe('play');
    expect(s.tension).toBe(2);
  });
  it('las guerras restan 1 por vecino controlado por el rival y reemplazan influencia con 4+', () => {
    const s = blank();
    s.era = 2;
    setInf(s, 'vn', 0, 2);
    setInf(s, 'cn', 0, 3); // vecino controlado por E: −1 para W
    s.active = 'W';
    hand(s, 'W', ['vietnam']);
    rig(s, 4); // 4 − 1 = 3 → fracasa
    act(s, 'W', { type: 'playEvent', card: 'vietnam' });
    expect(s.influence.vn.E).toBe(2);
    const t = blank();
    t.era = 2;
    setInf(t, 'vn', 0, 2);
    t.active = 'W';
    hand(t, 'W', ['vietnam']);
    rig(t, 4); // sin vecinos hostiles → victoria
    act(t, 'W', { type: 'playEvent', card: 'vietnam' });
    expect(t.influence.vn).toEqual(expect.objectContaining({ E: 0 }));
    expect(t.influence.vn.W).toBeGreaterThanOrEqual(2);
    expect(t.vp).toBe(2);
  });
  it('los eventos con elección crean una colocación pendiente que valida regiones y máximos', () => {
    const s = blank();
    s.active = 'W';
    hand(s, 'W', ['marshall']);
    act(s, 'W', { type: 'playEvent', card: 'marshall' });
    expect(s.queue[0]).toMatchObject({ kind: 'free', side: 'W', n: 4 });
    expect(() => act(s, 'W', { type: 'resolveFree', placements: [{ c: 'jp', n: 1 }] })).toThrow(/región/);
    expect(() => act(s, 'W', { type: 'resolveFree', placements: [{ c: 'fr', n: 3 }] })).toThrow(/Máximo/);
    act(s, 'W', { type: 'resolveFree', placements: [{ c: 'fr', n: 2 }, { c: 'it', n: 2 }] });
    expect(s.influence.fr.W).toBe(2);
    expect(s.queue).toHaveLength(0);
    expect(s.active).toBe('E');
  });
});

describe('texto de cartas', () => {
  it('Crisis de los misiles menciona Tensión a 2 y 2 PV', () => {
    const t = describeEffects(CARD.misiles).join(' ');
    expect(t).toMatch(/Tensión baja a 2/);
    expect(t).toMatch(/2 PV/);
  });
});
