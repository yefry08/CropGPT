#!/usr/bin/env python3
"""Versión de hasta 2 minutos:
  1) gancho «De Guerra a ser premiado… 14 premios Nobel» (de trabajo/vertical_1min.mp4 + trabajo/mezcla.wav)
  2) entrada/base_blanco.mp4 («En junio de 2026…»), cerrado con la toma entrada/fuente_blanco.mp4
  3) entrada/referencia.mp4 recortada con TU voz; las tomas de ropa negra se tapan con tomas de blanco
Uso: python3 corte_2min.py  →  salida/final_vertical_2min.mp4
"""
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
SRC = {"R": HERE / "entrada/referencia.mp4", "F": HERE / "entrada/fuente_blanco.mp4", "B": HERE / "entrada/base_blanco.mp4"}
HOOK_V, HOOK_A, HOOK_D = HERE / "trabajo/vertical_1min.mp4", HERE / "trabajo/mezcla.wav", 6.3
OUT = HERE / "salida/final_vertical_2min.mp4"
W, H, FPS = 1080, 1920, 30
IDX = {"R": 0, "F": 1, "B": 2}

# (fuente del audio, inicio, fin), [(fuente del plano, desde, dur, modo)]   modo "z" = plano más cerrado
SEG = [
    # --- 2) video base: la boca va con el audio ---
    (("B", 0.75, 10.95), [("B", 0.75, 10.2, "")]),                  # En junio de 2026… encendieran las alarmas…
    (("F", 9.35, 13.20), [("F", 9.35, 3.85, "")]),                   # yo ya había llevado a cabo un evento con +250 jóvenes
    # --- 3) video de referencia ---
    (("R", 0.00, 3.90), [("R", 0.0, 3.90, "")]),                     # Y el ganador es…
    (("R", 15.45, 18.25), [("B", 0.8, 2.8, "z")]),                   # Mi nombre es Yefry Núñez,
    (("R", 19.75, 22.30), [("B", 3.6, 2.55, "")]),                   # soy oriundo de San Antonio de Guerra,
    (("R", 22.55, 28.45), [("R", 9.5, 1.25, ""), ("R", 12.0, 0.8, ""), ("R", 14.0, 0.75, ""), ("B", 6.2, 3.1, "z")]),  # Costa del Faro…
    (("R", 28.42, 30.82), [("F", 0.0, 2.4, "z")]),                   # que me estoy postulando al PNJ
    (("R", 35.50, 44.95), [("R", 37.4, 1.8, ""), ("R", 39.7, 2.9, ""), ("F", 2.4, 4.75, "")]),  # HackCorruption
    (("R", 61.45, 71.15), [("R", 36.0, 1.2, ""), ("R", 41.8, 0.8, ""), ("B", 10.95, 2.1, ""), ("F", 7.15, 5.6, "z")]),  # OEA
    (("R", 45.55, 55.20), [("R", 115.25, 2.35, ""), ("R", 119.0, 1.0, ""), ("R", 12.0, 0.8, ""), ("R", 14.0, 0.75, ""),
                           ("B", 0.8, 4.75, "")]),                   # Billion Acts
    (("R", 76.72, 84.80), [("R", 26.0, 3.1, ""), ("R", 117.6, 1.0, ""), ("R", 120.0, 1.2, ""), ("R", 9.6, 1.1, ""),
                           ("R", 4.0, 1.68, "")]),                   # 3R VideoGame
    (("R", 84.85, 98.00), [("F", 0.0, 5.0, ""), ("R", 120.2, 2.2, ""), ("R", 4.4, 1.5, ""), ("B", 5.6, 3.0, "z"),
                           ("R", 115.3, 1.45, "")]),                 # ITU
    (("R", 98.25, 105.95), [("R", 14.0, 0.75, ""), ("R", 12.0, 0.8, ""), ("F", 12.75, 2.7, "z"), ("B", 8.6, 2.35, "z"),
                            ("R", 4.0, 1.1, "")]),                   # Osaka y Corea
    (("R", 106.25, 114.20), [("R", 119.0, 3.4, ""), ("R", 0.0, 2.0, ""), ("F", 5.0, 2.55, "z")]),  # gran candidato
    (("R", 116.82, 120.20), [("B", 6.0, 3.38, "")]),                 # les invito a conocer mi historia
]

# subtítulos: (segmento, desde, hasta, texto) en tiempos de la fuente del audio
SUB = [
    (0, 0.75, 3.5, "En junio de 2026,"), (0, 3.5, 8.4, "mucho antes de que Jacob Coxon, Sam Altman y Dario Amodei"),
    (0, 8.4, 10.95, "encendieran las alarmas sobre la inteligencia artificial,"),
    (1, 9.35, 13.2, "yo ya había llevado a cabo un evento con más de 250 jóvenes."),
    (2, 0.0, 1.9, "Y el ganador es…"), (2, 1.9, 3.9, "¡Yefry Osvaldo Núñez Rubí!"),
    (3, 15.45, 18.25, "Mi nombre es Yefry Núñez,"),
    (4, 19.75, 22.3, "soy oriundo de San Antonio de Guerra,"),
    (5, 22.55, 25.3, "pero desde hace más de 10 años resido en Costa del Faro"),
    (5, 25.3, 28.45, "y soy científico, emprendedor y programador"),
    (6, 28.42, 30.82, "que me estoy postulando al Premio Nacional de la Juventud."),
    (7, 35.5, 39.45, "Soy el primer y único dominicano ganador de HackCorruption,"),
    (7, 39.45, 44.95, "una iniciativa que impulsa soluciones para disminuir la corrupción en Latinoamérica y el mundo."),
    (8, 61.45, 65.3, "Esta iniciativa también fue galardonada"), (8, 65.3, 68.5, "por la mismísima OEA"),
    (8, 68.5, 71.15, "como iniciativa destacada contra la corrupción."),
    (9, 45.55, 50.7, "Con este proyecto fui nombrado Billion Acts Fellow,"),
    (9, 50.7, 55.2, "una iniciativa de 14 ganadores del Premio Nobel de la Paz."),
    (10, 76.72, 79.6, "3R VideoGame, un videojuego de realidad virtual"),
    (10, 79.6, 84.8, "para enseñar a los niños sobre el cambio climático y cómo mitigarlo."),
    (11, 84.85, 89.8, "Con este videojuego fuimos nombrados por la Unión Internacional de Telecomunicaciones"),
    (11, 89.8, 93.7, "de las Naciones Unidas"), (11, 93.7, 98.0, "como una de las 20 mejores iniciativas de cambio digital."),
    (12, 98.25, 101.9, "También fuimos invitados al Osaka Youth Summit, en Japón,"),
    (12, 101.9, 105.95, "y a la Cumbre Synergy, en Corea del Sur."),
    (13, 106.25, 110.3, "Por esto y más premios que hemos obtenido,"),
    (13, 110.3, 114.2, "creo que soy un gran candidato a este galardón."),
    (14, 116.82, 119.3, "Les invito a conocer mi historia."), (14, 119.3, 120.2, "Yefry Núñez."),
]
# rótulos: (segmento, desde_seg, dur, línea1, línea2)
TIT = [
    (1, 0.2, 3.6, "+250 JÓVENES", "EVENTO DE IA · JUNIO 2026"),
    (3, 0.3, 5.0, "YEFRY NÚÑEZ", "DOMINICANO · 27 AÑOS"),
    (6, 0.1, 2.3, "PREMIO NACIONAL", "DE LA JUVENTUD"),
    (7, 0.5, 4.0, "GANADOR", "HACKCORRUPTION · BOGOTÁ"),
    (8, 2.0, 7.5, "OEA", "INICIATIVA DESTACADA · CONTRACTOR AI"),
    (9, 0.5, 9.0, "BILLION ACTS FELLOW", "14 PREMIOS NOBEL DE LA PAZ"),
    (10, 0.3, 7.6, "3R VIDEOGAME", "REALIDAD VIRTUAL · ACCIÓN CLIMÁTICA"),
    (11, 4.0, 9.0, "TOP 20 MUNDIAL", "ITU · NACIONES UNIDAS"),
    (12, 0.5, 7.0, "ASIA", "OSAKA, JAPÓN · COREA DEL SUR"),
]

def t(x):
    h, r = divmod(max(0.0, x), 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def main():
    starts, acc = [], HOOK_D
    for (_, a, b), vis in SEG:
        assert abs(sum(v[2] for v in vis) - (b - a)) < 0.06, (a, b)
        starts.append(acc); acc += b - a
    total = acc
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
        o = starts[si] - SEG[si][0][1]
        ass.append(f"Dialogue: 0,{t(o + a)},{t(o + b)},Sub,,0,0,0,,{{\\fad(80,80)}}{txt}")
    for si, a, d, l1, l2 in TIT:
        s0 = starts[si] + a; s1 = min(s0 + d, starts[si] + SEG[si][0][2] - SEG[si][0][1])
        ass.append(f"Dialogue: 1,{t(s0)},{t(s1)},T1,,0,0,0,,{{\\fad(200,200)}}{l1}")
        ass.append(f"Dialogue: 1,{t(s0 + .25)},{t(s1)},T2,,0,0,0,,{{\\fad(200,200)}}{l2}")
    sub = HERE / "trabajo/sub_2min.ass"; sub.write_text("\n".join(ass) + "\n", encoding="utf-8")

    f, vl, al, i = [], [], [], 0
    # gancho (entrada 3 = vídeo, 4 = audio)
    f.append(f"[3:v]trim=duration={HOOK_D},setpts=PTS-STARTPTS,fps={FPS},scale={W}:{H},setsar=1,fade=t=out:st={HOOK_D - 0.25:.2f}:d=0.25[hv]")
    f.append(f"[4:a]atrim=duration={HOOK_D},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=out:st={HOOK_D - 0.3:.2f}:d=0.3[ha]")
    for _, vis in SEG:
        for src, a, d, mode in vis:
            base = f"[{IDX[src]}:v]trim=start={a}:duration={d},setpts=PTS-STARTPTS,fps={FPS}"
            if src == "R":
                f.append(f"{base},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1[v{i}]")
            else:   # tomas cuadradas: al centro sobre su propio fondo desenfocado
                z = ",crop=iw*0.72:ih*0.72:iw*0.14:ih*0.06" if mode == "z" else ""
                f.append(f"{base}{z},split[a{i}][b{i}];"
                         f"[a{i}]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.12[bg{i}];"
                         f"[b{i}]scale={W}:{W}[fg{i}];[bg{i}][fg{i}]overlay=0:(H-h)/2-80,setsar=1[v{i}]")
            vl.append(f"[v{i}]"); i += 1
    f.append(f"{''.join(vl)}concat=n={i}:v=1:a=0,eq=contrast=1.05:saturation=1.08[body]")
    f.append(f"[hv][body]concat=n=2:v=1:a=0,subtitles={sub}[vout]")
    for k, ((src, a, b), _) in enumerate(SEG):
        f.append(f"[{IDX[src]}:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,"
                 f"afade=t=in:d=0.03,afade=t=out:st={b - a - 0.04:.3f}:d=0.04[x{k}]")
        al.append(f"[x{k}]")
    f.append(f"{''.join(al)}concat=n={len(SEG)}:v=0:a=1,highpass=f=80,afftdn=nf=-30,loudnorm=I=-15.2:TP=-1.5:LRA=9[voz]")
    f.append("[ha][voz]concat=n=2:v=0:a=1[aout]")
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for s in ("R", "F", "B"): cmd += ["-i", str(SRC[s])]
    cmd += ["-i", str(HOOK_V), "-i", str(HOOK_A), "-filter_complex", ";".join(f), "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{total:.3f}", str(OUT)]
    subprocess.run(cmd, check=True)
    print(f"{total:.1f} s → {OUT}")

if __name__ == "__main__":
    main()
