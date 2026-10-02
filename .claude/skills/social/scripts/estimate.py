#!/usr/bin/env python3
"""Estimated scene durations (≈160 wpm) so a film can be previewed before any voice exists."""
import json, sys
spec, out = sys.argv[1], sys.argv[2]
d = json.load(open(spec))
sc = {s["id"]: round(len(s["text"].split()) / 2.7 + 0.6, 1) for s in d["sections"]}
sc[d["sections"][-1]["id"]] += 4
open(out, "w").write("// ESTIMATE until narrate.py measures the voice\nwindow.SECTION_DURS = %s;\n" % json.dumps(sc))
print(f"{sum(len(s['text'].split()) for s in d['sections'])} words, ~{sum(sc.values()):.0f} s (estimate) → {out}")
