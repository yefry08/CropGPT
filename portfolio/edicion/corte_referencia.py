#!/usr/bin/env python3
"""Versión de 1 minuto a partir de entrada/referencia.mp4 (tu video de 2 min) con TU voz real.
Donde sales hablando de negro se tapa con entrada/fuente_blanco.mp4 (toma de blanco) o con
otros planos del mismo video. Subtítulos y rótulos en ASS, quemados con ffmpeg.
Uso: python3 corte_referencia.py  →  salida/final_vertical_1min_ref.mp4
"""
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
REF, FUE = HERE / "entrada/referencia.mp4", HERE / "entrada/fuente_blanco.mp4"
OUT = HERE / "salida/final_vertical_1min_ref.mp4"
W, H, FPS = 1080, 1920, 30

# (inicio, fin) del audio en referencia.mp4, en orden de montaje; visuales: (fuente, desde, dur, modo)
# R = referencia (vertical), F = fuente de blanco (cuadrada), modo "z" = plano más cerrado
SEG = [
    ((0.00, 3.90), [("R", 0.0, 3.90, "")]),                                   # Y el ganador es…
    ((15.45, 18.25), [("F", 0.0, 2.80, "")]),                                 # Mi nombre es Yefry Núñez,
    ((19.75, 22.30), [("F", 2.80, 2.55, "")]),                                # soy oriundo de San Antonio de Guerra,
    ((28.62, 30.82), [("F", 5.35, 2.20, "z")]),                               # me estoy postulando al PNJ
    ((35.50, 39.40), [("R", 37.4, 1.8, ""), ("R", 39.7, 2.1, "")]),           # primer y único dominicano… HackCorruption
    ((61.45, 71.15), [("R", 36.0, 1.2, ""), ("R", 41.8, 0.8, ""), ("F", 7.55, 7.7, "")]),  # OEA
    ((45.55, 55.20), [("R", 9.5, 1.25, ""), ("R", 12.0, 0.8, ""), ("R", 14.0, 0.75, ""), ("F", 8.0, 3.55, "z"),
                      ("R", 115.25, 2.35, ""), ("R", 119.0, 0.95, "")]),      # Billion Acts
    ((76.72, 84.80), [("R", 26.0, 3.1, ""), ("R", 117.6, 1.0, ""), ("R", 120.0, 1.2, ""), ("R", 9.6, 1.1, ""),
                      ("R", 4.0, 1.68, "")]),                                 # 3R VideoGame
    ((84.85, 98.00), [("F", 1.0, 6.5, "z"), ("R", 120.2, 2.2, ""), ("R", 4.4, 1.5, ""), ("R", 12.0, 0.75, ""),
                      ("R", 14.0, 0.75, ""), ("R", 115.3, 1.45, "")]),        # ITU
    ((116.82, 120.20), [("F", 12.0, 3.38, "")]),                              # les invito a conocer mi historia
]

# subtítulos: (segmento, desde_ref, hasta_ref, texto) — texto bien escrito, tiempos de la referencia
SUB = [
    (0, 0.0, 1.9, "Y el ganador es…"), (0, 1.9, 3.9, "¡Yefry Osvaldo Núñez Rubí!"),
    (1, 15.45, 18.25, "Mi nombre es Yefry Núñez,"),
    (2, 19.75, 22.3, "soy oriundo de San Antonio de Guerra"),
    (3, 28.62, 30.82, "y me estoy postulando al Premio Nacional de la Juventud."),
    (4, 35.5, 39.4, "Soy el primer y único dominicano ganador de HackCorruption."),
    (5, 61.45, 65.3, "Esta iniciativa también fue galardonada"), (5, 65.3, 68.5, "por la mismísima OEA"),
    (5, 68.5, 71.15, "como iniciativa destacada contra la corrupción."),
    (6, 45.55, 50.7, "Con este proyecto fui nombrado Billion Acts Fellow,"),
    (6, 50.7, 55.2, "una iniciativa de 14 ganadores del Premio Nobel de la Paz."),
    (7, 76.72, 79.6, "3R VideoGame, un videojuego de realidad virtual"),
    (7, 79.6, 84.8, "para enseñar a los niños sobre el cambio climático y cómo mitigarlo."),
    (8, 84.85, 89.8, "Con este videojuego fuimos nombrados por la Unión Internacional de Telecomunicaciones"),
    (8, 89.8, 93.7, "de las Naciones Unidas"), (8, 93.7, 98.0, "como una de las 20 mejores iniciativas de cambio digital."),
    (9, 116.82, 119.3, "Les invito a conocer mi historia."), (9, 119.3, 120.2, "Yefry Núñez."),
]
# rótulos grandes: (segmento, desde_seg, dur, línea1, línea2)
TIT = [
    (1, 0.3, 4.8, "YEFRY NÚÑEZ", "DOMINICANO · 27 AÑOS"),
    (3, 0.1, 2.1, "PREMIO NACIONAL", "DE LA JUVENTUD"),
    (4, 0.5, 3.3, "GANADOR", "HACKCORRUPTION · BOGOTÁ"),
    (5, 2.0, 7.5, "OEA", "INICIATIVA DESTACADA · CONTRACTOR AI"),
    (6, 0.5, 9.0, "BILLION ACTS FELLOW", "14 PREMIOS NOBEL DE LA PAZ"),
    (7, 0.3, 7.6, "3R VIDEOGAME", "REALIDAD VIRTUAL · ACCIÓN CLIMÁTICA"),
    (8, 4.0, 9.0, "TOP 20 MUNDIAL", "ITU · NACIONES UNIDAS"),
]

def t(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def main():
    starts, acc = [], 0.0
    for (a, b), _ in SEG: starts.append(acc); acc += b - a
    total = acc
    # ---- ASS ----
    ass = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Sub,DejaVu Sans,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,5,2,2,70,70,330,1",
        "Style: T1,DejaVu Sans,92,&H003AA7D4,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,6,3,8,60,60,190,1",
        "Style: T2,DejaVu Sans,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,1,0,1,4,2,8,60,60,305,1",
        "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for si, a, b, txt in SUB:
        s0 = starts[si] + a - SEG[si][0][0]; s1 = starts[si] + b - SEG[si][0][0]
        ass.append(f"Dialogue: 0,{t(s0)},{t(s1)},Sub,,0,0,0,,{{\\fad(80,80)}}{txt}")
    for si, a, d, l1, l2 in TIT:
        s0 = starts[si] + a; s1 = min(s0 + d, starts[si] + SEG[si][0][1] - SEG[si][0][0])
        ass.append(f"Dialogue: 1,{t(s0)},{t(s1)},T1,,0,0,0,,{{\\fad(200,200)}}{l1}")
        ass.append(f"Dialogue: 1,{t(s0 + .25)},{t(s1)},T2,,0,0,0,,{{\\fad(200,200)}}{l2}")
    (HERE / "trabajo/ref_sub.ass").write_text("\n".join(ass) + "\n", encoding="utf-8")
    # ---- vídeo ----
    f, labels, i = [], [], 0
    for _, vis in SEG:
        for src, a, d, mode in vis:
            inp = 0 if src == "R" else 1
            base = f"[{inp}:v]trim=start={a}:duration={d},setpts=PTS-STARTPTS,fps={FPS}"
            if src == "R":
                f.append(f"{base},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1[v{i}]")
            else:
                z = ",crop=iw*0.72:ih*0.72:iw*0.14:ih*0.06" if mode == "z" else ""
                f.append(f"{base}{z},split[a{i}][b{i}];"
                         f"[a{i}]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.12[bg{i}];"
                         f"[b{i}]scale={W}:{W}[fg{i}];[bg{i}][fg{i}]overlay=0:(H-h)/2-80,setsar=1[v{i}]")
            labels.append(f"[v{i}]"); i += 1
    f.append(f"{''.join(labels)}concat=n={i}:v=1:a=0,eq=contrast=1.05:saturation=1.08,"
             f"subtitles={HERE / 'trabajo/ref_sub.ass'}[vout]")
    # ---- audio: tu voz, cortes con micro fundidos ----
    al = []
    for k, ((a, b), _) in enumerate(SEG):
        f.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={b - a - 0.04:.3f}:d=0.04[x{k}]")
        al.append(f"[x{k}]")
    f.append(f"{''.join(al)}concat=n={len(SEG)}:v=0:a=1,highpass=f=80,afftdn=nf=-30,loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(REF), "-i", str(FUE), "-filter_complex", ";".join(f),
                    "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{total:.3f}", str(OUT)], check=True)
    print(f"{total:.1f} s → {OUT}")

if __name__ == "__main__":
    main()
