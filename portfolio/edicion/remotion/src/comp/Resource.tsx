import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { C, FONT, Orient, colorOf } from "../theme";
import { useInOut } from "./anim";
import { Kinetic, Label, Counter } from "./Text";
import { Badge } from "./Badge";
import { Contractor, VR, Papers, Bootcamp, Medals } from "./Drawings";
import { MapPanel, Globe } from "./MapPanel";

// Dónde va cada recurso. En narración: A (izq./arriba), B (der./abajo) o full. En cámara: paneles laterales
// (horizontal) o franja superior (vertical) — nunca encima de la cara.
type Box = { left: number; top: number; w: number; h: number };
const slot = (o: Orient, s: string): Box => {
  if (o === "h") return ({
    A: { left: 120, top: 150, w: 800, h: 640 }, B: { left: 1000, top: 150, w: 800, h: 640 }, full: { left: 260, top: 110, w: 1400, h: 720 },
    sideL: { left: 30, top: 140, w: 370, h: 700 }, sideR: { left: 1520, top: 140, w: 370, h: 700 }, all: { left: 0, top: 0, w: 1920, h: 1080 },
  } as any)[s];
  return ({
    A: { left: 90, top: 260, w: 900, h: 640 }, B: { left: 90, top: 960, w: 900, h: 600 }, full: { left: 60, top: 300, w: 960, h: 1200 },
    sideL: { left: 60, top: 40, w: 960, h: 360 }, sideR: { left: 60, top: 40, w: 960, h: 360 }, all: { left: 0, top: 0, w: 1080, h: 1920 },
  } as any)[s];
};
const Place: React.FC<{ b: Box; children: React.ReactNode; center?: boolean }> = ({ b, children, center = true }) =>
  <div style={{ position: "absolute", left: b.left, top: b.top, width: b.w, height: b.h, display: "flex", flexDirection: "column",
    alignItems: center ? "center" : "flex-start", justifyContent: "center", gap: 18 }}>{children}</div>;

export const Resource: React.FC<{ r: any; o: Orient }> = ({ r, o }) => {
  const { width } = useVideoConfig(); const col = colorOf(r.color); const v = o === "v";
  const { out } = useInOut(0, 10);
  const key = r.disparador as string;
  switch (key) {
    case "De Guerra": { const b = slot(o, "A");
      return <Place b={b}><Kinetic text="DE GUERRA" size={v ? 150 : 176} /><Kinetic text="A SER PREMIADO" size={v ? 84 : 76} color={C.dim} delay={12} weight={800} /></Place>; }
    case "catorce premios Nobel": { const b = slot(o, "B");
      return <Place b={b}><Medals w={b.w * .86} /><Label text="Una iniciativa de" color={C.white} size={v ? 34 : 30} delay={8} />
        <Kinetic text="14 PREMIOS NOBEL DE LA PAZ" size={v ? 76 : 68} color={C.gold} delay={12} /></Place>; }
    case "Yefry Núñez": {
      const s = v ? { left: 60, top: 1525 } : { left: 40, top: 760 };
      return <div style={{ position: "absolute", ...s, opacity: out }}>
        <div style={{ background: C.white, color: C.bg, fontFamily: FONT, fontWeight: 900, fontSize: v ? 52 : 46, padding: "10px 22px", letterSpacing: 1 }}>
          <Kinetic text="YEFRY NÚÑEZ" size={v ? 52 : 46} color={C.bg} /></div>
        <div style={{ background: C.blue, color: C.white, fontFamily: FONT, fontWeight: 700, fontSize: v ? 28 : 26, padding: "6px 22px", letterSpacing: 6, display: "inline-block" }}>DOMINICANO · 27 AÑOS</div>
      </div>; }
    case "Premio Nacional de la Juventud": { const b = slot(o, "sideR");
      return <Place b={b}><Badge title="PREMIO NACIONAL" sub="de la Juventud" size={v ? 250 : 320} /></Place>; }
    case "Contractor AI": { const b = slot(o, "full");
      return <Place b={b}><Contractor w={b.w * (v ? .95 : .62)} /><Kinetic text="CONTRACTOR AI" size={v ? 92 : 84} color={C.blue} delay={6} />
        <Label text="Inteligencia artificial contra la corrupción" color={C.white} size={v ? 30 : 30} delay={14} /></Place>; }
    case "HackCorruption": {
      return <AbsoluteFill>
        <Place b={v ? slot(o, "A") : slot(o, "A")}><Badge title="GANADOR" sub="HackCorruption" size={v ? 420 : 430} /></Place>
        <div style={{ position: "absolute", ...(v ? { left: 60, top: 980 } : { left: 980, top: 160 }) }}>
          <MapPanel w={v ? 960 : 860} h={v ? 620 : 700} pins={["bogota"]} bbox={[[-82, -5], [-66, 13]]} color={C.gold} /></div>
      </AbsoluteFill>; }
    case "Billion Acts Fellow": { const b = slot(o, "full");
      return <Place b={b}><Globe size={v ? 620 : 480} color={C.gold} /><Kinetic text="BILLION ACTS FELLOW" size={v ? 84 : 92} color={C.gold} delay={8} /></Place>; }
    case "3R VideoGame": { const b = slot(o, "A");
      return <Place b={b}><VR w={b.w * .82} /><Label text="3R VideoGame · realidad virtual" color={C.green} size={v ? 32 : 30} delay={10} /></Place>; }
    case "top 20 mundial": { const b = slot(o, "B");
      return <Place b={b}><Counter to={20} prefix="TOP " size={v ? 210 : 220} color={C.green} frames={30} />
        <Kinetic text="MUNDIAL" size={v ? 110 : 110} color={C.white} delay={10} /><Label text="ITU SDGs Digital GameChangers" color={C.dim} size={v ? 30 : 28} delay={18} /></Place>; }
    case "NeurIPS 2026": { const b = slot(o, "A");
      return <Place b={b}><Papers w={b.w * .86} /><Kinetic text="NEURIPS 2026" size={v ? 92 : 88} color={C.blue} delay={6} />
        <Label text="Revisor científico" color={C.white} size={v ? 32 : 30} delay={14} /></Place>; }
    case "Kenia": { const b = slot(o, "B");
      return <Place b={b}><MapPanel w={b.w} h={b.h * .82} pins={["kenia", "uganda"]} bbox={[[24, -10], [44, 8]]} color={C.blue} title="PAPERS ACEPTADOS" /></Place>; }
    case "El Salvador": { const b = slot(o, "full");
      return <Place b={b}><MapPanel w={b.w} h={b.h * .92} pins={["rd", "salvador", "saopaulo"]} bbox={[[-95, -28], [-35, 22]]} color={C.gold} arcs /></Place>; }
    case "junio de 2026": {
      return <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center", opacity: out }}>
        <Kinetic text="JUNIO" size={v ? 230 : 240} /><Counter to={2026} size={v ? 230 : 240} color={C.blue} frames={24} />
      </AbsoluteFill>; }
    case "250 jóvenes": {
      const bL = slot(o, "sideL"), bR = slot(o, "sideR");
      if (v) return <Place b={bL}><div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Counter to={250} prefix="+" size={170} color={C.blue} frames={36} /><div><Kinetic text="JÓVENES" size={70} align="left" /><Label text="AI Safety Bootcamp" size={26} delay={14} /></div></div></Place>;
      return <><Place b={bL}><Bootcamp w={bL.w} /><Label text="AI Safety Bootcamp" size={24} delay={14} /></Place>
        <Place b={bR}><Counter to={250} prefix="+" size={170} color={C.blue} frames={36} /><Kinetic text="JÓVENES" size={74} delay={10} /></Place></>; }
    case "inteligencia artificial, puedan": { const b = slot(o, v ? "sideR" : "sideL");
      return <Place b={b}><Kinetic text="FUTURO DEL TRABAJO" size={v ? 70 : 54} /><Kinetic text="IA SEGURA" size={v ? 92 : 74} color={C.blue} delay={10} /></Place>; }
    case "Tecnología con propósito": {
      return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24, padding: 60, paddingBottom: v ? 260 : 170 }}>
        <MapPanel w={v ? 960 : 1300} h={v ? 780 : 500} pins={["rd", "bogota", "salvador", "saopaulo", "kenia", "uganda"]} bbox={[[-95, -28], [45, 22]]} color={C.gold} arcs />
        <Kinetic text="TECNOLOGÍA CON PROPÓSITO" size={v ? 76 : 84} />
        <Kinetic text="IMPACTO GLOBAL DESDE REPÚBLICA DOMINICANA" size={v ? 40 : 40} color={C.gold} delay={30} weight={800} />
      </AbsoluteFill>; }
  }
  return null;
};
