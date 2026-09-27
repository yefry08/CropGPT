"""ChannelForge's own checks at OpenMontage stage boundaries.

- Script gate: n-gram originality vs the reference transcript(s) and the fact layer
  (sources.json rules + critic model). Failures go back to the agent automatically.
- After compose: the long-video duration gate (ffprobe). Failures re-open the project from
  the script stage with a word target; superseded checkpoints are archived, never deleted.
"""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..agent.supervisor import EngineJob
from . import duration, facts, originality

MAX_AUTO_SENDBACKS = 3
MAX_REPLANS = 3


def _checkpoint(ej: EngineJob, stage: str) -> dict | None:
    p = ej.project_dir / f"checkpoint_{stage}.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def _artifact(ej: EngineJob, cp: dict, name: str) -> dict | None:
    """Checkpoint artifacts may be inline dicts or file paths (relative to the project or engine dir)."""
    art = (cp.get("artifacts") or {}).get(name)
    if isinstance(art, dict):
        return art
    if isinstance(art, str):
        for base in (ej.project_dir, ej.engine_dir, Path("/")):
            p = (base / art) if not Path(art).is_absolute() else Path(art)
            if p.exists():
                return json.loads(p.read_text(encoding="utf-8"))
    fallback = ej.project_dir / "artifacts" / f"{name}.json"
    return json.loads(fallback.read_text(encoding="utf-8")) if fallback.exists() else None


def script_text(ej: EngineJob) -> tuple[str, int]:
    cp = _checkpoint(ej, "script")
    script = _artifact(ej, cp, "script") if cp else None
    if not script:
        return "", 0
    text = "\n".join(s.get("text", "") for s in script.get("sections", []))
    return text, len(originality.tokens(text))


@dataclass
class GateResult:
    passed: bool
    note: str = ""
    reports: dict[str, Any] = field(default_factory=dict)


def reference_transcript(out_dir: Path) -> str:
    return "\n".join(p.read_text(encoding="utf-8") for p in sorted((out_dir / "reference").glob("ref*/transcript.txt")))


def script_gate(ej: EngineJob, out_dir: Path, router=None) -> GateResult:
    text, words = script_text(ej)
    reports_dir = out_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    if not text:
        return GateResult(False, "The script artifact is missing or empty; write the script checkpoint first.")
    ov = originality.overlap(text, reference_transcript(out_dir))
    fr = facts.check(ej.project_dir / "artifacts" / "sources.json", text, router, job_id=ej.job_id)
    reports = {"originality": {"passed": ov.passed, "overlap": round(ov.overlap, 4), "summary": ov.summary(),
                               "examples": ov.examples}, "facts": fr.to_json(), "script_words": words}
    (reports_dir / "script_gate.json").write_text(json.dumps(reports, indent=1, ensure_ascii=False), encoding="utf-8")
    notes = []
    if not ov.passed:
        notes.append(f"ORIGINALITY: {ov.summary()}. Rewrite in your own words with a new angle; these phrases "
                     f"are copied from the reference: " + "; ".join(f'"{e}"' for e in ov.examples))
    if not fr.passed:
        notes.append("FACTS: " + fr.as_note())
    return GateResult(not notes, "\n\n".join(notes), reports)


def find_render(ej: EngineJob) -> Path | None:
    cp = _checkpoint(ej, "compose")
    rr = _artifact(ej, cp, "render_report") if cp else None
    for out in (rr or {}).get("outputs", []):
        p = Path(out.get("path", ""))
        for cand in ([p] if p.is_absolute() else [ej.project_dir / p, ej.engine_dir / p]):
            if cand.exists() and cand.suffix.lower() in (".mp4", ".mov", ".mkv"):
                return cand
    renders = sorted((ej.project_dir / "renders").glob("*.mp4"), key=lambda q: q.stat().st_mtime)
    return renders[-1] if renders else None


def duration_gate(ej: EngineJob, out_dir: Path) -> tuple[GateResult, Path | None]:
    render = find_render(ej)
    if render is None:
        return GateResult(False, "No rendered MP4 found in render_report or renders/; complete compose."), None
    dc = duration.check(render)
    _, words = script_text(ej)
    rep = {"file": str(render), "duration_s": dc.duration_s, "resolution": f"{dc.width}x{dc.height}",
           "trailing_silence_s": dc.trailing_silence_s, "passed": dc.passed,
           "range_s": [duration.LONG_MIN_S, duration.LONG_MAX_S]}
    (out_dir / "reports").mkdir(parents=True, exist_ok=True)
    (out_dir / "reports" / "duration.json").write_text(json.dumps(rep, indent=1), encoding="utf-8")
    return GateResult(dc.passed, "" if dc.passed else dc.replan_note(words), {"duration": rep}), render


def reopen_from(ej: EngineJob, stage: str, tag: str) -> list[str]:
    """Archive the checkpoints of `stage` and every later stage so the agent redoes them."""
    if stage not in ej.stages:
        return []
    dest = ej.project_dir / "history" / tag
    moved = []
    for st in ej.stages[ej.stages.index(stage):]:
        p = ej.project_dir / f"checkpoint_{st}.json"
        if p.exists():
            dest.mkdir(parents=True, exist_ok=True)
            shutil.move(str(p), dest / p.name)
            moved.append(st)
    return moved


def collect_long(ej: EngineJob, out_dir: Path, render: Path) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(render, out_dir / "long.mp4")
    files = ["long.mp4"]
    src = ej.project_dir / "artifacts" / "sources.json"
    if src.exists():
        shutil.copy2(src, out_dir / "sources.json")
        files.append("sources.json")
    return files
