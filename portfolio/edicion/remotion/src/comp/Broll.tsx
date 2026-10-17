import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
// Plano recurso vertical (sin hablar a cámara) en horizontal: a la izquierda, con el mismo plano desenfocado de fondo.
// clips: [[desde_s, dur_s, recorte?], ...] de referencia.mp4, uno detrás de otro. recorte = [x, y, w, h] en px de la fuente
// para planos horizontales que vienen con franjas negras dentro del vertical: se muestran anchos a la izquierda.
export const BrollScene: React.FC<{ src: string; clips: [number, number, number[]?][]; srcW?: number; srcH?: number }> = ({ src, clips, srcW = 478, srcH = 850 }) => {
  const { fps, width, height } = useVideoConfig(); const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  let acc = 0;
  return <AbsoluteFill style={{ background: C.bg, opacity: fade }}>
    {clips.map(([from, dur, crop], i) => {
      const start = acc; acc += Math.round(dur * fps);
      const sf = Math.round(from * fps);
      return <Sequence key={i} from={start} durationInFrames={Math.round(dur * fps)}>
        <OffthreadVideo src={staticFile(src)} startFrom={sf} muted style={{ position: "absolute", width: width * 1.1, height: height * 1.1,
          left: -width * .05, top: -height * .05, objectFit: "cover", filter: "blur(40px) brightness(.32)" }} />
        {crop ? (() => { const bw = 1060, k = bw / crop[2], bh = crop[3] * k;
          return <div style={{ position: "absolute", left: 90, top: (height - bh) / 2 - 40, width: bw, height: bh, overflow: "hidden", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
            <OffthreadVideo src={staticFile(src)} startFrom={sf} muted style={{ position: "absolute", width: srcW * k, height: srcH * k, left: -crop[0] * k, top: -crop[1] * k }} /></div>; })()
        : <OffthreadVideo src={staticFile(src)} startFrom={sf} muted style={{ position: "absolute", left: 150, top: 40, height: height - 80,
          width: (height - 80) * 9 / 16, objectFit: "cover", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />}
      </Sequence>;
    })}
  </AbsoluteFill>;
};
