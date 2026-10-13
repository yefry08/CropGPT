import React from "react";
import { geoMercator, geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { useInOut } from "./anim";

const LAND: any = feature(world as any, (world as any).objects.countries);
export const PLACES: Record<string, { ll: [number, number]; iso: string; label: string; dy?: number }> = {
  rd: { ll: [-69.93, 18.48], iso: "214", label: "República Dominicana" },
  bogota: { ll: [-74.07, 4.71], iso: "170", label: "Bogotá, Colombia" },
  salvador: { ll: [-89.19, 13.69], iso: "222", label: "El Salvador" },
  saopaulo: { ll: [-46.63, -23.55], iso: "076", label: "São Paulo, Brasil" },
  kenia: { ll: [36.82, -1.29], iso: "404", label: "Kenia", dy: 16 } as any,
  uganda: { ll: [32.58, 0.35], iso: "800", label: "Uganda", dy: -18 } as any,
  osaka: { ll: [135.50, 34.69], iso: "392", label: "Osaka, Japón" },
  corea: { ll: [126.98, 37.57], iso: "410", label: "Corea del Sur", dy: -14 } as any,
  bangkok: { ll: [100.50, 13.75], iso: "764", label: "Bangkok, Tailandia" },
  espana: { ll: [-3.70, 40.42], iso: "724", label: "España" },
  reinounido: { ll: [-0.13, 51.51], iso: "826", label: "Reino Unido" },
};
// mapa plano con países resaltados, pines con etiqueta y arcos desde RD
export const MapPanel: React.FC<{ w: number; h: number; pins: string[]; bbox: [[number, number], [number, number]]; color: string; arcs?: boolean; title?: string; labels?: boolean }> =
  ({ w, h, pins, bbox, color, arcs = false, title, labels = true }) => {
  const f = useCurrentFrame(); const { inn, out } = useInOut();
  const box = { type: "Feature", geometry: { type: "MultiPoint", coordinates: [bbox[0], bbox[1]] } } as any;
  const proj = geoMercator().fitExtent([[w * .06, h * .1], [w * .94, h * .9]], box);
  const path = geoPath(proj);
  const hi = new Set(pins.map(p => PLACES[p].iso));
  const rd = proj(PLACES.rd.ll) as [number, number];
  return <div style={{ width: w, height: h, position: "relative", opacity: out, transform: `scale(${.94 + .06 * inn})` }}>
    <svg width={w} height={h}>
      {LAND.features.map((g: any, i: number) => <path key={i} d={path(g) || ""} fill={hi.has(String(g.id)) ? color : "#1C2433"} stroke={C.bg} strokeWidth={.8}
        opacity={hi.has(String(g.id)) ? interpolate(f, [6, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * .9 + .1 : 1} />)}
      {arcs && pins.filter(p => p !== "rd").map((p, i) => {
        const [x, y] = proj(PLACES[p].ll) as [number, number];
        const mx = (rd[0] + x) / 2, my = Math.min(rd[1], y) - Math.hypot(x - rd[0], y - rd[1]) * .35;
        const len = 1600, prog = interpolate(f, [10 + i * 8, 40 + i * 8], [len, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <path key={p} d={`M${rd[0]} ${rd[1]} Q${mx} ${my} ${x} ${y}`} fill="none" stroke={color} strokeWidth={3} strokeDasharray={len} strokeDashoffset={prog} opacity={.9} />;
      })}
      {pins.map((p, i) => {
        const [x, y] = proj(PLACES[p].ll) as [number, number];
        const s = interpolate(f, [14 + i * 6, 24 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const pulse = 1 + .5 * ((f * .05 + i * .3) % 1);
        return <g key={p} opacity={s}><circle cx={x} cy={y} r={9 * pulse} fill="none" stroke={C.white} strokeWidth={2} opacity={2 - pulse * 1.2} />
          <circle cx={x} cy={y} r={7} fill={C.white} /><circle cx={x} cy={y} r={4} fill={color} /></g>;
      })}
    </svg>
    {labels && pins.map((p, i) => {
      const [x, y] = proj(PLACES[p].ll) as [number, number];
      const s = interpolate(f, [18 + i * 6, 28 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const right = x < w * .62;
      return <div key={p} style={{ position: "absolute", left: right ? x + 16 : undefined, right: right ? undefined : w - x + 16, top: y - 17 + (PLACES[p].dy || 0), opacity: s,
        fontFamily: FONT, fontWeight: 800, fontSize: Math.max(20, w * .022), color: C.white, whiteSpace: "nowrap", textShadow: "0 2px 8px #000" }}>{PLACES[p].label}</div>;
    })}
    {title && <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: Math.max(26, w * .03), color, letterSpacing: 3 }}>{title}</div>}
  </div>;
};
// globo girando con los puntos de la trayectoria
export const Globe: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const f = useCurrentFrame(); const { inn, out } = useInOut();
  const proj = geoOrthographic().scale(size * .46).translate([size / 2, size / 2]).rotate([40 - f * .9, -8, 0]).clipAngle(90);
  const path = geoPath(proj);
  return <svg width={size} height={size} style={{ opacity: out, transform: `scale(${.8 + .2 * inn})` }}>
    <circle cx={size / 2} cy={size / 2} r={size * .46} fill="#0F1624" stroke={color} strokeWidth={3} />
    <path d={path(geoGraticule10()) || ""} fill="none" stroke={C.line} strokeWidth={1} />
    {LAND.features.map((g: any, i: number) => <path key={i} d={path(g) || ""} fill="#2A3447" />)}
    {Object.values(PLACES).map((p, i) => { const xy = proj(p.ll); const vis = path({ type: "Point", coordinates: p.ll } as any);
      return xy && vis ? <circle key={i} cx={xy[0]} cy={xy[1]} r={size * .016} fill={color} /> : null; })}
  </svg>;
};
