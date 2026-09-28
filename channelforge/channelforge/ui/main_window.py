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
from .publish_panel import PublishPanel
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
        self.approvals = ApprovalsPanel(db, warnings_fn=self._platform_warnings)
        self.approvals.decided.connect(self._decide)
        self.approvals.pending_count_changed.connect(self._badge)
        self._approvals_index = self.tabs.addTab(self.approvals, "Approvals")
        self.router = RouterPanel(cfg, db)
        self.tabs.addTab(self.router, "Model routing")
        self.publishing = PublishPanel(db)
        self.publishing.retry_requested.connect(self._retry_publish)
        self.tabs.addTab(self.publishing, "Publishing")

        self.jobs = JobsPanel(cfg, db)
        self.jobs.retry_requested.connect(self.runner.retry)
        self.jobs.cancel_requested.connect(self.runner.cancel)
        self.jobs.budget_requested.connect(self.runner.set_budget)

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
        self.publishing.refresh()

    def _platform_warnings(self, job: dict) -> list[str]:
        from .. import secrets
        from ..publish import instagram, tiktok, youtube
        ch = self.cfg.channels.get(job.get("channel", ""))
        if not ch:
            return []
        out = []
        proj = self.cfg.publish.youtube_projects.get(ch.youtube_project)
        if "youtube" in ch.platforms:
            if not secrets.has_secret(youtube.token_key(ch.id)):
                out.append(f"YouTube is not connected for {ch.display_name} (Settings → Connections).")
            if not proj or not proj.audited:
                out.append(f"Google Cloud project '{ch.youtube_project}' is not marked audited: YouTube keeps uploads "
                           "from unverified API projects PRIVATE until the project passes the API compliance audit.")
        if "tiktok" in ch.platforms:
            if not secrets.has_secret(tiktok.token_key(ch.id)):
                out.append(f"TikTok is not connected for {ch.display_name}.")
            if not self.cfg.publish.tiktok_audited:
                out.append("TikTok client is not audited: posts will be PRIVATE (SELF_ONLY) until TikTok's audit passes.")
        if "instagram" in ch.platforms and not secrets.has_secret(instagram.token_key(ch.id)):
            out.append(f"Instagram is not connected for {ch.display_name}.")
        return out

    def _retry_publish(self, job_id: int) -> None:
        if self.runner.publisher is not None:
            n = self.runner.publisher.retry_failed(job_id)
            self.statusBar().showMessage(f"{n} post(s) re-queued", 5000)

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
