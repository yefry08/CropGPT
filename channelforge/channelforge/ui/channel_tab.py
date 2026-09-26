"""One tab per channel: paste box + job settings + Generate."""

from __future__ import annotations

from PySide6.QtCore import Signal
from PySide6.QtWidgets import (QCheckBox, QComboBox, QDoubleSpinBox, QFormLayout, QHBoxLayout, QLabel,
                               QPlainTextEdit, QPushButton, QVBoxLayout, QWidget)

from ..config import AppConfig, ChannelSettings

BACKEND_LABELS = {
    "omni_flash": "Gemini Omni Flash / Veo (paid)",
    "character_animation": "Character animation — SVG rig + GSAP (free)",
    "hand_drawn_canvas": "Hand-drawn canvas animation",
    "animated-explainer": "OpenMontage animated-explainer",
    "documentary-montage": "OpenMontage documentary-montage",
}

HINTS = {
    "contractor_ai": "Democracy, politics, public procurement and corruption worldwide. Ends with the Contractor AI CTA.",
    "ai_news": "AI and AI-safety news — research limited to the last 7 days, primary sources first.",
    "geopolitics": "Data-driven geopolitics / sports × politics. Citable datasets only (World Bank, IMF, SIPRI, UN…).",
}


class ChannelTab(QWidget):
    generate_requested = Signal(str, dict)       # channel id, job fields

    def __init__(self, cfg: AppConfig, channel: ChannelSettings, parent=None):
        super().__init__(parent)
        self.cfg = cfg
        self.channel = channel

        hint = QLabel(HINTS.get(channel.id, ""))
        hint.setWordWrap(True)
        hint.setStyleSheet("color: palette(mid);")

        self.paste = QPlainTextEdit()
        self.paste.setPlaceholderText("Paste a reference video URL, several reference URLs (one per line), "
                                      "or a topic / notes block…")

        self.language = QComboBox()
        self.language.addItems(["es", "en", "pt"])
        self.language.setCurrentText(channel.language)

        self.style = QComboBox()
        self.style.addItems(channel.visual_styles)
        self.style.setCurrentText(channel.visual_style)

        self.backend = QComboBox()
        for b in channel.render_backends:
            self.backend.addItem(BACKEND_LABELS.get(b, b), b)
        self.backend.setCurrentIndex(max(0, channel.render_backends.index(channel.render_backend)))

        self.budget = QDoubleSpinBox()
        self.budget.setRange(0.0, 500.0)
        self.budget.setDecimals(2)
        self.budget.setPrefix("$ ")
        self.budget.setValue(channel.budget_cap_usd)

        self.auto = QCheckBox("Auto-approve creative gates (proposal, script, assets). Publish always needs a click.")
        self.auto.setChecked(channel.auto_approve_creative_gates)

        self.generate = QPushButton("Generate")
        self.generate.setDefault(True)
        self.generate.clicked.connect(self._on_generate)

        form = QFormLayout()
        form.addRow("Language", self.language)
        form.addRow("Visual style", self.style)
        form.addRow("Render backend", self.backend)
        form.addRow("Per-video budget cap", self.budget)
        form.addRow("", self.auto)

        row = QHBoxLayout()
        row.addStretch(1)
        row.addWidget(self.generate)

        lay = QVBoxLayout(self)
        lay.addWidget(hint)
        lay.addWidget(self.paste, 1)
        lay.addLayout(form)
        lay.addLayout(row)

        for w in (self.language, self.style, self.backend):
            w.currentIndexChanged.connect(self._persist)
        self.budget.valueChanged.connect(self._persist)
        self.auto.toggled.connect(self._persist)

    def _persist(self, *_):
        ch = self.channel
        ch.language = self.language.currentText()
        ch.visual_style = self.style.currentText()
        ch.render_backend = self.backend.currentData()
        ch.budget_cap_usd = float(self.budget.value())
        ch.auto_approve_creative_gates = self.auto.isChecked()
        self.cfg.save()

    def _on_generate(self):
        text = self.paste.toPlainText().strip()
        if not text:
            self.paste.setFocus()
            return
        self.generate_requested.emit(self.channel.id, {
            "input_text": text, "language": self.language.currentText(),
            "visual_style": self.style.currentText(), "render_backend": self.backend.currentData(),
            "budget_cap_usd": float(self.budget.value()), "auto_approve": self.auto.isChecked()})
        self.paste.clear()
