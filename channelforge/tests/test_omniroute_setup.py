"""`channelforge omniroute setup` builds the Claude combo from providers you actually connected.

/v1/models lists OmniRoute's whole catalog (317 models on a fresh install, verified), so
"connected" comes from GET /api/providers, mapped to model prefixes via the provider catalog.
"""

import pytest

from channelforge import secrets
from channelforge.config import RouterConfig
from channelforge.router import omniroute

PRIMARY = "channelforge-primary"
ALIASES = {"claude": "cc", "anthropic": "anthropic", "kiro": "kr", "opencode": "oc",
           "devin-cli-agentic": "dva"}
CATALOG = ["cc/claude-opus-5-5", "anthropic/claude-opus-5-5", "kr/claude-sonnet-4-5", "kr/claude-opus-4-6",
           "dva/claude-opus-5-high", "no-think/dva/claude-opus-5-max", "oc/big-pickle", PRIMARY]


def aliases(_cfg):
    return ALIASES


@pytest.fixture
def cfg(omni):
    secrets.set_secret(secrets.OMNIROUTE_MANAGEMENT_TOKEN, "oma_live_TESTTOKEN0123456789")
    omni.catalog = CATALOG
    return RouterConfig(omniroute_url=omni.url)


def connect(omni, *providers):
    omni.connections = [{"id": f"c{i}", "provider": p, "isActive": True} for i, p in enumerate(providers)]


def combo(omni):
    return [s["model"] for s in omni.combos[PRIMARY]["models"]]


def test_nothing_connected_ignores_the_catalog_and_routes_to_auto(omni, cfg):
    report = omniroute.setup_combos(cfg, aliases)
    assert "no Claude model is connected" in report[0]
    assert cfg.agent_models == ["auto/coding"] and cfg.metadata_models == ["auto/cheap"]
    assert not omni.combos


def test_free_kiro_only(omni, cfg):
    connect(omni, "kiro", "opencode")
    report = omniroute.setup_combos(cfg, aliases)
    assert combo(omni) == ["kr/claude-opus-4-6", "kr/claude-sonnet-4-5"]      # never dva/… or no-think/…
    assert "skipped 'cc/claude-opus-5-5'" in report[0]
    assert cfg.agent_models == [PRIMARY, "auto/coding"]


def test_subscription_and_api_key_come_first(omni, cfg):
    connect(omni, "anthropic", "kiro", "claude")
    omniroute.setup_combos(cfg, aliases)
    assert combo(omni)[:2] == ["cc/claude-opus-5-5", "anthropic/claude-opus-5-5"]


def test_inactive_connection_is_ignored(omni, cfg):
    omni.connections = [{"provider": "claude", "isActive": False}]
    assert "no Claude model is connected" in omniroute.setup_combos(cfg, aliases)[0]


def test_connecting_claude_later_restores_the_combo(omni, cfg):
    omniroute.setup_combos(cfg, aliases)
    assert PRIMARY not in cfg.general_models
    connect(omni, "claude")
    omniroute.setup_combos(cfg, aliases)
    d = RouterConfig()
    assert (cfg.agent_models, cfg.general_models, cfg.critic_models, cfg.metadata_models) == (
        d.agent_models, d.general_models, d.critic_models, d.metadata_models)
    assert combo(omni) == ["cc/claude-opus-5-5"]


def test_setup_is_idempotent(omni, cfg):
    connect(omni, "claude")
    assert omniroute.setup_combos(cfg, aliases)[-1].startswith("created combo")
    assert omniroute.setup_combos(cfg, aliases)[-1].startswith("updated combo")


def test_verify(omni, cfg):
    connect(omni, "kiro")
    lines = omniroute.verify(cfg, aliases)
    assert "inference key OK" in lines[0]
    assert "kiro" in lines[1] and "kr" in lines[1]
    assert "kr/claude-opus-4-6" in lines[2]
