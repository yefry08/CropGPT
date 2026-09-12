"""Record the offline fixtures, then prove the offline replay reproduces the live vectors exactly.

For each parcel in fixtures/parcels.json this runs the live pipeline with recording on (raw STAC / REST
responses and raster windows go to fixtures/responses/), then recomputes the vector in offline mode from those
recordings alone and compares all 24 dimensions.

    uv run python scripts/record_fixtures.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from cropmatch import config, geo, remote, vector  # noqa: E402
from cropmatch.features import FEATURE_KEYS  # noqa: E402


def main() -> int:
    parcels = json.loads((config.FIXTURES / "parcels.json").read_text(encoding="utf-8"))["parcels"]
    ok = True
    for p in parcels:
        poly = geo.circle(p["lat"], p["lon"], p["radius_km"])
        live = vector.get_or_compute(poly, name=p["name"], mode="live", record=True, refresh=True)
        with remote.io_context(remote.IOContext(mode="offline", replay_dirs=[vector.FIXTURE_RESPONSES])):
            off = vector.compute(poly, kind="parcel", name=p["name"])
        diffs = []
        for k in FEATURE_KEYS:
            a, b = live["values"][k], off["values"][k]
            if (a is None) != (b is None) or (a is not None and not math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-12)):
                diffs.append((k, a, b))
        status = "replay identical" if not diffs else f"REPLAY MISMATCH {diffs}"
        ok &= not diffs
        print(f"{p['name']:20s} {live['n_available']}/24 dims live, {off['n_available']}/24 offline — {status}")
        for k, why in live["missing"].items():
            print(f"    missing {k}: {why}")
    n = len(list(vector.FIXTURE_RESPONSES.glob("*")))
    size = sum(f.stat().st_size for f in vector.FIXTURE_RESPONSES.glob("*")) / 1e6
    print(f"fixtures/responses: {n} files, {size:.1f} MB")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
