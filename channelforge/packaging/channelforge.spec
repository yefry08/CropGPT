# PyInstaller spec for ChannelForge (onedir; Windows, macOS, Linux).
# Build from the channelforge/ project folder:   pyinstaller --noconfirm packaging/channelforge.spec
#
# Produces two executables that share one bundle:
#   ChannelForge      windowed desktop app (a .app bundle on macOS)
#   channelforge-cli  console CLI (doctor, omniroute setup, secrets) — Windows needs a console exe for output
#
# External tools are NOT bundled (see README "Prerequisites"): ffmpeg/ffprobe, Node 22+, the claude CLI,
# OmniRoute, Google Chrome, and the Python environment that runs the OpenMontage engine.
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules

ROOT = SPECPATH + "/.."
datas = [
    (ROOT + "/channelforge/pipelines", "channelforge/pipelines"),
    (ROOT + "/channelforge/engine_support", "channelforge/engine_support"),
    (ROOT + "/channelforge/devtools/smoke_artifacts.json", "channelforge/devtools"),
]
datas += collect_data_files("faster_whisper")          # bundled Silero VAD model
datas += collect_data_files("yt_dlp")
binaries = collect_dynamic_libs("ctranslate2")

hiddenimports = (
    collect_submodules("channelforge")                 # stage handlers are looked up by name at runtime
    + collect_submodules("yt_dlp.extractor")
    + ["google_auth_oauthlib.flow", "google.auth.transport.requests", "google.oauth2.credentials"]
)

a = Analysis(
    [SPECPATH + "/launcher.py"],
    pathex=[ROOT],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    excludes=["tkinter", "PySide6.QtWebEngineCore", "PySide6.QtWebEngineWidgets", "PySide6.Qt3DCore",
              "PySide6.QtQuick3D", "PySide6.QtCharts", "PySide6.QtDataVisualization", "pytest", "pytestqt"],
    noarchive=False,
)
pyz = PYZ(a.pure)

icon = None
gui = EXE(pyz, a.scripts, [], exclude_binaries=True, name="ChannelForge", console=False,
          icon=icon, upx=False)
cli = EXE(pyz, a.scripts, [], exclude_binaries=True, name="channelforge-cli", console=True,
          icon=icon, upx=False)
coll = COLLECT(gui, cli, a.binaries, a.datas, name="ChannelForge", upx=False)

if sys.platform == "darwin":
    app = BUNDLE(
        coll,
        name="ChannelForge.app",
        icon=icon,
        bundle_identifier="app.channelforge.desktop",
        info_plist={
            "CFBundleShortVersionString": "0.1.0",
            "NSHighResolutionCapable": True,
            "LSMinimumSystemVersion": "12.0",
        },
    )
