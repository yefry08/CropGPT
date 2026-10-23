#!/usr/bin/env bash
# macOS / Linux launcher: creates a virtual environment on first run, then opens the app.
cd "$(dirname "$0")"
[ -d .venv ] || { python3 -m venv .venv && .venv/bin/pip install -r requirements.txt; }
exec .venv/bin/python videomaker_app.py "$@"
