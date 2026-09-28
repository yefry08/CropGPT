#!/usr/bin/env bash
# Build ChannelForge for Linux (used as the CI smoke build). Run from the channelforge/ folder.
set -euo pipefail
python3 -m venv .venv-build
.venv-build/bin/python -m pip install --upgrade pip
.venv-build/bin/python -m pip install ".[packaging]"
.venv-build/bin/pyinstaller --noconfirm --clean packaging/channelforge.spec
dist/ChannelForge/channelforge-cli --help
