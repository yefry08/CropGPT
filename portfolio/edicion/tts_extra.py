#!/usr/bin/env python3
"""Frases sueltas con tu voz clonada para el corte de 2 min (mejor de 3 semillas según Whisper).
Uso: /root/.venv-tts/bin/python tts_extra.py"""
import subprocess, sys
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from narrar import pronuncia, puntua
FRASES = {
    "X1": "en la categoría de superación y logros personales.",
    "X2": "Además, fui seleccionado como investigador en bioinformática en El Salvador, y como revisor científico de NeurIPS 2026, una de las conferencias de inteligencia artificial más grandes del mundo.",
}
OUT = HERE / "trabajo/extra"; OUT.mkdir(parents=True, exist_ok=True)
model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
from faster_whisper import WhisperModel
asr = WhisperModel("medium", device="cpu", compute_type="int8")
for pid, text in FRASES.items():
    best = None
    for seed in (7, 11, 23):
        torch.manual_seed(seed)
        wav = model.generate(pronuncia(text), language_id="es", audio_prompt_path=str(HERE / "entrada/mi_voz.wav"), exaggeration=0.5, cfg_weight=0.5)
        p = OUT / f"{pid}_s{seed}.wav"; ta.save(str(p), wav, model.sr)
        sc, heard = puntua(asr, p, text); print(f"{pid} semilla {seed}: {sc:.0%} «{heard}»", flush=True)
        if best is None or sc > best[0]: best = (sc, p)
        if sc >= .999: break
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(best[1]), "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
        "-ar", "48000", "-ac", "1", str(OUT / f"{pid}.wav")], check=True)
    print(pid, "→", best[1].name, flush=True)
