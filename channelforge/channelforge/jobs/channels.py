"""Per-channel production recipes: which engine/pipeline runs a job and with what brief.

M1 ships the plumbing; the channel briefs are filled in at M2 (geopolitics),
M3 (AI news) and M4 (Contractor AI).
"""

from __future__ import annotations

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


RECIPES: dict[str, ChannelRecipe] = {
    "geopolitics": SmokeRecipe("geopolitics", "framework-smoke"),
    "ai_news": SmokeRecipe("ai_news", "framework-smoke"),
    "contractor_ai": SmokeRecipe("contractor_ai", "framework-smoke"),
}


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
    return EngineJob(
        job_id=job["id"], engine_dir=engine_dir, project_id=job["project_id"],
        project_dir=engine_dir / "projects" / job["project_id"], pipeline=pipeline, stages=stages,
        initial_prompt=recipe.brief(job), budget_cap_usd=job["budget_cap_usd"], language=job["language"])


def job_output_dir(cfg: AppConfig, job: dict) -> Path:
    d = cfg.output_root / f"{job['id']:05d}-{job['channel']}-{time.strftime('%Y%m%d', time.localtime(job['created_at']))}"
    d.mkdir(parents=True, exist_ok=True)
    return d
