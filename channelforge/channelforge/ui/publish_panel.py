"""Every planned post: platform, what, when it goes live, status, link, warnings and errors."""

from __future__ import annotations

import datetime as dt

from PySide6.QtCore import Signal
from PySide6.QtWidgets import (QAbstractItemView, QHBoxLayout, QHeaderView, QPushButton, QTableWidget, QTableWidgetItem,
                               QVBoxLayout, QWidget)

from ..db import JobDB

COLS = ["Job", "Platform", "Item", "Goes live", "Status", "Tries", "Link", "Warning / error"]


class PublishPanel(QWidget):
    retry_requested = Signal(int)

    def __init__(self, db: JobDB, parent=None):
        super().__init__(parent)
        self.db = db
        self.table = QTableWidget(0, len(COLS))
        self.table.setHorizontalHeaderLabels(COLS)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.verticalHeader().setVisible(False)
        self.table.horizontalHeader().setSectionResizeMode(7, QHeaderView.Stretch)
        self.btn_retry = QPushButton("Retry failed posts of the selected job")
        self.btn_retry.clicked.connect(self._retry)
        row = QHBoxLayout()
        row.addStretch(1)
        row.addWidget(self.btn_retry)
        lay = QVBoxLayout(self)
        lay.addWidget(self.table)
        lay.addLayout(row)
        self._sig = None

    def refresh(self) -> None:
        items = self.db.publish_items()
        sig = [(i["id"], i["status"], i["attempts"], i["url"], i["error"]) for i in items]
        if sig == self._sig:
            return
        self._sig = sig
        self.table.setRowCount(len(items))
        for r, i in enumerate(items):
            what = "long video" if i["kind"] == "long" else f"short {i['idx']}"
            vals = [str(i["job_id"]), i["platform"], what, dt.datetime.fromtimestamp(i["publish_at"]).strftime("%a %d %b %H:%M"),
                    i["status"], str(i["attempts"]), i["url"] or "", i["error"] or i["warning"] or ""]
            for c, v in enumerate(vals):
                it = QTableWidgetItem(v)
                if c == 7 and v:
                    it.setToolTip(v)
                self.table.setItem(r, c, it)

    def _retry(self) -> None:
        rows = self.table.selectionModel().selectedRows()
        if rows:
            self.retry_requested.emit(int(self.table.item(rows[0].row(), 0).text()))
