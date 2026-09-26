import os
import sys
from pathlib import Path

import keyring
import pytest
from keyring.backend import KeyringBackend

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parents[1]))

from channelforge.devtools.mock_llm_server import MockLLMServer  # noqa: E402

OPENMONTAGE = Path(os.environ.get("CHANNELFORGE_ENGINES", Path(__file__).resolve().parents[2] / "engines")) / "OpenMontage"
FAKE_CLAUDE = Path(__file__).parents[1] / "channelforge" / "devtools" / "fake_claude.py"

SECRET_OMNI = "sk-omni-TESTSECRET-0123456789abcdef"
SECRET_OR = "sk-or-v1-TESTSECRET-fedcba9876543210"


class MemoryKeyring(KeyringBackend):
    priority = 1

    def __init__(self):
        super().__init__()
        self.store = {}

    def get_password(self, service, username):
        return self.store.get((service, username))

    def set_password(self, service, username, password):
        self.store[(service, username)] = password

    def delete_password(self, service, username):
        self.store.pop((service, username), None)


@pytest.fixture(autouse=True)
def mem_keyring(monkeypatch, tmp_path):
    kr = MemoryKeyring()
    keyring.set_keyring(kr)
    monkeypatch.setenv("CHANNELFORGE_HOME", str(tmp_path / "home"))
    from channelforge import secrets
    secrets.set_secret(secrets.OMNIROUTE_API_KEY, SECRET_OMNI)
    secrets.set_secret(secrets.OPENROUTER_API_KEY, SECRET_OR)
    yield kr


@pytest.fixture
def omni():
    s = MockLLMServer("omniroute", reply="from-omniroute").start()
    yield s
    s.stop()


@pytest.fixture
def openrouter():
    s = MockLLMServer("openrouter", reply="from-openrouter").start()
    yield s
    s.stop()


@pytest.fixture
def engine_dir(tmp_path):
    """Isolated OpenMontage working dir: real code/schemas via symlinks, private projects/."""
    if not OPENMONTAGE.exists():
        pytest.skip("engines/OpenMontage not cloned")
    d = tmp_path / "OpenMontage"
    d.mkdir()
    for name in ("lib", "schemas", "pipeline_defs", "styles", "tools", "skills"):
        (d / name).symlink_to(OPENMONTAGE / name)
    (d / "projects").mkdir()
    return d


def dead_port_url() -> str:
    import socket
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return f"http://127.0.0.1:{port}"
