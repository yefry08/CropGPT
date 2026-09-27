#!/usr/bin/env python3
"""Checkpoint writer for ChannelForge pipelines that are not OpenMontage pipelines.

Same JSON shape as OpenMontage's lib/checkpoint.py, and the same gate rule: a stage whose
manifest sets human_approval_default: true cannot be written "completed" without --approved
(the agent passes it only after a ChannelForge approval message for that stage).

  python cf_checkpoint.py <project_dir> <stage> <status> [--artifact name=relative/path.json ...]
                          [--approved] [--meta key=value ...]
"""

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

STATUSES = ("in_progress", "awaiting_human", "completed", "failed")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("stage")
    ap.add_argument("status", choices=STATUSES)
    ap.add_argument("--artifact", action="append", default=[])
    ap.add_argument("--meta", action="append", default=[])
    ap.add_argument("--approved", action="store_true")
    a = ap.parse_args(argv)

    proj = Path(a.project_dir)
    marker = json.loads((proj / "project.json").read_text(encoding="utf-8"))
    manifest = yaml.safe_load(Path(marker["manifest"]).read_text(encoding="utf-8"))
    stages = {s["name"]: s for s in manifest["stages"]}
    if a.stage not in stages:
        print(f"unknown stage {a.stage!r}; valid: {list(stages)}", file=sys.stderr)
        return 2
    spec = stages[a.stage]
    if spec.get("owner") == "app":
        print(f"stage {a.stage!r} is run by ChannelForge, not the agent", file=sys.stderr)
        return 2
    gated = bool(spec.get("human_approval_default"))
    if gated and a.status == "completed" and not a.approved:
        print(f"GATE VIOLATION: {a.stage!r} requires human approval. Write awaiting_human and end your turn.",
              file=sys.stderr)
        return 3
    order = [s["name"] for s in manifest["stages"]]
    for prev in order[:order.index(a.stage)]:
        p = proj / f"checkpoint_{prev}.json"
        if not p.exists() or json.loads(p.read_text())["status"] != "completed":
            print(f"stage {prev!r} must be completed before {a.stage!r}", file=sys.stderr)
            return 4

    artifacts = {}
    for spec_a in a.artifact:
        name, _, rel = spec_a.partition("=")
        path = proj / rel
        if not path.exists():
            print(f"artifact file not found: {path}", file=sys.stderr)
            return 5
        artifacts[name] = rel
    if a.status in ("awaiting_human", "completed"):
        missing = [n for n in spec.get("produces", []) if n not in artifacts]
        if missing:
            print(f"{a.stage!r} must include artifacts {missing}", file=sys.stderr)
            return 5

    cp_path = proj / f"checkpoint_{a.stage}.json"
    if cp_path.exists():                       # keep history, like OpenMontage
        old = json.loads(cp_path.read_text())
        if old.get("status") in ("completed", "awaiting_human"):
            hist = proj / "history"
            hist.mkdir(exist_ok=True)
            shutil.copy2(cp_path, hist / f"checkpoint_{a.stage}.{old['timestamp'].replace(':', '')}.json")
    cp = {"version": "1.0", "project_id": marker["project_id"], "pipeline_type": manifest["name"],
          "stage": a.stage, "status": a.status, "timestamp": datetime.now(timezone.utc).isoformat(),
          "human_approval_required": gated, "human_approved": bool(a.approved), "artifacts": artifacts,
          "metadata": dict(m.split("=", 1) for m in a.meta)}
    tmp = cp_path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(cp, indent=2))
    os.replace(tmp, cp_path)
    print(f"wrote {cp_path.name}: {a.status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
