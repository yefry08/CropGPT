"""Export the data behind the static build (Hugging Face static Space, GitHub Pages, any file host).

Writes frontend/static-export/:
  meta.json, grid.json             same payloads as /api/meta and /api/grid
  engine.json                      reference grid raw values, mean, SD and covariance: lets the browser re-run the
                                   matching when the weights change (frontend/src/lib/engine.ts)
  results/<fixture>.json | .pdf    full results for the fixture parcels at default weights, computed by the
                                   Python backend in offline mode

With --parity it also writes Python results at a custom weighting to frontend/static-export-parity/, which
frontend/scripts/check-engine.ts compares against the TypeScript port.

    uv run python scripts/export_static.py [--parity]
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["DEMO_MODE"] = "offline"

from cropmatch import config, features, geo, matching, report_pdf, results  # noqa: E402
from cropmatch.features import FEATURE_KEYS  # noqa: E402

OUT = ROOT / "frontend" / "static-export"
PARITY = ROOT / "frontend" / "static-export-parity"
CUSTOM_WEIGHTS = {"water": 0.10, "soil": 0.40, "climate": 0.30, "terrain": 0.10, "vegetation": 0.10}


def clean(x):
    if isinstance(x, float):
        return x if math.isfinite(x) else None
    if isinstance(x, dict):
        return {k: clean(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [clean(v) for v in x]
    return x


def dump(obj, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(clean(obj), ensure_ascii=False, separators=(",", ":"), default=str), encoding="utf-8")


def s(v):
    return v if isinstance(v, str) else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--parity", action="store_true")
    args = ap.parse_args()
    if OUT.exists():
        shutil.rmtree(OUT)

    from cropmatch import api

    grid = matching.load_grid()
    df = grid.df
    meta = api.meta()
    meta["static"] = True
    dump(meta, OUT / "meta.json")
    dump(api.grid_points(), OUT / "grid.json")
    dump({
        "features": features.as_dicts(),
        "groups": features.GROUPS,
        "min_shared_dims": config.MIN_SHARED_DIMS,
        "max_condition_number": config.MAX_CONDITION_NUMBER,
        "cells": [{"cell_id": r.cell_id, "lat": float(r.lat), "lon": float(r.lon), "region_id": s(r.region_id),
                   "region_name": s(r.region_name), "country": s(r.country)} for r in df.itertuples()],
        "X": df[FEATURE_KEYS].to_numpy(dtype=float).tolist(),
        "mu": grid.mu.tolist(),
        "sd": grid.sd.tolist(),
        "cov": grid.cov.tolist(),
    }, OUT / "engine.json")

    for fx in results.fixture_parcels():
        poly = geo.circle(fx["lat"], fx["lon"], fx["radius_km"])
        res = results.run(poly, name=fx["name"], mode="offline")
        if res["status"] != "ok":
            sys.exit(f"{fx['id']}: {res.get('message')}")
        dump(res, OUT / "results" / f"{fx['id']}.json")
        (OUT / "results" / f"{fx['id']}.pdf").write_bytes(report_pdf.build(res))
        if args.parity:
            dump(results.run(poly, name=fx["name"], weights=CUSTOM_WEIGHTS, mode="offline"),
                 PARITY / f"{fx['id']}_custom.json")
        print(f"{fx['id']}: {len(res['match']['analogs'])} analogs, {len(res['techniques']['ranked'])} ranked")
    size = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file()) / 1e6
    print(f"wrote {OUT} ({size:.1f} MB, {len(df)} reference cells)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
