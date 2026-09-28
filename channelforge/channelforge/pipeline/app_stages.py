"""Stages ChannelForge runs itself (owner: app in the pipeline manifest)."""

from __future__ import annotations

import json
import os
import shutil
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType
from typing import Callable

import yaml

from ..agent.supervisor import EngineJob
from . import gates, handdrawn, narration, omni

CF_TOOLS = Path(__file__).resolve().parents[1] / "engine_support"


def init_project(ej: EngineJob, manifest: Path, title: str) -> None:
    """Create a ChannelForge-pipeline project (same marker/checkpoint layout as OpenMontage)."""
    ej.project_dir.mkdir(parents=True, exist_ok=True)
    for sub in ("artifacts", "tools", "history"):
        (ej.project_dir / sub).mkdir(exist_ok=True)
    shutil.copy2(CF_TOOLS / "cf_checkpoint.py", ej.project_dir / "tools" / "cf_checkpoint.py")
    marker = ej.project_dir / "project.json"
    if not marker.exists():
        marker.write_text(json.dumps({"version": "1.0", "project_id": ej.project_id, "title": title,
                                      "pipeline_type": yaml.safe_load(manifest.read_text())["name"],
                                      "manifest": str(manifest), "created_at": datetime.now(timezone.utc).isoformat()},
                                     indent=2))


def write_checkpoint(ej: EngineJob, stage: str, status: str, artifacts: dict, metadata: dict | None = None) -> None:
    p = ej.project_dir / f"checkpoint_{stage}.json"
    tmp = p.with_suffix(".json.tmp")
    tmp.write_text(json.dumps({"version": "1.0", "project_id": ej.project_id, "pipeline_type": ej.pipeline,
                               "stage": stage, "status": status, "timestamp": datetime.now(timezone.utc).isoformat(),
                               "human_approval_required": False, "human_approved": False, "artifacts": artifacts,
                               "metadata": {"by": "channelforge", **(metadata or {})}}, indent=2))
    os.replace(tmp, p)


@dataclass
class StageOutcome:
    ok: bool
    note: str = ""              # for the agent when not ok (becomes a directive)
    reopen_from: str | None = None


END_CARDS = {"hand-drawn-news": narration.END_CARD_S, "stickman-omni": omni.CTA_S}
# where a failed narration length check sends the job back
SCRIPT_STAGE = {"hand-drawn-news": "script", "stickman-omni": "direction"}


@dataclass
class JobContext:
    job: dict
    budget_left: Callable[[], float]
    record_spend: Callable[[str, str, float], None]      # (tool, stage, usd)
    cta_title: str = "Contractor AI"
    cta_line: str = ""


class AppStages:
    def __init__(self, synth_factory: Callable[[], narration.Synth], renderer: ModuleType = handdrawn,
                 chrome_bin: str = "", omni_tools: Callable[[str], tuple] | None = None,
                 bgm_fn: Callable[[EngineJob, float], Path | None] | None = None):
        self.synth_factory = synth_factory
        self.renderer = renderer
        self.chrome_bin = chrome_bin
        self.omni_tools = omni_tools          # backend -> (generate, estimate)
        self.bgm_fn = bgm_fn or (lambda ej, secs: next(iter(sorted((ej.project_dir / "audio").glob("bgm.*"))), None))

    def run(self, stage: str, ej: EngineJob, log: Callable[[str], None], ctx: JobContext | None = None) -> StageOutcome:
        fn = getattr(self, f"stage_{stage}_{ej.pipeline.replace('-', '_')}", None) or getattr(self, f"stage_{stage}")
        return fn(ej, log, ctx)

    def stage_narration(self, ej: EngineJob, log, ctx=None) -> StageOutcome:
        src = SCRIPT_STAGE.get(ej.pipeline, "script")
        end_card = END_CARDS.get(ej.pipeline, narration.END_CARD_S)
        cp = gates._checkpoint(ej, src)
        script = gates._artifact(ej, cp, "script") if cp else None
        if not script:
            return StageOutcome(False, "The script artifact is missing.", src)
        t0 = time.monotonic()
        res = narration.build(ej.project_dir, script, self.synth_factory(), end_card)
        log(f"narration: {len(res.sections)} sections, {res.total_s:.1f} s voice + {end_card:.0f} s "
            f"end card = {res.film_s:.1f} s ({time.monotonic() - t0:.0f} s to synthesise)")
        if not res.in_range:
            words = sum(len(s["text"].split()) for s in res.sections)
            target = round(words * (gates.duration.TARGET_S - end_card) / res.total_s)
            return StageOutcome(False, (
                f"The synthesised narration runs {res.total_s:.0f} s; with the end card the episode would be "
                f"{res.film_s:.0f} s, outside {gates.duration.LONG_MIN_S:.0f}–{gates.duration.LONG_MAX_S:.0f} s. "
                f"The script has {words} words; rewrite it to ~{target} words with substantive, sourced content "
                "(no filler), update sources.json, and resubmit the script."), src)
        write_checkpoint(ej, "narration", "completed", {"narration": "artifacts/narration.json"},
                         {"total_s": res.total_s, "film_s": res.film_s})
        return StageOutcome(True)

    def film_html(self, ej: EngineJob) -> Path | None:
        cp = gates._checkpoint(ej, "film")
        rel = ((cp or {}).get("artifacts") or {}).get("film")
        p = ej.project_dir / rel if rel else None
        return p if p and p.exists() else None

    def preview(self, ej: EngineJob) -> tuple[Path | None, str]:
        html = self.film_html(ej)
        if not html:
            return None, "The film artifact (film/<name>.html) is missing."
        try:
            return self.renderer.preview_grid(html, self.chrome_bin), ""
        except Exception as e:
            return None, f"The film failed to render a preview: {e}"

    def stage_compose(self, ej: EngineJob, log, ctx=None) -> StageOutcome:
        html = self.film_html(ej)
        if not html:
            return StageOutcome(False, "The approved film artifact is missing.", "film")
        nar = json.loads((ej.project_dir / "artifacts" / "narration.json").read_text())
        t0 = time.monotonic()
        video, score = self.renderer.render_film(html, self.chrome_bin)
        log(f"film rendered in {time.monotonic() - t0:.0f} s" + ("" if score else " (no score found)"))
        out = ej.project_dir / "renders"
        out.mkdir(exist_ok=True)
        final = self.renderer.mux(video, ej.project_dir / nar["audio"], score, out / "final.mp4")
        dur = narration.audio_seconds(final)
        write_checkpoint(ej, "compose", "completed", {"render_report": {"version": "1.0", "outputs": [
            {"path": str(final.relative_to(ej.project_dir)), "format": "mp4", "resolution": "1920x1080",
             "duration_seconds": round(dur, 3)}]}})
        return StageOutcome(True)

    # ------------------------------------------------------------ Channel 1, backend (a)
    def omni_plan(self, ej: EngineJob) -> tuple[list[dict], float]:
        cp = gates._checkpoint(ej, "prompts")
        clips = (gates._artifact(ej, cp, "clips") or {}).get("clips", []) if cp else []
        nar = json.loads((ej.project_dir / "artifacts" / "narration.json").read_text())
        return clips, float(nar["film_s"])

    def omni_estimate(self, ej: EngineJob, backend: str, aspect: str = "16:9") -> omni.CostEstimate:
        clips, film_s = self.omni_plan(ej)
        _gen, est = self.omni_tools(backend)
        return omni.estimate(clips, film_s, backend, est, aspect, ej.project_dir)

    def stage_clips(self, ej: EngineJob, log, ctx: JobContext) -> StageOutcome:
        backend = ctx.job["render_backend"]
        clips, film_s = self.omni_plan(ej)
        gen, est = self.omni_tools(backend)
        per = omni.estimate(clips, film_s, backend, est, "16:9").per_clip
        write_checkpoint(ej, "clips", "in_progress", {}, {"backend": backend})

        def on_clip(c, cost):
            ctx.record_spend(backend, "clips", cost)
            log(f"clip {c.get('id')} generated (${cost:.2f})")
        run = omni.generate(ej.project_dir, clips, film_s, backend, "16:9", gen, ctx.budget_left, per, on_clip)
        manifest = {"backend": backend, "clips": run.done, "total_s": round(run.total_s, 3), "film_s": film_s}
        (ej.project_dir / "artifacts" / "clip_manifest.json").write_text(json.dumps(manifest, indent=1))
        if run.stopped:
            raise RuntimeError(f"clip generation stopped: {run.stopped} ({len(run.done)} clips kept; raise the cap "
                               "and retry to continue from here)")
        if run.total_s + 0.25 < film_s:
            return StageOutcome(False, (f"All {len(clips)} prompts produced only {run.total_s:.0f} s of video; the "
                                        f"narration needs {film_s:.0f} s. Add continuation prompts (same locks and "
                                        "matched transitions) to clips.json and resubmit."), "prompts")
        write_checkpoint(ej, "clips", "completed", {"clip_manifest": "artifacts/clip_manifest.json"},
                         {"clips": len(run.done), "spent_usd": round(run.spent, 2)})
        log(f"clips: {len(run.done)} clips, {run.total_s:.1f} s of footage for {film_s:.1f} s")
        return StageOutcome(True)

    def stage_compose_stickman_omni(self, ej: EngineJob, log, ctx: JobContext) -> StageOutcome:
        man = json.loads((ej.project_dir / "artifacts" / "clip_manifest.json").read_text())
        nar = json.loads((ej.project_dir / "artifacts" / "narration.json").read_text())
        bgm = self.bgm_fn(ej, nar["film_s"])
        log("compose: conforming and stitching clips" + ("" if bgm else " (no BGM found: voice + SFX only)"))
        out = ej.project_dir / "renders"
        out.mkdir(exist_ok=True)
        final = omni.assemble(ej.project_dir, man["clips"], ej.project_dir / nar["audio"], nar["film_s"],
                              ctx.cta_title, ctx.cta_line, bgm, out / "final.mp4")
        write_checkpoint(ej, "compose", "completed", {"render_report": {"version": "1.0", "outputs": [
            {"path": str(final.relative_to(ej.project_dir)), "format": "mp4", "resolution": "1920x1080",
             "duration_seconds": round(narration.audio_seconds(final), 3)}]}})
        return StageOutcome(True)
