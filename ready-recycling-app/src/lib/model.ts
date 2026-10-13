// Simulación del módulo inteligente, con los mismos umbrales del prototipo:
// compacta al 85 % de llenado, la placa reduce lo suelto un 65 % y el módulo
// se declara lleno cuando lo ya compactado ocupa el 68 % del volumen útil.
import { CATEGORIES, CategoryKey, Site } from './data';

export const USABLE_LITRES = 118; // 44 cm útiles × 2 686 cm² de sección
export const SENSOR_CM = 72; // distancia del ToF a la bandeja vacía
export const COMPACT_AT = 85;
export const KEEP_AFTER_COMPACT = 0.35;
export const FULL_AT = 68;
export const TEMP_ALERT_C = 60;

export type ModuleState = {
  siteId: string;
  category: CategoryKey;
  level: number; // % del volumen útil ocupado
  compacted: number; // % ocupado por residuos ya compactados
  cycles: number;
  depositedLitres: number; // volumen suelto recibido desde el último vaciado
  tempC: number;
  battery: number;
  full: boolean;
  lastReport: number;
  lastEmptied: number;
};

export const moduleId = (m: { siteId: string; category: CategoryKey }) => `${m.siteId}:${m.category}`;

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function initialModules(sites: Site[]): ModuleState[] {
  const now = Date.now();
  const out: ModuleState[] = [];
  sites.forEach((site, i) => {
    site.modules.forEach((category, j) => {
      const r = seeded(i * 7 + j);
      const cycles = Math.floor(r * 3);
      let compacted = 0;
      for (let c = 0; c < cycles; c++) compacted += (COMPACT_AT - compacted) * KEEP_AFTER_COMPACT;
      const level = Math.min(COMPACT_AT - 1, compacted + r * 40);
      out.push({
        siteId: site.id,
        category,
        level,
        compacted,
        cycles,
        depositedLitres: depositedFor(compacted, level, cycles),
        tempC: 27 + r * 4,
        battery: site.solar ? 70 + r * 30 : 100,
        full: false,
        lastReport: now,
        lastEmptied: now - (1 + r * 5) * 86400000,
      });
    });
  });
  return out;
}

// Volumen suelto que ha entrado: lo compactado vale 1/0.35 de su volumen.
function depositedFor(compacted: number, level: number, cycles: number) {
  const loose = level - compacted;
  return ((cycles ? compacted / KEEP_AFTER_COMPACT : 0) + loose) * (USABLE_LITRES / 100);
}

export type TickEvent = { type: 'compacted' | 'full' | 'hot'; module: ModuleState };

// Un paso de la demostración: cada módulo recibe residuos a su propio ritmo.
export function tick(modules: ModuleState[], seconds: number, speed: number): { modules: ModuleState[]; events: TickEvent[] } {
  const events: TickEvent[] = [];
  const now = Date.now();
  const next = modules.map((m, index) => {
    const s = { ...m, lastReport: now };
    const rate = (0.15 + seeded(index + 11) * 0.35) * speed; // % por segundo de demostración
    s.tempC = clamp(s.tempC + (Math.random() - 0.5) * 0.4, 24, 38) + (s.category === 'organico' && s.full ? 0.02 : 0);
    s.battery = clamp(s.battery + (Math.random() - 0.48) * 0.3, 15, 100);
    if (s.full) return s;
    const added = rate * seconds;
    s.level += added;
    s.depositedLitres += (added * USABLE_LITRES) / 100;
    if (s.level >= COMPACT_AT) {
      const loose = s.level - s.compacted;
      s.compacted += loose * KEEP_AFTER_COMPACT;
      s.level = s.compacted;
      s.cycles += 1;
      events.push({ type: 'compacted', module: s });
      if (s.compacted >= FULL_AT) {
        s.full = true;
        events.push({ type: 'full', module: s });
      }
    }
    if (s.tempC >= TEMP_ALERT_C) events.push({ type: 'hot', module: s });
    return s;
  });
  return { modules: next, events };
}

export function emptied(m: ModuleState): ModuleState {
  return { ...m, level: 0, compacted: 0, cycles: 0, depositedLitres: 0, full: false, lastEmptied: Date.now() };
}

export function compactNow(m: ModuleState): ModuleState {
  if (m.full || m.level - m.compacted < 2) return m;
  const compacted = m.compacted + (m.level - m.compacted) * KEEP_AFTER_COMPACT;
  return { ...m, compacted, level: compacted, cycles: m.cycles + 1, full: compacted >= FULL_AT };
}

export const tofDistance = (m: ModuleState) => Math.round(SENSOR_CM - (m.level / 100) * 44);
export const weightKg = (m: ModuleState) => m.depositedLitres * CATEGORIES[m.category].kgPerLitre;
export const bottlesEquivalent = (m: ModuleState) => Math.round(m.depositedLitres / 1.2);

export function status(m: ModuleState): { label: string; tone: 'ok' | 'warn' | 'full' } {
  if (m.full) return { label: 'Lleno · recolección pendiente', tone: 'full' };
  if (m.compacted >= FULL_AT * 0.8 || m.level >= 70) return { label: 'Casi lleno', tone: 'warn' };
  return { label: 'Operando', tone: 'ok' };
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
