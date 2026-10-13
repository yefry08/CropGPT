import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
// entrada con spring y salida suave en los últimos 8 fotogramas de la secuencia
export const useInOut = (delay = 0, outFrames = 8) => {
  const f = useCurrentFrame(), { fps, durationInFrames: d } = useVideoConfig();
  const inn = spring({ frame: f - delay, fps, config: { damping: 16, stiffness: 120, mass: .8 } });
  const out = interpolate(f, [d - outFrames, d], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { inn, out, f, fps, d, k: Math.min(inn, out) };
};
// Ken Burns: zoom lento a lo largo de la secuencia
export const useKenBurns = (from = 1.0, to = 1.08) => {
  const f = useCurrentFrame(), { durationInFrames: d } = useVideoConfig();
  return interpolate(f, [0, d], [from, to], { extrapolateRight: "clamp" });
};
