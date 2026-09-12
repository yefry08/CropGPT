"""FastAPI app. In `make demo` it also serves the built frontend from frontend/dist."""

from __future__ import annotations

import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import config, features, matching, report_pdf, results, techniques

app = FastAPI(title="CropMatch Analog Engine", version=results.ENGINE_VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


class QueryIn(BaseModel):
    fixture_id: str | None = None
    lat: float | None = Field(None, ge=-90, le=90)
    lon: float | None = Field(None, ge=-180, le=180)
    radius_km: float | None = None
    polygon: dict | None = None
    name: str | None = Field(None, max_length=120)
    weights: dict[str, float] | None = None
    refresh: bool = False


@app.get("/api/health")
def health():
    try:
        n_cells = len(matching.load_grid().df)
    except Exception as e:  # the grid is a build artefact; say so instead of crashing
        n_cells = f"unavailable ({type(e).__name__})"
    return {"status": "ok", "mode": config.DEMO_MODE, "engine_version": results.ENGINE_VERSION,
            "reference_cells": n_cells, "techniques": len(techniques.load())}


@app.get("/api/meta")
def meta():
    grid = matching.load_grid()
    return {"mode": config.DEMO_MODE, "features": features.as_dicts(), "groups": features.GROUPS,
            "default_weights": config.DEFAULT_GROUP_WEIGHTS, "regions": list(techniques.regions().values()),
            "categories": json.loads(config.TECHNIQUES.read_text(encoding="utf-8"))["categories"],
            "n_techniques": len(techniques.load()),
            "reference_stats": grid.stats(), "reference_cells": len(grid.df),
            "fixtures": results.fixture_parcels()}


@app.get("/api/grid")
def grid_points():
    df = matching.load_grid().df
    return [{"cell_id": r.cell_id, "lat": r.lat, "lon": r.lon,
             "region_id": r.region_id if isinstance(r.region_id, str) else None,
             "n_available": int(r.n_available)} for r in df.itertuples()]


@app.get("/api/techniques")
def list_techniques():
    return techniques.load()


@app.post("/api/query")
def query(q: QueryIn):
    try:
        poly, name = results.parcel_from_request(q.model_dump())
    except ValueError as e:
        raise HTTPException(422, str(e))
    if q.weights:
        bad = set(q.weights) - set(features.GROUPS)
        if bad or any(v < 0 for v in q.weights.values()) or sum(q.weights.values()) <= 0:
            raise HTTPException(422, f"weights must be non-negative, keyed by {features.GROUPS}")
    res = results.run(poly, name=name or q.name, weights=q.weights, refresh=q.refresh)
    if res.get("status") == "no_data":
        return JSONResponse(res, status_code=409)
    return res


@app.get("/api/results/{result_id}")
def get_result(result_id: str, download: bool = False):
    res = results.load(result_id)
    if res is None:
        raise HTTPException(404, "result not found")
    headers = {"Content-Disposition": f'attachment; filename="cropmatch-{result_id}.json"'} if download else None
    return JSONResponse(res, headers=headers)


@app.get("/api/results/{result_id}/pdf")
def get_pdf(result_id: str):
    res = results.load(result_id)
    if res is None:
        raise HTTPException(404, "result not found")
    return Response(report_pdf.build(res), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="cropmatch-brief-{result_id}.pdf"'})


@app.get("/api/results/{result_id}/audit")
def get_audit(result_id: str):
    res = results.load(result_id)
    if res is None:
        raise HTTPException(404, "result not found")
    return res["provenance"]


if config.FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=config.FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        f = config.FRONTEND_DIST / path
        if path and f.is_file() and config.FRONTEND_DIST in f.resolve().parents:
            return FileResponse(f)
        return FileResponse(config.FRONTEND_DIST / "index.html")
