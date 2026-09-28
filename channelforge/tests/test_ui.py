"""Drive the real window: Generate → live model switch → approve gates → done."""
from pathlib import Path

import os

import pytest

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

from channelforge.config import AppConfig  # noqa: E402
from channelforge.db import JobDB  # noqa: E402
from channelforge.devtools import demo  # noqa: E402
from channelforge.jobs.runner import JobRunner  # noqa: E402
from channelforge.ui.main_window import MainWindow  # noqa: E402
from conftest import OPENMONTAGE  # noqa: E402


@pytest.fixture
def app_window(qtbot, tmp_path):
    if not OPENMONTAGE.exists():
        pytest.skip("engines/OpenMontage not cloned")
    db = JobDB(tmp_path / "jobs.db")
    cfg, sup, servers = demo.prepare(AppConfig(engines_dir=OPENMONTAGE.parent), db)
    from channelforge.jobs.channels import SMOKE_RECIPES
    runner = JobRunner(cfg, db, supervisor=sup, recipes=SMOKE_RECIPES)
    runner.start()
    win = MainWindow(cfg, db, runner, demo=True)
    qtbot.addWidget(win)
    yield win, db
    runner.stop()
    for s in servers:
        s.stop()


def test_generate_switch_approve_done(qtbot, app_window):
    win, db = app_window
    tab = win.tabs.widget(2)                         # geopolitics
    tab.paste.setPlainText("Qatar 2022 and sportswashing: what the data says")
    tab.generate.click()
    qtbot.waitUntil(lambda: bool(db.approvals("pending")), timeout=30000)
    win.refresh()
    [job] = db.list_jobs()
    assert job["agent_target"] == "omniroute:auto/coding"          # switched after the mock 429
    assert "Approvals (1)" in win.tabs.tabText(win._approvals_index)
    assert "research_brief" in win.approvals.detail.toPlainText()

    win.approvals.btn_approve.click()                # research
    qtbot.waitUntil(lambda: any(a["gate"] == "script" for a in db.approvals("pending")), timeout=30000)
    win.refresh()
    win.approvals.btn_approve.click()                # script
    qtbot.waitUntil(lambda: db.get_job(job["id"])["status"] == "done", timeout=30000)
    msgs = [e["message"] for e in db.events(job["id"])]
    assert any("MODEL SWITCH" in m for m in msgs)
    assert not any("crashed" in m for m in msgs), msgs
    win.refresh()
    assert win.jobs.table.item(0, 2).text().endswith("done")


def test_publish_gate_previews_and_publishes_on_click(qtbot, tmp_path):
    import json
    import subprocess
    from channelforge.config import AppConfig
    from channelforge.db import JobDB
    from channelforge.jobs.runner import JobRunner
    from channelforge.ui.main_window import MainWindow
    out = tmp_path / "out"
    (out / "shorts").mkdir(parents=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=24:d=3", "-c:v", "libx264",
                    "-preset", "ultrafast", str(out / "long.mp4")], check=True)
    for k in range(1, 6):
        (out / "shorts" / f"short_{k}.mp4").write_bytes((out / "long.mp4").read_bytes())
    meta = {"youtube": {"title": "Where the money went", "description": "D\n\nFuentes:\n• https://x", "tags": ["a"],
                        "chapters": [], "language": "es", "contains_synthetic_media": True},
            "shorts": [{"file": f"shorts/short_{k}.mp4", "start": 10, "end": 50, "hook": "h",
                        "tiktok": {"caption": "t"}, "ig_reels": {"caption": "i"},
                        "yt_shorts": {"title": "S #Shorts", "description": "d"}} for k in range(1, 6)]}
    (out / "metadata.json").write_text(json.dumps(meta))
    cfg = AppConfig(output_root=tmp_path / "jobs")
    db = JobDB(tmp_path / "jobs.db")
    runner = JobRunner(cfg, db, supervisor=object(), router=object())
    jid = db.create_job(channel="geopolitics", input_text="x", language="es", visual_style="clean-professional",
                        render_backend="animated-explainer", budget_cap_usd=5, auto_approve=True)
    db.update_job(jid, output_dir=str(out), status="awaiting_approval")
    db.create_approval(jid, "publish", "READY TO PUBLISH", {
        "long": str(out / "long.mp4"), "shorts": [str(out / "shorts" / f"short_{k}.mp4") for k in range(1, 6)],
        "metadata": str(out / "metadata.json"), "flagged_claims": {"claims_checked": 4, "critic_flags": [
            {"section_id": "s2", "problem": "number differs from source"}]}})
    win = MainWindow(cfg, db, runner)
    qtbot.addWidget(win)
    win.resize(1400, 900)
    win.tabs.setCurrentIndex(win._approvals_index)
    win.refresh()
    gate = win.approvals.publish_gate
    assert gate.isVisibleTo(win) and gate.pick.count() == 6
    text = gate.text.toPlainText()
    assert "Where the money went" in text and "number differs from source" in text
    assert "PRIVATE until the project passes" in text and "TikTok client is not audited" in text
    assert not db.publish_items(jid)                          # nothing is planned before the click
    win.grab().save(str(Path(__file__).parents[1] / "docs" / "m6" / "publish-gate.png")) if (Path(__file__).parents[1] / "docs" / "m6").exists() else None
    gate.btn_publish.click()
    assert db.get_job(jid)["status"] == "scheduled" and len(db.publish_items(jid)) == 16
