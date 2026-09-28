"""The PUBLISH gate: preview everything that will go out, then one explicit click."""

from __future__ import annotations

import json
from pathlib import Path

from PySide6.QtCore import QUrl, Signal
from PySide6.QtMultimedia import QAudioOutput, QMediaPlayer
from PySide6.QtMultimediaWidgets import QVideoWidget
from PySide6.QtWidgets import (QComboBox, QHBoxLayout, QLabel, QPlainTextEdit, QPushButton, QSplitter, QVBoxLayout,
                               QWidget)
from PySide6.QtCore import Qt


def describe(meta: dict, flagged: dict, warnings: list[str]) -> str:
    """What will go out. Things that need attention come first."""
    yt = meta["youtube"]
    rv, cf = flagged.get("rule_violations", []), flagged.get("critic_flags", [])
    lines = []
    if warnings:
        lines += ["⚠ PLATFORM WARNINGS"] + [f"  • {w}" for w in warnings] + [""]
    lines += [f"FLAGGED CLAIMS: {flagged.get('claims_checked', 0)} claims checked, {len(rv) + len(cf)} still open"]
    lines += [f"  • {x.get('claim_id') or x.get('section_id')}: {x.get('problem')}" for x in rv + cf]
    lines += ["", f"YOUTUBE TITLE: {yt['title']}", f"TAGS: {', '.join(yt['tags'])}",
              f"AI disclosure (containsSyntheticMedia): {yt.get('contains_synthetic_media')}", "", yt["description"], ""]
    for k, s in enumerate(meta["shorts"], 1):
        lines += [f"— SHORT {k} ({s['start']:.0f}–{s['end']:.0f} s) hook: {s.get('hook', '')}",
                  f"  YT Shorts: {s['yt_shorts']['title']}", f"  TikTok: {s['tiktok']['caption']}",
                  f"  IG Reels: {s['ig_reels']['caption'][:300]}"]
    return "\n".join(lines)


class PublishGate(QWidget):
    publish_clicked = Signal(int)
    reject_clicked = Signal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._approval_id: int | None = None
        self.player = QMediaPlayer(self)
        self.audio = QAudioOutput(self)
        self.player.setAudioOutput(self.audio)
        self.video = QVideoWidget()
        self.video.setMinimumSize(320, 240)
        self.player.setVideoOutput(self.video)
        self.pick = QComboBox()
        self.pick.currentIndexChanged.connect(self._load)
        play = QPushButton("Play / pause")
        play.clicked.connect(lambda: self.player.pause() if self.player.isPlaying() else self.player.play())
        self.text = QPlainTextEdit(readOnly=True)
        self.btn_publish = QPushButton("PUBLISH (schedule all posts)")
        self.btn_publish.setStyleSheet("font-weight: 700; padding: 8px 18px;")
        self.btn_reject = QPushButton("Reject")
        self.btn_publish.clicked.connect(lambda: self._approval_id and self.publish_clicked.emit(self._approval_id))
        self.btn_reject.clicked.connect(lambda: self._approval_id and self.reject_clicked.emit(self._approval_id))
        left = QWidget()
        ll = QVBoxLayout(left)
        row = QHBoxLayout()
        row.addWidget(QLabel("Preview"))
        row.addWidget(self.pick, 1)
        row.addWidget(play)
        ll.addLayout(row)
        ll.addWidget(self.video, 1)
        split = QSplitter(Qt.Horizontal)
        split.addWidget(left)
        split.addWidget(self.text)
        split.setSizes([520, 560])
        buttons = QHBoxLayout()
        buttons.addStretch(1)
        buttons.addWidget(self.btn_reject)
        buttons.addWidget(self.btn_publish)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(split, 1)
        lay.addLayout(buttons)

    def show_approval(self, approval: dict, warnings: list[str]) -> None:
        self._approval_id = approval["id"]
        payload = json.loads(approval["payload"] or "{}")
        files = [("Long video", payload.get("long"))] + [(f"Short {k}", f) for k, f in enumerate(payload.get("shorts", []), 1)]
        self.pick.blockSignals(True)
        self.pick.clear()
        for label, f in files:
            if f:
                self.pick.addItem(label, f)
        self.pick.blockSignals(False)
        self._load(0)
        meta = json.loads(Path(payload["metadata"]).read_text(encoding="utf-8")) if payload.get("metadata") else {}
        self.text.setPlainText(describe(meta, payload.get("flagged_claims") or {}, warnings) if meta else "")

    def _load(self, _i: int) -> None:
        f = self.pick.currentData()
        if f:
            self.player.setSource(QUrl.fromLocalFile(str(f)))

    def clear(self) -> None:
        self._approval_id = None
        self.player.stop()
        self.text.clear()
