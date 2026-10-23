#!/usr/bin/env python3
"""videomaker (desktop): write the script, lay out each scene with collage pieces, narrate it with your cloned voice
(Voicebox) and export a 9:16 reel. The video is drawn by code (vmk/film.py); the only AI is the voice.

    pip install -r requirements.txt      # PySide6, pycairo, Pillow (and ffmpeg on the PATH)
    python videomaker_app.py [project_folder]
"""
import json
import shutil
import sys
import traceback
from pathlib import Path

from PySide6.QtCore import QObject, QRunnable, Qt, QThreadPool, QTimer, QUrl, Signal
from PySide6.QtGui import QAction, QDesktopServices, QImage, QPixmap
from PySide6.QtMultimedia import QAudioOutput, QMediaPlayer
from PySide6.QtWidgets import (QApplication, QComboBox, QDoubleSpinBox, QFileDialog, QFormLayout, QGridLayout, QGroupBox, QHBoxLayout,
                               QHeaderView, QLabel, QLineEdit, QListWidget, QMainWindow, QMessageBox, QPlainTextEdit, QProgressBar,
                               QPushButton, QSlider, QSpinBox, QSplitter, QTableWidget, QTableWidgetItem, QTabWidget, QToolBar,
                               QVBoxLayout, QWidget)

from vmk import project as P, voice
from vmk.film import BACKGROUNDS, FPS, KINDS, STYLES, Film, render
from vmk.props import PROPS

HERE = Path(__file__).resolve().parent
PREVIEW_W, PREVIEW_H = 360, 640
COLS = ["kind", "text", "prop", "x", "y", "style", "size"]
HEAD = ["Tipo", "Texto", "Dibujo", "X", "Y", "Estilo", "Tamaño"]


class Job(QRunnable):
    """Runs fn(progress, cancelled) on the thread pool and reports back through signals."""

    class Sig(QObject):
        progress = Signal(float, str); done = Signal(object); failed = Signal(str)

    def __init__(self, fn):
        super().__init__(); self.fn, self.sig, self.stop = fn, Job.Sig(), False

    def run(self):
        try:
            self.sig.done.emit(self.fn(lambda f, m="": self.sig.progress.emit(f, m), lambda: self.stop))
        except Exception as e:   # shown to the user in a dialog
            traceback.print_exc(); self.sig.failed.emit(str(e))


class Preview(QLabel):
    """Shows one frame; a click places the selected item at that point of the 1080x1920 canvas."""
    clicked = Signal(int, int)

    def __init__(self):
        super().__init__(); self.setFixedSize(PREVIEW_W, PREVIEW_H); self.setStyleSheet("background:#222; border:6px solid #fff")
        self.setToolTip("Haz clic para colocar el elemento seleccionado en ese punto")

    def mousePressEvent(self, e):
        x, y = e.position().x() - 6, e.position().y() - 6
        self.clicked.emit(int(x / (PREVIEW_W - 12) * 1080 - 540), int(y / (PREVIEW_H - 12) * 1920))


class Main(QMainWindow):
    def __init__(self, folder=None):
        super().__init__(); self.setWindowTitle("videomaker"); self.resize(1400, 860)
        self.folder, self.p, self.cur, self.loading, self.film, self.job = None, P.new(), 0, False, None, None
        self.pool = QThreadPool.globalInstance()
        self.player = QMediaPlayer(); self.audio_out = QAudioOutput(); self.player.setAudioOutput(self.audio_out)
        self._toolbar(); self._ui(); self._status()
        self.refresh = QTimer(singleShot=True, interval=150, timeout=self.draw_preview)
        self.play_timer = QTimer(interval=int(1000 / 12), timeout=self._tick)
        if folder:
            self.open_folder(folder)
        else:
            self._load_into_ui()

    # ---------- layout ----------
    def _toolbar(self):
        tb = QToolBar("Proyecto"); tb.setMovable(False); self.addToolBar(tb)
        for label, fn in [("Nuevo", self.new_project), ("Abrir…", self.open_dialog), ("Guardar", self.save), ("Guardar como…", self.save_as)]:
            a = QAction(label, self); a.triggered.connect(fn); tb.addAction(a)
        tb.addSeparator()
        for label, fn in [("Generar todas las voces", self.voice_all), ("Exportar video", self.export_video), ("Exportar descripción", self.export_md)]:
            a = QAction(label, self); a.triggered.connect(fn); tb.addAction(a)

    def _ui(self):
        tabs = QTabWidget(); self.setCentralWidget(tabs)
        # --- scenes tab
        page = QWidget(); tabs.addTab(page, "Escenas"); split = QSplitter(); QHBoxLayout(page).addWidget(split)
        left = QWidget(); lv = QVBoxLayout(left); lv.addWidget(QLabel("<b>Escenas</b>"))
        self.list = QListWidget(); self.list.currentRowChanged.connect(self.select_section); lv.addWidget(self.list)
        row = QHBoxLayout()
        for label, fn in [("+", self.add_section), ("−", self.del_section), ("↑", lambda: self.move_section(-1)), ("↓", lambda: self.move_section(1))]:
            b = QPushButton(label); b.setFixedWidth(40); b.clicked.connect(fn); row.addWidget(b)
        lv.addLayout(row); split.addWidget(left)

        mid = QWidget(); mv = QVBoxLayout(mid); self.preview = Preview(); self.preview.clicked.connect(self.place_item)
        mv.addWidget(self.preview, alignment=Qt.AlignHCenter)
        self.slider = QSlider(Qt.Horizontal); self.slider.setRange(0, 1000); self.slider.valueChanged.connect(lambda _: self.refresh.start()); mv.addWidget(self.slider)
        prow = QHBoxLayout(); self.play_btn = QPushButton("▶ Reproducir escena"); self.play_btn.clicked.connect(self.toggle_play); prow.addWidget(self.play_btn)
        self.time_lbl = QLabel(""); prow.addWidget(self.time_lbl); mv.addLayout(prow); mv.addStretch(); split.addWidget(mid)

        right = QWidget(); rv = QVBoxLayout(right)
        box = QGroupBox("Escena"); f = QFormLayout(box)
        self.chapter = QLineEdit(); self.chapter.textEdited.connect(self.edited); f.addRow("Título", self.chapter)
        self.text = QPlainTextEdit(); self.text.setFixedHeight(90); self.text.textChanged.connect(self.edited); f.addRow("Narración", self.text)
        self.tts = QLineEdit(); self.tts.setPlaceholderText("Opcional: cómo debe pronunciarlo la voz (p. ej. «Antrópic»)"); self.tts.textEdited.connect(self.edited); f.addRow("Pronunciación", self.tts)
        self.bg = QComboBox(); self.bg.addItems(BACKGROUNDS); self.bg.currentTextChanged.connect(self.edited); f.addRow("Fondo", self.bg)
        vrow = QHBoxLayout(); self.seed = QSpinBox(); self.seed.setRange(1, 9999); self.seed.valueChanged.connect(self.edited); vrow.addWidget(QLabel("Toma")); vrow.addWidget(self.seed)
        b = QPushButton("Generar voz"); b.clicked.connect(self.voice_one); vrow.addWidget(b)
        b = QPushButton("Otra toma"); b.clicked.connect(lambda: (self.seed.setValue(self.seed.value() + 4), self.voice_one())); vrow.addWidget(b)
        b = QPushButton("Escuchar"); b.clicked.connect(self.listen); vrow.addWidget(b); f.addRow("Voz", vrow)
        self.voice_lbl = QLabel(""); f.addRow("", self.voice_lbl); rv.addWidget(box)

        box = QGroupBox("Momentos y elementos"); g = QVBoxLayout(box); brow = QHBoxLayout()
        self.beat = QComboBox(); self.beat.currentIndexChanged.connect(self.select_beat); brow.addWidget(QLabel("Momento")); brow.addWidget(self.beat)
        for label, fn in [("Añadir momento", self.add_beat), ("Quitar momento", self.del_beat)]:
            b = QPushButton(label); b.clicked.connect(fn); brow.addWidget(b)
        g.addLayout(brow)
        self.table = QTableWidget(0, len(COLS)); self.table.setHorizontalHeaderLabels(HEAD); self.table.verticalHeader().setVisible(False)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch); self.table.itemChanged.connect(self.table_edited); g.addWidget(self.table)
        irow = QHBoxLayout()
        for label, kind in [("+ Cinta", "tape"), ("+ Fichas", "tiles"), ("+ Sello", "stamp"), ("+ Texto", "serif"), ("+ Dibujo", "prop")]:
            b = QPushButton(label); b.clicked.connect(lambda _=False, k=kind: self.add_item(k)); irow.addWidget(b)
        b = QPushButton("Quitar"); b.clicked.connect(self.del_item); irow.addWidget(b); g.addLayout(irow)
        g.addWidget(QLabel("Consejo: selecciona una fila y haz clic en la vista previa para colocarla."))
        rv.addWidget(box); split.addWidget(right); split.setSizes([220, 420, 760])

        # --- publishing tab
        pub = QWidget(); tabs.addTab(pub, "Publicación y ajustes"); pf = QFormLayout(pub)
        self.title = QLineEdit(); self.title.textEdited.connect(self.meta_edited); pf.addRow("Título del video", self.title)
        self.lang = QComboBox(); self.lang.addItems(["es", "en"]); self.lang.currentTextChanged.connect(self.meta_edited); pf.addRow("Idioma de la voz", self.lang)
        prow = QHBoxLayout(); self.profile = QComboBox(); self.profile.currentIndexChanged.connect(self.meta_edited); prow.addWidget(self.profile)
        b = QPushButton("Buscar perfiles en Voicebox"); b.clicked.connect(self.load_profiles); prow.addWidget(b); pf.addRow("Perfil de voz", prow)
        self.url = QLineEdit(voice.URL); pf.addRow("Dirección de Voicebox", self.url)
        nums = QHBoxLayout()
        self.gap, self.tail, self.tempo = QDoubleSpinBox(), QDoubleSpinBox(), QDoubleSpinBox()
        for w, lo, hi, step, label in [(self.gap, 0, 3, .05, "Pausa entre escenas (s)"), (self.tail, 0, 10, .2, "Final (s)"), (self.tempo, .8, 1.3, .01, "Velocidad de voz")]:
            w.setRange(lo, hi); w.setSingleStep(step); w.valueChanged.connect(self.meta_edited); nums.addWidget(QLabel(label)); nums.addWidget(w)
        pf.addRow("Ritmo", nums)
        self.disclosure = QLineEdit(); self.disclosure.setPlaceholderText("Aviso en pantalla al final (vacío si no hace falta)"); self.disclosure.textEdited.connect(self.meta_edited); pf.addRow("Aviso", self.disclosure)
        self.credits = QPlainTextEdit(); self.credits.setFixedHeight(56); self.credits.textChanged.connect(self.meta_edited); pf.addRow("Créditos (2 líneas)", self.credits)
        self.post = QPlainTextEdit(); self.post.setFixedHeight(110); self.post.textChanged.connect(self.meta_edited); pf.addRow("Texto para publicar", self.post)
        self.facts = QPlainTextEdit(); self.facts.setPlaceholderText("Una línea por dato:  lo que se decía | lo que dicen las fuentes"); self.facts.setFixedHeight(110)
        self.facts.textChanged.connect(self.meta_edited); pf.addRow("Verificación", self.facts)
        self.sources = QPlainTextEdit(); self.sources.setPlaceholderText("Una línea por fuente:  título | https://…"); self.sources.setFixedHeight(110)
        self.sources.textChanged.connect(self.meta_edited); pf.addRow("Fuentes", self.sources)

    def _status(self):
        self.progress = QProgressBar(); self.progress.setFixedWidth(240); self.progress.hide(); self.statusBar().addPermanentWidget(self.progress)
        self.cancel_btn = QPushButton("Cancelar"); self.cancel_btn.hide(); self.cancel_btn.clicked.connect(self.cancel_job); self.statusBar().addPermanentWidget(self.cancel_btn)
        self.vb_lbl = QLabel(); self.statusBar().addPermanentWidget(self.vb_lbl); self.check_voicebox()

    # ---------- project <-> widgets ----------
    def sec(self):
        return self.p["sections"][self.cur]

    def _load_into_ui(self):
        self.loading = True; p = self.p
        self.title.setText(p["title"]); self.lang.setCurrentText(p.get("lang", "es")); self.disclosure.setText(p.get("disclosure", ""))
        self.gap.setValue(p.get("gap", .45)); self.tail.setValue(p.get("tail", 2.8)); self.tempo.setValue(p.get("tempo", 1.08))
        self.credits.setPlainText("\n".join(p.get("credits", []))); self.post.setPlainText(p.get("post_text", ""))
        self.facts.setPlainText("\n".join(f"{f['claim']} | {f['finding']}" for f in p.get("facts", [])))
        self.sources.setPlainText("\n".join(f"{s['title']} | {s['url']}" for s in p.get("sources", [])))
        if p.get("profile_id") and self.profile.findData(p["profile_id"]) < 0:
            self.profile.addItem(p["profile_id"], p["profile_id"])
        self.profile.setCurrentIndex(max(0, self.profile.findData(p.get("profile_id", ""))))
        self.list.clear(); self.list.addItems([f"{i + 1}. {s['chapter'] or s['id']}" for i, s in enumerate(p["sections"])])
        self.loading = False; self.list.setCurrentRow(min(self.cur, len(p["sections"]) - 1)); self.select_section(self.list.currentRow())
        self.setWindowTitle(f"videomaker — {p['title']}" + (f"  [{self.folder}]" if self.folder else ""))

    def select_section(self, i):
        if i < 0 or self.loading:
            return
        self.cur = i; s = self.sec(); self.loading = True
        self.chapter.setText(s["chapter"]); self.text.setPlainText(s["text"]); self.tts.setText(s.get("tts", "")); self.bg.setCurrentText(s["background"])
        self.seed.setValue(s.get("seed", 7)); self.beat.clear(); self.beat.addItems([f"{k + 1}" for k in range(len(s["beats"]))])
        self.loading = False; self.select_beat(0); self.voice_label(); self.film = None; self.refresh.start()

    def voice_label(self):
        a = P.audio_path(self.folder, self.sec()) if self.folder else None
        self.voice_lbl.setText(f"Voz lista: {voice.duration(a):.1f} s" if a and a.exists() else "Sin voz todavía (se estima por el número de palabras)")

    def edited(self, *_):
        if self.loading:
            return
        s = self.sec(); s["chapter"] = self.chapter.text(); s["text"] = self.text.toPlainText(); s["tts"] = self.tts.text()
        s["background"] = self.bg.currentText(); s["seed"] = self.seed.value()
        self.list.item(self.cur).setText(f"{self.cur + 1}. {s['chapter'] or s['id']}"); self.film = None; self.refresh.start()

    def meta_edited(self, *_):
        if self.loading:
            return
        p = self.p; p["title"] = self.title.text(); p["lang"] = self.lang.currentText(); p["disclosure"] = self.disclosure.text()
        p["profile_id"] = self.profile.currentData() or ""; p["gap"], p["tail"], p["tempo"] = self.gap.value(), self.tail.value(), self.tempo.value()
        p["credits"] = [l for l in self.credits.toPlainText().splitlines() if l.strip()][:2]; p["post_text"] = self.post.toPlainText()
        p["facts"] = [dict(zip(("claim", "finding"), [x.strip() for x in l.split("|", 1)])) for l in self.facts.toPlainText().splitlines() if "|" in l]
        p["sources"] = [dict(zip(("title", "url"), [x.strip() for x in l.split("|", 1)])) for l in self.sources.toPlainText().splitlines() if "|" in l]
        self.film = None; self.refresh.start()

    # ---------- beats and items ----------
    def items(self):
        return self.sec()["beats"][max(0, self.beat.currentIndex())]["items"]

    def select_beat(self, _=0):
        if self.loading:
            return
        self.loading = True; self.table.setRowCount(0)
        for it in self.items():
            r = self.table.rowCount(); self.table.insertRow(r)
            for c, key in enumerate(COLS):
                if key in ("kind", "prop", "style"):
                    cb = QComboBox(); cb.addItems({"kind": KINDS, "prop": ["none"] + sorted(PROPS), "style": STYLES}[key]); cb.setCurrentText(str(it.get(key, "")))
                    cb.currentTextChanged.connect(lambda v, row=r, k=key: self.cell(row, k, v)); self.table.setCellWidget(r, c, cb)
                else:
                    self.table.setItem(r, c, QTableWidgetItem(str(it.get(key, ""))))
        self.loading = False
        if self.table.rowCount():
            self.table.selectRow(0)
        self.slider.setValue(int(1000 * (self.beat.currentIndex() + .85) / max(1, len(self.sec()["beats"]))))
        self.refresh.start()

    def cell(self, row, key, value):
        if self.loading:
            return
        it = self.items()[row]
        it[key] = int(value) if key in ("x", "y", "size") and value.lstrip("-").isdigit() else value
        self.film = None; self.refresh.start()

    def table_edited(self, item):
        if not self.loading:
            self.cell(item.row(), COLS[item.column()], item.text())

    def add_item(self, kind):
        defaults = {"tape": ("TEXTO", "none", 300, 84), "tiles": ("2026", "none", 640, 110), "stamp": ("SELLO", "none", 1000, 100),
                    "serif": ("texto pequeño", "none", 1180, 46), "prop": ("", "robot", 760, 100)}[kind]
        self.items().append({"kind": kind, "text": defaults[0], "prop": defaults[1], "x": 0, "y": defaults[2], "style": "black", "size": defaults[3]})
        self.select_beat(); self.table.selectRow(self.table.rowCount() - 1)

    def del_item(self):
        r = self.table.currentRow()
        if r >= 0:
            del self.items()[r]; self.select_beat()

    def place_item(self, x, y):
        r = self.table.currentRow()
        if r < 0:
            return
        it = self.items()[r]; it["x"], it["y"] = max(-500, min(500, x)), max(120, min(1400, y)); self.select_beat(); self.table.selectRow(r)

    def add_beat(self):
        self.sec()["beats"].append({"items": []}); self.select_section(self.cur); self.beat.setCurrentIndex(len(self.sec()["beats"]) - 1)

    def del_beat(self):
        bs = self.sec()["beats"]
        if len(bs) > 1:
            del bs[self.beat.currentIndex()]; self.select_section(self.cur)

    # ---------- sections ----------
    def add_section(self):
        self.p["sections"].insert(self.cur + 1, P.section(P.new_id(self.p), "Nueva escena", "")); self.cur += 1; self._load_into_ui()

    def del_section(self):
        if len(self.p["sections"]) > 1 and QMessageBox.question(self, "Quitar escena", "¿Quitar esta escena?") == QMessageBox.Yes:
            del self.p["sections"][self.cur]; self.cur = max(0, self.cur - 1); self._load_into_ui()

    def move_section(self, d):
        j = self.cur + d; ss = self.p["sections"]
        if 0 <= j < len(ss):
            ss[self.cur], ss[j] = ss[j], ss[self.cur]; self.cur = j; self._load_into_ui()

    # ---------- preview ----------
    def draw_preview(self):
        if self.film is None:
            self.film = Film(P.timed(self.p, self.folder))
        t0, d = self.film.starts[self.cur], self.film.p["sections"][self.cur]["duration"]
        t = t0 + d * self.slider.value() / 1000 * .999
        surf = self.film.frame(t); img = QImage(bytes(surf.get_data()), 1080, 1920, surf.get_stride(), QImage.Format_RGB32)
        self.preview.setPixmap(QPixmap.fromImage(img).scaled(PREVIEW_W - 12, PREVIEW_H - 12, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        self.time_lbl.setText(f"{t - t0:4.1f} / {d:.1f} s   (total {self.film.total:.0f} s)")

    def toggle_play(self):
        if self.play_timer.isActive():
            self.play_timer.stop(); self.player.stop(); self.play_btn.setText("▶ Reproducir escena"); return
        self.slider.setValue(0); self.play_timer.start(); self.play_btn.setText("■ Parar")
        a = P.audio_path(self.folder, self.sec()) if self.folder else None
        if a and a.exists():
            self.player.setSource(QUrl.fromLocalFile(str(a))); self.player.play()

    def _tick(self):
        if self.film is None:
            self.draw_preview()
        d = self.film.p["sections"][self.cur]["duration"]; v = self.slider.value() + int(1000 / (d * 12))
        if v >= 1000:
            self.toggle_play(); return
        self.slider.blockSignals(True); self.slider.setValue(v); self.slider.blockSignals(False); self.draw_preview()

    # ---------- files ----------
    def need_folder(self):
        if not self.folder:
            self.save_as()
        return self.folder

    def new_project(self):
        self.folder, self.p, self.cur = None, P.new(), 0; self._load_into_ui()

    def open_dialog(self):
        d = QFileDialog.getExistingDirectory(self, "Abrir proyecto (carpeta con project.json)")
        if d:
            self.open_folder(d)

    def open_folder(self, d):
        try:
            self.p = P.load(d); self.folder = Path(d); self.cur = 0; self._load_into_ui()
        except (OSError, ValueError, KeyError) as e:
            QMessageBox.warning(self, "No se pudo abrir", str(e))

    def save(self):
        if self.need_folder():
            P.save(self.p, self.folder); self.statusBar().showMessage(f"Guardado en {self.folder}", 4000)

    def save_as(self):
        d = QFileDialog.getExistingDirectory(self, "Elige una carpeta para el proyecto")
        if d:
            self.folder = Path(d); P.save(self.p, self.folder); self._load_into_ui()

    # ---------- voice ----------
    def check_voicebox(self):
        ok = voice.status(self.url.text() if hasattr(self, "url") else voice.URL)
        self.vb_lbl.setText("Voicebox: conectado" if ok else "Voicebox: no responde (abre la app Voicebox)")

    def load_profiles(self):
        try:
            ps = voice.profiles(self.url.text())
        except OSError as e:
            QMessageBox.warning(self, "Voicebox", f"No pude conectar con Voicebox en {self.url.text()}.\n{e}"); return
        self.loading = True; self.profile.clear()
        for x in ps:
            self.profile.addItem(x["name"], x["id"])
        self.loading = False; self.profile.setCurrentIndex(max(0, self.profile.findData(self.p.get("profile_id", "")))); self.meta_edited(); self.check_voicebox()

    def _voice_jobs(self, sections):
        if not self.need_folder():
            return
        if not self.p.get("profile_id"):
            QMessageBox.information(self, "Voz", "Primero elige tu perfil de voz en «Publicación y ajustes» → «Buscar perfiles en Voicebox»."); return
        P.save(self.p, self.folder); (self.folder / "audio").mkdir(exist_ok=True)
        p, folder, base = json.loads(json.dumps(self.p)), self.folder, self.url.text()

        def work(progress, cancelled):
            for k, s in enumerate(sections):
                progress(k / len(sections), f"Generando la voz de «{s['chapter'] or s['id']}»…")
                voice.generate(s.get("tts") or s["text"], p["profile_id"], P.audio_path(folder, s), p.get("lang", "es"), s.get("seed", 7),
                               p.get("tempo", 1.0), base=base, cancel=cancelled)
            return len(sections)
        self.run(work, lambda n: (self.voice_label(), setattr(self, "film", None), self.refresh.start(),
                                  self.statusBar().showMessage(f"Voz lista en {n} escena(s).", 5000)))

    def voice_one(self):
        self.edited(); self._voice_jobs([self.sec()])

    def voice_all(self):
        self._voice_jobs(list(self.p["sections"]))

    def listen(self):
        a = P.audio_path(self.folder, self.sec()) if self.folder else None
        if a and a.exists():
            self.player.setSource(QUrl.fromLocalFile(str(a))); self.player.play()
        else:
            QMessageBox.information(self, "Voz", "Esta escena aún no tiene voz.")

    # ---------- export ----------
    def export_video(self):
        if not self.need_folder():
            return
        if not shutil.which("ffmpeg"):
            QMessageBox.warning(self, "Falta ffmpeg", "Instala ffmpeg y asegúrate de que está en el PATH."); return
        missing = [s["chapter"] or s["id"] for s in self.p["sections"] if not P.audio_path(self.folder, s).exists()]
        if missing and QMessageBox.question(self, "Sin voz", "Estas escenas no tienen voz y saldrán mudas:\n• " + "\n• ".join(missing) + "\n\n¿Exportar igual?") != QMessageBox.Yes:
            return
        P.save(self.p, self.folder); folder = self.folder; p = P.timed(self.p, folder)
        out = folder / f"{P.safe_name(self.p['title'])}.mp4"

        def work(progress, cancelled):
            audio = None
            if not missing:
                audio = folder / "audio" / "narration.wav"
                voice.narration([P.audio_path(folder, s) for s in p["sections"]], p.get("gap", .45), audio)
            render(p, out, audio, progress=lambda f: progress(f, f"Renderizando… {int(f * 100)} %"), cancel=cancelled)
            (folder / "descripcion.md").write_text(P.description(p), encoding="utf-8")
            return out
        self.run(work, lambda o: (QMessageBox.information(self, "Listo", f"Video exportado:\n{o}\n\nDescripción: {o.parent / 'descripcion.md'}"),
                                  QDesktopServices.openUrl(QUrl.fromLocalFile(str(o.parent)))))

    def export_md(self):
        if self.need_folder():
            (self.folder / "descripcion.md").write_text(P.description(self.p), encoding="utf-8")
            self.statusBar().showMessage(f"Descripción guardada en {self.folder / 'descripcion.md'}", 5000)

    # ---------- background jobs ----------
    def run(self, fn, on_done):
        if self.job:
            QMessageBox.information(self, "Espera", "Ya hay una tarea en marcha."); return
        self.job = Job(fn); self.progress.setValue(0); self.progress.show(); self.cancel_btn.show()
        self.job.sig.progress.connect(lambda f, m: (self.progress.setValue(int(f * 100)), m and self.statusBar().showMessage(m)))
        self.job.sig.done.connect(lambda r: (self._job_end(), on_done(r)))
        self.job.sig.failed.connect(lambda e: (self._job_end(), QMessageBox.warning(self, "Algo falló", e)))
        self.pool.start(self.job)

    def _job_end(self):
        self.job = None; self.progress.hide(); self.cancel_btn.hide(); self.statusBar().clearMessage()

    def cancel_job(self):
        if self.job:
            self.job.stop = True

    def closeEvent(self, e):
        if self.folder:
            P.save(self.p, self.folder)
        e.accept()


if __name__ == "__main__":
    app = QApplication(sys.argv); app.setApplicationName("videomaker")
    w = Main(sys.argv[1] if len(sys.argv) > 1 else None); w.show(); sys.exit(app.exec())
