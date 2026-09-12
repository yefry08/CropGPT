"""Download the static rasters used in live mode and by the grid builder (~450 MB, no auth).

* WorldClim v2.1, 10 arc-minute: bio, prec, tmin, tmax  (geodata.ucdavis.edu)
* ISRIC SoilGrids v2.0 5 km aggregates: 7 properties × 3 depths  (files.isric.org)

The offline demo does not need these: fixture responses already contain every window read from them.
"""

from __future__ import annotations

import zipfile
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "data" / "static"
WC = "https://geodata.ucdavis.edu/climate/worldclim/2_1/base"
SG = "https://files.isric.org/soilgrids/latest/data_aggregated/5000m"
PROPS = ["phh2o", "soc", "clay", "sand", "cec", "bdod", "cfvo"]
DEPTHS = ["0-5cm", "5-15cm", "15-30cm"]


def fetch(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with httpx.stream("GET", url, follow_redirects=True, timeout=120) as r:
        r.raise_for_status()
        with open(tmp, "wb") as fh:
            for chunk in r.iter_bytes(1 << 20):
                fh.write(chunk)
    tmp.replace(dest)
    print(f"downloaded {dest.relative_to(ROOT)} ({dest.stat().st_size / 1e6:.1f} MB)")


def main() -> int:
    for var in ("bio", "prec", "tmin", "tmax"):
        z = STATIC / "worldclim" / f"wc2.1_10m_{var}.zip"
        fetch(f"{WC}/wc2.1_10m_{var}.zip", z)
        with zipfile.ZipFile(z) as zf:
            zf.extractall(z.parent)
    for p in PROPS:
        for d in DEPTHS:
            name = f"{p}_{d}_mean_5000.tif"
            fetch(f"{SG}/{p}/{name}", STATIC / "soilgrids" / name)
    print("static data ready; now run scripts/prepare_static.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
