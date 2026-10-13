import React from "react";
import { useInOut } from "./anim";
import { C, FONT } from "../theme";
// insignia tipo medalla: anillo con laurel esquemático
export const Badge: React.FC<{ title: string; sub?: string; color?: string; size?: number }> = ({ title, sub, color = C.gold, size = 300 }) => {
  const { inn, out, f } = useInOut();
  const rays = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div style={{ width: size, display: "flex", flexDirection: "column", alignItems: "center", opacity: out, transform: `scale(${.6 + .4 * inn}) rotate(${(1 - inn) * -12}deg)` }}>
      <svg width={size} height={size} viewBox="0 0 200 200">
        <g transform={`rotate(${f * .4} 100 100)`}>{rays.map(i => <rect key={i} x={98} y={6} width={4} height={14} rx={2} fill={color} opacity={.45} transform={`rotate(${i * 15} 100 100)`} />)}</g>
        <circle cx={100} cy={100} r={72} fill={C.bg2} stroke={color} strokeWidth={6} />
        <circle cx={100} cy={100} r={60} fill="none" stroke={color} strokeWidth={1.5} opacity={.6} />
        {Array.from({ length: 7 }, (_, i) => [-1, 1].map(s => (
          <ellipse key={`${i}${s}`} cx={100 + s * (46 - i * 2)} cy={128 - i * 11} rx={5} ry={10} fill={color} opacity={.85}
            transform={`rotate(${s * (30 + i * 9)} ${100 + s * (46 - i * 2)} ${128 - i * 11})`} />)))}
        <path d="M100 72 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2z" fill={color} />
      </svg>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * .16, color, letterSpacing: 1, textAlign: "center", marginTop: -size * .04, lineHeight: 1 }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: size * .075, color: C.white, letterSpacing: 2, textAlign: "center", marginTop: 10, textTransform: "uppercase" }}>{sub}</div>}
    </div>
  );
};
