#!/usr/bin/env python3
"""Stand-in for `claude` producing a Channel 2 episode (tests only).

Uses the real tools/cf_checkpoint.py in the project, so gate enforcement is exercised.
Knobs (env): FAKE_STALE_FIRST=1 → first research cites a 30-day-old source;
FAKE_WORDS → words in the first script. A ChannelForge instruction "rewrite it to ~N words"
sets the next script to N words.
"""

import json
import os
import re
import subprocess
import sys
import uuid
from datetime import date, timedelta
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
_m = (re.search(r"project folder\n(\S+)", prompt) or re.search(r"Read (\S+)/checkpoint_\*\.json", prompt)
      or re.search(r"project '[^']+' in (\S+), pipeline", prompt))
proj = Path(_m.group(1))
tool = [sys.executable, str(proj / "tools" / "cf_checkpoint.py"), str(proj)]
st_f = proj / ".fake.json"
st = json.loads(st_f.read_text()) if st_f.exists() else {"research": 0, "words": int(os.environ.get("FAKE_WORDS", "1300"))}
m = re.search(r"rewrite it to ~(\d+) words", prompt)
if m:
    st["words"] = int(m.group(1))


def cp(stage, status, *arts, approved=False):
    cmd = tool + [stage, status] + [f"--artifact={a}" for a in arts] + (["--approved"] if approved else [])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"checkpoint tool refused: {r.stderr}")


def status(stage):
    p = proj / f"checkpoint_{stage}.json"
    return json.loads(p.read_text())["status"] if p.exists() else None


def artifacts(stage):
    return [f"{k}={v}" for k, v in json.loads((proj / f"checkpoint_{stage}.json").read_text())["artifacts"].items()]


try:
    ok = re.search(r"for gate '(\w+)': APPROVED", prompt)
    if ok and status(ok.group(1)) == "awaiting_human":
        cp(ok.group(1), "completed", *artifacts(ok.group(1)), approved=True)
    change = re.search(r"for gate '(\w+)': CHANGES REQUESTED", prompt)
    changing = change.group(1) if change else None
    if changing == "script" and "RESEARCH:" in prompt:                    # redo research, then the script
        (proj / "checkpoint_research.json").unlink()
    today = date.today()
    if status("research") != "completed":
        stale = os.environ.get("FAKE_STALE_FIRST") and st["research"] == 0
        st["research"] += 1
        stories = [{"id": f"st{k}", "headline": f"Story {k}", "sources": [
            {"url": f"https://lab{k}.example.com/post", "publisher": f"Lab {k}", "type": "lab_blog",
             "published_at": str(today - timedelta(days=30 if (stale and k == 1) else 2))}]} for k in range(1, 6)]
        (proj / "artifacts" / "research.json").write_text(json.dumps({"stories": stories}))
        cp("research", "completed", "research=artifacts/research.json")
    if status("script") in (None, "in_progress") or changing == "script" or (m and status("script") != "completed"):
        per = max(1, st["words"] // 5)
        secs = [{"id": f"s{k}", "text": " ".join(f"word{k}_{i}" for i in range(per)), "start_seconds": 0,
                 "end_seconds": 1} for k in range(5)]
        (proj / "artifacts" / "script.json").write_text(json.dumps({"version": "1.0", "title": "AI News",
                                                                     "total_duration_seconds": 540, "sections": secs}))
        (proj / "artifacts" / "sources.json").write_text(json.dumps({"claims": [{"id": "c1", "text": "Lab 1 released X",
            "section_id": "s1", "kind": "fact", "sources": [{"url": "https://lab1.example.com/post", "type": "lab_blog"}]}]}))
        cp("script", "awaiting_human", "script=artifacts/script.json")
        finish("script ready")
    if status("script") == "awaiting_human":
        finish("script awaiting approval")
    if status("narration") != "completed":
        finish("waiting for ChannelForge narration")
    if status("film") in (None, "in_progress") or changing == "film":
        (proj / "film").mkdir(exist_ok=True)
        (proj / "film" / "news.html").write_text("<!doctype html><title>fake film</title>")
        cp("film", "awaiting_human", "film=film/news.html")
        finish("film ready")
    finish("nothing to do")
finally:
    st_f.write_text(json.dumps(st))
