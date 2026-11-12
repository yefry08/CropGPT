#!/bin/bash
cd "$(dirname "$0")"
Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp & XV=$!
sleep 2; export DISPLAY=:99
node record.js dur.json > rec.log 2>&1 & ND=$!
for i in $(seq 1 120); do [ -f ready ] && break; [ -f error ] && break; sleep 1; done
ffmpeg -loglevel error -y -f x11grab -framerate 30 -video_size 1920x1080 -draw_mouse 0 -i :99 -c:v libx264 -preset ultrafast -crf 16 raw.mkv & FF=$!
sleep 1; touch go
wait $ND
sleep 1; kill -INT $FF; wait $FF; kill $XV
echo done
