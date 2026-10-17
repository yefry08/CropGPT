import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import tl from "./timeline.json";
import { Swarovski } from "./Swarovski";
import sw from "./timeline_sw.json";

const frames = Math.ceil((tl as any).total * 30);
export const Root: React.FC = () => (
  <>
    <Composition id="Horizontal" component={Main} durationInFrames={frames} fps={30} width={1920} height={1080} defaultProps={{ o: "h" as const }} />
    <Composition id="Vertical" component={Main} durationInFrames={frames} fps={30} width={1080} height={1920} defaultProps={{ o: "v" as const }} />
    <Composition id="Swarovski" component={Swarovski} durationInFrames={Math.ceil((sw as any).total * 30)} fps={30} width={1920} height={1080} />
  </>
);
