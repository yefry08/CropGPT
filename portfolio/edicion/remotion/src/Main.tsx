import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { C, FONT, Orient } from "./theme";
import tl from "./timeline.json";
import { CameraScene, NarrationBg } from "./comp/Scenes";
import { Resource } from "./comp/Resource";
import { Subtitles } from "./comp/Subtitles";

export const Main: React.FC<{ o: Orient }> = ({ o }) => {
  const { fps } = useVideoConfig(); const T = tl as any;
  const fr = (s: number) => Math.round(s * fps);
  return <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
    {T.scenes.map((sc: any) => <Sequence key={sc.id} from={fr(sc.start)} durationInFrames={Math.max(1, fr(sc.dur))}>
      {sc.kind === "C" ? <CameraScene sc={sc} o={o} /> : <NarrationBg o={o} />}</Sequence>)}
    {T.resources.map((r: any, i: number) => <Sequence key={i} from={fr(r.abs)} durationInFrames={Math.max(1, fr(r.e - r.s))}>
      <Resource r={r} o={o} /></Sequence>)}
    {T.scenes.map((sc: any) => <Sequence key={"s" + sc.id} from={fr(sc.start)} durationInFrames={Math.max(1, fr(sc.dur))}>
      <Subtitles sc={sc} o={o} /></Sequence>)}
  </AbsoluteFill>;
};
