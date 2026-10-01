#!/usr/bin/env bash
# Palantir (ES, ~5 min, 16:9): voice → film timed to the voice → mix → loudness-normalised MP4.
#   GEMINI_API_KEY=... bash build.sh [voice]       (voice: a Gemini prebuilt voice, default Charon)
# Re-time existing takes without the API: python3 narrate.py --reuse --tempo 1.0
# Without any narration it renders a silent-voice preview on the estimated timing.
set -euo pipefail
cd "$(dirname "$0")"
# new voice only when asked (key set and no narration yet); text-only prompts read at ~170 wpm, no tempo change needed
if [ -n "${GEMINI_API_KEY:-}" ] && [ ! -f audio/narration.wav ]; then python3 narrate.py --voice "${1:-Charon}" --tempo 1.0; fi
[ -e node_modules ] || npm i --no-audit --no-fund
node render.mjs palantir.html --out out
if [ -f audio/narration.wav ]; then
  ffmpeg -v error -y -i out/palantir-final.mp4 -i audio/narration.wav -filter_complex \
    "[1:a]apad[n];[0:a]volume=0.18[s];[n][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart palantir-es.mp4
else
  ffmpeg -v error -y -i out/palantir-final.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 160k \
    -movflags +faststart palantir-es-preview-sin-voz.mp4
fi
ls -la *.mp4
