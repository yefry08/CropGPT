"""Secret storage (OS keyring) and log redaction.

Secrets never touch disk in plaintext: they live in the OS keyring under the
``channelforge`` service. Every value read through this module is registered
with the redactor, and the logging filter installed by ``install_redaction``
scrubs registered values (plus common token shapes) from every log record.
"""

from __future__ import annotations

import logging
import os
import re
import threading

import keyring
from keyring.errors import KeyringError, PasswordDeleteError

SERVICE = "channelforge"

# Known secret names. Per-channel OAuth tokens use ``oauth:<platform>:<channel>``.
OMNIROUTE_API_KEY = "omniroute_api_key"            # inference key for /v1/*
OMNIROUTE_MANAGEMENT_TOKEN = "omniroute_mgmt_token"  # oma_live_… or manage-scoped key
ANTHROPIC_API_KEY = "anthropic_api_key"
KNOWN_SECRETS = (OMNIROUTE_API_KEY, OMNIROUTE_MANAGEMENT_TOKEN, ANTHROPIC_API_KEY)

# Engine provider keys (TTS, image, music…) OpenMontage reads from the environment. They are kept in
# the keyring as "engine_env:<VAR>" and injected into the agent subprocess only, never written to .env.
ENGINE_ENV_PREFIX = "engine_env:"


def engine_env(names: list[str]) -> dict[str, str]:
    out = {}
    for n in names:
        v = get_secret(ENGINE_ENV_PREFIX + n)
        if v:
            out[n] = v
    return out


# Env override (useful for CI / tests): CHANNELFORGE_SECRET_<NAME upper>.
_ENV_PREFIX = "CHANNELFORGE_SECRET_"

_lock = threading.Lock()
_known_values: set[str] = set()

# Token shapes redacted even when not registered (defence in depth).
_PATTERNS = [
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{8,}"),
    re.compile(r"sk-[A-Za-z0-9_\-]{16,}"),
    re.compile(r"oma_live_[A-Za-z0-9_\-]{8,}"),
    re.compile(r"ya29\.[A-Za-z0-9_\-\.]{10,}"),          # Google OAuth access tokens
    re.compile(r"1//[A-Za-z0-9_\-]{20,}"),                # Google refresh tokens
    re.compile(r"(?i)(bearer\s+)[A-Za-z0-9_\-\.=]{12,}"),
]


def _register(value: str | None) -> None:
    if value and len(value) >= 6:
        with _lock:
            _known_values.add(value)


def redact(text: str) -> str:
    if not text:
        return text
    with _lock:
        values = sorted(_known_values, key=len, reverse=True)
    for v in values:
        text = text.replace(v, "***")
    for pat in _PATTERNS:
        text = pat.sub(lambda m: (m.group(1) if m.groups() else "") + "***", text)
    return text


def get_secret(name: str) -> str | None:
    env_val = os.environ.get(_ENV_PREFIX + name.upper().replace(":", "_"))
    if env_val:
        _register(env_val)
        return env_val
    try:
        value = keyring.get_password(SERVICE, name)
    except KeyringError:
        value = None
    _register(value)
    return value


def set_secret(name: str, value: str) -> None:
    _register(value)
    keyring.set_password(SERVICE, name, value)


def delete_secret(name: str) -> None:
    try:
        keyring.delete_password(SERVICE, name)
    except (PasswordDeleteError, KeyringError):
        pass


def has_secret(name: str) -> bool:
    return bool(get_secret(name))


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
        except Exception:
            return True
        record.msg = redact(msg)
        record.args = None
        return True


def install_redaction(logger: logging.Logger | None = None) -> None:
    target = logger or logging.getLogger()
    f = RedactingFilter()
    target.addFilter(f)
    for h in target.handlers:
        h.addFilter(f)
