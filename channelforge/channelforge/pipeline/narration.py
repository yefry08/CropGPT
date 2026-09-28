"""Narration stage (ChannelForge-owned): TTS per script section, timings, pre-render length check.

TTS goes through OpenMontage's tts_selector (whatever provider you configured: Piper locally, or
Google/OpenAI/ElevenLabs/… keys from the keyring). Measuring the voice-over BEFORE the film is
drawn and rendered lets a too-short/too-long script go back for rewriting cheaply.
"""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from . import duration

GAP_S = 0.4          # breath between sections
END_CARD_S = 3.0     # the film's closing card after the last line (score keeps playing)

Synth = Callable[[str, Path], None]


def audio_seconds(path: Path) -> float:
    return float(duration.probe(path)["format"]["duration"])


def openmontage_synth(openmontage_dir: Path, python: str, env: dict[str, str], voice: str = "",
                      provider: str = "auto") -> Synth:
    code = ("import json,sys; from tools.audio.tts_selector import TTSSelector; "
            "r=TTSSelector().execute(json.load(sys.stdin)); "
            "print(json.dumps({'success': r.success, 'error': r.error, 'data': r.data}, default=str))")

    def synth(text: str, out: Path) -> None:
        req = {"text": text, "output_path": str(out), "preferred_provider": provider}
        if voice:
            req["voice"] = voice
        p = subprocess.run([python, "-c", code], cwd=openmontage_dir, input=json.dumps(req), capture_output=True,
                           text=True, timeout=900, env=env)
        last = (p.stdout.strip().splitlines() or ["{}"])[-1]
        res = json.loads(last) if last.startswith("{") else {"success": False, "error": p.stderr[-400:]}
        if not res.get("success") or not out.exists():
            raise RuntimeError(f"TTS failed: {res.get('error') or p.stderr[-400:]}")
    return synth


@dataclass
class NarrationResult:
    total_s: float
    film_s: float
    path: Path
    sections: list[dict]

    @property
    def in_range(self) -> bool:
        return duration.LONG_MIN_S <= self.film_s <= duration.LONG_MAX_S


def build(project_dir: Path, script: dict, synth: Synth, end_card_s: float = END_CARD_S) -> NarrationResult:
    audio_dir = project_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    sections, parts, t = [], [], 0.0
    for k, sec in enumerate(script.get("sections", [])):
        text = (sec.get("text") or "").strip()
        if not text:
            continue
        raw = audio_dir / f"s{k:02d}_{sec.get('id', k)}.src"
        synth(text, raw)
        wav = audio_dir / f"s{k:02d}.wav"          # normalise every provider's output to one format
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-ar", "48000", "-ac", "2", str(wav)], check=True)
        d = audio_seconds(wav)
        sections.append({"id": sec.get("id", str(k)), "start": round(t, 3), "end": round(t + d, 3),
                         "text": text, "audio": str(wav.relative_to(project_dir))})
        parts.append(wav)
        t += d + GAP_S
    if not parts:
        raise ValueError("script has no narration text")
    gap = audio_dir / "gap.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo",
                    "-t", str(GAP_S), str(gap)], check=True)
    listing = audio_dir / "concat.txt"
    listing.write_text("".join(f"file '{p.name}'\nfile 'gap.wav'\n" for p in parts[:-1]) + f"file '{parts[-1].name}'\n")
    out = audio_dir / "narration.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy",
                    str(out)], cwd=audio_dir, check=True)
    total = audio_seconds(out)
    res = NarrationResult(total, total + end_card_s, out, sections)
    (project_dir / "artifacts").mkdir(exist_ok=True)
    (project_dir / "artifacts" / "narration.json").write_text(json.dumps({
        "total_s": round(total, 3), "film_s": round(res.film_s, 3), "end_card_s": end_card_s,
        "audio": str(out.relative_to(project_dir)), "sections": sections}, indent=1, ensure_ascii=False))
    return res
