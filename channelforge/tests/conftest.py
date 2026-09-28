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
FIXTURE = Path(__file__).parents[1] / "channelforge" / "devtools" / "smoke_artifacts.json"

SECRET_OMNI = "sk-omni-TESTSECRET-0123456789abcdef"
PRIMARY = "channelforge-primary"


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
    yield kr


@pytest.fixture
def omni():
    s = MockLLMServer("omniroute", reply="from-omniroute").start()
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


def free_port() -> int:
    import socket
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


class Restarter:
    """Stands in for omniroute.ensure_up: 'starts' a mock gateway on a fixed port on demand."""

    def __init__(self, can_start: bool = True):
        self.port = free_port()
        self.url = f"http://127.0.0.1:{self.port}"
        self.can_start = can_start
        self.server: MockLLMServer | None = None
        self.starts = 0

    def __call__(self, *_a) -> bool:
        if self.server:
            return True
        if not self.can_start:
            return False
        self.starts += 1
        self.server = MockLLMServer("omniroute", reply="from-restarted", port=self.port).start()
        return True

    def stop(self):
        if self.server:
            self.server.stop()
            self.server = None


# ---- M5 helpers: a stand-in transcriber and a prompt-aware mock reply ----------------------------
def fake_words(media, language=None):
    """Evenly timed words over the whole video, a sentence every 12 words (Whisper needs a model download)."""
    import subprocess
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                              str(media)], capture_output=True, text=True).stdout)
    n = int(d * 2.4)
    return [{"start": k * d / n, "end": (k + .8) * d / n, "word": f"w{k}" + ("." if k % 12 == 11 else "")}
            for k in range(n)]


def smart_reply(body):
    import json as _j
    sysmsg = next((m["content"] for m in body.get("messages", []) if m["role"] == "system"), "")
    if "fact-checker" in sysmsg:
        return '{"flags": []}'
    if "cut vertical shorts" in sysmsg:
        return _j.dumps({"segments": [{"first": 2 + 20 * k, "last": 9 + 20 * k, "hook": f"Hook {k + 1}"} for k in range(5)]})
    if "publishing metadata" in sysmsg:
        return _j.dumps({"title": "Where the money went", "summary": "A data story.",
                         "chapter_titles": [f"Part {k}" for k in range(80)], "tags": ["procurement", "data", "#open"],
                         "thumbnail_text": "Follow the money", "thumbnail_chapter": 1,
                         "shorts": [{"tiktok": "Watch #data #money", "yt_shorts_title": f"Short {k}",
                                     "ig": "Look " + " ".join(f"#t{i}" for i in range(40))} for k in range(5)]})
    return "ok"
