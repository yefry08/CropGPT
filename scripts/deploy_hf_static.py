"""Deploy the static build to a (free) Hugging Face static Space.

Exports the data (scripts/export_static.py), builds the frontend with VITE_STATIC=1, and uploads
frontend/dist-static/ with a Space README. No server runs: fixture results are precomputed by the Python backend,
and changing the weights re-runs the matching in the browser (frontend/src/lib/engine.ts).

    uvx --from huggingface_hub hf auth login          # once (you run this)
    uv run --with huggingface_hub python scripts/deploy_hf_static.py --space <user>/cropgpt [--allow-partial]
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pandas as pd
from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / "frontend"
DIST = FRONT / "dist-static"
EXPORT = FRONT / "static-export"
GRID = ROOT / "data" / "reference_grid.parquet"

SPACE_README = """---
title: CropGPT
emoji: 🌱
colorFrom: green
colorTo: blue
sdk: static
app_file: index.html
pinned: false
short_description: Find your field's twin and the techniques that transfer
---

# CropGPT — CropMatch Analog Engine (static demo)

Finds the closest biophysical analogs of a land parcel in documented agricultural-innovation regions and screens a
cited technique library against the parcel's own data. This static build serves three recorded parcels (Chaco
Paraguayo, Monte Plata, San José de Ocoa); their results were computed by the Python backend from recorded
satellite and soil data, and changing the dimension weights re-runs the matching in the browser.

Reference grid in this build: {n} cells.{partial}
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--space", required=True)
    ap.add_argument("--private", action="store_true")
    ap.add_argument("--allow-partial", action="store_true")
    args = ap.parse_args()

    n = len(pd.read_parquet(GRID, columns=["cell_id"]))
    if n < 1900 and not args.allow_partial:
        sys.exit(f"reference grid has only {n} cells; finish the build (or pass --allow-partial).")
    api = HfApi()
    try:
        user = api.whoami()["name"]
    except Exception:
        sys.exit("Not logged in to Hugging Face: run `uvx --from huggingface_hub hf auth login` first.")
    print(f"logged in as {user}; reference grid: {n} cells", flush=True)

    subprocess.run([sys.executable, str(ROOT / "scripts" / "export_static.py")], check=True)
    npm = shutil.which("npm") or sys.exit("npm not found")
    subprocess.run([npm, "run", "build"], cwd=FRONT, env={**os.environ, "VITE_STATIC": "1"}, check=True)
    shutil.copytree(EXPORT, DIST / "static-api", dirs_exist_ok=True)
    partial = "" if n >= 1900 else " This is a preview: the grid is still being computed, so analogs will change."
    (DIST / "README.md").write_text(SPACE_README.format(n=n, partial=partial), encoding="utf-8")

    api.create_repo(args.space, repo_type="space", space_sdk="static", private=args.private, exist_ok=True)
    api.upload_folder(folder_path=str(DIST), repo_id=args.space, repo_type="space",
                      commit_message=f"Deploy CropGPT static demo ({n}-cell reference grid)",
                      delete_patterns=["assets/*", "static-api/*"])
    owner, name = args.space.split("/", 1)
    host = f"{owner}-{name}".lower().replace("_", "-").replace(".", "-")
    print(f"Space:   https://huggingface.co/spaces/{args.space}")
    print(f"App URL: https://{host}.static.hf.space")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
