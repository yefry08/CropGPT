"""Copernicus DEM GLO-90 (AWS Open Data, no auth): elevation, slope, insolation index.

Insolation index: direct-beam irradiance on each pixel's slope at solar noon on an equinox, relative to a flat
surface at the same latitude (flat = 1.0; equator-facing slopes > 1, pole-facing < 1). Computed at native 90 m
resolution for both parcels and reference cells so slope is comparable across scales.
"""

from __future__ import annotations

import math

import numpy as np

from ..remote import pmap, polygon_mask, read_window

BASE = "https://copernicus-dem-90m.s3.amazonaws.com"
_META = dict(source="Copernicus DEM GLO-90 (AWS Open Data)", acquisition_date="2011-2015 (TanDEM-X mission)",
             processing_level="DSM, 3 arc-second, COG")


def tile_name(lat: int, lon: int) -> str:
    ns = "N" if lat >= 0 else "S"
    ew = "E" if lon >= 0 else "W"
    return f"Copernicus_DSM_COG_30_{ns}{abs(lat):02d}_00_{ew}{abs(lon):03d}_00_DEM"


def tiles_for(bounds) -> list[str]:
    minx, miny, maxx, maxy = bounds
    lats = range(math.floor(miny), math.ceil(maxy))
    lons = range(math.floor(minx), math.ceil(maxx))
    return [tile_name(la, lo) for la in lats for lo in lons]


def _terrain(rw, poly):
    z = rw.data.astype("float64")
    if z.size == 0:
        return None
    t = rw.transform
    rows = np.arange(z.shape[0])
    lat_rows = t.f + (rows + 0.5) * t.e
    dy = abs(t.e) * 110574.0
    dx = (t.a * 111320.0 * np.cos(np.radians(lat_rows)))[:, None]
    if z.shape[0] < 2 or z.shape[1] < 2:
        dzdr = np.zeros_like(z)
        dzdc = np.zeros_like(z)
    else:
        dzdr, dzdc = np.gradient(z)
    gx = dzdc / dx                 # east-positive gradient
    gn = -dzdr / dy                # north-positive gradient (rows run south)
    slope = np.arctan(np.hypot(gx, gn))
    aspect = np.arctan2(-gx, -gn)  # downslope azimuth, clockwise from north
    lat = np.radians(np.broadcast_to(lat_rows[:, None], z.shape))
    elev_sun = np.radians(90.0) - np.abs(lat)
    az_sun = np.where(lat >= 0, np.pi, 0.0)  # equinox noon sun is due south (N hemisphere) or north (S)
    cos_i = np.cos(slope) * np.sin(elev_sun) + np.sin(slope) * np.cos(elev_sun) * np.cos(aspect - az_sun)
    insol = np.clip(cos_i, 0, None) / np.sin(elev_sun)
    m = polygon_mask(rw, poly) & np.isfinite(z)
    if not m.any():
        return None
    return (float(z[m].sum()), float(np.degrees(slope[m]).sum()), float(insol[m].sum()), int(m.sum()))


def extract(poly, kind: str = "parcel"):
    b = poly.bounds

    def one(name):
        rw = read_window(f"{BASE}/{name}/{name}.tif", b, resampling="nearest",
                         audit_meta=dict(product_id=name, **_META))
        return None if rw is None else _terrain(rw, poly)

    parts = [p for p in pmap(one, tiles_for(b), workers=4) if p is not None]
    n = sum(p[3] for p in parts)
    if n == 0:
        return {"elevation": None, "slope": None, "insolation": None}, {"dem_pixels": 0}
    return ({"elevation": sum(p[0] for p in parts) / n,
             "slope": sum(p[1] for p in parts) / n,
             "insolation": sum(p[2] for p in parts) / n},
            {"dem_pixels": n})
