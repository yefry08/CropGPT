"""Settings: API keys (OS keyring only), routing, per-channel posting schedule."""

from __future__ import annotations

from apscheduler.triggers.cron import CronTrigger
from PySide6.QtWidgets import (QCheckBox, QDialog, QDialogButtonBox, QFormLayout, QGroupBox, QLabel, QLineEdit, QMessageBox,
                               QPlainTextEdit, QVBoxLayout, QWidget, QScrollArea)

from .. import secrets
from ..config import AppConfig

SECRET_LABELS = {
    secrets.OMNIROUTE_API_KEY: "OmniRoute inference API key (sk-…)",
    secrets.OMNIROUTE_MANAGEMENT_TOKEN: "OmniRoute management token (oma_live_… or manage-scoped key)",
    secrets.ANTHROPIC_API_KEY: "Anthropic API key (optional; normally connected inside OmniRoute)",
}


class SettingsDialog(QDialog):
    def __init__(self, cfg: AppConfig, parent=None):
        super().__init__(parent)
        self.setWindowTitle("ChannelForge settings")
        self.resize(720, 640)
        self.cfg = cfg

        keys = QGroupBox("API keys — stored in the OS keyring, never on disk. Leave blank to keep the current value.")
        kf = QFormLayout(keys)
        self.key_edits: dict[str, QLineEdit] = {}
        for name, label in SECRET_LABELS.items():
            e = QLineEdit()
            e.setEchoMode(QLineEdit.Password)
            e.setPlaceholderText("stored ✔" if secrets.has_secret(name) else "not set")
            self.key_edits[name] = e
            kf.addRow(label, e)

        routing = QGroupBox("Model routing")
        rf = QFormLayout(routing)
        r = cfg.router
        self.omni_url = QLineEdit(r.omniroute_url)
        self.autostart = QCheckBox("Start OmniRoute automatically when it is down")
        self.autostart.setChecked(r.omniroute_autostart)
        self.primary_models = QPlainTextEdit("\n".join(r.primary_combo_models))
        self.agent_models = QPlainTextEdit("\n".join(r.agent_models))
        self.general_models = QPlainTextEdit("\n".join(r.general_models))
        self.critic_models = QPlainTextEdit("\n".join(r.critic_models))
        self.metadata_models = QPlainTextEdit("\n".join(r.metadata_models))
        for w in (self.primary_models, self.agent_models, self.general_models, self.critic_models,
                  self.metadata_models):
            w.setFixedHeight(60)
        rf.addRow("OmniRoute URL (root, no /v1)", self.omni_url)
        rf.addRow("", self.autostart)
        rf.addRow(f"Claude combo '{r.primary_combo}' steps", self.primary_models)
        rf.addRow("Agent stages — targets in order", self.agent_models)
        rf.addRow("Script / general — targets in order", self.general_models)
        rf.addRow("Fact-check critic — targets in order", self.critic_models)
        rf.addRow("Metadata only — targets in order", self.metadata_models)
        rf.addRow("", QLabel("Targets are OmniRoute model ids: a combo name, provider/model, or auto/<variant> "
                             "(auto/coding, auto/cheap, auto/reasoning…)."))

        sched = QGroupBox("Posting schedule per channel (cron: minute hour day month weekday — use names like tue,fri; local time)")
        sf = QFormLayout(sched)
        self.cron: dict[str, QLineEdit] = {}
        for cid, ch in cfg.channels.items():
            self.cron[cid] = QLineEdit(ch.posting_schedule_cron)
            sf.addRow(ch.display_name, self.cron[cid])

        oauth = QGroupBox("Platform connections (per channel)")
        of = QVBoxLayout(oauth)
        of.addWidget(QLabel("YouTube / TikTok / Instagram OAuth connections arrive in milestone M6."))

        body = QWidget()
        bl = QVBoxLayout(body)
        for g in (keys, routing, sched, oauth):
            bl.addWidget(g)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setWidget(body)

        bb = QDialogButtonBox(QDialogButtonBox.Save | QDialogButtonBox.Cancel)
        bb.accepted.connect(self._save)
        bb.rejected.connect(self.reject)
        lay = QVBoxLayout(self)
        lay.addWidget(scroll)
        lay.addWidget(bb)

    @staticmethod
    def _lines(w: QPlainTextEdit) -> list[str]:
        return [x.strip() for x in w.toPlainText().splitlines() if x.strip()]

    def _save(self) -> None:
        for cid, e in self.cron.items():
            try:
                CronTrigger.from_crontab(e.text().strip())
            except ValueError as err:
                QMessageBox.warning(self, "Posting schedule",
                                    f"{self.cfg.channels[cid].display_name}: invalid cron '{e.text()}' ({err})")
                return
        for name, e in self.key_edits.items():
            if e.text().strip():
                secrets.set_secret(name, e.text().strip())
            e.clear()
        r = self.cfg.router
        r.omniroute_url = self.omni_url.text().strip().rstrip("/")
        r.omniroute_autostart = self.autostart.isChecked()
        r.primary_combo_models = self._lines(self.primary_models)
        r.agent_models = self._lines(self.agent_models)
        r.general_models = self._lines(self.general_models)
        r.critic_models = self._lines(self.critic_models)
        r.metadata_models = self._lines(self.metadata_models)
        for cid, e in self.cron.items():
            self.cfg.channels[cid].posting_schedule_cron = e.text().strip()
        self.cfg.save()
        self.accept()
