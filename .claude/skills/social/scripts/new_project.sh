#!/usr/bin/env bash
# /social: start a video project.  bash new_project.sh <slug> [palette]
# Creates portfolio/<slug>/ with the renderer, kit, narration script and both film templates.
set -euo pipefail
SLUG=${1:?usage: new_project.sh <slug> [rainbow|blue-red|ink]}; PALETTE=${2:-rainbow}
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; ROOT="$(git -C "$SKILL" rev-parse --show-toplevel)"
DIR="$ROOT/portfolio/$SLUG"; mkdir -p "$DIR"; cd "$DIR"
cp "$SKILL"/assets/{core.js,kit.js,render.mjs,package.json,package-lock.json} . && cp "$SKILL/scripts/narrate.py" .
[ -f "$SLUG.html" ] || sed "s/setPalette('rainbow')/setPalette('$PALETTE')/" "$SKILL/assets/film-16x9.html" > "$SLUG.html"
[ -f reel.html ] || sed "s/setPalette('rainbow')/setPalette('$PALETTE')/" "$SKILL/assets/film-9x16.html" > reel.html
[ -f sections.json ] || printf '{\n  "title": "",\n  "language": "es",\n  "sections": [\n    {"id": "intro", "chapter": "Introducción", "text": ""},\n    {"id": "cierre", "chapter": "Cierre", "text": ""}\n  ]\n}\n' > sections.json
[ -e node_modules ] || npm i --no-audit --no-fund --silent
for f in audio audio-reel '*.mp4' '*.log' out; do grep -qxF "portfolio/$SLUG/$f" "$ROOT/.gitignore" || echo "portfolio/$SLUG/$f" >> "$ROOT/.gitignore"; done
echo "$DIR ready: edit sections.json (+ sections-reel.json), then the scenes in $SLUG.html / reel.html"
