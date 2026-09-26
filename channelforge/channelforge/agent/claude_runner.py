"""Run Claude Code headless (``claude -p --output-format stream-json --verbose``).

Observed stream-json contract (claude 2.1.x, verified against a mock gateway):
  {"type":"system","subtype":"init","session_id":…,"model":…}
  {"type":"system","subtype":"api_retry","attempt":n,"max_retries":10,"error_status":429,"error":"rate_limit"}
  {"type":"assistant","message":{…content…}}      (``is_api_error_message`` on synthetic errors)
  {"type":"result","is_error":bool,"api_error_status":int|None,"terminal_reason":"completed"|"api_error",
   "result":str,"session_id":…,"total_cost_usd":…,"modelUsage":{model:{inputTokens,outputTokens,costUSD,…}}}

Claude Code retries 429/529 ten times (~3 minutes) on its own. We abort the
process after ``api_retries_before_switch`` retry events so the supervisor can
fail over to the next routing target quickly.
"""

from __future__ import annotations

import json
import os
import queue
import shutil
import signal
import subprocess
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from .. import secrets
from ..router.errors import FALLBACK_TRIGGERS, Failure, classify


@dataclass(frozen=True)
class AgentTarget:
    """Where the claude subprocess sends its Anthropic Messages traffic."""
    name: str                 # e.g. "omniroute:channelforge-primary"
    gateway: str              # omniroute | openrouter
    base_url: str             # gateway ROOT — Claude Code appends /v1/messages
    token_secret: str         # keyring name of the bearer token
    model: str


@dataclass
class AgentRunResult:
    ok: bool
    session_id: str | None = None
    result_text: str = ""
    failure: Failure | None = None
    api_error_status: int | None = None
    total_cost_usd: float = 0.0
    model_usage: dict[str, Any] = field(default_factory=dict)
    returncode: int | None = None
    got_result_event: bool = False
    stderr_tail: str = ""

    @property
    def should_fallback(self) -> bool:
        return self.failure in FALLBACK_TRIGGERS


EventCallback = Callable[[dict[str, Any]], None]

_SCRUB_ENV_PREFIXES = ("ANTHROPIC_", "CLAUDE_CODE_", "CLAUDECODE")


def build_env(target: AgentTarget, extra: dict[str, str] | None = None) -> dict[str, str]:
    env = {k: v for k, v in os.environ.items() if not k.startswith(_SCRUB_ENV_PREFIXES)}
    token = secrets.get_secret(target.token_secret) or ""
    env.update({
        "ANTHROPIC_BASE_URL": target.base_url.rstrip("/"),
        "ANTHROPIC_AUTH_TOKEN": token,
        # Must be an empty string, not unset, or Claude Code may authenticate against Anthropic directly.
        "ANTHROPIC_API_KEY": "",
        "ANTHROPIC_MODEL": target.model,
    })
    env.update(extra or {})
    return env


def run_claude(prompt: str, *, cwd: Path, target: AgentTarget, claude_bin: str = "claude",
               resume_session: str | None = None, permission_mode: str = "acceptEdits",
               allowed_tools: list[str] | None = None,
               append_system_prompt: str | None = None, on_event: EventCallback | None = None,
               api_retries_before_switch: int = 2, idle_timeout_s: float = 900.0,
               extra_env: dict[str, str] | None = None,
               cancel: threading.Event | None = None) -> AgentRunResult:
    cmd = [claude_bin, "-p", prompt, "--output-format", "stream-json", "--verbose",
           "--model", target.model, "--permission-mode", permission_mode]
    if resume_session:
        cmd += ["--resume", resume_session]
    if append_system_prompt:
        cmd += ["--append-system-prompt", append_system_prompt]
    if allowed_tools:
        cmd += ["--allowedTools", ",".join(allowed_tools)]

    cmd[0] = shutil.which(claude_bin) or claude_bin     # resolves claude.cmd on Windows
    group_kw: dict[str, Any] = ({"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt"
                                else {"start_new_session": True})
    proc = subprocess.Popen(cmd, cwd=str(cwd), env=build_env(target, extra_env),
                            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            text=True, encoding="utf-8", errors="replace", bufsize=1, **group_kw)
    lines: "queue.Queue[str | None]" = queue.Queue()
    stderr_buf: list[str] = []

    def pump_stdout():
        assert proc.stdout
        for line in proc.stdout:
            lines.put(line)
        lines.put(None)

    def pump_stderr():
        assert proc.stderr
        for line in proc.stderr:
            stderr_buf.append(line)
            del stderr_buf[:-50]

    threading.Thread(target=pump_stdout, daemon=True).start()
    threading.Thread(target=pump_stderr, daemon=True).start()

    res = AgentRunResult(ok=False)
    retry_count = 0
    last_activity = time.monotonic()

    def kill():
        if os.name == "nt":
            # taskkill /T takes down the whole tree (node + tool subprocesses).
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
            return
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            pass
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass

    while True:
        if cancel is not None and cancel.is_set():
            kill()
            res.failure = Failure.FATAL
            res.result_text = "cancelled"
            break
        try:
            line = lines.get(timeout=1.0)
        except queue.Empty:
            if time.monotonic() - last_activity > idle_timeout_s:
                kill()
                res.failure = Failure.TIMEOUT
                res.result_text = f"no output for {idle_timeout_s:.0f}s"
                break
            continue
        if line is None:
            break
        last_activity = time.monotonic()
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        if on_event:
            on_event(ev)
        etype, sub = ev.get("type"), ev.get("subtype")
        if ev.get("session_id"):
            res.session_id = ev["session_id"]
        if etype == "system" and sub == "api_retry":
            retry_count += 1
            status = ev.get("error_status")
            failure = classify(status, str(ev.get("error", "")))
            if failure in FALLBACK_TRIGGERS and retry_count >= api_retries_before_switch:
                kill()
                res.failure = failure
                res.api_error_status = status
                res.result_text = f"aborted after {retry_count} API retries ({status} {ev.get('error')})"
                break
        elif etype == "result":
            res.got_result_event = True
            res.result_text = ev.get("result") or ""
            res.total_cost_usd = float(ev.get("total_cost_usd") or 0.0)
            res.model_usage = ev.get("modelUsage") or {}
            res.api_error_status = ev.get("api_error_status")
            if ev.get("is_error"):
                res.failure = classify(res.api_error_status, res.result_text)
            else:
                res.ok = True

    try:
        res.returncode = proc.wait(timeout=30)
    except subprocess.TimeoutExpired:
        kill()
        res.returncode = proc.returncode
    res.stderr_tail = secrets.redact("".join(stderr_buf)[-2000:])
    if not res.ok and res.failure is None:
        # Process died without a result event: a crash. Classify from stderr if possible.
        res.failure = classify(None, res.stderr_tail)
        if not res.result_text:
            res.result_text = f"claude exited rc={res.returncode} without a result event"
    return res
