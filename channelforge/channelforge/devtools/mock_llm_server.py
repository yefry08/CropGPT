"""Programmable fake OmniRoute used by the forced-failure tests and the demo.

Speaks just enough of three surfaces to exercise ChannelForge end to end:
  * OpenAI chat completions   POST /v1/chat/completions   (Python router)
  * Anthropic Messages (SSE)  POST /v1/messages           (Claude Code subprocess)
  * OmniRoute health          GET  /api/monitoring/health

Behaviour is scripted with ``fail_next(mode, n)`` (any model) or
``fail_model(model, modes)`` (one OmniRoute model id, e.g. the Claude combo);
modes are ``ok``, ``429``, ``529``, ``usage_limit``, ``quota``, ``timeout``,
``503`` (combo exhausted), ``500``, ``400``.
"""

from __future__ import annotations

import json
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class MockLLMServer:
    def __init__(self, name: str = "mock", reply: str = "ok", cost: float = 0.0012, port: int = 0):
        self.name = name
        self.reply = reply
        self.cost = cost
        self.modes: deque[str] = deque()
        self.model_modes: dict[str, deque[str]] = {}
        self.catalog: list[str] = ["channelforge-primary"]     # what GET /v1/models lists
        self.combos: dict[str, dict] = {}                      # /api/combos store
        self.connections: list[dict] = []                      # GET /api/providers
        self.requests: list[dict] = []
        self.timeout_sleep = 5.0
        self.port = port
        self._httpd: ThreadingHTTPServer | None = None

    # -- scripting -------------------------------------------------------
    def fail_next(self, mode: str, n: int = 1) -> None:
        self.modes.extend([mode] * n)

    def fail_always(self, mode: str) -> None:
        self.modes.extend([mode] * 10_000)

    def fail_model(self, model: str, modes: list[str]) -> None:
        self.model_modes.setdefault(model, deque()).extend(modes)

    def models_seen(self) -> list[str]:
        return [r["body"].get("model") for r in self.requests]

    @property
    def url(self) -> str:
        assert self._httpd is not None
        host, port = self._httpd.server_address[:2]
        return f"http://{host}:{port}"

    def start(self) -> "MockLLMServer":
        server = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):  # silence
                pass

            def _json(self, code: int, body: dict, headers: dict | None = None):
                data = json.dumps(body).encode()
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                for k, v in (headers or {}).items():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(data)

            def do_PUT(self):
                self.do_POST()

            def do_GET(self):
                if self.path.startswith("/api/monitoring/health"):
                    return self._json(200, {"status": "ok"})
                if self.path.startswith("/v1/models"):
                    return self._json(200, {"object": "list", "data": [{"id": m} for m in server.catalog]})
                if self.path.startswith("/api/providers"):
                    return self._json(200, {"connections": server.connections, "total": len(server.connections)})
                if self.path.startswith("/api/combos"):
                    return self._json(200, {"combos": list(server.combos.values()), "total": len(server.combos)})
                self._json(404, {"error": "not found"})

            def do_POST(self):
                length = int(self.headers.get("Content-Length") or 0)
                body = json.loads(self.rfile.read(length) or b"{}")
                if self.path.startswith("/api/combos"):
                    cid = self.path.rsplit("/", 1)[-1] if self.path.count("/") > 2 else body["name"]
                    server.combos[body["name"]] = {**body, "id": cid}
                    return self._json(201, server.combos[body["name"]])
                server.requests.append({"path": self.path, "body": body,
                                        "auth": self.headers.get("Authorization")})
                per_model = server.model_modes.get(body.get("model"))
                if per_model:
                    mode = per_model.popleft()
                else:
                    mode = server.modes.popleft() if server.modes else "ok"
                if mode == "timeout":
                    time.sleep(server.timeout_sleep)
                    mode = "ok"
                if mode == "429":
                    return self._json(429, {"type": "error", "error": {
                        "type": "rate_limit_error", "message": "Rate limited"}},
                        {"retry-after": "0"})
                if mode == "529":
                    return self._json(529, {"type": "error", "error": {
                        "type": "overloaded_error", "message": "Overloaded"}})
                if mode == "usage_limit":
                    return self._json(400, {"type": "error", "error": {
                        "type": "invalid_request_error",
                        "message": "Claude AI usage limit reached|1760000000"}})
                if mode == "quota":
                    return self._json(402, {"error": {"message": "Insufficient credits / quota exceeded"}})
                if mode == "503":
                    return self._json(503, {"error": {
                        "message": "Service temporarily unavailable: all targets were skipped by pre-dispatch filters",
                        "type": "service_unavailable", "code": "ALL_TARGETS_SKIPPED"}})
                if mode == "500":
                    return self._json(500, {"error": {"message": "boom"}})
                if mode == "400":
                    return self._json(400, {"error": {"message": "bad request: messages missing"}})

                model = body.get("model", "unknown")
                if self.path.startswith("/v1/chat/completions") or self.path.startswith("/api/v1/chat/completions"):
                    return self._json(200, {
                        "id": "chatcmpl-1", "object": "chat.completion", "model": model,
                        "choices": [{"index": 0, "finish_reason": "stop",
                                     "message": {"role": "assistant", "content": server.reply}}],
                        "usage": {"prompt_tokens": 11, "completion_tokens": 7,
                                  "total_tokens": 18, "cost": server.cost},
                    }, {"X-OmniRoute-Response-Cost": f"{server.cost:.10f}",
                        "X-OmniRoute-Model": f"served-by/{model}",
                        "X-OmniRoute-Provider": "mock"})
                if self.path.startswith("/v1/messages"):
                    if body.get("stream"):
                        return self._anthropic_stream(model)
                    return self._json(200, {
                        "id": "msg_1", "type": "message", "role": "assistant", "model": model,
                        "content": [{"type": "text", "text": server.reply}],
                        "stop_reason": "end_turn", "stop_sequence": None,
                        "usage": {"input_tokens": 11, "output_tokens": 7}})
                self._json(404, {"error": "not found"})

            def _anthropic_stream(self, model: str):
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()

                def ev(name, data):
                    self.wfile.write(f"event: {name}\ndata: {json.dumps(data)}\n\n".encode())
                    self.wfile.flush()

                ev("message_start", {"type": "message_start", "message": {
                    "id": "msg_1", "type": "message", "role": "assistant", "model": model,
                    "content": [], "stop_reason": None, "stop_sequence": None,
                    "usage": {"input_tokens": 11, "output_tokens": 1}}})
                ev("content_block_start", {"type": "content_block_start", "index": 0,
                                           "content_block": {"type": "text", "text": ""}})
                ev("content_block_delta", {"type": "content_block_delta", "index": 0,
                                           "delta": {"type": "text_delta", "text": server.reply}})
                ev("content_block_stop", {"type": "content_block_stop", "index": 0})
                ev("message_delta", {"type": "message_delta",
                                     "delta": {"stop_reason": "end_turn", "stop_sequence": None},
                                     "usage": {"output_tokens": 7}})
                ev("message_stop", {"type": "message_stop"})

        ThreadingHTTPServer.allow_reuse_address = True
        self._httpd = ThreadingHTTPServer(("127.0.0.1", self.port), Handler)
        self._httpd.daemon_threads = True
        threading.Thread(target=self._httpd.serve_forever, daemon=True).start()
        return self

    def stop(self) -> None:
        if self._httpd:
            self._httpd.shutdown()
            self._httpd.server_close()


if __name__ == "__main__":  # manual poking
    s = MockLLMServer().start()
    print(s.url)
    threading.Event().wait()
