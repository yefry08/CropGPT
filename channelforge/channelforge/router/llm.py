"""Python-side LLM router for simple generation (metadata, captions, critic).

Everything goes through the local OmniRoute gateway (OpenAI-compatible
/v1/chat/completions). Each task kind has an ordered list of OmniRoute model
ids — typically the Claude combo, then an `auto/<variant>` target that routes
across every other connected provider. We move to the next target on a
fallback trigger (429/529, usage/quota messages, timeouts, 502/503 when the
combo cannot serve). If OmniRoute itself is unreachable it is (re)started when
autostart is on; otherwise GatewayDown is raised so the job can pause and later
resume from its checkpoint.

Every attempt is written to the llm_calls ledger with the served model, tokens and cost.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Literal

import httpx

from .. import secrets
from ..config import RouterConfig
from ..db import JobDB
from . import omniroute
from .errors import FALLBACK_TRIGGERS, AllTargetsFailed, Failure, GatewayDown, LLMError, classify

log = logging.getLogger(__name__)

Kind = Literal["general", "metadata", "critic"]


@dataclass(frozen=True)
class Target:
    model: str                    # OmniRoute model id: a combo name, provider/model, or auto/<variant>
    gateway: str = "omniroute"

    @property
    def name(self) -> str:
        return f"{self.gateway}:{self.model}"


@dataclass
class LLMResult:
    text: str
    target: Target
    served_model: str | None
    tokens_in: int
    tokens_out: int
    cost_usd: float
    latency_ms: int
    fallbacks: list[tuple[str, str]] = field(default_factory=list)   # (target, failure)


def build_chains(cfg: RouterConfig) -> dict[str, list[Target]]:
    return {"general": [Target(m) for m in cfg.general_models],
            "critic": [Target(m) for m in cfg.critic_models],
            "metadata": [Target(m) for m in cfg.metadata_models]}


class LLMRouter:
    def __init__(self, cfg: RouterConfig, db: JobDB | None = None,
                 chains: dict[str, list[Target]] | None = None, client: httpx.Client | None = None,
                 ensure_up: Callable[[RouterConfig], bool] = omniroute.ensure_up):
        self.cfg = cfg
        self.db = db
        self.chains = chains or build_chains(cfg)
        self.ensure_up = ensure_up
        self._client = client or httpx.Client(timeout=httpx.Timeout(cfg.request_timeout_s, connect=5.0))

    def _call(self, t: Target, messages: list[dict], params: dict[str, Any]) -> LLMResult:
        url = self.cfg.omniroute_url.rstrip("/") + "/v1/chat/completions"
        headers = {"x-omniroute-no-memory": "true"}
        key = secrets.get_secret(secrets.OMNIROUTE_API_KEY)
        if key:
            headers["Authorization"] = f"Bearer {key}"
        body = {"model": t.model, "messages": messages, **params}
        t0 = time.monotonic()
        try:
            r = self._client.post(url, json=body, headers=headers)
        except httpx.TimeoutException as e:
            raise LLMError(Failure.TIMEOUT, f"timeout: {e}") from e
        except httpx.TransportError as e:   # connection refused, reset: the gateway itself is down
            raise GatewayDown(f"OmniRoute unreachable at {self.cfg.omniroute_url}: {e}") from e
        latency = int((time.monotonic() - t0) * 1000)
        if r.status_code >= 400:
            text = r.text[:2000]
            raise LLMError(classify(r.status_code, text), f"HTTP {r.status_code}: {text}", r.status_code)
        data = r.json()
        if "error" in data and not data.get("choices"):
            msg = str(data["error"])
            raise LLMError(classify(None, msg), msg)
        usage = data.get("usage") or {}
        cost = r.headers.get("X-OmniRoute-Response-Cost")
        return LLMResult(
            text=data["choices"][0]["message"].get("content") or "",
            target=t,
            served_model=r.headers.get("X-OmniRoute-Model") or data.get("model"),
            tokens_in=int(usage.get("prompt_tokens") or 0),
            tokens_out=int(usage.get("completion_tokens") or 0),
            cost_usd=float(cost) if cost is not None else float(usage.get("cost") or 0.0),
            latency_ms=latency,
        )

    def complete(self, messages: list[dict], *, kind: Kind = "general", job_id: int | None = None,
                 stage: str | None = None, **params: Any) -> LLMResult:
        attempts: list[tuple[str, Failure, str]] = []
        restarted = False
        targets = list(self.chains[kind])
        i = 0
        while i < len(targets):
            t = targets[i]
            try:
                res = self._call(t, messages, params)
            except GatewayDown as e:
                self._ledger(job_id, stage, kind, t, None, ok=False, failure=e.failure.value, error=str(e))
                if not restarted and self.ensure_up(self.cfg):
                    restarted = True
                    continue            # same target again, gateway is back
                raise
            except LLMError as e:
                attempts.append((t.name, e.failure, str(e)))
                self._ledger(job_id, stage, kind, t, None, ok=False, failure=e.failure.value, error=str(e))
                log.warning("LLM target %s failed (%s): %s", t.name, e.failure.value, e)
                if e.failure not in FALLBACK_TRIGGERS:
                    raise
                i += 1
                continue
            res.fallbacks = [(a[0], a[1].value) for a in attempts]
            self._ledger(job_id, stage, kind, t, res, ok=True)
            if attempts:
                log.info("LLM fell back to %s after %s", t.name, [a[0] for a in attempts])
            return res
        raise AllTargetsFailed(attempts)

    def _ledger(self, job_id, stage, kind, t: Target, res: LLMResult | None, *, ok: bool,
                failure: str | None = None, error: str | None = None) -> None:
        if not self.db:
            return
        self.db.log_llm_call(
            job_id=job_id, stage=stage, kind=kind, gateway=t.gateway, target=t.name,
            model=res.served_model if res else None,
            tokens_in=res.tokens_in if res else 0, tokens_out=res.tokens_out if res else 0,
            cost_usd=res.cost_usd if res else 0.0, latency_ms=res.latency_ms if res else 0,
            ok=ok, failure=failure, error=error,
            cost_basis=("gateway" if res else None))
