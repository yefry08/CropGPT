"""ISRIC SoilGrids v2.0 — seven properties, thickness-weighted over 0–30 cm.

Parcels query the REST API (no auth) at the parcel centroid, as specified. Reference-grid cells, and parcels for
which the REST API returns no data, use ISRIC's official 5 km aggregates of the same maps (data_aggregated/5000m),
which are cached locally. Which path was used is reported in the output.
"""

from __future__ import annotations

from ..remote import masked_values, read_window, get_json

REST = "https://rest.isric.org/soilgrids/v2.0/properties/query"
PROPS = {"phh2o": "ph", "soc": "soc", "clay": "clay", "sand": "sand", "cec": "cec", "bdod": "bdod", "cfvo": "cfvo"}
DEPTHS = [("0-5cm", 5.0), ("5-15cm", 10.0), ("15-30cm", 15.0)]
# Conversion from SoilGrids mapped units to conventional units (ISRIC SoilGrids FAQ / REST `d_factor`).
D_FACTOR = {"phh2o": 10, "soc": 10, "clay": 10, "sand": 10, "cec": 10, "bdod": 100, "cfvo": 10}

_REST_META = dict(source="ISRIC SoilGrids v2.0 REST API",
                  acquisition_date="SoilGrids 2020 release (legacy soil profiles + covariates)",
                  processing_level="L4 digital soil map, 250 m, point query")
_LOCAL_META = dict(source="ISRIC SoilGrids v2.0 5 km aggregate (files.isric.org, local copy)",
                   acquisition_date="SoilGrids 2020 release (legacy soil profiles + covariates)",
                   processing_level="L4 digital soil map, aggregated to 5 km")


def _weighted(depth_values: dict[str, float | None]) -> float | None:
    num = den = 0.0
    for label, thick in DEPTHS:
        v = depth_values.get(label)
        if v is None:
            return None
        num += v * thick
        den += thick
    return num / den


def from_rest(poly) -> dict[str, float | None]:
    c = poly.centroid
    params = [["lon", round(c.x, 5)], ["lat", round(c.y, 5)]]
    params += [["property", p] for p in PROPS]
    params += [["depth", d] for d, _ in DEPTHS]
    params += [["value", "mean"]]
    data = get_json(REST, params=params, audit_meta=dict(
        product_id=f"properties/query {','.join(PROPS)} 0-30cm mean @ {c.y:.5f},{c.x:.5f}", **_REST_META))
    out: dict[str, float | None] = {}
    for layer in data["properties"]["layers"]:
        prop = layer["name"]
        d = layer["unit_measure"]["d_factor"]
        per_depth = {}
        for dep in layer["depths"]:
            v = dep["values"].get("mean")
            per_depth[dep["label"]] = None if v is None else v / d
        out[PROPS[prop]] = _weighted(per_depth)
    return out


def from_local(poly, props: list[str] | None = None) -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    b = poly.bounds
    for prop, key in PROPS.items():
        if props is not None and key not in props:
            continue
        per_depth = {}
        for label, _ in DEPTHS:
            rw = read_window(f"static:soilgrids/{prop}_{label}_mean_5000.tif", b, resampling="nearest",
                             valid_range=(0, 32000))
            v = masked_values(rw, poly)
            per_depth[label] = float(v.mean()) / D_FACTOR[prop] if v.size else None
        out[key] = _weighted(per_depth)
    from .. import audit

    audit.log(product_id=f"{','.join(props or PROPS.values())} 0-5/5-15/15-30cm mean, 5000m",
              url="https://files.isric.org/soilgrids/latest/data_aggregated/5000m/", mode="local", **_LOCAL_META)
    return out


def extract(poly, kind: str = "parcel"):
    if kind == "cell":
        return from_local(poly), {"soil_method": "SoilGrids 5 km aggregate, cell mean"}
    try:
        values = from_rest(poly)
        method = "SoilGrids REST, 250 m point query at parcel centroid"
    except Exception as e:  # REST outages are common; fall back to the same maps at 5 km
        values = {k: None for k in PROPS.values()}
        method = f"SoilGrids REST failed ({type(e).__name__}); used 5 km aggregate"
    gaps = [k for k, v in values.items() if v is None]
    if gaps:
        filled = from_local(poly, gaps)
        values.update({k: v for k, v in filled.items() if v is not None})
        if "failed" not in method:
            method += f"; 5 km aggregate used for {', '.join(gaps)} (no REST value)"
    return values, {"soil_method": method}
