import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { C, FONT, Orient, colorOf } from "../theme";
import { useInOut } from "./anim";
import { Kinetic, Label, Counter } from "./Text";
import { Badge } from "./Badge";
import { Contractor, VR, Papers, Bootcamp, Medals, School } from "./Drawings";
import { AwardList } from "./Extra";
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
  const v = o === "v";
  const { out } = useInOut(0, 10);
  const B = (s: string) => slot(o, s);
  const map = (pins: string[], bbox: any, color: string, title?: string, arcs = false) => { const b = B("full");
    return <Place b={b}><MapPanel w={b.w} h={b.h * (v ? .75 : .86)} pins={pins} bbox={bbox} color={color} arcs={arcs} title={title} /></Place>; };
  switch (r.disparador as string) {
    case "De Guerra": return <Place b={B("A")}><Kinetic text="DE GUERRA" size={v ? 150 : 176} /><Kinetic text="A SER PREMIADO" size={v ? 84 : 76} color={C.dim} delay={12} weight={800} /></Place>;
    case "catorce premios Nobel": { const b = B("B");
      return <Place b={b}><Medals w={b.w * .86} /><Label text="Una iniciativa de" color={C.white} size={v ? 34 : 30} delay={8} />
        <Kinetic text="14 PREMIOS NOBEL DE LA PAZ" size={v ? 76 : 68} color={C.gold} delay={12} /></Place>; }
    case "Yefry Núñez": {
      const s = v ? { left: 60, top: 1525 } : { left: 40, top: 760 };
      return <div style={{ position: "absolute", ...s, opacity: out }}>
        <div style={{ background: C.white, padding: "10px 22px" }}><Kinetic text="YEFRY NÚÑEZ" size={v ? 52 : 46} color={C.bg} /></div>
        <div style={{ background: C.blue, color: C.white, fontFamily: FONT, fontWeight: 700, fontSize: v ? 28 : 26, padding: "6px 22px", letterSpacing: 6, display: "inline-block" }}>DOMINICANO · 27 AÑOS</div></div>; }
    case "Premio Nacional de la Juventud": return <Place b={B("sideR")}><Badge title="PREMIO NACIONAL" sub="de la Juventud" size={v ? 250 : 320} /></Place>;
    case "Todo empezó": return <Place b={B("full")}><Kinetic text="¿Y SI LA IA" size={v ? 110 : 120} /><Kinetic text="VIGILARA EL DINERO PÚBLICO?" size={v ? 76 : 90} color={C.blue} delay={14} /></Place>;
    case "Contractor AI": { const b = B("full");
      return <Place b={b}><Contractor w={b.w * (v ? .95 : .6)} /><Kinetic text="CONTRACTOR AI" size={v ? 92 : 84} color={C.blue} delay={6} />
        <Label text="Inteligencia artificial contra la corrupción" color={C.white} size={30} delay={14} /></Place>; }
    case "HackCorruption": return <AbsoluteFill>
        <Place b={B("A")}><Badge title="GANADOR" sub="HackCorruption · Bogotá" size={v ? 400 : 420} /><Kinetic text="PRIMER DOMINICANO" size={v ? 54 : 46} color={C.gold} delay={30} /></Place>
        <div style={{ position: "absolute", ...(v ? { left: 60, top: 1000 } : { left: 980, top: 160 }) }}>
          <MapPanel w={v ? 960 : 860} h={v ? 600 : 700} pins={["bogota"]} bbox={[[-82, -5], [-66, 13]]} color={C.gold} /></div></AbsoluteFill>;
    case "la OEA preseleccionó": return <Place b={B("full")}><div style={{ display: "flex", gap: v ? 60 : 140, alignItems: "flex-end" }}>
        <div style={{ textAlign: "center" }}><Counter to={15} size={v ? 220 : 240} color={C.blue} /><Label text="experiencias" color={C.white} size={30} delay={10} /></div>
        <div style={{ textAlign: "center" }}><Counter to={12} size={v ? 220 : 240} color={C.blue} delay={10} /><Label text="países" color={C.white} size={30} delay={18} /></div></div>
        <Kinetic text="PRESELECCIONADO POR LA OEA" size={v ? 58 : 62} delay={20} /><Label text="Desafío de Datos para la Democracia · 2026" color={C.dim} size={26} delay={28} /></Place>;
    case "3R VideoGame": { const b = B("A"); return <Place b={b}><VR w={b.w * .82} /><Label text="3R VideoGame · realidad virtual" color={C.green} size={30} delay={10} /></Place>; }
    case "Climate Change and Innovation Hackathon": return <Place b={B("B")}><Badge title="GANADOR" sub="Climate Change & Innovation Hackathon" color={C.green} size={v ? 360 : 380} /></Place>;
    case "Ready Recycling": { const b = B("A"); return <Place b={b}><School w={b.w * .82} /><Kinetic text="READY RECYCLING" size={v ? 70 : 62} color={C.green} delay={8} /></Place>; }
    case "capital semilla": return <Place b={B("B")}><Kinetic text="CAPITAL SEMILLA" size={v ? 92 : 88} color={C.gold} /><Label text="regional · para los dos proyectos" color={C.white} size={30} delay={12} /></Place>;
    case "top 20 mundial": return <Place b={B("full")}><Counter to={20} prefix="TOP " size={v ? 230 : 250} color={C.green} frames={30} />
        <Kinetic text="MUNDIAL" size={110} delay={10} /><Label text="ITU SDGs Digital GameChangers Awards" color={C.dim} size={28} delay={18} /></Place>;
    case "Climathon": return <Place b={B("A")}><Badge title="3.er LUGAR" sub="Climathon República Dominicana" color={C.green} size={v ? 360 : 380} /></Place>;
    case "dos veces": return <Place b={B("B")}><Badge title="2× GANADOR" sub="BCIE · Transición Verde" color={C.green} size={v ? 360 : 380} /></Place>;
    case "Billion Acts Fellow": return <Place b={B("A")}><Globe size={v ? 460 : 420} color={C.gold} /><Kinetic text="BILLION ACTS FELLOW" size={v ? 70 : 64} color={C.gold} delay={8} /></Place>;
    case "cinco mil dólares": return <Place b={B("B")}><Counter to={5000} prefix="US$" size={v ? 170 : 160} color={C.gold} frames={36} /><Label text="beca Billion Acts" color={C.white} size={30} delay={12} /></Place>;
    case "Joven Emprendedor del Año": { const b = B("full");
      return <Place b={b} center={false}><div style={{ width: "100%", paddingLeft: v ? 20 : 120 }}><AwardList color={C.gold} size={v ? 54 : 58} every={56} items={[
        ["JOVEN EMPRENDEDOR DEL AÑO", "Santo Domingo Este · 2025"], ["2.º LUGAR · I+D LAB", "INDOTEL"], ["FINALISTA", "PROMIPYME Emprende"], ["RECONOCIMIENTO", "Organización de los Estados Americanos"]]} /></div></Place>; }
    case "International Youth Award": return <Place b={B("A")}><Badge title="INTERNATIONAL YOUTH AWARD" sub="IINTAD · 2026" size={v ? 380 : 400} /></Place>;
    case "octava Cumbre": return <Place b={B("B")}><Kinetic text="FINALISTA" size={v ? 110 : 110} color={C.gold} />
        <Label text="VIII Cumbre Internacional por la Juventud y la Democracia" color={C.white} size={v ? 30 : 26} delay={10} /></Place>;
    case "Dominicana en Asia": return map(["rd", "bogota", "saopaulo", "espana", "kenia", "osaka", "corea", "bangkok"], [[-100, -40], [145, 62]], C.gold, "4 CONTINENTES", true);
    case "En Asia": return map(["osaka", "corea", "bangkok"], [[92, 5], [142, 42]], C.gold, "ASIA");
    case "En Europa": return map(["espana", "reinounido"], [[-12, 34], [12, 58]], C.gold, "EUROPA");
    case "En África": return map(["kenia", "uganda"], [[24, -10], [44, 8]], C.blue, "PAPERS ACEPTADOS · OPEN DATA SUMMIT 2025");
    case "en América": return map(["rd", "bogota", "saopaulo"], [[-90, -28], [-35, 22]], C.gold, "AMÉRICA", true);
    case "NeurIPS 2026": { const b = B("full");
      return <Place b={b}><Papers w={b.w * (v ? .9 : .55)} /><Kinetic text="NEURIPS 2026" size={v ? 96 : 92} color={C.blue} delay={6} /><Label text="Revisor científico" color={C.white} size={32} delay={14} /></Place>; }
    case "estancias de investigación": return map(["rd", "salvador", "saopaulo"], [[-95, -28], [-35, 22]], C.blue, "ESTANCIAS DE INVESTIGACIÓN", true);
    case "AI Safety Dominicana": { const b = B("full");
      return <Place b={b}><Bootcamp w={b.w * (v ? .9 : .5)} /><Kinetic text="AI SAFETY DOMINICANA" size={v ? 70 : 80} color={C.blue} delay={8} />
        <Label text="IA segura, gobernada y responsable" color={C.white} size={30} delay={16} /></Place>; }
    case "junio de 2026": return <Place b={B(v ? "sideR" : "sideL")}><Kinetic text="JUNIO" size={v ? 120 : 96} /><Counter to={2026} size={v ? 120 : 96} color={C.blue} frames={24} /></Place>;
    case "250 jóvenes": {
      const bL = B("sideL"), bR = B("sideR");
      if (v) return <Place b={bL}><div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Counter to={250} prefix="+" size={170} color={C.blue} frames={36} /><div><Kinetic text="JÓVENES" size={70} align="left" /><Label text="AI Safety Bootcamp" size={26} delay={14} /></div></div></Place>;
      return <><Place b={bL}><Bootcamp w={bL.w} /><Label text="AI Safety Bootcamp" size={24} delay={14} /></Place>
        <Place b={bR}><Counter to={250} prefix="+" size={170} color={C.blue} frames={36} /><Kinetic text="JÓVENES" size={74} delay={10} /></Place></>; }
    case "Por eso quiero": return <Place b={B("full")}><Kinetic text="QUIERO GANAR ESTE PREMIO" size={v ? 96 : 104} /><Kinetic text="PARA PREPARAR A LOS JÓVENES" size={v ? 70 : 74} color={C.gold} delay={30} /></Place>;
    case "inteligencia artificial, puedan": return <Place b={B("full")}><Kinetic text="FUTURO DEL TRABAJO" size={v ? 92 : 100} /><Kinetic text="IA SEGURA" size={v ? 130 : 140} color={C.blue} delay={10} /></Place>;
    case "Tecnología con propósito": return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24, padding: 60, paddingBottom: v ? 260 : 170 }}>
        <MapPanel w={v ? 980 : 1500} h={v ? 640 : 520} labels={false} pins={["rd", "bogota", "salvador", "saopaulo", "kenia", "uganda", "osaka", "corea", "bangkok", "espana", "reinounido"]}
          bbox={[[-100, -35], [145, 58]]} color={C.gold} arcs />
        <Kinetic text="TECNOLOGÍA CON PROPÓSITO" size={v ? 76 : 84} />
        <Kinetic text="IMPACTO GLOBAL DESDE REPÚBLICA DOMINICANA" size={40} color={C.gold} delay={30} weight={800} /></AbsoluteFill>;
  }
  return null;
};
