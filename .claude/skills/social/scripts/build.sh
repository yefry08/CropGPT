#!/usr/bin/env bash
# /social: estimate timing → (voice) → render → mix → verify.   Run inside portfolio/<slug>/.
#   bash build.sh <film.html> <sections.json> <timing.js> <audio-dir> <out.mp4> [narrate.py options…]
# Voice is generated only when GEMINI_API_KEY is set and <audio-dir>/narration.wav is missing; otherwise the
# existing takes are re-timed (--reuse). Without any voice it renders a preview on estimated timing.
set -euo pipefail
FILM=$1 SPEC=$2 TIMING=$3 AUDIO=$4 OUT=$5; shift 5
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; NARRATE="python3 narrate.py --spec $SPEC --audio $AUDIO --timing $TIMING"
if [ -n "${GEMINI_API_KEY:-}" ] && [ ! -f "$AUDIO/narration.wav" ]; then $NARRATE "$@"
elif [ -d "$AUDIO/raw" ]; then $NARRATE --reuse "$@"
else python3 "$SKILL/scripts/estimate.py" "$SPEC" "$TIMING"; fi
export CHROME="${CHROME:-$(python3 -c 'import sys; sys.path.insert(0, "'"$(git rev-parse --show-toplevel)"'/channelforge"); from channelforge.pipeline.handdrawn import chrome_env; print(chrome_env().get("CHROME",""))' 2>/dev/null || true)}"
node render.mjs "$FILM" --out out
RAW="out/$(basename "$FILM" .html)-final.mp4"
if [ -f "$AUDIO/narration.wav" ]; then
  ffmpeg -v error -y -i "$RAW" -i "$AUDIO/narration.wav" -filter_complex \
    "[1:a]apad[n];[0:a]volume=0.18[s];[n][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
else
  ffmpeg -v error -y -i "$RAW" -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 160k -movflags +faststart "$OUT"
fi
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact "$OUT"
ffmpeg -v error -i "$OUT" -f null - && echo "decode-ok: $OUT"
rm -rf "out/$(basename "$FILM" .html)-frames"
