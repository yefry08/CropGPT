"""Approval panel: OpenMontage creative gates (approve / request changes / reject) and the publish gate."""

from __future__ import annotations

import json
import time
from pathlib import Path

from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QPixmap
from PySide6.QtWidgets import (QHBoxLayout, QLabel, QLineEdit, QListWidget, QListWidgetItem, QMessageBox,
                               QPlainTextEdit, QPushButton, QSplitter, QVBoxLayout, QWidget)

from ..db import JobDB
from .publish_gate import PublishGate


def artifact_preview(checkpoint_path: str, limit: int = 20000) -> str:
    p = Path(checkpoint_path)
    if not p.exists():
        return "(checkpoint file not found)"
    try:
        cp = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        return f"(could not read checkpoint: {e})"
    out = json.dumps({"artifacts": cp.get("artifacts"), "review": cp.get("review"),
                      "cost_snapshot": cp.get("cost_snapshot")}, indent=2, ensure_ascii=False)
    return out[:limit] + ("\n…(truncated)" if len(out) > limit else "")


class ApprovalsPanel(QWidget):
    decided = Signal(int, str, str)          # approval id, verdict, note
    pending_count_changed = Signal(int)

    def __init__(self, db: JobDB, parent=None, warnings_fn=lambda job: []):
        super().__init__(parent)
        self.db = db
        self.warnings_fn = warnings_fn          # platform audit/verification warnings for the publish gate
        self.publish_gate = PublishGate()
        self.publish_gate.hide()
        self.publish_gate.publish_clicked.connect(lambda aid: self.decided.emit(aid, "approved", "published by the human"))
        self.publish_gate.reject_clicked.connect(lambda aid: self._decide_reject(aid))
        self._ids: list[int] = []

        self.list = QListWidget()
        self.list.currentRowChanged.connect(self._show)
        self.title = QLabel("No pending approvals")
        self.title.setStyleSheet("font-weight: 600;")
        self.summary = QPlainTextEdit(readOnly=True)
        self.detail = QPlainTextEdit(readOnly=True)
        self.preview = QLabel()
        self.preview.setAlignment(Qt.AlignCenter)
        self.preview.hide()
        self.note = QLineEdit()
        self.note.setPlaceholderText("Note for the agent (required for 'Request changes')")

        self.btn_approve = QPushButton("Approve")
        self.btn_edit = QPushButton("Request changes")
        self.btn_reject = QPushButton("Reject")
        self.btn_approve.clicked.connect(lambda: self._decide("approved"))
        self.btn_edit.clicked.connect(lambda: self._decide("edited"))
        self.btn_reject.clicked.connect(lambda: self._decide("rejected"))

        buttons = QHBoxLayout()
        buttons.addWidget(self.note, 1)
        for b in (self.btn_approve, self.btn_edit, self.btn_reject):
            buttons.addWidget(b)

        right = QWidget()
        rl = QVBoxLayout(right)
        rl.addWidget(self.title)
        self.lbl_summary, self.lbl_artifact = QLabel("Agent summary"), QLabel("Artifact under review")
        rl.addWidget(self.lbl_summary)
        rl.addWidget(self.summary, 1)
        rl.addWidget(self.lbl_artifact)
        rl.addWidget(self.preview, 3)
        rl.addWidget(self.detail, 3)
        rl.addWidget(self.publish_gate, 6)
        self._creative = [self.lbl_summary, self.lbl_artifact, self.summary, self.detail, self.note, self.btn_approve,
                          self.btn_edit, self.btn_reject]
        rl.addLayout(buttons)

        split = QSplitter(Qt.Horizontal)
        split.addWidget(self.list)
        split.addWidget(right)
        split.setSizes([280, 820])
        QVBoxLayout(self).addWidget(split)
        self._set_enabled(False)

    def refresh(self) -> None:
        pending = self.db.approvals("pending")
        ids = [a["id"] for a in pending]
        if ids != self._ids:
            current = self._ids[self.list.currentRow()] if 0 <= self.list.currentRow() < len(self._ids) else None
            self._ids = ids
            self.list.blockSignals(True)
            self.list.clear()
            for a in pending:
                label = f"Job #{a['job_id']} · {'PUBLISH' if a['gate'] == 'publish' else a['gate']}"
                QListWidgetItem(label, self.list)
            self.list.blockSignals(False)
            row = ids.index(current) if current in ids else (0 if ids else -1)
            self.list.setCurrentRow(row)
            self._show(row)
            self.pending_count_changed.emit(len(ids))

    def _set_enabled(self, on: bool) -> None:
        for w in (self.btn_approve, self.btn_edit, self.btn_reject, self.note):
            w.setEnabled(on)

    def _show(self, row: int) -> None:
        if row < 0 or row >= len(self._ids):
            self.title.setText("No pending approvals")
            self.summary.clear()
            self.detail.clear()
            self._set_enabled(False)
            return
        a = self.db.get_approval(self._ids[row])
        job = self.db.get_job(a["job_id"]) or {}
        gate = a["gate"]
        is_pub = gate == "publish"
        for w in self._creative:
            w.setVisible(not is_pub)
        self.publish_gate.setVisible(is_pub)
        if is_pub:
            self.title.setText(f"Job #{a['job_id']} ({job.get('channel')}) — PUBLISH GATE: review, then publish")
            self.preview.hide()
            self.publish_gate.show_approval(a, self.warnings_fn(job))
            return
        self.publish_gate.clear()
        self.title.setText(f"Job #{a['job_id']} ({job.get('channel')}) — gate: {gate}"
                           f"  ·  waiting since {time.strftime('%H:%M:%S', time.localtime(a['created_at']))}")
        self.summary.setPlainText(a["summary"] or "")
        payload = json.loads(a["payload"] or "{}")
        checks = ""
        if payload.get("checks"):
            c = payload["checks"]
            o, f = c.get("originality", {}), c.get("facts", {})
            flags = f.get("rule_violations", []) + f.get("critic_flags", [])
            checks = (f"CHANNELFORGE CHECKS\n  originality: {o.get('summary')}\n"
                      f"  facts: {f.get('claims_checked')} claims, {'passed' if f.get('passed') else 'FLAGGED'}\n"
                      + "".join(f"    - {x.get('claim_id') or x.get('section_id')}: {x.get('problem')}\n" for x in flags)
                      + f"  script words: {c.get('script_words')}\n\n")
        self.detail.setPlainText(checks + (artifact_preview(payload["checkpoint"]) if payload.get("checkpoint")
                                           else json.dumps(payload, indent=2)))
        img = payload.get("preview_image")
        if img and Path(img).exists():
            self.preview.setPixmap(QPixmap(img).scaledToWidth(760, Qt.SmoothTransformation))
            self.preview.show()
        else:
            self.preview.clear()
            self.preview.hide()
        self.btn_edit.setVisible(gate != "publish")
        self._set_enabled(True)

    def _decide_reject(self, approval_id: int) -> None:
        if QMessageBox.question(self, "Reject", "Reject publishing this job?") == QMessageBox.StandardButton.Yes:
            self.decided.emit(approval_id, "rejected", "rejected at the publish gate")

    def _decide(self, verdict: str) -> None:
        row = self.list.currentRow()
        if row < 0:
            return
        note = self.note.text().strip()
        if verdict == "edited" and not note:
            QMessageBox.information(self, "Request changes", "Describe the changes you want in the note field.")
            return
        if verdict == "rejected" and QMessageBox.question(self, "Reject", "Reject and cancel this job?") \
                != QMessageBox.StandardButton.Yes:
            return
        self.decided.emit(self._ids[row], verdict, note)
        self.note.clear()
