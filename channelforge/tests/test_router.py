"""Forced-failure tests for the Python-side router (metadata / captions / critic calls).
Everything goes through OmniRoute: the Claude combo first, then OmniRoute's auto/* router."""

import pytest

from channelforge.config import RouterConfig
from channelforge.db import JobDB
from channelforge.router.errors import AllTargetsFailed, Failure, GatewayDown, LLMError, classify
from channelforge.router.llm import LLMRouter
from conftest import PRIMARY, Restarter

MSG = [{"role": "user", "content": "hi"}]


def make(url, tmp_path, ensure_up=lambda cfg: False, **kw):
    cfg = RouterConfig(omniroute_url=url, **kw)
    db = JobDB(tmp_path / "jobs.db")
    return LLMRouter(cfg, db, ensure_up=ensure_up), db


def test_happy_path_uses_claude_combo_and_logs_cost(omni, tmp_path):
    r, db = make(omni.url, tmp_path)
    res = r.complete(MSG, job_id=1, stage="metadata")
    assert res.text == "from-omniroute"
    assert res.target.model == PRIMARY and res.served_model == f"served-by/{PRIMARY}"
    assert res.cost_usd == pytest.approx(0.0012) and res.tokens_in == 11 and res.tokens_out == 7
    [row] = db.llm_calls(1)
    assert row["ok"] == 1 and row["cost_basis"] == "gateway" and row["gateway"] == "omniroute"
    assert omni.requests[0]["auth"].endswith("TESTSECRET-0123456789abcdef")


@pytest.mark.parametrize("mode,failure", [
    ("429", Failure.RATE_LIMIT), ("529", Failure.OVERLOADED), ("usage_limit", Failure.USAGE_LIMIT),
    ("quota", Failure.QUOTA), ("503", Failure.UNAVAILABLE)])
def test_claude_failure_falls_back_to_auto_router(omni, tmp_path, mode, failure):
    omni.fail_model(PRIMARY, [mode])
    r, db = make(omni.url, tmp_path)
    res = r.complete(MSG, job_id=7)
    assert res.target.model == "auto/coding"
    assert res.fallbacks == [(f"omniroute:{PRIMARY}", failure.value)]
    assert omni.models_seen() == [PRIMARY, "auto/coding"]      # never left OmniRoute
    assert [(x["target"], x["ok"], x["failure"]) for x in db.llm_calls(7)] == [
        (f"omniroute:{PRIMARY}", 0, failure.value), ("omniroute:auto/coding", 1, None)]


def test_timeout_falls_back(omni, tmp_path):
    omni.timeout_sleep = 3
    omni.fail_model(PRIMARY, ["timeout"])
    r, _ = make(omni.url, tmp_path, request_timeout_s=1.0)
    res = r.complete(MSG)
    assert res.target.model == "auto/coding" and res.fallbacks[0][1] == "timeout"


def test_metadata_uses_cheap_auto_router_first(omni, tmp_path):
    r, _ = make(omni.url, tmp_path)
    assert r.complete(MSG, kind="metadata").target.model == "auto/cheap"


def test_critic_uses_a_different_route_than_the_writer(omni, tmp_path):
    r, _ = make(omni.url, tmp_path)
    assert r.complete(MSG, kind="critic").target.model == "auto/reasoning"


def test_fatal_error_does_not_fall_back(omni, tmp_path):
    omni.fail_model(PRIMARY, ["400"])
    r, _ = make(omni.url, tmp_path)
    with pytest.raises(LLMError) as e:
        r.complete(MSG)
    assert e.value.failure == Failure.FATAL
    assert omni.models_seen() == [PRIMARY]


def test_all_targets_failed(omni, tmp_path):
    omni.fail_always("429")
    r, _ = make(omni.url, tmp_path)
    with pytest.raises(AllTargetsFailed) as e:
        r.complete(MSG)
    assert [a[0] for a in e.value.attempts] == [f"omniroute:{PRIMARY}", "omniroute:auto/coding"]


def test_gateway_down_is_restarted_then_call_succeeds(tmp_path):
    restart = Restarter()
    try:
        r, db = make(restart.url, tmp_path, ensure_up=restart)
        res = r.complete(MSG, job_id=3)
        assert res.text == "from-restarted" and restart.starts == 1
        assert [x["failure"] for x in db.llm_calls(3)] == ["gateway_down", None]
    finally:
        restart.stop()


def test_gateway_down_and_not_restartable_raises(tmp_path):
    restart = Restarter(can_start=False)
    r, _ = make(restart.url, tmp_path, ensure_up=restart)
    with pytest.raises(GatewayDown):
        r.complete(MSG)


@pytest.mark.parametrize("status,msg,expected", [
    (429, "Rate limited", Failure.RATE_LIMIT),
    (529, "", Failure.OVERLOADED),
    (400, "Claude AI usage limit reached|1760000000", Failure.USAGE_LIMIT),
    (None, "You've hit your session limit · resets 3pm", Failure.USAGE_LIMIT),
    (402, "", Failure.QUOTA),
    (403, "You exceeded your current quota, please check your plan", Failure.QUOTA),
    (504, "", Failure.TIMEOUT),
    (503, "all targets were skipped by pre-dispatch filters", Failure.UNAVAILABLE),
    (503, "remaining targets were all quota-exhausted/unavailable", Failure.UNAVAILABLE),
    (None, "API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)",
     Failure.GATEWAY_DOWN),
    (400, "messages: field required", Failure.FATAL),
    (401, "invalid x-api-key", Failure.FATAL),
])
def test_classify(status, msg, expected):
    assert classify(status, msg) == expected
