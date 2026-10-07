#!/usr/bin/env python3
"""FALLBACK narrator. The series uses Gemini TTS (narrate.py, voice Charon); this script is
only for when that key or quota is unavailable.

Narrate sections.json locally with Kokoro (ONNX) — no API key, no quota, no network.

Model files (downloaded once, kept outside the repo):
    /root/.cache/kokoro/kokoro-v1.0.onnx   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/
    /root/.cache/kokoro/voices-v1.0.bin
Apache-2.0 model (hexgrad/Kokoro-82M), Spanish voices em_alex / em_santa / ef_dora.

Text is phonemized with espeak-ng (es-419, Latin-American seseo) before it reaches the model, so
digits and percentages expand to Spanish words and punctuation becomes real pauses. Writes
audio/raw/<id>.wav, exactly where narrate.py --reuse expects its takes, then calls it to tighten
pauses, join the narration and write timing.js — so the rest of the pipeline does not change.

    python3 voice.py [--voice em_alex] [--speed 1.0]
"""
import argparse
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
MODELS = Path("/root/.cache/kokoro")
# espeak reads these as Spanish words; spell them the way a Spanish narrator says them.
SAY = {
    r"\bsoftware\b": "sóftuer",
    r"\bEisenhower\b": "Áisenjauer",
    r"\bFacebook\b": "Féisbuk",
    r"\bMicrosoft\b": "Máicrosoft",
    r"\bTerminator\b": "Términeitor",
    r"\bWall Street\b": "Wol Strit",
    r"\bAGI\b": "A G I",
    r"\bIA\b": "I A",
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="em_alex")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--lang", default="es-419", help="espeak voice: es-419 (seseo) or es (Castilian)")
    ap.add_argument("--spec", default="sections-es.json")
    ap.add_argument("--audio", default="audio")
    ap.add_argument("--force", action="store_true", help="re-synthesize takes that already exist")
    a = ap.parse_args()

    import espeakng_loader
    from phonemizer.backend.espeak.wrapper import EspeakWrapper
    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
    from phonemizer.backend import EspeakBackend
    from kokoro_onnx import Kokoro

    model, voices = MODELS / "kokoro-v1.0.onnx", MODELS / "voices-v1.0.bin"
    if not model.exists():
        sys.exit(f"Missing {model} — see the header of this file for the download URLs.")
    spec = json.loads((HERE / a.spec).read_text())
    raw = HERE / a.audio / "raw"
    raw.mkdir(parents=True, exist_ok=True)

    eo = EspeakBackend(a.lang, with_stress=True, preserve_punctuation=True,
                       punctuation_marks=';:,.!?¡¿—…"«»')
    k = Kokoro(str(model), str(voices))
    if a.voice not in k.get_voices():
        sys.exit(f"Unknown voice {a.voice}. Spanish: " + ", ".join(v for v in k.get_voices() if v[1] in "fm" and v[0] == "e"))
    print(f"kokoro {a.voice}, {a.lang}, speed {a.speed}")

    for s in spec["sections"]:
        dst = raw / (s["id"] + ".wav")
        if dst.exists() and not a.force:
            print(f"  {s['id']:10s} (kept)")
            continue
        text = s["text"]
        for pat, rep in SAY.items():
            text = re.sub(pat, rep, text)
        # one call per sentence: Kokoro's context is bounded, and sentence seams give clean breaths
        parts, rate = [], 24000
        for sent in [x.strip() for x in re.split(r"(?<=[.!?…])\s+", text) if x.strip()]:
            ph = eo.phonemize([sent])[0].strip()
            smp, rate = k.create(ph, voice=a.voice, speed=a.speed, lang="es", is_phonemes=True)
            parts += [smp, np.zeros(int(rate * .25), dtype=smp.dtype)]
        pcm = np.concatenate(parts[:-1])
        pcm = (np.clip(pcm, -1, 1) * 32767).astype("<i2")
        with wave.open(str(dst), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm.tobytes())
        print(f"  {s['id']:10s} {len(pcm) / rate:6.1f} s raw")

    # narrate.py --reuse does the rest: trim, tighten pauses, join, write timing.js
    subprocess.run([sys.executable, str(HERE / "narrate.py"), "--reuse", "--spec", a.spec,
                    "--audio", a.audio], check=True)


if __name__ == "__main__":
    main()
