#!/usr/bin/env python3
"""Stand-in for the `claude` CLI used by the resume/failover tests.

Speaks the same stream-json protocol as `claude -p --output-format stream-json`
(shapes verified against claude 2.1.x) and behaves like an OpenMontage agent on
the `framework-smoke` pipeline: every unit of work is one real HTTP call to
$ANTHROPIC_BASE_URL/v1/messages, and checkpoints are written through the
engine's own lib/checkpoint.py (so gate enforcement is the real thing).

A stage is two LLM calls: the first writes an in_progress checkpoint with
metadata.partial_progress, the second writes the awaiting_human checkpoint. A
failure injected between them exercises mid-stage resume.
"""

import json
import os
import re
import sys
import time
import uuid
from pathlib import Path

import httpx

args = sys.argv[1:]


def opt(name, default=None):
    return args[args.index(name) + 1] if name in args else default


prompt = opt("-p", "")
model = opt("--model", "unknown")
session = opt("--resume") or str(uuid.uuid4())
base = os.environ["ANTHROPIC_BASE_URL"].rstrip("/")
token = os.environ.get("ANTHROPIC_AUTH_TOKEN", "")
usage = {"in": 0, "out": 0, "calls": 0}


def emit(ev):
    ev.setdefault("session_id", session)
    print(json.dumps(ev), flush=True)


def finish(text, *, error_status=None, force_error=False):
    is_error = error_status is not None or force_error
    if is_error:
        emit({"type": "assistant", "is_api_error_message": True, "error": "unknown",
              "message": {"model": "<synthetic>", "content": [{"type": "text", "text": text}]}})
    emit({"type": "result", "subtype": "success", "is_error": is_error, "api_error_status": error_status,
          "terminal_reason": "api_error" if is_error else "completed", "result": text,
          "total_cost_usd": 0.001 * usage["calls"],
          "modelUsage": {model: {"inputTokens": usage["in"], "outputTokens": usage["out"],
                                 "costUSD": 0.001 * usage["calls"]}} if usage["calls"] else {}})
    sys.exit(1 if is_error else 0)


def llm(what):
    for attempt in range(1, 11):
        try:
            r = httpx.post(base + "/v1/messages", timeout=60, headers={"Authorization": f"Bearer {token}"},
                           json={"model": model, "max_tokens": 64, "messages": [{"role": "user", "content": what}]})
        except httpx.TransportError:
            # What claude 2.1.x does when the gateway is unreachable: status-less retries, then this text.
            emit({"type": "system", "subtype": "api_retry", "attempt": attempt, "max_retries": 10,
                  "retry_delay_ms": 50, "error_status": None, "error": "unknown"})
            time.sleep(0.05)
            if attempt == 10:
                finish("API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)",
                       error_status=None, force_error=True)
            continue
        if r.status_code in (429, 529):
            emit({"type": "system", "subtype": "api_retry", "attempt": attempt, "max_retries": 10,
                  "retry_delay_ms": 50, "error_status": r.status_code,
                  "error": "rate_limit" if r.status_code == 429 else "overloaded"})
            time.sleep(0.05)
            continue
        if r.status_code >= 400:
            msg = r.json().get("error", {}).get("message", r.text)
            finish(f"API Error: {r.status_code} {msg}", error_status=r.status_code)
        usage["calls"] += 1
        usage["in"] += 11
        usage["out"] += 7
        emit({"type": "assistant", "message": {"model": model, "content": [
            {"type": "tool_use", "name": "Bash", "input": {"description": what}}]}})
        return r.json()["content"][0]["text"]
    finish("API Error: 429 rate limited (retries exhausted)", error_status=429)


emit({"type": "system", "subtype": "init", "cwd": os.getcwd(), "model": model})

sys.path.insert(0, os.getcwd())
from lib.checkpoint import init_project, read_checkpoint, write_checkpoint  # noqa: E402

PD = Path("projects")
STAGES = ["research", "script"]
pid = re.search(r"project '([^']+)'", prompt).group(1)

RESEARCH = json.loads(Path(os.environ["FAKE_ARTIFACTS"]).read_text())["research_brief"]
SCRIPT = {"version": "1.0", "title": "Smoke", "total_duration_seconds": 10,
          "sections": [{"id": "s1", "text": "Hello.", "start_seconds": 0, "end_seconds": 10}]}
ARTIFACT = {"research": ("research_brief", RESEARCH), "script": ("script", SCRIPT)}

if not (PD / pid / "project.json").exists():
    init_project(pid, title="Smoke", pipeline_type="framework-smoke", pipeline_dir=PD)

m = re.search(r"for gate '(\w+)': APPROVED", prompt)
if m:
    gate = m.group(1)
    cp = read_checkpoint(PD, pid, gate)
    write_checkpoint(PD, pid, gate, "completed", cp["artifacts"], pipeline_type="framework-smoke",
                     human_approval_required=True, human_approved=True, metadata=cp.get("metadata"))

for stage in STAGES:
    cp = read_checkpoint(PD, pid, stage)
    status = cp["status"] if cp else None
    if status == "completed":
        continue
    if status == "awaiting_human":
        finish(f"Stage {stage} is awaiting human approval.")
    partial = (cp or {}).get("metadata", {}).get("partial_progress") if status == "in_progress" else None
    if not partial:
        llm(f"{stage}: first half")
        partial = {"first_half_by": model}
        write_checkpoint(PD, pid, stage, "in_progress", {}, pipeline_type="framework-smoke",
                         metadata={"partial_progress": partial})
    llm(f"{stage}: second half")
    name, art = ARTIFACT[stage]
    write_checkpoint(PD, pid, stage, "awaiting_human", {name: art}, pipeline_type="framework-smoke",
                     human_approval_required=True,
                     metadata={"first_half_by": partial["first_half_by"], "second_half_by": model})
    emit({"type": "assistant", "message": {"model": model, "content": [
        {"type": "text", "text": f"{stage} ready for review"}]}})
    finish(f"Stage {stage} complete — awaiting approval.")

finish("Pipeline complete.")
