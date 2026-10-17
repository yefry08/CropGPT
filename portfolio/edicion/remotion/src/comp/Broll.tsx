import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
// Plano recurso vertical (sin hablar a cámara) en horizontal: a la izquierda, con el mismo plano desenfocado de fondo.
// clips: [[desde_s, dur_s], ...] de referencia.mp4, uno detrás de otro.
export const BrollScene: React.FC<{ src: string; clips: [number, number][] }> = ({ src, clips }) => {
  const { fps, width, height } = useVideoConfig(); const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  let acc = 0;
  return <AbsoluteFill style={{ background: C.bg, opacity: fade }}>
    {clips.map(([from, dur], i) => {
      const start = acc; acc += Math.round(dur * fps);
      const sf = Math.round(from * fps);
      return <Sequence key={i} from={start} durationInFrames={Math.round(dur * fps)}>
        <OffthreadVideo src={staticFile(src)} startFrom={sf} muted style={{ position: "absolute", width: width * 1.1, height: height * 1.1,
          left: -width * .05, top: -height * .05, objectFit: "cover", filter: "blur(40px) brightness(.32)" }} />
        <OffthreadVideo src={staticFile(src)} startFrom={sf} muted style={{ position: "absolute", left: 150, top: 40, height: height - 80,
          width: (height - 80) * 9 / 16, objectFit: "cover", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />
      </Sequence>;
    })}
  </AbsoluteFill>;
};
