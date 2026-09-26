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
    UNAVAILABLE = "unavailable"      # 502/503 — OmniRoute is up but the route cannot serve
    GATEWAY_DOWN = "gateway_down"    # OmniRoute itself unreachable (connection refused/reset)
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
# Claude Code reports a dead gateway as "API Error: Connection refused … (ECONNREFUSED)" and its
# api_retry events carry no HTTP status (error "unknown") — verified with claude 2.1.x.
_CONN_RE = re.compile(r"ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENOTFOUND|connection refused|"
                      r"connection reset|socket hang up|fetch failed", re.I)


def classify(status: int | None, message: str = "") -> Failure:
    msg = message or ""
    if status is None and _CONN_RE.search(msg):
        return Failure.GATEWAY_DOWN
    if status == 429:
        return Failure.USAGE_LIMIT if _USAGE_RE.search(msg) and "rate" not in msg.lower() else Failure.RATE_LIMIT
    if status == 529 or _OVERLOAD_RE.search(msg):
        return Failure.OVERLOADED
    # A 502/503 from OmniRoute means "this route cannot serve right now" whatever the body says
    # (its ALL_TARGETS_SKIPPED body mentions quota-exhausted targets, for instance).
    if status in (502, 503):
        return Failure.UNAVAILABLE
    if status == 402 or _QUOTA_RE.search(msg):
        return Failure.QUOTA
    if _USAGE_RE.search(msg):
        return Failure.USAGE_LIMIT
    if status in (408, 504):
        return Failure.TIMEOUT
    return Failure.FATAL


class LLMError(RuntimeError):
    def __init__(self, failure: Failure, message: str, status: int | None = None):
        super().__init__(message)
        self.failure = failure
        self.status = status


class GatewayDown(LLMError):
    """OmniRoute itself is unreachable (and could not be restarted)."""

    def __init__(self, message: str):
        super().__init__(Failure.GATEWAY_DOWN, message)


class AllTargetsFailed(RuntimeError):
    def __init__(self, attempts: list[tuple[str, Failure, str]]):
        self.attempts = attempts
        detail = "; ".join(f"{t}: {f.value} ({m[:120]})" for t, f, m in attempts)
        super().__init__(f"all routing targets failed — {detail}")
