"""Printable PDF brief of a query result (reportlab, built-in fonts only)."""

from __future__ import annotations

import io
from collections import Counter

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

# Built-in PDF fonts are WinAnsi-encoded; map the few symbols we use outside that set.
_SUBS = {"≥": ">=", "≤": "<=", "₂": "2", "⁰": "0", "γ": "gamma", "−": "-", "→": "->", "×": "x", "÷": "/",
         "²": "2", "ⁿ": "n", "√": "sqrt", "⊙": "*", "Σ": "sum", "ᵀ": "T"}

INK = colors.HexColor("#1f2a1f")
MUTED = colors.HexColor("#5d6b5d")
ACCENT = colors.HexColor("#3f6b3a")
RULE = colors.HexColor("#cfd8cc")


def _t(s) -> str:
    s = "" if s is None else str(s)
    for a, b in _SUBS.items():
        s = s.replace(a, b)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _num(v, unit: str = "") -> str:
    if v is None:
        return "not available"
    a = abs(v)
    s = f"{v:.3f}" if a < 1 else f"{v:.2f}" if a < 10 else f"{v:.1f}" if a < 100 else f"{v:,.0f}"
    return f"{s} {unit}".strip() if unit not in ("index", "ratio") else s


def build(result: dict) -> bytes:
    ss = getSampleStyleSheet()
    body = ParagraphStyle("b", parent=ss["BodyText"], fontName="Helvetica", fontSize=8.6, leading=11.2,
                          textColor=INK)
    small = ParagraphStyle("s", parent=body, fontSize=7.4, leading=9.4, textColor=MUTED)
    h1 = ParagraphStyle("h1", parent=body, fontName="Helvetica-Bold", fontSize=17, leading=21, spaceAfter=2)
    h2 = ParagraphStyle("h2", parent=body, fontName="Helvetica-Bold", fontSize=11, leading=14, spaceBefore=10,
                        spaceAfter=4, textColor=ACCENT)
    h3 = ParagraphStyle("h3", parent=body, fontName="Helvetica-Bold", fontSize=9, leading=12, spaceBefore=4)

    def P(x, st=body):
        return Paragraph(_t(x), st)

    def table(rows, widths, header=True):
        t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
        style = [("FONT", (0, 0), (-1, -1), "Helvetica", 7.6), ("TEXTCOLOR", (0, 0), (-1, -1), INK),
                 ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
                 ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]
        if header:
            style += [("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7.6), ("TEXTCOLOR", (0, 0), (-1, 0), MUTED)]
        t.setStyle(TableStyle(style))
        return t

    p = result["parcel"]
    story = [P("CropMatch Analog Engine — parcel brief", h1),
             P(f"{p.get('name') or 'Unnamed parcel'} · centroid {p['centroid']['lat']:.4f}, "
               f"{p['centroid']['lon']:.4f} · {p['area_km2']:.1f} km² · generated {result['generated_at']} "
               f"· mode {result['mode']} · result {result['id']}", small),
             Spacer(1, 4)]
    for d in result.get("disclaimers", []):
        story.append(P(f"• {d}", small))

    if result.get("status") != "ok":
        story += [P("No result", h2), P(result.get("message", ""))]
        return _render(story)

    prof = result["profile"]
    feats = prof["features"]
    missing = prof["missing"]
    story.append(P("1. Biophysical profile", h2))
    story.append(P(f"{prof['n_available']} of 24 dimensions available. z = standard deviations from the reference-"
                   f"grid mean. Land cover: "
                   f"{(prof.get('land_cover') or {}).get('label', 'not available')} (ESA WorldCover 2021). "
                   f"Dry quarter (months): {prof.get('dry_quarter_months') or 'not available'}.", body))
    rows = [["Group", "Dimension", "Value", "z", "Source"]]
    for f in feats:
        v = prof["values"].get(f["key"])
        z = prof["z"].get(f["key"])
        rows.append([f["group"], P(f["label"], small), _t(_num(v, f["unit"])),
                     "" if z is None else f"{z:+.2f}", P(f["source"], small)])
    story.append(table(rows, [18 * mm, 52 * mm, 28 * mm, 12 * mm, 70 * mm]))
    if missing:
        story.append(P("Missing dimensions", h3))
        for k, why in missing.items():
            story.append(P(f"• {k}: {why}", small))

    m = result["match"]
    story.append(P("2. Closest analogs in documented innovation regions", h2))
    story.append(P(f"Compared with {m['n_comparable_cells']} of {m['n_reference_cells']} reference cells "
                   f"({m['n_excluded_cells']} excluded for sharing too few dimensions). Effective group weights: "
                   + ", ".join(f"{g} {w:.2f}" for g, w in m["group_weights_effective"].items()), body))
    labels = {f["key"]: f["label"] for f in feats}
    rows = [["#", "Region", "Cell", "Percentile", "Distance", "Closest dimensions", "Largest divergences"]]
    for i, a in enumerate(m["analogs"][:5], 1):
        rows.append([str(i), P(f"{a['region_name']} ({a['country']})", small),
                     f"{a['lat']:.3f}, {a['lon']:.3f}", f"{a['similarity_percentile']:.1f}",
                     f"{a['distance']:.3f}", P("; ".join(labels[k] for k in a["drivers"]), small),
                     P("; ".join(labels[k] for k in a["divergences"]), small)])
    story.append(table(rows, [6 * mm, 34 * mm, 25 * mm, 16 * mm, 15 * mm, 42 * mm, 42 * mm]))

    tech = result["techniques"]
    story.append(P("3. Transferable techniques (ranked)", h2))
    story.append(P("Transferability = analog similarity (source-region percentile / 100) × share of the technique's "
                   "constraints verified as met by this parcel.", small))
    for t in tech["ranked"][:15]:
        ev = t.get("evidence_check", {}).get("status", "not_checked").replace("_", " ")
        link = t.get("evidence_url") or "not available"
        block = [P(f"{t['transferability']:.2f} — {t['technique']}", h3),
                 P(f"{t['region_name']} · {t['category'].replace('_', ' ')} · capital {t['capital_tier']} · "
                   f"crops: {', '.join(t.get('crops', []))}", small),
                 P(f"Documented effect: {t['documented_effect']}"),
                 P(f"Evidence: {t['evidence_source']} {link} [{ev}]", small),
                 P(f"Adaptation: {t['adaptation_notes']}", small)]
        if t.get("unverified_constraints"):
            block.append(P("Not verified: " + "; ".join(t["unverified_constraints"]), small))
        story.append(KeepTogether(block))

    story.append(P("4. Blocked techniques", h2))
    rows = [["Technique", "Source region", "Why it does not transfer"]]
    for t in tech["blocked"]:
        rows.append([P(t["technique"], small), P(t["region_name"], small),
                     P("; ".join(t["blocked_reasons"]), small)])
    story.append(table(rows, [66 * mm, 36 * mm, 78 * mm]))

    story.append(PageBreak())
    story.append(P("5. Data sources and provenance", h2))
    for n in result.get("source_notes", []):
        story.append(P(f"• {n}", small))
    rows = [["Source", "Dimensions", "Status", "Note"]]
    for s in result["sources"]:
        rows.append([P(s["source"], small), P(", ".join(s["dimensions"]), small), "ok" if s["ok"] else "missing",
                     P(s.get("note") or "", small)])
    story.append(table(rows, [40 * mm, 60 * mm, 14 * mm, 66 * mm]))
    counts = Counter(e["source"] for e in result["provenance"])
    story.append(P(f"{len(result['provenance'])} logged reads: " +
                   "; ".join(f"{k} ({v})" for k, v in counts.most_common()), small))
    scenes = [e for e in result["provenance"] if "Sentinel" in e["source"] and e.get("product_id")]
    if scenes:
        story.append(P("Satellite scenes used", h3))
        for e in scenes:
            story.append(P(f"{e['product_id']} · {e['acquisition_date']} · {e['processing_level']}", small))
    return _render(story)


def _render(story) -> bytes:
    buf = io.BytesIO()

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(15 * mm, 10 * mm, "CropMatch Analog Engine — every figure is computed from retrieved data "
                                            "or read from a cited knowledge-base entry.")
        canvas.drawRightString(195 * mm, 10 * mm, f"page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=14 * mm,
                            bottomMargin=16 * mm, title="CropMatch parcel brief")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buf.getvalue()
