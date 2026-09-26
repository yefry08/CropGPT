"""Main window: channel tabs, approvals, routing ledger, and the job queue."""

from __future__ import annotations

from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QAction
from PySide6.QtWidgets import QMainWindow, QMessageBox, QSplitter, QTabWidget

from ..config import AppConfig
from ..db import JobDB
from ..jobs.runner import JobRunner
from .approvals_panel import ApprovalsPanel
from .channel_tab import ChannelTab
from .jobs_panel import JobsPanel
from .router_panel import RouterPanel
from .settings_dialog import SettingsDialog


class MainWindow(QMainWindow):
    def __init__(self, cfg: AppConfig, db: JobDB, runner: JobRunner, *, demo: bool = False):
        super().__init__()
        self.cfg, self.db, self.runner = cfg, db, runner
        self.setWindowTitle("ChannelForge" + (" — DEMO (mock gateways, nothing is spent)" if demo else ""))
        self.resize(1280, 860)

        self.tabs = QTabWidget()
        for ch in cfg.channels.values():
            tab = ChannelTab(cfg, ch)
            tab.generate_requested.connect(self._enqueue)
            self.tabs.addTab(tab, ch.display_name.replace("&", "&&"))
        self.approvals = ApprovalsPanel(db)
        self.approvals.decided.connect(self._decide)
        self.approvals.pending_count_changed.connect(self._badge)
        self._approvals_index = self.tabs.addTab(self.approvals, "Approvals")
        self.router = RouterPanel(cfg, db)
        self.tabs.addTab(self.router, "Model routing")

        self.jobs = JobsPanel(cfg, db)
        self.jobs.retry_requested.connect(self.runner.retry)
        self.jobs.cancel_requested.connect(self.runner.cancel)

        split = QSplitter(Qt.Vertical)
        split.addWidget(self.tabs)
        split.addWidget(self.jobs)
        split.setSizes([480, 380])
        self.setCentralWidget(split)

        settings = QAction("Settings…", self)
        settings.triggered.connect(lambda: SettingsDialog(cfg, self).exec())
        self.menuBar().addMenu("&File").addAction(settings)

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.refresh)
        self.timer.start(1000)
        self.probe_timer = QTimer(self)
        self.probe_timer.timeout.connect(self.router.probe)
        self.probe_timer.start(15000)
        self.router.probe()
        self.refresh()

    def refresh(self) -> None:
        self.jobs.refresh()
        self.approvals.refresh()
        self.router.refresh()

    def _badge(self, n: int) -> None:
        self.tabs.setTabText(self._approvals_index, f"Approvals ({n})" if n else "Approvals")

    def _enqueue(self, channel: str, fields: dict) -> None:
        job_id = self.db.create_job(channel=channel, **fields)
        self.db.log_event(job_id, f"queued ({fields['language']}, style {fields['visual_style']}, "
                                  f"backend {fields['render_backend']}, cap ${fields['budget_cap_usd']:.2f})")
        self.runner.poke()
        self.statusBar().showMessage(f"Job #{job_id} queued", 5000)
        self.refresh()

    def _decide(self, approval_id: int, verdict: str, note: str) -> None:
        try:
            self.runner.decide(approval_id, verdict, note or None)
        except Exception as e:
            QMessageBox.warning(self, "Approval", str(e))
        self.refresh()

    def closeEvent(self, ev) -> None:
        self.runner.stop()
        super().closeEvent(ev)
