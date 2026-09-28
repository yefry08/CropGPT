"""Instagram Graph API — Reels on a Business/Creator account.

Default: resumable upload, no public URL needed (Meta's current Content Publishing docs):
  POST graph.facebook.com/{ver}/{ig-user-id}/media  media_type=REELS, upload_type=resumable, caption
  POST rupload.facebook.com/ig-api-upload/{ver}/{container-id}   headers: Authorization: OAuth <token>,
       offset: 0, file_size: <bytes>; body = the file
  GET  graph.facebook.com/{ver}/{container-id}?fields=status_code   until FINISHED (or ERROR/EXPIRED)
  POST graph.facebook.com/{ver}/{ig-user-id}/media_publish  creation_id=<container-id>
Fallback `video_url` mode (the original API contract): the file is put at a temporary public URL
(S3-compatible presigned URL) that is deleted after publishing.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Callable

import httpx

from .. import secrets
from .common import NotConnected, PublishError, PublishResult

GRAPH, RUPLOAD = "https://graph.facebook.com", "https://rupload.facebook.com"


def token_key(channel: str) -> str:
    return f"oauth:instagram:{channel}"          # JSON {"access_token": "...", "ig_user_id": "..."}


def credentials(channel: str) -> tuple[str, str]:
    import json
    raw = secrets.get_secret(token_key(channel))
    if not raw:
        raise NotConnected(f"Instagram is not connected for channel '{channel}' (Settings → Instagram)")
    d = json.loads(raw)
    secrets._register(d["access_token"])
    return d["access_token"], d["ig_user_id"]


class InstagramPublisher:
    def __init__(self, *, version: str = "v25.0", mode: str = "resumable", creds_fn: Callable = credentials,
                 temp_host: Callable[[Path], tuple[str, Callable[[], None]]] | None = None,
                 graph: str = GRAPH, rupload: str = RUPLOAD, client: httpx.Client | None = None,
                 poll_s: float = 5.0, poll_max_s: float = 900.0):
        self.version, self.mode, self.creds_fn, self.temp_host = version, mode, creds_fn, temp_host
        self.graph, self.rupload = graph.rstrip("/"), rupload.rstrip("/")
        self.http = client or httpx.Client(timeout=httpx.Timeout(60, read=900))
        self.poll_s, self.poll_max_s = poll_s, poll_max_s

    def _ok(self, r: httpx.Response, what: str) -> dict:
        data = r.json() if r.content else {}
        if r.status_code >= 400 or "error" in data:
            err = data.get("error", {})
            if err.get("code") in (190, 102) or r.status_code == 401:
                raise NotConnected(f"Instagram {what}: token invalid/expired — reconnect ({err.get('message', '')})")
            raise PublishError(f"Instagram {what}: {err.get('message') or r.text[:300]}")
        return data

    def publish(self, channel: str, file: Path, meta: dict, publish_at: float) -> PublishResult:
        token, ig_user = self.creds_fn(channel)
        base = f"{self.graph}/{self.version}"
        caption = meta.get("caption", "")[:2200]
        cleanup = None
        if self.mode == "resumable":
            c = self._ok(self.http.post(f"{base}/{ig_user}/media", data={"media_type": "REELS", "upload_type": "resumable",
                                        "caption": caption, "access_token": token}), "create container")
            cid = c["id"]
            size = os.path.getsize(file)
            with open(file, "rb") as fh:
                r = self.http.post(f"{self.rupload}/ig-api-upload/{self.version}/{cid}",
                                   headers={"Authorization": f"OAuth {token}", "offset": "0", "file_size": str(size)},
                                   content=fh.read())
            self._ok(r, "upload")
        else:
            if not self.temp_host:
                raise NotConnected("Instagram video_url mode needs a temporary public host (S3-compatible) in Settings")
            url, cleanup = self.temp_host(file)
            c = self._ok(self.http.post(f"{base}/{ig_user}/media", data={"media_type": "REELS", "video_url": url,
                                        "caption": caption, "access_token": token}), "create container")
            cid = c["id"]
        try:
            waited = 0.0
            while True:
                st = self._ok(self.http.get(f"{base}/{cid}", params={"fields": "status_code,status",
                                                                      "access_token": token}), "status")
                code = st.get("status_code")
                if code == "FINISHED":
                    break
                if code in ("ERROR", "EXPIRED"):
                    raise PublishError(f"Instagram processing {code}: {st.get('status', '')}")
                if waited > self.poll_max_s:
                    raise PublishError(f"Instagram still processing after {self.poll_max_s:.0f} s")
                time.sleep(self.poll_s)
                waited += self.poll_s
            pub = self._ok(self.http.post(f"{base}/{ig_user}/media_publish", data={"creation_id": cid,
                                          "access_token": token}), "media_publish")
        finally:
            if cleanup:
                cleanup()
        media_id = pub["id"]
        link = self._ok(self.http.get(f"{base}/{media_id}", params={"fields": "permalink", "access_token": token}),
                        "permalink").get("permalink", "")
        return PublishResult(media_id, link, ["Instagram's API has no AI-content label: mark it in the app if needed."])


def s3_temp_host(bucket: str, prefix: str = "channelforge-tmp/", expires_s: int = 3600, **client_kw):
    """Temporary public URL via an S3-compatible bucket (AWS S3, Cloudflare R2, …): upload, presign, delete."""
    def host(file: Path):
        import boto3                                    # optional dependency, only for video_url mode
        s3 = boto3.client("s3", **client_kw)
        key = f"{prefix}{int(time.time())}-{file.name}"
        s3.upload_file(str(file), bucket, key, ExtraArgs={"ContentType": "video/mp4"})
        url = s3.generate_presigned_url("get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=expires_s)
        return url, lambda: s3.delete_object(Bucket=bucket, Key=key)
    return host
