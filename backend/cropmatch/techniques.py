"""Technique knowledge base: loading, validation, constraint checks and transferability scoring.

transferability = analog similarity × constraint satisfaction

* analog similarity = similarity percentile / 100 of the best-matching reference cell in the technique's
  source region.
* constraint satisfaction = (constraints verified as met) / (constraints declared). A constraint the target
  violates blocks the technique outright (score 0, reason stated). A constraint that cannot be checked because
  the target lacks that dimension counts as not verified: it lowers the score and is listed, never assumed met.
"""

from __future__ import annotations

import json
from functools import lru_cache

from . import config
from .features import BY_KEY, FEATURE_KEYS

# Keys used in the brief's example schema mapped to feature keys.
ALIASES = {"soil_ph": "ph", "clay_pct": "clay", "sand_pct": "sand", "slope_deg": "slope",
           "annual_precip_mm": "annual_precip", "elevation_m": "elevation", "soc_gkg": "soc"}


def _parse(req_key: str, val):
    for suffix, op in (("_range", "range"), ("_min", "min"), ("_max", "max")):
        if req_key.endswith(suffix):
            feat = req_key[: -len(suffix)]
            feat = ALIASES.get(feat, feat)
            if feat not in BY_KEY:
                raise ValueError(f"unknown feature in requires: {req_key}")
            return feat, op, val
    raise ValueError(f"requires key must end in _min, _max or _range: {req_key}")


@lru_cache(maxsize=1)
def load() -> list[dict]:
    data = json.loads(config.TECHNIQUES.read_text(encoding="utf-8"))
    items = data["techniques"] if isinstance(data, dict) else data
    checks_path = config.DATA / "evidence_check.json"
    checks = json.loads(checks_path.read_text(encoding="utf-8")) if checks_path.exists() else {}
    ids = set()
    for t in items:
        if t["id"] in ids:
            raise ValueError(f"duplicate technique id {t['id']}")
        ids.add(t["id"])
        for k, v in (t.get("requires") or {}).items():
            _parse(k, v)
        t["evidence_check"] = checks.get(t["id"], {"status": "not_checked"})
    return items


@lru_cache(maxsize=1)
def regions() -> dict[str, dict]:
    data = json.loads(config.REGIONS.read_text(encoding="utf-8"))
    return {r["id"]: r for r in data["regions"]}


def _fmt(v: float) -> str:
    if abs(v) >= 10:
        return f"{v:.0f}"
    return f"{v:.2f}".rstrip("0").rstrip(".")


def check(tech: dict, values: dict) -> list[dict]:
    out = []
    for k, v in (tech.get("requires") or {}).items():
        feat, op, thr = _parse(k, v)
        f = BY_KEY[feat]
        tv = values.get(feat)
        unit = "" if f.unit in ("ratio", "index", "pH") else f" {f.unit}"
        if op == "range":
            rule = f"{f.label} between {_fmt(thr[0])} and {_fmt(thr[1])}{unit}"
            ok = None if tv is None else (thr[0] <= tv <= thr[1])
        elif op == "min":
            rule = f"{f.label} ≥ {_fmt(thr)}{unit}"
            ok = None if tv is None else tv >= thr
        else:
            rule = f"{f.label} ≤ {_fmt(thr)}{unit}"
            ok = None if tv is None else tv <= thr
        status = "unknown" if ok is None else ("pass" if ok else "fail")
        text = (f"Requires {rule}; this parcel: not available" if tv is None
                else f"Requires {rule}; this parcel: {_fmt(tv)}{unit}")
        out.append({"feature": feat, "op": op, "threshold": thr, "target_value": tv, "status": status,
                    "rule": rule, "text": text})
    return out


def rank(values: dict, match_result: dict) -> dict:
    region_best = match_result["region_best"]
    regs = regions()
    ranked, blocked = [], []
    for t in load():
        best = region_best.get(t["region_id"])
        checks = check(t, values)
        n = len(checks)
        n_pass = sum(c["status"] == "pass" for c in checks)
        fails = [c for c in checks if c["status"] == "fail"]
        unknown = [c for c in checks if c["status"] == "unknown"]
        region = regs.get(t["region_id"], {})
        sim = None if best is None else best["similarity_percentile"] / 100.0
        entry = {
            **t,
            "region_name": region.get("name", t["region_id"]),
            "region_country": region.get("country"),
            "analog_cell": best,
            "analog_similarity": sim,
            "constraint_checks": checks,
            "constraint_satisfaction": (n_pass / n) if n else 1.0,
            "unverified_constraints": [c["text"] for c in unknown],
        }
        if fails:
            entry["transferability"] = 0.0
            entry["blocked_reasons"] = [c["text"] for c in fails]
            blocked.append(entry)
        elif sim is None:
            entry["transferability"] = None
            entry["blocked_reasons"] = ["No comparable reference cell in the source region, so similarity is "
                                        "not available"]
            blocked.append(entry)
        else:
            entry["transferability"] = sim * entry["constraint_satisfaction"]
            ranked.append(entry)
    ranked.sort(key=lambda e: (-e["transferability"], e["id"]))
    blocked.sort(key=lambda e: (-(e["analog_similarity"] or 0), e["id"]))
    return {"ranked": ranked, "blocked": blocked, "n_techniques": len(ranked) + len(blocked)}
