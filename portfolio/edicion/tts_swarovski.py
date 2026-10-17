#!/usr/bin/env python3
"""English narration with your cloned voice for the Swarovski Foundation application video
(best of up to 3 seeds by Whisper). Usage: /root/.venv-tts/bin/python tts_swarovski.py"""
import difflib, json, re, subprocess, sys
from pathlib import Path
HERE = Path(__file__).parent
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

GUION = json.loads((HERE / "swarovski_guion.json").read_text())
OUT = HERE / "trabajo/swarovski"; OUT.mkdir(parents=True, exist_ok=True)
def tok(t):
    t = t.lower().replace("3r", "three r").replace("a.i.", "ai").replace("a. i.", "ai")
    return re.sub(r"[^a-z0-9 ]", " ", t).split()

def puntua(asr, wav, text):
    segs, _ = asr.transcribe(str(wav), language="en", condition_on_previous_text=False)
    heard = " ".join(x.text for x in segs); want = tok(text)
    got = sum(b.size for b in difflib.SequenceMatcher(None, want, tok(heard), autojunk=False).get_matching_blocks())
    return got / max(1, len(want)), heard.strip()

model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("medium", device="cpu", compute_type="int8")
for item in GUION:
    pid, text = item["id"], item.get("tts", item["say"])
    if (OUT / f"{pid}.wav").exists() and "--force" not in sys.argv: continue
    best = None
    for seed in (7, 11, 23):
        torch.manual_seed(seed)
        wav = model.generate(text, language_id="en", audio_prompt_path=str(HERE / "entrada/mi_voz.wav"), exaggeration=0.5, cfg_weight=0.5)
        p = OUT / f"{pid}_s{seed}.wav"; ta.save(str(p), wav, model.sr)
        sc, heard = puntua(asr, p, text); print(f"{pid} seed {seed}: {sc:.0%} «{heard}»", flush=True)
        if best is None or sc > best[0]: best = (sc, p)
        if sc >= .999: break
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(best[1]), "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
        "-ar", "48000", "-ac", "1", str(OUT / f"{pid}.wav")], check=True)
    print(pid, "→", best[1].name, flush=True)
