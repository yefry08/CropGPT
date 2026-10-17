import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
// Planos de vídeo uno detrás de otro, con el mismo plano desenfocado de fondo.
// layout "square": toma cuadrada (parque / fuente) a la izquierda, 1040 px; "tall": vertical a la izquierda;
// crop [x, y, w, h] (px de la fuente) muestra solo esa zona, ancha, a la izquierda.
export type Clip = { src: string; from: number; dur: number; crop?: number[]; sw?: number; sh?: number };

export const ClipScene: React.FC<{ clips: Clip[]; layout?: "square" | "tall" }> = ({ clips, layout = "square" }) => {
  const { fps, width, height } = useVideoConfig(); const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  let acc = 0;
  return <AbsoluteFill style={{ background: C.bg, opacity: fade }}>
    {clips.map((c, i) => {
      const start = acc, n = Math.round(c.dur * fps); acc += n;
      const sf = Math.round(c.from * fps);
      const v = (style: React.CSSProperties) => <OffthreadVideo src={staticFile(c.src)} startFrom={sf} muted style={{ position: "absolute", objectFit: "cover", ...style }} />;
      let fg: React.ReactNode;
      if (c.crop) {
        const bw = 1060, k = bw / c.crop[2], bh = c.crop[3] * k;
        fg = <div style={{ position: "absolute", left: 90, top: (height - bh) / 2 - 40, width: bw, height: bh, overflow: "hidden", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
          {v({ width: (c.sw ?? 478) * k, height: (c.sh ?? 850) * k, left: -c.crop[0] * k, top: -c.crop[1] * k })}</div>;
      } else if (layout === "square") fg = v({ left: 40, top: 20, width: 1040, height: 1040, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.6)" });
      else fg = v({ left: 150, top: 40, height: height - 80, width: (height - 80) * 9 / 16, borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.6)" });
      return <Sequence key={i} from={start} durationInFrames={n}>
        {v({ width: width * 1.1, height: height * 1.1, left: -width * .05, top: -height * .05, filter: "blur(40px) brightness(.3)" })}
        {fg}
      </Sequence>;
    })}
  </AbsoluteFill>;
};
