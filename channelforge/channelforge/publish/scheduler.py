"""Plans approved jobs onto each channel's posting schedule and publishes them.

- Slot: the next fire time of the channel's cron (local time), at least `min_lead_minutes` away.
  Long video at the slot; short k at slot + k × shorts_spacing_hours.
- YouTube items upload right away with status.publishAt (YouTube releases them at the slot);
  TikTok and Instagram have no scheduled-publish parameter, so they post when the slot arrives.
- An APScheduler interval job picks up due items. Failures retry with exponential backoff; quota
  overruns wait for the quota reset (not counted as attempts); missing connections fail fast.
- Every result is written to the job log and the publish_items table.
"""

from __future__ import annotations

import datetime as dt
import logging
import threading
import time
from pathlib import Path
from typing import Callable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from ..config import AppConfig, YouTubeProject
from ..db import JobDB
from .common import NotConnected, PublishError, QuotaExceeded

log = logging.getLogger(__name__)
PublisherFactory = Callable[[str, dict], object]      # (platform, job) -> object with .publish(channel, file, meta, at)


def next_slot(cron: str, after: dt.datetime) -> dt.datetime:
    trig = CronTrigger.from_crontab(cron)
    t = trig.get_next_fire_time(None, after)
    if t is None:
        raise ValueError(f"cron '{cron}' never fires")
    return t


def plan(db: JobDB, cfg: AppConfig, job: dict, meta: dict, now: dt.datetime | None = None) -> list[int]:
    ch = cfg.channels[job["channel"]]
    now = now or dt.datetime.now().astimezone()
    slot = next_slot(ch.posting_schedule_cron, now + dt.timedelta(minutes=cfg.publish.min_lead_minutes))
    out = Path(job["output_dir"])
    yt, ids = meta["youtube"], []
    items = []
    if "youtube" in ch.platforms:
        items.append(("youtube", "long", 0, "long.mp4", {"title": yt["title"], "description": yt["description"],
                      "tags": yt["tags"], "language": yt.get("language"), "thumbnail": str(out / "thumbnail.jpg")}, 0))
    for k, sm in enumerate(meta["shorts"], 1):
        off = k * ch.shorts_spacing_hours * 3600
        if "youtube" in ch.platforms:
            items.append(("youtube", "short", k, sm["file"], {"title": sm["yt_shorts"]["title"],
                          "description": sm["yt_shorts"]["description"], "tags": yt["tags"][:10],
                          "language": yt.get("language")}, off))
        if "tiktok" in ch.platforms:
            items.append(("tiktok", "short", k, sm["file"], {"caption": sm["tiktok"]["caption"]}, off))
        if "instagram" in ch.platforms:
            items.append(("instagram", "short", k, sm["file"], {"caption": sm["ig_reels"]["caption"]}, off))
    for platform, kind, idx, file, m, off in items:
        at = slot.timestamp() + off
        run_at = time.time() if platform == "youtube" else at          # YouTube schedules itself via publishAt
        ids.append(db.add_publish_item(job_id=job["id"], platform=platform, kind=kind, idx=idx, file=str(out / file),
                                       meta=m, publish_at=at, run_at=run_at))
    db.log_event(job["id"], f"publishing planned: {len(ids)} posts, long video at "
                            f"{slot.strftime('%a %Y-%m-%d %H:%M %Z')} ({ch.posting_schedule_cron}), shorts every "
                            f"{ch.shorts_spacing_hours:g} h after it")
    return ids


class PublishScheduler:
    def __init__(self, cfg: AppConfig, db: JobDB, factory: PublisherFactory, interval_s: int = 30):
        self.cfg, self.db, self.factory, self.interval_s = cfg, db, factory, interval_s
        self._lock = threading.Lock()
        self._sched: BackgroundScheduler | None = None

    def start(self) -> None:
        self.db.reset_running_publish_items()           # crashed mid-upload → try again
        self._sched = BackgroundScheduler(daemon=True)
        self._sched.add_job(self.tick, "interval", seconds=self.interval_s, id="publish-tick", max_instances=1,
                            coalesce=True, next_run_time=dt.datetime.now())
        self._sched.start()

    def stop(self) -> None:
        if self._sched:
            self._sched.shutdown(wait=False)

    def tick(self, now: float | None = None) -> int:
        with self._lock:
            items = self.db.claim_due_publish_items(now)
            for it in items:
                self._run(it)
            for job_id in {it["job_id"] for it in items}:
                self._update_job(job_id)
            return len(items)

    def _run(self, it: dict) -> None:
        job = self.db.get_job(it["job_id"]) or {}
        label = f"{it['platform']} {it['kind']}" + (f" #{it['idx']}" if it["kind"] == "short" else "")
        try:
            pub = self.factory(it["platform"], job)
            res = pub.publish(job["channel"], Path(it["file"]), it["meta"], it["publish_at"])
        except QuotaExceeded as e:
            self.db.update_publish_item(it["id"], status="waiting_quota", run_at=e.retry_at, error=str(e))
            self.db.log_event(it["job_id"], f"PUBLISH {label}: quota — queued until "
                              f"{dt.datetime.fromtimestamp(e.retry_at).strftime('%Y-%m-%d %H:%M')}: {e}", level="warn")
            return
        except NotConnected as e:
            self.db.update_publish_item(it["id"], status="failed", error=str(e), attempts=it["attempts"] + 1)
            self.db.log_event(it["job_id"], f"PUBLISH {label} FAILED (needs you): {e}", level="error")
            return
        except Exception as e:                                         # PublishError, network, anything
            attempts = it["attempts"] + 1
            if attempts >= self.cfg.publish.max_attempts:
                self.db.update_publish_item(it["id"], status="failed", attempts=attempts, error=str(e))
                self.db.log_event(it["job_id"], f"PUBLISH {label} FAILED after {attempts} attempts: {e}", level="error")
            else:
                delay = self.cfg.publish.backoff_base_s * 2 ** (attempts - 1)
                self.db.update_publish_item(it["id"], status="queued", attempts=attempts, error=str(e),
                                            run_at=time.time() + delay)
                self.db.log_event(it["job_id"], f"PUBLISH {label} attempt {attempts} failed ({e}); retrying in "
                                  f"{delay // 60:.0f} min", level="warn")
            return
        self.db.update_publish_item(it["id"], status="done", remote_id=res.remote_id, url=res.url,
                                    warning="; ".join(res.warnings) or None, error=None)
        when = dt.datetime.fromtimestamp(it["publish_at"]).strftime("%Y-%m-%d %H:%M")
        self.db.log_event(it["job_id"], f"PUBLISHED {label}: {res.url or res.remote_id} (goes live {when})")
        for w in res.warnings:
            self.db.log_event(it["job_id"], f"PUBLISH {label} warning: {w}", level="warn")

    def _update_job(self, job_id: int) -> None:
        items = self.db.publish_items(job_id)
        states = {i["status"] for i in items}
        if states <= {"done"}:
            self.db.update_job(job_id, status="published")
        elif "failed" in states and not states & {"queued", "running", "waiting_quota"}:
            self.db.update_job(job_id, status="publish_failed",
                               error="; ".join(f"{i['platform']} {i['kind']}{i['idx'] or ''}: {i['error']}"
                                               for i in items if i["status"] == "failed")[:1500])
        else:
            self.db.update_job(job_id, status="scheduled")

    def retry_failed(self, job_id: int) -> int:
        n = 0
        for it in self.db.publish_items(job_id):
            if it["status"] == "failed":
                self.db.update_publish_item(it["id"], status="queued", run_at=time.time(), attempts=0, error=None)
                n += 1
        if n:
            self.db.update_job(job_id, status="scheduled")
            self.db.log_event(job_id, f"retrying {n} failed post(s)")
        return n


def default_factory(cfg: AppConfig, db: JobDB) -> PublisherFactory:
    from .instagram import InstagramPublisher, s3_temp_host
    from .tiktok import TikTokPublisher
    from .youtube import YouTubePublisher

    def make(platform: str, job: dict):
        p = cfg.publish
        if platform == "youtube":
            name = cfg.channels[job["channel"]].youtube_project
            proj = p.youtube_projects.get(name) or YouTubeProject()
            return YouTubePublisher(db, name, audited=proj.audited, costs=proj.costs, daily_units=proj.daily_units,
                                    daily_uploads=proj.daily_uploads)
        if platform == "tiktok":
            return TikTokPublisher(audited=p.tiktok_audited)
        if platform == "instagram":
            host = None
            if p.instagram_mode == "video_url" and p.instagram_s3.get("bucket"):
                from .. import secrets
                kw = {k: v for k, v in p.instagram_s3.items() if k in ("endpoint_url", "region_name")}
                kw.update(aws_access_key_id=secrets.get_secret("s3_access_key_id"),
                          aws_secret_access_key=secrets.get_secret("s3_secret_access_key"))
                host = s3_temp_host(p.instagram_s3["bucket"], **kw)
            return InstagramPublisher(version=p.instagram_graph_version, mode=p.instagram_mode, temp_host=host)
        raise ValueError(platform)
    return make
