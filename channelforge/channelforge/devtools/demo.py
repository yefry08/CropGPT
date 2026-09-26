"""`channelforge --demo`: the full app wired to a local mock OmniRoute and a fake agent.

Nothing leaves the machine and nothing is spent. The mock gateway answers the
Claude combo once and then returns HTTP 429 for it, while `auto/coding` keeps
working — so every demo job shows a live switch from Claude to OmniRoute's
auto-router and a resume from checkpoint.
"""

from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

from ..agent.claude_runner import AgentTarget
from ..agent.supervisor import AgentSupervisor
from ..config import AppConfig, RouterConfig
from ..secrets import OMNIROUTE_API_KEY
from .mock_llm_server import MockLLMServer

HERE = Path(__file__).parent


def prepare(cfg: AppConfig, db) -> tuple[AppConfig, AgentSupervisor, list[MockLLMServer]]:
    omni = MockLLMServer("omniroute", reply="demo reply").start()
    omni.fail_model("channelforge-primary", ["ok"] + ["429"] * 10_000)

    os.environ["CHANNELFORGE_SECRET_" + OMNIROUTE_API_KEY.upper()] = "sk-demo-omniroute-not-a-real-key"

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

    router = RouterConfig(omniroute_url=omni.url, omniroute_autostart=False)
    demo_cfg = cfg.model_copy(update={"engines_dir": root, "output_root": root / "jobs", "router": router})
    targets = [AgentTarget(f"omniroute:{m}", "omniroute", omni.url, OMNIROUTE_API_KEY, m)
               for m in router.agent_models]
    sup = AgentSupervisor(db, targets, claude_bin=str(HERE / "fake_claude.py"), api_retries_before_switch=2,
                          extra_env={"FAKE_ARTIFACTS": str(HERE / "smoke_artifacts.json")})
    return demo_cfg, sup, [omni]
