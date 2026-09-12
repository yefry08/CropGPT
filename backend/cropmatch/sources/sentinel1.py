"""Sentinel-1 dry-season VV backscatter.

Access: Microsoft Planetary Computer `sentinel-1-rtc` (radiometrically terrain-corrected γ⁰ derived from ESA IW
GRD, anonymous SAS token). The spec's primary path is Copernicus Data Space; the GRD product identifiers logged
here are the ESA ones, so each value is traceable to the source scene.

Up to four scenes spread across the dry-season months of S1_YEARS are averaged in linear power, then converted
to dB. Ascending and descending passes are mixed; incidence-angle effects are not normalised (see limitations).
"""

from __future__ import annotations

import math

import numpy as np

from .. import config
from ..remote import get_json, pmap, polygon_mask, read_window
from .sentinel2 import _coverage, month_ranges

PC_STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"


def select_scenes(poly, dry_months, n: int = 4):
    items = []
    for _, start, end in month_ranges(dry_months, config.S1_YEARS):
        body = {"collections": ["sentinel-1-rtc"], "bbox": [round(x, 5) for x in poly.bounds],
                "datetime": f"{start}/{end}", "limit": 100}
        data = get_json(PC_STAC, body=body, audit_meta=dict(
            source="Microsoft Planetary Computer STAC", product_id="sentinel-1-rtc search",
            acquisition_date=f"{start[:10]}/{end[:10]}", processing_level="catalogue search"))
        items += [f for f in data.get("features", []) if _coverage(f, poly) >= 0.5]
    items.sort(key=lambda f: (f["properties"]["datetime"], f["id"]))
    if len(items) <= n:
        return items
    idx = sorted({round(i * (len(items) - 1) / (n - 1)) for i in range(n)})
    return [items[i] for i in idx]


def extract(poly, kind: str, dry_months: list[int] | None):
    if not dry_months:
        return {"s1_vv_dry": None}, {}, "dry season unknown (WorldClim precipitation unavailable)"
    scenes = select_scenes(poly, dry_months)
    if not scenes:
        return ({"s1_vv_dry": None}, {"s1_scenes": []},
                f"no Sentinel-1 RTC scene in dry months {dry_months} of {list(config.S1_YEARS)}")
    b = poly.bounds
    max_px = 256 if kind == "cell" else 600

    def one(item):
        p = item["properties"]
        meta = dict(source="Sentinel-1 IW GRD → RTC via Planetary Computer",
                    product_id=p.get("s1:product_identifier", item["id"]), acquisition_date=p["datetime"][:10],
                    processing_level="L1 GRD, radiometric terrain correction (gamma0), 10 m",
                    orbit_state=p.get("sat:orbit_state"), relative_orbit=p.get("sat:relative_orbit"))
        rw = read_window(item["assets"]["vv"]["href"], b, max_px=max_px, resampling="average",
                         pc_collection="sentinel-1-rtc", valid_range=(1e-6, 100.0), audit_meta=meta)
        if rw is None:
            return None
        m = polygon_mask(rw, poly) & np.isfinite(rw.data)
        if m.sum() < 10:
            return None
        return (item["id"], p["datetime"][:10], float(rw.data[m].mean()), p.get("sat:orbit_state"))

    res = [r for r in pmap(one, scenes, workers=4) if r is not None]
    meta = {"s1_scenes": [{"id": r[0], "date": r[1], "orbit": r[3]} for r in res]}
    if not res:
        return {"s1_vv_dry": None}, meta, "Sentinel-1 scenes found but no valid pixels over the area"
    lin = float(np.mean([r[2] for r in res]))
    return {"s1_vv_dry": 10.0 * math.log10(lin)}, meta, None
