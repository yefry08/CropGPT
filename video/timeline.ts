// Turns config + script + assets/manifest.json into frame-accurate scenes and subtitle cues.
// Shared by the Remotion composition and scripts/srt.ts so the .srt files match the burned subtitles.
import { DURATION_S, FPS, SCENE_BOUNDS_S, SCRIPT_FIGURES } from "./config.ts";
import { SCENES } from "./script.ts";

export type Manifest = {
  narration: { file: string; durationS: number } | null;
  narrationSceneBoundsS: number[] | null; // optional, from assets/narration.timings.json
  music: string | null;
  captures: Record<CaptureKey, string | null>;
  liveFigures: Partial<typeof SCRIPT_FIGURES> | null;
};
export type CaptureKey = "home" | "list" | "filters" | "anomalies" | "detail" | "sources";

export type TimedCue = { scene: string; from: number; to: number; en: string; es: string; burn: boolean };
export type TimedScene = { id: string; from: number; to: number };

export const figures = (m: Manifest) => ({ ...SCRIPT_FIGURES, ...(m.liveFigures ?? {}) });

export const fmtInt = (n: number) => n.toLocaleString("en-US");

export function sceneBoundsS(m: Manifest): number[] {
  if (m.narrationSceneBoundsS && m.narrationSceneBoundsS.length === SCENE_BOUNDS_S.length) return m.narrationSceneBoundsS;
  const total = m.narration ? m.narration.durationS : DURATION_S;
  const base = SCENE_BOUNDS_S[SCENE_BOUNDS_S.length - 1];
  return SCENE_BOUNDS_S.map((s) => (s * total) / base);
}

export function buildTimeline(m: Manifest) {
  const bounds = sceneBoundsS(m);
  const f = figures(m);
  const fill = (s: string) =>
    s
      .replace("{countries}", String(f.countries))
      .replace("{contracts}", fmtInt(f.contracts))
      .replace("{anomalies}", fmtInt(f.anomalies))
      .replace("{historical}", String(f.historicalMillions));

  const scenes: TimedScene[] = [];
  const cues: TimedCue[] = [];
  SCENES.forEach((sc, i) => {
    const s0 = bounds[i], s1 = bounds[i + 1];
    scenes.push({ id: sc.id, from: Math.round(s0 * FPS), to: Math.round(s1 * FPS) });
    // Cues share the scene by text length, with a short lead-in and tail.
    const a = s0 + 0.3, b = s1 - 0.4;
    const w = sc.cues.map((c) => c.en.length + 15);
    const tot = w.reduce((x, y) => x + y, 0);
    let t = a;
    sc.cues.forEach((c, k) => {
      const d = ((b - a) * w[k]) / tot;
      cues.push({
        scene: sc.id,
        from: Math.round(t * FPS),
        to: Math.round((t + d) * FPS) - 2,
        en: fill(c.en),
        es: fill(c.es),
        burn: c.burn !== false,
      });
      t += d;
    });
  });
  return { scenes, cues, durationInFrames: Math.round(bounds[bounds.length - 1] * FPS) };
}
