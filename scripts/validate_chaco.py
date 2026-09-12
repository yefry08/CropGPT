"""Validation run: the Chaco Paraguayo fixture parcel, end to end in offline mode.

Writes docs/validation/chaco_paraguayo.{json,md,pdf}. Every number in the Markdown is read from the result.

    uv run python scripts/validate_chaco.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["DEMO_MODE"] = "offline"

from cropmatch import config, geo, matching, report_pdf, results  # noqa: E402

OUT = ROOT / "docs" / "validation"


def f(v, unit=""):
    if v is None:
        return "not available"
    a = abs(v)
    s = f"{v:.3f}" if a < 1 else f"{v:.2f}" if a < 10 else f"{v:.1f}" if a < 100 else f"{v:,.0f}"
    return f"{s} {unit}".strip() if unit not in ("index", "ratio") else s


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    res = results.run(geo.circle(-22.5, -60.0, 2.0), name="Chaco Paraguayo", mode="offline")
    if res["status"] != "ok":
        print(res.get("message"))
        return 1
    grid = matching.load_grid()
    df = grid.df.set_index("cell_id")
    (OUT / "chaco_paraguayo.json").write_text(json.dumps(res, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    (OUT / "chaco_paraguayo.pdf").write_bytes(report_pdf.build(res))

    p, m, t = res["profile"], res["match"], res["techniques"]
    feats = {x["key"]: x for x in p["features"]}
    L = [
        "# Validation run: Chaco Paraguayo",
        "",
        f"Parcel: circle of 2 km radius at −22.5, −60.0 ({res['parcel']['area_km2']:.1f} km²). Mode: offline replay of "
        f"recorded responses. Result `{res['id']}`, generated {res['generated_at']}. Reference grid: "
        f"{m['n_reference_cells']} cells, {m['n_comparable_cells']} comparable. Dimensions used: "
        f"{len(m['dimensions_used'])}/24{' (missing: ' + ', '.join(m['dimensions_missing']) + ')' if m['dimensions_missing'] else ''}.",
        "",
        "Regenerate with `uv run python scripts/validate_chaco.py`. All figures below are read from "
        "`chaco_paraguayo.json` in this folder.",
        "",
        "## Parcel profile",
        "",
        "| Dimension | Value | z |",
        "|---|---|---|",
    ]
    for k, v in p["values"].items():
        z = p["z"].get(k)
        L.append(f"| {feats[k]['label']} | {f(v, feats[k]['unit'])} | {'' if z is None else f'{z:+.2f}'} |")
    lc = p.get("land_cover") or {}
    L += ["", f"Land cover (ESA WorldCover 2021): {lc.get('label', 'not available')}"
              f"{' (' + str(round(lc['share'] * 100)) + ' % of the parcel)' if lc else ''}. "
              f"Dry quarter: months {p.get('dry_quarter_months')}.", "",
          "## Matched innovation regions", "",
          "| # | Region | Similarity percentile | Distance | Analog cell aridity index | Analog annual precip. | Closest dimensions | Largest divergences |",
          "|---|---|---|---|---|---|---|---|"]
    for i, a in enumerate(m["analogs"], 1):
        row = df.loc[a["cell_id"]]
        L.append(f"| {i} | {a['region_name']} ({a['country']}) | {a['similarity_percentile']:.1f} | {a['distance']:.3f} | "
                 f"{f(row['aridity_index'])} | {f(row['annual_precip'], 'mm')} | "
                 f"{', '.join(feats[k]['label'] for k in a['drivers'])} | {', '.join(feats[k]['label'] for k in a['divergences'])} |")
    ai = p["values"].get("aridity_index")
    L += ["", f"The parcel's aridity index is {f(ai)} (UNEP class: "
              f"{'hyper-arid' if ai < 0.05 else 'arid' if ai < 0.2 else 'semi-arid' if ai < 0.5 else 'dry sub-humid' if ai < 0.65 else 'humid'}).",
          "", "## Top transferable techniques", "",
          "| Score | Technique | Source region | Constraints met | Evidence |", "|---|---|---|---|---|"]
    for x in t["ranked"][:10]:
        ev = x.get("evidence_check", {}).get("status", "not_checked")
        L.append(f"| {x['transferability']:.3f} | {x['technique']} | {x['region_name']} | "
                 f"{round(x['constraint_satisfaction'] * 100)} % | {x.get('evidence_doi') or x.get('evidence_url') or 'not available'} ({ev}) |")
    L += ["", f"## Blocked techniques ({len(t['blocked'])} of {t['n_techniques']})", ""]
    for x in t["blocked"]:
        L.append(f"- **{x['technique']}** ({x['region_name']}): {'; '.join(x['blocked_reasons'])}")
    L += ["", "## Missing data", ""]
    L += [f"- {k}: {v}" for k, v in p["missing"].items()] or ["None: all 24 dimensions were retrieved."]
    L += ["", "## Reading this result", "",
          "- The percentile ranks resemblance within the reference grid. It does not measure how likely a technique is to work.",
          "- Constraint checks use the parcel's own values; see METHODOLOGY.md §6 for what they cannot see (water source, capital, markets).",
          ""]
    (OUT / "chaco_paraguayo.md").write_text("\n".join(L), encoding="utf-8")
    print("\n".join(L[:4]))
    for i, a in enumerate(m["analogs"], 1):
        print(f"  {i}. {a['region_name']:45s} pct {a['similarity_percentile']:5.1f}")
    for x in t["ranked"][:5]:
        print(f"  {x['transferability']:.3f} {x['technique']}")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
