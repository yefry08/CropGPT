"""Model-routing ledger: which model served each stage, tokens, cost, and fallbacks."""

from __future__ import annotations

import time

from PySide6.QtCore import QThreadPool, QRunnable, QObject, Signal
from PySide6.QtWidgets import (QAbstractItemView, QHBoxLayout, QHeaderView, QLabel, QMessageBox, QPushButton,
                               QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget)

from ..config import AppConfig
from ..db import JobDB
from ..router import omniroute

COLS = ["Time", "Job", "Stage", "Kind", "Target", "Model served", "In", "Out", "Cost $", "Basis", "OK", "Failure"]


class _Probe(QObject):
    done = Signal(bool)


class RouterPanel(QWidget):
    def __init__(self, cfg: AppConfig, db: JobDB, parent=None):
        super().__init__(parent)
        self.cfg, self.db = cfg, db
        self._last_id = None
        self.status = QLabel("OmniRoute: checking…")
        self.btn_setup = QPushButton("Create / update OmniRoute combo")
        self.btn_setup.clicked.connect(self._setup)
        top = QHBoxLayout()
        top.addWidget(self.status)
        top.addStretch(1)
        top.addWidget(self.btn_setup)

        self.table = QTableWidget(0, len(COLS))
        self.table.setHorizontalHeaderLabels(COLS)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.verticalHeader().setVisible(False)
        self.table.horizontalHeader().setSectionResizeMode(5, QHeaderView.Stretch)
        lay = QVBoxLayout(self)
        lay.addLayout(top)
        lay.addWidget(self.table)
        self._probe = _Probe()
        self._probe.done.connect(lambda up: self.status.setText(
            f"OmniRoute @ {self.cfg.router.omniroute_url}: " + ("● up" if up else "○ down — jobs pause and resume from checkpoint when it is back")))

    def probe(self) -> None:
        cfg, sig = self.cfg.router, self._probe.done

        class R(QRunnable):
            def run(self):
                sig.emit(omniroute.is_up(cfg))
        QThreadPool.globalInstance().start(R())

    def refresh(self) -> None:
        rows = self.db.llm_calls(limit=500)
        top = rows[0]["id"] if rows else None
        if top == self._last_id:
            return
        self._last_id = top
        self.table.setRowCount(len(rows))
        for r, c in enumerate(rows):
            vals = [time.strftime("%H:%M:%S", time.localtime(c["ts"])), str(c["job_id"] or ""), c["stage"] or "",
                    c["kind"], c["target"], c["model"] or "", str(c["tokens_in"]), str(c["tokens_out"]),
                    f"{c['cost_usd']:.5f}", c["cost_basis"] or "", "✔" if c["ok"] else "✖", c["failure"] or ""]
            for i, v in enumerate(vals):
                self.table.setItem(r, i, QTableWidgetItem(v))

    def _setup(self) -> None:
        try:
            lines = omniroute.setup_combos(self.cfg.router)
        except Exception as e:   # surfaced to the user verbatim (already redacted by secrets layer)
            QMessageBox.warning(self, "OmniRoute", str(e))
            return
        QMessageBox.information(self, "OmniRoute", "\n".join(lines))
