#!/usr/bin/env python3
"""Versión de hasta 2 minutos (renglón Superación y Logros Personales):
  1) gancho «De Guerra a ser premiado… 14 premios Nobel» (trabajo/vertical_1min.mp4 + trabajo/mezcla.wav)
  2) entrada/referencia.mp4 recortada con TU voz; las tomas de ropa negra se tapan con la toma base de blanco,
     planos limpios del mismo video y gráficos animados sin subtítulos
  3) frases con tu voz clonada (trabajo/extra/X1.wav, X2.wav): categoría y NeurIPS / El Salvador
  4) casi al final, entrada/base_blanco.mp4 («En junio de 2026…», evento de seguridad en IA)
Uso: python3 corte_2min.py  →  salida/final_vertical_2min.mp4
"""
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
VID = {"R": "entrada/referencia.mp4", "F": "entrada/fuente_blanco.mp4", "B": "entrada/base_blanco.mp4",
       "G": "trabajo/graficos_sinsub.mp4", "E": "trabajo/graficos_extra.mp4"}
AUD = {"X1": "trabajo/extra/X1.wav", "X2": "trabajo/extra/X2.wav"}
HOOK_V, HOOK_A, HOOK_D = "trabajo/vertical_1min.mp4", "trabajo/mezcla.wav", 6.3
OUT = HERE / "salida/final_vertical_2min.mp4"
W, H, FPS = 1080, 1920, 30

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(HERE / p)]))

def segs():
    d1, d2 = dur(AUD["X1"]), dur(AUD["X2"])
    # cada segmento: audio (fuente, inicio, fin) · planos [(fuente, desde, dur, modo)] · subtítulos [(desde, hasta, texto)]
    # en tiempos de la fuente del audio · rótulo opcional (desde_seg, dur, línea1, línea2).  modo: "" | "z" cerrado | "blur" fondo
    return [
        (("R", 0.00, 3.90), [("R", 0.0, 3.90, "")],
         [(0.0, 1.9, "Y el ganador es…"), (1.9, 3.9, "¡Yefry Osvaldo Núñez Rubí!")], None),
        (("R", 15.45, 18.25), [("B", 0.8, 2.8, "z")], [(15.45, 18.25, "Mi nombre es Yefry Núñez,")], (0.3, 2.5, "YEFRY NÚÑEZ", "DOMINICANO · 27 AÑOS")),
        (("R", 19.75, 22.30), [("B", 3.6, 2.55, "")], [(19.75, 22.3, "soy oriundo de San Antonio de Guerra,")], (0.0, 2.55, "YEFRY NÚÑEZ", "DOMINICANO · 27 AÑOS")),
        (("R", 28.42, 30.82), [("B", 9.3, 2.4, "z")], [(28.42, 30.82, "y me estoy postulando al Premio Nacional de la Juventud,")],
         (0.1, 2.3, "PREMIO NACIONAL", "DE LA JUVENTUD")),
        (("X1", 0.0, d1), [("B", 9.3, d1, "blur")], [(0.0, d1, "en la categoría de Superación y Logros Personales.")],
         (0.0, d1, "SUPERACIÓN Y", "LOGROS PERSONALES")),
        (("R", 35.50, 44.95), [("G", 22.2, 2.7, ""), ("R", 37.4, 1.8, ""), ("R", 39.7, 2.9, ""), ("G", 15.4, 2.05, "")],
         [(35.5, 39.45, "Soy el primer y único dominicano ganador de HackCorruption,"),
          (39.45, 44.95, "una iniciativa que impulsa soluciones para disminuir la corrupción en Latinoamérica y el mundo.")],
         (4.6, 4.7, "GANADOR", "HACKCORRUPTION · BOGOTÁ")),
        (("R", 61.45, 71.15), [("R", 36.0, 1.2, ""), ("R", 41.8, 0.8, ""), ("G", 17.6, 4.0, ""), ("B", 0.75, 3.7, "z")],
         [(61.45, 65.3, "Esta iniciativa también fue galardonada"), (65.3, 68.5, "por la mismísima OEA"),
          (68.5, 71.15, "como iniciativa destacada contra la corrupción.")], (0.0, 9.7, "OEA", "INICIATIVA DESTACADA · CONTRACTOR AI")),
        (("R", 45.55, 55.20), [("G", 33.6, 5.4, ""), ("R", 115.25, 2.35, ""), ("R", 119.0, 1.0, ""), ("R", 12.0, 0.9, "")],
         [(45.55, 50.7, "Con este proyecto fui nombrado Billion Acts Fellow,"),
          (50.7, 55.2, "una iniciativa de 14 ganadores del Premio Nobel de la Paz.")], (5.4, 4.25, "BILLION ACTS FELLOW", "14 PREMIOS NOBEL DE LA PAZ")),
        (("R", 76.72, 84.80), [("R", 26.3, 2.7, ""), ("G", 24.7, 3.8, ""), ("R", 117.6, 1.58, "")],
         [(76.72, 79.6, "3R VideoGame, un videojuego de realidad virtual"),
          (79.6, 84.8, "para enseñar a los niños sobre el cambio climático y cómo mitigarlo.")], (6.5, 1.58, "3R VIDEOGAME", "REALIDAD VIRTUAL · ACCIÓN CLIMÁTICA")),
        (("R", 84.85, 98.00), [("G", 28.7, 4.8, ""), ("R", 120.2, 2.2, ""), ("B", 4.0, 3.2, "z"), ("R", 4.4, 1.5, ""), ("R", 115.3, 1.45, "")],
         [(84.85, 89.8, "Con este videojuego fuimos nombrados por la Unión Internacional de Telecomunicaciones"),
          (89.8, 93.7, "de las Naciones Unidas"), (93.7, 98.0, "como una de las 20 mejores iniciativas de cambio digital.")],
         (4.8, 8.35, "TOP 20 MUNDIAL", "ITU · NACIONES UNIDAS")),
        (("R", 98.25, 105.95), [("G", 43.6, 4.8, ""), ("R", 14.0, 0.75, ""), ("B", 7.5, 2.15, "z")],
         [(98.25, 101.9, "También fuimos invitados al Osaka Youth Summit, en Japón,"), (101.9, 105.95, "y a la Cumbre Synergy, en Corea del Sur.")],
         (4.8, 2.9, "ASIA", "OSAKA, JAPÓN · COREA DEL SUR")),
        (("X2", 0.0, d2), [("E", 0.0, round(d2 * 0.45, 3), ""), ("E", 5.0, round(d2 - round(d2 * 0.45, 3), 3), "")],
         [(0.0, d2 * 0.45, "Además, fui seleccionado como investigador en bioinformática en El Salvador"),
          (d2 * 0.45, d2 * 0.7, "y como revisor científico de NeurIPS 2026,"),
          (d2 * 0.7, d2, "una de las conferencias de inteligencia artificial más grandes del mundo.")], None),
        # --- casi al final: el evento de seguridad en IA (la boca va con el audio) ---
        (("B", 0.75, 10.95), [("B", 0.75, 10.2, "")],
         [(0.75, 3.5, "En junio de 2026,"), (3.5, 8.4, "mucho antes de que Jacob Coxon, Sam Altman y Dario Amodei"),
          (8.4, 10.95, "encendieran las alarmas sobre la inteligencia artificial,")], None),
        (("B", 10.95, 12.85), [("B", 10.95, 1.9, "")], [(10.95, 12.85, "yo ya había llevado a cabo un evento con")], None),
        (("F", 11.78, 13.20), [("B", 11.0, 1.42, "blur")], [(11.78, 13.2, "más de 250 jóvenes.")], (0.0, 1.42, "+250 JÓVENES", "EVENTO DE SEGURIDAD EN IA")),
        (("R", 106.25, 114.20), [("G", 40.5, 2.9, ""), ("R", 119.0, 3.05, ""), ("R", 0.0, 2.0, "")],
         [(106.25, 110.3, "Por esto y más premios que hemos obtenido,"), (110.3, 114.2, "creo que soy un gran candidato a este galardón.")], None),
        (("R", 116.82, 120.20), [("B", 2.0, 3.38, "z")], [(116.82, 119.3, "Les invito a conocer mi historia."), (119.3, 120.2, "Yefry Núñez.")], None),
    ]

def t(x):
    h, r = divmod(max(0.0, x), 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def main():
    S = segs()
    starts, acc = [], HOOK_D
    for (_, a, b), vis, _, _ in S:
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
    for k, ((_, a0, b0), _, subs, tit) in enumerate(S):
        o = starts[k] - a0
        for a, b, txt in subs:
            ass.append(f"Dialogue: 0,{t(o + a)},{t(o + b)},Sub,,0,0,0,,{{\\fad(80,80)}}{txt}")
        if tit:
            a, d, l1, l2 = tit; s0 = starts[k] + a; s1 = min(s0 + d, starts[k] + b0 - a0)
            ass.append(f"Dialogue: 1,{t(s0)},{t(s1)},T1,,0,0,0,,{{\\fad(200,200)}}{l1}")
            ass.append(f"Dialogue: 1,{t(s0 + .25)},{t(s1)},T2,,0,0,0,,{{\\fad(200,200)}}{l2}")
    sub = HERE / "trabajo/sub_2min.ass"; sub.write_text("\n".join(ass) + "\n", encoding="utf-8")

    keys = list(VID) + list(AUD) + ["HV", "HA"]
    paths = list(VID.values()) + list(AUD.values()) + [HOOK_V, HOOK_A]
    ix = {k: i for i, k in enumerate(keys)}
    f, vl, al, i = [], [], [], 0
    f.append(f"[{ix['HV']}:v]trim=duration={HOOK_D},setpts=PTS-STARTPTS,fps={FPS},scale={W}:{H},setsar=1,fade=t=out:st={HOOK_D - 0.25:.2f}:d=0.25[hv]")
    f.append(f"[{ix['HA']}:a]atrim=duration={HOOK_D},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=out:st={HOOK_D - 0.3:.2f}:d=0.3[ha]")
    for _, vis, _, _ in S:
        for src, a, d, mode in vis:
            pad = "tpad=stop_mode=clone:stop_duration=4," if src == "E" else ""   # el gráfico extra dura 10 s: alarga el último cuadro
            base = f"[{ix[src]}:v]{pad}trim=start={a}:duration={d},setpts=PTS-STARTPTS,fps={FPS}"
            if src in ("R", "G", "E"):
                f.append(f"{base},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1[v{i}]")
            elif mode == "blur":
                f.append(f"{base},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.25,setsar=1[v{i}]")
            else:   # tomas cuadradas: al centro sobre su propio fondo desenfocado
                z = ",crop=iw*0.72:ih*0.72:iw*0.14:ih*0.06" if mode == "z" else ""
                f.append(f"{base}{z},split[a{i}][b{i}];"
                         f"[a{i}]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.12[bg{i}];"
                         f"[b{i}]scale={W}:{W}[fg{i}];[bg{i}][fg{i}]overlay=0:(H-h)/2-80,setsar=1[v{i}]")
            vl.append(f"[v{i}]"); i += 1
    f.append(f"{''.join(vl)}concat=n={i}:v=1:a=0,eq=contrast=1.05:saturation=1.08[body]")
    f.append(f"[hv][body]concat=n=2:v=1:a=0,subtitles={sub}[vout]")
    for k, ((src, a, b), _, _, _) in enumerate(S):
        gain = ",volume=-2dB" if src.startswith("X") else ""      # la voz clonada viene algo más fuerte
        f.append(f"[{ix[src]}:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo{gain},"
                 f"afade=t=in:d=0.03,afade=t=out:st={b - a - 0.04:.3f}:d=0.04[x{k}]")
        al.append(f"[x{k}]")
    f.append(f"{''.join(al)}concat=n={len(S)}:v=0:a=1,highpass=f=80,afftdn=nf=-30,loudnorm=I=-15.2:TP=-1.5:LRA=9[voz]")
    f.append("[ha][voz]concat=n=2:v=0:a=1[aout]")
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for p in paths: cmd += ["-i", str(HERE / p)]
    cmd += ["-filter_complex", ";".join(f), "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{total:.3f}", str(OUT)]
    subprocess.run(cmd, check=True)
    print(f"{total:.1f} s → {OUT}")

if __name__ == "__main__":
    main()
