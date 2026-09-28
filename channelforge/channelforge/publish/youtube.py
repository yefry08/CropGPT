"""YouTube Data API v3 uploader (one OAuth token per channel, quota tracked per GCP project).

Verified against Google's discovery document (google-api-python-client youtube.v3.json, rev 20260820):
- videos.insert, resumable media upload; status.privacyStatus ∈ public|unlisted|private;
  status.publishAt "can be set only if the privacy status of the video is private";
  status.containsSyntheticMedia (boolean) — "altered or synthetic media"; status.selfDeclaredMadeForKids.
- thumbnails.set accepts image/jpeg.
Uploads from unverified API projects created after 2020-07-28 are locked to private until the
project passes YouTube's API compliance audit; that cannot be queried, so it is a per-project
setting and is also detected after upload.
"""

from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
from typing import Callable
from zoneinfo import ZoneInfo

import httpx

from .. import secrets
from ..db import JobDB
from .common import NotConnected, PublishError, PublishResult, QuotaExceeded

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]
PT = ZoneInfo("America/Los_Angeles")       # YouTube quota resets at midnight Pacific Time
API = "https://www.googleapis.com"


def token_key(channel: str) -> str:
    return f"oauth:youtube:{channel}"


def client_key(project: str) -> str:
    return f"oauth_client:youtube:{project}"


def quota_day(now: float | None = None) -> str:
    return dt.datetime.fromtimestamp(now or dt.datetime.now().timestamp(), PT).strftime("%Y-%m-%d")


def next_reset(now: float | None = None) -> float:
    t = dt.datetime.fromtimestamp(now or dt.datetime.now().timestamp(), PT)
    return (t.replace(hour=0, minute=5, second=0, microsecond=0) + dt.timedelta(days=1)).timestamp()


def connect(channel: str, project: str) -> str:
    """Browser consent (installed-app flow) with the project's OAuth client; token kept in the keyring."""
    from google_auth_oauthlib.flow import InstalledAppFlow
    client = secrets.get_secret(client_key(project))
    if not client:
        raise NotConnected(f"import the OAuth client JSON for Google Cloud project '{project}' first")
    flow = InstalledAppFlow.from_client_config(json.loads(client), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent", access_type="offline")
    secrets.set_secret(token_key(channel), creds.to_json())
    return "connected"


def access_token(channel: str) -> str:
    raw = secrets.get_secret(token_key(channel))
    if not raw:
        raise NotConnected(f"YouTube is not connected for channel '{channel}' (Settings → Connect YouTube)")
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    creds = Credentials.from_authorized_user_info(json.loads(raw), SCOPES)
    if not creds.valid:
        creds.refresh(Request())
        secrets.set_secret(token_key(channel), creds.to_json())
    secrets._register(creds.token)
    return creds.token


class YouTubePublisher:
    def __init__(self, db: JobDB, project: str, *, audited: bool, costs: dict[str, int], daily_units: int,
                 daily_uploads: int, token_fn: Callable[[str], str] = access_token, api: str = API,
                 client: httpx.Client | None = None):
        self.db, self.project, self.audited = db, project, audited
        self.costs, self.daily_units, self.daily_uploads = costs, daily_units, daily_uploads
        self.token_fn, self.api = token_fn, api.rstrip("/")
        self.http = client or httpx.Client(timeout=httpx.Timeout(60, read=600))

    # -- quota ---------------------------------------------------------------
    def _reserve(self, method: str) -> None:
        day, cost = quota_day(), self.costs.get(method, 1)
        if self.db.quota_used(self.project, day, "units") + cost > self.daily_units:
            raise QuotaExceeded(f"YouTube quota for project '{self.project}' would exceed {self.daily_units} units "
                                f"today", next_reset())
        if method == "videos.insert" and self.db.quota_used(self.project, day, "uploads") + 1 > self.daily_uploads:
            raise QuotaExceeded(f"{self.daily_uploads} uploads/day reached for project '{self.project}'", next_reset())
        self.db.quota_add(self.project, day, "units", cost)
        if method == "videos.insert":
            self.db.quota_add(self.project, day, "uploads", 1)

    def _check(self, r: httpx.Response, what: str) -> dict:
        if r.status_code < 400:
            return r.json() if r.content else {}
        try:
            reason = r.json()["error"]["errors"][0].get("reason", "")
        except Exception:
            reason = ""
        if r.status_code == 403 and reason in ("quotaExceeded", "dailyLimitExceeded", "uploadLimitExceeded"):
            raise QuotaExceeded(f"{what}: YouTube says {reason}", next_reset())
        if r.status_code == 401 or reason in ("forbidden", "insufficientPermissions", "youtubeSignupRequired"):
            raise NotConnected(f"{what}: {r.status_code} {reason or 'unauthorized'} — reconnect the channel")
        raise PublishError(f"{what}: HTTP {r.status_code} {r.text[:300]}")

    # -- upload --------------------------------------------------------------
    def publish(self, channel: str, file: Path, meta: dict, publish_at: float) -> PublishResult:
        token = self.token_fn(channel)
        auth = {"Authorization": f"Bearer {token}"}
        when = dt.datetime.fromtimestamp(publish_at, dt.timezone.utc)
        scheduled = when > dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=10)
        status = {"privacyStatus": "private" if scheduled else "public", "selfDeclaredMadeForKids": False,
                  "containsSyntheticMedia": True}
        if scheduled:
            status["publishAt"] = when.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        body = {"snippet": {"title": meta["title"], "description": meta.get("description", ""),
                            "tags": meta.get("tags", []), "categoryId": meta.get("category_id", "25"),
                            "defaultLanguage": meta.get("language"), "defaultAudioLanguage": meta.get("language")},
                "status": status}
        self._reserve("videos.insert")
        size = os.path.getsize(file)
        r = self.http.post(f"{self.api}/upload/youtube/v3/videos", params={"uploadType": "resumable",
                           "part": "snippet,status", "notifySubscribers": "true"},
                           headers={**auth, "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size),
                                    "Content-Type": "application/json; charset=UTF-8"}, json=body)
        self._check(r, "videos.insert (start)")
        session = r.headers["Location"]
        r = self.http.put(session, headers={**auth, "Content-Type": "video/mp4", "Content-Length": str(size)},
                          content=_chunks(file))
        video = self._check(r, "videos.insert (upload)")
        vid = video["id"]
        res = PublishResult(vid, f"https://www.youtube.com/watch?v={vid}")
        got = video.get("status", {})
        wanted = status["privacyStatus"]
        if not self.audited:
            res.warnings.append(f"Google Cloud project '{self.project}' is not marked as audited: YouTube locks "
                                "uploads from unverified API projects to private until the project passes the API "
                                "compliance audit.")
        if got.get("privacyStatus") and (got["privacyStatus"] != wanted or (scheduled and not got.get("publishAt"))):
            res.warnings.append(f"YouTube returned privacy '{got.get('privacyStatus')}' (asked for '{wanted}'"
                                + (" with publishAt" if scheduled else "") + "): the project looks unverified/unaudited.")
        if meta.get("thumbnail"):
            self._reserve("thumbnails.set")
            with open(meta["thumbnail"], "rb") as fh:
                r = self.http.post(f"{self.api}/upload/youtube/v3/thumbnails/set", params={"videoId": vid,
                                   "uploadType": "media"}, headers={**auth, "Content-Type": "image/jpeg"}, content=fh.read())
            try:
                self._check(r, "thumbnails.set")
            except (PublishError, NotConnected) as e:     # custom thumbnails need a verified channel
                res.warnings.append(f"thumbnail not set: {e} (custom thumbnails need a phone-verified channel)")
        return res


def _chunks(path: Path, size: int = 8 * 1024 * 1024):
    """Stream the file: long videos are hundreds of MB."""
    with open(path, "rb") as fh:
        while block := fh.read(size):
            yield block
