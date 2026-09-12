"""ESA WorldCover 2021 (v200, 10 m) dominant land-cover class — profile context only, not part of the vector.

Read from Microsoft Planetary Computer (`esa-worldcover`, anonymous SAS token).
"""

from __future__ import annotations

import numpy as np

from ..remote import get_json, polygon_mask, read_window

PC_STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
CLASSES = {10: "Tree cover", 20: "Shrubland", 30: "Grassland", 40: "Cropland", 50: "Built-up",
           60: "Bare / sparse vegetation", 70: "Snow and ice", 80: "Permanent water bodies",
           90: "Herbaceous wetland", 95: "Mangroves", 100: "Moss and lichen"}


def land_cover(poly) -> dict | None:
    body = {"collections": ["esa-worldcover"], "bbox": [round(x, 5) for x in poly.bounds], "limit": 20}
    data = get_json(PC_STAC, body=body, audit_meta=dict(
        source="Microsoft Planetary Computer STAC", product_id="esa-worldcover search",
        acquisition_date="2020/2021", processing_level="catalogue search"))
    items = [f for f in data.get("features", []) if "2021" in f["properties"].get("start_datetime", "")]
    items = items or data.get("features", [])
    if not items:
        return None
    counts: dict[int, int] = {}
    used = []
    for item in sorted(items, key=lambda f: f["id"]):
        rw = read_window(item["assets"]["map"]["href"], poly.bounds, max_px=600, resampling="nearest",
                         pc_collection="esa-worldcover", valid_range=(1, 100),
                         audit_meta=dict(source="ESA WorldCover via Planetary Computer", product_id=item["id"],
                                         acquisition_date=item["properties"].get("start_datetime", "")[:4],
                                         processing_level="10 m land-cover map, v200"))
        if rw is None:
            continue
        m = polygon_mask(rw, poly) & np.isfinite(rw.data)
        if not m.any():
            continue
        vals, n = np.unique(rw.data[m].astype(int), return_counts=True)
        for v, c in zip(vals, n):
            counts[int(v)] = counts.get(int(v), 0) + int(c)
        used.append(item["id"])
    if not counts:
        return None
    total = sum(counts.values())
    k = max(counts, key=counts.get)
    return {"label": CLASSES.get(k, f"class {k}"), "class": k, "share": round(counts[k] / total, 3),
            "year": "2021", "product": "ESA WorldCover v200", "tiles": used,
            "composition": {CLASSES.get(c, str(c)): round(n / total, 3) for c, n in
                            sorted(counts.items(), key=lambda x: -x[1])}}
