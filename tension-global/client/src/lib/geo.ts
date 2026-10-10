import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';
import { geoCentroid, geoDistance, geoGraticule10, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldUrl from 'world-atlas/countries-50m.json?url';
import { COUNTRIES, RUSSIA_ISO, SOVIET_ISO, US_ISO, type CountryId, type Region } from '@tg/shared';

export const LAT_TOP = 78;
export const LAT_BOTTOM = -56;

export type PieceKind = 'play' | 'us' | 'ru' | 'sov' | 'other';

export interface LandPiece {
  key: string;
  iso: string;
  name: string;
  /** País jugable al que pertenece (aunque esté inactivo en la era actual). */
  cid: CountryId | null;
  /** Fragmento lejano (p. ej. Guayana Francesa): se pinta como terreno neutro. */
  far: boolean;
  geom: Geometry;
}

const isoToCountry = new Map<string, CountryId>();
for (const c of COUNTRIES) for (const i of c.iso) isoToCountry.set(i, c.id);

let cache: Promise<LandPiece[]> | null = null;

export function loadWorld(): Promise<LandPiece[]> {
  if (cache) return cache;
  cache = fetch(worldUrl)
    .then((r) => r.json())
    .then((topo: Topology) => {
      const fc = feature(topo, topo.objects.countries as GeometryCollection) as FeatureCollection<Geometry, { name: string }>;
      const pieces: LandPiece[] = [];
      for (const f of fc.features) {
        const iso = f.id !== undefined ? String(f.id).padStart(3, '0') : '';
        const name = f.properties?.name ?? '';
        const cid = isoToCountry.get(iso) ?? isoToCountry.get(`n:${name}`) ?? null;
        if (cid && f.geometry.type === 'MultiPolygon') {
          const def = COUNTRIES.find((c) => c.id === cid)!;
          const near: number[][][][] = [];
          const far: number[][][][] = [];
          for (const poly of (f.geometry as MultiPolygon).coordinates) {
            const g: Feature<Polygon> = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: poly } };
            const d = geoDistance(geoCentroid(g), def.anchor);
            (d > 0.5 ? far : near).push(poly);
          }
          pieces.push({ key: `${iso}-${name}`, iso, name, cid, far: false, geom: { type: 'MultiPolygon', coordinates: near } });
          if (far.length)
            pieces.push({ key: `${iso}-${name}-far`, iso, name, cid: null, far: true, geom: { type: 'MultiPolygon', coordinates: far } });
        } else {
          pieces.push({ key: `${iso || name}`, iso, name, cid, far: false, geom: f.geometry });
        }
      }
      return pieces;
    });
  return cache;
}

export function pieceKind(p: LandPiece, era: number): { kind: PieceKind; cid: CountryId | null } {
  if (p.cid) {
    const def = COUNTRIES.find((c) => c.id === p.cid)!;
    if (era >= def.from && era <= def.until) return { kind: 'play', cid: p.cid };
    // Alemania unificada se trata aparte; los países que aún no existen son repúblicas soviéticas.
  }
  if (era < 4 && SOVIET_ISO.includes(p.iso)) return { kind: 'sov', cid: null };
  if (p.iso === RUSSIA_ISO) return { kind: 'ru', cid: null };
  if (p.iso === US_ISO) return { kind: 'us', cid: null };
  return { kind: 'other', cid: null };
}

/** Proporción ancho/alto del mapa recortado (−56° a 78°). */
export const WORLD_RATIO = (() => {
  const b = geoNaturalEarth1();
  return (b([180, 0])![0] - b([-180, 0])![0]) / (b([0, LAT_BOTTOM])![1] - b([0, LAT_TOP])![1]);
})();

export interface MapGeometry {
  w: number;
  h: number;
  projection: GeoProjection;
  top: number;
  bottom: number;
  paths: Map<string, string>;
  graticule: string;
  /** Posición proyectada (px del mapa base) de [lon, lat]. */
  project: (lonlat: [number, number]) => [number, number];
  germanBorder: [number, number][];
  germanEastClip: string;
}

// Frontera interalemana aproximada (norte → sur) y contorno de Alemania Oriental.
const GER_BORDER: [number, number][] = [
  [10.85, 54.1], [10.9, 53.6], [10.6, 53.3], [10.95, 53.05], [11.45, 52.9], [10.95, 52.5], [11.0, 52.25],
  [10.65, 51.8], [10.3, 51.55], [10.15, 51.1], [10.1, 50.55], [10.2, 50.3], [10.9, 50.3], [11.9, 50.3], [12.2, 50.25],
];
const GER_EAST_POLY: [number, number][] = [...GER_BORDER, [12.6, 50.15], [15.5, 50.15], [15.5, 54.6], [10.85, 54.6]];

export function buildGeometry(pieces: LandPiece[], w: number, h: number): MapGeometry {
  const base = geoNaturalEarth1();
  const k0 = base.scale();
  const [t0x, t0y] = base.translate();
  const top = base([0, LAT_TOP])![1];
  const bot = base([0, LAT_BOTTOM])![1];
  const left = base([-180, 0])![0];
  const right = base([180, 0])![0];
  const m = Math.min(w / (right - left), h / (bot - top));
  const cyU = ((top + bot) / 2 - t0y) / k0;
  const projection = geoNaturalEarth1()
    .scale(k0 * m)
    .translate([w / 2, h / 2 - m * k0 * cyU]);
  const path = geoPath(projection);
  const paths = new Map<string, string>();
  for (const p of pieces) {
    const d = path({ type: 'Feature', properties: {}, geometry: p.geom });
    if (d) paths.set(p.key, d);
  }
  const project = (ll: [number, number]) => projection(ll) as [number, number];
  const poly = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${project(p).map((n) => n.toFixed(1)).join(',')}`).join('') + 'Z';
  const g = path(geoGraticule10()) ?? '';
  return {
    w,
    h,
    projection,
    top: projection([0, LAT_TOP])![1],
    bottom: projection([0, LAT_BOTTOM])![1],
    paths,
    graticule: g,
    project,
    germanBorder: GER_BORDER.map(project),
    germanEastClip: poly(GER_EAST_POLY),
  };
}

export interface ViewBox {
  lon: [number, number];
  lat: [number, number];
}

export const REGION_VIEWS: Record<Region | 'world', ViewBox | null> = {
  world: null,
  EU: { lon: [-13, 46], lat: [34, 66] },
  ME: { lon: [24, 64], lat: [11, 43] },
  AS: { lon: [58, 150], lat: [-10, 56] },
  AF: { lon: [-20, 54], lat: [-36, 38] },
  AM: { lon: [-128, -30], lat: [-56, 62] },
};
