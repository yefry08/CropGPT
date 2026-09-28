"""Rendering for the hand-drawn-canvas-animation skill: preview grid, full render, audio mix.

Uses the skill's own scripts/render.mjs (puppeteer-core + system Chrome + ffmpeg). The film's
generated score, when it has one, sits under the narration.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

from ..config import app_home

CHROME_CANDIDATES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
CHROME_PATHS = [                                    # standard installs that are not on PATH
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
]


def chrome_env(chrome_bin: str = "") -> dict[str, str]:
    """render.mjs reads CHROME. As root on Linux Chrome needs --no-sandbox, so wrap it."""
    env = dict(os.environ)
    chrome = (chrome_bin or os.environ.get("CHROME", "")
              or next((shutil.which(c) for c in CHROME_CANDIDATES if shutil.which(c)), "")
              or next((c for c in CHROME_PATHS if "%" not in c and Path(c).exists()), ""))
    if chrome.endswith("chrome-nosandbox"):          # our own wrapper, already exported earlier
        return env
    if not chrome and Path("/opt/pw-browsers").exists():
        found = sorted(Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome"))
        chrome = str(found[-1]) if found else ""
    if chrome and sys.platform.startswith("linux") and hasattr(os, "geteuid") and os.geteuid() == 0:
        wrapper = app_home() / "bin" / "chrome-nosandbox"
        wrapper.parent.mkdir(parents=True, exist_ok=True)
        wrapper.write_text(f'#!/bin/sh\nexec "{chrome}" --no-sandbox "$@"\n')
        wrapper.chmod(0o755)
        chrome = str(wrapper)
    if chrome:
        env["CHROME"] = chrome
    return env


def ensure_deps(film_dir: Path) -> None:
    if not (film_dir / "node_modules" / "puppeteer-core").exists():
        subprocess.run(["npm", "i", "--no-audit", "--no-fund"], cwd=film_dir, check=True, capture_output=True,
                       timeout=600)


def _render(film_html: Path, args: list[str], chrome_bin: str = "", timeout: int = 7200) -> None:
    film_dir = film_html.parent
    ensure_deps(film_dir)
    p = subprocess.run(["node", "render.mjs", film_html.name, *args], cwd=film_dir, env=chrome_env(chrome_bin),
                       capture_output=True, text=True, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"render.mjs failed: {(p.stderr or p.stdout)[-800:]}")


def preview_grid(film_html: Path, chrome_bin: str = "") -> Path:
    _render(film_html, ["--grid", "24"], chrome_bin, timeout=900)
    return film_html.parent / "out" / f"{film_html.stem}-grid.jpg"


def render_film(film_html: Path, chrome_bin: str = "") -> tuple[Path, Path | None]:
    _render(film_html, ["--ar", "16:9", "--width", "1920"], chrome_bin)
    out = film_html.parent / "out"
    video = out / f"{film_html.stem}.mp4"
    score = out / f"{film_html.stem}-score.wav"
    return video, (score if score.exists() else None)


def mux(video: Path, narration: Path, score: Path | None, out: Path, score_gain: float = 0.15) -> Path:
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-i", str(narration)]
    if score:
        cmd += ["-i", str(score), "-filter_complex",
                f"[1:a]apad[n];[2:a]volume={score_gain}[s];[n][s]amix=inputs=2:duration=first:normalize=0[a]"]
    else:
        cmd += ["-filter_complex", "[1:a]apad[a]"]
    cmd += ["-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)]
    subprocess.run(cmd, check=True)
    return out
