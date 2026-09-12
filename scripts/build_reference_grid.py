"""Build data/reference_grid.parquet: the precomputed global reference grid.

~2,000 land cells at 0.25°, biased toward documented agronomic-innovation regions (data/regions.json), plus a
cos(latitude)-weighted random sample of all other land so percentiles are taken against a global distribution.
Every cell's vector is computed with exactly the same code as a queried parcel (backend/cropmatch/vector.py).

The build is resumable: per-cell results are appended to data/cache/grid_build/results.jsonl.

    uv run python scripts/build_reference_grid.py --workers 6          # build (hours; network)
    uv run python scripts/build_reference_grid.py --limit 20           # quick test
    uv run python scripts/build_reference_grid.py --assemble-only      # rebuild parquet from results.jsonl
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import random
import sys
import threading
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import rasterio  # noqa: E402

from cropmatch import config, geo, remote, vector  # noqa: E402
from cropmatch.features import FEATURE_KEYS  # noqa: E402

OUT = config.CACHE / "grid_build"
CELLS = OUT / "cells.json"
RESULTS = OUT / "results.jsonl"
STEP = 0.25


def land_centres() -> list[tuple[float, float]]:
    wc = config.STATIC / "worldclim"
    with rasterio.open(wc / "wc2.1_10m_bio_1.tif") as a, rasterio.open(wc / "wc2.1_10m_bio_12.tif") as b:
        t1, t12 = a.read(1, masked=True), b.read(1, masked=True)
        tr = a.transform
    lats = np.arange(-55.875, 72.0, STEP)
    lons = np.arange(-179.875, 180.0, STEP)
    LON, LAT = np.meshgrid(lons, lats)
    rows = np.floor((tr.f - LAT) / -tr.e).astype(int)
    cols = np.floor((LON - tr.c) / tr.a).astype(int)
    ok = ~(np.ma.getmaskarray(t1)[rows, cols] | np.ma.getmaskarray(t12)[rows, cols])
    return list(zip(LAT[ok].round(3).tolist(), LON[ok].round(3).tolist()))


def cell_id(lat: float, lon: float) -> str:
    return f"c{lat:+08.3f}{lon:+09.3f}"


def select_cells(total: int, per_region: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    regions = json.loads(config.REGIONS.read_text(encoding="utf-8"))["regions"]
    centres = land_centres()
    tagged: dict[tuple[float, float], dict] = {}
    for r in regions:
        inside = [c for c in centres
                  if any(b[1] <= c[0] <= b[3] and b[0] <= c[1] <= b[2] for b in r["bboxes"])]
        inside = [c for c in inside if c not in tagged]
        if len(inside) > per_region:
            inside = rng.sample(sorted(inside), per_region)
        for c in inside:
            tagged[c] = r
    cells = [{"cell_id": cell_id(*c), "lat": c[0], "lon": c[1], "region_id": r["id"], "region_name": r["name"],
              "country": r["country"]} for c, r in sorted(tagged.items())]
    rest = [c for c in centres if c not in tagged]
    n_bg = max(0, total - len(cells))
    weights = np.array([math.cos(math.radians(c[0])) for c in rest])
    idx = np.random.default_rng(seed).choice(len(rest), size=n_bg, replace=False, p=weights / weights.sum())
    for i in sorted(idx):
        c = rest[i]
        cells.append({"cell_id": cell_id(*c), "lat": c[0], "lon": c[1], "region_id": None, "region_name": None,
                      "country": None})
    return cells


def compute_cell(cell: dict) -> dict:
    poly = geo.cell(cell["lat"], cell["lon"], STEP)
    with remote.io_context(remote.IOContext(mode="live")):
        vec = vector.compute(poly, kind="cell", profile_extras=False)
    keep = ("dry_quarter_months", "pet_annual_mm", "soil_method", "dem_pixels", "modis_vi_valid_composites",
            "modis_et_years", "modis_et_valid_share", "s2_scenes", "s1_scenes", "ndvi_climatology")
    return {**cell, "values": vec["values"], "missing": vec["missing"], "sources": vec["sources"],
            "meta": {k: vec["meta"].get(k) for k in keep if k in vec["meta"]},
            "provenance": [{k: e.get(k) for k in ("source", "product_id", "acquisition_date", "processing_level")}
                           for e in vec["provenance"]],
            "seconds": vec["seconds"]}


def done_ids() -> set[str]:
    if not RESULTS.exists():
        return set()
    out = set()
    with open(RESULTS, encoding="utf-8") as fh:
        for line in fh:
            try:
                out.add(json.loads(line)["cell_id"])
            except Exception:
                pass
    return out


def assemble() -> None:
    rows, prov = [], []
    cells = {c["cell_id"]: c for c in json.loads(CELLS.read_text(encoding="utf-8"))}
    seen = set()
    with open(RESULTS, encoding="utf-8") as fh:
        for line in fh:
            try:
                r = json.loads(line)
            except json.JSONDecodeError:  # a line still being written by a running build
                continue
            if r["cell_id"] in seen or r["cell_id"] not in cells:
                continue
            seen.add(r["cell_id"])
            row = {k: r[k] for k in ("cell_id", "lat", "lon", "region_id", "region_name", "country")}
            row.update({k: r["values"].get(k) for k in FEATURE_KEYS})
            row["n_available"] = sum(r["values"].get(k) is not None for k in FEATURE_KEYS)
            row["missing"] = json.dumps(r["missing"], ensure_ascii=False)
            row["dry_quarter_months"] = json.dumps(r["meta"].get("dry_quarter_months"))
            rows.append(row)
            prov.append({"cell_id": r["cell_id"], "meta": r["meta"], "sources": r["sources"],
                         "provenance": r["provenance"]})
    df = pd.DataFrame(rows).sort_values("cell_id").reset_index(drop=True)
    for k in FEATURE_KEYS:
        df[k] = df[k].astype("float64")
    df.to_parquet(config.REFERENCE_GRID, index=False)
    with gzip.open(config.REFERENCE_PROVENANCE, "wt", encoding="utf-8") as fh:
        for p in prov:
            fh.write(json.dumps(p, ensure_ascii=False) + "\n")
    cov = {k: int(df[k].notna().sum()) for k in FEATURE_KEYS}
    print(f"wrote {config.REFERENCE_GRID}: {len(df)} cells, {df['region_id'].notna().sum()} in innovation regions")
    print("non-null per dimension:", cov)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--total", type=int, default=2000)
    ap.add_argument("--per-region", type=int, default=80)
    ap.add_argument("--seed", type=int, default=20260911)
    ap.add_argument("--workers", type=int, default=10)
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--assemble-only", action="store_true")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    if not CELLS.exists():
        cells = select_cells(args.total, args.per_region, args.seed)
        CELLS.write_text(json.dumps(cells), encoding="utf-8")
        print(f"selected {len(cells)} cells ({sum(c['region_id'] is not None for c in cells)} regional)")
    cells = json.loads(CELLS.read_text(encoding="utf-8"))

    if not args.assemble_only:
        done = done_ids()
        todo = [c for c in cells if c["cell_id"] not in done]
        if args.limit:
            todo = todo[: args.limit]
        print(f"{len(done)} done, {len(todo)} to compute with {args.workers} workers", flush=True)
        lock = threading.Lock()
        t0 = time.time()
        n = 0
        with ProcessPoolExecutor(max_workers=args.workers) as ex, open(RESULTS, "a", encoding="utf-8") as out:
            futs = {ex.submit(compute_cell, c): c for c in todo}
            for f in as_completed(futs):
                c = futs[f]
                try:
                    r = f.result()
                except Exception as e:  # a cell failing entirely is logged and retried on the next run
                    print(f"FAILED {c['cell_id']}: {type(e).__name__}: {e}", flush=True)
                    continue
                with lock:
                    out.write(json.dumps(r, ensure_ascii=False) + "\n")
                    out.flush()
                n += 1
                if n % 10 == 0 or n == len(todo):
                    rate = (time.time() - t0) / n
                    avail = sum(v is not None for v in r["values"].values())
                    print(f"{n}/{len(todo)}  {rate:.1f}s/cell  eta {rate * (len(todo) - n) / 60:.0f} min  "
                          f"last {r['cell_id']} {avail}/24 dims", flush=True)
    assemble()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
