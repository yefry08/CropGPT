"""SQLite job store: jobs, stage runs, LLM call ledger, events, approvals.

One short-lived connection per operation (WAL mode) so the UI thread and job
workers can use it concurrently without sharing connection objects.
"""

from __future__ import annotations

import json
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from .secrets import redact

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  channel       TEXT NOT NULL,
  input_text    TEXT NOT NULL,
  language      TEXT NOT NULL,
  visual_style  TEXT NOT NULL,
  render_backend TEXT NOT NULL,
  budget_cap_usd REAL NOT NULL,
  auto_approve  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'queued',   -- queued|running|awaiting_approval|paused|blocked|failed|done|cancelled
  current_stage TEXT,
  project_id    TEXT,
  output_dir    TEXT,
  agent_session TEXT,                             -- last claude session id (for --resume)
  agent_target  TEXT,                             -- last routing target name
  directive     TEXT,                             -- ChannelForge instruction for the next agent run
  check_attempts INTEGER NOT NULL DEFAULT 0,      -- automatic fact/originality send-backs
  replan_count  INTEGER NOT NULL DEFAULT 0,       -- duration re-plans
  error         TEXT,
  created_at    REAL NOT NULL,
  updated_at    REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS stage_runs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id     INTEGER NOT NULL REFERENCES jobs(id),
  stage      TEXT NOT NULL,
  status     TEXT NOT NULL,                       -- running|completed|failed|awaiting_human
  attempt    INTEGER NOT NULL DEFAULT 1,
  started_at REAL NOT NULL,
  finished_at REAL
);
CREATE TABLE IF NOT EXISTS llm_calls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      INTEGER,
  stage       TEXT,
  kind        TEXT NOT NULL,                      -- agent|general|metadata|critic
  gateway     TEXT NOT NULL,                      -- omniroute
  target      TEXT NOT NULL,
  model       TEXT,                               -- model actually served, when reported
  tokens_in   INTEGER DEFAULT 0,
  tokens_out  INTEGER DEFAULT 0,
  cost_usd    REAL DEFAULT 0,
  cost_basis  TEXT,                               -- gateway|claude_code_estimate|unknown
  latency_ms  INTEGER DEFAULT 0,
  ok          INTEGER NOT NULL,
  failure     TEXT,
  error       TEXT,
  ts          REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id  INTEGER NOT NULL,
  ts      REAL NOT NULL,
  level   TEXT NOT NULL,
  stage   TEXT,
  message TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS approvals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id     INTEGER NOT NULL,
  gate       TEXT NOT NULL,                       -- OpenMontage stage name, or 'publish'
  status     TEXT NOT NULL DEFAULT 'pending',     -- pending|approved|edited|rejected
  summary    TEXT,
  payload    TEXT,                                -- JSON (checkpoint path, artifacts…)
  note       TEXT,
  auto       INTEGER NOT NULL DEFAULT 0,
  consumed   INTEGER NOT NULL DEFAULT 0,             -- decision delivered to the agent
  created_at REAL NOT NULL,
  decided_at REAL
);
CREATE TABLE IF NOT EXISTS publish_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id     INTEGER NOT NULL,
  platform   TEXT NOT NULL,                       -- youtube|tiktok|instagram
  kind       TEXT NOT NULL,                       -- long|short
  idx        INTEGER NOT NULL DEFAULT 0,          -- short number (1..5), 0 for the long video
  file       TEXT NOT NULL,
  meta       TEXT NOT NULL,                       -- JSON: title/description/caption/tags/thumbnail…
  publish_at REAL NOT NULL,                       -- when it should go live (epoch)
  run_at     REAL NOT NULL,                       -- when the scheduler should next try
  status     TEXT NOT NULL DEFAULT 'queued',      -- queued|running|waiting_quota|done|failed
  attempts   INTEGER NOT NULL DEFAULT 0,
  remote_id  TEXT,
  url        TEXT,
  warning    TEXT,
  error      TEXT,
  updated_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS quota_usage (
  project TEXT NOT NULL,
  day     TEXT NOT NULL,                          -- Pacific-time day the quota resets on
  bucket  TEXT NOT NULL,                          -- units|uploads
  used    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project, day, bucket)
);
CREATE INDEX IF NOT EXISTS idx_events_job ON events(job_id, id);
CREATE INDEX IF NOT EXISTS idx_llm_job ON llm_calls(job_id);
CREATE INDEX IF NOT EXISTS idx_appr_status ON approvals(status);
"""

ACTIVE_STATUSES = ("queued", "running")


class JobDB:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._conn() as c:
            c.execute("PRAGMA journal_mode=WAL")
            c.executescript(SCHEMA)
            self._migrate(c)

    # Columns added after M1: ALTER existing databases in place (CREATE TABLE IF NOT EXISTS won't).
    _ADDED = {"jobs": {"directive": "TEXT", "check_attempts": "INTEGER NOT NULL DEFAULT 0",
                       "replan_count": "INTEGER NOT NULL DEFAULT 0"},
              "approvals": {"consumed": "INTEGER NOT NULL DEFAULT 0"},
              "llm_calls": {"cost_basis": "TEXT"}}

    def _migrate(self, c: sqlite3.Connection) -> None:
        for table, cols in self._ADDED.items():
            have = {r["name"] for r in c.execute(f"PRAGMA table_info({table})")}
            for name, decl in cols.items():
                if name not in have:
                    c.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path, timeout=30, isolation_level=None)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    # -- jobs --------------------------------------------------------------
    def create_job(self, *, channel: str, input_text: str, language: str, visual_style: str,
                   render_backend: str, budget_cap_usd: float, auto_approve: bool) -> int:
        now = time.time()
        with self._conn() as c:
            cur = c.execute(
                "INSERT INTO jobs(channel,input_text,language,visual_style,render_backend,"
                "budget_cap_usd,auto_approve,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
                (channel, input_text, language, visual_style, render_backend,
                 budget_cap_usd, int(auto_approve), now, now))
            return int(cur.lastrowid)

    def get_job(self, job_id: int) -> dict[str, Any] | None:
        with self._conn() as c:
            row = c.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
        return dict(row) if row else None

    def list_jobs(self, limit: int = 200) -> list[dict[str, Any]]:
        with self._conn() as c:
            rows = c.execute("SELECT * FROM jobs ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]

    _JOB_COLUMNS = {"status", "current_stage", "project_id", "output_dir", "agent_session",
                    "agent_target", "error", "auto_approve", "directive", "check_attempts", "replan_count",
                    "budget_cap_usd"}

    def update_job(self, job_id: int, **fields: Any) -> None:
        bad = set(fields) - self._JOB_COLUMNS
        if bad:
            raise ValueError(f"unknown job columns: {bad}")
        if "error" in fields and fields["error"]:
            fields["error"] = redact(str(fields["error"]))
        fields["updated_at"] = time.time()
        cols = ",".join(f"{k}=?" for k in fields)
        with self._conn() as c:
            c.execute(f"UPDATE jobs SET {cols} WHERE id=?", (*fields.values(), job_id))

    def jobs_with_status(self, status: str) -> list[dict[str, Any]]:
        with self._conn() as c:
            return [dict(r) for r in c.execute("SELECT * FROM jobs WHERE status=? ORDER BY id", (status,))]

    def claim_next_queued(self) -> dict[str, Any] | None:
        """Atomically move the oldest queued job to running and return it."""
        with self._conn() as c:
            c.execute("BEGIN IMMEDIATE")
            row = c.execute("SELECT * FROM jobs WHERE status='queued' ORDER BY id LIMIT 1").fetchone()
            if row is None:
                c.execute("COMMIT")
                return None
            c.execute("UPDATE jobs SET status='running', updated_at=? WHERE id=?", (time.time(), row["id"]))
            c.execute("COMMIT")
        job = dict(row)
        job["status"] = "running"
        return job

    def requeue_interrupted(self) -> int:
        """On startup, jobs left 'running' by a crash go back to the queue (they resume from checkpoint)."""
        with self._conn() as c:
            cur = c.execute("UPDATE jobs SET status='queued', updated_at=? WHERE status='running'", (time.time(),))
            return cur.rowcount

    # -- stage runs --------------------------------------------------------
    def start_stage(self, job_id: int, stage: str) -> int:
        with self._conn() as c:
            n = c.execute("SELECT COUNT(*) FROM stage_runs WHERE job_id=? AND stage=?", (job_id, stage)).fetchone()[0]
            cur = c.execute("INSERT INTO stage_runs(job_id,stage,status,attempt,started_at) VALUES (?,?,?,?,?)",
                            (job_id, stage, "running", n + 1, time.time()))
            return int(cur.lastrowid)

    def finish_stage(self, run_id: int, status: str) -> None:
        with self._conn() as c:
            c.execute("UPDATE stage_runs SET status=?, finished_at=? WHERE id=?", (status, time.time(), run_id))

    def stage_runs(self, job_id: int) -> list[dict[str, Any]]:
        with self._conn() as c:
            return [dict(r) for r in c.execute("SELECT * FROM stage_runs WHERE job_id=? ORDER BY id", (job_id,))]

    # -- LLM ledger --------------------------------------------------------
    def record_media_spend(self, job_id: int, stage: str, tool: str, usd: float) -> None:
        """Paid media generation (video/image/TTS) counts toward the same per-video budget."""
        self.log_llm_call(job_id=job_id, stage=stage, kind="media", gateway="openmontage", target=tool,
                          model=tool, cost_usd=usd, cost_basis="tool_estimate", ok=True)

    def log_llm_call(self, *, job_id: int | None, stage: str | None, kind: str, gateway: str, target: str,
                     model: str | None, tokens_in: int = 0, tokens_out: int = 0, cost_usd: float = 0.0,
                     latency_ms: int = 0, ok: bool, failure: str | None = None, error: str | None = None,
                     cost_basis: str | None = None) -> None:
        with self._conn() as c:
            c.execute(
                "INSERT INTO llm_calls(job_id,stage,kind,gateway,target,model,tokens_in,tokens_out,cost_usd,cost_basis,"
                "latency_ms,ok,failure,error,ts) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (job_id, stage, kind, gateway, target, model, tokens_in, tokens_out, cost_usd, cost_basis,
                 latency_ms, int(ok), failure, redact(error) if error else None, time.time()))

    def llm_calls(self, job_id: int | None = None, limit: int = 500) -> list[dict[str, Any]]:
        with self._conn() as c:
            if job_id is None:
                rows = c.execute("SELECT * FROM llm_calls ORDER BY id DESC LIMIT ?", (limit,))
            else:
                rows = c.execute("SELECT * FROM llm_calls WHERE job_id=? ORDER BY id", (job_id,))
            return [dict(r) for r in rows]

    def job_cost(self, job_id: int) -> float:
        with self._conn() as c:
            return float(c.execute("SELECT COALESCE(SUM(cost_usd),0) FROM llm_calls WHERE job_id=?",
                                   (job_id,)).fetchone()[0])

    # -- events ------------------------------------------------------------
    def log_event(self, job_id: int, message: str, *, level: str = "info", stage: str | None = None) -> None:
        with self._conn() as c:
            c.execute("INSERT INTO events(job_id,ts,level,stage,message) VALUES (?,?,?,?,?)",
                      (job_id, time.time(), level, stage, redact(message)))

    def events(self, job_id: int, after_id: int = 0) -> list[dict[str, Any]]:
        with self._conn() as c:
            return [dict(r) for r in c.execute(
                "SELECT * FROM events WHERE job_id=? AND id>? ORDER BY id", (job_id, after_id))]

    # -- approvals ---------------------------------------------------------
    def create_approval(self, job_id: int, gate: str, summary: str, payload: dict | None = None) -> int:
        with self._conn() as c:
            existing = c.execute("SELECT id FROM approvals WHERE job_id=? AND gate=? AND status='pending'",
                                 (job_id, gate)).fetchone()
            if existing:
                return int(existing["id"])
            cur = c.execute("INSERT INTO approvals(job_id,gate,summary,payload,created_at) VALUES (?,?,?,?,?)",
                            (job_id, gate, redact(summary), json.dumps(payload or {}), time.time()))
            return int(cur.lastrowid)

    def decide_approval(self, approval_id: int, status: str, note: str | None = None, *, auto: bool = False) -> None:
        if status not in ("approved", "edited", "rejected"):
            raise ValueError(status)
        with self._conn() as c:
            row = c.execute("SELECT gate FROM approvals WHERE id=?", (approval_id,)).fetchone()
            if row is None:
                raise KeyError(approval_id)
            if auto and row["gate"] == "publish":
                raise PermissionError("the publish gate can never be auto-approved")
            c.execute("UPDATE approvals SET status=?, note=?, auto=?, decided_at=? WHERE id=?",
                      (status, note, int(auto), time.time(), approval_id))

    def approvals(self, status: str | None = "pending", job_id: int | None = None) -> list[dict[str, Any]]:
        q, args = "SELECT * FROM approvals WHERE 1=1", []
        if status:
            q += " AND status=?"; args.append(status)
        if job_id is not None:
            q += " AND job_id=?"; args.append(job_id)
        with self._conn() as c:
            return [dict(r) for r in c.execute(q + " ORDER BY id", args)]

    def next_unconsumed_decision(self, job_id: int) -> dict[str, Any] | None:
        with self._conn() as c:
            row = c.execute("SELECT * FROM approvals WHERE job_id=? AND status IN ('approved','edited') "
                            "AND consumed=0 ORDER BY id LIMIT 1", (job_id,)).fetchone()
        return dict(row) if row else None

    def mark_consumed(self, approval_id: int) -> None:
        with self._conn() as c:
            c.execute("UPDATE approvals SET consumed=1 WHERE id=?", (approval_id,))

    # -- publishing ----------------------------------------------------------
    def add_publish_item(self, *, job_id: int, platform: str, kind: str, idx: int, file: str, meta: dict,
                         publish_at: float, run_at: float | None = None) -> int:
        now = time.time()
        with self._conn() as c:
            cur = c.execute("INSERT INTO publish_items(job_id,platform,kind,idx,file,meta,publish_at,run_at,updated_at) "
                            "VALUES (?,?,?,?,?,?,?,?,?)", (job_id, platform, kind, idx, file, json.dumps(meta),
                                                           publish_at, publish_at if run_at is None else run_at, now))
            return int(cur.lastrowid)

    _PUB_COLUMNS = {"status", "run_at", "attempts", "remote_id", "url", "warning", "error"}

    def update_publish_item(self, item_id: int, **fields: Any) -> None:
        if set(fields) - self._PUB_COLUMNS:
            raise ValueError(set(fields) - self._PUB_COLUMNS)
        if fields.get("error"):
            fields["error"] = redact(str(fields["error"]))[:2000]
        fields["updated_at"] = time.time()
        with self._conn() as c:
            c.execute(f"UPDATE publish_items SET {','.join(f'{k}=?' for k in fields)} WHERE id=?",
                      (*fields.values(), item_id))

    def claim_due_publish_items(self, now: float | None = None) -> list[dict[str, Any]]:
        now = time.time() if now is None else now
        with self._conn() as c:
            c.execute("BEGIN IMMEDIATE")
            rows = [dict(r) for r in c.execute("SELECT * FROM publish_items WHERE status IN ('queued','waiting_quota') "
                                               "AND run_at<=? ORDER BY run_at, id", (now,))]
            for r in rows:
                c.execute("UPDATE publish_items SET status='running', updated_at=? WHERE id=?", (now, r["id"]))
            c.execute("COMMIT")
        for r in rows:
            r["meta"] = json.loads(r["meta"])
        return rows

    def publish_items(self, job_id: int | None = None) -> list[dict[str, Any]]:
        with self._conn() as c:
            q = "SELECT * FROM publish_items" + (" WHERE job_id=?" if job_id is not None else "") + " ORDER BY publish_at, id"
            rows = [dict(r) for r in c.execute(q, (job_id,) if job_id is not None else ())]
        for r in rows:
            r["meta"] = json.loads(r["meta"])
        return rows

    def reset_running_publish_items(self) -> int:
        with self._conn() as c:
            return c.execute("UPDATE publish_items SET status='queued' WHERE status='running'").rowcount

    def quota_used(self, project: str, day: str, bucket: str) -> int:
        with self._conn() as c:
            r = c.execute("SELECT used FROM quota_usage WHERE project=? AND day=? AND bucket=?", (project, day, bucket)).fetchone()
        return int(r["used"]) if r else 0

    def quota_add(self, project: str, day: str, bucket: str, n: int) -> None:
        with self._conn() as c:
            c.execute("INSERT INTO quota_usage(project,day,bucket,used) VALUES (?,?,?,?) ON CONFLICT(project,day,bucket) "
                      "DO UPDATE SET used=used+excluded.used", (project, day, bucket, n))

    def get_approval(self, approval_id: int) -> dict[str, Any] | None:
        with self._conn() as c:
            row = c.execute("SELECT * FROM approvals WHERE id=?", (approval_id,)).fetchone()
        return dict(row) if row else None
