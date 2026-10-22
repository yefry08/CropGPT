import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useInOut } from "./anim";
import { Kinetic, Label, Counter } from "./Text";
import { Badge } from "./Badge";
import { Contractor, VR, Medals, School, SolarHouse, Providers, Irradiance } from "./Drawings";
import { MapPanel, Globe } from "./MapPanel";
import { AwardList } from "./Extra";
// Rótulos en inglés para el video de la Swarovski Foundation (horizontal).
// Con plano recurso a la izquierda, los rótulos van en el panel derecho ("R").
type Box = { left: number; top: number; w: number; h: number };
// Panel derecho junto a la toma cuadrada del parque / la fuente.
const P: Box = { left: 1110, top: 40, w: 780, h: 860 };
const S: Record<string, Box> = {
  R: { left: 820, top: 120, w: 1000, h: 720 }, full: { left: 210, top: 90, w: 1500, h: 760 },
  A: { left: 140, top: 130, w: 780, h: 680 }, B: { left: 1000, top: 130, w: 780, h: 680 },
};
const Place: React.FC<{ b: Box; children: React.ReactNode }> = ({ b, children }) =>
  <div style={{ position: "absolute", left: b.left, top: b.top, width: b.w, height: b.h, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 18 }}>{children}</div>;

const Panel: React.FC<{ r: any }> = ({ r }) => {
  const { out } = useInOut(0, 10);
  switch (r.disparador as string) {
    case "name": return <div style={{ position: "absolute", left: P.left + 10, top: 640, opacity: out }}>
        <div style={{ background: C.white, padding: "12px 24px", display: "inline-block" }}><Kinetic text="YEFRY NÚÑEZ" size={62} color={C.bg} align="left" /></div><br />
        <div style={{ background: C.blue, color: C.white, fontFamily: FONT, fontWeight: 700, fontSize: 26, padding: "8px 24px", letterSpacing: 5, display: "inline-block" }}>DOMINICAN REPUBLIC · 27</div>
        <div style={{ marginTop: 18 }}><Label text="Software & AI developer" color={C.gold} size={28} delay={14} /></div></div>;
    case "3r": return <Place b={P}><VR w={600} label="REDUCE · REUSE · RECYCLE" /><Kinetic text="3R VIDEOGAME" size={84} color={C.green} delay={6} />
        <Label text="Virtual reality · climate education" color={C.white} size={26} delay={16} /></Place>;
    case "rrr": return <Place b={P}><Kinetic text="REDUCE" size={120} color={C.green} /><Kinetic text="REUSE" size={120} color={C.green} delay={10} /><Kinetic text="RECYCLE" size={120} color={C.green} delay={20} /></Place>;
    case "hackathon": return <Place b={P}><Badge title="WINNER" sub="Climate Change & Innovation Hackathon" color={C.green} size={420} />
        <Kinetic text="+ REGIONAL SEED FUNDING" size={46} color={C.gold} delay={40} /></Place>;
    case "contractor": return <Place b={P}><Contractor w={620} flagText="RISK" /><Kinetic text="CONTRACTOR AI" size={84} color={C.blue} delay={6} />
        <Label text="Flags unusual prices in public contracts" color={C.white} size={24} delay={14} /></Place>;
    case "ambition": return <Place b={P}><MapPanel w={760} h={560} labels={false} pins={["rd", "bogota", "salvador", "saopaulo"]} bbox={[[-95, -30], [-32, 25]]} color={C.green} arcs />
        <Kinetic text="CLASSROOMS ACROSS LATIN AMERICA" size={54} color={C.green} delay={10} /></Place>;
    case "compassion": return <Place b={P}><Label text="Dalai Lama Fellows" color={C.dim} size={30} />
        <Kinetic text="ETHICAL LEADERSHIP" size={84} delay={6} /><Kinetic text="WITH COMPASSION" size={84} color={C.gold} delay={30} />
        <Label text="Closer to the communities it serves" color={C.white} size={26} delay={60} /></Place>;
    case "perseverance": return <Place b={P}><Kinetic text="PERSEVERANCE" size={96} color={C.gold} />
        <Label text="Technology for people who are usually left out" color={C.white} size={26} delay={30} /></Place>;
    case "mission": return <Place b={P}><Kinetic text="AFFORDABLE" size={96} color={C.green} /><Kinetic text="RELIABLE" size={96} color={C.gold} delay={10} />
        <Kinetic text="RENEWABLE ENERGY" size={72} delay={20} /><Label text="Easier to access" color={C.white} size={28} delay={40} /></Place>;
    case "benergy": return <Place b={P}><SolarHouse w={560} /><Kinetic text="B ENERGY" size={96} color={C.gold} delay={6} />
        <Label text="Find the right solar provider for your needs and location" color={C.white} size={24} delay={16} /></Place>;
    case "experience": return <Place b={P}><div style={{ width: "100%", paddingLeft: 30 }}><AwardList color={C.green} size={44} every={60} items={[
        ["CLIMATE INNOVATION", "Hackathon winner · 3R VideoGame"], ["ENTREPRENEURSHIP", "Founder · Contractor AI"], ["TECHNOLOGY", "Software & AI developer"]]} /></div>
        <div style={{ marginTop: 30 }}><Kinetic text="PRACTICAL SOLUTIONS" size={60} color={C.gold} delay={150} /></div></Place>;
    case "who": return <Place b={P}><Kinetic text="LIMITED RESOURCES" size={70} /><Kinetic text="LIMITED TECHNICAL KNOWLEDGE" size={50} color={C.dim} delay={12} />
        <Kinetic text="MOST TO GAIN" size={96} color={C.green} delay={60} /></Place>;
    case "fortis": return <Place b={P}><Label text="Fortis Fellowship" color={C.dim} size={30} />
        <Kinetic text="HUMBLE BEGINNINGS" size={84} color={C.gold} delay={6} /><Kinetic text="ACROSS SECTORS & CONTINENTS" size={56} delay={40} /></Place>;
    case "giveback": return <Place b={P}><Kinetic text="GIVE BACK" size={120} color={C.green} />
        <Label text="AI for transparency · for others building their own path" color={C.white} size={24} delay={30} /></Place>;
    case "everyschool": return <Place b={P}><School w={560} en /><Label text="From award-winning project" color={C.dim} size={28} delay={8} />
        <Kinetic text="TO A TOOL EVERY SCHOOL CAN USE" size={66} color={C.green} delay={16} /></Place>;
  }
  return null;
};

export const ResourceEn: React.FC<{ r: any }> = ({ r }) => {
  const { out } = useInOut(0, 10);
  if (r.panel) return <Panel r={r} />;
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
    case "sunlight": return <Place b={S.full}><MapPanel w={1400} h={520} labels={false} pins={["rd", "bogota", "salvador", "saopaulo"]} bbox={[[-100, -35], [-30, 28]]} color={C.gold} />
        <Kinetic text="SUNLIGHT IS NOT THE PROBLEM" size={88} color={C.gold} delay={10} /></Place>;
    case "access": return <Place b={S.full}><Kinetic text="ACCESS IS" size={170} color={C.white} />
        <Label text="Households and small businesses don't know where to start" color={C.gold} size={34} delay={20} /></Place>;
    case "questions": return <Place b={S.full}><div style={{ width: "100%", paddingLeft: 260 }}><AwardList color={C.gold} size={66} every={55} items={[
        ["WHICH PROVIDER CAN I TRUST?", "Providers"], ["WHAT WILL IT REALLY COST?", "Budget"], ["WILL IT WORK WHERE I LIVE?", "Location"]]} /></div></Place>;
    case "nasapower": return <AbsoluteFill><Place b={S.A}><Irradiance w={720} /></Place>
        <Place b={S.B}><Label text="Prototype" color={C.dim} size={34} /><Kinetic text="NASA POWER" size={110} color={C.gold} delay={6} />
          <Kinetic text="+ GEOGRAPHIC SERVICES" size={56} color={C.blue} delay={20} /><Label text="Starting from the real conditions of each place" color={C.white} size={30} delay={40} /></Place></AbsoluteFill>;
    case "steps": return <Place b={S.full}><div style={{ display: "flex", gap: 50, alignItems: "center" }}>
        {[["1", "YOUR LOCATION", C.blue, 0], ["2", "YOUR NEEDS", C.gold, 25], ["3", "SOLAR RESOURCE", C.gold, 50]].map(([n, t, c, d]: any) =>
          <div key={n} style={{ textAlign: "center" }}><Kinetic text={n} size={120} color={c} delay={d} /><Label text={t} color={C.white} size={30} delay={d + 6} /></div>)}</div>
        <div style={{ marginTop: 40 }}><Providers w={900} /></div></Place>;
    case "next": return <Place b={S.full}><div style={{ width: "100%", paddingLeft: 260 }}><AwardList color={C.green} size={66} every={65} items={[
        ["ACCESSIBLE DIGITAL TOOLS", "Keep developing"], ["RENEWABLE ENERGY STAKEHOLDERS", "Collaborate"], ["INFORMED DECISIONS", "With communities"]]} /></div></Place>;
    case "close_be": return <Place b={S.full}><Kinetic text="CLEAN ENERGY" size={150} color={C.green} />
        <Kinetic text="EASIER TO UNDERSTAND" size={80} delay={20} /><Kinetic text="EASIER TO ADOPT" size={80} color={C.gold} delay={45} /></Place>;
    case "endcard": return <Place b={S.full}><Kinetic text="YEFRY NÚÑEZ" size={150} /><Label text={r.sub} color={C.green} size={40} delay={10} /></Place>;
    case "roots": return <Place b={S.full}><Kinetic text="SAN ANTONIO DE GUERRA" size={96} />
        <Label text="Raised by one parent · rural community · few opportunities" color={C.gold} size={32} delay={20} /></Place>;
    case "doortodoor": return <Place b={S.full}><Label text="I paid for university" color={C.dim} size={36} />
        <Kinetic text="SELLING DOOR TO DOOR" size={120} color={C.gold} delay={8} /><Label text="across the Dominican Republic" color={C.white} size={32} delay={30} /></Place>;
    case "journey": return <Place b={S.full}><div style={{ width: "100%", paddingLeft: 160 }}><AwardList color={C.gold} size={64} every={70} items={[
        ["FROM GUERRA", "Dominican Republic"], ["WINNER · HACKCORRUPTION", "Bogotá"], ["RECOGNIZED", "Organization of American States"], ["TOP 20 WORLDWIDE", "ITU · United Nations"]]} /></div></Place>;
    case "network": return <Place b={S.full}><Label text="People from backgrounds like mine" color={C.dim} size={36} />
        <Kinetic text="RARELY HAVE A NETWORK" size={110} delay={10} /><Kinetic text="TO TURN TO" size={110} color={C.gold} delay={30} /></Place>;
    case "mentors": return <Place b={S.full}><Kinetic text="MENTORS & PEERS" size={120} color={C.blue} />
        <Kinetic text="LASTING INSTITUTIONS" size={90} color={C.gold} delay={50} /><Label text="Government & public policy" color={C.white} size={32} delay={70} /></Place>;
    case "medellin": return <Place b={S.full}><MapPanel w={1300} h={520} labels={false} pins={["rd", "medellin"]} bbox={[[-90, -5], [-60, 22]]} color={C.gold} arcs />
        <Kinetic text="MEDELLÍN · JUNE 2027" size={90} color={C.gold} delay={10} /></Place>;
    case "opendata": return <Place b={S.full}><Label text="Public procurement data" color={C.dim} size={34} />
        <Kinetic text="OPEN BY LAW" size={140} color={C.blue} delay={6} /><Kinetic text="BUT TOO TECHNICAL" size={96} color={C.gold} delay={60} />
        <Label text="for small businesses and citizens" color={C.white} size={32} delay={80} /></Place>;
    case "ethics": return <Place b={S.full}><Label text="An ethical choice" color={C.dim} size={34} />
        <div style={{ display: "flex", gap: 60, alignItems: "center", marginTop: 20 }}>
          <div style={{ padding: "22px 44px", borderRadius: 999, border: `3px solid ${C.gold}`, background: `${C.gold}22` }}><Kinetic text="WARRANTS REVIEW" size={70} color={C.gold} delay={20} /></div>
          <div style={{ textDecoration: "line-through", textDecorationColor: C.red, textDecorationThickness: 6 }}><Kinetic text="VERDICT" size={70} color={C.dim} delay={40} /></div></div>
        <div style={{ marginTop: 50 }}><Kinetic text="A PERSON ALWAYS MAKES THE FINAL DECISION" size={64} delay={110} /></div></Place>;
    case "close_dl": return <Place b={S.full}><Kinetic text="TRANSPARENCY" size={140} color={C.blue} />
        <Kinetic text="SHOULD NOT DEPEND ON EXPENSIVE TOOLS" size={58} delay={20} /><Kinetic text="OR SPECIALIZED KNOWLEDGE" size={58} color={C.gold} delay={50} /></Place>;
  }
  return null;
};
