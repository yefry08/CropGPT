import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { useInOut, useKenBurns } from "./anim";
// Ilustraciones dibujadas (no fotos). Todas en SVG, con entrada suave y zoom Ken Burns.
const Frame: React.FC<{ w: number; children: React.ReactNode }> = ({ w, children }) => {
  const { inn, out } = useInOut(); const kb = useKenBurns(1, 1.06);
  return <div style={{ width: w, opacity: Math.min(inn, out), transform: `translateY(${(1 - inn) * 40}px) scale(${kb * (.92 + .08 * inn)})` }}>{children}</div>;
};

// Contractor AI: portátil revisando contratos públicos, señala los sospechosos
export const Contractor: React.FC<{ w: number; flagText?: string }> = ({ w, flagText = "RIESGO" }) => {
  const f = useCurrentFrame();
  const scan = (f * 2.2) % 220;
  return <Frame w={w}><svg viewBox="0 0 400 300" width={w}>
    <rect x={50} y={30} width={300} height={190} rx={12} fill={C.bg2} stroke={C.blue} strokeWidth={4} />
    <rect x={20} y={220} width={360} height={22} rx={8} fill="#1B2333" stroke={C.blue} strokeWidth={3} />
    {[0, 1, 2].map(i => {
      const flag = i === 1 && f > 30;
      return <g key={i} transform={`translate(${78 + i * 92} 58)`}>
        <rect width={74} height={96} rx={6} fill="#F4F1EA" />
        {[0, 1, 2, 3, 4, 5].map(j => <rect key={j} x={10} y={14 + j * 12} width={j === 5 ? 30 : 54} height={5} rx={2} fill="#BFB8A6" />)}
        {flag && <rect x={-4} y={-4} width={82} height={104} rx={8} fill="none" stroke={C.red} strokeWidth={4} />}
        {flag && <text x={37} y={-12} textAnchor="middle" fontSize={14} fontWeight={800} fill={C.red} fontFamily="Inter">{flagText}</text>}
      </g>;
    })}
    <rect x={64} y={44 + scan * .55} width={272} height={4} fill={C.blue} opacity={.75} />
    <g transform="translate(200 190)">{[0, 1, 2, 3, 4].map(i => <circle key={i} cx={-40 + i * 20} cy={0} r={4} fill={C.blue} opacity={.35 + .65 * (Math.sin(f * .25 - i) > 0 ? 1 : 0)} />)}</g>
  </svg></Frame>;
};

// 3R VideoGame: visor de realidad virtual con flechas de reciclaje
export const VR: React.FC<{ w: number; label?: string }> = ({ w, label = "REDUCIR · REUTILIZAR · RECICLAR" }) => {
  const f = useCurrentFrame();
  return <Frame w={w}><svg viewBox="0 0 400 300" width={w} style={{ overflow: "visible" }}>
    <g transform={`rotate(${f * 1.2} 200 150)`}>{[0, 1, 2].map(i => <g key={i} transform={`rotate(${i * 120} 200 150)`}>
      <path d="M200 40 A110 110 0 0 1 295 95" fill="none" stroke={C.green} strokeWidth={14} strokeLinecap="round" />
      <path d="M302 72 L300 108 L268 92 Z" fill={C.green} /></g>)}</g>
    <rect x={110} y={150} width={180} height={88} rx={30} fill="#1B2333" stroke={C.green} strokeWidth={4} />
    <rect x={128} y={166} width={66} height={54} rx={16} fill={C.green} opacity={.35} />
    <rect x={206} y={166} width={66} height={54} rx={16} fill={C.green} opacity={.35} />
    <path d="M110 190 q-40 0 -40 -30 M290 190 q40 0 40 -30" stroke="#1B2333" strokeWidth={10} fill="none" strokeLinecap="round" />
    <text x={200} y={285} textAnchor="middle" fontSize={17} fontWeight={800} fill={C.green} fontFamily="Inter" letterSpacing={2}>{label}</text>
  </svg></Frame>;
};

// NeurIPS: artículos científicos y una red neuronal que se ilumina
export const Papers: React.FC<{ w: number }> = ({ w }) => {
  const f = useCurrentFrame();
  const L = [[3, 70], [5, 170], [4, 270], [2, 360]];
  const nodes = L.map(([n, x]) => Array.from({ length: n }, (_, i) => [x, 150 + (i - (n - 1) / 2) * 46]));
  return <Frame w={w}><svg viewBox="0 0 420 300" width={w}>
    {[0, 1, 2].map(i => <g key={i} transform={`translate(${14 + i * 10} ${24 + i * 8}) rotate(${-6 + i * 3})`} opacity={.35 + i * .15}>
      <rect width={92} height={120} rx={4} fill="#F4F1EA" />{[0, 1, 2, 3, 4, 5, 6].map(j => <rect key={j} x={10} y={16 + j * 13} width={j % 3 === 2 ? 40 : 70} height={5} fill="#BFB8A6" />)}</g>)}
    {nodes.slice(0, -1).map((col, li) => col.map(([x1, y1], a) => nodes[li + 1].map(([x2, y2], b) => {
      const on = Math.sin(f * .18 - li * 1.3 + a + b) > .55;
      return <line key={`${li}${a}${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.blue} strokeWidth={on ? 2.6 : 1.2} opacity={on ? .95 : .3} />;
    })))}
    {nodes.flat().map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill={C.bg2} stroke={C.blue} strokeWidth={3.5} />)}
  </svg></Frame>;
};

// Bootcamp: un auditorio de jóvenes dibujados que se va llenando
export const Bootcamp: React.FC<{ w: number }> = ({ w }) => {
  const f = useCurrentFrame();
  const n = Math.min(40, Math.floor(interpolate(f, [0, 40], [0, 40], { extrapolateRight: "clamp" })));
  const cols = [C.blue, "#7FB3FF", C.white, "#A9C8F5"];
  return <Frame w={w}><svg viewBox="0 0 400 280" width={w}>
    <rect x={130} y={14} width={140} height={46} rx={6} fill={C.blue} />
    <text x={200} y={44} textAnchor="middle" fontSize={18} fontWeight={800} fill="#fff" fontFamily="Inter">AI SAFETY</text>
    {Array.from({ length: n }, (_, i) => {
      const r = Math.floor(i / 10), c = i % 10, x = 40 + c * 36 + (r % 2) * 18, y = 110 + r * 42;
      return <g key={i}><circle cx={x} cy={y} r={9} fill={cols[i % 4]} /><path d={`M${x - 14} ${y + 30} q14 -26 28 0`} fill={cols[i % 4]} /></g>;
    })}
  </svg></Frame>;
};

// 14 medallas: una por cada premio Nobel de la Paz de la iniciativa
export const Medals: React.FC<{ w: number }> = ({ w }) => {
  const f = useCurrentFrame();
  return <div style={{ width: w, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: w * .018 }}>
    {Array.from({ length: 14 }, (_, i) => {
      const s = interpolate(f, [i * 2.2, i * 2.2 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const m = w / 8.6;
      return <svg key={i} width={m} height={m * 1.3} viewBox="0 0 40 52" style={{ opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
        <path d="M12 0 h6 l2 16 h-10z M22 0 h6 l-2 16 h-6z" fill={C.blue} />
        <circle cx={20} cy={34} r={15} fill={C.gold} /><circle cx={20} cy={34} r={10} fill="none" stroke="#9C7A1E" strokeWidth={1.6} />
        <text x={20} y={39} textAnchor="middle" fontSize={12} fontWeight={900} fill="#5E4810" fontFamily="Inter">{i + 1}</text>
      </svg>;
    })}
  </div>;
};

// Ready Recycling: una escuela con tres contenedores de reciclaje que se van llenando
export const School: React.FC<{ w: number; en?: boolean }> = ({ w, en = false }) => {
  const f = useCurrentFrame();
  const bins = en ? [["#2E8BFF", "PAPER"], ["#E8B53A", "PLASTIC"], ["#2FBF71", "GLASS"]] : [["#2E8BFF", "PAPEL"], ["#E8B53A", "PLÁSTICO"], ["#2FBF71", "VIDRIO"]];
  return <Frame w={w}><svg viewBox="0 0 400 300" width={w}>
    <path d="M70 120 L200 50 L330 120 Z" fill="#1B2333" stroke={C.green} strokeWidth={4} />
    <rect x={90} y={120} width={220} height={100} fill="#1B2333" stroke={C.green} strokeWidth={4} />
    {[0, 1, 2, 3].map(i => <rect key={i} x={106 + i * 52} y={138} width={34} height={30} rx={3} fill={C.green} opacity={.35} />)}
    <rect x={182} y={178} width={36} height={42} fill={C.green} opacity={.55} />
    <circle cx={200} cy={92} r={14} fill="none" stroke={C.green} strokeWidth={3} />
    {bins.map(([col, lab], i) => {
      const fill = Math.min(1, Math.max(0, (f - 10 - i * 8) / 40));
      return <g key={i} transform={`translate(${70 + i * 100} 232)`}>
        <rect width={60} height={56} rx={6} fill="none" stroke={col} strokeWidth={3} />
        <rect x={3} y={53 - 50 * fill} width={54} height={50 * fill} rx={4} fill={col} opacity={.75} />
        <text x={30} y={-6} textAnchor="middle" fontSize={11} fontWeight={800} fill={col} fontFamily="Inter">{lab}</text></g>;
    })}
  </svg></Frame>;
};

// B Energy: una casa con paneles solares; el sol sale y los paneles se van "cargando"
export const SolarHouse: React.FC<{ w: number }> = ({ w }) => {
  const f = useCurrentFrame();
  const sun = interpolate(f, [0, 40], [60, 0], { extrapolateRight: "clamp" });
  const charge = Math.min(1, Math.max(0, (f - 25) / 50));
  return <Frame w={w}><svg viewBox="0 0 400 300" width={w} style={{ overflow: "visible" }}>
    <g transform={`translate(320 ${70 + sun})`}>
      <g transform={`rotate(${f * .8})`}>{Array.from({ length: 12 }, (_, i) =>
        <rect key={i} x={-3} y={-58} width={6} height={16} rx={3} fill={C.gold} transform={`rotate(${i * 30})`} />)}</g>
      <circle r={34} fill={C.gold} /></g>
    <path d="M60 150 L170 80 L280 150 Z" fill="#1B2333" stroke={C.green} strokeWidth={4} />
    {[0, 1, 2].map(i => <g key={i} transform={`translate(${118 + i * 36} ${126 - i * 0}) skewX(-20)`}>
      <rect width={32} height={20} fill={C.blue} opacity={.35 + .65 * charge} stroke="#9CC6FF" strokeWidth={1.5} />
      <line x1={16} y1={0} x2={16} y2={20} stroke="#9CC6FF" strokeWidth={1} /></g>)}
    <rect x={80} y={150} width={180} height={110} fill="#1B2333" stroke={C.green} strokeWidth={4} />
    <rect x={155} y={200} width={34} height={60} fill={C.green} opacity={.5} />
    <rect x={100} y={170} width={36} height={30} rx={3} fill={C.gold} opacity={.25 + .6 * charge} />
    <rect x={208} y={170} width={36} height={30} rx={3} fill={C.gold} opacity={.25 + .6 * charge} />
    <line x1={20} y1={260} x2={380} y2={260} stroke={C.line} strokeWidth={3} />
  </svg></Frame>;
};

// tres proveedores; uno queda resaltado como el que encaja
export const Providers: React.FC<{ w: number }> = ({ w }) => {
  const f = useCurrentFrame();
  return <div style={{ width: w, display: "flex", gap: w * .05, justifyContent: "center" }}>
    {["PROVIDER A", "PROVIDER B", "PROVIDER C"].map((p, i) => {
      const s = interpolate(f, [i * 8, i * 8 + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const pick = i === 1 && f > 55;
      return <svg key={i} width={w * .28} viewBox="0 0 120 160" style={{ opacity: s, transform: `translateY(${(1 - s) * 30}px) scale(${pick ? 1.08 : 1})` }}>
        <rect x={4} y={4} width={112} height={152} rx={12} fill={C.bg2} stroke={pick ? C.green : C.line} strokeWidth={pick ? 5 : 3} />
        <circle cx={60} cy={44} r={20} fill={C.gold} opacity={.8} />
        {[0, 1, 2].map(j => <rect key={j} x={22} y={80 + j * 16} width={j === 2 ? 46 : 76} height={7} rx={3} fill="#4A5468" />)}
        <text x={60} y={140} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.dim} fontFamily="Inter">{p}</text>
        {pick && <g transform="translate(96 22)"><circle r={16} fill={C.green} /><path d="M-7 0 l5 5 l9 -10" stroke="#fff" strokeWidth={3.5} fill="none" /></g>}
      </svg>;
    })}
  </div>;
};

// datos de radiación solar: una cuadrícula que se colorea por celda, con un pin
export const Irradiance: React.FC<{ w: number }> = ({ w }) => {
  const f = useCurrentFrame();
  const cols = 14, rows = 8;
  return <Frame w={w}><svg viewBox="0 0 420 260" width={w}>
    {Array.from({ length: cols * rows }, (_, k) => {
      const c = k % cols, r = Math.floor(k / cols);
      const v = .5 + .5 * Math.sin(c * .55 + r * .35) * Math.cos(r * .5 - c * .2);
      const on = f > (c + r) * 1.6;
      return <rect key={k} x={10 + c * 28.5} y={10 + r * 28.5} width={26} height={26} rx={4}
        fill={v > .66 ? C.gold : v > .4 ? "#B9862A" : "#5A4A2A"} opacity={on ? .35 + .6 * v : .05} />;
    })}
    {f > 45 && <g transform="translate(240 120)"><circle r={14} fill="none" stroke={C.white} strokeWidth={4} />
      <circle r={5} fill={C.white} /><circle r={14 + (f % 30)} fill="none" stroke={C.white} strokeWidth={2} opacity={1 - (f % 30) / 30} /></g>}
  </svg></Frame>;
};
