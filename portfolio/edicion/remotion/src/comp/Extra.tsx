import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, Orient } from "../theme";
import { useInOut } from "./anim";
// lista de reconocimientos que entran uno a uno
export const AwardList: React.FC<{ items: [string, string][]; color: string; size: number; every?: number }> = ({ items, color, size, every = 40 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(); const { out } = useInOut();
  return <div style={{ display: "flex", flexDirection: "column", gap: size * .55, opacity: out, width: "100%" }}>
    {items.map(([a, b], i) => {
      const s = spring({ frame: f - i * every, fps, config: { damping: 16 } });
      return <div key={i} style={{ display: "flex", alignItems: "center", gap: size * .5, opacity: s, transform: `translateX(${(1 - s) * -60}px)` }}>
        <div style={{ width: size * .32, height: size * .32, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color: C.white, lineHeight: 1.05 }}>{a}</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: size * .5, color, letterSpacing: 2, textTransform: "uppercase" }}>{b}</div></div>
      </div>;
    })}
  </div>;
};
// rótulo de capítulo a pantalla completa
export const ChapterCard: React.FC<{ title: string; n: number; o: Orient }> = ({ title, n, o }) => {
  const f = useCurrentFrame(), { fps, durationInFrames: d } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 18 } });
  const out = interpolate(f, [d - 8, d], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = interpolate(f, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center", opacity: out }}>
    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: o === "v" ? 34 : 30, color: C.dim, letterSpacing: 10, opacity: s }}>{String(n).padStart(2, "0")}</div>
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: o === "v" ? 110 : 120, color: C.white, letterSpacing: 4, transform: `translateY(${(1 - s) * 40}px)`, opacity: s, textAlign: "center" }}>{title}</div>
    <div style={{ width: 260 * line, height: 8, background: C.blue, marginTop: 18 }} />
  </AbsoluteFill>;
};
