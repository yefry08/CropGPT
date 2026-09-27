"""M2: reference ingest, originality, fact layer and the ffprobe duration gate."""

import json
import subprocess
from pathlib import Path

import pytest

from channelforge.agent.claude_runner import AgentTarget
from channelforge.agent.supervisor import AgentSupervisor, Outcome
from channelforge.config import AppConfig, RouterConfig
from channelforge.db import JobDB
from channelforge.jobs.channels import RECIPES
from channelforge.jobs.runner import JobRunner
from channelforge.pipeline import duration, facts, ingest, originality
from channelforge.router.llm import LLMRouter
from channelforge.secrets import OMNIROUTE_API_KEY

FAKE = Path(__file__).parents[1] / "channelforge" / "devtools" / "fake_explainer_agent.py"
REF = ("hosting the world cup is supposed to make a country richer but the numbers tell a very different "
       "story when you look at the stadiums that were built and then abandoned after the tournament ended")

# ---------------------------------------------------------------- originality


def test_copied_script_fails_and_paraphrase_passes():
    rep = originality.overlap(REF + " and more words here", REF)
    assert rep.overlap == 31 / 35 and not rep.passed      # 4 extra words add 4 new 5-grams
    own = ("official budget records from three host nations show spending moved from schools to stadiums, "
           "and several of those venues now host fewer than ten events a year")
    assert originality.overlap(own, REF).passed


def test_accents_and_case_are_normalised():
    assert originality.overlap("La Nación GASTÓ más de lo previsto en estadios nuevos",
                               "la nacion gasto mas de lo previsto en estadios nuevos").overlap == 1.0


def test_no_reference_means_no_overlap():
    assert originality.overlap("any script at all with enough words in it", "").passed

# ---------------------------------------------------------------- ingest


def test_classify_inputs():
    assert ingest.classify("Brazil 2014 notes")[0] == "topic"
    assert ingest.classify("see https://youtu.be/abc123 please")[:2] == ("reference", ["https://youtu.be/abc123"])
    kind, urls, notes = ingest.classify("https://a.com/x\nhttps://b.com/y, and my notes")
    assert kind == "references" and urls == ["https://a.com/x", "https://b.com/y"] and notes == "and my notes"


def test_vtt_rolling_auto_captions_are_deduplicated():
    vtt = ("WEBVTT\nKind: captions\nLanguage: en\n\n00:00:00.000 --> 00:00:02.000 align:start\n"
           "hosting the<00:00:01.000><c> world cup</c>\n\n00:00:02.000 --> 00:00:04.000\nhosting the world cup\n"
           "is supposed to\n\n00:00:04.000 --> 00:00:05.000\nis supposed to\n")
    assert ingest.vtt_to_text(vtt) == "hosting the world cup is supposed to"


class FakeYtDlp:
    def __init__(self, subs: bool):
        self.subs, self.calls = subs, []

    def __call__(self, cmd, cwd):
        self.calls.append(cmd)
        if "--dump-single-json" in cmd:
            return subprocess.CompletedProcess(cmd, 0, json.dumps({"title": "Ref", "channel": "Chan", "duration": 600}), "")
        if "--write-subs" in cmd and self.subs:
            (Path(cwd) / "ref.es.vtt").write_text("WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n" + REF)
        if "-x" in cmd:
            (Path(cmd[cmd.index("-o") + 1].replace("%(ext)s", "m4a"))).write_bytes(b"audio")
        return subprocess.CompletedProcess(cmd, 0, "", "")


def test_reference_uses_platform_subtitles(tmp_path):
    yt = FakeYtDlp(subs=True)
    ji = ingest.ingest("https://youtu.be/x", tmp_path, run=yt)
    r = ji.references[0]
    assert (r.title, r.transcript_source, r.transcript) == ("Ref", "subtitles", REF)
    assert not any("-x" in c for c in yt.calls)                      # never downloads media when subs exist
    assert json.loads((tmp_path / "reference" / "input.json").read_text())["kind"] == "reference"


def test_reference_whisper_fallback_deletes_the_audio(tmp_path):
    seen = {}

    def whisper(audio):
        seen["path"] = audio
        assert audio.exists()
        return "transcribed words"
    r = ingest.ingest("https://youtu.be/x", tmp_path, run=FakeYtDlp(subs=False), whisper=whisper).references[0]
    assert (r.transcript_source, r.transcript) == ("whisper", "transcribed words")
    assert not seen["path"].exists()                                  # the reference's audio is not kept

# ---------------------------------------------------------------- facts


def write_sources(p: Path, claims):
    p.write_text(json.dumps({"claims": claims}))
    return p


SRC = {"url": "https://data.worldbank.org/x", "publisher": "World Bank", "type": "dataset"}


def test_every_claim_needs_a_source(tmp_path):
    f = write_sources(tmp_path / "s.json", [{"id": "c1", "text": "x", "sources": []}])
    rep = facts.check(f, "script")
    assert not rep.passed and rep.problems[0]["problem"] == "no source"


def test_missing_sources_file_fails(tmp_path):
    assert "missing" in facts.check(tmp_path / "nope.json", "s").problems[0]["problem"]


def test_non_url_source_rejected(tmp_path):
    f = write_sources(tmp_path / "s.json", [{"id": "c1", "text": "x", "sources": [{"url": "World Bank"}]}])
    assert "invalid" in facts.check(f, "s").problems[0]["problem"]


def test_allegation_needs_strong_or_multiple_sources_and_legal_status(tmp_path):
    one_outlet = [{"id": "a1", "kind": "allegation", "text": "Minister X embezzled funds", "legal_status": "accused",
                   "sources": [{"url": "https://news.example.com/a", "publisher": "Outlet A", "type": "news"}]}]
    probs = facts.check_rules(facts.SourcesFile.model_validate({"claims": one_outlet}))
    assert any("lacks a court ruling" in p["problem"] for p in probs)
    assert any("states guilt" in p["problem"] for p in probs)
    ok = [{"id": "a1", "kind": "allegation", "text": "Minister X is accused of diverting funds",
           "legal_status": "accused", "sources": [{"url": "https://news.a.com/1", "publisher": "Outlet A", "type": "news"},
                                                  {"url": "https://news.b.com/2", "publisher": "Outlet B", "type": "news"}]}]
    assert facts.check_rules(facts.SourcesFile.model_validate({"claims": ok})) == []
    audit = [{"id": "a1", "kind": "allegation", "text": "Firm Y was convicted of bid rigging", "legal_status": "convicted",
              "sources": [{"url": "https://court.gov/ruling", "type": "court_ruling"}]}]
    assert facts.check_rules(facts.SourcesFile.model_validate({"claims": audit})) == []


def test_critic_flags_come_through_the_router(omni, tmp_path):
    omni.reply = 'Here you go: {"flags": [{"section_id": "s1", "text": "80%", "problem": "not in sources", "action": "remove"}]}'
    f = write_sources(tmp_path / "s.json", [{"id": "c1", "text": "x", "sources": [SRC]}])
    rep = facts.check(f, "Spending rose 80%.", LLMRouter(RouterConfig(omniroute_url=omni.url)))
    assert rep.critic_flags[0]["problem"] == "not in sources" and not rep.passed
    assert omni.models_seen() == ["auto/reasoning"]                   # the critic is a different route
    assert "not in sources" in rep.as_note()

# ---------------------------------------------------------------- duration


def make_video(path: Path, secs: int, size="1920x1080", silence_tail=0):
    audio = f"sine=f=220:d={secs - silence_tail}"
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=gray:s={size}:r=1:d={secs}",
           "-f", "lavfi", "-i", audio]
    if silence_tail:
        cmd += ["-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono:d={silence_tail}", "-filter_complex",
                "[1:a][2:a]concat=n=2:v=0:a=1[a]", "-map", "0:v", "-map", "[a]"]
    subprocess.run(cmd + ["-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-c:a", "aac",
                          "-t", str(secs), str(path)], check=True)
    return path


@pytest.mark.parametrize("secs,ok", [(300, False), (479, False), (480, True), (600, True), (601, False)])
def test_duration_range_by_ffprobe(tmp_path, secs, ok):
    assert duration.check(make_video(tmp_path / "v.mp4", secs)).passed is ok


def test_silence_padding_is_rejected(tmp_path):
    dc = duration.check(make_video(tmp_path / "v.mp4", 540, silence_tail=20))
    assert dc.in_range and dc.padded and not dc.passed
    assert "do not pad with silence" in dc.replan_note(1300)


def test_wrong_resolution_rejected(tmp_path):
    assert not duration.check(make_video(tmp_path / "v.mp4", 540, size="1280x720")).passed


def test_replan_note_gives_a_word_target():
    note = duration.DurationCheck(360, 1920, 1080, 0).replan_note(900)
    assert "~1350 words" in note and "Re-plan the scenes" in note

# ---------------------------------------------------------------- channel 3 end to end


def test_channel3_end_to_end(tmp_path, engine_dir, omni, monkeypatch):
    """Copied script + unsourced claim → sent back automatically; too-short render → re-plan
    from the script with a word target; finally a 1920x1080 long.mp4 in range + sources.json."""
    omni.reply = '{"flags": []}'                                      # critic finds nothing extra
    monkeypatch.setenv("FAKE_COPY_TEXT", REF)
    monkeypatch.setenv("FAKE_WORDS", "800")                            # 800 words → 320 s: too short
    cfg = AppConfig(engines_dir=engine_dir.parent, output_root=tmp_path / "out", claude_bin=str(FAKE),
                    router=RouterConfig(omniroute_url=omni.url))
    db = JobDB(tmp_path / "jobs.db")
    sup = AgentSupervisor(db, [AgentTarget("omniroute:channelforge-primary", "omniroute", omni.url,
                                           OMNIROUTE_API_KEY, "channelforge-primary")], claude_bin=str(FAKE))

    def fake_ingest(text, out_dir):
        return ingest.ingest(text, out_dir, run=FakeYtDlp(subs=True))
    runner = JobRunner(cfg, db, supervisor=sup, recipes=RECIPES, router=LLMRouter(cfg.router, db),
                       ingest_fn=fake_ingest)
    jid = db.create_job(channel="geopolitics", input_text="https://youtu.be/ref World Cup hosting and public money",
                        language="es", visual_style="clean-professional", render_backend="animated-explainer",
                        budget_cap_usd=5.0, auto_approve=True)
    for _ in range(40):
        job = db.claim_next_queued()
        if job is None:
            break
        runner.run_job(job)
    j = db.get_job(jid)
    events = [e["message"] for e in db.events(jid)]
    assert j["status"] == "done", (j["error"], events[-6:])
    out = Path(j["output_dir"])
    dc = duration.check(out / "long.mp4")
    assert dc.passed and 480 <= dc.duration_s <= 600
    assert json.loads((out / "sources.json").read_text())["claims"][0]["sources"]
    gate = json.loads((out / "reports" / "script_gate.json").read_text())
    assert gate["originality"]["passed"] and gate["facts"]["passed"]
    assert any("script checks failed (attempt 1/3)" in m for m in events)
    assert any(m.startswith("DURATION GATE: ffprobe measured the final render at 320.0 s") for m in events)
    assert j["replan_count"] == 1 and j["check_attempts"] == 1
    assert (engine_dir / "projects" / j["project_id"] / "history" / "channelforge-replan-1" / "checkpoint_compose.json").exists()
    assert (out / "reference" / "ref01" / "transcript.txt").read_text() == REF
    assert not list(out.rglob("*.m4a"))                              # no reference media kept


def test_documentary_montage_is_refused_for_channel3():
    with pytest.raises(ValueError, match="fact layer"):
        RECIPES["geopolitics"].pipeline_for({"render_backend": "documentary-montage"})
