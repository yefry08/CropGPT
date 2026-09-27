"""Fact and safety layer: every factual claim maps to a source; a second model critiques.

The agent writes projects/<id>/artifacts/sources.json alongside the script:

  {"claims": [{"id": "c1", "section_id": "s2", "text": "...", "kind": "fact|statistic|allegation",
               "legal_status": "accused|charged|under_investigation|convicted|acquitted" (allegations),
               "sources": [{"url": "https://...", "title": "...", "publisher": "...",
                            "type": "dataset|official|court_ruling|official_audit|news|academic|other"}]}]}

Rules enforced here (deterministic), then a critic model (router kind="critic") reads the
script against the claims and flags anything unsupported, overstated or mis-worded.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator

STRONG_ALLEGATION_SOURCES = {"court_ruling", "official_audit"}
LEGAL_STATUSES = {"accused", "charged", "under_investigation", "convicted", "acquitted", "sanctioned"}


class Source(BaseModel):
    url: str
    title: str = ""
    publisher: str = ""
    type: str = "other"

    @field_validator("url")
    @classmethod
    def http_only(cls, v: str) -> str:
        if not re.match(r"^https?://[^\s/]+\.[^\s]+", v):
            raise ValueError(f"not a web URL: {v!r}")
        return v


class Claim(BaseModel):
    id: str
    text: str
    section_id: str | None = None
    kind: str = "fact"
    legal_status: str | None = None
    sources: list[Source] = Field(default_factory=list)


class SourcesFile(BaseModel):
    claims: list[Claim]


@dataclass
class FactReport:
    problems: list[dict[str, Any]] = field(default_factory=list)   # {claim_id, problem, action}
    critic_flags: list[dict[str, Any]] = field(default_factory=list)
    claims: int = 0

    @property
    def passed(self) -> bool:
        return not self.problems and not self.critic_flags

    def as_note(self) -> str:
        lines = [f"- [{p.get('claim_id') or p.get('section_id', '?')}] {p['problem']} → {p.get('action', 'fix')}"
                 for p in self.problems + self.critic_flags]
        return "Fact-check found issues; rewrite or remove these claims and update sources.json:\n" + "\n".join(lines)

    def to_json(self) -> dict:
        return {"claims_checked": self.claims, "passed": self.passed,
                "rule_violations": self.problems, "critic_flags": self.critic_flags}


def load_sources(path: Path) -> SourcesFile:
    return SourcesFile.model_validate_json(path.read_text(encoding="utf-8"))


def check_rules(sf: SourcesFile) -> list[dict[str, Any]]:
    probs: list[dict[str, Any]] = []
    for c in sf.claims:
        if not c.sources:
            probs.append({"claim_id": c.id, "problem": "no source", "action": "add a source or remove"})
            continue
        if c.kind == "allegation":
            types = {s.type for s in c.sources}
            publishers = {s.publisher.strip().lower() for s in c.sources if s.type == "news" and s.publisher.strip()}
            if not (types & STRONG_ALLEGATION_SOURCES) and len(publishers) < 2:
                probs.append({"claim_id": c.id, "action": "back with a court ruling, an official audit, or "
                              "2+ reputable outlets — otherwise remove",
                              "problem": "allegation against a named party lacks a court ruling / official audit "
                                         "/ multiple reputable outlets"})
            if c.legal_status not in LEGAL_STATUSES:
                probs.append({"claim_id": c.id, "problem": f"allegation missing accurate legal status "
                              f"(got {c.legal_status!r})", "action": f"set one of {sorted(LEGAL_STATUSES)} "
                              "and word the script accordingly"})
            elif c.legal_status != "convicted" and re.search(r"\b(corrupt|stole|embezzled|criminal|thief|"
                                                             r"corrupto|robó|ladrón)\b", c.text, re.I):
                probs.append({"claim_id": c.id, "problem": f"states guilt but status is {c.legal_status}",
                              "action": "use 'accused of' / 'under investigation for' wording"})
    return probs


CRITIC_SYSTEM = """You are a strict fact-checker for a political/data explainer. You receive the narration
script and the list of claims with their sources. Flag every factual statement in the script that is
(a) not covered by a listed claim, (b) stronger than its sources support, (c) an allegation about a named
person or entity not worded with its legal status (accused / under investigation / convicted), or
(d) a number or date that differs from the claim. Do not flag opinions clearly framed as analysis.
Reply with JSON only: {"flags": [{"section_id": "...", "text": "<exact words>", "problem": "...",
"action": "rewrite|remove", "suggestion": "..."}]}. Reply {"flags": []} if everything is supported."""


def parse_json_object(text: str) -> dict:
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise ValueError("critic returned no JSON object")
    return json.loads(m.group(0))


def critic(router, script_text: str, sf: SourcesFile, *, job_id: int | None = None) -> list[dict[str, Any]]:
    claims = [{"id": c.id, "section_id": c.section_id, "text": c.text, "kind": c.kind,
               "legal_status": c.legal_status, "sources": [s.url for s in c.sources]} for c in sf.claims]
    res = router.complete([{"role": "system", "content": CRITIC_SYSTEM},
                           {"role": "user", "content": f"SCRIPT:\n{script_text}\n\nCLAIMS:\n{json.dumps(claims, ensure_ascii=False)}"}],
                          kind="critic", job_id=job_id, stage="script", temperature=0)
    return list(parse_json_object(res.text).get("flags", []))


def check(sources_path: Path, script_text: str, router=None, *, job_id: int | None = None) -> FactReport:
    rep = FactReport()
    if not sources_path.exists():
        rep.problems.append({"claim_id": None, "problem": "sources.json is missing",
                             "action": "write artifacts/sources.json mapping every claim to a source URL"})
        return rep
    try:
        sf = load_sources(sources_path)
    except ValidationError as e:
        rep.problems.append({"claim_id": None, "problem": f"sources.json invalid: {e.errors()[:3]}",
                             "action": "fix the file to match the documented schema"})
        return rep
    rep.claims = len(sf.claims)
    if not sf.claims:
        rep.problems.append({"claim_id": None, "problem": "sources.json lists no claims",
                             "action": "list every factual claim in the script"})
    rep.problems += check_rules(sf)
    if router is not None:
        rep.critic_flags = critic(router, script_text, sf, job_id=job_id)
    return rep
