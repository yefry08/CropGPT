#!/usr/bin/env python3
"""Z Fellows: 1-minute intro video from entrada/zfellows_escena.mp4 (your own take, your real voice).
Keeps only what is still true (intro, projects, passion, motivation) and leaves out the old parts
(medicine at UTESA, the "SEA for the future program"). Adds English captions and title cards with your
current role and achievements, as written in your application. Ends on a name card.
Usage: python3 corte_zfellows.py  →  salida/zfellows_intro.mp4
"""
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "entrada/zfellows_escena.mp4"
OUT = HERE / "salida/zfellows_intro.mp4"
ASS = HERE / "trabajo/zfellows.ass"
W, H, FPS, END = 1080, 1920, 30, 6.0

# (start, end) in the source, in edit order; cut on word boundaries (Whisper timestamps)
SEG = [(0.00, 9.40),    # I am Yefry Núñez, and I'm thrilled to share my passion and my aspiration with you.
       (57.65, 71.85),  # Throughout my academic journey … develop a recycling application,
       (76.85, 84.40),  # and the last one, I've developed an AI technology to fight corruption in open contracting.
       (23.50, 33.10),  # I'm deeply passionate about technology …
       (42.50, 53.40)]  # I'm really excited about this program …
# captions per segment: (from, to) in source seconds, text as said (names spelled right)
SUB = [[(0.0, 3.4, "I am Yefry Núñez,"), (3.6, 9.4, "and I'm thrilled to share my passion and my aspiration with you.")],
       [(57.65, 62.5, "Throughout my academic journey,"), (62.5, 67.6, "I've had the privilege of joining a huge number of projects and hackathons."),
        (67.6, 71.85, "This gave me the opportunity to develop a recycling application,")],
       [(76.85, 79.5, "and the latest one:"), (79.5, 84.4, "an AI technology to fight corruption in open contracting.")],
       [(23.5, 27.7, "I'm deeply passionate about technology"), (27.7, 33.1, "because it has the power to transform lives and drive innovation.")],
       [(42.5, 48.0, "I'm really excited about this program"), (48.0, 53.4, "because it aligns with my goal: solving problems through technology.")]]
# title cards in output seconds: (from, to, big line, small line)
CARDS = [(0.4, 8.8, "YEFRY NÚÑEZ", "Founder & CEO · Contractor AI"),
         (10.0, 16.5, "ML ENGINEER", "CS, PUCMM · Master's, University of Tokyo"),
         (17.0, 23.4, "3 PROJECTS FUNDED", "an AI system · a VR game · a recycling robot"),
         (24.2, 30.9, "CONTRACTOR AI", "flags overpriced public contracts · 8 countries"),
         (31.4, 35.0, "1ST PLACE", "HackCorruption · Bogotá"),
         (35.2, 38.2, "RECOGNIZED BY THE OAS", "PIDA Transparency Challenge"),
         (38.4, 40.6, "US$15,000", "in prizes since 2024"),
         (41.0, 45.6, "BILLION ACTS FELLOW", "PeaceJam · 14 Nobel Peace laureates"),
         (45.8, 51.4, "FOUNDER", "AI Safety Dominicana · 200+ at the first bootcamp")]

def t(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"

def main():
    starts, acc = [], 0.0
    for a, b in SEG: starts.append(acc); acc += b - a
    body = acc; total = body + END
    ass = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "", "[V4+ Styles]",
           "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
           "Style: Sub,DejaVu Sans,50,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,1,0,0,0,100,100,0,0,1,5,2,2,80,80,300,1",
           "Style: T1,DejaVu Sans,84,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00F0A030,1,0,0,0,100,100,1,0,3,18,0,8,60,60,170,1",
           "Style: T2,DejaVu Sans,42,&H00201A14,&H00FFFFFF,&H003FD2FF,&H00000000,1,0,0,0,100,100,1,0,3,12,0,8,60,60,300,1",
           "Style: E1,DejaVu Sans,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,2,0,1,6,3,5,60,60,0,1",
           "Style: E2,DejaVu Sans,50,&H0030C8FF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,1,0,1,4,2,5,60,60,0,1",
           "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for k, subs in enumerate(SUB):
        a0 = SEG[k][0]
        for a, b, txt in subs:
            ass.append(f"Dialogue: 0,{t(starts[k] + a - a0)},{t(starts[k] + b - a0 - .05)},Sub,,0,0,0,,{{\\fad(80,80)}}{txt}")
    for a, b, l1, l2 in CARDS:
        ass.append(f"Dialogue: 1,{t(a)},{t(b)},T1,,0,0,0,,{{\\fad(180,180)}}{l1}")
        ass.append(f"Dialogue: 1,{t(a + .2)},{t(b)},T2,,0,0,0,,{{\\fad(180,180)}}{l2}")
    e0 = body + .3
    for y, st, txt in [(800, "E1", "Yefry Núñez"), (930, "E2", "Founder & CEO · Contractor AI"), (1020, "E2", "contractor-ai-one.vercel.app")]:
        ass.append(f"Dialogue: 2,{t(e0)},{t(total)},{st},,0,0,0,,{{\\fad(300,0)\\pos({W // 2},{y})}}{txt}")
    ASS.write_text("\n".join(ass) + "\n", encoding="utf-8")

    f, vl, al = [], [], []
    for i, (a, b) in enumerate(SEG):
        f.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS,fps={FPS}[v{i}]")
        f.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={b - a - 0.05:.3f}:d=0.05[a{i}]")
        vl.append(f"[v{i}]"); al.append(f"[a{i}]")
    # end card: the last frame, blurred and darkened, held for END seconds
    lb = SEG[-1][1]
    f.append(f"[0:v]trim=start={lb - 0.05}:end={lb},setpts=PTS-STARTPTS,fps={FPS},tpad=stop_mode=clone:stop_duration={END},trim=duration={END},boxblur=6:2,eq=brightness=-0.25[vend]")
    f.append(f"{''.join(vl)}[vend]concat=n={len(SEG) + 1}:v=1:a=0,scale={W}:{H}:flags=lanczos,unsharp=5:5:0.8,eq=contrast=1.04:saturation=1.05,"
             f"subtitles={ASS}[vout]")
    f.append(f"{''.join(al)}concat=n={len(SEG)}:v=0:a=1,apad=pad_dur={END},atrim=0:{total},highpass=f=80,afftdn=nf=-28,loudnorm=I=-14:TP=-1.5:LRA=9[aout]")
    OUT.parent.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SRC), "-filter_complex", ";".join(f), "-map", "[vout]", "-map", "[aout]",
                    "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-movflags", "+faststart", "-t", f"{total:.3f}", str(OUT)], check=True)
    print(f"{total:.1f} s → {OUT}")

if __name__ == "__main__":
    main()
