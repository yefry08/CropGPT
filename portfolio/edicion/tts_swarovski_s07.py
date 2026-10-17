#!/usr/bin/env python3
"""Rehace S07 probando grafías fonéticas de "AI" hasta que Whisper (sin pistas) oiga "Contractor AI"."""
import re, subprocess
from pathlib import Path
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
HERE = Path(__file__).parent; OUT = HERE / "trabajo/swarovski"
REST = ", which uses artificial intelligence to flag unusual prices in public contracts."
VARIANTS = ["I also created Contractor A I", "I also created Contractor Ay Eye", "I also created Contractor, A-I", "I also created Contractor Eh Eye"]
model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("medium", device="cpu", compute_type="int8")
ok = None
for vi, v in enumerate(VARIANTS):
    for seed in (7, 11, 23):
        torch.manual_seed(seed)
        wav = model.generate(v + REST, language_id="en", audio_prompt_path=str(HERE / "entrada/mi_voz.wav"), exaggeration=0.5, cfg_weight=0.5)
        p = OUT / f"S07v{vi}_s{seed}.wav"; ta.save(str(p), wav, model.sr)
        heard = " ".join(s.text for s in asr.transcribe(str(p), language="en", condition_on_previous_text=False)[0]).strip()
        good = re.search(r"contractor,?\s*(a\.?\s?i\b|ai\b)", heard, re.I) and "public contracts" in heard.lower()
        print(vi, seed, "OK" if good else "--", f"«{heard}»", flush=True)
        if good: ok = p; break
    if ok: break
if ok:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ok), "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
        "-ar", "48000", "-ac", "1", str(OUT / "S07.wav")], check=True)
print("S07 →", ok)
