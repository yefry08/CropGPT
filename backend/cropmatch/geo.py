"""Parcel geometry helpers: geohash, circles, areas, reprojection."""

from __future__ import annotations

import hashlib
import math
from functools import lru_cache

from pyproj import CRS, Geod, Transformer
from shapely import wkt as shapely_wkt
from shapely.geometry import Point, Polygon, box, mapping, shape
from shapely.ops import transform as shapely_transform

GEOD = Geod(ellps="WGS84")
_B32 = "0123456789bcdefghjkmnpqrstuvwxyz"


def geohash(lat: float, lon: float, precision: int = 7) -> str:
    lat_rng, lon_rng = [-90.0, 90.0], [-180.0, 180.0]
    out, bits, bit_count, even = [], 0, 0, True
    while len(out) < precision:
        rng, val = (lon_rng, lon) if even else (lat_rng, lat)
        mid = (rng[0] + rng[1]) / 2
        if val >= mid:
            bits = (bits << 1) | 1
            rng[0] = mid
        else:
            bits <<= 1
            rng[1] = mid
        even = not even
        bit_count += 1
        if bit_count == 5:
            out.append(_B32[bits])
            bits, bit_count = 0, 0
    return "".join(out)


def circle(lat: float, lon: float, radius_km: float, n: int = 64) -> Polygon:
    pts = []
    for i in range(n):
        az = 360.0 * i / n
        x, y, _ = GEOD.fwd(lon, lat, az, radius_km * 1000.0)
        pts.append((x, y))
    return Polygon(pts)


def cell(lat: float, lon: float, size_deg: float = 0.25) -> Polygon:
    h = size_deg / 2
    return box(lon - h, lat - h, lon + h, lat + h)


def area_km2(poly: Polygon) -> float:
    return abs(GEOD.geometry_area_perimeter(poly)[0]) / 1e6


def parcel_key(poly: Polygon) -> str:
    """Cache key: geohash of the centroid plus a short hash of the exact shape (so radii don't collide)."""
    c = poly.centroid
    shape_hash = hashlib.sha1(shapely_wkt.dumps(poly, rounding_precision=5).encode()).hexdigest()[:8]
    return f"{geohash(c.y, c.x, 7)}_{shape_hash}"


@lru_cache(maxsize=64)
def _transformer(dst_wkt: str) -> Transformer:
    return Transformer.from_crs(CRS.from_epsg(4326), CRS.from_wkt(dst_wkt), always_xy=True)


def to_crs(geom, dst_wkt: str):
    t = _transformer(dst_wkt)
    return shapely_transform(t.transform, geom)


def from_geojson(obj: dict) -> Polygon:
    g = shape(obj["geometry"] if obj.get("type") == "Feature" else obj)
    if g.geom_type == "MultiPolygon":
        g = max(g.geoms, key=lambda p: p.area)
    if g.geom_type != "Polygon":
        raise ValueError(f"parcel must be a Polygon, got {g.geom_type}")
    if not g.is_valid:
        g = g.buffer(0)
    return g


def to_geojson(poly: Polygon) -> dict:
    return mapping(poly)


def sinusoidal_tile(lat: float, lon: float) -> tuple[int, int]:
    """MODIS sinusoidal tile (h, v) that contains a point."""
    r = 6371007.181
    t = 1111950.5197665
    x = r * math.radians(lon) * math.cos(math.radians(lat))
    y = r * math.radians(lat)
    return int((x + 18 * t) // t), int((9 * t - y) // t)


__all__ = ["geohash", "circle", "cell", "area_km2", "parcel_key", "to_crs", "from_geojson", "to_geojson",
           "sinusoidal_tile", "Point", "Polygon"]
