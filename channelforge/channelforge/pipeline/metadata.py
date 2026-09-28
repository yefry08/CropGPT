"""YouTube + per-short platform metadata, and the 1280x720 thumbnail.

The model (router kind="metadata") writes the wording: title, summary, chapter names, tags, the
thumbnail's 2–5 words and each short's captions. Everything factual is assembled here from the
job's own data: chapter timestamps (narration/script timing), the sources list (sources.json),
the CTA link and the AI-disclosure line. Platform limits are enforced in code.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any, Callable

from . import duration

LIMITS = {"yt_title": 100, "yt_description": 5000, "yt_tags_total": 500, "tiktok": 2200, "ig": 2200,
          "ig_hashtags": 30, "shorts_title": 100}
LABELS = {
    "es": {"chapters": "Capítulos", "sources": "Fuentes", "ai": "Este video se produjo con herramientas de IA; "
           "los datos están verificados con las fuentes indicadas.", "more": "Más información"},
    "en": {"chapters": "Chapters", "sources": "Sources", "ai": "This video was produced with AI tools; the facts "
           "are checked against the sources listed.", "more": "Learn more"},
    "pt": {"chapters": "Capítulos", "sources": "Fontes", "ai": "Este vídeo foi produzido com ferramentas de IA; "
           "os dados foram verificados com as fontes indicadas.", "more": "Saiba mais"},
}

META_SYSTEM = """You write publishing metadata for a {lang} YouTube channel ({channel}). Accurate, specific,
no clickbait beyond what the video says, no claims absent from the script. Reply with JSON only:
{{"title": "<= 90 chars", "summary": "2-3 sentence description opening",
  "chapter_titles": ["<one short title per chapter, in order>"],
  "tags": ["8-15 search tags"],
  "thumbnail_text": "2-5 bold words", "thumbnail_chapter": <chapter index for the thumbnail frame>,
  "shorts": [{{"tiktok": "caption + 3-5 hashtags", "yt_shorts_title": "<= 90 chars", "ig": "caption + 5-10 hashtags"}}]}}
One "shorts" entry per short, in order. Language: {lang}."""


def ts(sec: float) -> str:
    sec = int(round(sec))
    return f"{sec // 3600}:{sec % 3600 // 60:02d}:{sec % 60:02d}" if sec >= 3600 else f"{sec // 60}:{sec % 60:02d}"


def chapter_starts(sections: list[dict], video_s: float, min_gap: float = 10.0) -> list[float]:
    """YouTube chapters: first at 0:00, at least 3, each >= 10 s long."""
    starts = [0.0]
    for s in sections[1:]:
        t = float(s.get("start", s.get("start_seconds", 0)))
        if t - starts[-1] >= min_gap and video_s - t >= min_gap:
            starts.append(t)
    return starts


def sources_list(sources_path: Path) -> list[str]:
    if not sources_path.exists():
        return []
    seen, out = set(), []
    for c in json.loads(sources_path.read_text(encoding="utf-8")).get("claims", []):
        for s in c.get("sources", []):
            if s["url"] not in seen:
                seen.add(s["url"])
                label = " — ".join(x for x in (s.get("publisher"), s.get("title")) if x)
                out.append(f"{label}: {s['url']}" if label else s["url"])
    return out


def _hashtags(text: str) -> list[str]:
    return re.findall(r"#\w+", text)


def _cap(text: str, n: int) -> str:
    return text if len(text) <= n else text[:n - 1].rstrip() + "…"


def build(ask: Callable[[str, str], str], *, language: str, channel: str, script_text: str, sections: list[dict],
          video_s: float, sources_path: Path, n_shorts: int, short_texts: list[str], cta_url: str = "",
          cta_title: str = "") -> dict[str, Any]:
    L = LABELS.get(language, LABELS["en"])
    starts = chapter_starts(sections, video_s)
    brief = (f"SCRIPT:\n{script_text[:12000]}\n\nCHAPTERS ({len(starts)}): "
             + " | ".join(f"{k}: starts {ts(t)}" for k, t in enumerate(starts))
             + "\n\nSHORTS:\n" + "\n".join(f"{k + 1}. {t[:600]}" for k, t in enumerate(short_texts)))
    data = json.loads(re.search(r"\{.*\}", ask(META_SYSTEM.format(lang=language, channel=channel), brief), re.S).group(0))

    names = list(data.get("chapter_titles", []))
    names += [f"{L['chapters']} {k + 1}" for k in range(len(names), len(starts))]
    chapters = [f"{ts(t)} {_cap(names[k], 60)}" for k, t in enumerate(starts)]
    srcs = sources_list(sources_path)
    parts = [data.get("summary", "").strip()]
    if cta_url:
        parts.append(f"{L['more']} ({cta_title or 'link'}): {cta_url}")
    if len(chapters) >= 3:
        parts.append(f"{L['chapters']}:\n" + "\n".join(chapters))
    if srcs:
        parts.append(f"{L['sources']}:\n" + "\n".join(f"• {s}" for s in srcs))
    parts.append(L["ai"])
    description = "\n\n".join(p for p in parts if p)
    if len(description) > LIMITS["yt_description"]:           # trim the sources list, never the chapters/CTA
        keep = srcs[:]
        while keep and len(description) > LIMITS["yt_description"]:
            keep.pop()
            parts[-2] = f"{L['sources']}:\n" + "\n".join(f"• {s}" for s in keep) + "\n• …"
            description = "\n\n".join(p for p in parts if p)

    tags, total = [], 0
    for t in data.get("tags", []):
        t = t.strip().lstrip("#")
        if t and total + len(t) + 1 <= LIMITS["yt_tags_total"]:
            tags.append(t)
            total += len(t) + 1

    shorts = []
    for k in range(n_shorts):
        d = (data.get("shorts") or [{}] * n_shorts)[k] if k < len(data.get("shorts") or []) else {}
        title = _cap(d.get("yt_shorts_title") or data.get("title", ""), LIMITS["shorts_title"] - 8)
        ig = d.get("ig", "")
        tags_ig = _hashtags(ig)
        if len(tags_ig) > LIMITS["ig_hashtags"]:
            for extra in tags_ig[LIMITS["ig_hashtags"]:]:
                ig = ig.replace(extra, "", 1)
        shorts.append({"tiktok": {"caption": _cap(d.get("tiktok", ""), LIMITS["tiktok"])},
                       "yt_shorts": {"title": f"{title} #Shorts",
                                     "description": _cap(f"{d.get('tiktok', '')}\n\n{L['ai']}", 5000)},
                       "ig_reels": {"caption": _cap(" ".join(ig.split()) + f"\n\n{L['ai']}", LIMITS["ig"])}})
    return {"youtube": {"title": _cap(data.get("title", ""), LIMITS["yt_title"]), "description": description,
                        "tags": tags, "chapters": chapters, "language": language,
                        "contains_synthetic_media": True},
            "thumbnail": {"text": " ".join(str(data.get("thumbnail_text", "")).split()[:5]),
                          "at_s": starts[min(max(int(data.get("thumbnail_chapter", 0) or 0), 0), len(starts) - 1)] + 3},
            "shorts": shorts}


def _esc(t: str) -> str:
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%")


def thumbnail(video: Path, at_s: float, text: str, out: Path) -> Path:
    """1280x720 JPEG under YouTube's 2 MB limit: a frame from our own video + bold words."""
    font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    f = f"fontfile={font}:" if Path(font).exists() else "font='DejaVu Sans':"
    vf = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720"
    if text:
        # DejaVu Sans Bold capitals average ~0.72 em: fit the line inside 1180 of the 1280 px
        size = int(min(118, 1180 / (0.72 * max(1, len(text)))))
        vf += (f",drawbox=x=0:y=ih*0.60:w=iw:h=ih*0.34:color=black@0.62:t=fill,"
               f"drawtext={f}text='{_esc(text.upper())}':fontsize={size}:fontcolor=white:borderw=4:bordercolor=black:"
               f"x=(w-text_w)/2:y=h*0.77-text_h/2")
    for q in (2, 5, 9, 14):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0.0, at_s):.2f}", "-i", str(video), "-frames:v", "1",
                        "-vf", vf, "-q:v", str(q), str(out)], check=True)
        if out.stat().st_size < 2_000_000:
            break
    return out


def check_thumbnail(path: Path) -> list[str]:
    info = duration.probe(path)
    v = info["streams"][0]
    probs = []
    if (v.get("width"), v.get("height")) != (1280, 720):
        probs.append(f"thumbnail is {v.get('width')}x{v.get('height')}, expected 1280x720")
    if path.stat().st_size >= 2_000_000:
        probs.append("thumbnail is 2 MB or larger (YouTube limit)")
    return probs
