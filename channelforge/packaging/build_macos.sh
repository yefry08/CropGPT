#!/usr/bin/env bash
# Build ChannelForge for macOS. Run from the channelforge/ folder:  bash packaging/build_macos.sh
# Builds for the architecture of the Python you run it with (arm64 on Apple silicon).
set -euo pipefail
python3.11 -m venv .venv-build
.venv-build/bin/python -m pip install --upgrade pip
.venv-build/bin/python -m pip install ".[packaging]"
.venv-build/bin/pyinstaller --noconfirm --clean packaging/channelforge.spec
dist/ChannelForge.app/Contents/MacOS/channelforge-cli --help
# Unsigned builds: Gatekeeper blocks the first launch. Either right-click > Open once, or sign it:
#   codesign --deep --force --options runtime --sign "Developer ID Application: <you>" dist/ChannelForge.app
echo "Built dist/ChannelForge.app — CLI: dist/ChannelForge.app/Contents/MacOS/channelforge-cli doctor"
