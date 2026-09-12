"""WorldClim v2.1 bioclimatic normals (1970–2000), 10 arc-minute, read from local GeoTIFFs.

Aridity index = annual precipitation / annual PET. WorldClim ships no PET layer, so PET is computed with the
Hargreaves–Samani equation from WorldClim monthly Tmin/Tmax and extraterrestrial radiation (FAO-56 eq. 21);
see scripts/prepare_static.py. This differs from Penman–Monteith-based aridity products (e.g. the CGIAR Global
Aridity Index) and is documented as a limitation.
"""

from __future__ import annotations

import numpy as np

from ..remote import masked_values, read_window

BIO = {"mat": 1, "temp_seasonality": 4, "tmax_warmest": 5, "tmin_coldest": 6, "annual_precip": 12,
       "precip_seasonality": 15}
PET_FILE = "static:derived/pet_hargreaves_annual_10m.tif"

_META = dict(source="WorldClim v2.1 (local GeoTIFF, geodata.ucdavis.edu)",
             acquisition_date="1970-2000 climate normals",
             processing_level="L4 interpolated climatology, 10 arc-min")


def _mean(href: str, poly) -> float | None:
    b = poly.bounds
    v = masked_values(read_window(href, b, resampling="nearest"), poly)
    return float(v.mean()) if v.size else None


def dry_quarter(monthly: list[float]) -> list[int]:
    """Three consecutive calendar months (1-based, may wrap the year) with the lowest total precipitation."""
    sums = [monthly[i] + monthly[(i + 1) % 12] + monthly[(i + 2) % 12] for i in range(12)]
    i = int(np.argmin(sums))
    return [(i + k) % 12 + 1 for k in range(3)]


def extract(poly, kind: str = "parcel"):
    from .. import audit

    values: dict[str, float | None] = {}
    for key, n in BIO.items():
        values[key] = _mean(f"static:worldclim/wc2.1_10m_bio_{n}.tif", poly)
    monthly = [_mean(f"static:worldclim/wc2.1_10m_prec_{m:02d}.tif", poly) for m in range(1, 13)]
    pet = _mean(PET_FILE, poly)
    p = values["annual_precip"]
    values["aridity_index"] = (p / pet) if (p is not None and pet) else None

    audit.log(product_id="wc2.1_10m bio_1,4,5,6,12,15 + prec_01..12 + Hargreaves PET (tmin/tmax 01..12)",
              url="https://geodata.ucdavis.edu/climate/worldclim/2_1/base/", mode="local", **_META)

    meta: dict = {"pet_annual_mm": pet}
    if all(m is not None for m in monthly):
        meta["monthly_precip_mm"] = monthly
        meta["dry_quarter_months"] = dry_quarter(monthly)
    return values, meta
