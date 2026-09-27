"""Channel 2 research rules: last 7 days only, primary sources first.

The agent writes artifacts/research.json:
  {"window": {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"},
   "stories": [{"id": "st1", "headline": "...", "why_it_matters": "...",
                "sources": [{"url": "https://...", "publisher": "...", "published_at": "YYYY-MM-DD",
                             "type": "lab_blog|company_blog|arxiv|government|regulator|official|news|other"}],
                "no_primary_reason": "only when no primary source exists"}]}
"""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, ValidationError

PRIMARY = {"lab_blog", "company_blog", "arxiv", "government", "regulator", "official"}
WINDOW_DAYS = 7
_ARXIV = re.compile(r"arxiv\.org/(?:abs|pdf|html)/(\d{2})(\d{2})\.\d{4,5}", re.I)


class NewsSource(BaseModel):
    url: str
    publisher: str = ""
    published_at: str
    type: str = "other"


class Story(BaseModel):
    id: str
    headline: str
    why_it_matters: str = ""
    sources: list[NewsSource] = Field(default_factory=list)
    no_primary_reason: str | None = None


class Research(BaseModel):
    stories: list[Story]


def _parse_day(s: str) -> date | None:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def check_research(path: Path, today: date, min_stories: int = 3) -> list[dict[str, Any]]:
    if not path.exists():
        return [{"story": None, "problem": "artifacts/research.json is missing"}]
    try:
        r = Research.model_validate_json(path.read_text(encoding="utf-8"))
    except ValidationError as e:
        return [{"story": None, "problem": f"research.json invalid: {e.errors()[:3]}"}]
    earliest = today - timedelta(days=WINDOW_DAYS)
    probs: list[dict[str, Any]] = []
    if len(r.stories) < min_stories:
        probs.append({"story": None, "problem": f"only {len(r.stories)} stories; need at least {min_stories}"})
    for st in r.stories:
        if not st.sources:
            probs.append({"story": st.id, "problem": "no sources"})
            continue
        for src in st.sources:
            d = _parse_day(src.published_at)
            if d is None:
                probs.append({"story": st.id, "problem": f"unparseable published_at {src.published_at!r} ({src.url})"})
            elif not (earliest <= d <= today):
                probs.append({"story": st.id, "problem": f"{src.url} published {d}, outside {earliest}..{today}"})
            m = _ARXIV.search(src.url)                       # arXiv ids encode YYMM of submission
            if m:
                yymm = date(2000 + int(m.group(1)), int(m.group(2)), 1)
                if yymm < date(earliest.year, earliest.month, 1):
                    probs.append({"story": st.id, "problem": f"{src.url} is an arXiv id from {yymm:%Y-%m}; too old"})
        types = [s.type for s in st.sources]
        if not PRIMARY & set(types) and not st.no_primary_reason:
            probs.append({"story": st.id, "problem": "no primary source (lab/company blog, arXiv, government or "
                          "regulator); add one or give no_primary_reason"})
        elif types and types[0] not in PRIMARY and PRIMARY & set(types):
            probs.append({"story": st.id, "problem": "list the primary source first"})
    return probs
