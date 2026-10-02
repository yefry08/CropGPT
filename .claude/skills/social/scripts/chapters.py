#!/usr/bin/env python3
"""YouTube chapters from the measured timing: python3 chapters.py sections.json timing.js"""
import json, re, sys
spec = json.load(open(sys.argv[1])); dur = json.loads(re.search(r"=\s*(\{.*\})", open(sys.argv[2]).read()).group(1))
t = 0.0
for s in spec["sections"]:
    print(f"{int(t // 60)}:{int(t % 60):02d} {s.get('chapter', s['id'])}"); t += dur[s["id"]]
