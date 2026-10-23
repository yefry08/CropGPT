"""Narration with your cloned voice through the Voicebox app's local API (default http://127.0.0.1:17493). This is the only
AI step: Voicebox runs the voice model on your computer. Audio is fetched over the API, so it works with the desktop app."""
import json
import subprocess
import time
import urllib.request
import wave

URL = "http://127.0.0.1:17493"


def _call(path, body=None, base=URL, timeout=30):
    req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"} if body is not None else {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def status(base=URL):
    try:
        return json.loads(_call("/health", base=base, timeout=3)).get("status") == "healthy"
    except OSError:
        return False


def profiles(base=URL):
    return [{"id": p["id"], "name": p.get("name", p["id"])} for p in json.loads(_call("/profiles", base=base))]


def generate(text, profile_id, out_wav, lang="es", seed=7, tempo=1.0, base=URL, engine="chatterbox", cancel=None):
    """Synthesize `text` into out_wav (trimmed, mono 48 kHz). Returns its duration in seconds."""
    g = json.loads(_call("/generate", {"profile_id": profile_id, "text": text, "language": lang, "engine": engine, "seed": seed}, base=base, timeout=120))
    while True:
        h = json.loads(_call(f"/history/{g['id']}", base=base))
        if h.get("status") == "completed":
            break
        if h.get("status") == "failed":
            raise RuntimeError(h.get("error") or "Voicebox could not generate this line.")
        if cancel and cancel():
            raise RuntimeError("Cancelled.")
        time.sleep(2)
    raw = out_wav.with_suffix(".raw.wav"); raw.write_bytes(_call(f"/audio/{g['id']}", base=base, timeout=120))
    trim(raw, out_wav, tempo); raw.unlink(missing_ok=True)
    return duration(out_wav)


def trim(src, dst, tempo=1.0):
    """Cut leading/trailing silence and long inner pauses; optional tempo (pitch kept)."""
    flt = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
           "silenceremove=stop_periods=-1:stop_duration=0.35:stop_threshold=-40dB:stop_silence=0.35")
    if tempo != 1.0:
        flt += f",atempo={tempo}"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", flt, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(dst)], check=True)


def duration(path):
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def narration(wavs, gap, out):
    """Join the section takes with `gap` seconds of silence after each one."""
    inputs, parts = [], []
    for i, p in enumerate(wavs):
        inputs += ["-i", str(p)]; parts.append(f"[{i}:a]apad=pad_dur={gap}[a{i}]")
    filt = ";".join(parts) + ";" + "".join(f"[a{i}]" for i in range(len(wavs))) + f"concat=n={len(wavs)}:v=0:a=1[o]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", filt, "-map", "[o]", "-ar", "48000", "-ac", "1", str(out)], check=True)
