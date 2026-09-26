"""Runs the REAL `claude` CLI against the mock gateway to pin the stream-json contract
the runner depends on (skipped when claude is not installed)."""

import shutil
import time

import pytest

from channelforge.agent.claude_runner import AgentTarget, run_claude
from channelforge.router.errors import Failure
from channelforge.secrets import OMNIROUTE_API_KEY

pytestmark = [pytest.mark.slow,
              pytest.mark.skipif(shutil.which("claude") is None, reason="claude CLI not installed")]


def target(url):
    return AgentTarget("omniroute:channelforge-primary", "omniroute", url, OMNIROUTE_API_KEY, "channelforge-primary")


def test_success_parses_session_cost_and_usage(omni, tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    events = []
    res = run_claude("say hi", cwd=tmp_path, target=target(omni.url), on_event=events.append)
    assert res.ok and res.result_text == "from-omniroute"
    assert res.session_id and res.model_usage["channelforge-primary"]["outputTokens"] == 7
    assert events[0]["type"] == "system" and events[0]["subtype"] == "init"
    # Claude Code authenticated to the gateway with the OmniRoute key via ANTHROPIC_AUTH_TOKEN
    assert omni.requests[0]["auth"].endswith("TESTSECRET-0123456789abcdef")


def test_429_is_cut_short_after_two_retries(omni, tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    omni.fail_always("429")
    t0 = time.monotonic()
    res = run_claude("say hi", cwd=tmp_path, target=target(omni.url), api_retries_before_switch=2)
    assert res.failure == Failure.RATE_LIMIT and res.should_fallback
    assert time.monotonic() - t0 < 30          # vs ~3 min if Claude Code exhausted its 10 retries


def test_usage_limit_message_is_a_trigger(omni, tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    omni.fail_always("usage_limit")
    res = run_claude("say hi", cwd=tmp_path, target=target(omni.url))
    assert res.got_result_event and res.api_error_status == 400
    assert res.failure == Failure.USAGE_LIMIT and res.should_fallback
