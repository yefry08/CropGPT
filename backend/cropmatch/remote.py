"""Record / replay I/O layer.

Every external read in the pipeline goes through `get_json` or `read_window`. In live mode the request is
executed and, when a record directory is active, the raw response is saved under a hash of the request. In
offline mode the same request is answered from the saved response, so the offline demo runs the exact same
feature code on the exact same raw data — nothing is summarised or hand-entered.
"""

from __future__ import annotations

import contextvars
import hashlib
import json
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable

import httpx
import numpy as np

# GDAL tuning for cloud-optimised GeoTIFF range reads. Must be set before rasterio opens anything remote.
for _k, _v in {
    "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
    "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif,.tiff,.TIF",
    "GDAL_HTTP_MAX_RETRY": "5",
    "GDAL_HTTP_RETRY_DELAY": "2",
    "GDAL_HTTP_TIMEOUT": "90",
    "GDAL_HTTP_MULTIRANGE": "YES",
    "GDAL_HTTP_MERGE_CONSECUTIVE_RANGES": "YES",
    "VSI_CACHE": "TRUE",
    "VSI_CACHE_SIZE": "67108864",
    "GDAL_CACHEMAX": "512",
    "AWS_NO_SIGN_REQUEST": "YES",
}.items():
    os.environ.setdefault(_k, _v)

import rasterio  # noqa: E402
from rasterio.enums import Resampling  # noqa: E402
from rasterio.errors import RasterioIOError  # noqa: E402
from rasterio.transform import Affine  # noqa: E402
from rasterio.warp import transform_bounds  # noqa: E402
from rasterio.windows import Window, from_bounds  # noqa: E402

from . import audit  # noqa: E402


class OfflineMiss(RuntimeError):
    """Offline mode was asked for a response that was never recorded."""


@dataclass
class IOContext:
    mode: str = "live"                       # "live" | "offline"
    record_dir: Path | None = None           # live: save raw responses here
    replay_dirs: list[Path] = field(default_factory=list)  # offline: look responses up here


_ctx: contextvars.ContextVar[IOContext] = contextvars.ContextVar("cropmatch_io", default=IOContext())


@contextmanager
def io_context(ctx: IOContext):
    token = _ctx.set(ctx)
    try:
        yield ctx
    finally:
        _ctx.reset(token)


def current() -> IOContext:
    return _ctx.get()


def pmap(fn: Callable, items: Iterable, workers: int = 8) -> list:
    """Thread-pool map that carries the I/O and audit context into worker threads."""
    items = list(items)
    if not items:
        return []
    if workers <= 1 or len(items) == 1:
        return [fn(i) for i in items]
    with ThreadPoolExecutor(max_workers=min(workers, len(items))) as ex:
        futures = [ex.submit(contextvars.copy_context().run, fn, i) for i in items]
        return [f.result() for f in futures]


def _key(payload: dict) -> str:
    return hashlib.sha1(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _lookup(key: str, suffix: str) -> Path | None:
    for d in current().replay_dirs:
        p = Path(d) / f"{key}{suffix}"
        if p.exists():
            return p
    return None


def _record_path(key: str, suffix: str) -> Path | None:
    rd = current().record_dir
    if rd is None:
        return None
    rd.mkdir(parents=True, exist_ok=True)
    return rd / f"{key}{suffix}"


# --------------------------------------------------------------------------- HTTP / JSON

_http = httpx.Client(timeout=httpx.Timeout(60.0, connect=20.0), follow_redirects=True,
                     headers={"User-Agent": "cropmatch-analog-engine/0.1"})


def get_json(url: str, *, params: dict | list | None = None, body: dict | None = None,
             audit_meta: dict | None = None, retries: int = 4) -> Any:
    """GET (or POST when `body` is given) a JSON document through the record/replay layer."""
    key = _key({"kind": "json", "url": url, "params": params, "body": body})
    ctx = current()
    meta = audit_meta or {}
    if ctx.mode == "offline":
        path = _lookup(key, ".json")
        if path is None:
            raise OfflineMiss(f"no recorded response for {url}")
        data = json.loads(path.read_text(encoding="utf-8"))
        if meta:
            audit.log(mode="replay", url=url, **meta)
        return data

    last: Exception | None = None
    for attempt in range(retries):
        try:
            if body is not None:
                r = _http.post(url, json=body, params=params)
            else:
                r = _http.get(url, params=params)
            if r.status_code in (429, 500, 502, 503, 504):
                raise httpx.HTTPStatusError(f"{r.status_code}", request=r.request, response=r)
            r.raise_for_status()
            data = r.json()
            break
        except (httpx.HTTPError, ValueError) as e:
            last = e
            status = getattr(getattr(e, "response", None), "status_code", None)
            if status is not None and status < 500 and status != 429:
                raise
            time.sleep(1.5 * (2 ** attempt))
    else:
        raise RuntimeError(f"request failed after {retries} attempts: {url}: {last}")

    out = _record_path(key, ".json")
    if out is not None:
        out.write_text(json.dumps(data), encoding="utf-8")
    if meta:
        audit.log(mode="live", url=url, **meta)
    return data


# --------------------------------------------------------------------------- Planetary Computer signing

_pc_tokens: dict[str, tuple[str, float]] = {}
_pc_lock = threading.Lock()


def pc_sign(href: str, collection: str | None = None) -> str:
    """Append a Planetary Computer SAS token (anonymous, no account needed) to a blob href.

    Tokens are scoped to a storage account + container, which is read from the href itself.
    """
    from urllib.parse import urlparse

    u = urlparse(href)
    account = u.netloc.split(".")[0]
    container = u.path.lstrip("/").split("/")[0]
    scope = f"{account}/{container}"
    with _pc_lock:
        tok = _pc_tokens.get(scope)
        if tok is None or tok[1] - time.time() < 300:
            r = _http.get(f"https://planetarycomputer.microsoft.com/api/sas/v1/token/{scope}")
            r.raise_for_status()
            # Tokens last ~45 min or more; refresh 5 min before a conservative 40-minute lifetime.
            tok = (r.json()["token"], time.time() + 40 * 60)
            _pc_tokens[scope] = tok
    return f"{href}?{tok[0]}"


# --------------------------------------------------------------------------- raster windows

@dataclass
class RasterWindow:
    data: np.ndarray          # float32, NaN where nodata
    transform: Affine
    crs_wkt: str

    @property
    def shape(self) -> tuple[int, int]:
        return self.data.shape


def read_window(
    href: str,
    bounds_wgs84: tuple[float, float, float, float],
    *,
    max_px: int | None = None,
    out_shape: tuple[int, int] | None = None,
    resampling: str = "average",
    pc_collection: str | None = None,
    scale: float | None = None,
    valid_range: tuple[float, float] | None = None,
    audit_meta: dict | None = None,
) -> RasterWindow | None:
    """Read band 1 of a (local or remote) raster over a lon/lat bounding box.

    Returns None when the raster does not overlap the box or does not exist (e.g. an ocean DEM tile).
    `max_px` caps the longest side (GDAL then reads from overviews); `out_shape` forces an exact shape so bands
    of different native resolution line up. `valid_range` is applied to raw values before `scale`.
    """
    rkey = {"kind": "raster", "href": href, "bounds": [round(b, 6) for b in bounds_wgs84], "max_px": max_px,
            "out_shape": list(out_shape) if out_shape else None, "resampling": resampling,
            "scale": scale, "valid_range": list(valid_range) if valid_range else None}
    key = _key(rkey)
    ctx = current()
    meta = audit_meta or {}
    if ctx.mode == "offline":
        path = _lookup(key, ".npz")
        if path is None:
            raise OfflineMiss(f"no recorded raster window for {href}")
        z = np.load(path, allow_pickle=False)
        if meta:
            audit.log(mode="replay", url=href, **meta)
        if bool(z["empty"]):
            return None
        return RasterWindow(z["data"], Affine(*z["transform"].tolist()), str(z["crs"]))

    rw = _read_live(href, bounds_wgs84, max_px=max_px, out_shape=out_shape, resampling=resampling,
                    pc_collection=pc_collection, scale=scale, valid_range=valid_range)
    out = _record_path(key, ".npz")
    if out is not None:
        if rw is None:
            np.savez_compressed(out, empty=True, data=np.zeros((0, 0), np.float32), transform=np.zeros(6), crs="")
        else:
            np.savez_compressed(out, empty=False, data=rw.data, transform=np.array(tuple(rw.transform)[:6]),
                                crs=rw.crs_wkt)
    if meta:
        audit.log(mode="live", url=href, **meta)
    return rw


def _read_live(href, bounds_wgs84, *, max_px, out_shape, resampling, pc_collection, scale, valid_range):
    url = href
    if href.startswith("static:"):
        # Local static rasters are keyed by a machine-independent name so recorded fixtures replay anywhere.
        from . import config

        url = str(config.STATIC / href[len("static:"):])
    elif href.startswith("http"):
        if pc_collection:
            url = pc_sign(href, pc_collection)
        url = f"/vsicurl/{url}"
    last: Exception | None = None
    for attempt in range(3):
        try:
            with rasterio.open(url) as src:
                return _window_from(src, bounds_wgs84, max_px, out_shape, resampling, scale, valid_range)
        except RasterioIOError as e:
            msg = str(e)
            if "404" in msg or "does not exist" in msg or "No such file" in msg or "not recognized" in msg:
                return None
            last = e
            time.sleep(1.5 * (2 ** attempt))
    raise RuntimeError(f"raster read failed: {href}: {last}")


def _window_from(src, bounds_wgs84, max_px, out_shape, resampling, scale, valid_range) -> RasterWindow | None:
    crs_wkt = src.crs.to_wkt()
    if src.crs.to_epsg() == 4326:
        b = bounds_wgs84
    else:
        b = transform_bounds("EPSG:4326", src.crs, *bounds_wgs84, densify_pts=21)
    left, bottom = max(b[0], src.bounds.left), max(b[1], src.bounds.bottom)
    right, top = min(b[2], src.bounds.right), min(b[3], src.bounds.top)
    if right <= left or top <= bottom:
        return None
    win = from_bounds(left, bottom, right, top, transform=src.transform)
    col0, row0 = int(np.floor(win.col_off)), int(np.floor(win.row_off))
    col1, row1 = int(np.ceil(win.col_off + win.width)), int(np.ceil(win.row_off + win.height))
    col0, row0 = max(col0, 0), max(row0, 0)
    col1, row1 = min(col1, src.width), min(row1, src.height)
    if col1 <= col0 or row1 <= row0:
        return None
    win = Window(col0, row0, col1 - col0, row1 - row0)
    h, w = int(win.height), int(win.width)
    if out_shape is not None:
        oh, ow = out_shape
    elif max_px is not None and max(h, w) > max_px:
        f = max_px / max(h, w)
        oh, ow = max(1, int(round(h * f))), max(1, int(round(w * f)))
    else:
        oh, ow = h, w
    arr = src.read(1, window=win, out_shape=(oh, ow), resampling=getattr(Resampling, resampling),
                   masked=True).astype("float32")
    data = arr.filled(np.nan)
    if valid_range is not None:
        data[(data < valid_range[0]) | (data > valid_range[1])] = np.nan
    if scale is not None:
        data = data * np.float32(scale)
    transform = src.window_transform(win) * Affine.scale(w / ow, h / oh)
    return RasterWindow(data, transform, crs_wkt)


def polygon_mask(rw: RasterWindow, poly_wgs84) -> np.ndarray:
    """Boolean mask of the window's pixels that touch the polygon."""
    from pyproj import CRS
    from rasterio.features import geometry_mask

    from .geo import to_crs

    crs = CRS.from_wkt(rw.crs_wkt)
    geom = poly_wgs84 if crs.is_geographic else to_crs(poly_wgs84, rw.crs_wkt)
    return geometry_mask([geom], out_shape=rw.shape, transform=rw.transform, invert=True, all_touched=True)


def masked_values(rw: RasterWindow | None, poly_wgs84) -> np.ndarray:
    """Finite pixel values of a window that touch the polygon (empty array if none)."""
    if rw is None or rw.data.size == 0:
        return np.empty(0, np.float32)
    v = rw.data[polygon_mask(rw, poly_wgs84)]
    return v[np.isfinite(v)]
