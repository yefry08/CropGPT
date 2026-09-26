"""Against a REAL local OmniRoute (skipped when none is running on :20128).

With the ChannelForge combo present but no upstream providers connected,
OmniRoute answers 503 ALL_TARGETS_SKIPPED — both the Python router and the
real claude CLI must treat that as a fallback trigger and move to OpenRouter.
"""

import shutil

import pytest

from channelforge.agent.claude_runner import AgentTarget, run_claude
from channelforge.config import RouterConfig
from channelforge.router import omniroute
from channelforge.router.errors import Failure
from channelforge.router.llm import LLMRouter
from channelforge.secrets import OMNIROUTE_API_KEY

LOCAL = RouterConfig(omniroute_url="http://localhost:20128")
pytestmark = [pytest.mark.slow,
              pytest.mark.skipif(not omniroute.is_up(LOCAL), reason="no local OmniRoute running")]


def test_router_falls_back_when_combo_cannot_serve(openrouter, tmp_path):
    cfg = LOCAL.model_copy(update={"openrouter_url": openrouter.url})
    res = LLMRouter(cfg).complete([{"role": "user", "content": "hi"}])
    assert res.target.gateway == "openrouter"
    assert res.fallbacks[0][0] == "omniroute:channelforge-primary"


def test_unknown_model_is_fatal_not_silently_rerouted(openrouter):
    """A typo'd combo name is a config error: surface it instead of quietly spending on OpenRouter."""
    cfg = LOCAL.model_copy(update={"openrouter_url": openrouter.url, "primary_combo": "channelforge-typo-xyz"})
    with pytest.raises(Exception) as e:
        LLMRouter(cfg).complete([{"role": "user", "content": "hi"}])
    assert getattr(e.value, "failure", None) == Failure.FATAL
    assert not openrouter.requests


@pytest.mark.skipif(shutil.which("claude") is None, reason="claude CLI not installed")
def test_real_claude_through_real_omniroute_triggers_fallback(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    t = AgentTarget("omniroute:x", "omniroute", LOCAL.omniroute_url, OMNIROUTE_API_KEY, "channelforge-primary")
    res = run_claude("say hi", cwd=tmp_path, target=t)
    assert res.should_fallback, (res.failure, res.result_text)
