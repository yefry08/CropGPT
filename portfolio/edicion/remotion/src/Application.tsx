import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";
import { NarrationBg } from "./comp/Scenes";
import { ClipScene } from "./comp/Broll";
import { ResourceEn } from "./comp/ResourceEn";
// Videos de postulación en inglés (horizontal), uno por timeline_<nombre>.json que escribe build_application.py.
// Narración continua, escenas visuales con tiempos absolutos y subtítulos por palabra (Whisper).
const KEY = /^(3r|videogame|contractor|ai|hackcorruption|itu|oas|swarovski|billion|acts|nobel|twenty|fourteen|climate|yefry|núñez|dalai|lama|compassion|transparency|solar|energy|nasa|power|clean|renewable)$/i;

const Subs: React.FC<{ T: any }> = ({ T }) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const ws: any[] = T.words;
  const chunks: any[][] = []; let cur: any[] = [];
  ws.forEach((w, i) => { cur.push(w); const gap = ws[i + 1] && ws[i + 1].s - w.e > .35;
    if (cur.length >= 7 || (/[.,;:!?]$/.test(w.w) && cur.length >= 3) || gap || i === ws.length - 1) { chunks.push(cur); cur = []; } });
  const c = chunks.find((c, i) => t >= c[0].s - .05 && t < Math.min(chunks[i + 1] ? chunks[i + 1][0].s - .05 : 1e9, c[c.length - 1].e + .5));
  if (!c) return null;
  return <div style={{ position: "absolute", left: 80, right: 80, top: 940, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 14px" }}>
    {c.map((w: any, i: number) => <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: 50, lineHeight: 1.25,
      color: KEY.test(w.w.replace(/[^\p{L}\d]/gu, "")) || /\d/.test(w.w) ? C.blue : C.white, WebkitTextStroke: "5px #000", paintOrder: "stroke fill",
      opacity: t >= w.s ? 1 : .55 }}>{w.w}</span>)}
  </div>;
};

export const Application: React.FC<{ tl: any; subs?: boolean }> = ({ tl: T, subs = true }) => {
  const { fps } = useVideoConfig(); const fr = (s: number) => Math.round(s * fps);
  return <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
    {T.scenes.map((sc: any, i: number) => <Sequence key={i} from={fr(sc.start)} durationInFrames={Math.max(1, fr(sc.dur))}>
      {sc.kind === "V" ? <ClipScene clips={sc.clips} layout={sc.layout} /> : <NarrationBg o="h" />}</Sequence>)}
    {T.resources.map((r: any, i: number) => <Sequence key={"r" + i} from={fr(r.s)} durationInFrames={Math.max(1, fr(r.e - r.s))}>
      <ResourceEn r={r} /></Sequence>)}
    {subs && <Subs T={T} />}
    {T.audio && <Audio src={staticFile(T.audio)} />}
    {T.music && <Audio src={staticFile(T.music)} volume={0.07} loop />}
  </AbsoluteFill>;
};
