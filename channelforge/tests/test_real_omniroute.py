"""Against a REAL local OmniRoute (skipped when none is running on :20128).

In this sandbox the ChannelForge combo exists but no upstream provider is
reachable, so OmniRoute answers the combo with 503 ALL_TARGETS_SKIPPED and
auto/* with 502 — both must be treated as fallback triggers, walking the
routing list without ever leaving OmniRoute.
"""

import shutil
import subprocess

import pytest

from channelforge.agent.claude_runner import AgentTarget, run_claude
from channelforge.config import RouterConfig
from channelforge.router import omniroute
from channelforge.router.errors import AllTargetsFailed, Failure, LLMError
from channelforge.router.llm import LLMRouter
from channelforge.secrets import OMNIROUTE_API_KEY

LOCAL = RouterConfig(omniroute_url="http://localhost:20128")
pytestmark = [pytest.mark.slow,
              pytest.mark.skipif(not omniroute.is_up(LOCAL), reason="no local OmniRoute running")]


def test_router_walks_the_whole_list_inside_omniroute():
    with pytest.raises(AllTargetsFailed) as e:
        LLMRouter(LOCAL).complete([{"role": "user", "content": "hi"}])
    assert [(t, f) for t, f, _ in e.value.attempts] == [
        ("omniroute:channelforge-primary", Failure.UNAVAILABLE), ("omniroute:auto/coding", Failure.UNAVAILABLE)]


def test_unknown_model_is_fatal_not_silently_rerouted():
    cfg = LOCAL.model_copy(update={"general_models": ["channelforge-typo-xyz", "auto/coding"]})
    with pytest.raises(LLMError) as e:
        LLMRouter(cfg).complete([{"role": "user", "content": "hi"}])
    assert e.value.failure == Failure.FATAL


@pytest.mark.skipif(shutil.which("claude") is None, reason="claude CLI not installed")
def test_real_claude_through_real_omniroute_triggers_fallback(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    t = AgentTarget("omniroute:x", "omniroute", LOCAL.omniroute_url, OMNIROUTE_API_KEY, "channelforge-primary")
    res = run_claude("say hi", cwd=tmp_path, target=t)
    assert res.should_fallback, (res.failure, res.result_text)


@pytest.mark.skipif(shutil.which("omniroute") is None, reason="omniroute CLI not installed")
def test_autostart_brings_a_stopped_omniroute_back():
    subprocess.run(["omniroute", "stop"], capture_output=True, timeout=60)
    assert not omniroute.is_up(LOCAL)
    assert omniroute.ensure_up(LOCAL.model_copy(update={"omniroute_start_timeout_s": 120}))
    assert omniroute.is_up(LOCAL)
