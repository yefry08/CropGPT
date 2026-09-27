"""Per-channel production recipes: which engine/pipeline runs a job and with what brief.

M1 ships the plumbing; the channel briefs are filled in at M2 (geopolitics),
M3 (AI news) and M4 (Contractor AI).
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from pathlib import Path

from ..agent.checkpoints import pipeline_stages
from ..agent.supervisor import EngineJob
from ..config import AppConfig


@dataclass
class ChannelRecipe:
    channel: str
    pipeline: str                     # OpenMontage pipeline manifest name
    final_stage: str | None = None    # stop here; later stages (e.g. publish) belong to ChannelForge
    script_checks: bool = False       # originality + fact layer at the script gate
    long_video: bool = False          # ffprobe duration gate after compose

    def pipeline_for(self, job: dict) -> str:
        return self.pipeline

    def brief(self, job: dict) -> str:
        raise NotImplementedError(f"channel '{self.channel}' is implemented in a later milestone")


class SmokeRecipe(ChannelRecipe):
    """OpenMontage's own framework-smoke pipeline (research -> script, both gated).

    Used by the M1 demo and tests to exercise routing, gates and resume
    without spending on media generation.
    """

    def brief(self, job: dict) -> str:
        return (f"Run the OpenMontage 'framework-smoke' pipeline for project '{job['project_id']}'. "
                "Initialise the project with lib.checkpoint.init_project, then produce a schema-valid "
                "research_brief and script about the topic below, honouring each stage's approval gate.\n\n"
                f"Topic / notes:\n{job['input_text']}")


LANG_NAMES = {"es": "Spanish", "en": "English", "pt": "Portuguese"}

SOURCES_SCHEMA = """{"claims": [{"id": "c1", "section_id": "<script section id>", "text": "<the claim as narrated>",
  "kind": "fact|statistic|allegation",
  "legal_status": "accused|charged|under_investigation|convicted|acquitted|sanctioned  (allegations only)",
  "sources": [{"url": "https://...", "title": "...", "publisher": "...",
               "type": "dataset|official|court_ruling|official_audit|news|academic|other"}]}]}"""


def reference_block(job: dict) -> str:
    out = Path(job.get("output_dir") or "")
    info = out / "reference" / "input.json"
    if not info.exists():
        return "No reference video: work from the topic/notes."
    data = json.loads(info.read_text(encoding="utf-8"))
    refs = data.get("references", [])
    if not refs:
        return "No reference video: work from the topic/notes."
    lines = ["REFERENCE VIDEO(S) — for analysis only:"]
    for n, r in enumerate(refs, 1):
        tpath = out / "reference" / f"ref{n:02d}" / "transcript.txt"
        lines.append(f"- {r.get('title') or r['url']} ({r['url']}); transcript: {tpath if tpath.exists() else 'unavailable'}"
                     + (f"; note: {r['error']}" if r.get("error") else ""))
    lines.append("Read skills/meta/video-reference-analyst.md and extract ONLY hook style, pacing, structure and "
                 "tone. Produce an ORIGINAL script with a new angle. Never reuse the reference's footage, audio, "
                 "thumbnail or script text. ChannelForge rejects the script if more than 10% of its 5-word "
                 "sequences also appear in the reference transcript.")
    return "\n".join(lines)


class GeopoliticsRecipe(ChannelRecipe):
    """Channel 3 — geopolitics, sports x politics and data: long 16:9 data explainer."""

    def pipeline_for(self, job: dict) -> str:
        if job["render_backend"] == "documentary-montage":
            raise ValueError("documentary-montage cannot run Channel 3: it has no script stage for the mandatory "
                             "fact layer and uses real footage of real people; use animated-explainer")
        return self.pipeline

    def brief(self, job: dict) -> str:
        pid, lang = job["project_id"], LANG_NAMES.get(job["language"], job["language"])
        return f"""Produce a long-form data-driven geopolitics explainer with the OpenMontage '{self.pipeline_for(job)}'
pipeline. Project id: '{pid}' (init with lib.checkpoint.init_project, title from the concept, style playbook
'{job["visual_style"]}'). Follow AGENT_GUIDE.md, the pipeline manifest and every stage director skill.

CHANNEL: Geopolitics, sports x politics, and data. Style: data-driven explainer — animated maps, animated
charts, stat reveals and timelines. Prefer Remotion for these (log both runtimes in decision_log as the guide
requires). Narration and on-screen text language: {lang}.

HARD DELIVERY CONSTRAINTS
- Long video: 16:9, 1920x1080, final duration 480–600 seconds (target ~540 s). Plan ~1,200–1,500 narration
  words at ~150 wpm. ChannelForge measures the render with ffprobe and sends it back if it is outside the
  range. Never pad with silence, freeze frames or slowed audio to hit the duration.
- Background music must cover the whole duration (request tracks at least as long as the video, or
  crossfade several); record each track's licence in the asset manifest.
- Stop after the 'compose' stage. Do NOT run the publish stage — ChannelForge owns publishing. The
  render_report must list the 1920x1080 MP4 (under projects/{pid}/renders/) in outputs[0].
- Budget cap for this video: ${job["budget_cap_usd"]:.2f} for all paid tools. Estimate before paid calls; if the
  estimate exceeds the cap, stop at the proposal gate and say so.

DATA AND FACTS (mandatory)
- Every number must come from a citable dataset or official source: World Bank, IMF, SIPRI, UN agencies, OECD,
  national statistics offices, official sports federations, election authorities, court or audit records.
  Name the dataset and year on screen when a figure appears.
- At the script stage, also write projects/{pid}/artifacts/sources.json mapping EVERY factual claim in the
  narration to at least one source URL, in exactly this shape:
  {SOURCES_SCHEMA}
- Allegations of wrongdoing against named people or entities: only when backed by a court ruling, an official
  audit, or 2+ reputable outlets; narrate with the accurate legal status (accused / under investigation /
  convicted). A second model fact-checks the script against sources.json before the gate.
- Never depict a real person photorealistically: maps, flags, charts, icons, silhouettes or illustration only.
  Do not generate images of real people.

{reference_block(job)}

TOPIC / NOTES FROM THE HUMAN:
{job["input_text"]}
"""


RECIPES: dict[str, ChannelRecipe] = {
    "geopolitics": GeopoliticsRecipe("geopolitics", "animated-explainer", final_stage="compose",
                                     script_checks=True, long_video=True),
    "ai_news": SmokeRecipe("ai_news", "framework-smoke"),
    "contractor_ai": SmokeRecipe("contractor_ai", "framework-smoke"),
}


# The framework-smoke pipeline on every channel: used by the demo and the M1 plumbing tests.
SMOKE_RECIPES: dict[str, ChannelRecipe] = {c: SmokeRecipe(c, "framework-smoke") for c in RECIPES}


def slugify(text: str, max_len: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (s[:max_len].rstrip("-") or "job")


def project_id_for(job: dict) -> str:
    return job.get("project_id") or f"cf{job['id']}-{job['channel'].replace('_', '-')}-{slugify(job['input_text'], 24)}"


def build_engine_job(cfg: AppConfig, job: dict, recipes: dict[str, ChannelRecipe] = RECIPES) -> EngineJob:
    recipe = recipes[job["channel"]]
    pipeline = recipe.pipeline_for(job)
    engine_dir = cfg.openmontage_dir
    job = {**job, "project_id": project_id_for(job)}
    stages = [s["name"] for s in pipeline_stages(engine_dir, pipeline)]
    if recipe.final_stage and recipe.final_stage in stages:
        stages = stages[:stages.index(recipe.final_stage) + 1]
    return EngineJob(
        job_id=job["id"], engine_dir=engine_dir, project_id=job["project_id"],
        project_dir=engine_dir / "projects" / job["project_id"], pipeline=pipeline, stages=stages,
        initial_prompt=recipe.brief(job), budget_cap_usd=job["budget_cap_usd"], language=job["language"],
        directive=job.get("directive"))


def job_output_dir(cfg: AppConfig, job: dict) -> Path:
    d = cfg.output_root / f"{job['id']:05d}-{job['channel']}-{time.strftime('%Y%m%d', time.localtime(job['created_at']))}"
    d.mkdir(parents=True, exist_ok=True)
    return d
