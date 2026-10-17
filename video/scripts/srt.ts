// Writes out/subtitles.en.srt and out/subtitles.es.srt from the same timeline the video uses.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { FPS } from "../config.ts";
import { buildTimeline, type Manifest } from "../timeline.ts";

const m: Manifest = JSON.parse(readFileSync(new URL("../assets/manifest.json", import.meta.url), "utf8"));
const { cues } = buildTimeline(m);

const ts = (frame: number) => {
  const ms = Math.round((frame / FPS) * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

mkdirSync(new URL("../out/", import.meta.url), { recursive: true });
for (const lang of ["en", "es"] as const) {
  const body = cues.map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.to)}\n${c[lang]}\n`).join("\n");
  writeFileSync(new URL(`../out/subtitles.${lang}.srt`, import.meta.url), body);
}
console.log(`${cues.length} cues → out/subtitles.en.srt, out/subtitles.es.srt`);
