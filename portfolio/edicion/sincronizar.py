#!/usr/bin/env python3
"""Paso 3 y 4 — sincronización.
Transcribe cada narración con marcas por palabra, alinea el texto de guion.txt con lo que oyó
Whisper (para que los subtítulos salgan bien escritos y bien medidos), arma la línea de tiempo
y sitúa cada disparador de recursos.json. Si un disparador no aparece, lo avisa y no lo inventa.
Salida: remotion/src/timeline.json  y  trabajo/disparadores.md
Uso: python3 sincronizar.py
"""
import difflib, json, os, re, subprocess, unicodedata
from pathlib import Path
from faster_whisper import WhisperModel

HERE = Path(__file__).parent
HOLD = float(os.environ.get("HOLD", 1.0))                    # respiro visual tras cada narración (la narración unida mantiene sus 0,4 s)
TITLE = 2.4                    # rótulo de capítulo (## …): pantalla propia, solo música
LEAD = 1.5                     # pausa dramática inicial: música y «DE GUERRA» antes de la voz
PRE, MIN_DUR = 0.2, 2.0        # el recurso entra 0,2 s antes y dura al menos 2 s
C1_END = 8.78                  # fin de la presentación dentro de base_editado (tramo 1 del montaje)

def norm(w):
    w = unicodedata.normalize("NFD", w.lower()); w = "".join(ch for ch in w if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)

def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))

def align(text, heard):
    """Copia los tiempos de las palabras oídas a las palabras del guion; interpola las que no casan."""
    toks = text.split(); a = [norm(t) for t in toks]; b = [norm(h["w"]) for h in heard]
    times = [None] * len(toks)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): times[blk.a + k] = (heard[blk.b + k]["s"], heard[blk.b + k]["e"])
    # rellena huecos repartiendo el tiempo entre vecinos conocidos
    t0 = heard[0]["s"] if heard else 0; t1 = heard[-1]["e"] if heard else 1
    i = 0
    while i < len(toks):
        if times[i] is None:
            j = i
            while j < len(toks) and times[j] is None: j += 1
            lo = times[i - 1][1] if i > 0 else t0; hi = times[j][0] if j < len(toks) else t1
            step = (hi - lo) / (j - i)
            for k in range(i, j): times[k] = (lo + (k - i) * step, lo + (k - i + 1) * step)
            i = j
        else: i += 1
    return [{"w": t, "s": round(s, 3), "e": round(e, 3)} for t, (s, e) in zip(toks, times)]

def main():
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    def hear(path, clip=None):
        kw = {"clip_timestamps": clip} if clip else {}
        segs, _ = model.transcribe(str(path), language="es", word_timestamps=True, condition_on_previous_text=False, **kw)
        return [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]

    lines = []
    for l in (HERE / "guion.txt").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\[(N|C)\]\s*(.+)", l.strip()) or re.match(r"(##)\s*(.+)", l.strip())
        if m: lines.append(("T" if m.group(1) == "##" else m.group(1), m.group(2)))
    base = HERE / "trabajo" / "base_editado.mov"; base_d = dur(base)
    base_words = [w for s in json.load(open(HERE / "trabajo" / "base.json"))["segments"] for w in s["words"]]
    scenes, t, n, c, ti = [], 0.0, 0, 0, 0
    for kind, text in lines:
        if kind == "T":
            ti += 1
            scenes.append({"id": f"T{ti}", "kind": "T", "start": round(t, 3), "dur": TITLE, "text": text, "words": []})
            t += TITLE; continue
        if kind == "N":
            n += 1; sid = f"N{n}"; wav = HERE / "trabajo" / "narracion" / f"{sid}.wav"
            pre = LEAD if n == 1 else 0.0
            d = dur(wav); words = [{**w, "s": round(w["s"] + pre, 3), "e": round(w["e"] + pre, 3)} for w in align(text, hear(wav))]
            scenes.append({"id": sid, "kind": "N", "start": round(t, 3), "dur": round(pre + d + HOLD, 3), "pre": pre, "audio": f"{sid}.wav", "text": text, "words": words})
            t += pre + d + HOLD
        else:
            c += 1; sid = f"C{c}"
            a, b = (0.0, C1_END) if c == 1 else (C1_END, base_d)
            heard = [{"w": w["w"], "s": w["s"] - a, "e": w["e"] - a} for w in base_words if a - .05 <= w["s"] < b]
            words = align(text, heard)
            sc = {"id": sid, "kind": "C", "start": round(t, 3), "dur": round(b - a, 3), "src": "base.mp4", "from": a, "text": text, "words": words}
            frases = re.split(r"(?<=\.)\s+", text.strip())
            files = [HERE / "trabajo" / "narracion" / f"{sid}_{k}.wav" for k in range(1, len(frases) + 1)]
            if all(f.exists() for f in files):
                # Tu voz a cámara sustituida por la clonada: cada frase entra cuando la empiezas a decir en el vídeo.
                idx, starts = 0, []
                for fr in frases: starts.append(words[idx]["s"]); idx += len(fr.split())
                voz, nw, prev_end = [], [], 0.0
                for k, (fr, f) in enumerate(zip(frases, files)):
                    d = dur(f); at = max(starts[k], prev_end + .25)
                    slot = (starts[k + 1] if k + 1 < len(frases) else sc["dur"] - .15) - at
                    tempo = 1.0 if d <= slot else min(1.15, d / max(slot, .1))
                    voz.append({"file": f.name, "at": round(at, 3), "tempo": round(tempo, 3), "dur": round(d / tempo, 3)})
                    nw += [{**w, "s": round(at + w["s"] / tempo, 3), "e": round(at + w["e"] / tempo, 3)} for w in align(fr, hear(f))]
                    prev_end = at + d / tempo
                    if prev_end > sc["dur"]: print(f"  AVISO {sid}: la frase {k + 1} acaba {prev_end - sc['dur']:.2f} s después del plano")
                sc["voz"], sc["words"] = voz, nw
            scenes.append(sc)
            t += b - a
    # disparadores
    res = json.load(open(HERE / "recursos.json"))
    placed, missing = [], []
    for r in res:
        key = [norm(x) for x in r["disparador"].split()]
        hit = None
        for sc in scenes:
            ws = [norm(w["w"]) for w in sc["words"]]
            for i in range(len(ws) - len(key) + 1):
                if ws[i:i + len(key)] == key: hit = (sc, i); break
            if hit: break
        if not hit: missing.append(r["disparador"]); continue
        sc, i = hit; W = sc["words"]
        s = W[i]["s"] - PRE
        j = i + len(key) - 1                        # hasta el final de la frase
        while j < len(W) - 1 and not re.search(r"[.!?]$", W[j]["w"]): j += 1
        e = max(W[j]["e"], s + MIN_DUR); e = min(e, sc["dur"])
        if "duracion" in r: e = max(0, s) + r["duracion"]          # rótulos que tapan un empalme
        if r.get("desde_inicio"): s = 0.0
        placed.append({**r, "scene": sc["id"], "kind": sc["kind"], "s": round(max(0, s), 3), "e": round(e, 3), "abs": round(sc["start"] + max(0, s), 3)})
    # En las escenas narradas no hay cámara a la que volver: el gráfico se queda hasta el final de la escena
    # o hasta que otro recurso ocupe su lugar (misma capa, o uno a pantalla completa).
    byid = {sc["id"]: sc for sc in scenes}
    # el primer gráfico de cada escena narrada entra desde el principio de la escena: nunca pantalla vacía
    for sid in {p["scene"] for p in placed if p["kind"] == "N"}:
        first = min((p for p in placed if p["scene"] == sid), key=lambda p: p["s"])
        first["abs"] = round(first["abs"] - first["s"], 3); first["s"] = 0.0
    for p in placed:
        if p["kind"] != "N": continue
        p["e"] = byid[p["scene"]]["dur"]
        for q in placed:
            if q is p or q["scene"] != p["scene"] or q["s"] <= p["s"]: continue
            if q.get("capa") == "full" or p.get("capa") == "full" or q.get("capa") == p.get("capa"): p["e"] = min(p["e"], q["s"])
    out = {"fps": 30, "total": round(t, 3), "scenes": scenes, "resources": placed, "missing": missing}
    (HERE / "remotion" / "src").mkdir(parents=True, exist_ok=True)
    json.dump(out, open(HERE / "remotion" / "src" / "timeline.json", "w"), ensure_ascii=False, indent=1)
    md = ["| # | Disparador | Escena | Entra | Sale | Recurso |", "|---|---|---|---|---|---|"]
    for k, p in enumerate(sorted(placed, key=lambda p: p["abs"]), 1):
        mm = lambda x: f"{int(x // 60)}:{x % 60:05.2f}"
        md.append(f"| {k} | {p['disparador']} | {p['scene']} | {mm(p['abs'])} | {mm(p['abs'] + p['e'] - p['s'])} | {p.get('texto') or p.get('descripcion')} |")
    if missing: md.append("\n**No aparecen en la narración:** " + ", ".join(missing))
    (HERE / "trabajo" / "disparadores.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"total {t:.1f} s · {len(placed)} disparadores situados · faltan: {missing or 'ninguno'}")

if __name__ == "__main__":
    main()
