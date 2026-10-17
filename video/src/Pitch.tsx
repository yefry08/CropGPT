import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { NARRATION_LANG } from "../config.ts";
import { buildTimeline, type Manifest, type TimedCue } from "../timeline.ts";
import { SCENE_COMPONENTS } from "./scenes";
import { INK } from "./ui";

const FADE = 12;

// Short fade plus a small upward slide in, fade out at the end.
const SceneShell: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = Math.min(interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [dur - FADE, dur], [1, 0], { extrapolateLeft: "clamp" }));
  const y = interpolate(f, [0, FADE + 6], [24, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};

const Subtitles: React.FC<{ cues: TimedCue[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues.find((c) => c.burn && f >= c.from && f <= c.to);
  if (!c) return null;
  const o = Math.min(interpolate(f, [c.from, c.from + 5], [0, 1]), interpolate(f, [c.to - 5, c.to], [1, 0]));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 56 }}>
      <div style={{ opacity: o, maxWidth: 1500, padding: "14px 30px", borderRadius: 14, background: "rgba(26,26,46,0.82)", color: "#fff", fontFamily: "Inter", fontSize: 40, fontWeight: 600, lineHeight: 1.3, textAlign: "center" }}>
        {c[NARRATION_LANG]}
      </div>
    </AbsoluteFill>
  );
};

export const Pitch: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const { scenes, cues } = buildTimeline(manifest);
  return (
    <AbsoluteFill style={{ background: "#ffffff", fontFamily: "Inter", color: INK }}>
      {scenes.map((s) => {
        const C = SCENE_COMPONENTS[s.id];
        const dur = s.to - s.from;
        const local = cues.filter((c) => c.scene === s.id).map((c) => ({ ...c, from: c.from - s.from, to: c.to - s.from }));
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={dur} name={s.id}>
            <SceneShell dur={dur}>
              <C dur={dur} cues={local} manifest={manifest} />
            </SceneShell>
          </Sequence>
        );
      })}
      <Subtitles cues={cues} />
      {manifest.narration && <Audio src={staticFile(manifest.narration.file)} />}
      {manifest.music && <Audio src={staticFile(manifest.music)} volume={manifest.narration ? 0.08 : 0.15} loop />}
    </AbsoluteFill>
  );
};
