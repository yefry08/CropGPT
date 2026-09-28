"""After the long video passes its gate: 5 shorts, metadata, thumbnail, then the publish gate."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Callable

from ..agent.supervisor import EngineJob
from . import gates, metadata, shorts

LAYOUT = {"geopolitics": "stack"}          # charts and maps: never crop information away
PRESET = os.environ.get("CF_X264_PRESET", "medium")


def timed_sections(ej: EngineJob, video_s: float) -> list[dict]:
    nar = ej.project_dir / "artifacts" / "narration.json"
    if nar.exists():
        return json.loads(nar.read_text())["sections"]
    cp = next((gates._checkpoint(ej, s) for s in ej.stages if (gates._checkpoint(ej, s) or {}).get("artifacts", {}).get("script")), None)
    script = gates._artifact(ej, cp, "script") if cp else None
    secs = (script or {}).get("sections", [])
    total = float((script or {}).get("total_duration_seconds") or 0) or (secs[-1].get("end_seconds", 0) if secs else 0)
    k = video_s / total if total else 1.0          # scale planned timing to the real render
    return [{"id": s.get("id"), "start": float(s.get("start_seconds", 0)) * k, "text": s.get("text", "")} for s in secs]


def make(ej: EngineJob, job: dict, out_dir: Path, ask_segments: Callable[[str, str], str],
         ask_metadata: Callable[[str, str], str], transcribe: Callable[[Path, str], list] = shorts.transcribe_words,
         cta: dict | None = None, log: Callable[[str], None] = lambda m: None) -> dict:
    long_mp4 = out_dir / "long.mp4"
    video_s = float(metadata.duration.probe(long_mp4)["format"]["duration"])
    words_f = out_dir / "reports" / "words.json"
    if words_f.exists():
        words = json.loads(words_f.read_text())
    else:
        words = transcribe(long_mp4, job["language"])
        words_f.parent.mkdir(parents=True, exist_ok=True)
        words_f.write_text(json.dumps(words, ensure_ascii=False))
    log(f"transcript: {len(words)} timed words")
    sents = shorts.sentences(words)
    segs = shorts.pick_segments(sents, ask_segments, job["language"])
    layout = LAYOUT.get(job["channel"], "track")
    sdir = out_dir / "shorts"
    sdir.mkdir(exist_ok=True)
    made, problems = [], []
    for k, seg in enumerate(segs, 1):
        seg["index"] = k
        out = sdir / f"short_{k}.mp4"
        if not out.exists():
            shorts.render_short(long_mp4, seg, words, out, layout, PRESET)
        problems += shorts.check_short(out)
        made.append({"index": k, "file": f"shorts/short_{k}.mp4", "start": round(seg["start"], 2),
                     "end": round(seg["end"], 2), "hook": seg["hook"], "layout": layout,
                     "text": " ".join(s["text"] for s in sents[seg["first"]:seg["last"] + 1])})
        log(f"short {k}: {seg['end'] - seg['start']:.1f} s from {metadata.ts(seg['start'])} ({layout}) — {seg['hook']}")
    script_text = " ".join(s.get("text", "") for s in timed_sections(ej, video_s)) or " ".join(w["word"] for w in words)
    cta = cta or {}
    meta = metadata.build(ask_metadata, language=job["language"], channel=job["channel"], script_text=script_text,
                          sections=timed_sections(ej, video_s), video_s=video_s, sources_path=out_dir / "sources.json",
                          n_shorts=len(made), short_texts=[m["text"] for m in made], cta_url=cta.get("cta_url", ""),
                          cta_title=cta.get("cta_title", ""))
    for m, sm in zip(made, meta["shorts"]):
        sm.update({"file": m["file"], "hook": m["hook"], "start": m["start"], "end": m["end"]})
    thumb = metadata.thumbnail(long_mp4, meta["thumbnail"]["at_s"], meta["thumbnail"]["text"], out_dir / "thumbnail.jpg")
    problems += metadata.check_thumbnail(thumb)
    if len(made) != shorts.N_SHORTS:
        problems.append(f"{len(made)} shorts made, expected {shorts.N_SHORTS}")
    meta["long"] = {"file": "long.mp4", "duration_s": round(video_s, 2)}
    meta["thumbnail"]["file"] = "thumbnail.jpg"
    (out_dir / "metadata.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")
    report = {"shorts": made, "problems": problems}
    (out_dir / "reports" / "deliverables.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    return report
