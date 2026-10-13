#!/usr/bin/env python3
"""Transcribe un audio/vídeo con Whisper medium (faster-whisper), español, marcas por palabra.
Uso: python3 transcribir.py entrada.mp4 salida.json"""
import json, sys
from faster_whisper import WhisperModel

src, dst = sys.argv[1], sys.argv[2]
model = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = model.transcribe(src, language="es", word_timestamps=True, vad_filter=False,
                              condition_on_previous_text=False, beam_size=5)
out = []
for s in segs:
    out.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(),
                "words": [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)} for w in s.words]})
json.dump({"duration": info.duration, "segments": out}, open(dst, "w"), ensure_ascii=False, indent=1)
print(f"{len(out)} segmentos, {sum(len(s['words']) for s in out)} palabras, {info.duration:.1f} s")
