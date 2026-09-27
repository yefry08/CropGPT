"""Background job runner: claims queued jobs and advances them through the supervisor."""

from __future__ import annotations

import datetime
import json
import logging
import os
import threading
import time
from pathlib import Path
from typing import Callable

from ..agent.claude_runner import AgentTarget
from ..agent.supervisor import AgentSupervisor, Decision, Outcome
from ..config import AppConfig
from ..db import JobDB
from ..pipeline import gates, news
from ..pipeline.app_stages import AppStages, init_project
from ..pipeline.narration import openmontage_synth
from ..pipeline.ingest import ingest as default_ingest
from ..router import omniroute
from ..router.llm import LLMRouter
from .. import secrets
from ..secrets import OMNIROUTE_API_KEY
from .channels import RECIPES, ChannelRecipe, build_engine_job, job_output_dir

log = logging.getLogger(__name__)


def agent_targets(cfg: AppConfig) -> list[AgentTarget]:
    """Every agent target is an OmniRoute model id: the Claude combo first, then auto/<variant>."""
    r = cfg.router
    return [AgentTarget(f"omniroute:{m}", "omniroute", r.omniroute_url, OMNIROUTE_API_KEY, m)
            for m in r.agent_models]


class JobRunner:
    def __init__(self, cfg: AppConfig, db: JobDB, supervisor: AgentSupervisor | None = None,
                 recipes: dict[str, ChannelRecipe] = RECIPES, workers: int = 1, router: LLMRouter | None = None,
                 ingest_fn=default_ingest, app_stages: AppStages | None = None):
        self.cfg = cfg
        self.db = db
        self.recipes = recipes
        self.router = router if router is not None else LLMRouter(cfg.router, db)
        self.ingest_fn = ingest_fn
        self.app_stages = app_stages or AppStages(lambda: openmontage_synth(
            cfg.openmontage_dir, cfg.engine_python, {**os.environ, **secrets.engine_env(cfg.engine_env_vars)}))
        self.supervisor = supervisor or AgentSupervisor(
            db, agent_targets(cfg), claude_bin=cfg.claude_bin, permission_mode=cfg.claude_permission_mode,
            allowed_tools=cfg.claude_allowed_tools,
            api_retries_before_switch=cfg.router.agent_api_retries_before_switch,
            idle_timeout_s=cfg.router.agent_idle_timeout_s,
            ensure_gateway=lambda: omniroute.ensure_up(cfg.router),
            env_provider=lambda: secrets.engine_env(cfg.engine_env_vars))
        self.workers = workers
        self._stop = threading.Event()
        self._wake = threading.Event()
        self._threads: list[threading.Thread] = []
        self._cancel: dict[int, threading.Event] = {}
        self._last_pause_check = 0.0

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
    def _resume_paused(self) -> None:
        """Re-queue jobs paused by a gateway outage once OmniRoute answers again."""
        now = time.monotonic()
        if now - self._last_pause_check < self.cfg.router.gateway_down_retry_s:
            return
        self._last_pause_check = now
        if self.db.jobs_with_status("paused") and self.supervisor.ensure_gateway():
            for j in self.db.jobs_with_status("paused"):
                self.db.update_job(j["id"], status="queued")
                self.db.log_event(j["id"], "OmniRoute is back — resuming from checkpoint")

    def _loop(self) -> None:
        while not self._stop.is_set():
            self._resume_paused()
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
        recipe = self.recipes[job["channel"]]
        if not job.get("output_dir"):
            out = job_output_dir(self.cfg, job)
            self.db.update_job(job["id"], output_dir=str(out))
            job = {**job, "output_dir": str(out)}
        out_dir = Path(job["output_dir"])
        if recipe.script_checks and not (out_dir / "reference" / "input.json").exists():
            self.db.log_event(job["id"], "reading the input (reference metadata + transcript, analysis only)")
            ji = self.ingest_fn(job["input_text"], out_dir)
            for r in ji.references:
                self.db.log_event(job["id"], f"reference: {r.title or r.url} — transcript via "
                                  f"{r.transcript_source or 'none'}" + (f" ({r.error})" if r.error else ""),
                                  level="warn" if r.error else "info")
        ej = build_engine_job(self.cfg, job, self.recipes)
        if ej.app_stages:
            init_project(ej, recipe.manifest_path(self.cfg, job), job["input_text"].splitlines()[0][:80] or ej.project_id)
        if not job.get("project_id"):
            self.db.update_job(job["id"], project_id=ej.project_id)
        cancel = self._cancel.setdefault(job["id"], threading.Event())
        decision = None
        pending = self.db.next_unconsumed_decision(job["id"])
        if pending:
            decision = Decision(pending["gate"], pending["status"], pending.get("note"))

        run_id = self.db.start_stage(job["id"], job.get("current_stage") or ej.stages[0])
        result = self.supervisor.advance(ej, decision, cancel=cancel)
        self.db.finish_stage(run_id, result.outcome.value)
        # A decision counts as delivered only once the agent acted on it: an approval moves the gate
        # off awaiting_human; a change request produces a newer awaiting_human checkpoint. If the run
        # paused or failed first, the decision stays pending and is re-sent on resume.
        if pending:
            applied = result.state is not None and result.state.status.get(pending["gate"]) == "completed"
            if applied or result.outcome not in (Outcome.PAUSED, Outcome.FAILED):
                self.db.mark_consumed(pending["id"])

        if result.outcome == Outcome.AWAITING:
            gate = result.state.awaiting[0]
            if job.get("directive") and gate == "script":      # the agent has produced a new script: consumed
                self.db.update_job(job["id"], directive=None)
            payload = {"checkpoint": str(ej.project_dir / f"checkpoint_{gate}.json")}
            summary = result.message
            if recipe.script_checks and gate == "script":
                g = gates.script_gate(ej, out_dir, self.router)
                if (ej.project_dir / "artifacts" / "research.json").exists() or ej.pipeline == "hand-drawn-news":
                    probs = news.check_research(ej.project_dir / "artifacts" / "research.json",
                                                datetime.date.fromtimestamp(job["created_at"]))
                    g.reports["research"] = {"passed": not probs, "problems": probs}
                    if probs:
                        g.passed = False
                        g.note = ("RESEARCH: " + "; ".join(f"[{p['story']}] {p['problem']}" for p in probs)
                                  + " — replace out-of-window or non-primary sourcing, then rewrite the script."
                                  + ("\n\n" + g.note if g.note else ""))
                    (out_dir / "reports" / "script_gate.json").write_text(json.dumps(g.reports, indent=1))
                payload["checks"] = g.reports
                fresh = self.db.get_job(job["id"]) or job
                if not g.passed and fresh["check_attempts"] < gates.MAX_AUTO_SENDBACKS:
                    self.db.update_job(job["id"], check_attempts=fresh["check_attempts"] + 1,
                                       status="awaiting_approval")
                    appr = self.db.create_approval(job["id"], gate, summary, payload)
                    self.db.log_event(job["id"], f"script checks failed (attempt {fresh['check_attempts'] + 1}/"
                                      f"{gates.MAX_AUTO_SENDBACKS}) — sending back to the agent", level="warn",
                                      stage=gate)
                    self.decide(appr, "edited", g.note, auto=True)
                    return result.outcome
                summary = (summary + "\n\nChannelForge checks: "
                           + ("PASSED" if g.passed else "STILL FAILING after automatic retries — review:\n" + g.note))
            if gate == "film" and ej.app_stages:
                grid, err = self.app_stages.preview(ej)
                fresh = self.db.get_job(job["id"]) or job
                if err and fresh["check_attempts"] < gates.MAX_AUTO_SENDBACKS:
                    self.db.update_job(job["id"], check_attempts=fresh["check_attempts"] + 1, status="awaiting_approval")
                    appr = self.db.create_approval(job["id"], gate, summary, payload)
                    self.db.log_event(job["id"], f"film preview failed — sending back: {err[:200]}", level="warn")
                    self.decide(appr, "edited", err, auto=True)
                    return result.outcome
                if grid:
                    payload["preview_image"] = str(grid)
            appr_id = self.db.create_approval(job["id"], gate, summary, payload)
            fresh = self.db.get_job(job["id"]) or job
            self.db.update_job(job["id"], status="awaiting_approval")
            if fresh["auto_approve"] and gate != "publish" and "STILL FAILING" not in summary:
                self.decide(appr_id, "approved", "auto-approve creative gates is ON", auto=True)
            else:
                self.db.log_event(job["id"], f"waiting for approval at gate '{gate}'", stage=gate)
        elif result.outcome == Outcome.DONE and result.state and result.state.next_stage in ej.app_stages:
            return self._run_app_stage(job, ej, result.state.next_stage)
        elif result.outcome == Outcome.DONE:
            if recipe.long_video:
                return self._finish_long(job, ej, out_dir)
            self.db.update_job(job["id"], status="done")
            self.db.log_event(job["id"], "pipeline complete")
        elif result.outcome == Outcome.PAUSED:
            self.db.update_job(job["id"], status="paused", error=result.message)
            self.db.log_event(job["id"], f"paused: {result.message}", level="warn")
        elif (self.db.get_job(job["id"]) or {}).get("status") != "cancelled":
            self.db.update_job(job["id"], status="failed", error=result.message)
            self.db.log_event(job["id"], f"job failed: {result.message}", level="error")
        return result.outcome

    def _run_app_stage(self, job: dict, ej, stage: str) -> Outcome:
        self.db.update_job(job["id"], current_stage=stage)
        run_id = self.db.start_stage(job["id"], stage)
        self.db.log_event(job["id"], f"ChannelForge stage '{stage}' started", stage=stage)
        try:
            so = self.app_stages.run(stage, ej, lambda m: self.db.log_event(job["id"], m, stage=stage))
        except Exception as e:
            self.db.finish_stage(run_id, "failed")
            self.db.update_job(job["id"], status="failed", error=f"{stage}: {type(e).__name__}: {e}")
            self.db.log_event(job["id"], f"stage '{stage}' failed: {e}", level="error", stage=stage)
            return Outcome.FAILED
        self.db.finish_stage(run_id, "completed" if so.ok else "failed")
        if so.ok:
            self.db.update_job(job["id"], status="queued")
            self.poke()
            return Outcome.AWAITING
        fresh = self.db.get_job(job["id"]) or job
        if fresh["replan_count"] >= gates.MAX_REPLANS:
            self.db.update_job(job["id"], status="failed", error=f"{stage}: {so.note}")
            return Outcome.FAILED
        n = fresh["replan_count"] + 1
        moved = gates.reopen_from(ej, so.reopen_from or stage, f"channelforge-replan-{n}")
        self.db.update_job(job["id"], status="queued", directive=so.note, replan_count=n, agent_session=None)
        self.db.log_event(job["id"], f"{stage.upper()} CHECK: {so.note} — re-opened {', '.join(moved)} (#{n})",
                          level="warn", stage=stage)
        self.poke()
        return Outcome.AWAITING

    def _finish_long(self, job: dict, ej, out_dir: Path) -> Outcome:
        g, render = gates.duration_gate(ej, out_dir)
        fresh = self.db.get_job(job["id"]) or job
        if g.passed:
            files = gates.collect_long(ej, out_dir, render)
            self.db.update_job(job["id"], status="done", directive=None)
            d = g.reports["duration"]
            self.db.log_event(job["id"], f"long video OK: {d['duration_s']:.1f} s at {d['resolution']} "
                                         f"(ffprobe) → {', '.join(files)}")
            return Outcome.DONE
        if fresh["replan_count"] >= gates.MAX_REPLANS:
            self.db.update_job(job["id"], status="failed", directive=None,
                               error=f"duration gate still failing after {gates.MAX_REPLANS} re-plans: {g.note}")
            self.db.log_event(job["id"], "duration gate failed too many times", level="error")
            return Outcome.FAILED
        n = fresh["replan_count"] + 1
        moved = gates.reopen_from(ej, "script", f"channelforge-replan-{n}")
        self.db.update_job(job["id"], status="queued", directive=g.note, replan_count=n, agent_session=None)
        self.db.log_event(job["id"], f"DURATION GATE: {g.note} — re-planning (#{n}); reopened {', '.join(moved)}",
                          level="warn")
        self.poke()
        return Outcome.AWAITING
