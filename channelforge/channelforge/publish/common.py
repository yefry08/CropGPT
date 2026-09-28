from __future__ import annotations

from dataclasses import dataclass, field


class PublishError(RuntimeError):
    """A failure the scheduler should retry with backoff."""


class QuotaExceeded(PublishError):
    """Daily quota spent: requeue for after the next reset instead of burning retries."""

    def __init__(self, message: str, retry_at: float):
        super().__init__(message)
        self.retry_at = retry_at


class NotConnected(RuntimeError):
    """Missing OAuth connection or token: needs the human, not a retry."""


@dataclass
class PublishResult:
    remote_id: str
    url: str = ""
    warnings: list[str] = field(default_factory=list)
