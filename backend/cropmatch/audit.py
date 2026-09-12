"""Audit trail: every external read is logged with source, product ID, acquisition date and processing level.

Entries go to data/cache/audit.jsonl and, while a query is running, into that query's provenance list so the
result can be traced back to raw scenes.
"""

from __future__ import annotations

import contextvars
import json
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from . import config

_lock = threading.Lock()
_current: contextvars.ContextVar[list[dict] | None] = contextvars.ContextVar("cropmatch_provenance", default=None)


def log(
    *,
    source: str,
    product_id: str,
    acquisition_date: str | None,
    processing_level: str,
    url: str | None = None,
    mode: str = "live",
    **extra: Any,
) -> dict:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": source,
        "product_id": product_id,
        "acquisition_date": acquisition_date or "not available",
        "processing_level": processing_level,
        "url": url,
        "mode": mode,
        **extra,
    }
    sink = _current.get()
    if sink is not None:
        sink.append(entry)
    with _lock, open(config.AUDIT_LOG, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


@contextmanager
def collect():
    """Collect every audit entry logged inside the block (including from worker threads started with pmap)."""
    sink: list[dict] = []
    token = _current.set(sink)
    try:
        yield sink
    finally:
        _current.reset(token)
