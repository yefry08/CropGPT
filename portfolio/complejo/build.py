"""Builds ia-no.html: paper-collage engine (from ../black-box) + scenes.js, scenes timed to the
Gemini voice, voice + score mixed and embedded as MP3. Also writes out/mix.m4a for the MP4."""
import base64, json, subprocess, wave
LEAD, TR, MIN, END = 0.5, 0.8, 8.5, 7.5
eng = open("../black-box/black-box.html", encoding="utf-8").read().split("\n")
i0 = next(i for i, l in enumerate(eng) if l.strip() == "// SCENES") - 1
i1 = next(i for i, l in enumerate(eng) if l.strip() == "// ---------- timeline ----------")
html = "\n".join(eng[:i0] + [open("scenes.js", encoding="utf-8").read()] + eng[i1:])
ids = [s["id"] for s in json.load(open("sections-es.json"))["sections"]]
durs = []
for i in ids:
    with wave.open(f"audio-es/{i}.wav") as w: durs.append(w.getnframes() / w.getframerate())
scene = [max(MIN, v + LEAD + 1.0) for v in durs] + [END]
starts, acc = [], 0
for k, d in enumerate(scene):
    st = acc - TR if k else 0; starts.append(st); acc = st + d
total = acc
json.dump({"total": total, "starts": starts}, open("out/starts.json", "w"))
subprocess.run(["python3", "score.py", "out/starts.json", "out/score.wav"], check=True)
inp, flt = ["-i", "out/score.wav"], ["[0:a]volume=0.32[m]"]
for k, i in enumerate(ids):
    inp += ["-i", f"audio-es/{i}.wav"]; ms = int((starts[k] + LEAD) * 1000)
    flt.append(f"[{k+1}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[v{k}]")
flt.append("".join(f"[v{k}]" for k in range(len(ids))) + f"amix=inputs={len(ids)}:normalize=0[vo]")
flt.append("[vo][m]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[out]",
                "-t", f"{total:.3f}", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "out/mix.m4a"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/mix.m4a", "-c:a", "libmp3lame", "-b:a", "112k", "out/mix.mp3"], check=True)
R = [('<html lang="en">', '<html lang="es">'), ('<title>The Black Box</title>', '<title>El nuevo complejo</title>'),
     ('content="A 9:16 paper-collage explainer: why nobody can fully explain how neural networks decide."',
      'content="Explicador en collage de papel 9:16: el nuevo complejo militar-tecnológico y quién decide dónde se queda el humano."'),
     ('aria-label="Animated explainer: The Black Box"', 'aria-label="Explicador animado: el nuevo complejo militar-tecnológico"'),
     ('.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")', '.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".")'),
     ('aria-label="Pause"', 'aria-label="Pausa"'), ('aria-label="Restart"', 'aria-label="Reiniciar"'), ('aria-label="Progress"', 'aria-label="Progreso"')]
for a, b in R:
    assert html.count(a) == 1, a; html = html.replace(a, b)
audio = base64.b64encode(open("out/mix.mp3", "rb").read()).decode()
tag = '<script>\n"use strict";'
assert html.count(tag) == 1
html = html.replace(tag, f'<script>window.VOICE = {{ lead: {LEAD}, durs: {json.dumps([round(d, 3) for d in durs])}, audio: "data:audio/mpeg;base64,{audio}" }};</script>\n' + tag)
open("complejo.html", "w", encoding="utf-8").write(html)
print(f"total {total:.1f} s, voice {sum(durs):.1f} s, html {len(html)/1e6:.2f} MB")
