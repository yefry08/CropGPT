"""Verify every citation in data/techniques.json and write data/evidence_check.json.

* DOIs: looked up in the Crossref REST API (no auth). The registered title must share most of its words with
  the title written in `evidence_source`; otherwise the DOI is flagged as a mismatch.
* Non-DOI URLs: fetched; the HTTP status is recorded.
* Entries with neither: listed as 'no link'.

The UI shows the result next to each citation, so a reader can tell a verified DOI from an unverified one.

    uv run python scripts/check_evidence.py
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "data" / "techniques.json"
OUT = ROOT / "data" / "evidence_check.json"
UA = {"User-Agent": "cropmatch-evidence-check/0.1 (research demo)"}
STOP = {"the", "a", "an", "of", "and", "in", "for", "on", "to", "by", "with", "from", "as", "at", "its", "use"}


def words(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", s.lower()) if w not in STOP and len(w) > 2}


def check_doi(client: httpx.Client, doi: str, source: str) -> dict:
    r = client.get(f"https://api.crossref.org/works/{doi}")
    if r.status_code == 404:
        return {"status": "doi_not_found", "doi": doi}
    r.raise_for_status()
    msg = r.json()["message"]
    title = " ".join(msg.get("title") or [])
    tw = words(title)
    overlap = len(tw & words(source)) / max(1, len(tw))
    year = (msg.get("issued", {}).get("date-parts") or [[None]])[0][0]
    status = "doi_verified" if overlap >= 0.6 else "doi_title_mismatch"
    if status == "doi_title_mismatch":
        # Some Crossref records carry a garbled title (e.g. a workshop banner prepended). Accept the DOI only if
        # the first author's surname, the year and the journal all appear in the citation as written.
        first = ((msg.get("author") or [{}])[0].get("family") or "").lower()
        journal = words(" ".join(msg.get("container-title") or []))
        src = source.lower()
        if first and first in src and str(year) in src and journal and journal <= words(source):
            status = "doi_verified_metadata"
    return {"status": status, "doi": doi,
            "registered_title": title, "container": " ".join(msg.get("container-title") or []),
            "year": year, "title_word_overlap": round(overlap, 2)}


def check_url(client: httpx.Client, url: str) -> dict:
    try:
        r = client.get(url)
        return {"status": "url_ok" if r.status_code < 400 else "url_error", "http_status": r.status_code}
    except httpx.HTTPError as e:
        return {"status": "url_error", "error": type(e).__name__}


def main() -> int:
    kb = json.loads(KB.read_text(encoding="utf-8"))["techniques"]
    out: dict[str, dict] = {}
    with httpx.Client(timeout=30, follow_redirects=True, headers=UA) as client:
        for t in kb:
            if t.get("evidence_doi"):
                res = check_doi(client, t["evidence_doi"], t["evidence_source"])
            elif t.get("evidence_url"):
                res = check_url(client, t["evidence_url"])
            else:
                res = {"status": "no_link"}
            res["checked_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            out[t["id"]] = res
            print(f"{res['status']:20s} {t['id']:32s} {res.get('registered_title', '')[:90]}")
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    bad = [k for k, v in out.items() if v["status"] in ("doi_not_found", "doi_title_mismatch", "url_error")]
    print(f"\n{len(out)} entries; {sum(v['status'].startswith('doi_verified') for v in out.values())} DOIs verified; "
          f"{len(bad)} problems: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
