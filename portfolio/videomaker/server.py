#!/usr/bin/env python3
"""videomaker local server: the landing page (/), the app (/app) and a small JSON API for the pipeline.

    python3 server.py [--port 8790]        then open http://127.0.0.1:8790

API: GET /api/jobs · POST /api/jobs {topic, lang, sample?} · GET /api/jobs/<id> · POST /api/jobs/<id>/approve {sections, disclosure}
     GET /api/jobs/<id>/video.mp4 · GET /api/jobs/<id>/descripcion.md · GET /api/samples · GET /api/status
Binds to 127.0.0.1 only: it runs scripts and spends API credit, so it is not meant to be exposed to the internet."""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pipeline

STATIC = Path(__file__).resolve().parent / "static"
PAGES = {"/": "index.html", "/app": "app.html"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(STATIC), **kw)

    def log_message(self, fmt, *args):
        pass

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n) or b"{}") if n <= 1_000_000 else {}

    def _file(self, path, ctype):
        if not path.exists():
            return self._json({"error": "not ready"}, 404)
        self.send_response(200); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(path.stat().st_size))
        self.send_header("Content-Disposition", f'attachment; filename="{path.name}"'); self.end_headers()
        with path.open("rb") as f:
            while chunk := f.read(1 << 20):
                self.wfile.write(chunk)

    def do_GET(self):
        p = self.path.split("?")[0]
        if p in PAGES:
            self.path = "/" + PAGES[p]; return super().do_GET()
        if not p.startswith("/api/"):
            return super().do_GET()
        parts = p.strip("/").split("/")
        try:
            if parts == ["api", "status"]:
                key = bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
                           or (Path.home() / ".config/anthropic").exists())
                return self._json({"claude": key, "voicebox": pipeline._voicebox_up()})
            if parts == ["api", "samples"]:
                return self._json(pipeline.samples())
            if parts == ["api", "jobs"]:
                return self._json([{k: j[k] for k in ("id", "topic", "status", "created")} for j in pipeline.jobs()])
            if len(parts) == 3:
                return self._json(pipeline.load(parts[2]))
            if len(parts) == 4 and parts[3] in ("video.mp4", "descripcion.md"):
                d = pipeline._path(parts[2])
                return self._file(d / parts[3], "video/mp4" if parts[3].endswith("mp4") else "text/markdown; charset=utf-8")
        except (FileNotFoundError, ValueError) as e:
            return self._json({"error": str(e)}, 404)
        self._json({"error": "not found"}, 404)

    def do_POST(self):
        parts = self.path.split("?")[0].strip("/").split("/")
        try:
            b = self._body()
            if parts == ["api", "jobs"]:
                topic = (b.get("topic") or "").strip()
                if not topic and not b.get("sample"):
                    return self._json({"error": "Escribe un tema o pega un resumen."}, 400)
                return self._json(pipeline.create(topic or b["sample"], b.get("lang", "es"), b.get("sample") or None), 201)
            if len(parts) == 4 and parts[3] == "approve":
                return self._json(pipeline.approve(parts[2], b.get("sections"), b.get("disclosure")))
        except (FileNotFoundError, ValueError) as e:
            return self._json({"error": str(e)}, 400)
        self._json({"error": "not found"}, 404)


if __name__ == "__main__":
    port = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 8790
    print(f"videomaker on http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
