"""Hard duration gate for the long video: ffprobe says 480–600 s, and no silence padding."""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

LONG_MIN_S, LONG_MAX_S, TARGET_S = 480.0, 600.0, 540.0
WPM = 150


def probe(path: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "format=duration:stream=codec_type,width,height", "-of", "json", str(path)],
                         capture_output=True, text=True, timeout=120, check=True).stdout
    return json.loads(out)


def trailing_silence_s(path: Path, noise_db: int = -45, min_s: float = 1.0) -> float:
    """Seconds of silence at the very end (ffmpeg silencedetect)."""
    dur = float(probe(path)["format"]["duration"])
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
                          f"silencedetect=noise={noise_db}dB:d={min_s}", "-f", "null", "-"],
                         capture_output=True, text=True, timeout=600).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    if not starts:
        return 0.0
    # ffmpeg 6.x closes a silence that runs to EOF with a silence_end at the end of the file;
    # older builds leave the last silence_start unmatched. Both mean trailing silence.
    if len(ends) < len(starts) or ends[-1] >= dur - 0.25:
        return dur - starts[-1]
    return 0.0


@dataclass
class DurationCheck:
    duration_s: float
    width: int | None
    height: int | None
    trailing_silence_s: float

    @property
    def in_range(self) -> bool:
        return LONG_MIN_S <= self.duration_s <= LONG_MAX_S

    @property
    def padded(self) -> bool:
        return self.trailing_silence_s > 3.0

    @property
    def passed(self) -> bool:
        return self.in_range and not self.padded and (self.width, self.height) == (1920, 1080)

    def replan_note(self, script_words: int | None) -> str:
        parts = [f"ffprobe measured the final render at {self.duration_s:.1f} s; it must be "
                 f"{LONG_MIN_S:.0f}–{LONG_MAX_S:.0f} s (target {TARGET_S:.0f} s) at 1920x1080."]
        if not self.in_range:
            if script_words:
                want = round(script_words * TARGET_S / max(self.duration_s, 1))
                parts.append(f"The narration has ~{script_words} words; revise it to ~{want} words "
                             f"(~{WPM} wpm) by adding or cutting substantive, sourced content.")
            parts.append("Re-plan the scenes to match the new narration and re-render.")
        if self.padded:
            parts.append(f"The last {self.trailing_silence_s:.1f} s are silent: do not pad with silence.")
        if (self.width, self.height) != (1920, 1080):
            parts.append(f"Resolution is {self.width}x{self.height}; render 1920x1080.")
        return " ".join(parts)


def check(path: Path) -> DurationCheck:
    info = probe(path)
    video = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    return DurationCheck(float(info["format"]["duration"]), video.get("width"), video.get("height"),
                         trailing_silence_s(path))
