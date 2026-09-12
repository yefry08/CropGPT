"""Unit tests that need no network and no static rasters."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from cropmatch import geo, matching, techniques
from cropmatch.features import FEATURE_KEYS
from cropmatch.sources.worldclim import dry_quarter


def test_geohash_known_value():
    # Reference value from the geohash spec's worked example (57.64911, 10.40744) -> u4pruydqqvj
    assert geo.geohash(57.64911, 10.40744, 11) == "u4pruydqqvj"


def test_circle_area_close_to_pi_r_squared():
    a = geo.area_km2(geo.circle(-22.5, -60.0, 2.0, n=256))
    assert a == pytest.approx(np.pi * 4, rel=0.01)


def test_parcel_key_differs_by_radius():
    assert geo.parcel_key(geo.circle(0, 0, 1)) != geo.parcel_key(geo.circle(0, 0, 2))


def test_dry_quarter_wraps_the_year():
    monthly = [5, 10, 80, 90, 90, 90, 90, 90, 90, 90, 80, 2]  # Dec, Jan, Feb driest
    assert dry_quarter(monthly) == [12, 1, 2]


def _grid(n=400, seed=0):
    rng = np.random.default_rng(seed)
    cov = np.eye(24) + 0.3  # correlated dimensions
    X = rng.multivariate_normal(np.zeros(24), cov, size=n)
    df = pd.DataFrame(X, columns=FEATURE_KEYS)
    df["cell_id"] = [f"c{i}" for i in range(n)]
    df["lat"], df["lon"] = 0.0, 0.0
    df["region_id"] = ["r1" if i < 50 else ("r2" if i < 100 else None) for i in range(n)]
    df["region_name"], df["country"] = df["region_id"], "x"
    return matching.ReferenceGrid.from_frame(df)


def test_identical_vector_has_zero_distance_and_top_percentile():
    g = _grid()
    target = {k: float(g.df.loc[7, k]) for k in FEATURE_KEYS}
    w, _ = matching.dim_weights(np.ones(24, bool), {"water": .3, "soil": .25, "climate": .25, "terrain": .1,
                                                    "vegetation": .1})
    d, method, _ = matching.distances(g, g.zscore(target), w)
    assert d[7] == pytest.approx(0, abs=1e-9)
    assert method[7] == "mahalanobis"
    assert matching.percentiles(d)[7] == pytest.approx(100 * (len(d) - 1) / len(d))


def test_weights_renormalise_when_a_group_is_missing():
    avail = np.ones(24, bool)
    avail[[FEATURE_KEYS.index(k) for k in ("et_annual", "wue", "ndwi_dry", "ndmi_dry", "s1_vv_dry")]] = False
    w, eff = matching.dim_weights(avail, {"water": .3, "soil": .25, "climate": .25, "terrain": .1, "vegetation": .1})
    assert eff["water"] == 0
    assert w.sum() == pytest.approx(1.0)
    assert eff["soil"] == pytest.approx(0.25 / 0.70)


def test_cells_missing_too_many_dims_are_excluded_not_imputed():
    g = _grid()
    g.Z[3, :10] = np.nan  # cell 3 now shares only 14/24 dims (< 70%)
    target = {k: 0.0 for k in FEATURE_KEYS}
    w, _ = matching.dim_weights(np.ones(24, bool), {"water": 1, "soil": 1, "climate": 1, "terrain": 1,
                                                    "vegetation": 1})
    d, _, shared = matching.distances(g, g.zscore(target), w)
    assert np.isnan(d[3]) and shared[3] == 14


def test_constraint_check_pass_fail_unknown():
    t = {"requires": {"aridity_index_max": 0.2, "soil_ph_range": [6.0, 8.0], "slope_min": 1}}
    checks = techniques.check(t, {"aridity_index": 0.37, "ph": 6.9, "slope": None})
    assert [c["status"] for c in checks] == ["fail", "pass", "unknown"]
    assert "not available" in checks[2]["text"]


def test_knowledge_base_is_valid_and_large_enough():
    kb = techniques.load()
    assert len(kb) >= 60
    cats = {t["category"] for t in kb}
    assert {"irrigation", "water_harvesting", "salinity_management", "soil_amendment", "mulching_cover_cropping",
            "shade_microclimate", "windbreaks", "rotation", "agroforestry", "low_cost_sensing"} <= cats
    regions = techniques.regions()
    assert all(t["region_id"] in regions for t in kb)
