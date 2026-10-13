#!/usr/bin/env bash
# Paso 1 — edición del vídeo base: aplica cortes_propuestos.json (montaje v2) sobre entrada/crudo.mp4,
# reduce ruido, corrige color de forma sutil y normaliza el audio de cámara.
# Uso: ./editar.sh   →  trabajo/base_editado.mp4
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p trabajo
IN=entrada/crudo.mp4
# tramos: inicio fin ganancia_dB   (el tramo de «junio» viene de otra toma, 2,2 dB más fuerte)
SEGS=$(python3 -c '
import json
for m in sorted(json.load(open("cortes_propuestos.json"))["montaje"], key=lambda m: m["orden"]):
    g = -2.2 if m["de"] > 60 else 0.0
    print(m["de"], m["a"], g)')
F=""; L=""; i=0
while read -r a b g; do
  F+="[0:v]trim=start=$a:end=$b,setpts=PTS-STARTPTS[v$i];"
  F+="[0:a]atrim=start=$a:end=$b,asetpts=PTS-STARTPTS,volume=${g}dB,afade=t=in:d=0.02,afade=t=out:st=$(python3 -c "print(round($b-$a-0.03,3))"):d=0.03[a$i];"
  L+="[v$i][a$i]"; i=$((i+1))
done <<< "$SEGS"
F+="${L}concat=n=$i:v=1:a=1[vc][ac];"
F+="[vc]eq=contrast=1.06:saturation=1.08:brightness=0.01[v];"
F+="[ac]highpass=f=80,afftdn=nf=-28,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
ffmpeg -v error -y -i "$IN" -filter_complex "$F" -map "[v]" -map "[a]" \
  -c:v libx264 -crf 15 -preset medium -pix_fmt yuv420p -r 30 -c:a pcm_s16le -ar 48000 trabajo/base_editado.mov
ffprobe -v error -show_entries format=duration -of default=nw=1 trabajo/base_editado.mov
