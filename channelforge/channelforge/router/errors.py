"""Classify gateway / agent failures into fallback triggers."""

from __future__ import annotations

import re
from enum import Enum


class Failure(str, Enum):
    RATE_LIMIT = "rate_limit"        # HTTP 429
    OVERLOADED = "overloaded"        # HTTP 529
    USAGE_LIMIT = "usage_limit"      # subscription session / usage-limit messages
    QUOTA = "quota"                  # credits / quota exhausted
    TIMEOUT = "timeout"
    UNAVAILABLE = "unavailable"      # connection refused, 502/503/504 — gateway down
    FATAL = "fatal"                  # anything else: bad request, auth, bug


FALLBACK_TRIGGERS = frozenset({Failure.RATE_LIMIT, Failure.OVERLOADED, Failure.USAGE_LIMIT,
                               Failure.QUOTA, Failure.TIMEOUT, Failure.UNAVAILABLE})

_USAGE_RE = re.compile(
    r"usage limit|session limit|limit reached|hour limit|weekly limit|out of extra usage|"
    r"reached your .*limit|rate.?limit", re.I)
_QUOTA_RE = re.compile(
    r"quota|insufficient[_ ](credits|funds|balance)|credit balance is too low|"
    r"billing|payment required|exceeded your current", re.I)
_OVERLOAD_RE = re.compile(r"overloaded", re.I)


def classify(status: int | None, message: str = "") -> Failure:
    msg = message or ""
    if status == 429:
        return Failure.USAGE_LIMIT if _USAGE_RE.search(msg) and "rate" not in msg.lower() else Failure.RATE_LIMIT
    if status == 529 or _OVERLOAD_RE.search(msg):
        return Failure.OVERLOADED
    if status == 402 or _QUOTA_RE.search(msg):
        return Failure.QUOTA
    if _USAGE_RE.search(msg):
        return Failure.USAGE_LIMIT
    if status in (408, 504):
        return Failure.TIMEOUT
    if status in (502, 503):
        return Failure.UNAVAILABLE
    return Failure.FATAL


class LLMError(RuntimeError):
    def __init__(self, failure: Failure, message: str, status: int | None = None):
        super().__init__(message)
        self.failure = failure
        self.status = status


class AllTargetsFailed(RuntimeError):
    def __init__(self, attempts: list[tuple[str, Failure, str]]):
        self.attempts = attempts
        detail = "; ".join(f"{t}: {f.value} ({m[:120]})" for t, f, m in attempts)
        super().__init__(f"all routing targets failed — {detail}")
