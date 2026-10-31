#!/usr/bin/env python3
"""Narrate a videomaker project with a Gemini prebuilt voice and export the video.

    GEMINI_API_KEY=... python gemini_voice.py <project_folder> [--voice Charon] [--no-render]

Writes audio/<section>.wav (trimmed, project tempo), then <title>.mp4 and descripcion.md in the project folder."""
import sys
from pathlib import Path

from vmk import gemini, project as P, voice
from vmk.film import render


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    folder = Path(args[0]); vname = sys.argv[sys.argv.index("--voice") + 1] if "--voice" in sys.argv else "Charon"
    p = P.load(folder); (folder / "audio").mkdir(exist_ok=True); model = None
    p["credits"] = [p["credits"][0].replace("Voz sintética clonada (Voicebox)", "Voz sintética (Gemini)").replace("Cloned synthetic voice (Voicebox)", "Synthetic voice (Gemini)")] + p["credits"][1:]
    for s in p["sections"]:
        raw = folder / "audio" / f"{s['id']}.gemini.wav"
        model = gemini.synth(s.get("tts") or s["text"], raw, vname, model)
        voice.trim(raw, P.audio_path(folder, s), p.get("tempo", 1.0)); raw.unlink()
        print(f"  {s['id']:6s} {voice.duration(P.audio_path(folder, s)):5.1f} s  ({model}, {vname})", flush=True)
    P.save(p, folder)
    if "--no-render" in sys.argv:
        return
    tp = P.timed(p, folder); nar = folder / "audio" / "narration.wav"
    voice.narration([P.audio_path(folder, s) for s in tp["sections"]], p.get("gap", .45), nar)
    out = folder / f"{P.safe_name(p['title'])}.mp4"
    render(tp, out, nar, progress=lambda f: print(f"\r  render {int(f * 100):3d} %", end="", flush=True))
    (folder / "descripcion.md").write_text(P.description(tp).replace("Voz sintética clonada de mi propia voz", "Voz sintética de Gemini"), encoding="utf-8")
    print(f"\n→ {out}")


if __name__ == "__main__":
    main()
