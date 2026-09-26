"""Job queue with live stage progress, event stream, and per-job actions."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

from PySide6.QtCore import QUrl, Signal
from PySide6.QtGui import QDesktopServices
from PySide6.QtWidgets import (QAbstractItemView, QHBoxLayout, QHeaderView, QMessageBox, QPlainTextEdit,
                               QPushButton, QSplitter, QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget)
from PySide6.QtCore import Qt

from ..config import AppConfig
from ..db import JobDB

COLUMNS = ["#", "Channel", "Status", "Stage", "Model target", "Cost $", "Input", "Updated"]
STATUS_ICON = {"queued": "⏳", "running": "▶", "awaiting_approval": "✋", "failed": "✖", "done": "✔", "cancelled": "⊘"}


class JobsPanel(QWidget):
    retry_requested = Signal(int)
    cancel_requested = Signal(int)

    def __init__(self, cfg: AppConfig, db: JobDB, parent=None):
        super().__init__(parent)
        self.cfg, self.db = cfg, db
        self._selected: int | None = None
        self._last_event_id = 0

        self.table = QTableWidget(0, len(COLUMNS))
        self.table.setHorizontalHeaderLabels(COLUMNS)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SingleSelection)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.verticalHeader().setVisible(False)
        self.table.horizontalHeader().setSectionResizeMode(6, QHeaderView.Stretch)
        self.table.itemSelectionChanged.connect(self._on_select)

        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumBlockCount(5000)

        self.btn_board = QPushButton("Open Backlot board")
        self.btn_folder = QPushButton("Open output folder")
        self.btn_retry = QPushButton("Retry stage")
        self.btn_cancel = QPushButton("Cancel job")
        self.btn_board.clicked.connect(self._open_board)
        self.btn_folder.clicked.connect(self._open_folder)
        self.btn_retry.clicked.connect(lambda: self._selected and self.retry_requested.emit(self._selected))
        self.btn_cancel.clicked.connect(lambda: self._selected and self.cancel_requested.emit(self._selected))

        buttons = QHBoxLayout()
        for b in (self.btn_board, self.btn_folder, self.btn_retry, self.btn_cancel):
            buttons.addWidget(b)
        buttons.addStretch(1)

        split = QSplitter(Qt.Horizontal)
        split.addWidget(self.table)
        split.addWidget(self.log)
        split.setSizes([640, 480])

        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(split, 1)
        lay.addLayout(buttons)
        self._update_buttons()

    # -- refresh -----------------------------------------------------------
    def refresh(self) -> None:
        jobs = self.db.list_jobs()
        self.table.setRowCount(len(jobs))
        for r, j in enumerate(jobs):
            vals = [str(j["id"]), j["channel"], f"{STATUS_ICON.get(j['status'], '')} {j['status']}",
                    j["current_stage"] or "", j["agent_target"] or "", f"{self.db.job_cost(j['id']):.4f}",
                    j["input_text"].splitlines()[0][:120], time.strftime("%H:%M:%S", time.localtime(j["updated_at"]))]
            for c, v in enumerate(vals):
                item = self.table.item(r, c)
                if item is None:
                    item = QTableWidgetItem()
                    self.table.setItem(r, c, item)
                if item.text() != v:
                    item.setText(v)
                if c == 2 and j["status"] == "failed" and j["error"]:
                    item.setToolTip(j["error"])
            if j["id"] == self._selected and not self.table.item(r, 0).isSelected():
                self.table.blockSignals(True)
                self.table.selectRow(r)
                self.table.blockSignals(False)
        self._append_events()
        self._update_buttons()

    def _append_events(self) -> None:
        if self._selected is None:
            return
        for e in self.db.events(self._selected, self._last_event_id):
            ts = time.strftime("%H:%M:%S", time.localtime(e["ts"]))
            prefix = {"warn": "⚠ ", "error": "✖ "}.get(e["level"], "")
            self.log.appendPlainText(f"[{ts}] {prefix}{e['message']}")
            self._last_event_id = e["id"]

    def _on_select(self) -> None:
        rows = self.table.selectionModel().selectedRows()
        new = int(self.table.item(rows[0].row(), 0).text()) if rows else None
        if new != self._selected:
            self._selected = new
            self._last_event_id = 0
            self.log.clear()
            self._append_events()
        self._update_buttons()

    def _job(self) -> dict | None:
        return self.db.get_job(self._selected) if self._selected else None

    def _update_buttons(self) -> None:
        j = self._job()
        self.btn_board.setEnabled(bool(j and j["project_id"]))
        self.btn_folder.setEnabled(bool(j and j["output_dir"]))
        self.btn_retry.setEnabled(bool(j and j["status"] in ("failed", "cancelled")))
        self.btn_cancel.setEnabled(bool(j and j["status"] in ("queued", "running", "awaiting_approval")))

    # -- actions -----------------------------------------------------------
    def _open_board(self) -> None:
        j = self._job()
        if not j:
            return
        # `python -m backlot open <project>` starts the board server if needed and opens the browser.
        try:
            subprocess.Popen([self.cfg.engine_python, "-m", "backlot", "open", j["project_id"]],
                             cwd=str(self.cfg.openmontage_dir), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except OSError as e:
            QMessageBox.warning(self, "Backlot", f"Could not start the Backlot board: {e}")

    def _open_folder(self) -> None:
        j = self._job()
        if j and j["output_dir"]:
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(Path(j["output_dir"]))))
