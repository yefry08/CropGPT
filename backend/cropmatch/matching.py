"""Analog matching: weighted Mahalanobis distance against the precomputed reference grid.

* Every dimension is z-scored against the reference-grid distribution (mean, sample SD).
* Group weights (water, soil, climate, terrain, vegetation) are split evenly across the group's available
  dimensions; groups with no available dimension give their weight to the others proportionally.
* For each reference cell only the dimensions available for both target and cell are used (sub-covariance).
  Cells sharing fewer than MIN_SHARED_DIMS of the target's dimensions are excluded, never imputed.
* d² = uᵀ Σ_D⁻¹ u / Σ w_D with u = √w_D ⊙ (z_target − z_cell). If Σ_D is not positive definite or is
  ill-conditioned (cond > MAX_CONDITION_NUMBER) the cell falls back to weighted Euclidean d² = Σ w δ² / Σ w.
* Similarity is reported as a percentile: the share of comparable reference cells that are farther away.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import numpy as np
import pandas as pd

from . import config
from .features import BY_KEY, FEATURE_KEYS, FEATURES, GROUPS

GROUP_OF = np.array([f.group for f in FEATURES])


@dataclass
class ReferenceGrid:
    df: pd.DataFrame
    mu: np.ndarray
    sd: np.ndarray
    Z: np.ndarray
    cov: np.ndarray

    @classmethod
    def from_frame(cls, df: pd.DataFrame) -> "ReferenceGrid":
        df = df.reset_index(drop=True)
        X = df[FEATURE_KEYS].to_numpy(dtype=float)
        mu = np.nanmean(X, axis=0)
        sd = np.nanstd(X, axis=0, ddof=1)
        sd[~np.isfinite(sd) | (sd == 0)] = np.nan
        Z = (X - mu) / sd
        cov = pd.DataFrame(Z).cov(min_periods=30).to_numpy()
        return cls(df, mu, sd, Z, cov)

    def zscore(self, values: dict) -> np.ndarray:
        x = np.array([np.nan if values.get(k) is None else float(values[k]) for k in FEATURE_KEYS])
        return (x - self.mu) / self.sd

    def stats(self) -> list[dict]:
        out = []
        for i, f in enumerate(FEATURES):
            col = self.df[f.key]
            out.append({"key": f.key, "mean": _f(self.mu[i]), "sd": _f(self.sd[i]),
                        "n": int(col.notna().sum()), "p05": _f(col.quantile(0.05)), "p95": _f(col.quantile(0.95))})
        return out


def _f(x) -> float | None:
    return None if x is None or not np.isfinite(x) else float(x)


@lru_cache(maxsize=1)
def load_grid() -> ReferenceGrid:
    return ReferenceGrid.from_frame(pd.read_parquet(config.REFERENCE_GRID))


def dim_weights(avail: np.ndarray, group_weights: dict[str, float]) -> tuple[np.ndarray, dict[str, float]]:
    present = [g for g in GROUPS if avail[GROUP_OF == g].any() and group_weights.get(g, 0) > 0]
    total = sum(group_weights[g] for g in present)
    w = np.zeros(len(FEATURES))
    effective = {g: 0.0 for g in GROUPS}
    for g in present:
        idx = np.where((GROUP_OF == g) & avail)[0]
        effective[g] = group_weights[g] / total
        w[idx] = effective[g] / len(idx)
    return w, effective


def distances(grid: ReferenceGrid, z_t: np.ndarray, w: np.ndarray):
    """Distance from the target to every reference cell. NaN where the cell is not comparable."""
    t_avail = np.isfinite(z_t) & (w > 0)
    n_t = int(t_avail.sum())
    n = len(grid.df)
    d = np.full(n, np.nan)
    method = np.array([None] * n, dtype=object)
    shared = np.zeros(n, dtype=int)
    cell_avail = np.isfinite(grid.Z) & t_avail
    patterns: dict[bytes, list[int]] = {}
    for j in range(n):
        patterns.setdefault(cell_avail[j].tobytes(), []).append(j)
    inv_cache: dict[bytes, tuple[np.ndarray | None, str]] = {}
    for pat, rows in patterns.items():
        D = np.where(np.frombuffer(pat, dtype=bool))[0]
        rows = np.array(rows)
        shared[rows] = len(D)
        if n_t == 0 or len(D) < config.MIN_SHARED_DIMS * n_t:
            continue
        wD = w[D]
        sw = wD.sum()
        if pat not in inv_cache:
            S = grid.cov[np.ix_(D, D)]
            inv, how = None, "weighted_euclidean"
            if np.isfinite(S).all():
                eig = np.linalg.eigvalsh(S)
                if eig.min() > 1e-9 and eig.max() / eig.min() <= config.MAX_CONDITION_NUMBER:
                    inv, how = np.linalg.inv(S), "mahalanobis"
            inv_cache[pat] = (inv, how)
        inv, how = inv_cache[pat]
        u = (z_t[D][None, :] - grid.Z[np.ix_(rows, D)]) * np.sqrt(wD)[None, :]
        if inv is not None:
            d2 = np.einsum("ij,jk,ik->i", u, inv, u) / sw
        else:
            d2 = (u ** 2).sum(axis=1) / sw
        d[rows] = np.sqrt(np.clip(d2, 0, None))
        method[rows] = how
    return d, method, shared


def percentiles(d: np.ndarray) -> np.ndarray:
    """Share (0–100) of comparable cells farther from the target than each cell."""
    valid = np.isfinite(d)
    out = np.full_like(d, np.nan)
    vals = np.sort(d[valid])
    n = len(vals)
    if n == 0:
        return out
    # cells strictly farther = n - (number <= d_j)
    out[valid] = 100.0 * (n - np.searchsorted(vals, d[valid], side="right")) / n
    return out


def explain(grid: ReferenceGrid, j: int, z_t: np.ndarray, w: np.ndarray, target_values: dict) -> dict:
    """Per-dimension deltas between the target and reference cell j, and each dimension's share of d²."""
    row = grid.df.iloc[j]
    used = np.isfinite(z_t) & np.isfinite(grid.Z[j]) & (w > 0)
    D = np.where(used)[0]
    contrib = np.zeros(len(FEATURES))
    how = "weighted_euclidean"
    if len(D):
        u = (z_t[D] - grid.Z[j, D]) * np.sqrt(w[D])
        S = grid.cov[np.ix_(D, D)]
        sw = w[D].sum()
        inv = None
        if np.isfinite(S).all():
            eig = np.linalg.eigvalsh(S)
            if eig.min() > 1e-9 and eig.max() / eig.min() <= config.MAX_CONDITION_NUMBER:
                inv = np.linalg.inv(S)
                how = "mahalanobis"
        contrib[D] = (u * (inv @ u)) / sw if inv is not None else (u ** 2) / sw
    dims = []
    for i, f in enumerate(FEATURES):
        tv, av = target_values.get(f.key), row.get(f.key)
        av = None if av is None or (isinstance(av, float) and not np.isfinite(av)) else float(av)
        dims.append({
            "key": f.key, "label": f.label, "group": f.group, "unit": f.unit,
            "target": tv, "analog": av,
            "delta": (tv - av) if (tv is not None and av is not None) else None,
            "z_target": _f(z_t[i]), "z_analog": _f(grid.Z[j, i]),
            "z_delta": _f(z_t[i] - grid.Z[j, i]) if used[i] else None,
            "weight": float(w[i]), "used": bool(used[i]), "contribution": float(contrib[i]),
        })
    usable = [x for x in dims if x["used"]]
    drivers = sorted(usable, key=lambda x: (abs(x["z_delta"]), -x["weight"]))[:3]
    divergences = sorted(usable, key=lambda x: -x["contribution"])[:3]
    return {"method": how, "dimensions": dims, "drivers": [x["key"] for x in drivers],
            "divergences": [x["key"] for x in divergences]}


def match(target_values: dict, group_weights: dict[str, float] | None = None, top_n: int = 5) -> dict:
    grid = load_grid()
    gw = {**config.DEFAULT_GROUP_WEIGHTS, **(group_weights or {})}
    z_t = grid.zscore(target_values)
    avail = np.isfinite(z_t)
    w, effective = dim_weights(avail, gw)
    d, method, shared = distances(grid, z_t, w)
    pct = percentiles(d)
    df = grid.df
    comparable = np.isfinite(d)

    def cell_summary(j: int) -> dict:
        r = df.iloc[j]
        return {"cell_id": r["cell_id"], "lat": float(r["lat"]), "lon": float(r["lon"]),
                "region_id": r["region_id"] if isinstance(r["region_id"], str) else None,
                "region_name": r["region_name"] if isinstance(r["region_name"], str) else None,
                "country": r["country"] if isinstance(r["country"], str) else None,
                "distance": float(d[j]), "similarity_percentile": float(pct[j]), "method": method[j],
                "shared_dims": int(shared[j])}

    order = np.argsort(np.where(comparable, d, np.inf))
    order = [int(j) for j in order if comparable[j]]

    regional = []
    seen = set()
    for j in order:
        rid = df.iloc[j]["region_id"]
        if not isinstance(rid, str) or rid in seen:
            continue
        seen.add(rid)
        regional.append(j)
    region_best = {df.iloc[j]["region_id"]: cell_summary(j) for j in regional}

    analogs = []
    for j in regional[:top_n]:
        s = cell_summary(j)
        s.update(explain(grid, j, z_t, w, target_values))
        analogs.append(s)

    return {
        "n_reference_cells": int(len(df)),
        "n_comparable_cells": int(comparable.sum()),
        "n_excluded_cells": int((~comparable).sum()),
        "dimensions_used": [FEATURE_KEYS[i] for i in np.where(avail)[0]],
        "dimensions_missing": [FEATURE_KEYS[i] for i in np.where(~avail)[0]],
        "group_weights_requested": gw,
        "group_weights_effective": effective,
        "dimension_weights": {FEATURE_KEYS[i]: float(w[i]) for i in range(len(FEATURES))},
        "z_target": {FEATURE_KEYS[i]: _f(z_t[i]) for i in range(len(FEATURES))},
        "analogs": analogs,
        "region_best": region_best,
        "nearest_cells": [cell_summary(j) for j in order[:top_n]],
        "distance_quantiles": {q: _f(np.nanquantile(d, q / 100)) for q in (1, 5, 25, 50, 75, 95)} if comparable.any() else {},
    }
