"""M3: Channel 2 (AI & AI-safety news) on the hand-drawn engine."""

import json
import subprocess
import sys
import time
from datetime import date, timedelta
from pathlib import Path
from types import SimpleNamespace

import pytest

from channelforge.agent.claude_runner import AgentTarget
from channelforge.agent.supervisor import AgentSupervisor
from channelforge.config import AppConfig, RouterConfig
from channelforge.db import JobDB
from channelforge.jobs.channels import RECIPES
from channelforge.jobs.runner import JobRunner
from channelforge.pipeline import duration, handdrawn, news
from channelforge.pipeline.app_stages import AppStages
from channelforge.router.llm import LLMRouter
from channelforge.secrets import OMNIROUTE_API_KEY

ROOT = Path(__file__).parents[1]
FAKE = ROOT / "channelforge" / "devtools" / "fake_news_agent.py"
CF_CHECKPOINT = ROOT / "channelforge" / "engine_support" / "cf_checkpoint.py"
MANIFEST = ROOT / "channelforge" / "pipelines" / "hand-drawn-news.yaml"
SKILL = Path(__file__).resolve().parents[2] / "engines" / "tools" / "skills" / "hand-drawn-canvas-animation"

# ---------------------------------------------------------------- research freshness


def research(tmp_path, stories):
    p = tmp_path / "research.json"
    p.write_text(json.dumps({"stories": stories}))
    return p


def story(i, days=1, typ="lab_blog", url=None, **kw):
    return {"id": f"st{i}", "headline": "h", "sources": [{"url": url or f"https://lab.example.com/{i}",
            "publisher": "Lab", "type": typ, "published_at": str(date(2026, 9, 27) - timedelta(days=days))}], **kw}


TODAY = date(2026, 9, 27)


def test_fresh_primary_research_passes(tmp_path):
    assert news.check_research(research(tmp_path, [story(i) for i in range(3)]), TODAY) == []


def test_old_source_rejected(tmp_path):
    probs = news.check_research(research(tmp_path, [story(0, days=8), story(1), story(2)]), TODAY)
    assert "outside 2026-09-20..2026-09-27" in probs[0]["problem"]


def test_future_dated_source_rejected(tmp_path):
    assert news.check_research(research(tmp_path, [story(0, days=-3), story(1), story(2)]), TODAY)


def test_old_arxiv_id_rejected_even_if_dated_recently(tmp_path):
    s = story(0, typ="arxiv", url="https://arxiv.org/abs/2403.01234")
    assert "arXiv id from 2024-03" in news.check_research(research(tmp_path, [s, story(1), story(2)]), TODAY)[0]["problem"]


def test_news_only_story_needs_primary_or_reason(tmp_path):
    probs = news.check_research(research(tmp_path, [story(0, typ="news"), story(1), story(2)]), TODAY)
    assert "no primary source" in probs[0]["problem"]
    ok = story(0, typ="news", no_primary_reason="leak reported by several outlets; lab declined comment")
    assert news.check_research(research(tmp_path, [ok, story(1), story(2)]), TODAY) == []


def test_primary_must_be_listed_first(tmp_path):
    s = story(0, typ="news")
    s["sources"].append({"url": "https://lab.example.com/x", "type": "lab_blog", "published_at": "2026-09-26"})
    assert "primary source first" in news.check_research(research(tmp_path, [s, story(1), story(2)]), TODAY)[0]["problem"]

# ---------------------------------------------------------------- checkpoint tool (what the agent runs)


def make_project(tmp_path):
    proj = tmp_path / "proj"
    (proj / "artifacts").mkdir(parents=True)
    (proj / "project.json").write_text(json.dumps({"project_id": "p", "manifest": str(MANIFEST)}))
    (proj / "artifacts" / "research.json").write_text("{}")
    (proj / "artifacts" / "script.json").write_text("{}")
    return proj


def cp(proj, *a):
    return subprocess.run([sys.executable, str(CF_CHECKPOINT), str(proj), *a], capture_output=True, text=True)


def test_checkpoint_tool_enforces_gates_order_and_ownership(tmp_path):
    proj = make_project(tmp_path)
    assert cp(proj, "script", "awaiting_human", "--artifact", "script=artifacts/script.json").returncode == 4  # research first
    assert cp(proj, "research", "completed").returncode == 5                                                    # artifact required
    assert cp(proj, "research", "completed", "--artifact", "research=artifacts/research.json").returncode == 0
    r = cp(proj, "script", "completed", "--artifact", "script=artifacts/script.json")
    assert r.returncode == 3 and "GATE VIOLATION" in r.stderr
    assert cp(proj, "script", "awaiting_human", "--artifact", "script=artifacts/script.json").returncode == 0
    assert cp(proj, "script", "completed", "--approved", "--artifact", "script=artifacts/script.json").returncode == 0
    assert cp(proj, "narration", "completed").returncode == 2                                                   # app-owned
    assert list((proj / "history").glob("checkpoint_script.*.json"))                                            # history kept

# ---------------------------------------------------------------- channel 2 end to end


def fake_synth():
    def synth(text, out):
        secs = len(text.split()) / 150 * 60
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"sine=f=330:d={secs:.2f}", "-f", "wav",
                        str(out)], check=True)
    return synth


class FakeRenderer:
    """Stands in for render.mjs (a 9-minute canvas render takes ~10 min); mux is the real ffmpeg mix."""
    mux = staticmethod(handdrawn.mux)
    calls = []

    @staticmethod
    def preview_grid(html, chrome_bin=""):
        out = html.parent / "out"
        out.mkdir(exist_ok=True)
        grid = out / f"{html.stem}-grid.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=s=640x360:d=1", "-frames:v", "1",
                        str(grid)], check=True)
        FakeRenderer.calls.append("grid")
        return grid

    @staticmethod
    def render_film(html, chrome_bin=""):
        nar = json.loads((html.parent.parent / "artifacts" / "narration.json").read_text())
        d, out = nar["film_s"], html.parent / "out"
        video, score = out / f"{html.stem}.mp4", out / f"{html.stem}-score.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=beige:s=1920x1080:r=1:d={d}",
                        "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", str(video)], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"sine=f=110:d={d}", str(score)], check=True)
        FakeRenderer.calls.append("render")
        return video, score


def test_channel2_end_to_end(tmp_path, omni, monkeypatch):
    """Stale research + too-short narration are caught before any render; then preview gate, render,
    mix, ffprobe duration gate, outputs."""
    from conftest import fake_words, smart_reply
    omni.reply_fn = smart_reply
    monkeypatch.setenv("FAKE_STALE_FIRST", "1")
    monkeypatch.setenv("FAKE_WORDS", "600")                   # 600 words → 240 s narration: too short
    engines = tmp_path / "engines"
    (engines / "tools" / "skills").mkdir(parents=True)
    cfg = AppConfig(engines_dir=engines, output_root=tmp_path / "home" / "jobs", router=RouterConfig(omniroute_url=omni.url))
    db = JobDB(tmp_path / "jobs.db")
    sup = AgentSupervisor(db, [AgentTarget("omniroute:channelforge-primary", "omniroute", omni.url, OMNIROUTE_API_KEY,
                                           "channelforge-primary")], claude_bin=str(FAKE))
    FakeRenderer.calls = []
    runner = JobRunner(cfg, db, supervisor=sup, recipes=RECIPES, router=LLMRouter(cfg.router, db),
                       app_stages=AppStages(fake_synth, renderer=FakeRenderer), transcribe=fake_words)
    jid = db.create_job(channel="ai_news", input_text="This week in AI safety", language="es", visual_style="sketchbook",
                        render_backend="hand_drawn_canvas", budget_cap_usd=3.0, auto_approve=True)
    for _ in range(40):
        job = db.claim_next_queued()
        if job is None:
            break
        runner.run_job(job)
    j = db.get_job(jid)
    ev = [e["message"] for e in db.events(jid)]
    assert j["status"] == "awaiting_approval", (j["error"], ev[-8:])
    runner.decide(db.approvals("pending", job_id=jid)[0]["id"], "approved")
    j = db.get_job(jid)
    assert j["status"] == "scheduled" and len(db.publish_items(jid)) == 16, (j["error"], ev[-8:])
    assert any("RESEARCH:" in m or "script checks failed" in m for m in ev)
    assert any(m.startswith("NARRATION CHECK: The synthesised narration runs 242 s") for m in ev)   # 240 s + 4 pauses
    assert not any("crashed" in m for m in ev), ev
    assert FakeRenderer.calls == ["grid", "render"]           # nothing rendered until the length was right
    out = Path(j["output_dir"])
    dc = duration.check(out / "long.mp4")
    assert dc.passed, dc
    probe = duration.probe(out / "long.mp4")
    assert {s["codec_type"] for s in probe["streams"]} == {"video", "audio"}
    assert (out / "sources.json").exists()
    proj = Path(cfg.output_root.parent / "projects" / j["project_id"])
    assert json.loads((proj / "artifacts" / "narration.json").read_text())["sections"][0]["start"] == 0
    appr = [a for a in db.approvals(status=None, job_id=jid) if a["gate"] == "film"]
    assert json.loads(appr[-1]["payload"])["preview_image"].endswith("news-grid.jpg")
    assert j["directive"] is None


def test_brief_points_the_agent_at_the_skill_and_window(tmp_path):
    cfg = AppConfig(engines_dir=tmp_path / "engines", output_root=tmp_path / "home" / "jobs")
    from channelforge.jobs.channels import build_engine_job
    t = time.mktime((2026, 9, 27, 12, 0, 0, 0, 0, -1))
    ej = build_engine_job(cfg, {"id": 7, "channel": "ai_news", "input_text": "focus: evals", "language": "en",
                                "visual_style": "sketchbook", "render_backend": "hand_drawn_canvas",
                                "budget_cap_usd": 3.0, "created_at": t}, RECIPES)
    assert ej.stages == ["research", "script", "narration", "film", "compose"]
    assert ej.app_stages == {"narration", "compose"}
    assert ej.add_dirs == (cfg.engines_dir / "tools" / "skills" / "hand-drawn-canvas-animation",)
    assert "window 2026-09-20 .. 2026-09-27" in ej.initial_prompt
    assert f"{ej.add_dirs[0]}/SKILL.md" in ej.initial_prompt and "{SKILL}" not in ej.initial_prompt

# ---------------------------------------------------------------- the real renderer (slow)


@pytest.mark.slow
@pytest.mark.skipif(not SKILL.exists(), reason="hand-drawn skill not cloned")
def test_real_render_and_mux(tmp_path):
    film = tmp_path / "film"
    film.mkdir()
    for f in ("assets/core.js", "scripts/render.mjs", "scripts/package.json"):
        (film / Path(f).name).write_bytes((SKILL / f).read_bytes())
    (film / "tiny.html").write_text("""<!doctype html><meta charset="utf-8"><canvas id="c"></canvas>
<script src="core.js"></script><script>
function s(c, tau) { paper(c); c.strokeStyle = PAL.ink; c.lineWidth = 6; selfDraw(c, ellPts(CX, CY, 300, 200, 0, 40), tau / 3, 1, 2, true); }
function score(ac, t0, dest) { const m = ac.createGain(); m.gain.value = .3; m.connect(dest); for (let t = 0; t < 4; t += .5) note(ac, m, 440, t0, t, .4); }
defineFilm({ format: { ar: '16:9', width: 1920 }, fps: 24, score, timeline: [{ name: 'a', dur: 4, fn: s }] });
</script>""")
    video, score = handdrawn.render_film(film / "tiny.html")
    assert score is not None
    nar = tmp_path / "n.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=220:d=3", str(nar)], check=True)
    out = handdrawn.mux(video, nar, score, tmp_path / "final.mp4")
    info = duration.probe(out)
    assert abs(float(info["format"]["duration"]) - 4.0) < 0.2
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1920, 1080)
    assert handdrawn.preview_grid(film / "tiny.html").exists()
