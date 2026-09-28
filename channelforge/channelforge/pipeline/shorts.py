"""Five vertical shorts re-edited from the long video.

- Segments: the strongest 30–60 s passages, chosen by a model from the word-timed transcript and
  snapped to sentence boundaries (never overlapping).
- Hook: a short, punchy line burned in over the first ~2.5 s, on top of a segment that opens on a
  complete sentence.
- Reframing (never a centre crop): "track" pans a 9:16 window along the most active/detailed area
  (frame differencing + edge energy, smoothed); "stack" shows the whole 16:9 frame over a blurred
  fill, for charts and maps whose edges carry information.
- Captions: word-level karaoke captions (ASS, current word highlighted), burned in above the
  platforms' bottom UI zone.
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import numpy as np

from . import duration

N_SHORTS, MIN_S, MAX_S = 5, 30.0, 60.0
W, H = 1080, 1920
HOOK_S = 2.5
BRIDGE_S = 0.6     # caption pauses shorter than this don't blank the screen

Word = dict   # {"start": float, "end": float, "word": str}


# ---------------------------------------------------------------- transcript
def transcribe_words(media: Path, language: str | None = None, model_size: str = "small") -> list[Word]:
    from faster_whisper import WhisperModel
    model = WhisperModel(model_size, device="auto", compute_type="int8")
    segments, _ = model.transcribe(str(media), language=language, word_timestamps=True, vad_filter=True)
    return [{"start": w.start, "end": w.end, "word": w.word.strip()} for s in segments for w in (s.words or [])]


def sentences(words: list[Word], gap: float = 0.8) -> list[dict]:
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        if re.search(r"[.!?…]$", w["word"]) or nxt is None or nxt["start"] - w["end"] > gap:
            out.append({"start": cur[0]["start"], "end": cur[-1]["end"], "text": " ".join(x["word"] for x in cur)})
            cur = []
    return out


# ---------------------------------------------------------------- segment choice
SEG_SYSTEM = """You cut vertical shorts from a long video. From the numbered sentences (with times), choose
the {n} strongest self-contained passages for TikTok / YouTube Shorts / Instagram Reels: each must open on a
sentence that works as a hook without context, deliver one complete idea, and last {lo:.0f}–{hi:.0f} seconds.
No overlaps. For each, write a hook line of at most 8 words in {lang} for the first 2 seconds (punchy, accurate,
no clickbait claims beyond what the passage says). Reply with JSON only:
{{"segments": [{{"first": <sentence number>, "last": <sentence number>, "hook": "...", "why": "..."}}]}}"""


def snap(sents: list[dict], first: int, last: int) -> tuple[int, int] | None:
    """Grow/shrink [first, last] on sentence boundaries until it lasts MIN_S..MAX_S."""
    first, last = max(0, first), min(len(sents) - 1, last)
    if first > last:
        return None
    dur = lambda a, b: sents[b]["end"] - sents[a]["start"]  # noqa: E731
    while dur(first, last) < MIN_S and last + 1 < len(sents) and dur(first, last + 1) <= MAX_S:
        last += 1
    while dur(first, last) > MAX_S and last > first:
        last -= 1
    return (first, last) if MIN_S <= dur(first, last) <= MAX_S else None


def fallback_segments(sents: list[dict], n: int) -> list[tuple[int, int]]:
    """Evenly spaced passages when the model's answer is unusable."""
    picks, i = [], 0
    step = max(1, len(sents) // n)
    while len(picks) < n and i < len(sents):
        s = snap(sents, i, i)
        if s and all(s[0] > b or s[1] < a for a, b in picks):
            picks.append(s)
            i = max(i + step, s[1] + 1)
        else:
            i += 1
    return picks


def pick_segments(sents: list[dict], chooser: Callable[[str, str], str], language: str, n: int = N_SHORTS) -> list[dict]:
    listing = "\n".join(f"{k}. [{s['start']:.1f}-{s['end']:.1f}s] {s['text']}" for k, s in enumerate(sents))
    chosen: list[dict] = []
    try:
        raw = chooser(SEG_SYSTEM.format(n=n, lo=MIN_S, hi=MAX_S, lang=language), listing)
        data = json.loads(re.search(r"\{.*\}", raw, re.S).group(0))
        for seg in data.get("segments", []):
            s = snap(sents, int(seg["first"]), int(seg["last"]))
            if s and all(s[0] > c["last"] or s[1] < c["first"] for c in chosen):
                chosen.append({"first": s[0], "last": s[1], "hook": str(seg.get("hook", ""))[:80], "why": seg.get("why", "")})
    except Exception:
        chosen = []
    for a, b in fallback_segments(sents, n):
        if len(chosen) >= n:
            break
        if all(a > c["last"] or b < c["first"] for c in chosen):
            chosen.append({"first": a, "last": b, "hook": " ".join(sents[a]["text"].split()[:8]), "why": "fallback"})
    chosen.sort(key=lambda c: c["first"])
    for c in chosen:
        c["start"], c["end"] = sents[c["first"]]["start"], sents[c["last"]]["end"]
    if len(chosen) < n:
        raise ValueError(f"only {len(chosen)} passages of {MIN_S:.0f}-{MAX_S:.0f} s found; need {n}")
    return chosen[:n]


# ---------------------------------------------------------------- reframing
def activity_path(video: Path, start: float, end: float, step: float = 1.0) -> list[tuple[float, float]]:
    """(t, x_center in 0..1) keyframes following motion + detail, smoothed."""
    sw, sh = 192, 108
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(video),
                          "-vf", f"fps={1 / step},scale={sw}:{sh},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, sh, sw).astype(np.float32)
    if len(frames) == 0:
        return [(0.0, 0.5)]
    xs = np.arange(sw)
    centers = []
    for k, f in enumerate(frames):
        edges = np.abs(np.diff(f, axis=1, prepend=f[:, :1])) + np.abs(np.diff(f, axis=0, prepend=f[:1]))
        motion = np.abs(f - frames[k - 1]) if k else np.zeros_like(f)
        energy = (edges + 2 * motion).sum(axis=0)
        centers.append(float((energy * xs).sum() / energy.sum()) / sw if energy.sum() > 0 else 0.5)
    c = np.array(centers)
    if len(c) >= 5:                                      # smooth: no jitter, slow deliberate pans
        c = np.convolve(np.pad(c, 2, mode="edge"), np.ones(5) / 5, mode="valid")
    return [(k * step, float(v)) for k, v in enumerate(c)]


def crop_x_expr(path: list[tuple[float, float]], src_w: int, crop_w: int) -> str:
    """Piecewise-linear ffmpeg expression for the crop window's left edge."""
    xs = [min(max(cx * src_w - crop_w / 2, 0), src_w - crop_w) for _, cx in path]
    if len(path) == 1:
        return f"{xs[0]:.1f}"
    expr = f"{xs[-1]:.1f}"
    for k in range(len(path) - 2, -1, -1):
        t0, t1 = path[k][0], path[k + 1][0]
        seg = f"{xs[k]:.1f}+({xs[k + 1]:.1f}-{xs[k]:.1f})*(t-{t0:.2f})/{t1 - t0:.2f}"
        expr = f"if(lt(t,{t1:.2f}),{seg},{expr})"
    return expr


# ---------------------------------------------------------------- captions
def _ass_time(t: float) -> str:
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def _ass_escape(s: str) -> str:
    return s.replace("\\", "").replace("{", "(").replace("}", ")")


def ass_captions(words: list[Word], offset: float, hook: str, path: Path, per_line: int = 4) -> Path:
    """Word-level captions (current word highlighted) + the hook title for the first HOOK_S seconds."""
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,74,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,6,2,2,60,60,520,1
Style: Hook,DejaVu Sans,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,3,18,0,8,70,70,240,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    if hook:
        lines.append(f"Dialogue: 1,{_ass_time(0)},{_ass_time(HOOK_S)},Hook,,0,0,0,,{_ass_escape(hook)}")
    for i in range(0, len(words), per_line):
        chunk = words[i:i + per_line]
        nxt = words[i + per_line] if i + per_line < len(words) else None
        for j, w in enumerate(chunk):
            end = chunk[j + 1]["start"] if j + 1 < len(chunk) else w["end"]
            if j + 1 == len(chunk) and nxt and nxt["start"] - w["end"] < BRIDGE_S:
                end = nxt["start"]              # hold the line through short pauses: no flicker between chunks
            text = " ".join((r"{\c&H00D7FF&}" + _ass_escape(x["word"]) + r"{\c&HFFFFFF&}") if k == j
                            else _ass_escape(x["word"]) for k, x in enumerate(chunk))
            lines.append(f"Dialogue: 0,{_ass_time(w['start'] - offset)},{_ass_time(end - offset)},Cap,,0,0,0,,{text}")
    path.write_text(head + "\n".join(lines) + "\n", encoding="utf-8")
    return path


# ---------------------------------------------------------------- render
@dataclass
class Short:
    index: int
    start: float
    end: float
    hook: str
    layout: str
    path: Path
    duration_s: float = 0.0


def render_short(long_mp4: Path, seg: dict, words: list[Word], out: Path, layout: str, x264_preset: str = "medium") -> Short:
    start, end = seg["start"], seg["end"]
    seg_words = [w for w in words if w["start"] >= start - 0.05 and w["end"] <= end + 0.05]
    ass = ass_captions(seg_words, start, seg.get("hook", ""), out.with_suffix(".ass"))
    info = duration.probe(long_mp4)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    sw, sh = int(v["width"]), int(v["height"])
    if layout == "track":
        cw = int(round(sh * 9 / 16)) // 2 * 2
        x = crop_x_expr(activity_path(long_mp4, start, end), sw, cw)
        vf = f"crop={cw}:{sh}:'{x}':0,scale={W}:{H},setsar=1"
    else:   # stack: full frame over a blurred fill
        vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=28,"
              f"eq=brightness=-0.12[bg];[b]scale={W}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2-120,setsar=1")
    sub = str(ass).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
    dur = end - start
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-i", str(long_mp4), "-t", f"{dur:.3f}",
                    "-filter_complex", f"[0:v]{vf},subtitles='{sub}'[v];"
                                       f"[0:a]afade=t=in:d=0.15,afade=t=out:st={max(0, dur - 0.4):.2f}:d=0.4[a]",
                    "-map", "[v]", "-map", "[a]", "-r", "30", "-c:v", "libx264", "-preset", x264_preset, "-crf", "20",
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)], check=True)
    return Short(seg.get("index", 0), start, end, seg.get("hook", ""), layout, out, float(duration.probe(out)["format"]["duration"]))


def check_short(path: Path) -> list[str]:
    info = duration.probe(path)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), {})
    d = float(info["format"]["duration"])
    probs = []
    if (v.get("width"), v.get("height")) != (W, H):
        probs.append(f"{path.name}: {v.get('width')}x{v.get('height')}, expected {W}x{H}")
    if not (MIN_S - 0.05 <= d <= MAX_S + 0.05):
        probs.append(f"{path.name}: {d:.1f} s, expected {MIN_S:.0f}-{MAX_S:.0f} s")
    return probs
