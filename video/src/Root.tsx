import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import { AbsoluteFill, Composition } from "remotion";
import { FPS, HEIGHT, WIDTH, BRAND } from "../config.ts";
import { buildTimeline, type Manifest } from "../timeline.ts";
import manifestJson from "../assets/manifest.json";
import { Pitch } from "./Pitch";

const manifest = manifestJson as Manifest;

// Smoke test for step 1: one scene, brand colors and type.
const TestScene = () => (
  <AbsoluteFill style={{ background: "#fff", justifyContent: "center", alignItems: "center", fontFamily: "Inter" }}>
    <div style={{ fontSize: 120, fontWeight: 800, background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`, WebkitBackgroundClip: "text", color: "transparent" }}>
      Render OK
    </div>
  </AbsoluteFill>
);

export const Root = () => (
  <>
    <Composition id="TestScene" component={TestScene} durationInFrames={FPS * 2} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition
      id="ContractorPitch"
      component={Pitch}
      durationInFrames={buildTimeline(manifest).durationInFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ manifest }}
    />
  </>
);
