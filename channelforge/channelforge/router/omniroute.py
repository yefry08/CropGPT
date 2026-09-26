"""OmniRoute health check and combo bootstrap.

Combos are created through OmniRoute's management API (POST /api/combos,
schema: src/shared/validation/schemas/combo.ts — name, models[], strategy,
config). Management calls need an ``oma_live_…`` access token or a
manage-scoped API key (docs/guides/MANAGEMENT-AUTH.md); inference keys are
rejected with 403.
"""

from __future__ import annotations

import json
import logging
import subprocess
import threading
import time
from typing import Any, Callable

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


def provider_aliases(cfg: RouterConfig) -> dict[str, str]:
    """provider id -> model-id prefix, from the local catalog (`omniroute providers available --json`),
    e.g. claude -> cc, kiro -> kr, anthropic -> anthropic. Empty if the CLI is unavailable."""
    try:
        out = subprocess.run([cfg.omniroute_bin, "providers", "available", "--json"], capture_output=True,
                             text=True, timeout=60).stdout
        data = json.loads(out[out.index("{"):])      # the CLI prints "Loaded env" lines before the JSON
    except (OSError, subprocess.TimeoutExpired, ValueError):
        return {}
    return {p["id"]: p.get("alias") or p["id"] for p in data.get("providers", [])}


def connected_prefixes(cfg: RouterConfig, token: str,
                       aliases: Callable[[RouterConfig], dict[str, str]] = provider_aliases) -> set[str]:
    """Model-id prefixes of the providers you actually connected (GET /api/providers, management auth).

    /v1/models is NOT usable for this: it lists OmniRoute's whole catalog (hundreds of models from
    providers that were never connected)."""
    r = httpx.get(cfg.omniroute_url.rstrip("/") + "/api/providers", timeout=15,
                  headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    ids = {c["provider"] for c in r.json().get("connections", []) if c.get("isActive", True)}
    alias = aliases(cfg) if ids else {}
    return ids | {alias[i] for i in ids if i in alias}


MAX_EXTRA_CLAUDE = 4


def claude_models(cfg: RouterConfig, available: set[str], prefixes: set[str]) -> list[str]:
    """Claude-family models from connected providers: the configured ids first (in order), then up to
    MAX_EXTRA_CLAUDE other connected Claude models (e.g. a free Kiro account), opus before sonnet."""
    def connected(m: str) -> bool:
        return m in available and m.split("/", 1)[0] in prefixes

    chosen = [m for m in cfg.primary_combo_models if connected(m)]
    extra = [m for m in available if "claude" in m.lower() and connected(m) and m not in chosen]
    rank = lambda m: (0 if "opus" in m else 1 if "sonnet" in m else 2, m)  # noqa: E731
    return chosen + sorted(extra, key=rank)[:MAX_EXTRA_CLAUDE]


ROUTING_LISTS = ("agent_models", "general_models", "critic_models", "metadata_models")


def setup_combos(cfg: RouterConfig,
                 aliases: Callable[[RouterConfig], dict[str, str]] = provider_aliases) -> list[str]:
    """Create/update the Claude combo from the models you actually have connected.

    Mutates ``cfg``: when no Claude model is connected, the combo is dropped from every routing
    list so jobs go straight to OmniRoute's auto/* router instead of burning retries on an empty
    combo; when one is connected again, the combo is put back first. Caller saves the config.
    """
    token = secrets.get_secret(secrets.OMNIROUTE_MANAGEMENT_TOKEN)
    if not token:
        raise RuntimeError("No OmniRoute management token — run `channelforge omniroute connect` first.")
    base = cfg.omniroute_url.rstrip("/")
    report: list[str] = []
    try:
        available = list_models(cfg)
    except httpx.HTTPStatusError as e:
        hint = (" — it needs the inference key: `channelforge secrets set omniroute_api_key`"
                if e.response.status_code == 401 else "")
        raise RuntimeError(f"could not list OmniRoute /v1/models (HTTP {e.response.status_code}){hint}") from e

    prefixes = connected_prefixes(cfg, token, aliases)
    models = claude_models(cfg, available, prefixes)
    defaults = type(cfg)()
    if not models:
        report.append("no Claude model is connected in OmniRoute — routing uses the auto/* router only "
                      "(connect Claude Code, Anthropic or Kiro under Providers, then re-run setup)")
        for name in ROUTING_LISTS:
            kept = [m for m in getattr(cfg, name) if m != cfg.primary_combo]
            setattr(cfg, name, kept or ["auto"])
        return report

    for m in cfg.primary_combo_models:
        if m not in models:
            report.append(f"skipped '{m}' (provider not connected in OmniRoute)")
    payload = combo_payloads(cfg)[0]
    payload["models"] = [{"model": m} for m in models]
    with httpx.Client(timeout=15, headers={"Authorization": f"Bearer {token}"}) as c:
        existing = {x.get("name"): x for x in _combo_list(c.get(base + "/api/combos"))}
        if payload["name"] in existing:
            r = c.put(f"{base}/api/combos/{existing[payload['name']]['id']}", json=payload)
            verb = "updated"
        else:
            r = c.post(base + "/api/combos", json=payload)
            verb = "created"
    if r.status_code >= 400:
        raise RuntimeError(f"combo {payload['name']}: HTTP {r.status_code} {r.text[:300]}")
    report.append(f"{verb} combo {payload['name']}: " + " -> ".join(models))

    # Put the combo back where the defaults have it, in lists that lost it while no Claude was connected.
    for name in ROUTING_LISTS:
        current, default = getattr(cfg, name), getattr(defaults, name)
        if cfg.primary_combo in current or cfg.primary_combo not in default:
            continue
        if current == ["auto"]:
            setattr(cfg, name, list(default))
        else:
            pos = default.index(cfg.primary_combo)
            setattr(cfg, name, current[:pos] + [cfg.primary_combo] + current[pos:])
    for m in sorted({m for n in ROUTING_LISTS for m in getattr(cfg, n)} - {cfg.primary_combo}):
        if not m.startswith("auto") and m not in available:
            report.append(f"warning: routing target '{m}' is not in OmniRoute /v1/models")
    return report


def verify(cfg: RouterConfig, aliases: Callable[[RouterConfig], dict[str, str]] = provider_aliases) -> list[str]:
    """OmniRoute's quick start step 4 (GET /v1/models with the inference key), plus what is connected."""
    models = list_models(cfg)
    lines = [f"OmniRoute {cfg.omniroute_url}: inference key OK ({len(models)} models in the catalog)"]
    token = secrets.get_secret(secrets.OMNIROUTE_MANAGEMENT_TOKEN)
    if not token:
        return lines + ["run `channelforge omniroute connect` to see which providers are connected"]
    prefixes = connected_prefixes(cfg, token, aliases)
    claude = claude_models(cfg, models, prefixes)
    return lines + [
        "connected providers: " + (", ".join(sorted(prefixes)) or "none — connect some under Providers"),
        "Claude models for the combo: " + (", ".join(claude) or "none (routing will use the auto/* router)")]


def _combo_list(r: httpx.Response) -> list[dict]:
    r.raise_for_status()
    data = r.json()
    if isinstance(data, list):
        return data
    for key in ("combos", "data", "items"):
        if isinstance(data.get(key), list):
            return data[key]
    return []
