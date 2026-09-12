# CropMatch Analog Engine — `make demo` starts the offline demo in the browser.
# Windows without make: `uv run python scripts/demo.py` does the same thing.

UV ?= uv

.PHONY: demo demo-live dev-api dev-web setup frontend static grid fixtures evidence validate test

demo:            ## Offline demo (no credentials, no network): API + built frontend on http://127.0.0.1:8000
	$(UV) run python scripts/demo.py --mode offline

demo-live:       ## Live mode: any parcel on Earth, queries the no-auth mirrors
	$(UV) run python scripts/demo.py --mode live

setup:           ## Python env + frontend dependencies
	$(UV) sync
	cd frontend && npm install

frontend:        ## Production build of the frontend
	cd frontend && npm install && npm run build

dev-api:         ## API with reload (pair with dev-web)
	$(UV) run uvicorn cropmatch.api:app --app-dir backend --reload --port 8000

dev-web:         ## Vite dev server on :5173, proxies /api to :8000
	cd frontend && npm run dev

static:          ## Download WorldClim + SoilGrids static rasters (~450 MB) and derive PET
	$(UV) run python scripts/download_static.py
	$(UV) run python scripts/prepare_static.py

grid: static     ## Rebuild data/reference_grid.parquet (hours; resumable)
	$(UV) run python scripts/build_reference_grid.py

fixtures: static ## Re-record offline fixtures and verify byte-identical replay
	$(UV) run python scripts/record_fixtures.py

evidence:        ## Verify every DOI / URL in data/techniques.json
	$(UV) run python scripts/check_evidence.py

validate:        ## Chaco Paraguayo validation run -> docs/validation/
	$(UV) run python scripts/validate_chaco.py

test:
	$(UV) run pytest -q
