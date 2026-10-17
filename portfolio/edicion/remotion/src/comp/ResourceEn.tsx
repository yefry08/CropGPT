import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useInOut } from "./anim";
import { Kinetic, Label, Counter } from "./Text";
import { Badge } from "./Badge";
import { Contractor, VR, Medals, School } from "./Drawings";
import { MapPanel, Globe } from "./MapPanel";
// Rótulos en inglés para el video de la Swarovski Foundation (horizontal).
// Con plano recurso a la izquierda, los rótulos van en el panel derecho ("R").
type Box = { left: number; top: number; w: number; h: number };
const S: Record<string, Box> = {
  R: { left: 820, top: 120, w: 1000, h: 720 }, full: { left: 210, top: 90, w: 1500, h: 760 },
  A: { left: 140, top: 130, w: 780, h: 680 }, B: { left: 1000, top: 130, w: 780, h: 680 },
};
const Place: React.FC<{ b: Box; children: React.ReactNode }> = ({ b, children }) =>
  <div style={{ position: "absolute", left: b.left, top: b.top, width: b.w, height: b.h, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 18 }}>{children}</div>;

export const ResourceEn: React.FC<{ r: any }> = ({ r }) => {
  const { out } = useInOut(0, 10);
  switch (r.disparador as string) {
    case "name": return <div style={{ position: "absolute", left: 1200, top: 700, opacity: out }}>
        <div style={{ background: C.white, padding: "12px 26px", display: "inline-block" }}><Kinetic text="YEFRY NÚÑEZ" size={64} color={C.bg} align="left" /></div><br />
        <div style={{ background: C.blue, color: C.white, fontFamily: FONT, fontWeight: 700, fontSize: 30, padding: "8px 26px", letterSpacing: 6, display: "inline-block" }}>DOMINICAN REPUBLIC · 27</div></div>;
    case "town": return <Place b={S.R}><Kinetic text="FROM SAN ANTONIO DE GUERRA" size={64} /><Label text="Software & AI developer" color={C.gold} size={32} delay={12} /></Place>;
    case "pillars": return <Place b={S.full}><Kinetic text="CLIMATE ACTION" size={120} color={C.green} />
        <Kinetic text="TRANSPARENCY" size={120} color={C.blue} delay={14} /><Kinetic text="EDUCATION" size={120} color={C.gold} delay={28} /></Place>;
    case "3r": return <AbsoluteFill><Place b={S.A}><VR w={680} label="REDUCE · REUSE · RECYCLE" /></Place>
        <Place b={S.B}><Kinetic text="3R VIDEOGAME" size={104} color={C.green} delay={6} /><Label text="Virtual reality · climate education for children" color={C.white} size={30} delay={16} /></Place></AbsoluteFill>;
    case "rrr": return <Place b={S.R}><Kinetic text="REDUCE" size={120} color={C.green} /><Kinetic text="REUSE" size={120} color={C.green} delay={10} /><Kinetic text="RECYCLE" size={120} color={C.green} delay={20} /></Place>;
    case "itu": return <Place b={S.full}><Counter to={20} prefix="TOP " size={250} color={C.green} frames={30} />
        <Kinetic text="WORLDWIDE" size={110} delay={10} /><Label text="ITU · United Nations · SDGs Digital GameChangers Awards" color={C.dim} size={28} delay={18} /></Place>;
    case "hackathon": return <Place b={S.R}><Badge title="WINNER" sub="Climate Change & Innovation Hackathon" color={C.green} size={400} />
        <Kinetic text="+ REGIONAL SEED FUNDING" size={54} color={C.gold} delay={40} /></Place>;
    case "contractor": return <Place b={S.R}><Contractor w={620} flagText="RISK" /><Kinetic text="CONTRACTOR AI" size={88} color={C.blue} delay={6} />
        <Label text="AI that flags unusual prices in public contracts" color={C.white} size={28} delay={14} /></Place>;
    case "hackcorruption": return <Place b={S.full}><Badge title="WINNER" sub="HackCorruption · Bogotá" size={420} /><Kinetic text="FIRST DOMINICAN" size={60} color={C.gold} delay={24} /></Place>;
    case "oas": return <Place b={S.R}><Kinetic text="RECOGNIZED BY" size={70} /><Kinetic text="THE OAS" size={140} color={C.blue} delay={8} />
        <Label text="Organization of American States" color={C.white} size={30} delay={16} /></Place>;
    case "billion": return <AbsoluteFill><Place b={S.A}><Globe size={460} color={C.gold} /><Kinetic text="BILLION ACTS FELLOW" size={62} color={C.gold} delay={8} /></Place>
        <Place b={S.B}><Medals w={660} /><Label text="An initiative of" color={C.white} size={30} delay={20} /><Kinetic text="14 NOBEL PEACE PRIZE LAUREATES" size={60} color={C.gold} delay={26} /></Place></AbsoluteFill>;
    case "ambition": return <Place b={S.full}><MapPanel w={1500} h={600} labels={false} pins={["rd", "bogota", "salvador", "saopaulo"]} bbox={[[-100, -35], [-30, 28]]} color={C.green} arcs />
        <Kinetic text="CLASSROOMS ACROSS LATIN AMERICA" size={72} color={C.green} delay={10} /></Place>;
    case "everyschool": return <AbsoluteFill><Place b={S.A}><School w={640} en /></Place>
        <Place b={S.B}><Label text="From award-winning project" color={C.dim} size={34} /><Kinetic text="TO A TOOL EVERY SCHOOL CAN USE" size={86} color={C.green} delay={14} /></Place></AbsoluteFill>;
    case "close": return <Place b={S.full}><Kinetic text="CREATIVITY + TECHNOLOGY" size={110} />
        <Kinetic text="SUSTAINABILITY EVERY CHILD CAN EXPERIENCE" size={60} color={C.green} delay={24} /></Place>;
    case "endcard": return <Place b={S.full}><Kinetic text="YEFRY NÚÑEZ" size={150} /><Label text="3R VideoGame · Dominican Republic" color={C.green} size={40} delay={10} /></Place>;
  }
  return null;
};
