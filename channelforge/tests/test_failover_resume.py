"""Acceptance: a simulated 429 on Claude switches to OpenRouter mid-job and the job
completes from its checkpoint (never from zero). Uses fake_claude.py (same stream-json
protocol as `claude -p`) writing real OpenMontage checkpoints via lib/checkpoint.py."""

import json
import sys
import time
from pathlib import Path

import pytest

from channelforge.agent.checkpoints import read_state
from channelforge.agent.claude_runner import AgentTarget
from channelforge.agent.supervisor import AgentSupervisor, Outcome
from channelforge.config import AppConfig
from channelforge.db import JobDB
from channelforge.jobs.channels import RECIPES
from channelforge.jobs.runner import JobRunner
from channelforge.secrets import OMNIROUTE_API_KEY, OPENROUTER_API_KEY
from conftest import FAKE_CLAUDE, SECRET_OMNI, SECRET_OR, dead_port_url

FIXTURE = Path(__file__).parents[1] / "channelforge" / "devtools" / "smoke_artifacts.json"


def setup(tmp_path, engine_dir, omni_url, or_url, *, omniroute_up=True, idle=30.0):
    cfg = AppConfig(engines_dir=engine_dir.parent, output_root=tmp_path / "out", claude_bin=str(FAKE_CLAUDE))
    db = JobDB(tmp_path / "jobs.db")
    targets = [AgentTarget("omniroute:channelforge-primary", "omniroute", omni_url, OMNIROUTE_API_KEY,
                           "channelforge-primary"),
               AgentTarget("openrouter:anthropic/claude-opus-5.5", "openrouter", or_url, OPENROUTER_API_KEY,
                           "anthropic/claude-opus-5.5")]
    sup = AgentSupervisor(db, targets, claude_bin=str(FAKE_CLAUDE), api_retries_before_switch=2,
                          idle_timeout_s=idle, omniroute_up=lambda: omniroute_up,
                          extra_env={"FAKE_ARTIFACTS": str(FIXTURE), "PYTHONPATH": ""})
    runner = JobRunner(cfg, db, supervisor=sup, recipes=RECIPES)
    job_id = db.create_job(channel="geopolitics", input_text="World Cup hosting and soft power",
                           language="es", visual_style="clean-professional", render_backend="animated-explainer",
                           budget_cap_usd=5.0, auto_approve=False)
    return cfg, db, runner, job_id


def step(db, runner):
    job = db.claim_next_queued()
    assert job is not None
    return runner.run_job(job)


def approve_pending(db, runner):
    [appr] = db.approvals("pending")
    runner.decide(appr["id"], "approved")
    return appr["gate"]


def cp(engine_dir, db, job_id, stage):
    pid = db.get_job(job_id)["project_id"]
    return json.loads((engine_dir / "projects" / pid / f"checkpoint_{stage}.json").read_text())


def test_429_mid_job_switches_to_openrouter_and_resumes_from_checkpoint(tmp_path, engine_dir, omni, openrouter):
    cfg, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, openrouter.url)
    # 1st call (research, first half) succeeds on Claude/OmniRoute; then Claude is rate-limited.
    omni.fail_next("ok", 1)
    omni.fail_always("429")

    assert step(db, runner) == Outcome.AWAITING
    research = cp(engine_dir, db, job_id, "research")
    assert research["status"] == "awaiting_human"
    # The first half was done on Claude and was NOT redone after the switch.
    assert research["metadata"] == {"first_half_by": "channelforge-primary",
                                    "second_half_by": "anthropic/claude-opus-5.5"}
    assert len(omni.requests) == 1 + 2        # 1 success + 2 rate-limited retries, then the switch
    assert len(openrouter.requests) == 1       # only the remaining half-stage
    events = [e["message"] for e in db.events(job_id)]
    assert any(m.startswith("MODEL SWITCH: omniroute:channelforge-primary failed (rate_limit") for m in events)

    assert approve_pending(db, runner) == "research"
    assert step(db, runner) == Outcome.AWAITING        # script stage, stays on OpenRouter
    assert approve_pending(db, runner) == "script"
    assert step(db, runner) == Outcome.DONE
    assert db.get_job(job_id)["status"] == "done"

    state = read_state(engine_dir / "projects" / db.get_job(job_id)["project_id"], ["research", "script"])
    assert state.done
    # Gates were honoured through the real lib/checkpoint.py
    assert cp(engine_dir, db, job_id, "script")["human_approved"] is True
    # Ledger: per-stage model + tokens + cost for both gateways
    calls = db.llm_calls(job_id)
    assert {c["gateway"] for c in calls} == {"omniroute", "openrouter"}
    assert any(c["failure"] == "rate_limit" for c in calls)
    assert all(c["cost_basis"] == "claude_code_estimate" for c in calls)
    assert db.job_cost(job_id) > 0
    assert not any("crashed" in e["message"] for e in db.events(job_id))
    assert sum(1 for c in calls if not c["ok"]) == 1      # the single rate-limited run


@pytest.mark.parametrize("mode", ["529", "usage_limit", "quota"])
def test_other_triggers_switch(tmp_path, engine_dir, omni, openrouter, mode):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, openrouter.url)
    omni.fail_always(mode)
    assert step(db, runner) == Outcome.AWAITING
    assert db.get_job(job_id)["agent_target"] == "openrouter:anthropic/claude-opus-5.5"


def test_timeout_switches(tmp_path, engine_dir, omni, openrouter):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, openrouter.url, idle=2.0)
    omni.timeout_sleep = 6
    omni.fail_next("timeout")
    assert step(db, runner) == Outcome.AWAITING
    assert any("failed (timeout" in e["message"] for e in db.events(job_id))


def test_omniroute_down_goes_direct(tmp_path, engine_dir, openrouter):
    _, db, runner, job_id = setup(tmp_path, engine_dir, dead_port_url(), openrouter.url, omniroute_up=False)
    assert step(db, runner) == Outcome.AWAITING
    assert any("OmniRoute is down" in e["message"] for e in db.events(job_id))


def test_crash_resumes_from_checkpoint_not_zero(tmp_path, engine_dir, omni, openrouter):
    """App crash mid-job: a new runner re-queues the job and resumes from its checkpoint."""
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, openrouter.url)
    assert step(db, runner) == Outcome.AWAITING
    approve_pending(db, runner)
    db.update_job(job_id, status="running")            # simulate dying while running
    pid = db.get_job(job_id)["project_id"]
    created = json.loads((engine_dir / "projects" / pid / "project.json").read_text())["created_at"]
    before = len(omni.requests)
    assert db.requeue_interrupted() == 1
    assert step(db, runner) == Outcome.AWAITING
    assert cp(engine_dir, db, job_id, "research")["status"] == "completed"
    assert json.loads((engine_dir / "projects" / pid / "project.json").read_text())["created_at"] == created
    assert len(omni.requests) - before == 2            # only the script stage ran


def test_publish_gate_can_never_be_auto_approved(tmp_path):
    db = JobDB(tmp_path / "j.db")
    a = db.create_approval(1, "publish", "ready")
    with pytest.raises(PermissionError):
        db.decide_approval(a, "approved", auto=True)


def test_auto_approve_creative_gates(tmp_path, engine_dir, omni, openrouter):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, openrouter.url)
    db.update_job(job_id, auto_approve=1)
    for _ in range(3):
        if db.get_job(job_id)["status"] != "queued":
            break
        step(db, runner)
    assert db.get_job(job_id)["status"] == "done"
    assert all(a["auto"] == 1 for a in db.approvals(status=None, job_id=job_id))


def test_no_secret_in_db_logs_or_files(tmp_path, engine_dir, omni, openrouter, caplog):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, openrouter.url)
    omni.fail_always("429")
    step(db, runner)
    db.log_event(job_id, f"accidentally logging a key {SECRET_OR} and Bearer {SECRET_OMNI}")
    files = [p for p in tmp_path.rglob("*") if p.is_file() and not p.is_symlink()]
    for p in files:
        blob = p.read_bytes()
        assert SECRET_OMNI.encode() not in blob, p
        assert SECRET_OR.encode() not in blob, p
    assert any("***" in e["message"] for e in db.events(job_id))
