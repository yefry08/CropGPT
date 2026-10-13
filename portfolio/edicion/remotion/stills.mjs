// Fotogramas sueltos para revisión, con un solo empaquetado. Uso: node stills.mjs Horizontal 60,165,360 ../trabajo/stills/h
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [comp, frames, prefix] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: comp });
for (const f of frames.split(",").map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}_${String(f).padStart(4, "0")}.png` });
  process.stdout.write(f + " ");
}
console.log("ok");
