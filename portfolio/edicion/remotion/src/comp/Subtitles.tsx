import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, Orient } from "../theme";
import tl from "../timeline.json";
// Subtítulos desde guion.txt, cronometrados con Whisper. Blancos con borde negro, abajo al centro;
// las palabras de los disparadores (y las cifras) en azul eléctrico.
const norm = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const KEY = new Set<string>(((tl as any).resources as any[]).flatMap(r => r.disparador.split(" ").map(norm)).filter(k => k.length > 2 && !["con", "por", "una", "las", "los", "del", "que"].includes(k)));
const chunks = (words: any[], max = 7) => {
  const out: any[][] = []; let cur: any[] = [];
  words.forEach((w, i) => { cur.push(w); if (cur.length >= max || /[.,;:!?]$/.test(w.w) && cur.length >= 3 || i === words.length - 1) { out.push(cur); cur = []; } });
  return out;
};
export const Subtitles: React.FC<{ sc: any; o: Orient }> = ({ sc, o }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const cs = chunks(sc.words, o === "v" ? 5 : 7);
  const cur = cs.find((c, i) => t >= c[0].s - .05 && t < (cs[i + 1] ? cs[i + 1][0].s - .05 : c[c.length - 1].e + .6));
  if (!cur) return null;
  const size = o === "v" ? 58 : 52;
  const top = o === "v" ? (sc.kind === "C" ? 1700 : 1640) : 930;
  return <div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * .28}px` }}>
    {cur.map((w: any, i: number) => {
      const key = KEY.has(norm(w.w)) || /\d/.test(w.w);
      const said = t >= w.s;
      return <span key={i} style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color: key ? C.blue : C.white,
        WebkitTextStroke: `${size * .1}px #000`, paintOrder: "stroke fill", opacity: said ? 1 : .55, lineHeight: 1.25 }}>{w.w}</span>;
    })}
  </div>;
};
