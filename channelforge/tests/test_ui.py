"""Drive the real window: Generate → live model switch → approve gates → done."""

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
    runner = JobRunner(cfg, db, supervisor=sup)
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
    assert job["agent_target"].startswith("openrouter:")          # switched after the mock 429
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
