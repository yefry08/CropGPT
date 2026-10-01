#!/usr/bin/env python3
"""Narrate sections.json with Gemini TTS (Google AI Studio key) and time the film to it.

Reads the key from the GEMINI_API_KEY environment variable (never from a file, never logged).
Per section: POST models/<tts-model>:generateContent with responseModalities AUDIO and a prebuilt
voice (request shape from ai.google.dev/gemini-api/docs/speech-generation); the reply is base64 PCM
(audio/L16, rate in the mimeType). Writes audio/<id>.wav, audio/narration.wav (sections joined with
a short pause) and timing.js, which the film reads so every scene lasts exactly as long as its voice.

    GEMINI_API_KEY=... python3 narrate.py [--voice Charon] [--model <name>]
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import wave
from pathlib import Path

import httpx

API = "https://generativelanguage.googleapis.com/v1beta"
HERE = Path(__file__).parent
GAP_S = 0.6          # pause between sections
TAIL_S = 4.0         # the closing card holds after the last line


def pick_model(client: httpx.Client) -> str:
    """The newest non-lite TTS model the key can use (ListModels), so no model id is hard-coded."""
    names, page = [], None
    while True:
        r = client.get(f"{API}/models", params={"pageSize": 200, **({"pageToken": page} if page else {})})
        r.raise_for_status()
        d = r.json()
        names += [m["name"].split("/", 1)[1] for m in d.get("models", [])
                  if "tts" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", [])]
        page = d.get("nextPageToken")
        if not page:
            break
    if not names:
        sys.exit("No TTS model is available to this key (ListModels returned none with 'tts').")
    full = [n for n in names if "lite" not in n] or names
    ver = lambda n: [int(x) for x in re.findall(r"\d+", n)]
    return sorted(full, key=lambda n: (("preview" not in n), ver(n)))[-1]


def synth(client: httpx.Client, model: str, voice: str, style: str, text: str) -> tuple[bytes, int]:
    body = {
        "contents": [{"parts": [{"text": f"{style}\n\n{text}"}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    for attempt in range(5):
        r = client.post(f"{API}/models/{model}:generateContent", json=body)
        if r.status_code in (429, 500, 502, 503, 504):
            time.sleep(10 * (attempt + 1))
            continue
        if r.status_code != 200:
            sys.exit(f"TTS failed: HTTP {r.status_code}: {r.text[:400]}")
        part = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
        m = re.search(r"rate=(\d+)", part.get("mimeType", ""))
        return base64.b64decode(part["data"]), int(m.group(1)) if m else 24000
    sys.exit("TTS kept failing (rate limit or server errors); try again later.")


def write_wav(path: Path, pcm: bytes, rate: int) -> float:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
    return len(pcm) / 2 / rate


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="Charon")
    ap.add_argument("--model", default=os.environ.get("CF_TTS_MODEL", ""))
    ap.add_argument("--max-pause", type=float, default=0.35, help="shorten pauses longer than this (s)")
    ap.add_argument("--tempo", type=float, default=1.0, help="speed factor (atempo, pitch kept)")
    ap.add_argument("--reuse", action="store_true", help="re-time the existing audio/raw takes, no API call")
    a = ap.parse_args()
    spec = json.loads((HERE / "sections.json").read_text())
    out = HERE / "audio"; raw = out / "raw"; raw.mkdir(parents=True, exist_ok=True)
    rate = 24000
    if not a.reuse:
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            sys.exit("Set GEMINI_API_KEY (Google AI Studio key) in the environment.")
        with httpx.Client(headers={"x-goog-api-key": key}, timeout=300) as client:
            model = a.model or pick_model(client)
            print(f"model {model}, voice {a.voice}")
            for s in spec["sections"]:
                pcm, rate = synth(client, model, a.voice, spec.get("voice_style", ""), s["text"])
                d = write_wav(raw / (s["id"] + ".wav"), pcm, rate)
                print(f"  {s['id']:10s} {d:6.1f} s raw")
    # tighten the delivery: long pauses down to --max-pause, optional tempo; pitch is preserved
    durs = []
    for s in spec["sections"]:
        dst = out / f"{s['id']}.wav"
        flt = (f"silenceremove=start_periods=1:start_threshold=-45dB,"
               f"silenceremove=stop_periods=-1:stop_duration={a.max_pause}:stop_threshold=-40dB:stop_silence={a.max_pause}")
        if a.tempo != 1.0:
            flt += f",atempo={a.tempo}"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw / f"{s['id']}.wav"), "-af", flt,
                        "-ar", str(rate), "-ac", "1", "-c:a", "pcm_s16le", str(dst)], check=True)
        with wave.open(str(dst)) as w:
            rate = w.getframerate(); d = w.getnframes() / rate
        durs.append(d); print(f"  {s['id']:10s} {d:6.1f} s")
    # join with pauses; the film's scene k lasts voice_k + gap (the last one also holds the end card)
    lst = out / "concat.txt"
    silence = out / "gap.wav"
    write_wav(silence, b"\0\0" * int(rate * GAP_S), rate)
    lst.write_text("".join(f"file '{s['id']}.wav'\nfile 'gap.wav'\n" for s in spec["sections"]))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-c:a", "pcm_s16le", str(out / "narration.wav")], check=True)
    scenes = [round(d + GAP_S, 3) for d in durs]
    scenes[-1] = round(scenes[-1] + TAIL_S, 3)
    (HERE / "timing.js").write_text(
        "// written by narrate.py: scene durations = measured voice + pause\n"
        f"window.SECTION_DURS = {json.dumps(dict(zip([s['id'] for s in spec['sections']], scenes)))};\n")
    total = sum(scenes)
    print(f"narration {sum(durs):.1f} s, film {total:.1f} s ({total/60:.2f} min) → timing.js")


if __name__ == "__main__":
    main()
