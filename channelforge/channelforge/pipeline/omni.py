"""Channel 1, backend (a): Gemini Omni Flash / Veo clips through OpenMontage's provider tools.

Prompts come from the stickman-video-director skill's Phase B contract. Clip audio is kept to
synchronized SFX; one continuous external voice-over and BGM are laid over the stitched clips
(the skill's own recommendation for maximum audio consistency).
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from . import duration

PROVIDERS = {   # ChannelForge backend → OpenMontage tool (module, class) and nominal clip length
    "omni_flash": ("tools.video.gemini_omni_video", "GeminiOmniVideo", 10),
    "omni_flash_fal": ("tools.video.gemini_omni_fal", "GeminiOmniFalVideo", 10),
    "veo": ("tools.video.veo_video", "VeoVideo", 8),
}
CONFORM_RANGE = (0.85, 1.18)     # retime a clip to its slot only within this speed range
CTA_S = 6.0
X264_PRESET = __import__("os").environ.get("CF_X264_PRESET", "medium")   # tests use ultrafast

# ---------------------------------------------------------------- Phase B checks (deterministic subset)
_TECH_COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\bpantone\b", re.I)
_BEAT = {k: re.compile(p) for k, p in {"[0–3s]": r"\[0\s*[–-]\s*3s\]", "[3–7s]": r"\[3\s*[–-]\s*7s\]",
                                         "[7–10s]": r"\[7\s*[–-]\s*10s\]"}.items()}
STYLE_LOCKS = {
    "1B": ["hollow circular head", "pitch-black"],
    "1A": ["hollow circular head", "pure-white"],
    "2A": ["bright red beanie", "no circuit board textures"],
    "2B": ["bright red beanie", "no photorealistic human skin"],
}


def check_prompts(clips: list[dict], style: str, aspect: str = "16:9", min_count: int = 1) -> list[str]:
    probs = []
    if len(clips) < min_count:
        probs.append(f"{len(clips)} prompts; need at least {min_count} for the narration length")
    for c in clips:
        p, cid = c.get("prompt", ""), c.get("id", "?")
        for label, rx in _BEAT.items():
            if not rx.search(p):
                probs.append(f"{cid}: missing timed beat {label}")
        if _TECH_COLOR.search(p):
            probs.append(f"{cid}: technical colour notation (use ordinary colour names)")
        if aspect not in p:
            probs.append(f"{cid}: does not state the {aspect} ratio")
        low = p.lower()
        if "no speech bubbles" not in low:
            probs.append(f"{cid}: missing 'no speech bubbles' lock")
        if "sound effects only" not in low:
            probs.append(f"{cid}: audio must be 'sound effects only' (VO and BGM are added in post)")
        for lock in STYLE_LOCKS.get(style, []):
            if lock.lower() not in low:
                probs.append(f"{cid}: missing style {style} lock '{lock}'")
    return probs


def planned_clips(film_s: float, nominal: int) -> int:
    return math.ceil(film_s / nominal)


# ---------------------------------------------------------------- OpenMontage tool calls
Tool = Callable[[dict[str, Any]], dict[str, Any]]   # {success, error, data, cost_usd}


def openmontage_tool(openmontage_dir: Path, python: str, env: dict[str, str], backend: str) -> tuple[Tool, Tool]:
    """(generate, estimate) callables running the provider tool inside the engine."""
    module, cls, _ = PROVIDERS[backend]
    code = (f"import json,sys; from {module} import {cls}; t={cls}(); req=json.load(sys.stdin); "
            "op=req.pop('__op'); "
            "r=t.estimate_cost(req) if op=='estimate' else t.execute(req); "
            "print(json.dumps({'success': True, 'cost_usd': r} if op=='estimate' else "
            "{'success': r.success, 'error': r.error, 'data': r.data, 'cost_usd': getattr(r, 'cost_usd', None)}, default=str))")

    def call(op: str, req: dict) -> dict:
        p = subprocess.run([python, "-c", code], cwd=openmontage_dir, input=json.dumps({**req, "__op": op}),
                           capture_output=True, text=True, timeout=1800, env=env)
        last = (p.stdout.strip().splitlines() or [""])[-1]
        return json.loads(last) if last.startswith("{") else {"success": False, "error": p.stderr[-500:]}
    return (lambda req: call("generate", req)), (lambda req: call("estimate", req))


def effective_seconds(secs: float, slot_s: float) -> float:
    """What a clip contributes after conform(): its slot when retimable, else its own length."""
    return slot_s if slot_s and CONFORM_RANGE[0] <= secs / slot_s <= CONFORM_RANGE[1] else secs


def prompt_sha(prompt: str) -> str:
    return hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]


def clip_seconds(p: Path) -> float:
    try:
        return float(duration.probe(p)["format"]["duration"])
    except Exception:
        return 0.0


def reusable(project_dir: Path, k: int, prompt: str) -> float:
    """Seconds of an already generated clip k made from exactly this prompt (0 if none/stale)."""
    path = project_dir / "clips" / f"clip{k:03d}.mp4"
    side = path.with_suffix(".json")
    if not (path.exists() and side.exists()):
        return 0.0
    if json.loads(side.read_text()).get("prompt_sha") != prompt_sha(prompt):
        return 0.0
    return clip_seconds(path)


@dataclass
class CostEstimate:
    per_clip: float
    expected_clips: int      # clips needed to cover the narration
    max_clips: int           # all prompts, spares included
    reusable_clips: int = 0  # already generated from identical prompts (free on resume)

    @property
    def remaining_clips(self) -> int:
        return max(0, self.expected_clips - self.reusable_clips)

    @property
    def expected(self) -> float:
        return round(self.per_clip * self.remaining_clips, 2)

    @property
    def maximum(self) -> float:
        return round(self.per_clip * max(0, self.max_clips - self.reusable_clips), 2)

    def summary(self, backend: str, cap: float, spent: float) -> str:
        reuse = f", {self.reusable_clips} already generated" if self.reusable_clips else ""
        return (f"{backend}: ~${self.per_clip:.2f}/clip × {self.remaining_clips} more clips = ${self.expected:.2f} "
                f"({self.expected_clips} needed{reuse}; up to ${self.maximum:.2f} if all {self.max_clips} prompts are "
                f"used); already spent ${spent:.2f}; cap ${cap:.2f}")


def estimate(clips: list[dict], film_s: float, backend: str, estimate_fn: Tool, aspect: str,
             project_dir: Path | None = None) -> CostEstimate:
    nominal = PROVIDERS[backend][2]
    r = estimate_fn({"prompt": clips[0]["prompt"] if clips else "", "duration": f"{nominal}s" if backend == "veo"
                     else str(nominal), "aspect_ratio": aspect})
    per = float(r.get("cost_usd") or 0.0)
    reuse = 0
    if project_dir is not None:
        for k, c in enumerate(clips):
            if not reusable(project_dir, k, c["prompt"]):
                break
            reuse += 1
    return CostEstimate(per, min(len(clips), planned_clips(film_s, nominal)), len(clips), reuse)


# ---------------------------------------------------------------- generation (resumable)
@dataclass
class ClipRun:
    done: list[dict] = field(default_factory=list)
    spent: float = 0.0
    total_s: float = 0.0     # effective seconds after conform
    stopped: str = ""


def generate(project_dir: Path, clips: list[dict], film_s: float, backend: str, aspect: str, generate_fn: Tool,
             budget_left: Callable[[], float], per_clip: float, on_clip: Callable[[dict, float], None]) -> ClipRun:
    """Generate clips in order until they cover the film. A clip is reused only if it was made from the
    identical prompt (sidecar hash), so a resumed or extended job never pays twice."""
    out_dir = project_dir / "clips"
    out_dir.mkdir(exist_ok=True)
    run = ClipRun()
    nominal = PROVIDERS[backend][2]
    for k, c in enumerate(clips):
        if run.total_s >= film_s:
            break
        path = out_dir / f"clip{k:03d}.mp4"
        slot = float(c.get("slot_s", nominal))
        secs = reusable(project_dir, k, c["prompt"])
        if secs <= 0:
            if budget_left() < per_clip:
                run.stopped = f"budget cap reached before clip {k + 1}"
                break
            req = {"prompt": c["prompt"], "aspect_ratio": aspect, "output_path": str(path),
                   "duration": f"{nominal}s" if backend == "veo" else str(nominal)}
            if backend == "veo":
                req["generate_audio"] = True
            r = generate_fn(req)
            if not r.get("success") or not path.exists():
                raise RuntimeError(f"clip {k + 1} ({c.get('id')}): {r.get('error') or 'no file written'}")
            secs = clip_seconds(path)
            cost = float(r.get("cost_usd") or per_clip)
            path.with_suffix(".json").write_text(json.dumps({"prompt_sha": prompt_sha(c["prompt"]), "cost_usd": cost,
                                                             "seconds": secs, "backend": backend}))
            run.spent += cost
            on_clip(c, cost)
        run.done.append({"id": c.get("id", f"c{k}"), "path": str(path.relative_to(project_dir)),
                         "seconds": round(secs, 3), "slot_s": slot})
        run.total_s += effective_seconds(secs, slot)
    return run


# ---------------------------------------------------------------- assembly
def _has_audio(p: Path) -> bool:
    return any(s.get("codec_type") == "audio" for s in duration.probe(p).get("streams", []))


def conform(src: Path, dst: Path, slot_s: float) -> float:
    """1920x1080 @24 fps, 48 kHz stereo; retimed to its slot when within CONFORM_RANGE."""
    secs = clip_seconds(src)
    speed = secs / slot_s if slot_s else 1.0
    retime = CONFORM_RANGE[0] <= speed <= CONFORM_RANGE[1]
    factor = speed if retime else 1.0
    vf = (f"setpts=PTS/{factor:.5f},scale=1920:1080:force_original_aspect_ratio=decrease,"
          "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(src)]
    if _has_audio(src):
        af = f"atempo={factor:.5f},aresample=48000"
        cmd += ["-filter_complex", f"[0:v]{vf}[v];[0:a]{af}[a]", "-map", "[v]", "-map", "[a]"]
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-filter_complex", f"[0:v]{vf}[v]",
                "-map", "[v]", "-map", "1:a", "-shortest"]
    subprocess.run(cmd + ["-c:v", "libx264", "-preset", X264_PRESET, "-crf", "18", "-c:a", "aac", "-ac", "2", str(dst)],
                   check=True)
    return clip_seconds(dst)


def _esc(t: str) -> str:
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def assemble(project_dir: Path, run_clips: list[dict], narration_wav: Path, film_s: float, cta_title: str,
             cta_line: str, bgm: Path | None, out: Path) -> Path:
    work = project_dir / "renders" / "conform"
    work.mkdir(parents=True, exist_ok=True)
    parts = []
    for k, c in enumerate(run_clips):
        dst = work / f"c{k:03d}.mp4"
        conform(project_dir / c["path"], dst, c["slot_s"])
        parts.append(dst)
    listing = work / "concat.txt"
    listing.write_text("".join(f"file '{p.name}'\n" for p in parts))
    stitched = work / "stitched.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy",
                    str(stitched)], cwd=work, check=True)
    have = clip_seconds(stitched)
    if have + 0.25 < film_s:
        raise RuntimeError(f"stitched clips cover {have:.1f} s but the narration needs {film_s:.1f} s")
    t0 = film_s - CTA_S
    font = "fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:" if \
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf").exists() else "font='DejaVu Sans':"
    cta = (f"drawbox=x=0:y=ih*0.62:w=iw:h=ih*0.26:color=black@0.72:t=fill:enable='gte(t,{t0:.2f})',"
           f"drawtext={font}text='{_esc(cta_title)}':fontsize=96:fontcolor=white:x=(w-text_w)/2:y=h*0.66:"
           f"enable='gte(t,{t0:.2f})',"
           f"drawtext={font}text='{_esc(cta_line)}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=h*0.78:"
           f"enable='gte(t,{t0 + 0.4:.2f})'")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(stitched), "-i", str(narration_wav)]
    mix = f"[0:a]volume=0.30[sfx];[1:a]apad[vo]"
    inputs = "[vo][sfx]"
    n = 2
    if bgm:
        cmd += ["-stream_loop", "-1", "-i", str(bgm)]
        mix += f";[2:a]volume=0.12,afade=t=out:st={max(0, film_s - 2):.2f}:d=2[bgm]"
        inputs += "[bgm]"
        n = 3
    cmd += ["-filter_complex", f"[0:v]{cta}[v];{mix};{inputs}amix=inputs={n}:duration=first:normalize=0[a]",
            "-map", "[v]", "-map", "[a]", "-t", f"{film_s:.3f}", "-c:v", "libx264", "-preset", X264_PRESET,
            "-crf", "18", "-c:a", "aac", "-b:a", "192k", str(out)]
    subprocess.run(cmd, check=True)
    return out
