#!/usr/bin/env python3
"""Vuelve a elegir la mejor semilla de cada frase con la puntuación corregida (3R / A.I.), sin regenerar."""
import json, subprocess
from pathlib import Path
from faster_whisper import WhisperModel
HERE = Path(__file__).parent; OUT = HERE / "trabajo/swarovski"
src = (HERE / "tts_swarovski.py").read_text()
# reutiliza tok() y puntua() de tts_swarovski.py sin cargar el modelo de voz
ns = {"__file__": str(HERE / "tts_swarovski.py")}; exec(src.split("model = ChatterboxMultilingualTTS")[0].replace("from chatterbox.mtl_tts import ChatterboxMultilingualTTS", ""), ns)
asr = WhisperModel("medium", device="cpu", compute_type="int8")
for item in json.loads((HERE / "swarovski_guion.json").read_text()):
    pid = item["id"]; text = item.get("tts", item["say"])
    cands = sorted(OUT.glob(f"{pid}_s*.wav"))
    if len(cands) < 2: continue
    scored = [(ns["puntua"](asr, p, text), p) for p in cands]
    for (sc, heard), p in scored: print(pid, p.name, f"{sc:.0%}", heard, flush=True)
    best = max(scored, key=lambda x: x[0][0])[1]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(best), "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
        "-ar", "48000", "-ac", "1", str(OUT / f"{pid}.wav")], check=True)
    print(pid, "→", best.name, flush=True)
