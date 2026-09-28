"""M7: doctor output, frozen-app paths, and the PyInstaller spec's bundled data."""
import sys
from pathlib import Path

from channelforge import config, doctor
from channelforge.config import AppConfig

ROOT = Path(__file__).resolve().parents[1]


def test_doctor_reports_missing_keys_with_fixes(tmp_path, monkeypatch, capsys):
    monkeypatch.setenv("CHANNELFORGE_HOME", str(tmp_path))
    monkeypatch.setenv("CHANNELFORGE_ENGINES", str(tmp_path / "engines"))
    from channelforge import secrets
    secrets.delete_secret(secrets.OMNIROUTE_API_KEY)          # conftest pre-seeds it
    cfg = AppConfig()
    cfg.router.omniroute_url = "http://127.0.0.1:9"          # nothing listens there
    rc = doctor.run_doctor(cfg)
    out = capsys.readouterr().out
    assert rc == 1
    assert "channelforge secrets set omniroute_api_key" in out
    assert "git clone https://github.com/yefry08/OpenMontage.git" in out


def test_frozen_app_keeps_engines_under_app_home(tmp_path, monkeypatch):
    monkeypatch.delenv("CHANNELFORGE_ENGINES", raising=False)
    monkeypatch.setenv("CHANNELFORGE_HOME", str(tmp_path))
    monkeypatch.setattr(sys, "frozen", True, raising=False)
    assert config.default_engines_dir() == tmp_path / "engines"
    monkeypatch.setenv("CHANNELFORGE_ENGINES", str(tmp_path / "x"))
    assert config.default_engines_dir() == tmp_path / "x"


def test_spec_bundles_every_runtime_data_folder():
    spec = (ROOT / "packaging" / "channelforge.spec").read_text()
    for d in ("pipelines", "engine_support"):
        assert f'"/channelforge/{d}"' in spec and any((ROOT / "channelforge" / d).iterdir())
    assert 'collect_data_files("faster_whisper")' in spec and "console=True" in spec and "BUNDLE(" in spec
