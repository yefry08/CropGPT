"""M6: YouTube / TikTok / Instagram publishers against mocked APIs, and the scheduler."""

import datetime as dt
import json
import time
from pathlib import Path

import httpx
import pytest

from channelforge.config import AppConfig
from channelforge.db import JobDB
from channelforge.publish import instagram, scheduler, tiktok, youtube
from channelforge.publish.common import NotConnected, PublishError, PublishResult, QuotaExceeded


@pytest.fixture
def video(tmp_path):
    p = tmp_path / "v.mp4"
    p.write_bytes(b"\0" * 300_000)
    return p


# ---------------------------------------------------------------- YouTube
class YT:
    def __init__(self, privacy_echo=None, fail=None):
        self.calls, self.privacy_echo, self.fail = [], privacy_echo, fail

    def __call__(self, req: httpx.Request):
        self.calls.append(req)
        if self.fail:
            return httpx.Response(self.fail[0], json={"error": {"errors": [{"reason": self.fail[1]}]}})
        if req.url.path == "/upload/youtube/v3/videos" and req.method == "POST":
            return httpx.Response(200, headers={"Location": "https://up.example/session/1"})
        if req.url.host == "up.example":
            body = json.loads(self.calls[-2].content)
            st = dict(body["status"])
            if self.privacy_echo:
                st = {"privacyStatus": self.privacy_echo}
            return httpx.Response(200, json={"id": "vid123", "status": st})
        if req.url.path == "/upload/youtube/v3/thumbnails/set":
            return httpx.Response(200, json={"items": []})
        return httpx.Response(404)


def yt_pub(db, handler, **kw):
    args = dict(audited=True, costs={"videos.insert": 100, "thumbnails.set": 50}, daily_units=10_000, daily_uploads=100)
    args.update(kw)
    return youtube.YouTubePublisher(db, "proj", token_fn=lambda ch: "ya29.TESTTOKEN-abcdefghijk",
                                    client=httpx.Client(transport=httpx.MockTransport(handler)), **args)


def test_youtube_scheduled_upload_sets_publishat_synthetic_flag_and_thumbnail(tmp_path, video):
    db = JobDB(tmp_path / "j.db")
    h = YT()
    thumb = tmp_path / "t.jpg"
    thumb.write_bytes(b"jpg")
    at = time.time() + 86400
    res = yt_pub(db, h).publish("contractor_ai", video, {"title": "T", "description": "D", "tags": ["a"],
                                                        "language": "es", "thumbnail": str(thumb)}, at)
    start = json.loads(h.calls[0].content)
    assert h.calls[0].url.params["uploadType"] == "resumable" and h.calls[0].url.params["part"] == "snippet,status"
    assert start["status"]["privacyStatus"] == "private" and start["status"]["containsSyntheticMedia"] is True
    assert start["status"]["publishAt"].endswith("Z") and start["status"]["selfDeclaredMadeForKids"] is False
    assert h.calls[1].headers["Content-Length"] == str(video.stat().st_size)
    assert h.calls[2].url.path == "/upload/youtube/v3/thumbnails/set" and h.calls[2].url.params["videoId"] == "vid123"
    assert res.url.endswith("vid123") and res.warnings == []
    day = youtube.quota_day()
    assert db.quota_used("proj", day, "units") == 150 and db.quota_used("proj", day, "uploads") == 1


def test_youtube_unverified_project_is_flagged(tmp_path, video):
    db = JobDB(tmp_path / "j.db")
    res = yt_pub(db, YT(privacy_echo="private"), audited=False).publish("c", video, {"title": "T"}, time.time() + 86400)
    assert any("not marked as audited" in w for w in res.warnings)
    assert any("looks unverified" in w for w in res.warnings)


def test_youtube_quota_is_tracked_and_queued(tmp_path, video):
    db = JobDB(tmp_path / "j.db")
    with pytest.raises(QuotaExceeded) as e:
        yt_pub(db, YT(), daily_units=120).publish("c", video, {"title": "T"}, time.time())
        yt_pub(db, YT(), daily_units=120).publish("c", video, {"title": "T"}, time.time())
    assert e.value.retry_at > time.time()
    with pytest.raises(QuotaExceeded):
        yt_pub(JobDB(tmp_path / "k.db"), YT(fail=(403, "quotaExceeded"))).publish("c", video, {"title": "T"}, time.time())
    with pytest.raises(NotConnected):
        yt_pub(JobDB(tmp_path / "l.db"), YT(fail=(401, "authError"))).publish("c", video, {"title": "T"}, time.time())


# ---------------------------------------------------------------- TikTok
class TT:
    def __init__(self, options=("SELF_ONLY", "PUBLIC_TO_EVERYONE"), init_errors=()):
        self.calls, self.options, self.init_errors, self.status_n = [], list(options), list(init_errors), 0

    def __call__(self, req):
        self.calls.append(req)
        p = req.url.path
        if p == "/v2/post/publish/creator_info/query/":
            return httpx.Response(200, json={"data": {"privacy_level_options": self.options}, "error": {"code": "ok"}})
        if p == "/v2/post/publish/video/init/":
            if self.init_errors:
                return httpx.Response(400, json={"error": {"code": self.init_errors.pop(0), "message": "no"}})
            return httpx.Response(200, json={"data": {"publish_id": "p_1", "upload_url": "https://upload.tt/u"},
                                             "error": {"code": "ok"}})
        if req.url.host == "upload.tt":
            return httpx.Response(201)
        if p == "/v2/post/publish/status/fetch/":
            self.status_n += 1
            st = "PROCESSING_UPLOAD" if self.status_n == 1 else "PUBLISH_COMPLETE"
            return httpx.Response(200, json={"data": {"status": st, "publicaly_available_post_id": [7]},
                                             "error": {"code": "ok"}})
        return httpx.Response(404)


def tt_pub(handler, audited):
    return tiktok.TikTokPublisher(audited=audited, token_fn=lambda ch: "act.TESTTOKEN", poll_s=0,
                                  client=httpx.Client(transport=httpx.MockTransport(handler)))


def test_tiktok_unaudited_posts_private_with_ai_flag(video):
    h = TT()
    res = tt_pub(h, audited=False).publish("c", video, {"caption": "hola #ia"}, time.time())
    init = json.loads(next(c for c in h.calls if c.url.path.endswith("/video/init/")).content)
    assert init["post_info"]["privacy_level"] == "SELF_ONLY" and init["post_info"]["is_aigc"] is True
    assert init["source_info"] == {"source": "FILE_UPLOAD", "video_size": 300_000, "chunk_size": 300_000,
                                   "total_chunk_count": 1}
    put = next(c for c in h.calls if c.url.host == "upload.tt")
    assert put.headers["Content-Range"] == "bytes 0-299999/300000"
    assert res.url.endswith("/7") and any("not marked as audited" in w for w in res.warnings)


def test_tiktok_unaudited_error_falls_back_to_private(video):
    h = TT(init_errors=["unaudited_client_can_only_post_to_private_accounts"])
    res = tt_pub(h, audited=True).publish("c", video, {"caption": "x"}, time.time())
    inits = [json.loads(c.content) for c in h.calls if c.url.path.endswith("/video/init/")]
    assert inits[0]["post_info"]["privacy_level"] == "PUBLIC_TO_EVERYONE"
    assert inits[1]["post_info"]["privacy_level"] == "SELF_ONLY"
    assert any("unaudited" in w for w in res.warnings)


def test_tiktok_large_file_is_chunked(tmp_path, monkeypatch):
    monkeypatch.setattr(tiktok, "MAX_SINGLE", 100_000)
    monkeypatch.setattr(tiktok, "CHUNK", 40_000)
    v = tmp_path / "big.mp4"
    v.write_bytes(b"\1" * 130_000)
    h = TT()
    tt_pub(h, audited=True).publish("c", v, {"caption": "x"}, time.time())
    ranges = [c.headers["Content-Range"] for c in h.calls if c.url.host == "upload.tt"]
    assert ranges == ["bytes 0-39999/130000", "bytes 40000-79999/130000", "bytes 80000-129999/130000"]


# ---------------------------------------------------------------- Instagram
class IG:
    def __init__(self):
        self.calls, self.polls = [], 0

    def __call__(self, req):
        self.calls.append(req)
        p = req.url.path
        if p.endswith("/17841/media") and req.method == "POST":
            return httpx.Response(200, json={"id": "c9"})
        if req.url.host == "rupload.facebook.com":
            return httpx.Response(200, json={"success": True})
        if p.endswith("/c9") and req.method == "GET":
            self.polls += 1
            return httpx.Response(200, json={"status_code": "IN_PROGRESS" if self.polls == 1 else "FINISHED"})
        if p.endswith("/media_publish"):
            return httpx.Response(200, json={"id": "m5"})
        if p.endswith("/m5"):
            return httpx.Response(200, json={"permalink": "https://www.instagram.com/reel/abc/"})
        return httpx.Response(404, json={"error": {"message": "nope"}})


def ig_pub(handler, **kw):
    return instagram.InstagramPublisher(creds_fn=lambda ch: ("EAAG-TESTTOKEN", "17841"), poll_s=0,
                                        client=httpx.Client(transport=httpx.MockTransport(handler)), **kw)


def test_instagram_reels_resumable_upload(video):
    h = IG()
    res = ig_pub(h).publish("c", video, {"caption": "cap"}, time.time())
    create = h.calls[0]
    assert b"media_type=REELS" in create.content and b"upload_type=resumable" in create.content
    up = h.calls[1]
    assert up.url.path == "/ig-api-upload/v25.0/c9"
    assert up.headers["Authorization"] == "OAuth EAAG-TESTTOKEN" and up.headers["offset"] == "0"
    assert up.headers["file_size"] == "300000"
    assert res.url == "https://www.instagram.com/reel/abc/"


def test_instagram_video_url_mode_uses_and_cleans_temp_host(video):
    cleaned = []
    h = IG()
    ig_pub(h, mode="video_url", temp_host=lambda f: ("https://tmp.example/v.mp4", lambda: cleaned.append(1))) \
        .publish("c", video, {"caption": "cap"}, time.time())
    assert b"video_url=https%3A%2F%2Ftmp.example%2Fv.mp4" in h.calls[0].content and cleaned == [1]
    assert not any(c.url.host == "rupload.facebook.com" for c in h.calls)


# ---------------------------------------------------------------- scheduler
def setup_job(tmp_path):
    cfg = AppConfig(output_root=tmp_path / "jobs")
    cfg.publish.backoff_base_s = 60
    db = JobDB(tmp_path / "j.db")
    jid = db.create_job(channel="geopolitics", input_text="x", language="es", visual_style="clean-professional",
                        render_backend="animated-explainer", budget_cap_usd=5, auto_approve=False)
    out = tmp_path / "out"
    out.mkdir()
    db.update_job(jid, output_dir=str(out))
    meta = {"youtube": {"title": "T", "description": "D", "tags": ["a"], "language": "es"},
            "shorts": [{"file": f"shorts/short_{k}.mp4", "tiktok": {"caption": "t"}, "ig_reels": {"caption": "i"},
                        "yt_shorts": {"title": "S #Shorts", "description": "d"}} for k in range(1, 6)]}
    return cfg, db, jid, meta


def test_plan_uses_the_channel_cron_and_spacing(tmp_path):
    cfg, db, jid, meta = setup_job(tmp_path)
    now = dt.datetime(2026, 9, 28, 10, 0).astimezone()        # Monday
    scheduler.plan(db, cfg, db.get_job(jid), meta, now)
    items = db.publish_items(jid)
    assert len(items) == 16
    long = next(i for i in items if i["kind"] == "long")
    slot = dt.datetime.fromtimestamp(long["publish_at"])
    assert (slot.strftime("%a"), slot.hour, slot.minute) == ("Tue", 15, 0)   # "0 15 * * tue,fri"
    s3 = [i for i in items if i["idx"] == 3]
    assert all(abs(i["publish_at"] - long["publish_at"] - 3 * 86400) < 1 for i in s3)
    assert all(i["run_at"] <= time.time() + 1 for i in items if i["platform"] == "youtube")   # YouTube uploads now
    assert all(i["run_at"] == i["publish_at"] for i in items if i["platform"] != "youtube")


class FakePub:
    """Scripted outcomes per file name; anything unscripted succeeds."""

    def __init__(self, script=None):
        self.script = {k: list(v) for k, v in (script or {}).items()}

    def publish(self, channel, file, meta, at):
        todo = self.script.get(Path(file).name, [])
        o = todo.pop(0) if todo else "ok"
        if o == "ok":
            return PublishResult("id", "https://x/id", ["heads up"])
        raise o


def test_scheduler_backoff_quota_and_needs_human(tmp_path):
    cfg, db, jid, meta = setup_job(tmp_path)
    cfg.channels["geopolitics"].platforms = ["youtube"]
    scheduler.plan(db, cfg, db.get_job(jid), {"youtube": meta["youtube"], "shorts": meta["shorts"][:2]})
    pub = FakePub({"long.mp4": [PublishError("503 backend"), "ok"],
                   "short_1.mp4": [QuotaExceeded("quota", time.time() + 999)],
                   "short_2.mp4": [NotConnected("reconnect")]})
    sch = scheduler.PublishScheduler(cfg, db, lambda platform, job: pub)
    assert sch.tick() == 3                                                    # YouTube items are due now
    st = {Path(i["file"]).name: i for i in db.publish_items(jid)}
    a, b, c = st["long.mp4"], st["short_1.mp4"], st["short_2.mp4"]
    assert a["status"] == "queued" and a["attempts"] == 1 and a["run_at"] > time.time() + 50     # backoff 60 s
    assert b["status"] == "waiting_quota" and b["attempts"] == 0 and b["run_at"] > time.time() + 900
    assert c["status"] == "failed" and "reconnect" in c["error"]
    assert db.get_job(jid)["status"] == "scheduled"
    db.update_publish_item(a["id"], run_at=0)
    assert sch.tick() == 1
    assert next(i for i in db.publish_items(jid) if i["id"] == a["id"])["status"] == "done"
    ev = [e["message"] for e in db.events(jid)]
    assert any(m.startswith("PUBLISHED youtube long") for m in ev) and any("warning: heads up" in m for m in ev)
    assert any("retrying in 1 min" in m for m in ev) and any("FAILED (needs you)" in m for m in ev)
    assert sch.retry_failed(jid) == 1 and db.get_job(jid)["status"] == "scheduled"


def test_all_done_marks_job_published(tmp_path):
    cfg, db, jid, meta = setup_job(tmp_path)
    scheduler.plan(db, cfg, db.get_job(jid), meta)
    for it in db.publish_items(jid):
        db.update_publish_item(it["id"], run_at=0)
    sch = scheduler.PublishScheduler(cfg, db, lambda p, j: FakePub())
    assert sch.tick() == 16
    assert db.get_job(jid)["status"] == "published"


def test_publish_tokens_never_reach_logs_or_db(tmp_path, video):
    from channelforge import secrets
    tok = "ya29.SECRETTOKEN-0123456789abcdef"
    secrets._register(tok)
    db = JobDB(tmp_path / "j.db")

    def handler(req):
        return httpx.Response(500, text=f"echo {req.headers.get('Authorization')}")
    pub = youtube.YouTubePublisher(db, "p", audited=True, costs={}, daily_units=10**6, daily_uploads=100,
                                   token_fn=lambda ch: tok, client=httpx.Client(transport=httpx.MockTransport(handler)))
    jid = db.create_job(channel="geopolitics", input_text="x", language="es", visual_style="s", render_backend="b",
                        budget_cap_usd=1, auto_approve=False)
    iid = db.add_publish_item(job_id=jid, platform="youtube", kind="long", idx=0, file=str(video), meta={"title": "T"},
                              publish_at=time.time(), run_at=0)
    cfg = AppConfig()
    scheduler.PublishScheduler(cfg, db, lambda p, j: pub).tick()
    for p in [p for p in tmp_path.rglob("*") if p.is_file()]:
        assert tok.encode() not in p.read_bytes()
    assert "***" in (db.publish_items(jid)[0]["error"] or "")
