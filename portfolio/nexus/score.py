"""Quiet original score for the recording: soft chord pads, a pulsing pluck, and a paper whoosh at each scene change."""
import json, wave, numpy as np
SR = 44100
import sys
SRC, DST = (sys.argv[1:3] + ["out/starts.json", "out/score.wav"][len(sys.argv[1:3]):])
d = json.load(open(SRC)); total = d["total"]; starts = d["starts"]
n = int(total * SR); t = np.arange(n) / SR; out = np.zeros((n, 2))
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 62], [55, 59, 62, 66]]  # Am7 Fmaj7 Cadd9 G(maj7)
bar = 2.6
rng = np.random.default_rng(3)
for k in range(int(total / bar) + 1):
    t0 = k * bar; i0 = int(t0 * SR); L = min(int(bar * 1.4 * SR), n - i0)
    if L <= 0: break
    tt = np.arange(L) / SR; env = np.minimum(1, tt / .5) * np.exp(-tt / 2.4)
    for j, m in enumerate(chords[k % 4]):
        f = hz(m); s = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * 2.003 * f * tt)) * env * .045
        out[i0:i0 + L, j % 2] += s; out[i0:i0 + L, 1 - j % 2] += s * .6
    for b in range(4):  # gentle pluck pulse
        p0 = int((t0 + b * bar / 4) * SR); pl = min(int(.5 * SR), n - p0)
        if pl <= 0: continue
        pt = np.arange(pl) / SR; m = chords[k % 4][(b * 2 + k) % 4] + 12
        s = np.sin(2 * np.pi * hz(m) * pt) * np.exp(-pt / .12) * .05
        out[p0:p0 + pl] += s[:, None] * [.7, 1.0]
fade = np.minimum(1, np.minimum(t / 1.0, (total - t) / 2.5))[:, None]
out = np.tanh(out * fade * 1.4) * .8
with wave.open(DST, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('score', total)
