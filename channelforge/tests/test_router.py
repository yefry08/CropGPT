"""Forced-failure tests for the Python-side router (metadata / captions / critic calls)."""

import pytest

from channelforge.config import RouterConfig
from channelforge.db import JobDB
from channelforge.router.errors import AllTargetsFailed, Failure, LLMError, classify
from channelforge.router.llm import LLMRouter
from conftest import dead_port_url

MSG = [{"role": "user", "content": "hi"}]


def make(omni_url, or_url, tmp_path, **kw):
    cfg = RouterConfig(omniroute_url=omni_url, openrouter_url=or_url,
                       openrouter_models=["anthropic/claude-opus-5.5", "google/gemini-3-pro"],
                       openrouter_cheap_models=["anthropic/claude-haiku-4.5"], **kw)
    db = JobDB(tmp_path / "jobs.db")
    return LLMRouter(cfg, db), db


def test_happy_path_uses_omniroute_and_logs_cost(omni, openrouter, tmp_path):
    r, db = make(omni.url, openrouter.url, tmp_path)
    res = r.complete(MSG, job_id=1, stage="metadata")
    assert res.text == "from-omniroute"
    assert res.target.gateway == "omniroute" and res.target.model == "channelforge-primary"
    assert res.served_model == "omniroute/channelforge-primary"
    assert res.cost_usd == pytest.approx(0.0012) and res.tokens_in == 11 and res.tokens_out == 7
    [row] = db.llm_calls(1)
    assert row["ok"] == 1 and row["cost_basis"] == "gateway" and row["model"] == "omniroute/channelforge-primary"
    assert omni.requests[0]["auth"].endswith("TESTSECRET-0123456789abcdef")
    assert not openrouter.requests


@pytest.mark.parametrize("mode,failure", [
    ("429", Failure.RATE_LIMIT), ("529", Failure.OVERLOADED), ("usage_limit", Failure.USAGE_LIMIT),
    ("quota", Failure.QUOTA)])
def test_trigger_falls_back_to_openrouter(omni, openrouter, tmp_path, mode, failure):
    omni.fail_next(mode)
    r, db = make(omni.url, openrouter.url, tmp_path)
    res = r.complete(MSG, job_id=7)
    assert res.text == "from-openrouter"
    assert res.target.gateway == "openrouter" and res.target.model == "anthropic/claude-opus-5.5"
    assert res.fallbacks == [("omniroute:channelforge-primary", failure.value)]
    rows = db.llm_calls(7)
    assert [(x["gateway"], x["ok"], x["failure"]) for x in rows] == [
        ("omniroute", 0, failure.value), ("openrouter", 1, None)]
    assert openrouter.requests[0]["auth"].endswith("TESTSECRET-fedcba9876543210")


def test_timeout_falls_back(omni, openrouter, tmp_path):
    omni.timeout_sleep = 3
    omni.fail_next("timeout")
    r, _ = make(omni.url, openrouter.url, tmp_path, request_timeout_s=1.0)
    res = r.complete(MSG)
    assert res.target.gateway == "openrouter"
    assert res.fallbacks[0][1] == "timeout"


def test_omniroute_down_goes_direct_to_openrouter(openrouter, tmp_path):
    r, _ = make(dead_port_url(), openrouter.url, tmp_path)
    res = r.complete(MSG, kind="metadata")
    assert res.target.name == "openrouter:anthropic/claude-haiku-4.5"
    assert res.fallbacks == [("omniroute:channelforge-cheap", "unavailable")]


def test_walks_the_whole_openrouter_list(omni, openrouter, tmp_path):
    omni.fail_next("429")
    openrouter.fail_next("529")
    r, _ = make(omni.url, openrouter.url, tmp_path)
    res = r.complete(MSG)
    assert res.target.model == "google/gemini-3-pro"
    assert [f for _, f in res.fallbacks] == ["rate_limit", "overloaded"]


def test_fatal_error_does_not_fall_back(omni, openrouter, tmp_path):
    omni.fail_next("400")
    r, _ = make(omni.url, openrouter.url, tmp_path)
    with pytest.raises(LLMError) as e:
        r.complete(MSG)
    assert e.value.failure == Failure.FATAL
    assert not openrouter.requests


def test_all_targets_failed(omni, openrouter, tmp_path):
    omni.fail_always("429")
    openrouter.fail_always("429")
    r, _ = make(omni.url, openrouter.url, tmp_path)
    with pytest.raises(AllTargetsFailed) as e:
        r.complete(MSG)
    assert len(e.value.attempts) == 3


def test_metadata_kind_uses_cheap_chain(omni, openrouter, tmp_path):
    r, _ = make(omni.url, openrouter.url, tmp_path)
    assert r.complete(MSG, kind="metadata").target.model == "channelforge-cheap"


@pytest.mark.parametrize("status,msg,expected", [
    (429, "Rate limited", Failure.RATE_LIMIT),
    (529, "", Failure.OVERLOADED),
    (400, "Claude AI usage limit reached|1760000000", Failure.USAGE_LIMIT),
    (None, "You've hit your session limit · resets 3pm", Failure.USAGE_LIMIT),
    (402, "", Failure.QUOTA),
    (403, "You exceeded your current quota, please check your plan", Failure.QUOTA),
    (504, "", Failure.TIMEOUT),
    (503, "", Failure.UNAVAILABLE),
    (400, "messages: field required", Failure.FATAL),
    (401, "invalid x-api-key", Failure.FATAL),
])
def test_classify(status, msg, expected):
    assert classify(status, msg) == expected
