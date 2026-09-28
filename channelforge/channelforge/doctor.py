"""`channelforge doctor`: what is installed, what is configured, and how to fix what is missing."""

from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import dataclass

from . import secrets
from .config import AppConfig
from .router import omniroute


@dataclass
class Check:
    name: str
    ok: bool
    detail: str
    fix: str = ""
    required: bool = True


ENGINE_REPOS = {
    "OpenMontage": "https://github.com/yefry08/OpenMontage.git",
    "stickman-video-director": "https://github.com/yefry08/stickman-video-director.git",
    "tools": "https://github.com/alesha-pro/tools.git",
}


def _version(cmd: list[str]) -> str | None:
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return (out.stdout or out.stderr).strip().splitlines()[0] if out.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired, IndexError):
        return None


def checks(cfg: AppConfig) -> list[Check]:
    out: list[Check] = []
    for tool in ("ffmpeg", "ffprobe"):
        v = _version([tool, "-version"])
        out.append(Check(tool, bool(v), v or "not found", "install FFmpeg (ffmpeg.org / brew install ffmpeg / winget install ffmpeg)"))
    node = _version(["node", "--version"])
    major = int(re.findall(r"\d+", node)[0]) if node else 0
    out.append(Check("node >= 22", major >= 22, node or "not found", "install Node.js 22+ (nodejs.org)"))
    out.append(Check("claude CLI", bool(shutil.which(cfg.claude_bin)), _version([cfg.claude_bin, "--version"]) or "not found",
                     "npm install -g @anthropic-ai/claude-code"))
    out.append(Check("omniroute CLI", bool(shutil.which(cfg.router.omniroute_bin)),
                     _version([cfg.router.omniroute_bin, "--version"]) or "not found", "npm install -g omniroute"))
    up = omniroute.is_up(cfg.router)
    out.append(Check("OmniRoute running", up, cfg.router.omniroute_url, "channelforge omniroute start", required=False))
    for name, url in ENGINE_REPOS.items():
        d = cfg.engines_dir / name
        out.append(Check(f"engine {name}", d.exists(), str(d), f"git clone {url} \"{d}\""))
    py = _version([cfg.engine_python, "-c", "import jsonschema, yaml, pydantic; print('engine deps ok')"])
    out.append(Check("engine python + OpenMontage deps", bool(py), f"{cfg.engine_python}: {py or 'missing deps'}",
                     "pip install -r engines/OpenMontage/requirements.txt (with engine_python in config.json)"))
    remotion = (cfg.openmontage_dir / "remotion-composer" / "node_modules").exists()
    out.append(Check("Remotion (Channel 3 charts/maps)", remotion, "remotion-composer/node_modules",
                     "cd engines/OpenMontage/remotion-composer && npm install", required=False))
    from .pipeline.handdrawn import chrome_env
    chrome = chrome_env().get("CHROME")
    out.append(Check("Chrome/Chromium (Channel 2 renders)", bool(chrome), chrome or "not found",
                     "install Google Chrome or set CHROME", required=False))
    for key, label in ((secrets.OMNIROUTE_API_KEY, "OmniRoute inference key"),
                       (secrets.OMNIROUTE_MANAGEMENT_TOKEN, "OmniRoute management token")):
        out.append(Check(label, secrets.has_secret(key), "keyring", f"channelforge secrets set {key}"
                         if key == secrets.OMNIROUTE_API_KEY else "channelforge omniroute connect"))
    tts = [v for v in cfg.engine_env_vars if secrets.has_secret(secrets.ENGINE_ENV_PREFIX + v)]
    piper = bool(shutil.which("piper"))
    out.append(Check("voice (TTS)", bool(tts) or piper, ", ".join(tts) or ("piper" if piper else "none"),
                     "pip install piper-tts, or channelforge secrets set engine_env:GOOGLE_TTS_API_KEY", required=False))
    try:
        import keyring
        kr = type(keyring.get_keyring()).__name__
        out.append(Check("OS keyring", "fail" not in kr.lower() and "null" not in kr.lower(), kr,
                         "install a keyring backend (Windows Credential Manager / macOS Keychain are built in)"))
    except Exception as e:
        out.append(Check("OS keyring", False, str(e), "pip install keyring"))
    return out


def run_doctor(cfg: AppConfig) -> int:
    import sys
    if hasattr(sys.stdout, "reconfigure"):          # Windows consoles may not be UTF-8
        sys.stdout.reconfigure(errors="replace")
    bad = 0
    for c in checks(cfg):
        mark = "✔" if c.ok else ("✖" if c.required else "•")
        print(f"{mark} {c.name:38s} {c.detail}")
        if not c.ok:
            print(f"    → {c.fix}")
            bad += c.required
    print("\nAll required checks passed." if not bad else f"\n{bad} required check(s) failing.")
    return 1 if bad else 0
