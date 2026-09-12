# CropMatch Analog Engine

Give it any land parcel on Earth. It finds the parcel's closest biophysical analogs in documented agricultural
innovation regions (the Negev, Almería, Petrolina–Juazeiro, the Sahel, the Mallee and others) and returns the
cited techniques that transfer, the ones that don't and why, and the provenance of every number.

It does **not** recommend crops. It matches analogs and screens techniques. See [METHODOLOGY.md](METHODOLOGY.md).

## Run it

```bash
make demo        # offline: no credentials, no network → http://127.0.0.1:8000
```

Without `make` (e.g. Windows): `uv run python scripts/demo.py`. Requirements: [uv](https://docs.astral.sh/uv/),
Node.js 20+. The first run creates the Python 3.11 environment and builds the frontend.

- **Offline mode** (default) replays recorded raw responses for three parcels: Chaco Paraguayo (−22.5, −60.0),
  Monte Plata (18.8, −69.8) and San José de Ocoa (18.5, −70.5). Replay is bit-identical to the live run
  (`make fixtures` re-records and verifies it).
- **Live mode** (`make demo-live`) accepts any parcel. It needs the static rasters (`make static`, ~450 MB) and
  network access. No credentials are required; see [credentials.md](credentials.md).

## What's in the box

| Path | What |
|---|---|
| `backend/cropmatch/` | FastAPI app, record/replay I/O layer, one module per data source, matching, techniques, PDF |
| `frontend/` | React + TypeScript + Tailwind + shadcn structure, MapLibre maps (offline Natural Earth basemap), Recharts |
| `data/reference_grid.parquet` | 2,000-cell global reference grid (24 dimensions per cell) |
| `data/reference_grid_provenance.jsonl.gz` | scene / granule IDs behind every grid cell |
| `data/techniques.json` | 65 techniques, 18 regions, 10 categories; `data/evidence_check.json` = citation checks |
| `fixtures/` | fixture parcels and their recorded raw responses |
| `docs/validation/` | Chaco Paraguayo validation run (Markdown, JSON, PDF) |
| `METHODOLOGY.md` | feature definitions, distance metric, weighting rationale, limitations |
| `credentials.md` | how to obtain each API credential (none needed for the demo) |

## API

`POST /api/query` with `{"fixture_id": "chaco-paraguayo"}`, `{"lat": .., "lon": .., "radius_km": ..}` or
`{"polygon": <GeoJSON Polygon>}`, plus optional `"weights": {"water": .3, ...}`. The result is downloadable as
`GET /api/results/{id}?download=1` (JSON) and `GET /api/results/{id}/pdf` (brief). Also available:
`/api/meta`, `/api/grid`, `/api/techniques`, `/api/results/{id}/audit`, `/api/health`.

## Deploy

**Static demo (free, no server): Hugging Face static Space.** The three fixture parcels are computed by the
Python backend at export time (`scripts/export_static.py`), and the site ships them as files. Changing the
dimension weights re-runs the matching in the browser (`frontend/src/lib/engine.ts`, a port of
`backend/cropmatch/matching.py` checked against Python by `frontend/scripts/check-engine.ts`). Custom parcels need
the server.

```bash
uvx --from huggingface_hub hf auth login        # write-access token from huggingface.co/settings/tokens
uv run --with huggingface_hub python scripts/deploy_hf_static.py --space <user>/cropgpt
```

Parity check after changing the matching code:
`uv run python scripts/export_static.py --parity && (cd frontend && node scripts/check-engine.ts)`.

**Full server (any parcel in live mode).** The `Dockerfile` runs FastAPI serving the API and UI on port 8080.
It deploys to Fly.io (`fly.toml`) or a Hugging Face Docker Space (`scripts/deploy_hf.py`); both currently need a
payment method or subscription.

## Development

```bash
make dev-api     # API with reload on :8000
make dev-web     # Vite on :5173 (proxies /api)
make test        # pytest, includes an offline test with the network disabled
make evidence    # re-verify every DOI / URL in the knowledge base
make grid        # rebuild the reference grid (hours, resumable)
```
