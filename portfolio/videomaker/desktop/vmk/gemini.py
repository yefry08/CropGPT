"""Narration with a Gemini prebuilt voice (Google AI Studio TTS), as an alternative to the cloned voice.
The key is read from the GEMINI_API_KEY environment variable; it is never written to disk or printed."""
import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
import wave

API = "https://generativelanguage.googleapis.com/v1beta"
VOICES = ["Charon", "Puck", "Kore", "Fenrir", "Aoede", "Orus", "Zephyr", "Leda"]


def _req(path, body=None, timeout=300):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("Set GEMINI_API_KEY (Google AI Studio key) in the environment.")
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"x-goog-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def pick_model():
    """The newest non-lite TTS model this key can use (ListModels), so no model id is hard-coded."""
    names, page = [], ""
    while True:
        d = _req("/models?pageSize=200" + (f"&pageToken={page}" if page else ""))
        names += [m["name"].split("/", 1)[1] for m in d.get("models", []) if "tts" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", [])]
        page = d.get("nextPageToken")
        if not page:
            break
    if not names:
        raise RuntimeError("No TTS model is available to this key.")
    full = [n for n in names if "lite" not in n] or names
    return sorted(full, key=lambda n: ("preview" not in n, [int(x) for x in re.findall(r"\d+", n)]))[-1]


def synth(text, out_wav, voice="Charon", model=None):
    """Speak `text` (only the words: instructions before them would be read aloud) into a 16-bit mono wav."""
    model = model or pick_model()
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    for attempt in range(8):
        try:
            part = _req(f"/models/{model}:generateContent", body)["candidates"][0]["content"]["parts"][0]["inlineData"]
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) or (e.code == 400 and attempt < 2):   # preview models sometimes 400 once
                time.sleep(int(e.headers.get("retry-after") or 0) or 20 * (attempt + 1)); continue
            raise RuntimeError(f"Gemini TTS failed: HTTP {e.code}: {e.read()[:300]!r}")
        rate = int(m.group(1)) if (m := re.search(r"rate=(\d+)", part.get("mimeType", ""))) else 24000
        with wave.open(str(out_wav), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(base64.b64decode(part["data"]))
        return model
    raise RuntimeError("Gemini TTS kept failing (rate limit or server errors); try again later.")
