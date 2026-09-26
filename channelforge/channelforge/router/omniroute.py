"""OmniRoute health check and combo bootstrap.

Combos are created through OmniRoute's management API (POST /api/combos,
schema: src/shared/validation/schemas/combo.ts — name, models[], strategy,
config). Management calls need an ``oma_live_…`` access token or a
manage-scoped API key (docs/guides/MANAGEMENT-AUTH.md); inference keys are
rejected with 403.
"""

from __future__ import annotations

from typing import Any

import httpx

from .. import secrets
from ..config import RouterConfig


def is_up(cfg: RouterConfig, timeout: float = 2.0) -> bool:
    try:
        r = httpx.get(cfg.omniroute_url.rstrip("/") + "/api/monitoring/health", timeout=timeout)
        return r.status_code < 500
    except httpx.HTTPError:
        return False


def combo_payloads(cfg: RouterConfig) -> list[dict[str, Any]]:
    """Priority combos: steps are tried in order; OmniRoute fails over on 429/5xx/timeouts."""
    resilience = {"maxRetries": 1, "retryDelayMs": 500, "timeoutMs": int(cfg.request_timeout_s * 1000)}
    return [
        {"name": cfg.primary_combo,
         "description": "ChannelForge primary: Claude subscription -> Claude API -> OpenRouter",
         "models": [{"model": m} for m in cfg.primary_combo_models],
         "strategy": "priority", "config": resilience},
        {"name": cfg.cheap_combo,
         "description": "ChannelForge metadata-only tasks (titles, captions, hashtags)",
         "models": [{"model": m} for m in cfg.cheap_combo_models],
         "strategy": "priority", "config": resilience},
    ]


def list_models(cfg: RouterConfig) -> set[str]:
    key = secrets.get_secret(secrets.OMNIROUTE_API_KEY)
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    r = httpx.get(cfg.omniroute_url.rstrip("/") + "/v1/models", headers=headers, timeout=10)
    r.raise_for_status()
    return {m["id"] for m in r.json().get("data", [])}


def setup_combos(cfg: RouterConfig) -> list[str]:
    """Create/update the ChannelForge combos. Returns human-readable report lines."""
    token = secrets.get_secret(secrets.OMNIROUTE_MANAGEMENT_TOKEN)
    if not token:
        raise RuntimeError("Set the OmniRoute management token (oma_live_… or manage-scoped key) in Settings first.")
    base = cfg.omniroute_url.rstrip("/")
    headers = {"Authorization": f"Bearer {token}"}
    report: list[str] = []
    try:
        available = list_models(cfg)
    except httpx.HTTPError as e:
        available = set()
        report.append(f"warning: could not list /v1/models ({e}); model ids not validated")
    with httpx.Client(timeout=15, headers=headers) as c:
        existing = {x.get("name"): x for x in _combo_list(c.get(base + "/api/combos"))}
        for payload in combo_payloads(cfg):
            missing = [s["model"] for s in payload["models"] if available and s["model"] not in available]
            for m in missing:
                report.append(f"warning: {payload['name']}: model '{m}' not in OmniRoute /v1/models — "
                              "connect that provider or edit the model id in config")
            if payload["name"] in existing:
                r = c.put(f"{base}/api/combos/{existing[payload['name']]['id']}", json=payload)
                verb = "updated"
            else:
                r = c.post(base + "/api/combos", json=payload)
                verb = "created"
            if r.status_code >= 400:
                raise RuntimeError(f"combo {payload['name']}: HTTP {r.status_code} {r.text[:300]}")
            report.append(f"{verb} combo {payload['name']}")
    return report


def _combo_list(r: httpx.Response) -> list[dict]:
    r.raise_for_status()
    data = r.json()
    if isinstance(data, list):
        return data
    for key in ("combos", "data", "items"):
        if isinstance(data.get(key), list):
            return data[key]
    return []
