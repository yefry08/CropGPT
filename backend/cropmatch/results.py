"""Assemble a full query result: parcel profile, analogs, ranked and blocked techniques, provenance."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from functools import lru_cache

from . import config, features, matching, techniques, vector
from .geo import area_km2, circle, from_geojson

ENGINE_VERSION = "0.1.0"

DISCLAIMERS = [
    "Similarity is a percentile rank against the reference grid, not a probability of success or an accuracy.",
    "Technique effects are summarised from the cited sources; constraints are screening heuristics. "
    "Review with a local agronomist before acting.",
    "Values marked 'not available' were not retrieved or not computable; nothing has been imputed.",
]


@lru_cache(maxsize=1)
def fixture_parcels() -> list[dict]:
    path = config.FIXTURES / "parcels.json"
    return json.loads(path.read_text(encoding="utf-8"))["parcels"] if path.exists() else []


def parcel_from_request(req: dict):
    if req.get("fixture_id"):
        fx = next((p for p in fixture_parcels() if p["id"] == req["fixture_id"]), None)
        if fx is None:
            raise ValueError(f"unknown fixture {req['fixture_id']}")
        return circle(fx["lat"], fx["lon"], fx["radius_km"]), fx["name"]
    if req.get("polygon"):
        poly = from_geojson(req["polygon"])
    elif req.get("lat") is not None and req.get("lon") is not None:
        r = float(req.get("radius_km") or 2.0)
        if not 0.05 <= r <= 25:
            raise ValueError("radius_km must be between 0.05 and 25")
        poly = circle(float(req["lat"]), float(req["lon"]), r)
    else:
        raise ValueError("give fixture_id, polygon, or lat + lon (+ radius_km)")
    a = area_km2(poly)
    if a > config.MAX_PARCEL_AREA_KM2:
        raise ValueError(f"parcel is {a:.0f} km²; the limit is {config.MAX_PARCEL_AREA_KM2:.0f} km²")
    c = poly.centroid
    if not (-60 <= c.y <= 75 and -180 <= c.x <= 180):
        raise ValueError("parcel centroid outside the supported latitude range (60°S–75°N)")
    return poly, req.get("name")


def _weights_hash(w: dict | None) -> str:
    w = {**config.DEFAULT_GROUP_WEIGHTS, **(w or {})}
    return hashlib.sha1(json.dumps(w, sort_keys=True).encode()).hexdigest()[:6]


def run(poly, *, name: str | None = None, weights: dict | None = None, mode: str | None = None,
        refresh: bool = False) -> dict:
    vec = vector.get_or_compute(poly, name=name, mode=mode, refresh=refresh)
    rid = f"{vec['key']}_{_weights_hash(weights)}"
    base = {
        "id": rid,
        "engine_version": ENGINE_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "mode": mode or config.DEMO_MODE,
        "parcel": {"name": name or vec.get("name"), "key": vec["key"], "geometry": vec["geometry"],
                   "centroid": vec["centroid"], "area_km2": vec["area_km2"], "vector_cache": vec.get("cache"),
                   "vector_computed_at": vec["computed_at"], "vector_mode": vec["mode"]},
        "sources": vec["sources"],
        "source_notes": vec["source_notes"],
        "provenance": vec["provenance"],
        "disclaimers": DISCLAIMERS,
    }
    if vec["n_available"] == 0:
        base["status"] = "no_data"
        base["message"] = ("No dimension could be computed for this parcel. In offline mode only the fixture "
                           "parcels (and parcels computed earlier in live mode) are available.")
        return base

    grid = matching.load_grid()
    m = matching.match(vec["values"], weights)
    tech = techniques.rank(vec["values"], m)
    meta = vec["meta"]
    result = {
        **base,
        "status": "ok",
        "profile": {
            "features": features.as_dicts(),
            "values": vec["values"],
            "missing": vec["missing"],
            "n_available": vec["n_available"],
            "z": m["z_target"],
            "reference_stats": grid.stats(),
            "land_cover": meta.get("land_cover"),
            "dry_quarter_months": meta.get("dry_quarter_months"),
            "monthly_precip_mm": meta.get("monthly_precip_mm"),
            "pet_annual_mm": meta.get("pet_annual_mm"),
            "ndvi_climatology": meta.get("ndvi_climatology"),
            "soil_method": meta.get("soil_method"),
            "s2_scenes": meta.get("s2_scenes"),
            "s1_scenes": meta.get("s1_scenes"),
            "modis_et_years": meta.get("modis_et_years"),
        },
        "match": m,
        "techniques": tech,
    }
    path = config.CACHE / "results" / f"{rid}.json"
    path.write_text(json.dumps(result, ensure_ascii=False, default=str), encoding="utf-8")
    return result


def load(result_id: str) -> dict | None:
    if not all(ch.isalnum() or ch in "_-" for ch in result_id):
        return None
    path = config.CACHE / "results" / f"{result_id}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None
