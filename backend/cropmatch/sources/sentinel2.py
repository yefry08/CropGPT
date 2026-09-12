"""Sentinel-2 L2A dry-season water indices.

Access: Element84 Earth Search (AWS Open Data COGs, no auth). The spec's primary path is Copernicus Data Space
STAC/openEO, which needs CDSE OAuth credentials; Earth Search serves the same ESA L2A products (same product IDs).

Dry season = the three driest consecutive months of the WorldClim precipitation climatology for the same area,
so each place is observed in its own dry season. Up to two low-cloud scenes per year in S2_YEARS are used; pixels
are kept only when the Scene Classification Layer marks them vegetation, bare soil, water or unclassified.

NDWI = (B03 − B08) / (B03 + B08)  (McFeeters 1996, open water / canopy water)
NDMI = (B08 − B11) / (B08 + B11)  (Gao 1996 formulation, vegetation and soil moisture)
"""

from __future__ import annotations

import calendar

import numpy as np
from shapely.geometry import shape

from .. import config
from ..remote import get_json, pmap, polygon_mask, read_window

ES = "https://earth-search.aws.element84.com/v1/search"
VALID_SCL = (4, 5, 6, 7)  # vegetation, not-vegetated, water, unclassified
MAX_CLOUD = 20


def month_ranges(months: list[int], years) -> list[tuple[int, str, str]]:
    out = []
    for y in years:
        groups: list[list[int]] = []
        for m in sorted(months):
            if groups and m == groups[-1][-1] + 1:
                groups[-1].append(m)
            else:
                groups.append([m])
        for g in groups:
            last = calendar.monthrange(y, g[-1])[1]
            out.append((y, f"{y}-{g[0]:02d}-01T00:00:00Z", f"{y}-{g[-1]:02d}-{last:02d}T23:59:59Z"))
    return out


def _coverage(item, poly) -> float:
    try:
        return shape(item["geometry"]).intersection(poly).area / poly.area
    except Exception:
        return 0.0


def select_scenes(poly, dry_months, per_year: int = 2):
    chosen = []
    for year, start, end in month_ranges(dry_months, config.S2_YEARS):
        body = {"collections": ["sentinel-2-l2a"], "bbox": [round(x, 5) for x in poly.bounds],
                "datetime": f"{start}/{end}", "query": {"eo:cloud_cover": {"lt": MAX_CLOUD}}, "limit": 100}
        data = get_json(ES, body=body, audit_meta=dict(
            source="Element84 Earth Search STAC", product_id="sentinel-2-l2a search",
            acquisition_date=f"{start[:10]}/{end[:10]}", processing_level="catalogue search"))
        for f in data.get("features", []):
            cov = _coverage(f, poly)
            if cov >= 0.5:
                chosen.append((year, f, cov))
    picked, seen = [], set()
    for year in config.S2_YEARS:
        cands = sorted([c for c in chosen if c[0] == year],
                       key=lambda c: (c[1]["properties"].get("eo:cloud_cover", 100), -c[2], c[1]["id"]))
        n = 0
        for _, f, _ in cands:
            day = f["properties"]["datetime"][:10]
            if day in seen:
                continue
            seen.add(day)
            picked.append(f)
            n += 1
            if n >= per_year:
                break
    return picked


def extract(poly, kind: str, dry_months: list[int] | None):
    keys = ("ndwi_dry", "ndmi_dry")
    if not dry_months:
        return {k: None for k in keys}, {}, "dry season unknown (WorldClim precipitation unavailable)"
    scenes = select_scenes(poly, dry_months)
    if not scenes:
        return ({k: None for k in keys}, {"s2_scenes": []},
                f"no Sentinel-2 L2A scene under {MAX_CLOUD}% cloud in dry months {dry_months} of {list(config.S2_YEARS)}")
    b = poly.bounds
    max_px = 256 if kind == "cell" else 1200

    def one(item):
        p = item["properties"]
        a = item["assets"]
        meta = dict(source="Sentinel-2 L2A via Element84 Earth Search (AWS Open Data)", product_id=item["id"],
                    acquisition_date=p["datetime"][:10],
                    processing_level=f"L2A surface reflectance, processing baseline {p.get('s2:processing_baseline', '?')}",
                    bands="B03,B08,B11,SCL", cloud_cover=p.get("eo:cloud_cover"))
        sw = read_window(a["swir16"]["href"], b, max_px=max_px, resampling="average", audit_meta=meta)
        if sw is None:
            return None
        shp = sw.shape
        g = read_window(a["green"]["href"], b, out_shape=shp, resampling="average")
        n = read_window(a["nir"]["href"], b, out_shape=shp, resampling="average")
        scl = read_window(a["scl"]["href"], b, out_shape=shp, resampling="nearest")
        if g is None or n is None or scl is None:
            return None
        applied = bool(p.get("earthsearch:boa_offset_applied", False))
        baseline = float(p.get("s2:processing_baseline", "0") or 0)
        offset = -1000.0 if (not applied and baseline >= 4.0) else 0.0
        G, N, S = [(x.data + offset) / 10000.0 for x in (g, n, sw)]
        valid = polygon_mask(sw, poly) & np.isin(scl.data, VALID_SCL)
        valid &= (G > 0) & (N > 0) & (S > 0) & np.isfinite(G) & np.isfinite(N) & np.isfinite(S)
        if valid.sum() < 10:
            return None
        ndwi = (G - N) / (G + N)
        ndmi = (N - S) / (N + S)
        return (item["id"], p["datetime"][:10], float(ndwi[valid].mean()), float(ndmi[valid].mean()),
                int(valid.sum()))

    res = [r for r in pmap(one, scenes, workers=4) if r is not None]
    meta = {"s2_scenes": [{"id": r[0], "date": r[1], "valid_px": r[4]} for r in res],
            "s2_dry_months": dry_months}
    if not res:
        return {k: None for k in keys}, meta, "Sentinel-2 scenes found but no clear pixels over the area"
    return ({"ndwi_dry": float(np.mean([r[2] for r in res])), "ndmi_dry": float(np.mean([r[3] for r in res]))},
            meta, None)
