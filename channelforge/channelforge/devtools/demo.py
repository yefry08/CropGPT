"""`channelforge --demo`: the full app wired to local mock gateways and a fake agent.

Nothing leaves the machine and nothing is spent. The mock "Claude" gateway
answers once and then returns HTTP 429 forever, so every demo job shows a live
model switch to the (mock) OpenRouter target and a resume from checkpoint.
"""

from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from ..agent.claude_runner import AgentTarget
from ..agent.supervisor import AgentSupervisor
from ..config import AppConfig, RouterConfig
from ..secrets import OMNIROUTE_API_KEY, OPENROUTER_API_KEY
from .mock_llm_server import MockLLMServer

HERE = Path(__file__).parent


def prepare(cfg: AppConfig, db) -> tuple[AppConfig, AgentSupervisor, list[MockLLMServer]]:
    omni = MockLLMServer("omniroute", reply="demo reply (claude via omniroute)").start()
    omni.fail_next("ok", 1)
    omni.fail_always("429")
    orouter = MockLLMServer("openrouter", reply="demo reply (openrouter)").start()

    os.environ["CHANNELFORGE_SECRET_" + OMNIROUTE_API_KEY.upper()] = "sk-demo-omniroute-not-a-real-key"
    os.environ["CHANNELFORGE_SECRET_" + OPENROUTER_API_KEY.upper()] = "sk-or-demo-not-a-real-key"

    # Isolated engine dir: real OpenMontage code, private projects/ folder.
    src = cfg.openmontage_dir
    root = Path(tempfile.mkdtemp(prefix="channelforge-demo-"))
    eng = root / "OpenMontage"
    eng.mkdir()
    for name in ("lib", "schemas", "pipeline_defs", "styles", "tools", "skills", "backlot"):
        try:
            (eng / name).symlink_to(src / name, target_is_directory=True)
        except OSError:              # Windows without symlink privilege
            shutil.copytree(src / name, eng / name)
    (eng / "projects").mkdir()

    demo_cfg = cfg.model_copy(update={
        "engines_dir": root, "output_root": root / "jobs",
        "router": RouterConfig(omniroute_url=omni.url, openrouter_url=orouter.url)})
    targets = [
        AgentTarget("omniroute:channelforge-primary", "omniroute", omni.url, OMNIROUTE_API_KEY, "channelforge-primary"),
        AgentTarget("openrouter:anthropic/claude-opus-5.5", "openrouter", orouter.url, OPENROUTER_API_KEY,
                    "anthropic/claude-opus-5.5"),
    ]
    sup = AgentSupervisor(db, targets, claude_bin=str(HERE / "fake_claude.py"), api_retries_before_switch=2,
                          extra_env={"FAKE_ARTIFACTS": str(HERE / "smoke_artifacts.json")})
    return demo_cfg, sup, [omni, orouter]
