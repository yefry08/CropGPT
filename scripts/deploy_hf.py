"""Deploy to a Hugging Face Docker Space: create the Space if needed and upload the source. HF builds the image.

    uvx --from huggingface_hub hf auth login          # once, with a write token (you run this, not the script)
    uv run --with huggingface_hub python scripts/deploy_hf.py --space <user>/cropgpt

Refuses to deploy an incomplete reference grid unless --allow-partial is given.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parents[1]
GRID = ROOT / "data" / "reference_grid.parquet"
IGNORE = [
    ".git/*", ".venv/*", ".claude/*", ".pytest_cache/*", "**/__pycache__/*", "*.pyc", ".env",
    "frontend/node_modules/*", "frontend/dist/*", "data/static/*", "data/cache/*",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--space", required=True, help="<user-or-org>/<space-name>, e.g. yefry08/cropgpt")
    ap.add_argument("--private", action="store_true")
    ap.add_argument("--allow-partial", action="store_true", help="deploy even if the grid has < 1,900 cells")
    args = ap.parse_args()

    if not GRID.exists():
        sys.exit("data/reference_grid.parquet is missing; build it first.")
    n = len(pd.read_parquet(GRID, columns=["cell_id"]))
    if n < 1900 and not args.allow_partial:
        sys.exit(f"reference grid has only {n} cells; finish the build (or pass --allow-partial).")

    api = HfApi()
    try:
        user = api.whoami()["name"]
    except Exception:
        sys.exit("Not logged in to Hugging Face: run `uvx --from huggingface_hub hf auth login` first.")
    print(f"logged in as {user}; reference grid: {n} cells")

    api.create_repo(args.space, repo_type="space", space_sdk="docker", private=args.private, exist_ok=True)
    commit = api.upload_folder(folder_path=str(ROOT), repo_id=args.space, repo_type="space",
                               ignore_patterns=IGNORE, commit_message=f"Deploy CropGPT ({n}-cell reference grid)")
    owner, name = args.space.split("/", 1)
    sub = f"{owner}-{name}".lower().replace("_", "-").replace(".", "-")
    print(f"uploaded: {commit.commit_url if hasattr(commit, 'commit_url') else commit}")
    print(f"Space:   https://huggingface.co/spaces/{args.space}  (build logs under 'Logs')")
    print(f"App URL: https://{sub}.hf.space  (live once the build finishes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
