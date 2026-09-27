"""Acceptance: a simulated 429 on Claude switches (inside OmniRoute) to the auto router mid-job
and the job completes from its checkpoint — never from zero. Also: OmniRoute itself going
down is restarted or the job pauses and resumes from checkpoint later.

Uses fake_claude.py (same stream-json protocol as `claude -p`, verified against claude 2.1.x)
writing real OpenMontage checkpoints via the engine's own lib/checkpoint.py."""

import json

import pytest

from channelforge.agent.checkpoints import read_state
from channelforge.agent.claude_runner import AgentTarget
from channelforge.agent.supervisor import AgentSupervisor, Outcome
from channelforge.config import AppConfig, RouterConfig
from channelforge.db import JobDB
from channelforge.jobs.channels import SMOKE_RECIPES
from channelforge.jobs.runner import JobRunner
from channelforge.secrets import OMNIROUTE_API_KEY
from conftest import FAKE_CLAUDE, FIXTURE, PRIMARY, SECRET_OMNI, Restarter

AUTO = "auto/coding"


def setup(tmp_path, engine_dir, url, *, ensure_gateway=lambda: True, idle=30.0):
    cfg = AppConfig(engines_dir=engine_dir.parent, output_root=tmp_path / "out", claude_bin=str(FAKE_CLAUDE),
                    router=RouterConfig(omniroute_url=url, gateway_down_retry_s=0))
    db = JobDB(tmp_path / "jobs.db")
    targets = [AgentTarget(f"omniroute:{m}", "omniroute", url, OMNIROUTE_API_KEY, m) for m in (PRIMARY, AUTO)]
    sup = AgentSupervisor(db, targets, claude_bin=str(FAKE_CLAUDE), api_retries_before_switch=2,
                          idle_timeout_s=idle, ensure_gateway=ensure_gateway,
                          extra_env={"FAKE_ARTIFACTS": str(FIXTURE), "PYTHONPATH": ""})
    runner = JobRunner(cfg, db, supervisor=sup, recipes=SMOKE_RECIPES)
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


def test_429_on_claude_switches_mid_job_and_resumes_from_checkpoint(tmp_path, engine_dir, omni):
    cfg, db, runner, job_id = setup(tmp_path, engine_dir, omni.url)
    # 1st call (research, first half) succeeds on the Claude combo; then Claude is rate-limited.
    omni.fail_model(PRIMARY, ["ok"] + ["429"] * 1000)

    assert step(db, runner) == Outcome.AWAITING
    research = cp(engine_dir, db, job_id, "research")
    assert research["status"] == "awaiting_human"
    # The first half was done on Claude and was NOT redone after the switch.
    assert research["metadata"] == {"first_half_by": PRIMARY, "second_half_by": AUTO}
    assert omni.models_seen() == [PRIMARY, PRIMARY, PRIMARY, AUTO]   # ok, 429, 429 → switch, remaining half
    events = [e["message"] for e in db.events(job_id)]
    assert any(m.startswith(f"MODEL SWITCH: omniroute:{PRIMARY} failed (rate_limit") for m in events)

    assert approve_pending(db, runner) == "research"
    assert step(db, runner) == Outcome.AWAITING        # script stage stays on the auto router
    assert approve_pending(db, runner) == "script"
    assert step(db, runner) == Outcome.DONE
    assert db.get_job(job_id)["status"] == "done"
    assert set(omni.models_seen()[4:]) == {AUTO}

    state = read_state(engine_dir / "projects" / db.get_job(job_id)["project_id"], ["research", "script"])
    assert state.done
    assert cp(engine_dir, db, job_id, "script")["human_approved"] is True
    calls = db.llm_calls(job_id)
    assert {c["gateway"] for c in calls} == {"omniroute"}
    assert {c["target"] for c in calls} == {f"omniroute:{PRIMARY}", f"omniroute:{AUTO}"}
    assert [c["failure"] for c in calls if not c["ok"]] == ["rate_limit"]
    assert all(c["cost_basis"] == "claude_code_estimate" for c in calls)
    assert db.job_cost(job_id) > 0
    assert not any("crashed" in e["message"] for e in db.events(job_id))


@pytest.mark.parametrize("mode", ["529", "usage_limit", "quota", "503"])
def test_other_triggers_switch(tmp_path, engine_dir, omni, mode):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url)
    omni.fail_model(PRIMARY, [mode] * 1000)
    assert step(db, runner) == Outcome.AWAITING
    assert db.get_job(job_id)["agent_target"] == f"omniroute:{AUTO}"


def test_timeout_switches(tmp_path, engine_dir, omni):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url, idle=2.0)
    omni.timeout_sleep = 6
    omni.fail_model(PRIMARY, ["timeout"])
    assert step(db, runner) == Outcome.AWAITING
    assert any("failed (timeout" in e["message"] for e in db.events(job_id))


def test_omniroute_down_at_start_is_restarted(tmp_path, engine_dir):
    restart = Restarter()
    try:
        _, db, runner, job_id = setup(tmp_path, engine_dir, restart.url, ensure_gateway=restart)
        assert step(db, runner) == Outcome.AWAITING
        assert restart.starts == 1
        assert db.get_job(job_id)["agent_target"] == f"omniroute:{PRIMARY}"   # no model switch needed
    finally:
        restart.stop()


def test_omniroute_dies_mid_job_pauses_then_resumes_from_checkpoint(tmp_path, engine_dir):
    restart = Restarter()
    restart()                                    # gateway up at first
    gate = {"allow_restart": True}
    ensure = lambda: (restart() if gate["allow_restart"] else bool(restart.server))  # noqa: E731
    _, db, runner, job_id = setup(tmp_path, engine_dir, restart.url, ensure_gateway=ensure)
    try:
        assert step(db, runner) == Outcome.AWAITING          # research done
        approve_pending(db, runner)
        restart.stop()                                       # OmniRoute crashes…
        gate["allow_restart"] = False                        # …and cannot be restarted for now
        assert step(db, runner) == Outcome.PAUSED
        assert db.get_job(job_id)["status"] == "paused"
        assert cp(engine_dir, db, job_id, "research")["status"] == "awaiting_human"   # nothing lost

        gate["allow_restart"] = True                         # gateway comes back
        runner._resume_paused()
        assert db.get_job(job_id)["status"] == "queued"
        assert step(db, runner) == Outcome.AWAITING
        assert cp(engine_dir, db, job_id, "research")["status"] == "completed"
        assert cp(engine_dir, db, job_id, "script")["status"] == "awaiting_human"
        assert db.get_job(job_id)["agent_target"] == f"omniroute:{PRIMARY}"      # outage ≠ model switch
    finally:
        restart.stop()


def test_dead_gateway_is_cut_short_not_claudes_three_minutes(tmp_path, engine_dir):
    """Status-less api_retry events (what claude emits when OmniRoute is unreachable) abort after
    2 retries; with no restart possible the job pauses within seconds."""
    import time
    restart = Restarter(can_start=False)
    answers = iter([True, False])                 # pre-run check passes, gateway then found dead
    _, db, runner, job_id = setup(tmp_path, engine_dir, restart.url, ensure_gateway=lambda: next(answers))
    t0 = time.monotonic()
    assert step(db, runner) == Outcome.PAUSED
    assert time.monotonic() - t0 < 20
    assert [c["failure"] for c in db.llm_calls(job_id)] == ["gateway_down"]


def test_crash_resumes_from_checkpoint_not_zero(tmp_path, engine_dir, omni):
    """App crash mid-job: a new runner re-queues the job and resumes from its checkpoint."""
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url)
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


def test_auto_approve_creative_gates(tmp_path, engine_dir, omni):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url)
    db.update_job(job_id, auto_approve=1)
    for _ in range(3):
        if db.get_job(job_id)["status"] != "queued":
            break
        step(db, runner)
    assert db.get_job(job_id)["status"] == "done"
    assert all(a["auto"] == 1 for a in db.approvals(status=None, job_id=job_id))


def test_no_secret_in_db_logs_or_files(tmp_path, engine_dir, omni):
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url)
    omni.fail_model(PRIMARY, ["429"] * 100)
    step(db, runner)
    db.log_event(job_id, f"accidentally logging Bearer {SECRET_OMNI}")
    for p in [p for p in tmp_path.rglob("*") if p.is_file() and not p.is_symlink()]:
        assert SECRET_OMNI.encode() not in p.read_bytes(), p
    assert any("***" in e["message"] for e in db.events(job_id))


def test_engine_provider_keys_go_from_keyring_to_agent_env_only(tmp_path, engine_dir, omni, monkeypatch):
    """OpenMontage tool keys are injected into the agent process from the keyring, never written to disk."""
    from channelforge import secrets
    key = "AIzaTESTKEY-0123456789abcdefghij"
    secrets.set_secret(secrets.ENGINE_ENV_PREFIX + "GOOGLE_TTS_API_KEY", key)
    seen = {}
    import channelforge.agent.supervisor as sv
    real = sv.run_claude

    def spy(*a, **kw):
        seen.update(kw["extra_env"])
        return real(*a, **kw)
    monkeypatch.setattr(sv, "run_claude", spy)
    _, db, runner, job_id = setup(tmp_path, engine_dir, omni.url)
    runner.supervisor.env_provider = lambda: secrets.engine_env(["GOOGLE_TTS_API_KEY", "OPENAI_API_KEY"])
    step(db, runner)
    assert seen["GOOGLE_TTS_API_KEY"] == key and "OPENAI_API_KEY" not in seen
    for p in [p for p in tmp_path.rglob("*") if p.is_file() and not p.is_symlink()]:
        assert key.encode() not in p.read_bytes(), p
