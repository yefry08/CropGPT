#!/usr/bin/env python3
"""Rehace S01 en dos partes (el nombre suelto se pronuncia mejor) y las une en trabajo/swarovski/S01.wav."""
import difflib, re, subprocess
from pathlib import Path
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
HERE = Path(__file__).parent; OUT = HERE / "trabajo/swarovski"
tok = lambda t: re.sub(r"[^a-z0-9 ]", " ", t.lower()).split()
model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("medium", device="cpu", compute_type="int8")
PARTS = [("a", ["Hi, I'm Yefry Núñez.", "Hi, I'm Yefri Nuñez.", "Hi, I'm Yefry Nunyez."], ["hi i m yefry", "hi i m yefri", "hi i m yefrey"]),
         ("b", ["A twenty-seven-year-old software and A.I. developer from San Antonio de Guerra, a small town in the Dominican Republic."],
          ["a 27 year old software and ai developer from san antonio de guerra a small town in the dominican republic"])]
files = []
for pid, texts, wants in PARTS:
    best = None
    for text in texts:
        for seed in (3, 7, 11, 23, 42):
            torch.manual_seed(seed)
            wav = model.generate(text, language_id="en", audio_prompt_path=str(HERE / "entrada/mi_voz.wav"), exaggeration=0.5, cfg_weight=0.5)
            p = OUT / f"S01{pid}_{len(files)}_{seed}_{texts.index(text)}.wav"; ta.save(str(p), wav, model.sr)
            heard = " ".join(s.text for s in asr.transcribe(str(p), language="en")[0])
            sc = max(difflib.SequenceMatcher(None, tok(w), tok(heard)).ratio() for w in wants)
            print(pid, seed, f"{sc:.0%}", f"«{heard.strip()}»", flush=True)
            if best is None or sc > best[0]: best = (sc, p)
            if sc >= .97: break
        if best[0] >= .97: break
    clean = OUT / f"S01{pid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(best[1]), "-af",
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
        "-ar", "48000", "-ac", "1", str(clean)], check=True)
    files.append(clean); print(pid, "→", best[1].name, flush=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(files[0]), "-i", str(files[1]), "-filter_complex",
    "[0:a]apad=pad_dur=0.25[a];[a][1:a]concat=n=2:v=0:a=1", str(OUT / "S01.wav")], check=True)
print("S01 →", OUT / "S01.wav")
