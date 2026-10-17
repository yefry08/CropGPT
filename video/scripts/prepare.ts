// Looks at assets/ and writes assets/manifest.json, which the composition and the .srt export read.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import type { Manifest, CaptureKey } from "../timeline.ts";

const A = new URL("../assets/", import.meta.url);
const has = (p: string) => existsSync(new URL(p, A));

function audioDuration(p: string): number {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", new URL(p, A).pathname]);
  return parseFloat(out.toString());
}

const keys: CaptureKey[] = ["home", "list", "filters", "anomalies", "detail", "sources"];
const status = has("captures/status.json") ? JSON.parse(readFileSync(new URL("captures/status.json", A), "utf8")) : null;
const captures = Object.fromEntries(
  keys.map((k) => [k, status?.ok && has(`captures/${k}.png`) ? `captures/${k}.png` : null]),
) as Manifest["captures"];

const m: Manifest = {
  narration: has("narration.mp3") ? { file: "narration.mp3", durationS: audioDuration("narration.mp3") } : null,
  narrationSceneBoundsS: has("narration.timings.json")
    ? JSON.parse(readFileSync(new URL("narration.timings.json", A), "utf8")).scenes
    : null,
  music: has("music.mp3") ? "music.mp3" : null,
  captures,
  liveFigures: status?.ok ? status.figures ?? null : null,
};
writeFileSync(new URL("manifest.json", A), JSON.stringify(m, null, 2) + "\n");
console.log("assets/manifest.json:", JSON.stringify(m));
