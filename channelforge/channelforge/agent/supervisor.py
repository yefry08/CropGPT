"""Drive an OpenMontage production through Claude Code, surviving model switches.

The supervisor owns *which gateway/model* the agent talks to. The agent owns
the production (OpenMontage is agent-first; its checkpoints are the source of
truth). On a fallback trigger the supervisor kills the agent, switches to the
next routing target and starts a fresh session that resumes from the last
checkpoint — a job is never restarted from zero.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Callable

from ..db import JobDB
from ..router.errors import Failure
from .checkpoints import ProjectState, read_state
from .claude_runner import AgentRunResult, AgentTarget, run_claude


class Outcome(str, Enum):
    DONE = "done"
    AWAITING = "awaiting_approval"
    PAUSED = "paused"                # OmniRoute down and could not be restarted; resume later
    FAILED = "failed"


@dataclass
class EngineJob:
    job_id: int
    engine_dir: Path                 # cwd for claude (the engine repo)
    project_id: str
    project_dir: Path
    pipeline: str
    stages: list[str]
    initial_prompt: str
    budget_cap_usd: float
    language: str = "es"
    extra_system_prompt: str = ""
    directive: str | None = None     # ChannelForge instruction (e.g. a duration re-plan) for this run
    app_stages: frozenset[str] = frozenset()   # stages ChannelForge runs itself; the agent hands off before them
    add_dirs: tuple[Path, ...] = ()            # extra read access for the agent (e.g. a skill folder)


@dataclass
class Decision:
    gate: str
    verdict: str                     # approved | edited
    note: str | None = None


HEADLESS_CONTRACT = """\
You are running headless under ChannelForge, a desktop app. No human reads this chat directly.
- Human approval gates are relayed by ChannelForge. At every stage whose manifest sets
  human_approval_default: true, write the checkpoint with status="awaiting_human", then END YOUR
  TURN with a short plain-text summary of what needs approval. Do not continue past a gate.
- Never write human_approved=True unless the latest user message is a ChannelForge decision
  approving that exact stage.
- Where the guides say to ask the user to choose, pick your recommended option, record it in
  decision_log with the alternatives in options_considered, and list it in the gate summary so
  the human can override it at the gate.
- Spoken narration and on-screen text language: {language}.
"""


@dataclass
class SupervisorResult:
    outcome: Outcome
    message: str
    state: ProjectState | None = None
    runs: list[AgentRunResult] = field(default_factory=list)


class AgentSupervisor:
    def __init__(self, db: JobDB, targets: list[AgentTarget], *, claude_bin: str = "claude",
                 permission_mode: str = "acceptEdits", allowed_tools: list[str] | None = None,
                 api_retries_before_switch: int = 2,
                 idle_timeout_s: float = 900.0, ensure_gateway: Callable[[], bool] = lambda: True,
                 max_nudges: int = 3, crash_retries: int = 1, extra_env: dict[str, str] | None = None,
                 env_provider: Callable[[], dict[str, str]] | None = None):
        if not targets:
            raise ValueError("at least one agent target is required")
        self.db = db
        self.targets = targets
        self.claude_bin = claude_bin
        self.permission_mode = permission_mode
        self.allowed_tools = allowed_tools
        self.api_retries_before_switch = api_retries_before_switch
        self.idle_timeout_s = idle_timeout_s
        self.ensure_gateway = ensure_gateway
        self.max_nudges = max_nudges
        self.crash_retries = crash_retries
        self.extra_env = extra_env or {}
        self.env_provider = env_provider      # read per run, so keys added in Settings apply without restart

    # -- prompts -----------------------------------------------------------
    @staticmethod
    def resume_prompt(job: EngineJob, state: ProjectState, decision: Decision | None) -> str:
        parts = [
            f"ChannelForge RESUME: OpenMontage project '{job.project_id}' (pipeline '{job.pipeline}') was "
            "interrupted by a model switch or a crash. Do NOT restart and do NOT redo completed stages.",
            f"Completed stages: {', '.join(state.completed) or 'none'}.",
            f"Resume at stage: {state.next_stage}.",
            f"Read {job.project_dir}/checkpoint_*.json (including metadata.partial_progress of any "
            f"in_progress checkpoint) and the artifacts under {job.project_dir}/artifacts/, then continue "
            "from exactly where the work stopped (for OpenMontage projects this is the Resume Protocol in "
            "skills/meta/checkpoint-protocol.md).",
        ]
        if decision:
            parts.append(AgentSupervisor.decision_prompt(job, decision))
        if job.directive:
            parts.append("ChannelForge INSTRUCTION (takes priority over earlier plans): " + job.directive)
        parts.append("Original brief, for context only:\n" + job.initial_prompt)
        return "\n".join(parts)

    @staticmethod
    def decision_prompt(job: EngineJob, d: Decision) -> str:
        where = f"(project '{job.project_id}' in {job.project_dir}, pipeline '{job.pipeline}') "
        if d.verdict == "approved":
            msg = (f"ChannelForge decision {where}for gate '{d.gate}': APPROVED by the human. Re-write "
                   f"checkpoint '{d.gate}' with status='completed' and human_approved=True, then continue "
                   "with the next stage.")
        else:
            msg = (f"ChannelForge decision {where}for gate '{d.gate}': CHANGES REQUESTED. Revise the '{d.gate}' "
                   "artifact as described below, write the checkpoint as awaiting_human again, and end "
                   "your turn.")
        if d.note:
            msg += f"\nHuman note: {d.note}"
        return msg

    # -- main loop ---------------------------------------------------------
    def _start_index(self, job_row: dict) -> int:
        for i, t in enumerate(self.targets):
            if t.name == job_row.get("agent_target"):
                return i
        return 0

    def advance(self, job: EngineJob, decision: Decision | None = None,
                cancel: threading.Event | None = None) -> SupervisorResult:
        db = self.db
        row = db.get_job(job.job_id) or {}
        idx = self._start_index(row)
        state = read_state(job.project_dir, job.stages)
        if not state.awaiting and (state.done or state.next_stage in job.app_stages) and not decision:
            return SupervisorResult(Outcome.DONE, "handoff to ChannelForge", state, [])
        if not self.ensure_gateway():
            return SupervisorResult(Outcome.PAUSED, "OmniRoute is down and could not be started", state, [])

        session = row.get("agent_session") if row.get("agent_target") == self.targets[idx].name else None
        if decision and session and not job.directive:
            prompt = self.decision_prompt(job, decision)
        elif decision or state.started or job.directive:
            prompt, session = self.resume_prompt(job, state, decision), None
        else:
            prompt = job.initial_prompt

        system = HEADLESS_CONTRACT.format(language=job.language) + job.extra_system_prompt
        runs: list[AgentRunResult] = []
        nudges = crashes = outages = 0
        last_poll = [0.0]

        def on_event(ev: dict) -> None:
            self._on_event(job, ev, last_poll)

        while True:
            target = self.targets[idx]
            db.update_job(job.job_id, agent_target=target.name)
            db.log_event(job.job_id, f"agent run on {target.name}" + (" (resumed session)" if session else ""),
                         stage=state.current_stage)
            res = run_claude(prompt, cwd=job.engine_dir, target=target, claude_bin=self.claude_bin,
                             resume_session=session, permission_mode=self.permission_mode,
                             allowed_tools=self.allowed_tools, add_dirs=job.add_dirs,
                             append_system_prompt=system, on_event=on_event,
                             api_retries_before_switch=self.api_retries_before_switch,
                             idle_timeout_s=self.idle_timeout_s,
                             extra_env={**(self.env_provider() if self.env_provider else {}), **self.extra_env},
                             cancel=cancel)
            runs.append(res)
            self._ledger(job, target, res, state.current_stage)
            if res.session_id:
                db.update_job(job.job_id, agent_session=res.session_id)
            state = read_state(job.project_dir, job.stages)
            db.update_job(job.job_id, current_stage=state.current_stage)

            if cancel is not None and cancel.is_set():
                return SupervisorResult(Outcome.FAILED, "cancelled", state, runs)

            spent = db.job_cost(job.job_id)
            if spent > job.budget_cap_usd:
                return SupervisorResult(Outcome.FAILED, f"budget cap exceeded: ${spent:.2f} > "
                                                        f"${job.budget_cap_usd:.2f}", state, runs)
            if res.ok:
                if state.awaiting:
                    return SupervisorResult(Outcome.AWAITING, res.result_text, state, runs)
                if state.done or state.next_stage in job.app_stages:
                    return SupervisorResult(Outcome.DONE, res.result_text, state, runs)
                nudges += 1
                if nudges > self.max_nudges:
                    return SupervisorResult(Outcome.FAILED, "agent kept stopping without reaching a gate "
                                                            f"(next stage {state.next_stage})", state, runs)
                db.log_event(job.job_id, f"agent ended its turn mid-pipeline; nudging (#{nudges})", level="warn")
                prompt, session = self.resume_prompt(job, state, None), res.session_id
                continue

            if res.failure == Failure.GATEWAY_DOWN:
                if not self.ensure_gateway():
                    db.log_event(job.job_id, "OmniRoute went down mid-run and could not be restarted — pausing; "
                                             "the job resumes from its checkpoint when the gateway is back",
                                 level="warn", stage=state.current_stage)
                    return SupervisorResult(Outcome.PAUSED, "OmniRoute down", state, runs)
                outages += 1
                if outages > 3:
                    return SupervisorResult(Outcome.PAUSED, "OmniRoute keeps going down", state, runs)
                db.log_event(job.job_id, f"OmniRoute was down and is back — resuming on {target.name} from "
                                         f"checkpoint at stage '{state.next_stage}'", level="warn")
                carry = decision if (decision and decision.gate in state.awaiting) else None
                prompt, session = self.resume_prompt(job, state, carry), None
                continue

            if res.should_fallback:
                if idx + 1 >= len(self.targets):
                    return SupervisorResult(Outcome.FAILED, f"all routing targets exhausted; last: "
                                                            f"{res.failure.value}: {res.result_text}", state, runs)
                nxt = self.targets[idx + 1]
                db.log_event(job.job_id, f"MODEL SWITCH: {target.name} failed ({res.failure.value}: "
                                         f"{res.result_text[:160]}) → {nxt.name}; resuming from checkpoint "
                                         f"at stage '{state.next_stage}'", level="warn", stage=state.current_stage)
                idx += 1
                # A pending decision not yet applied must be carried into the resume prompt.
                carry = decision if (decision and decision.gate in state.awaiting) else None
                prompt, session = self.resume_prompt(job, state, carry), None
                continue

            # Crash or fatal error.
            crashes += 1
            if (res.failure == Failure.FATAL and res.got_result_event) or crashes > self.crash_retries:
                return SupervisorResult(Outcome.FAILED, f"{(res.failure or Failure.FATAL).value}: "
                                                        f"{res.result_text} {res.stderr_tail[-300:]}", state, runs)
            db.log_event(job.job_id, f"agent crashed ({res.result_text}); resuming from checkpoint", level="warn")
            carry = decision if (decision and decision.gate in state.awaiting) else None
            prompt, session = self.resume_prompt(job, state, carry), None

    # -- helpers -----------------------------------------------------------
    def _on_event(self, job: EngineJob, ev: dict, last_poll: list[float]) -> None:
        etype = ev.get("type")
        if etype == "assistant":
            for block in (ev.get("message") or {}).get("content") or []:
                if block.get("type") == "tool_use":
                    name = block.get("name")
                    detail = ""
                    inp = block.get("input") or {}
                    if name == "Bash":
                        detail = str(inp.get("description") or inp.get("command", ""))[:140]
                    elif name in ("Read", "Write", "Edit"):
                        detail = str(inp.get("file_path", ""))[-140:]
                    self.db.log_event(job.job_id, f"tool {name}: {detail}")
                elif block.get("type") == "text" and block.get("text", "").strip():
                    self.db.log_event(job.job_id, block["text"].strip()[:400])
        elif etype == "system" and ev.get("subtype") == "api_retry":
            self.db.log_event(job.job_id, f"API retry {ev.get('attempt')}/{ev.get('max_retries')} "
                                          f"(HTTP {ev.get('error_status')} {ev.get('error')})", level="warn")
        now = time.monotonic()
        if now - last_poll[0] > 1.0:
            last_poll[0] = now
            st = read_state(job.project_dir, job.stages)
            self.db.update_job(job.job_id, current_stage=st.current_stage)

    def _ledger(self, job: EngineJob, target: AgentTarget, res: AgentRunResult, stage: str | None) -> None:
        if res.model_usage:
            for model, u in res.model_usage.items():
                self.db.log_llm_call(
                    job_id=job.job_id, stage=stage, kind="agent", gateway=target.gateway, target=target.name,
                    model=model, tokens_in=int(u.get("inputTokens") or 0) + int(u.get("cacheReadInputTokens") or 0)
                    + int(u.get("cacheCreationInputTokens") or 0),
                    tokens_out=int(u.get("outputTokens") or 0), cost_usd=float(u.get("costUSD") or 0.0),
                    cost_basis="claude_code_estimate", ok=res.ok,
                    failure=res.failure.value if res.failure else None,
                    error=None if res.ok else res.result_text)
        else:
            self.db.log_llm_call(job_id=job.job_id, stage=stage, kind="agent", gateway=target.gateway,
                                 target=target.name, model=None, cost_usd=res.total_cost_usd,
                                 cost_basis="claude_code_estimate", ok=res.ok,
                                 failure=res.failure.value if res.failure else None,
                                 error=None if res.ok else res.result_text)
