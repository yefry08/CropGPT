"""M4: Channel 1 (Contractor AI) — omni/veo clips backend and character-animation backend."""

import json
import os
import subprocess
from pathlib import Path

import pytest

os.environ.setdefault("CF_X264_PRESET", "ultrafast")

from channelforge.agent.claude_runner import AgentTarget  # noqa: E402
from channelforge.agent.supervisor import AgentSupervisor  # noqa: E402
from channelforge.config import AppConfig, RouterConfig  # noqa: E402
from channelforge.db import JobDB  # noqa: E402
from channelforge.jobs.channels import RECIPES, build_engine_job  # noqa: E402
from channelforge.jobs.runner import JobRunner  # noqa: E402
from channelforge.pipeline import duration, omni  # noqa: E402
from channelforge.pipeline.app_stages import AppStages  # noqa: E402
from channelforge.router.llm import LLMRouter  # noqa: E402
from channelforge.secrets import OMNIROUTE_API_KEY  # noqa: E402
from test_m3_news import fake_synth  # noqa: E402

FAKE = Path(__file__).parents[1] / "channelforge" / "devtools" / "fake_stickman_agent.py"
GOOD = ("16:9. Flat pitch-black canvas. A minimalist 2D stick figure with a hollow circular head. Audio: synchronized "
        "sound effects only; no narration. no speech bubbles. [0–3s] a. [3–7s] b. [7–10s] c.")

# ---------------------------------------------------------------- Phase B checks


def test_prompt_contract_checks():
    assert omni.check_prompts([{"id": "c1", "prompt": GOOD}], "1B") == []
    bad = omni.check_prompts([{"id": "c1", "prompt": "Figure in #ff3300 and rgb(1,2,3). [0-3s] x"}], "1B")
    for frag in ("[3–7s]", "technical colour", "16:9", "no speech bubbles", "sound effects only", "hollow circular head"):
        assert any(frag in p for p in bad), frag
    assert any("bright red beanie" in p for p in omni.check_prompts([{"id": "c1", "prompt": GOOD}], "2A"))
    assert "need at least 5" in omni.check_prompts([{"id": "c1", "prompt": GOOD}], "1B", min_count=5)[0]


def test_hyphen_or_en_dash_beats_accepted():
    assert omni.check_prompts([{"id": "c1", "prompt": GOOD.replace("–", "-")}], "1B") == []

# ---------------------------------------------------------------- fake provider tools


class FakeProvider:
    """Stands in for GeminiOmniVideo: writes a 720p clip whose length varies like the real model's."""
    LENGTHS = [9.6, 10.4, 8.9, 10.0, 7.2, 9.8]

    def __init__(self, per_clip=1.0, charged=None, fail_at=None):
        self.per_clip, self.charged, self.fail_at, self.calls = per_clip, charged or per_clip, fail_at, []

    def __call__(self, backend):
        def gen(req):
            k = len(self.calls)
            self.calls.append(req["output_path"])
            if self.fail_at is not None and k == self.fail_at:
                self.fail_at = None
                return {"success": False, "error": "simulated provider outage"}
            d = self.LENGTHS[k % len(self.LENGTHS)]
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=black:s=1280x720:r=24:d={d}",
                            "-f", "lavfi", "-i", f"sine=f=880:d={d}", "-c:v", "libx264", "-preset", "ultrafast",
                            "-c:a", "aac", "-shortest", req["output_path"]], check=True)
            return {"success": True, "cost_usd": self.charged, "data": {}}

        def est(req):
            return {"success": True, "cost_usd": self.per_clip}
        return gen, est


def setup(tmp_path, omni_srv, provider, cap=80.0, auto=True, words="1300"):
    os.environ["FAKE_WORDS"] = words
    cfg = AppConfig(engines_dir=tmp_path / "engines", output_root=tmp_path / "home" / "jobs",
                    router=RouterConfig(omniroute_url=omni_srv.url))
    (cfg.engines_dir / "stickman-video-director" / "skills" / "directing-stickman-videos").mkdir(parents=True)
    db = JobDB(tmp_path / "jobs.db")
    sup = AgentSupervisor(db, [AgentTarget("omniroute:channelforge-primary", "omniroute", omni_srv.url, OMNIROUTE_API_KEY,
                                           "channelforge-primary")], claude_bin=str(FAKE))
    from conftest import fake_words, smart_reply
    omni_srv.reply_fn = smart_reply
    runner = JobRunner(cfg, db, supervisor=sup, recipes=RECIPES, router=LLMRouter(cfg.router, db),
                       app_stages=AppStages(fake_synth, omni_tools=provider), transcribe=fake_words)
    jid = db.create_job(channel="contractor_ai", input_text="Licitaciones infladas: cómo detectarlas con datos abiertos",
                        language="es", visual_style="1B", render_backend="omni_flash", budget_cap_usd=cap, auto_approve=auto)
    return cfg, db, runner, jid


def drain(db, runner, n=60, publish=True):
    for _ in range(n):
        job = db.claim_next_queued()
        if job is None:
            break
        runner.run_job(job)
    if publish:                                   # the human's publish click
        for a in db.approvals("pending"):
            if a["gate"] == "publish":
                runner.decide(a["id"], "approved")


@pytest.mark.slow          # encodes a full 9-minute 1080p video
def test_channel1_omni_end_to_end_with_cost_block(tmp_path, omni, monkeypatch):
    monkeypatch.setenv("FAKE_BAD_PROMPTS_FIRST", "1")
    prov = FakeProvider(per_clip=1.0)
    cfg, db, runner, jid = setup(tmp_path, omni, prov, cap=20.0)
    drain(db, runner)
    j = db.get_job(jid)
    ev = [e["message"] for e in db.events(jid)]
    assert j["status"] == "blocked", (j["error"], ev[-6:])            # ~53 clips × $1 > $20: blocked
    assert any("prompt checks failed" in m for m in ev)                 # bad Phase B went back first
    assert prov.calls == []                                             # nothing generated while blocked
    est = json.loads((Path(j["output_dir"]) / "reports" / "cost_estimate.json").read_text())
    proj = cfg.output_root.parent / "projects" / j["project_id"]
    film_s = json.loads((proj / "artifacts" / "narration.json").read_text())["film_s"]
    n = -(-int(film_s * 1000) // 10000)                                  # ceil(film_s / 10)
    assert est["expected_clips"] == n and est["expected"] == float(n) and est["prompts"] == n + 3

    runner.set_budget(jid, 80.0)                                        # the human raises this job's cap
    runner.retry(jid)
    drain(db, runner)
    j = db.get_job(jid)
    ev = [e["message"] for e in db.events(jid)]
    assert j["status"] == "scheduled", (j["error"], ev[-6:])
    out = Path(j["output_dir"])
    dc = duration.check(out / "long.mp4")
    assert dc.passed, dc
    streams = {s["codec_type"] for s in duration.probe(out / "long.mp4")["streams"]}
    assert streams == {"video", "audio"}
    media = [c for c in db.llm_calls(jid) if c["kind"] == "media"]
    assert len(media) == len(prov.calls) and sum(c["cost_usd"] for c in media) <= 80.0
    assert db.job_cost(jid) <= 80.0
    assert not any("crashed" in m for m in ev)


@pytest.mark.slow          # encodes a full 9-minute 1080p video
def test_clip_generation_resumes_after_a_provider_failure(tmp_path, omni):
    prov = FakeProvider(per_clip=1.0, fail_at=4)
    cfg, db, runner, jid = setup(tmp_path, omni, prov)
    drain(db, runner)
    j = db.get_job(jid)
    assert j["status"] == "failed" and "simulated provider outage" in j["error"]
    made = len(prov.calls)
    runner.retry(jid)
    drain(db, runner)
    j = db.get_job(jid)
    assert j["status"] == "scheduled", j["error"]
    # clips 1-4 were reused: the retry only generated what was missing
    assert len(prov.calls) - made < 60 and prov.calls.count(prov.calls[0]) == 1


@pytest.mark.slow          # encodes a full 9-minute 1080p video
def test_spend_stops_at_the_cap_even_if_the_provider_charges_more(tmp_path, omni):
    prov = FakeProvider(per_clip=1.0, charged=1.8)                       # estimate $1, real charge $1.80
    cfg, db, runner, jid = setup(tmp_path, omni, prov, cap=60.0)
    drain(db, runner)
    j = db.get_job(jid)
    assert j["status"] == "failed" and "budget cap reached" in j["error"]
    assert db.job_cost(jid) <= 60.0 + 1e-9


def test_character_animation_backend_uses_openmontage_with_the_skill(tmp_path):
    cfg = AppConfig(engines_dir=tmp_path / "engines", output_root=tmp_path / "home" / "jobs")
    (cfg.openmontage_dir / "pipeline_defs").mkdir(parents=True)
    src = Path(__file__).resolve().parents[2] / "engines" / "OpenMontage" / "pipeline_defs" / "character-animation.yaml"
    if not src.exists():
        pytest.skip("OpenMontage not cloned")
    (cfg.openmontage_dir / "pipeline_defs" / "character-animation.yaml").write_text(src.read_text())
    job = {"id": 3, "channel": "contractor_ai", "input_text": "topic", "language": "pt", "visual_style": "2A",
           "render_backend": "character_animation", "budget_cap_usd": 5.0, "created_at": 0}
    ej = build_engine_job(cfg, job, RECIPES)
    assert ej.pipeline == "character-animation" and ej.stages[-1] == "compose" and not ej.app_stages
    assert ej.engine_dir == cfg.openmontage_dir
    assert RECIPES["contractor_ai"].script_stage(job) == "script"
    assert "Portuguese" in ej.initial_prompt and "SKILL.md" in ej.initial_prompt
    assert "Contractor AI" in ej.initial_prompt and "Studio Tech" in ej.initial_prompt


def test_old_config_is_upgraded_without_losing_choices(tmp_path, monkeypatch):
    monkeypatch.setenv("CHANNELFORGE_HOME", str(tmp_path))
    cfg = AppConfig()
    ch = cfg.channels["contractor_ai"]
    ch.render_backends, ch.cta_title, ch.cta_line, ch.budget_cap_usd = ["omni_flash", "character_animation"], "", {}, 99.0
    cfg.channels["geopolitics"].render_backends = ["animated-explainer", "documentary-montage"]
    cfg.channels["geopolitics"].render_backend = "documentary-montage"
    cfg.channels["ai_news"].visual_style = "sketchbook"
    cfg.save()
    up = AppConfig.load()
    assert "veo" in up.channels["contractor_ai"].render_backends
    assert up.channels["contractor_ai"].cta_title == "Contractor AI" and up.channels["contractor_ai"].budget_cap_usd == 99.0
    assert up.channels["geopolitics"].render_backend == "animated-explainer"           # removed option replaced
    assert up.channels["ai_news"].visual_style == "ink"
