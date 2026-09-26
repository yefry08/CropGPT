"""OmniRoute health check and combo bootstrap.

Combos are created through OmniRoute's management API (POST /api/combos,
schema: src/shared/validation/schemas/combo.ts — name, models[], strategy,
config). Management calls need an ``oma_live_…`` access token or a
manage-scoped API key (docs/guides/MANAGEMENT-AUTH.md); inference keys are
rejected with 403.
"""

from __future__ import annotations

import logging
import subprocess
import threading
import time
from typing import Any

import httpx

from .. import secrets
from ..config import RouterConfig


log = logging.getLogger(__name__)
_start_lock = threading.Lock()


def is_up(cfg: RouterConfig, timeout: float = 2.0) -> bool:
    try:
        r = httpx.get(cfg.omniroute_url.rstrip("/") + "/api/monitoring/health", timeout=timeout)
        return r.status_code < 500
    except httpx.HTTPError:
        return False


def ensure_up(cfg: RouterConfig) -> bool:
    """Return True if OmniRoute answers; if not and autostart is on, start it and wait.

    Uses the CLI's documented background mode: `omniroute serve --no-open --no-tray --daemon`.
    """
    if is_up(cfg):
        return True
    if not cfg.omniroute_autostart:
        return False
    with _start_lock:                       # one start attempt at a time across workers
        if is_up(cfg):
            return True
        log.warning("OmniRoute is down at %s — starting it", cfg.omniroute_url)
        try:
            subprocess.run([cfg.omniroute_bin, "serve", "--no-open", "--no-tray", "--daemon"],
                           capture_output=True, timeout=60)
        except (OSError, subprocess.TimeoutExpired) as e:
            log.error("could not start OmniRoute: %s", e)
            return False
        deadline = time.monotonic() + cfg.omniroute_start_timeout_s
        while time.monotonic() < deadline:
            if is_up(cfg):
                log.info("OmniRoute is back up")
                return True
            time.sleep(2)
    return False


def combo_payloads(cfg: RouterConfig) -> list[dict[str, Any]]:
    """The Claude combo: steps are tried in priority order; OmniRoute fails over on 429/5xx/timeouts.

    Non-Claude fallback is not a combo step: it is the separate `auto/<variant>` target that
    follows the combo in each routing list (OmniRoute skips `auto/*` steps inside combos).
    """
    resilience = {"maxRetries": 1, "retryDelayMs": 500, "timeoutMs": int(cfg.request_timeout_s * 1000)}
    return [
        {"name": cfg.primary_combo,
         "description": "ChannelForge primary: Claude subscription -> Claude API key",
         "models": [{"model": m} for m in cfg.primary_combo_models],
         "strategy": "priority", "config": resilience},
    ]


def connect(cfg: RouterConfig, password: str, scope: str = "write") -> str:
    """Exchange the dashboard password for a scoped access token (POST /api/cli/connect) and
    store it in the keyring as the management token. The password itself is never stored."""
    r = httpx.post(cfg.omniroute_url.rstrip("/") + "/api/cli/connect", timeout=15,
                   json={"password": password, "name": "channelforge", "scope": scope})
    if r.status_code >= 400:
        raise RuntimeError(f"OmniRoute connect failed: HTTP {r.status_code} {r.text[:200]}")
    data = r.json()
    secrets.set_secret(secrets.OMNIROUTE_MANAGEMENT_TOKEN, data["token"])
    return f"stored a '{data.get('scope')}' access token (id {data.get('id')}) in the keyring"


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
    except httpx.HTTPStatusError as e:
        available = set()
        hint = (" — /v1/models needs the inference key: `channelforge secrets set omniroute_api_key`"
                if e.response.status_code == 401 else "")
        report.append(f"warning: could not list /v1/models (HTTP {e.response.status_code}){hint}; "
                      "model ids not validated")
    except httpx.HTTPError as e:
        available = set()
        report.append(f"warning: could not list /v1/models ({e}); model ids not validated")
    with httpx.Client(timeout=15, headers=headers) as c:
        existing = {x.get("name"): x for x in _combo_list(c.get(base + "/api/combos"))}
        for payload in combo_payloads(cfg):
            missing = [s["model"] for s in payload["models"] if available and s["model"] not in available]
            for m in missing:
                report.append(f"warning: {payload['name']}: model '{m}' not in OmniRoute /v1/models — "
                              "connect that provider or edit the model id in Settings")
            if payload["name"] in existing:
                r = c.put(f"{base}/api/combos/{existing[payload['name']]['id']}", json=payload)
                verb = "updated"
            else:
                r = c.post(base + "/api/combos", json=payload)
                verb = "created"
            if r.status_code >= 400:
                raise RuntimeError(f"combo {payload['name']}: HTTP {r.status_code} {r.text[:300]}")
            report.append(f"{verb} combo {payload['name']}")
    # Routing targets outside the combo must exist too (auto/* ids resolve on demand).
    targets = set(cfg.agent_models + cfg.general_models + cfg.critic_models + cfg.metadata_models)
    for m in sorted(targets - {cfg.primary_combo}):
        if available and not m.startswith("auto") and m not in available:
            report.append(f"warning: routing target '{m}' not in OmniRoute /v1/models")
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
