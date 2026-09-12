# CropGPT / CropMatch Analog Engine — one container: FastAPI serves the API and the built frontend.
# Runs in DEMO_MODE=offline: fixture parcels replay recorded responses, no outbound data calls.

# --- frontend build ---------------------------------------------------------
FROM node:22-slim AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- runtime -----------------------------------------------------------------
FROM python:3.11-slim AS app
COPY --from=ghcr.io/astral-sh/uv:0.12.3 /uv /usr/local/bin/uv
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    DEMO_MODE=offline
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/ backend/
COPY data/reference_grid.parquet data/reference_grid_provenance.jsonl.gz \
     data/techniques.json data/regions.json data/evidence_check.json data/
COPY fixtures/ fixtures/
COPY --from=web /app/frontend/dist frontend/dist

RUN useradd --create-home app && mkdir -p data/cache && chown -R app:app data/cache
USER app

EXPOSE 8080
CMD ["/app/.venv/bin/uvicorn", "cropmatch.api:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips", "*"]
