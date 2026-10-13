import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
// tipografía cinética: cada palabra entra con un spring escalonado
export const Kinetic: React.FC<{ text: string; size: number; color?: string; delay?: number; weight?: number; align?: "center" | "left"; track?: number }> =
  ({ text, size, color = C.white, delay = 0, weight = 900, align = "center", track = -1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  return (
    <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.02, color, letterSpacing: track, textAlign: align,
      display: "flex", flexWrap: "wrap", gap: `0 ${size * .26}px`, justifyContent: align === "center" ? "center" : "flex-start" }}>
      {text.split(" ").map((w, i) => {
        const s = spring({ frame: f - delay - i * 3, fps, config: { damping: 14, stiffness: 140 } });
        return <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${(1 - s) * size * .45}px) scale(${.9 + .1 * s})` }}>{w}</span>;
      })}
    </div>
  );
};
export const Label: React.FC<{ text: string; color?: string; size?: number; delay?: number }> = ({ text, color = C.dim, size = 28, delay = 0 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 18 } });
  return <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: size, letterSpacing: size * .12, color, textTransform: "uppercase", opacity: s,
    transform: `translateY(${(1 - s) * 14}px)` }}>{text}</div>;
};
// contador animado
export const Counter: React.FC<{ to: number; prefix?: string; suffix?: string; size: number; color: string; delay?: number; frames?: number }> =
  ({ to, prefix = "", suffix = "", size, color, delay = 0, frames = 36 }) => {
  const f = useCurrentFrame();
  const p = Math.min(1, Math.max(0, (f - delay) / frames)), e = 1 - Math.pow(1 - p, 4);
  return <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, lineHeight: .9, letterSpacing: -size * .03,
    fontVariantNumeric: "tabular-nums", opacity: p > 0 ? 1 : 0 }}>{prefix}{Math.round(to * e)}{suffix}</div>;
};
