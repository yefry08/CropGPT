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
nin = 0                                   # número de entradas de ffmpeg (no de argumentos)
for sc in T["scenes"]:
    if sc["kind"] == "T": continue        # rótulos de capítulo: solo música
    k = nin; nin += 1; ms = int((sc["start"] + sc.get("pre", 0)) * 1000)
    if sc["kind"] == "N":
        inp += ["-i", str(HERE / "trabajo" / "narracion" / sc["audio"])]
        flt.append(f"[{k}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[n{k}]"); voz.append(f"[n{k}]")
    elif sc.get("voz"):                    # toma a cámara con la voz clonada en lugar de tu voz real
        nin -= 1
        for v in sc["voz"]:
            k = nin; nin += 1; ms = int((sc["start"] + v["at"]) * 1000)
            inp += ["-i", str(HERE / "trabajo" / "narracion" / v["file"])]
            flt.append(f"[{k}:a]aresample=48000,atempo={v['tempo']},pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[n{k}]"); voz.append(f"[n{k}]")
    else:
        inp += ["-ss", str(sc["from"]), "-t", str(sc["dur"]), "-i", str(HERE / "trabajo" / "base_editado.mov")]
        flt.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.08,afade=t=out:st={sc['dur'] - .12:.3f}:d=0.12,adelay={ms}|{ms}[c{k}]"); cam.append(f"[c{k}]")
m = None
flt.append("".join(voz) + f"amix=inputs={len(voz)}:normalize=0[vz]")
if not cam:                            # sin audio de cámara: silencio en su lugar
    inp += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]; cam.append(f"[{nin}:a]"); nin += 1
flt.append("".join(cam) + (f"amix=inputs={len(cam)}:normalize=0[cm0]" if len(cam) > 1 else "anull[cm0]"))
flt.append("[vz]asplit=3[vz1][vz2][vz3]")
# ducking: la cámara cae 20 dB cuando suena la narración (ratio alto, umbral bajo)
flt.append("[cm0][vz2]sidechaincompress=threshold=0.02:ratio=20:attack=20:release=300:makeup=1[cm]")
m = nin; inp += ["-i", str(HERE / "trabajo" / "musica.wav")]; nin += 1
flt.append(f"[{m}:a]pan=stereo|c0=c0|c1=c0,volume=-23dB[mu0]")
flt.append(f"[vz3][cm]amix=inputs=2:normalize=0,apad=whole_dur={total:.3f}[speech]")   # dura hasta el final: si no, el compresor corta la música
flt.append("[speech]asplit=2[sp1][sp2]")
flt.append("[mu0][sp2]sidechaincompress=threshold=0.03:ratio=4:attack=40:release=600[mu]")
flt.append("[sp1][mu]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[out]")
flt.append("[vz1]anullsink")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(flt), "-map", "[out]", "-t", f"{total:.3f}",
                "-ar", "48000", "-c:a", "pcm_s16le", str(HERE / "trabajo" / "mezcla.wav")], check=True)
print(f"mezcla {total:.1f} s → trabajo/mezcla.wav")
