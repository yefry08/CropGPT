import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Orient } from "../theme";
// geometría del plano de cámara: el cuadrado del vídeo nunca se tapa con gráficos (solo subtítulos abajo)
export const CAM = { h: { x: 420, y: 0, s: 1080 }, v: { x: 0, y: 420, s: 1080 } };

export const CameraScene: React.FC<{ sc: any; o: Orient }> = ({ sc, o }) => {
  const { fps, width, height } = useVideoConfig(); const f = useCurrentFrame();
  const g = CAM[o], from = Math.round(sc.from * fps);
  const fade = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: C.bg, opacity: fade }}>
    {/* relleno: el mismo plano, desenfocado y oscurecido, para los márgenes */}
    <OffthreadVideo src={staticFile("base.mp4")} startFrom={from} muted
      style={{ position: "absolute", width: Math.max(width, height) * 1.15, height: Math.max(width, height) * 1.15,
        left: (width - Math.max(width, height) * 1.15) / 2, top: (height - Math.max(width, height) * 1.15) / 2,
        objectFit: "cover", filter: "blur(38px) brightness(.38) saturate(1.1)" }} />
    <OffthreadVideo src={staticFile("base.mp4")} startFrom={from} muted
      style={{ position: "absolute", left: g.x, top: g.y, width: g.s, height: g.s, objectFit: "cover",
        boxShadow: "0 30px 80px rgba(0,0,0,.55)" }} />
  </AbsoluteFill>;
};

export const NarrationBg: React.FC<{ o: Orient }> = ({ o }) => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig();
  const fade = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: fade, background: `radial-gradient(ellipse at 50% 40%, ${C.bg2} 0%, ${C.bg} 70%)` }}>
    <svg width={width} height={height} style={{ position: "absolute", opacity: .5 }}>
      {Array.from({ length: Math.ceil(width / 80) + 1 }, (_, i) => <line key={`x${i}`} x1={i * 80} y1={0} x2={i * 80} y2={height} stroke={C.line} strokeWidth={1} />)}
      {Array.from({ length: Math.ceil(height / 80) + 1 }, (_, i) => <line key={`y${i}`} x1={0} y1={i * 80 + (f * .3) % 80} x2={width} y2={i * 80 + (f * .3) % 80} stroke={C.line} strokeWidth={1} />)}
    </svg>
  </AbsoluteFill>;
};
