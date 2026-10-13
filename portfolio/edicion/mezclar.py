#!/usr/bin/env python3
"""Mezcla final de audio a partir de remotion/src/timeline.json:
- narración (tu voz clonada) en cada escena [N]
- audio de cámara en cada escena [C]; si alguna narración se solapa con cámara, la cámara baja 20 dB (ducking)
- música de Beethoven muy baja (≈ -22 dB respecto a la voz) bajo todo el vídeo
- máster a -14 LUFS
Uso: python3 mezclar.py  → trabajo/mezcla.wav"""
import json, subprocess
from pathlib import Path
HERE = Path(__file__).parent
T = json.load(open(HERE / "remotion" / "src" / "timeline.json"))
total = T["total"]
subprocess.run(["python3", str(HERE / "musica.py"), f"{total + 1:.2f}", str(HERE / "trabajo" / "musica.wav")], check=True)
inp, flt, voz, cam = [], [], [], []
for sc in T["scenes"]:
    k = len(inp); ms = int((sc["start"] + sc.get("pre", 0)) * 1000)
    if sc["kind"] == "N":
        inp += ["-i", str(HERE / "trabajo" / "narracion" / sc["audio"])]
        flt.append(f"[{k}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[n{k}]"); voz.append(f"[n{k}]")
    else:
        inp += ["-ss", str(sc["from"]), "-t", str(sc["dur"]), "-i", str(HERE / "trabajo" / "base_editado.mov")]
        flt.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=.08,afade=t=out:st={sc['dur'] - .12:.3f}:d=.12,adelay={ms}|{ms}[c{k}]"); cam.append(f"[c{k}]")
m = len(inp); inp += ["-i", str(HERE / "trabajo" / "musica.wav")]
flt.append("".join(voz) + f"amix=inputs={len(voz)}:normalize=0[vz]")
flt.append("".join(cam) + f"amix=inputs={len(cam)}:normalize=0[cm0]")
flt.append("[vz]asplit=3[vz1][vz2][vz3]")
# ducking: la cámara cae 20 dB cuando suena la narración (ratio alto, umbral bajo)
flt.append("[cm0][vz2]sidechaincompress=threshold=0.02:ratio=20:attack=20:release=300:makeup=1[cm]")
flt.append(f"[{m}:a]pan=stereo|c0=c0|c1=c0,volume=-23dB[mu0]")
flt.append("[vz3][cm]amix=inputs=2:normalize=0[speech]")
flt.append("[speech]asplit=2[sp1][sp2]")
flt.append("[mu0][sp2]sidechaincompress=threshold=0.03:ratio=4:attack=40:release=600[mu]")
flt.append("[sp1][mu]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[out]")
flt.append("[vz1]anullsink")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[out]", "-t", f"{total:.3f}",
                "-ar", "48000", "-c:a", "pcm_s16le", str(HERE / "trabajo" / "mezcla.wav")], check=True)
print(f"mezcla {total:.1f} s → trabajo/mezcla.wav")
