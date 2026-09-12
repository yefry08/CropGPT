"""One-command demo: build the frontend if needed, start the API (which serves it), open the browser.

    uv run python scripts/demo.py               # offline (default): fixtures only, no network, no credentials
    uv run python scripts/demo.py --mode live   # live: any parcel, queries the no-auth data mirrors
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist" / "index.html"


def newest(path: Path) -> float:
    return max((p.stat().st_mtime for p in path.rglob("*") if p.is_file()), default=0.0)


def build_frontend() -> None:
    npm = shutil.which("npm")
    if npm is None:
        sys.exit("npm not found: install Node.js 20+ (https://nodejs.org) to build the frontend.")
    stale = not DIST.exists() or newest(FRONTEND / "src") > DIST.stat().st_mtime
    if not stale:
        return
    if not (FRONTEND / "node_modules").exists():
        subprocess.run([npm, "install"], cwd=FRONTEND, check=True)
    print("building frontend...", flush=True)
    subprocess.run([npm, "run", "build"], cwd=FRONTEND, check=True)


def main() -> int:
    # Windows consoles default to cp1252; never let a status line crash the demo.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["offline", "live"], default="offline")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    if not (ROOT / "data" / "reference_grid.parquet").exists():
        sys.exit("data/reference_grid.parquet is missing. It ships with the repo; rebuild it with `make grid`.")
    if args.mode == "live" and not (ROOT / "data" / "static" / "worldclim").exists():
        sys.exit("Live mode needs the static rasters: run `make static` first (~450 MB download).")
    build_frontend()

    os.environ["DEMO_MODE"] = args.mode
    url = f"http://127.0.0.1:{args.port}"
    if not args.no_browser:
        threading.Thread(target=lambda: (time.sleep(2.5), webbrowser.open(url)), daemon=True).start()
    print(f"CropMatch ({args.mode} mode) at {url}", flush=True)
    import uvicorn

    sys.path.insert(0, str(ROOT / "backend"))
    uvicorn.run("cropmatch.api:app", host="127.0.0.1", port=args.port, log_level="info")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
