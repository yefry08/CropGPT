"""TikTok Content Posting API — Direct Post of a local file.

Flow (TikTok for Developers, Content Posting API reference; checked via secondary sources because
developers.tiktok.com is not reachable from the build machine):
  POST /v2/post/publish/creator_info/query/  → privacy_level_options, max_video_post_duration_sec, …
  POST /v2/post/publish/video/init/          → publish_id + upload_url (source_info.source = FILE_UPLOAD)
  PUT  upload_url with Content-Range         (one chunk ≤ 64 MB, else 5–64 MB chunks)
  POST /v2/post/publish/status/fetch/        → PUBLISH_COMPLETE | FAILED | PROCESSING_*
Unaudited API clients may only post SELF_ONLY (private); TikTok answers
`unaudited_client_can_only_post_to_private_accounts`. `post_info.is_aigc` marks AI-generated content;
if TikTok rejects it we retry without it and warn.
"""

from __future__ import annotations

import json
import math
import os
import time
from pathlib import Path
from typing import Callable

import httpx

from .. import secrets
from .common import NotConnected, PublishError, PublishResult

API = "https://open.tiktokapis.com"
CHUNK = 10 * 1024 * 1024
MAX_SINGLE = 64 * 1024 * 1024


def token_key(channel: str) -> str:
    return f"oauth:tiktok:{channel}"


def access_token(channel: str) -> str:
    """Stored as JSON {access_token, refresh_token, expires_at, client_key, client_secret}; refreshed when stale."""
    raw = secrets.get_secret(token_key(channel))
    if not raw:
        raise NotConnected(f"TikTok is not connected for channel '{channel}' (Settings → TikTok tokens)")
    tok = json.loads(raw)
    if tok.get("expires_at", 0) - time.time() < 300 and tok.get("refresh_token"):
        r = httpx.post(f"{API}/v2/oauth/token/", data={"client_key": tok["client_key"], "client_secret": tok["client_secret"],
                       "grant_type": "refresh_token", "refresh_token": tok["refresh_token"]}, timeout=30)
        data = r.json()
        if r.status_code >= 400 or "access_token" not in data:
            raise NotConnected(f"TikTok token refresh failed: {data.get('error_description') or r.text[:200]}")
        tok.update(access_token=data["access_token"], refresh_token=data.get("refresh_token", tok["refresh_token"]),
                   expires_at=time.time() + int(data.get("expires_in", 86400)))
        secrets.set_secret(token_key(channel), json.dumps(tok))
    secrets._register(tok["access_token"])
    return tok["access_token"]


class TikTokPublisher:
    def __init__(self, *, audited: bool, token_fn: Callable[[str], str] = access_token, api: str = API,
                 client: httpx.Client | None = None, poll_s: float = 5.0, poll_max_s: float = 900.0):
        self.audited, self.token_fn, self.api = audited, token_fn, api.rstrip("/")
        self.http = client or httpx.Client(timeout=httpx.Timeout(60, read=600))
        self.poll_s, self.poll_max_s = poll_s, poll_max_s

    def _post(self, path: str, token: str, body: dict) -> dict:
        r = self.http.post(f"{self.api}{path}", headers={"Authorization": f"Bearer {token}",
                           "Content-Type": "application/json; charset=UTF-8"}, json=body)
        data = r.json() if r.content else {}
        err = (data.get("error") or {})
        if r.status_code >= 400 or (err.get("code") not in (None, "ok")):
            code = err.get("code") or f"HTTP {r.status_code}"
            if code in ("access_token_invalid", "scope_not_authorized", "token_not_authorized"):
                raise NotConnected(f"TikTok {path}: {code} — reconnect the channel")
            raise PublishError(f"TikTok {path}: {code}: {err.get('message', '')}".strip())
        return data.get("data") or {}

    def publish(self, channel: str, file: Path, meta: dict, publish_at: float) -> PublishResult:
        token = self.token_fn(channel)
        warnings: list[str] = []
        info = self._post("/v2/post/publish/creator_info/query/", token, {})
        options = info.get("privacy_level_options") or ["SELF_ONLY"]
        want = "PUBLIC_TO_EVERYONE" if self.audited else "SELF_ONLY"
        privacy = want if want in options else ("SELF_ONLY" if "SELF_ONLY" in options else options[0])
        if not self.audited:
            warnings.append("TikTok API client is not marked as audited: TikTok only allows private (SELF_ONLY) "
                            "posts until the client passes TikTok's content-sharing audit.")
        size = os.path.getsize(file)
        chunk = size if size <= MAX_SINGLE else CHUNK
        count = 1 if size <= MAX_SINGLE else size // CHUNK          # the last chunk absorbs the remainder
        post_info = {"title": meta.get("caption", "")[:2200], "privacy_level": privacy, "disable_duet": False,
                     "disable_comment": False, "disable_stitch": False, "video_cover_timestamp_ms": 1000,
                     "is_aigc": True}
        body = {"post_info": post_info, "source_info": {"source": "FILE_UPLOAD", "video_size": size,
                                                        "chunk_size": chunk, "total_chunk_count": count}}
        try:
            init = self._post("/v2/post/publish/video/init/", token, body)
        except PublishError as e:
            msg = str(e)
            if "unaudited_client_can_only_post_to_private_accounts" in msg and privacy != "SELF_ONLY":
                warnings.append("TikTok refused a public post: the API client is unaudited, so this post is private "
                                "(SELF_ONLY). Pass TikTok's audit to post publicly.")
                post_info["privacy_level"] = "SELF_ONLY"
            elif "is_aigc" in msg or "invalid_param" in msg:
                warnings.append("TikTok rejected the AI-generated-content flag (is_aigc); posted without it — "
                                "add the AI label manually in the TikTok app.")
                post_info.pop("is_aigc", None)
            else:
                raise
            init = self._post("/v2/post/publish/video/init/", token, body)
        publish_id, url = init["publish_id"], init["upload_url"]
        with open(file, "rb") as fh:
            for k in range(count):
                start = k * chunk
                end = size - 1 if k == count - 1 else start + chunk - 1
                fh.seek(start)
                data = fh.read(end - start + 1)
                r = self.http.put(url, headers={"Content-Type": "video/mp4", "Content-Length": str(len(data)),
                                                "Content-Range": f"bytes {start}-{end}/{size}"}, content=data)
                if r.status_code >= 400:
                    raise PublishError(f"TikTok upload chunk {k + 1}/{count}: HTTP {r.status_code} {r.text[:200]}")
        waited = 0.0
        while waited <= self.poll_max_s:
            st = self._post("/v2/post/publish/status/fetch/", token, {"publish_id": publish_id})
            s = st.get("status")
            if s == "PUBLISH_COMPLETE":
                ids = st.get("publicaly_available_post_id") or st.get("publicly_available_post_id") or []
                post_id = str(ids[0]) if ids else publish_id
                return PublishResult(post_id, f"https://www.tiktok.com/video/{post_id}" if ids else "", warnings)
            if s == "FAILED":
                raise PublishError(f"TikTok processing failed: {st.get('fail_reason')}")
            time.sleep(self.poll_s)
            waited += self.poll_s
        raise PublishError(f"TikTok still processing after {self.poll_max_s:.0f} s (publish_id {publish_id})")
