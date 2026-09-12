"""Paths, run mode and tunables. Everything configurable lives here."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

DATA = ROOT / "data"
STATIC = DATA / "static"          # large static rasters (WorldClim, SoilGrids 5 km) — not in git
CACHE = DATA / "cache"            # computed vectors, results, audit log — not in git
FIXTURES = ROOT / "fixtures"      # recorded raw responses for the offline demo — in git
REFERENCE_GRID = DATA / "reference_grid.parquet"
REFERENCE_PROVENANCE = DATA / "reference_grid_provenance.jsonl.gz"
TECHNIQUES = DATA / "techniques.json"
REGIONS = DATA / "regions.json"
FRONTEND_DIST = ROOT / "frontend" / "dist"

for _d in (CACHE, CACHE / "vectors", CACHE / "results"):
    _d.mkdir(parents=True, exist_ok=True)

AUDIT_LOG = CACHE / "audit.jsonl"

# offline: only recorded fixture responses and cached vectors are used; nothing touches the network.
# live:    external sources are queried (no-auth mirrors unless credentials are set).
DEMO_MODE = os.getenv("DEMO_MODE", "offline").strip().lower()
if DEMO_MODE not in {"offline", "live"}:
    raise ValueError(f"DEMO_MODE must be 'offline' or 'live', got {DEMO_MODE!r}")

# Credentials. None of them is needed for the offline demo or for the no-auth mirrors used in live mode.
CDSE_CLIENT_ID = os.getenv("CDSE_CLIENT_ID")
CDSE_CLIENT_SECRET = os.getenv("CDSE_CLIENT_SECRET")
EARTHDATA_TOKEN = os.getenv("EARTHDATA_TOKEN")
USGS_TOKEN = os.getenv("USGS_TOKEN")

# Analysis periods. Fixed so that parcels and the reference grid are computed over identical windows.
MODIS_VI_YEARS = (2023, 2024, 2025)          # MOD13Q1 phenology climatology
MODIS_ANNUAL_YEARS = (2021, 2022, 2023, 2024, 2025)  # MOD16A3GF / MOD17A3HGF, whichever exist
S2_YEARS = (2024, 2025)                      # Sentinel-2 dry-quarter composites
S1_YEARS = (2025,)                           # Sentinel-1 dry-quarter backscatter (S1A + S1C era)

DEFAULT_GROUP_WEIGHTS = {"water": 0.30, "soil": 0.25, "climate": 0.25, "terrain": 0.10, "vegetation": 0.10}

# A reference cell is only compared with a target if it shares at least this share of the target's dimensions.
MIN_SHARED_DIMS = 0.7
# Covariance sub-matrices with a worse condition number fall back to weighted Euclidean distance.
MAX_CONDITION_NUMBER = 1e6

MAX_PARCEL_AREA_KM2 = 2500.0
