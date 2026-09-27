"""Read OpenMontage project state from disk.

Mirrors lib/checkpoint.py conventions without importing the engine (it has its
own dependency set): checkpoints live at
``<OpenMontage>/projects/<project_id>/checkpoint_<stage>.json`` with
``status`` in completed|failed|awaiting_human|in_progress, and stage order
comes from ``pipeline_defs/<pipeline>.yaml``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


def manifest_stages(path: Path) -> list[dict[str, Any]]:
    """Stages of a pipeline manifest: name, gated, owner (agent | app; OpenMontage stages are all agent)."""
    manifest = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    return [{"name": s["name"], "gated": bool(s.get("human_approval_default", False)),
             "owner": s.get("owner", "agent")} for s in manifest.get("stages", [])]


def pipeline_stages(openmontage_dir: Path, pipeline: str) -> list[dict[str, Any]]:
    return manifest_stages(openmontage_dir / "pipeline_defs" / f"{pipeline}.yaml")


@dataclass
class ProjectState:
    stages: list[str]
    status: dict[str, str]          # stage -> checkpoint status (missing = not started)
    checkpoints: dict[str, dict]

    @property
    def completed(self) -> list[str]:
        return [s for s in self.stages if self.status.get(s) == "completed"]

    @property
    def awaiting(self) -> list[str]:
        return [s for s in self.stages if self.status.get(s) == "awaiting_human"]

    @property
    def next_stage(self) -> str | None:
        for s in self.stages:
            if self.status.get(s) != "completed":
                return s
        return None

    @property
    def current_stage(self) -> str | None:
        for s in self.stages:
            if self.status.get(s) in ("in_progress", "awaiting_human", "failed"):
                return s
        return self.next_stage

    @property
    def done(self) -> bool:
        return bool(self.stages) and self.next_stage is None

    @property
    def started(self) -> bool:
        return bool(self.status)


def read_state(project_dir: Path, stages: list[str]) -> ProjectState:
    status: dict[str, str] = {}
    cps: dict[str, dict] = {}
    for stage in stages:
        p = project_dir / f"checkpoint_{stage}.json"
        if not p.exists():
            continue
        try:
            cp = json.loads(p.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue   # mid-write; the next poll will see it
        status[stage] = cp.get("status", "")
        cps[stage] = cp
    return ProjectState(stages=stages, status=status, checkpoints=cps)
