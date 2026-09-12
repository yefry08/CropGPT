"""MODIS (Terra) products from the Microsoft Planetary Computer mirror (anonymous SAS tokens, no account).

The spec names NASA AppEEARS as the access path; AppEEARS needs an Earthdata token, while Planetary Computer
serves the same LP DAAC collection 6.1 granules as COGs without one. Product IDs in the audit log are the LP DAAC
granule IDs, so every value remains traceable to the NASA granule.

* Vegetation regime — MOD13Q1.061 250 m 16-day NDVI, 2023–2025: a per-composite climatology (median across
  years) gives NDVI amplitude and growing-season length.
* Water — MOD16A3GF.061 annual ET and MOD17A3HGF.061 annual GPP give mean annual ET and WUE = GPP / ET.
  The spec names ECOSTRESS for these; ECOSTRESS integration is Tier 2 and the substitution is reported.
"""

from __future__ import annotations

from datetime import datetime
from functools import lru_cache

import numpy as np

from .. import config
from ..geo import sinusoidal_tile
from ..remote import get_json, pmap, polygon_mask, read_window

PC_STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
N_BINS = 23  # 16-day composites per year


def _search(collection: str, h: int, v: int, start: str, end: str) -> list[dict]:
    return list(_search_cached(collection, h, v, start, end))


@lru_cache(maxsize=512)
def _search_cached(collection: str, h: int, v: int, start: str, end: str) -> tuple:
    body = {"collections": [collection], "datetime": f"{start}T00:00:00Z/{end}T23:59:59Z",
            # No platform filter: Planetary Computer leaves `platform` empty on some Terra granules, so
            # Terra (MOD*) vs Aqua (MYD*) is decided from the granule ID by the callers instead.
            "query": {"modis:horizontal-tile": {"eq": h}, "modis:vertical-tile": {"eq": v}},
            "limit": 250}
    feats: list[dict] = []
    page = 0
    while True:
        data = get_json(PC_STAC, body=body, audit_meta=dict(
            source="Microsoft Planetary Computer STAC", product_id=f"{collection} h{h:02d}v{v:02d} page {page}",
            acquisition_date=f"{start}/{end}", processing_level="catalogue search"))
        feats += data.get("features", [])
        nxt = next((l for l in data.get("links", []) if l.get("rel") == "next"), None)
        if not nxt or not nxt.get("body") or page > 10:
            break
        body = nxt["body"]
        page += 1
    feats.sort(key=lambda f: f["id"])
    return tuple(feats)


def _granule_meta(item: dict, level: str) -> dict:
    p = item["properties"]
    return dict(source=f"NASA LP DAAC {item['collection']} via Planetary Computer", product_id=item["id"],
                acquisition_date=f"{p.get('start_datetime', '')[:10]}/{p.get('end_datetime', '')[:10]}",
                processing_level=level)


# --------------------------------------------------------------------------- vegetation regime

def phenology(poly, kind: str):
    c = poly.centroid
    h, v = sinusoidal_tile(c.y, c.x)
    y0, y1 = min(config.MODIS_VI_YEARS), max(config.MODIS_VI_YEARS)
    items = [i for i in _search("modis-13Q1-061", h, v, f"{y0}-01-01", f"{y1}-12-31") if i["id"].startswith("MOD13Q1")]
    b = poly.bounds

    def one(item):
        ndvi = read_window(item["assets"]["250m_16_days_NDVI"]["href"], b, resampling="nearest",
                           pc_collection="modis-13Q1-061", valid_range=(-2000, 10000), scale=1e-4,
                           audit_meta=_granule_meta(item, "L3 16-day composite, 250 m, collection 6.1"))
        rel = read_window(item["assets"]["250m_16_days_pixel_reliability"]["href"], b, resampling="nearest",
                          pc_collection="modis-13Q1-061")
        if ndvi is None or rel is None or ndvi.shape != rel.shape:
            return None
        m = polygon_mask(ndvi, poly) & np.isfinite(ndvi.data) & (rel.data <= 1)  # 0 good, 1 marginal
        if m.sum() == 0:
            return None
        start = datetime.fromisoformat(item["properties"]["start_datetime"].replace("Z", "+00:00"))
        doy = start.timetuple().tm_yday
        return (start.year, (doy - 1) // 16, float(ndvi.data[m].mean()))

    obs = [o for o in pmap(one, items, workers=12) if o is not None]
    meta = {"modis_vi_granules": len(items), "modis_vi_valid_composites": len(obs)}
    if not obs:
        return {"ndvi_amplitude": None, "growing_season_days": None}, meta, "no valid MOD13Q1 composites"
    curve = np.full(N_BINS, np.nan)
    for b_ in range(N_BINS):
        vals = [o[2] for o in obs if o[1] == b_]
        if vals:
            curve[b_] = float(np.median(vals))
    missing = int(np.isnan(curve).sum())
    if missing > 5:
        return ({"ndvi_amplitude": None, "growing_season_days": None}, meta,
                f"only {N_BINS - missing}/{N_BINS} composite periods observed")
    if missing:
        idx = np.arange(N_BINS)
        ok = ~np.isnan(curve)
        curve = np.interp(idx, np.concatenate([idx[ok] - N_BINS, idx[ok], idx[ok] + N_BINS]),
                          np.tile(curve[ok], 3))
    lo, hi = float(curve.min()), float(curve.max())
    amp = hi - lo
    gsl = int(min(365, (curve >= lo + 0.5 * amp).sum() * 16)) if amp > 0 else 0
    meta.update({"ndvi_climatology": [round(float(x), 4) for x in curve], "ndvi_bins_interpolated": missing})
    return {"ndvi_amplitude": amp, "growing_season_days": float(gsl)}, meta, None


# --------------------------------------------------------------------------- water: ET and WUE

def et_wue(poly, kind: str):
    c = poly.centroid
    h, v = sinusoidal_tile(c.y, c.x)
    y0, y1 = min(config.MODIS_ANNUAL_YEARS), max(config.MODIS_ANNUAL_YEARS)
    et_items = {i["id"].split(".")[1]: i for i in _search("modis-16A3GF-061", h, v, f"{y0}-01-01", f"{y1}-12-31")
                if i["id"].startswith("MOD16A3GF")}
    gpp_items = {i["id"].split(".")[1]: i for i in _search("modis-17A3HGF-061", h, v, f"{y0}-01-01", f"{y1}-12-31")
                 if i["id"].startswith("MOD17A3HGF")}
    years = sorted(set(et_items) & set(gpp_items))
    b = poly.bounds

    def one(yk):
        et = read_window(et_items[yk]["assets"]["ET_500m"]["href"], b, resampling="nearest",
                         pc_collection="modis-16A3GF-061", valid_range=(0, 32700), scale=0.1,
                         audit_meta=_granule_meta(et_items[yk], "L4 annual gap-filled ET, 500 m, collection 6.1"))
        gpp = read_window(gpp_items[yk]["assets"]["Gpp_500m"]["href"], b, resampling="nearest",
                          pc_collection="modis-17A3HGF-061", valid_range=(0, 30000), scale=1e-4,
                          audit_meta=_granule_meta(gpp_items[yk], "L4 annual gap-filled GPP, 500 m, collection 6.1"))
        if et is None or gpp is None or et.shape != gpp.shape:
            return None
        inside = polygon_mask(et, poly)
        et_ok = inside & np.isfinite(et.data)
        both = et_ok & np.isfinite(gpp.data) & (et.data > 0)
        return (int(inside.sum()), et.data[et_ok], gpp.data[both] * 1000.0, et.data[both])

    res = [r for r in pmap(one, years, workers=6) if r is not None]
    meta = {"modis_et_years": [int(y[1:5]) for y in years]}
    if not res:
        return {"et_annual": None, "wue": None}, meta, "no MOD16A3GF/MOD17A3HGF granules for this tile"
    total = sum(r[0] for r in res)
    et_vals = np.concatenate([r[1] for r in res])
    if total == 0 or et_vals.size / total < 0.10:
        # MOD16 leaves barren, urban and water pixels as fill values; we do not guess a number for them.
        return ({"et_annual": None, "wue": None}, meta,
                "MOD16A3GF has fill values over this area (typical for barren, urban or water pixels)")
    gpp_sum = float(np.concatenate([r[2] for r in res]).sum())
    et_sum = float(np.concatenate([r[3] for r in res]).sum())
    meta["modis_et_valid_share"] = round(et_vals.size / total, 3)
    return {"et_annual": float(et_vals.mean()), "wue": (gpp_sum / et_sum) if et_sum > 0 else None}, meta, None
