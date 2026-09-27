"""n-gram overlap of our script against the reference transcript(s).

Metric: the share of our script's word n-grams (default n=5, after lowercasing, stripping
accents and punctuation) that also occur in the reference. Contiguous 5-word runs are rare
by chance, so this measures copied phrasing, not shared topic words. Threshold: 10%.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

THRESHOLD = 0.10
_WORD = re.compile(r"[a-z0-9]+")


def tokens(text: str) -> list[str]:
    t = unicodedata.normalize("NFKD", text.lower())
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return _WORD.findall(t)


def ngrams(toks: list[str], n: int) -> list[tuple[str, ...]]:
    return [tuple(toks[i:i + n]) for i in range(len(toks) - n + 1)]


@dataclass
class OverlapReport:
    overlap: float
    shared: int
    total: int
    n: int
    examples: list[str]

    @property
    def passed(self) -> bool:
        return self.overlap <= THRESHOLD

    def summary(self) -> str:
        return (f"{self.overlap:.1%} of our {self.n}-grams appear in the reference "
                f"({self.shared}/{self.total}; limit {THRESHOLD:.0%})")


def overlap(script: str, reference: str, n: int = 5) -> OverlapReport:
    ours = ngrams(tokens(script), n)
    if not ours or not reference.strip():
        return OverlapReport(0.0, 0, len(ours), n, [])
    theirs = set(ngrams(tokens(reference), n))
    hits = [g for g in ours if g in theirs]
    examples = list(dict.fromkeys(" ".join(g) for g in hits))[:8]
    return OverlapReport(len(hits) / len(ours), len(hits), len(ours), n, examples)
