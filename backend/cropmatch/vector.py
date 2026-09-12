"""Compute (or load) the 24-dimension biophysical vector for a parcel or a reference cell."""

from __future__ import annotations

import json
import math
import time
from datetime import datetime, timezone

from . import audit, config, remote
from .features import FEATURE_KEYS
from .geo import area_km2, parcel_key, to_geojson
from .sources import dem, modis, sentinel1, sentinel2, soilgrids, worldclim, worldcover

FIXTURE_RESPONSES = config.FIXTURES / "responses"

# Where the implementation deviates from the access path named in the spec, and why. Shown in every result.
SOURCE_NOTES = [
    "Mean annual ET and WUE come from MODIS MOD16A3GF.061 / MOD17A3HGF.061, not ECOSTRESS: ECOSTRESS "
    "(ECO3ETPTJPL, ECO4WUE) is Tier 2 and needs an Earthdata token. Values are real MODIS granules, see provenance.",
    "Sentinel-2 L2A is read from Element84 Earth Search (AWS Open Data) and Sentinel-1 RTC and MODIS from "
    "Microsoft Planetary Computer, which need no credentials. They serve the same ESA / NASA products as "
    "Copernicus Data Space and AppEEARS; product IDs in the audit log are the original ESA / NASA IDs.",
    "Aridity index uses Hargreaves PET computed from WorldClim monthly temperatures, not Penman–Monteith.",
    "GEDI, AIRS and ECOSTRESS (Tier 2) and Landsat / VIIRS long-term series are not part of this vector yet.",
]


def _run(label: str, keys: tuple[str, ...], fn, values: dict, missing: dict, meta: dict, status: list) -> None:
    t0 = time.time()
    note = None
    try:
        out = fn()
        vals, m = out[0], out[1]
        reason = out[2] if len(out) > 2 else None
        meta.update(m or {})
        for k in keys:
            v = vals.get(k)
            if v is None or (isinstance(v, float) and not math.isfinite(v)):
                missing[k] = reason or f"{label}: no data over this area"
            else:
                values[k] = float(v)
        note = reason
    except remote.OfflineMiss:
        note = "offline mode: this request was never recorded"
        for k in keys:
            missing[k] = f"{label}: {note}"
    except Exception as e:  # graceful degradation: drop the dimensions, say why
        note = f"{type(e).__name__}: {str(e)[:240]}"
        for k in keys:
            missing[k] = f"{label} unavailable ({type(e).__name__})"
    status.append({"source": label, "dimensions": list(keys), "ok": all(values[k] is not None for k in keys),
                   "seconds": round(time.time() - t0, 1), "note": note})


def compute(poly, *, kind: str = "parcel", name: str | None = None, profile_extras: bool = True) -> dict:
    values: dict[str, float | None] = {k: None for k in FEATURE_KEYS}
    missing: dict[str, str] = {}
    meta: dict = {}
    status: list[dict] = []
    t0 = time.time()
    with audit.collect() as provenance:
        _run("WorldClim v2.1", ("mat", "temp_seasonality", "tmax_warmest", "tmin_coldest", "annual_precip",
                                "precip_seasonality", "aridity_index"),
             lambda: worldclim.extract(poly, kind), values, missing, meta, status)
        dry = meta.get("dry_quarter_months")
        jobs = [
            ("ISRIC SoilGrids v2.0", ("ph", "soc", "clay", "sand", "cec", "bdod", "cfvo"),
             lambda: soilgrids.extract(poly, kind)),
            ("Copernicus DEM GLO-90", ("elevation", "slope", "insolation"), lambda: dem.extract(poly, kind)),
            ("MODIS MOD13Q1 phenology", ("ndvi_amplitude", "growing_season_days"),
             lambda: modis.phenology(poly, kind)),
            ("MODIS MOD16A3GF/MOD17A3HGF", ("et_annual", "wue"), lambda: modis.et_wue(poly, kind)),
            ("Sentinel-2 L2A", ("ndwi_dry", "ndmi_dry"), lambda: sentinel2.extract(poly, kind, dry)),
            ("Sentinel-1 RTC", ("s1_vv_dry",), lambda: sentinel1.extract(poly, kind, dry)),
        ]
        results: list[tuple[dict, dict, dict, list]] = []

        def job(j):
            v, mi, me, st = {k: None for k in j[1]}, {}, {}, []
            _run(j[0], j[1], j[2], v, mi, me, st)
            return v, mi, me, st

        results = remote.pmap(job, jobs, workers=len(jobs))
        for v, mi, me, st in results:
            values.update({k: x for k, x in v.items() if x is not None})
            missing.update(mi)
            meta.update(me)
            status += st
        if profile_extras:
            try:
                meta["land_cover"] = worldcover.land_cover(poly)
            except remote.OfflineMiss:
                meta["land_cover"] = None
            except Exception as e:
                meta["land_cover"] = None
                meta["land_cover_error"] = f"{type(e).__name__}"

    c = poly.centroid
    return {
        "key": parcel_key(poly),
        "kind": kind,
        "name": name,
        "geometry": to_geojson(poly),
        "centroid": {"lat": c.y, "lon": c.x},
        "area_km2": area_km2(poly),
        "values": values,
        "missing": missing,
        "n_available": sum(v is not None for v in values.values()),
        "meta": meta,
        "sources": status,
        "source_notes": SOURCE_NOTES,
        "provenance": provenance,
        "mode": remote.current().mode,
        "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "seconds": round(time.time() - t0, 1),
    }


def get_or_compute(poly, *, name: str | None = None, mode: str | None = None, record: bool = False,
                   refresh: bool = False) -> dict:
    """Parcel vectors are cached on disk by geohash; satellite reads are never repeated for the same parcel."""
    mode = mode or config.DEMO_MODE
    key = parcel_key(poly)
    path = config.CACHE / "vectors" / f"{key}.json"
    if path.exists() and not refresh:
        vec = json.loads(path.read_text(encoding="utf-8"))
        vec["cache"] = "hit"
        return vec
    if mode == "offline":
        ctx = remote.IOContext(mode="offline", replay_dirs=[FIXTURE_RESPONSES])
    else:
        ctx = remote.IOContext(mode="live", record_dir=FIXTURE_RESPONSES if record else None)
    with remote.io_context(ctx):
        vec = compute(poly, kind="parcel", name=name)
    # Don't cache an offline miss as if it were the answer — it would hide the parcel from a later live run.
    if not (mode == "offline" and vec["n_available"] == 0):
        path.write_text(json.dumps(vec, ensure_ascii=False), encoding="utf-8")
    vec["cache"] = "miss"
    return vec
