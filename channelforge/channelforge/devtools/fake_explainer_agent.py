#!/usr/bin/env python3
"""Stand-in for `claude` driving OpenMontage's animated-explainer (tests only).

Speaks claude's stream-json protocol and walks the manifest's stages: non-gated stages are
written 'completed', gated ones 'awaiting_human' (then it ends its turn, as the checkpoint
protocol requires). Checkpoints are written as plain JSON with minimal artifacts — this
exercises ChannelForge's gates, not OpenMontage's artifact schemas.

Behaviour knobs (env):
  FAKE_COPY_TEXT   first script attempt copies this text (to trip the originality check)
  FAKE_WORDS       words in the first original script (duration = words / 150 wpm)
It renders a real 1920x1080 MP4 with ffmpeg at compose, sized from the script's word count.
A ChannelForge re-plan instruction "revise it to ~N words" sets the next script to N words.
"""

import json
import os
import re
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import yaml

args = sys.argv[1:]
prompt = args[args.index("-p") + 1]
session = args[args.index("--resume") + 1] if "--resume" in args else str(uuid.uuid4())


def emit(ev):
    ev.setdefault("session_id", session)
    print(json.dumps(ev), flush=True)


def finish(text):
    emit({"type": "result", "subtype": "success", "is_error": False, "result": text, "total_cost_usd": 0.002,
          "modelUsage": {"fake": {"inputTokens": 100, "outputTokens": 50, "costUSD": 0.002}}})
    sys.exit(0)


emit({"type": "system", "subtype": "init", "model": "fake"})
pid = re.search(r"project '([^']+)'", prompt).group(1)
pipeline = re.search(r"'(animated-explainer)'", prompt).group(1)
proj = Path("projects") / pid
(proj / "artifacts").mkdir(parents=True, exist_ok=True)
(proj / "renders").mkdir(parents=True, exist_ok=True)
state_f = proj / ".fake_state.json"
st = json.loads(state_f.read_text()) if state_f.exists() else {"script_attempt": 0, "words": int(os.environ.get("FAKE_WORDS", "800"))}
manifest = yaml.safe_load(Path(f"pipeline_defs/{pipeline}.yaml").read_text())
stages = [(s["name"], bool(s.get("human_approval_default"))) for s in manifest["stages"]]
stages = stages[:[n for n, _ in stages].index("compose") + 1]


def cp_path(stage):
    return proj / f"checkpoint_{stage}.json"


def write(stage, status, artifacts=None, approved=False):
    cp_path(stage).write_text(json.dumps({
        "version": "1.0", "project_id": pid, "pipeline_type": pipeline, "stage": stage, "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(), "human_approval_required": dict(stages)[stage],
        "human_approved": approved, "artifacts": artifacts or {}}))


def status(stage):
    p = cp_path(stage)
    return json.loads(p.read_text())["status"] if p.exists() else None


m = re.search(r"revise it to ~(\d+) words", prompt)
if m:
    st["words"] = int(m.group(1))

WORDS = ("the data shows how hosting a major tournament shifts public spending and national image in ways "
         "that last well beyond the final whistle according to official budget records").split()


def make_script():
    attempt = st["script_attempt"]
    st["script_attempt"] += 1
    if attempt == 0 and os.environ.get("FAKE_COPY_TEXT"):
        text = os.environ["FAKE_COPY_TEXT"]
        claims = [{"id": "c1", "section_id": "s1", "text": "Unsourced claim", "kind": "fact", "sources": []}]
    else:
        text = " ".join(WORDS[i % len(WORDS)] + ("" if i % 23 else f" {i}") for i in range(st["words"]))
        claims = [{"id": "c1", "section_id": "s1", "text": "Public spending on the 2014 World Cup",
                   "kind": "statistic", "sources": [{"url": "https://data.worldbank.org/indicator/GC.XPN.TOTL.GD.ZS",
                                                      "publisher": "World Bank", "type": "dataset"}]}]
    (proj / "artifacts" / "sources.json").write_text(json.dumps({"claims": claims}))
    return {"version": "1.0", "title": "Fake", "total_duration_seconds": round(st["words"] / 150 * 60),
            "sections": [{"id": "s1", "text": text, "start_seconds": 0, "end_seconds": 60}]}


def render():
    dur = round(st["words"] / 150 * 60)
    out = proj / "renders" / "final.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=gray:s=1920x1080:r=1:d={dur}",
                    "-f", "lavfi", "-i", f"sine=f=220:d={dur}", "-c:v", "libx264", "-preset", "ultrafast",
                    "-tune", "stillimage", "-c:a", "aac", "-shortest", str(out)], check=True)
    return {"render_report": {"version": "1.0", "outputs": [{"path": f"renders/final.mp4", "format": "mp4",
            "resolution": "1920x1080", "duration_seconds": dur}]}}


gate_ok = re.search(r"for gate '(\w+)': APPROVED", prompt)
if gate_ok and status(gate_ok.group(1)) == "awaiting_human":
    g = gate_ok.group(1)
    write(g, "completed", json.loads(cp_path(g).read_text())["artifacts"], approved=True)
change = re.search(r"for gate '(\w+)': CHANGES REQUESTED", prompt)

try:
    for stage, gated in stages:
        s = status(stage)
        if s == "completed":
            continue
        if s == "awaiting_human" and not (change and change.group(1) == stage):
            finish(f"{stage} awaiting approval")
        arts = {"script": make_script()} if stage == "script" else render() if stage == "compose" else {}
        emit({"type": "assistant", "message": {"content": [{"type": "text", "text": f"working on {stage}"}]}})
        if gated:
            write(stage, "awaiting_human", arts)
            finish(f"{stage} ready for review")
        write(stage, "completed", arts)
    finish("compose complete")
finally:
    state_f.write_text(json.dumps(st))
