"""Settings: API keys (OS keyring only), routing, per-channel posting schedule."""

from __future__ import annotations

from apscheduler.triggers.cron import CronTrigger
from PySide6.QtWidgets import (QCheckBox, QComboBox, QHBoxLayout, QPushButton, QDialog, QDialogButtonBox, QFormLayout, QGroupBox, QLabel, QLineEdit, QMessageBox,
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

        oauth = self._connections(cfg)

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

    # ------------------------------------------------------------------ connections
    def _connections(self, cfg: AppConfig) -> QGroupBox:
        from ..publish import instagram, tiktok, youtube
        box = QGroupBox("Platform connections — tokens are kept in the OS keyring")
        lay = QVBoxLayout(box)
        pub = cfg.publish

        yt = QFormLayout()
        self.yt_audited: dict[str, QCheckBox] = {}
        for name, proj in pub.youtube_projects.items():
            row = QHBoxLayout()
            imp = QPushButton("Import OAuth client JSON…")
            imp.clicked.connect(lambda _=False, n=name: self._import_client(n))
            cb = QCheckBox("project passed YouTube's API audit (else uploads stay private)")
            cb.setChecked(proj.audited)
            self.yt_audited[name] = cb
            state = QLabel("client ✔" if secrets.has_secret(youtube.client_key(name)) else "no client yet")
            row.addWidget(imp)
            row.addWidget(state)
            row.addWidget(cb)
            w = QWidget()
            w.setLayout(row)
            yt.addRow(f"Google Cloud project '{name}'", w)
        lay.addLayout(yt)

        self.tt_audited = QCheckBox("TikTok API client passed TikTok's content-sharing audit (else posts are private)")
        self.tt_audited.setChecked(pub.tiktok_audited)
        lay.addWidget(self.tt_audited)
        self.ig_mode = QComboBox()
        self.ig_mode.addItems(["resumable", "video_url"])
        self.ig_mode.setCurrentText(pub.instagram_mode)
        igm = QFormLayout()
        igm.addRow("Instagram upload mode (video_url needs an S3-compatible temporary host)", self.ig_mode)
        lay.addLayout(igm)

        self.tt_tokens: dict[str, QLineEdit] = {}
        self.ig_tokens: dict[str, tuple[QLineEdit, QLineEdit]] = {}
        for cid, ch in cfg.channels.items():
            g = QGroupBox(ch.display_name)
            f = QFormLayout(g)
            con = QPushButton("Connect YouTube (opens the browser)")
            status = QLabel("connected ✔" if secrets.has_secret(youtube.token_key(cid)) else "not connected")
            con.clicked.connect(lambda _=False, c=cid, lab=status: self._connect_youtube(c, lab))
            row = QHBoxLayout()
            row.addWidget(con)
            row.addWidget(status)
            w = QWidget()
            w.setLayout(row)
            f.addRow("YouTube", w)
            tt = QLineEdit()
            tt.setEchoMode(QLineEdit.Password)
            tt.setPlaceholderText("stored ✔" if secrets.has_secret(tiktok.token_key(cid)) else
                                  '{"client_key","client_secret","access_token","refresh_token","expires_in"}')
            self.tt_tokens[cid] = tt
            f.addRow("TikTok tokens (JSON)", tt)
            ig_tok, ig_user = QLineEdit(), QLineEdit()
            ig_tok.setEchoMode(QLineEdit.Password)
            has_ig = secrets.has_secret(instagram.token_key(cid))
            ig_tok.setPlaceholderText("stored ✔" if has_ig else "long-lived access token")
            ig_user.setPlaceholderText("Instagram business/creator user id")
            self.ig_tokens[cid] = (ig_tok, ig_user)
            f.addRow("Instagram token", ig_tok)
            f.addRow("Instagram user id", ig_user)
            lay.addWidget(g)
        return box

    def _import_client(self, project: str) -> None:
        from PySide6.QtWidgets import QFileDialog
        from ..publish import youtube
        path, _ = QFileDialog.getOpenFileName(self, "Google OAuth client (Desktop app) JSON", "", "JSON (*.json)")
        if path:
            import json
            raw = open(path, encoding="utf-8").read()
            json.loads(raw)
            secrets.set_secret(youtube.client_key(project), raw)
            QMessageBox.information(self, "YouTube", f"OAuth client stored for project '{project}'. You can delete "
                                    "the downloaded file now.")

    def _connect_youtube(self, channel: str, label: QLabel) -> None:
        from ..publish import youtube
        try:
            youtube.connect(channel, self.cfg.channels[channel].youtube_project)
            label.setText("connected ✔")
        except Exception as e:
            QMessageBox.warning(self, "YouTube", str(e))

    def _save_connections(self) -> None:
        import json
        import time as _t
        from ..publish import instagram, tiktok
        pub = self.cfg.publish
        for name, cb in self.yt_audited.items():
            pub.youtube_projects[name].audited = cb.isChecked()
        pub.tiktok_audited = self.tt_audited.isChecked()
        pub.instagram_mode = self.ig_mode.currentText()
        for cid, e in self.tt_tokens.items():
            if e.text().strip():
                d = json.loads(e.text())
                d.setdefault("expires_at", _t.time() + int(d.pop("expires_in", 86400)))
                secrets.set_secret(tiktok.token_key(cid), json.dumps(d))
                e.clear()
        for cid, (tok, user) in self.ig_tokens.items():
            if tok.text().strip() and user.text().strip():
                secrets.set_secret(instagram.token_key(cid), json.dumps({"access_token": tok.text().strip(),
                                                                        "ig_user_id": user.text().strip()}))
                tok.clear()

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
        try:
            self._save_connections()
        except ValueError as err:
            QMessageBox.warning(self, "Connections", f"Could not read the tokens JSON: {err}")
            return
        self.cfg.save()
        self.accept()
