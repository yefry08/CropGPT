"""Background job runner: claims queued jobs and advances them through the supervisor."""

from __future__ import annotations

import logging
import threading
from typing import Callable

from ..agent.claude_runner import AgentTarget
from ..agent.supervisor import AgentSupervisor, Decision, Outcome
from ..config import AppConfig
from ..db import JobDB
from ..router import omniroute
from ..secrets import OMNIROUTE_API_KEY, OPENROUTER_API_KEY
from .channels import RECIPES, ChannelRecipe, build_engine_job, job_output_dir

log = logging.getLogger(__name__)


def agent_targets(cfg: AppConfig) -> list[AgentTarget]:
    r = cfg.router
    targets = [AgentTarget(f"omniroute:{r.primary_combo}", "omniroute", r.omniroute_url, OMNIROUTE_API_KEY,
                           r.primary_combo)]
    targets += [AgentTarget(f"openrouter:{m}", "openrouter", r.openrouter_url, OPENROUTER_API_KEY, m)
                for m in r.openrouter_models]
    return targets


class JobRunner:
    def __init__(self, cfg: AppConfig, db: JobDB, supervisor: AgentSupervisor | None = None,
                 recipes: dict[str, ChannelRecipe] = RECIPES, workers: int = 1):
        self.cfg = cfg
        self.db = db
        self.recipes = recipes
        self.supervisor = supervisor or AgentSupervisor(
            db, agent_targets(cfg), claude_bin=cfg.claude_bin, permission_mode=cfg.claude_permission_mode,
            allowed_tools=cfg.claude_allowed_tools,
            api_retries_before_switch=cfg.router.agent_api_retries_before_switch,
            idle_timeout_s=cfg.router.agent_idle_timeout_s, omniroute_up=lambda: omniroute.is_up(cfg.router))
        self.workers = workers
        self._stop = threading.Event()
        self._wake = threading.Event()
        self._threads: list[threading.Thread] = []
        self._cancel: dict[int, threading.Event] = {}

    # -- lifecycle ---------------------------------------------------------
    def start(self) -> None:
        n = self.db.requeue_interrupted()
        if n:
            log.info("re-queued %d job(s) interrupted by a previous crash; they resume from checkpoint", n)
        for i in range(self.workers):
            t = threading.Thread(target=self._loop, name=f"job-worker-{i}", daemon=True)
            t.start()
            self._threads.append(t)

    def stop(self) -> None:
        self._stop.set()
        self._wake.set()
        for ev in self._cancel.values():
            ev.set()

    def poke(self) -> None:
        self._wake.set()

    def cancel(self, job_id: int) -> None:
        if job_id in self._cancel:
            self._cancel[job_id].set()
        self.db.update_job(job_id, status="cancelled")

    # -- actions from the UI ----------------------------------------------
    def decide(self, approval_id: int, verdict: str, note: str | None = None, *, auto: bool = False) -> None:
        appr = self.db.get_approval(approval_id)
        if appr is None:
            raise KeyError(approval_id)
        self.db.decide_approval(approval_id, verdict, note, auto=auto)
        if verdict == "rejected":
            self.db.update_job(appr["job_id"], status="cancelled", error=f"rejected at gate {appr['gate']}")
            self.db.log_event(appr["job_id"], f"gate {appr['gate']} REJECTED" + (f": {note}" if note else ""))
            return
        self.db.log_event(appr["job_id"], f"gate {appr['gate']} {verdict.upper()}"
                          + (" (auto)" if auto else "") + (f": {note}" if note else ""))
        self.db.update_job(appr["job_id"], status="queued")
        self.poke()

    def retry(self, job_id: int) -> None:
        """Retry the failed/stuck stage — the supervisor resumes from the last checkpoint."""
        self.db.update_job(job_id, status="queued", error=None)
        self.db.log_event(job_id, "retry requested — resuming from last checkpoint")
        self.poke()

    # -- worker ------------------------------------------------------------
    def _loop(self) -> None:
        while not self._stop.is_set():
            job = self.db.claim_next_queued()
            if job is None:
                self._wake.wait(timeout=2.0)
                self._wake.clear()
                continue
            try:
                self.run_job(job)
            except Exception as e:   # never let a worker die
                log.exception("job %s crashed", job["id"])
                self.db.update_job(job["id"], status="failed", error=f"{type(e).__name__}: {e}")
                self.db.log_event(job["id"], f"job failed: {type(e).__name__}: {e}", level="error")

    def run_job(self, job: dict) -> Outcome:
        ej = build_engine_job(self.cfg, job, self.recipes)
        if not job.get("project_id"):
            self.db.update_job(job["id"], project_id=ej.project_id,
                               output_dir=str(job_output_dir(self.cfg, job)))
        cancel = self._cancel.setdefault(job["id"], threading.Event())
        decision = None
        pending = self.db.next_unconsumed_decision(job["id"])
        if pending:
            decision = Decision(pending["gate"], pending["status"], pending.get("note"))
            self.db.mark_consumed(pending["id"])

        run_id = self.db.start_stage(job["id"], job.get("current_stage") or ej.stages[0])
        result = self.supervisor.advance(ej, decision, cancel=cancel)
        self.db.finish_stage(run_id, result.outcome.value)

        if result.outcome == Outcome.AWAITING:
            gate = result.state.awaiting[0]
            appr_id = self.db.create_approval(job["id"], gate, result.message,
                                              {"checkpoint": str(ej.project_dir / f"checkpoint_{gate}.json")})
            fresh = self.db.get_job(job["id"]) or job
            if fresh["auto_approve"] and gate != "publish":
                self.db.update_job(job["id"], status="awaiting_approval")
                self.decide(appr_id, "approved", "auto-approve creative gates is ON", auto=True)
            else:
                self.db.update_job(job["id"], status="awaiting_approval")
                self.db.log_event(job["id"], f"waiting for approval at gate '{gate}'", stage=gate)
        elif result.outcome == Outcome.DONE:
            self.db.update_job(job["id"], status="done")
            self.db.log_event(job["id"], "pipeline complete")
        elif (self.db.get_job(job["id"]) or {}).get("status") != "cancelled":
            self.db.update_job(job["id"], status="failed", error=result.message)
            self.db.log_event(job["id"], f"job failed: {result.message}", level="error")
        return result.outcome
