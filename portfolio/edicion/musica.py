#!/usr/bin/env python3
"""Música de fondo: Beethoven, Sonata n.º 14 «Claro de luna», 1.er movimiento (compases iniciales).
La obra es de dominio público y esta interpretación la sintetiza el propio script (piano aditivo),
así que no hay grabación de terceros ni derechos de interpretación.
Uso: python3 musica.py SEGUNDOS salida.wav"""
import sys, wave
import numpy as np

SR = 48000
dur_total = float(sys.argv[1]); out = sys.argv[2]
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11, "B#": 12}
def hz(n):  # "G#3"
    name, octv = n[:-1], int(n[-1]); return 440 * 2 ** ((NOTE[name] + 12 * (octv + 1) - 69) / 12)

def piano(f, d, vel):
    t = np.arange(int(SR * d)) / SR
    env = (1 - np.exp(-t / .004)) * np.exp(-t / (.9 + 220 / f))
    s = sum(a * np.sin(2 * np.pi * f * k * t * (1 + .0004 * k * k)) for k, a in [(1, 1), (2, .42), (3, .2), (4, .09), (5, .05)])
    return vel * env * s

# compases: (bajo, [tresillos por pulso x4])
BARS = [
    (["C#2", "C#3"], [["G#3", "C#4", "E4"]] * 4),
    (["B1", "B2"],   [["G#3", "C#4", "E4"]] * 4),
    (["A1", "A2"],   [["A3", "C#4", "E4"]] * 2 + [["A3", "D4", "F#4"]] * 2),
    (["G#1", "G#2"], [["G#3", "B#3", "F#4"], ["G#3", "C#4", "E4"], ["G#3", "C#4", "D#4"], ["F#3", "B#3", "D#4"]]),
]
BEAT = 1.08                      # adagio sostenuto
bar_len = 4 * BEAT
buf = np.zeros(int(SR * (dur_total + 6)))
def add(x, at):
    i = int(at * SR); j = min(len(buf), i + len(x)); buf[i:j] += x[: j - i]
t, k = 0.0, 0
while t < dur_total + bar_len:
    bass, beats = BARS[k % 4]
    for b in bass: add(piano(hz(b), bar_len + 1.2, .30), t)
    if k % 4 == 2:               # el bajo cambia a F# a mitad del compás 3
        for b in ["F#1", "F#2"]: add(piano(hz(b), 2 * BEAT + 1.2, .28), t + 2 * BEAT)
    for bi, trip in enumerate(beats):
        for ti, n in enumerate(trip):
            add(piano(hz(n), 1.6, .16 if ti else .19), t + bi * BEAT + ti * BEAT / 3)
    if k >= 4 and k % 4 in (0, 1):   # a partir de la segunda vuelta entra la melodía en sol#
        add(piano(hz("G#4"), 2.6, .17), t + 3 * BEAT)
    t += bar_len; k += 1
buf = buf[: int(SR * dur_total)]
fade = int(SR * 3); buf[:fade] *= np.linspace(0, 1, fade); buf[-fade:] *= np.linspace(1, 0, fade)
buf /= max(1e-9, np.abs(buf).max()) / .8
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype("<i2").tobytes())
print(f"{dur_total:.1f} s → {out}")
