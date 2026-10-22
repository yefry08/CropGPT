#!/usr/bin/env python3
"""Narrate a script with your cloned voice through the local Voicebox server (http://127.0.0.1:17493).
Each line is tried with up to 3 seeds per spelling and kept when Whisper hears the script back best.
Optional "tts_variants": alternative spellings tried in turn. Lines with "real": [a, b] are not synthesized (that span is taken from your own recording by the cut script).
Usage: python3 tts_voicebox.py zfellows_guion.json trabajo/zfellows [--lang en] [--force]
"""
import difflib, json, re, shutil, subprocess, sys, time, urllib.request
from pathlib import Path

API = "http://127.0.0.1:17493"
HERE = Path(__file__).parent
args = [a for a in sys.argv[1:] if not a.startswith("--")]
GUION, OUT = HERE / args[0], HERE / args[1]
LANG = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "en"
PROFILE = Path("/root/voicebox-data/yefry_profile_id").read_text().strip()
OUT.mkdir(parents=True, exist_ok=True)

def call(path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json"} if body else {})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())

def wait(gid):
    while True:
        h = call(f"/history/{gid}")
        if h.get("status") in ("completed", "failed"): return h
        time.sleep(3)

tok = lambda t: re.sub(r"[^a-z0-9 ]", " ", t.lower().replace("a.i.", "ai").replace("hack corruption", "hackcorruption")).split()
from faster_whisper import WhisperModel
asr = WhisperModel("small", device="cpu", compute_type="int8")
def score(wav, text):
    heard = " ".join(s.text for s in asr.transcribe(str(wav), language=LANG)[0])
    return difflib.SequenceMatcher(None, tok(text), tok(heard)).ratio(), heard.strip()

for item in json.loads(GUION.read_text()):
    if "real" in item: continue
    dst = OUT / f"{item['id']}.wav"
    if dst.exists() and "--force" not in sys.argv: continue
    texts = item.get("tts_variants") or [item.get("tts", item["say"])]
    need_ai = "AI" in item["say"].split() or "AI," in item["say"] or "AI." in item["say"]
    best = None
    for text, seed in [(x, s) for x in texts for s in (7, 11, 23)]:
        g = call("/generate", {"profile_id": PROFILE, "text": text, "language": LANG, "engine": "chatterbox", "seed": seed})
        h = wait(g["id"])
        if h["status"] != "completed": print(item["id"], seed, "failed", h.get("error")); continue
        src = Path("/root/voicebox-data/generations") / f"{g['id']}.wav"
        sc, heard = score(src, text); print(f"{item['id']} seed {seed}: {sc:.0%} «{heard}»", flush=True)
        ai_ok = not need_ai or re.search(r"\bA\.? ?I\b", heard)   # "AI" must be heard as AI, not "eye"/"OI"
        raw = sc
        if ai_ok: sc += 1                                            # any take that says AI beats one that doesn't
        if best is None or sc > best[0]: best = (sc, src)
        if ai_ok and raw >= .97: break
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(best[1]), "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                    "-ar", "48000", "-ac", "1", str(dst)], check=True)
    print(item["id"], "→", best[1].name, flush=True)
