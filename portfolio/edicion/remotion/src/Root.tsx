import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import tl from "./timeline.json";
import { Application } from "./Application";
import sw from "./timeline_swarovski.json";
import dl from "./timeline_dalailama.json";
import ft from "./timeline_fortis.json";
import be from "./timeline_benergy.json";

const frames = Math.ceil((tl as any).total * 30);
export const Root: React.FC = () => (
  <>
    <Composition id="Horizontal" component={Main} durationInFrames={frames} fps={30} width={1920} height={1080} defaultProps={{ o: "h" as const }} />
    <Composition id="Vertical" component={Main} durationInFrames={frames} fps={30} width={1080} height={1920} defaultProps={{ o: "v" as const }} />
    <Composition id="Swarovski" component={Application} durationInFrames={Math.ceil((sw as any).total * 30)} fps={30} width={1920} height={1080} defaultProps={{ tl: sw }} />
    <Composition id="DalaiLama" component={Application} durationInFrames={Math.ceil((dl as any).total * 30)} fps={30} width={1920} height={1080} defaultProps={{ tl: dl }} />
    <Composition id="Fortis" component={Application} durationInFrames={Math.ceil((ft as any).total * 30)} fps={30} width={1920} height={1080} defaultProps={{ tl: ft }} />
    <Composition id="BEnergy" component={Application} durationInFrames={Math.ceil((be as any).total * 30)} fps={30} width={1920} height={1080} defaultProps={{ tl: be }} />
  </>
);
