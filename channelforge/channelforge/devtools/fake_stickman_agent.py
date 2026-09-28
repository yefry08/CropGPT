#!/usr/bin/env python3
"""Stand-in for `claude` producing a Channel 1 (stickman-omni) job (tests only).

Uses the real tools/cf_checkpoint.py. FAKE_BAD_PROMPTS_FIRST=1 → the first clips.json breaks the
Phase B contract. FAKE_WORDS sets the script length (default 1300 words ≈ 520 s at 150 wpm).
"""

import json
import math
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path

args = sys.argv[1:]
prompt = args[args.index("-p") + 1]
session = args[args.index("--resume") + 1] if "--resume" in args else str(uuid.uuid4())


def emit(ev):
    ev.setdefault("session_id", session)
    print(json.dumps(ev), flush=True)


def finish(text):
    emit({"type": "result", "subtype": "success", "is_error": False, "result": text, "total_cost_usd": 0.001,
          "modelUsage": {"fake": {"inputTokens": 10, "outputTokens": 5, "costUSD": 0.001}}})
    sys.exit(0)


emit({"type": "system", "subtype": "init", "model": "fake"})
_m = (re.search(r"project\nfolder (\S+) \(already", prompt) or re.search(r"Read (\S+)/checkpoint_\*\.json", prompt)
      or re.search(r"project '[^']+' in (\S+), pipeline", prompt))
proj = Path(_m.group(1))
tool = [sys.executable, str(proj / "tools" / "cf_checkpoint.py"), str(proj)]
st_f = proj / ".fake.json"
st = json.loads(st_f.read_text()) if st_f.exists() else {"prompts": 0}


def cp(stage, status, *arts, approved=False):
    r = subprocess.run(tool + [stage, status] + [f"--artifact={a}" for a in arts] + (["--approved"] if approved else []),
                       capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"checkpoint tool refused: {r.stderr}")


def status(stage):
    p = proj / f"checkpoint_{stage}.json"
    return json.loads(p.read_text())["status"] if p.exists() else None


def arts(stage):
    return [f"{k}={v}" for k, v in json.loads((proj / f"checkpoint_{stage}.json").read_text())["artifacts"].items()]


LOCKS = ("16:9. Flat pitch-black canvas, pure white line art. A minimalist 2D stick figure with a hollow circular "
         "head. Audio: synchronized sound effects only; no narration, no speech, no music. Audio voiceover only is "
         "NOT used; no speech bubbles, no dialogue boxes, no visible words.")

try:
    ok = re.search(r"for gate '(\w+)': APPROVED", prompt)
    if ok and status(ok.group(1)) == "awaiting_human":
        cp(ok.group(1), "completed", *arts(ok.group(1)), approved=True)
    change = re.search(r"for gate '(\w+)': CHANGES REQUESTED", prompt)
    if status("direction") in (None, "in_progress") or (change and change.group(1) == "direction") or \
            ("rewrite it to" in prompt and status("direction") != "completed"):
        words = int(os.environ.get("FAKE_WORDS", "1300"))
        m = re.search(r"rewrite it to ~(\d+) words", prompt)
        words = int(m.group(1)) if m else words
        n = 54
        per = max(1, words // n)
        (proj / "artifacts" / "proposal.md").write_text("# Phase A\nGolden hook ... discussion.")
        secs = [{"id": f"c{k + 1:02d}", "text": " ".join(f"palabra{k}_{i}" for i in range(per)), "start_seconds": k * 10,
                 "end_seconds": k * 10 + 10} for k in range(n)]
        (proj / "artifacts" / "script.json").write_text(json.dumps({"version": "1.0", "title": "Licitaciones",
                                                                     "total_duration_seconds": 540, "sections": secs}))
        (proj / "artifacts" / "sources.json").write_text(json.dumps({"claims": [{"id": "c1", "kind": "fact",
            "text": "El portal publica contratos en formato OCDS", "sources": [{"url": "https://standard.open-contracting.org/",
                                                                               "type": "official"}]}]}))
        cp("direction", "awaiting_human", "proposal=artifacts/proposal.md", "script=artifacts/script.json")
        finish("Phase A ready")
    if status("direction") == "awaiting_human":
        finish("direction awaiting approval")
    if status("narration") != "completed":
        finish("waiting for ChannelForge narration")
    if status("prompts") in (None, "in_progress") or (change and change.group(1) == "prompts"):
        film_s = json.loads((proj / "artifacts" / "narration.json").read_text())["film_s"]
        n = math.ceil(film_s / 10) + 3
        bad = os.environ.get("FAKE_BAD_PROMPTS_FIRST") and st["prompts"] == 0
        st["prompts"] += 1
        clips = [{"id": f"c{k + 1:02d}", "slot_s": 10, "vo_start": k * 10, "vo_end": k * 10 + 10,
                  "prompt": (f"Clip {k + 1}. " + ("A stick figure in #FF0000 light." if bad else LOCKS)
                             + " [0–3s] enters. [3–7s] opens a vault. [7–10s] leaps right.")} for k in range(n)]
        (proj / "artifacts" / "clips.json").write_text(json.dumps({"clips": clips}))
        cp("prompts", "awaiting_human", "clips=artifacts/clips.json")
        finish("Phase B ready")
    finish("nothing to do")
finally:
    st_f.write_text(json.dumps(st))
