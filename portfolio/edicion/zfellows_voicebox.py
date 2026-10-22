#!/usr/bin/env python3
"""Z Fellows 1-minute intro: new English script, narrated with your cloned voice (Voicebox, tts_voicebox.py),
over your own take (entrada/zfellows_escena.mp4). The opening "I am Yefry Núñez" is your real voice and lips.
Adds English captions, title cards (facts from your application) and an end card.
Usage: python3 zfellows_voicebox.py  →  salida/zfellows_voicebox.mp4
"""
import json, re, subprocess
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "entrada/zfellows_escena.mp4"
TTS = HERE / "trabajo/zfellows"
OUT = HERE / "salida/zfellows_voicebox.mp4"
ASS = HERE / "trabajo/zfellows_vb.ass"
GUION = json.loads((HERE / "zfellows_guion.json").read_text())
W, H, FPS, GAP, END = 1080, 1920, 30, 0.35, 5.0
# title cards, keyed by script line: (big line, small line)
CARDS = {"Z1": [("ML ENGINEER", "Dominican Republic"), ("FOUNDER", "Contractor AI")],
         "Z2": [("1ST PLACE", "HackCorruption · Bogotá"), ("RECOGNIZED BY THE OAS", "Organization of American States"),
                ("US$15,000", "in prizes since 2024"), ("FOUNDER", "AI Safety Dominicana")],
         "Z3": [("MEDICINE → COMPUTER SCIENCE", "starting over, on purpose")],
         "Z4": [("CONTRACTOR AI", "8 countries · live procurement data"), ("EVIDENCE, NOT JUST A SCORE", "overpricing caught before the money is gone")],
         "Z5": [("~US$100 / MONTH", "built and run by me")]}

dur = lambda p: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))
def t(x):
    h, r = divmod(max(0, x), 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def chunks(text, n=7):
    words, out, cur = text.split(), [], []
    for w in words:
        cur.append(w)
        if len(cur) >= n or (re.search(r"[.,;:]$", w) and len(cur) >= 3): out.append(" ".join(cur)); cur = []
    if cur: out.append(" ".join(cur))
    return out

def main():
    # audio timeline
    real = next(g for g in GUION if "real" in g); ra, rb = real["real"]
    t0, spans, inputs, filt = 0.0, {}, ["-i", str(SRC)], []
    spans[real["id"]] = (0.0, rb - ra); t0 = rb - ra + .15
    for k, g in enumerate([g for g in GUION if "real" not in g]):
        p = TTS / f"{g['id']}.wav"; d = dur(p); spans[g["id"]] = (t0, t0 + d); inputs += ["-i", str(p)]
        filt.append(f"[{k + 1}:a]adelay={int(t0 * 1000)}|{int(t0 * 1000)},volume=-1dB[n{k}]"); t0 += d + GAP
    body = t0 - GAP + .4; total = body + END; n = len(GUION) - 1
    filt.append(f"[0:a]atrim={ra}:{rb},asetpts=PTS-STARTPTS,highpass=f=80,afftdn=nf=-28,loudnorm=I=-16[r]")
    filt.append(f"[r]{''.join(f'[n{k}]' for k in range(n))}amix=inputs={n + 1}:normalize=0,apad,atrim=0:{total},loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
    # captions + cards
    ass = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "", "[V4+ Styles]",
           "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
           "Style: Sub,DejaVu Sans,52,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,1,0,0,0,100,100,0,0,1,5,2,2,80,80,300,1",
           "Style: T1,DejaVu Sans,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,1,0,3,18,0,8,60,60,170,1",
           "Style: T2,DejaVu Sans,42,&H00201A14,&H00FFFFFF,&H003FD2FF,&H00000000,1,0,0,0,100,100,1,0,3,12,0,8,60,60,290,1",
           "Style: E1,DejaVu Sans,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,2,0,1,6,3,5,60,60,0,1",
           "Style: E2,DejaVu Sans,50,&H003FD2FF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,1,0,1,4,2,5,60,60,0,1",
           "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for g in GUION:
        a, b = spans[g["id"]]; cs = chunks(g["say"]); tot = sum(len(x) for x in cs); acc = a
        for x in cs:
            d = (b - a) * len(x) / tot; ass.append(f"Dialogue: 0,{t(acc)},{t(acc + d - .04)},Sub,,0,0,0,,{{\\fad(60,60)}}{x}"); acc += d
        cards = CARDS.get(g["id"], [])
        for k, (l1, l2) in enumerate(cards):
            ca = a + (b - a) * k / len(cards) + .1; cb = a + (b - a) * (k + 1) / len(cards) - .1
            ass.append(f"Dialogue: 1,{t(ca)},{t(cb)},T1,,0,0,0,,{{\\fad(150,150)}}{l1}")
            ass.append(f"Dialogue: 1,{t(ca + .15)},{t(cb)},T2,,0,0,0,,{{\\fad(150,150)}}{l2}")
    for y, st, txt in [(800, "E1", "Yefry Núñez"), (930, "E2", "Founder · Contractor AI"), (1020, "E2", "contractor-ai-one.vercel.app")]:
        ass.append(f"Dialogue: 2,{t(body + .2)},{t(total)},{st},,0,0,0,,{{\\fad(300,0)\\pos({W // 2},{y})}}{txt}")
    ASS.write_text("\n".join(ass) + "\n", encoding="utf-8")
    # video: your take, continuous from the start (the burned-in name tag at 2–10 s is covered by the cards' area anyway);
    # the end card blurs the last frame
    filt.append(f"[0:v]trim=0:{body},setpts=PTS-STARTPTS,fps={FPS}[vb]")
    filt.append(f"[0:v]trim=start={body - .05}:end={body},setpts=PTS-STARTPTS,fps={FPS},tpad=stop_mode=clone:stop_duration={END},trim=duration={END},boxblur=6:2,eq=brightness=-0.25[ve]")
    filt.append(f"[vb][ve]concat=n=2:v=1:a=0,scale={W}:{H}:flags=lanczos,unsharp=5:5:0.8,eq=contrast=1.04:saturation=1.05,subtitles={ASS}[vout]")
    OUT.parent.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[vout]", "-map", "[aout]",
                    "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-movflags", "+faststart", "-t", f"{total:.3f}", str(OUT)], check=True)
    print(f"{total:.1f} s → {OUT}")

if __name__ == "__main__":
    main()
