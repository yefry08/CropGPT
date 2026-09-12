"""Derive static layers from the downloaded WorldClim rasters.

Writes data/static/derived/pet_hargreaves_annual_10m.tif — annual potential evapotranspiration (mm/yr) from the
Hargreaves–Samani equation (Hargreaves & Samani 1985; FAO-56 eq. 52) with extraterrestrial radiation from FAO-56
eqs. 21–25, using WorldClim v2.1 monthly Tmin and Tmax.

    PET_day = 0.0023 · 0.408 · Ra · (Tmean + 17.8) · sqrt(Tmax − Tmin)
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[1]
WC = ROOT / "data" / "static" / "worldclim"
OUT = ROOT / "data" / "static" / "derived" / "pet_hargreaves_annual_10m.tif"

MID_MONTH_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def extraterrestrial_radiation(lat_rad: np.ndarray, doy: int) -> np.ndarray:
    """FAO-56 eq. 21: Ra in MJ m-2 day-1."""
    gsc = 0.0820
    dr = 1 + 0.033 * np.cos(2 * np.pi * doy / 365)
    decl = 0.409 * np.sin(2 * np.pi * doy / 365 - 1.39)
    ws = np.arccos(np.clip(-np.tan(lat_rad) * np.tan(decl), -1.0, 1.0))
    return (24 * 60 / np.pi) * gsc * dr * (ws * np.sin(lat_rad) * np.sin(decl)
                                           + np.cos(lat_rad) * np.cos(decl) * np.sin(ws))


def retile_soilgrids() -> None:
    """ISRIC's 5 km aggregates are stored in wide strips; retile them (lossless) so window reads stay cheap."""
    import os

    from rasterio.shutil import copy

    for f in sorted((ROOT / "data" / "static" / "soilgrids").glob("*_mean_5000.tif")):
        with rasterio.open(f) as s:
            prof = s.profile
        if prof.get("tiled") and prof.get("blockxsize") == 256:
            continue
        tmp = f.with_suffix(".tiled.tif")
        copy(f, tmp, driver="GTiff", tiled=True, blockxsize=256, blockysize=256, compress="deflate")
        os.replace(tmp, f)
        print(f"retiled {f.name}")


def main() -> int:
    retile_soilgrids()
    if OUT.exists() and "--force" not in sys.argv:
        print(f"exists: {OUT}")
        return 0
    with rasterio.open(WC / "wc2.1_10m_tmin_01.tif") as src:
        profile = src.profile
        t = src.transform
        h, w = src.height, src.width
    lat = np.radians(t.f + (np.arange(h) + 0.5) * t.e)[:, None] * np.ones((1, w))
    pet = np.zeros((h, w), dtype="float64")
    nodata = np.zeros((h, w), dtype=bool)
    for m in range(12):
        with rasterio.open(WC / f"wc2.1_10m_tmin_{m + 1:02d}.tif") as a, \
                rasterio.open(WC / f"wc2.1_10m_tmax_{m + 1:02d}.tif") as b:
            tmin = a.read(1, masked=True)
            tmax = b.read(1, masked=True)
        nodata |= np.ma.getmaskarray(tmin) | np.ma.getmaskarray(tmax)
        tmin, tmax = tmin.filled(0).astype("float64"), tmax.filled(0).astype("float64")
        ra = extraterrestrial_radiation(lat, MID_MONTH_DOY[m])
        daily = 0.0023 * 0.408 * ra * ((tmin + tmax) / 2 + 17.8) * np.sqrt(np.clip(tmax - tmin, 0, None))
        pet += np.clip(daily, 0, None) * DAYS[m]
    pet[nodata] = -9999.0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    profile.update(dtype="float32", nodata=-9999.0, compress="deflate", count=1)
    with rasterio.open(OUT, "w", **profile) as dst:
        dst.write(pet.astype("float32"), 1)
    valid = pet[~nodata]
    print(f"wrote {OUT} — PET mm/yr: min {valid.min():.0f}, median {np.median(valid):.0f}, max {valid.max():.0f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
