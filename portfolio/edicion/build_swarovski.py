#!/usr/bin/env python3
"""Arma el video de postulación a la Swarovski Foundation (inglés, 1920x1080) a partir de:
- trabajo/swarovski/S01..S11.wav (tu voz clonada, tts_swarovski.py)
- entrada/referencia.mp4 (solo planos recurso en los que no hablas a cámara)
Escribe remotion/src/timeline_sw.json, copia los medios a remotion/public y renderiza.
Uso: python3 build_swarovski.py   →  salida/swarovski_application.mp4
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).parent
W = HERE / "trabajo/swarovski"
PUB = HERE / "remotion/public"
OUT = HERE / "salida/swarovski_application.mp4"
GUION = json.loads((HERE / "swarovski_guion.json").read_text())
LEAD, GAP, TAIL = 0.5, 0.45, 3.0

# planos recurso de referencia.mp4 (desde, dur) — revisados a 4 fps: sin la camisa negra hablando a cámara
POOL = {
    "S01": [(0.0, 6.0), (9.5, 1.25), (12.0, 0.75), (14.0, 0.75)],   # ceremonia, fotos de premios
    "S04": [(26.3, 2.7), (115.2, 1.7)],                              # Ready Recycling en la escuela, ideatón
    "S06": [(119.0, 3.5), (116.9, 1.7)],                             # cheque RD+ Innovation, ideatón
    "S07": [(37.4, 1.8), (39.6, 3.0)],                               # pantalla Contractor AI, tabla de contratos
}
RES = {"S01": "name", "S02": "pillars", "S03": "3r", "S04": "rrr", "S05": "itu", "S06": "hackathon",
       "S07": "contractor", "S09": "ambition", "S10": "everyschool", "S11": "close"}

dur = lambda p: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))

def words_for(wav, text, t0):
    """Tiempos por palabra del guion: Whisper si cuadra el número de palabras, si no, reparto por longitud."""
    from faster_whisper import WhisperModel
    global ASR
    if "ASR" not in globals(): ASR = WhisperModel("medium", device="cpu", compute_type="int8")
    segs, _ = ASR.transcribe(str(wav), language="en", word_timestamps=True, condition_on_previous_text=False)
    got = [w for s in segs for w in s.words]
    script = text.split()
    if len(got) == len(script):
        return [{"w": s, "s": round(t0 + g.start, 3), "e": round(t0 + g.end, 3)} for s, g in zip(script, got)]
    a = got[0].start if got else 0.0; b = got[-1].end if got else dur(wav)
    tot = sum(len(s) + 1 for s in script); acc, out = 0, []
    for s in script:
        ws = a + (b - a) * acc / tot; acc += len(s) + 1
        out.append({"w": s, "s": round(t0 + ws, 3), "e": round(t0 + a + (b - a) * acc / tot, 3)})
    return out

def broll(start, length, pool):
    """Planos del pool hasta llenar la frase; si no alcanzan, el resto queda en fondo de narración."""
    clips, left = [], length
    for a, d in pool:
        if left <= 0.05: break
        take = min(d, left); clips.append([a, round(take, 3)]); left -= take
    return {"kind": "B", "src": "referencia.mp4", "start": round(start, 3), "dur": round(length - max(0, left), 3), "clips": clips}

def main():
    PUB.mkdir(exist_ok=True)
    for src, dst in [(HERE / "entrada/referencia.mp4", "referencia.mp4")]:
        if not (PUB / dst).exists(): shutil.copy(src, PUB / dst)
    # narración continua con silencios entre frases
    t, times, parts = LEAD, {}, []
    for g in GUION:
        p = W / f"{g['id']}.wav"; d = dur(p)
        times[g["id"]] = (t, t + d); parts.append((p, t)); t += d + GAP
    narr_end = t - GAP; total = round(narr_end + TAIL, 3)
    inputs, filt = [], []
    for i, (p, st) in enumerate(parts):
        inputs += ["-i", str(p)]; filt.append(f"[{i}:a]adelay={int(st * 1000)}|{int(st * 1000)},volume=-2dB[a{i}]")
    filt.append("".join(f"[a{i}]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{total},"
                "highpass=f=70,loudnorm=I=-15:TP=-1.5:LRA=9[out]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-ar", "48000",
                    str(PUB / "sw_narracion.wav")], check=True)
    # escenas visuales y rótulos
    words, scenes, res = [], [], []
    for g in GUION:
        a, b = times[g["id"]]; ws = words_for(W / f"{g['id']}.wav", g["say"], a); words += ws
        # cada escena dura hasta el inicio de la siguiente frase (o el final)
        nxt = next((times[h["id"]][0] for h in GUION[GUION.index(g) + 1:]), total)
        s0 = 0.0 if g is GUION[0] else a - GAP / 2; s1 = nxt - GAP / 2 if nxt != total else total
        if g["id"] in POOL:
            sc = broll(s0, s1 - s0, POOL[g["id"]]); scenes.append(sc)
            if sc["dur"] < s1 - s0 - .05: scenes.append({"kind": "N", "start": round(s0 + sc["dur"], 3), "dur": round(s1 - s0 - sc["dur"], 3)})
        elif g["id"] == "S08":
            # HackCorruption → OEA → Billion Acts, cortado por palabras
            find = lambda pat: next(w for w in ws if re.match(pat, w["w"], re.I))
            t_oas = find(r"it$")["s"] - .15  # "…HackCorruption, it was recognized…"
            t_bil = find(r"and$")["s"] - .1
            scenes.append({"kind": "N", "start": round(s0, 3), "dur": round(s1 - s0, 3)})
            res += [{"disparador": "hackcorruption", "s": round(s0, 3), "e": round(t_oas, 3)},
                    {"disparador": "oas", "s": round(t_oas, 3), "e": round(t_bil, 3)},
                    {"disparador": "billion", "s": round(t_bil, 3), "e": round(s1, 3)}]
            continue
        else:
            scenes.append({"kind": "N", "start": round(s0, 3), "dur": round(s1 - s0, 3)})
        if g["id"] == "S11":
            res += [{"disparador": "close", "s": round(s0, 3), "e": round(narr_end + .3, 3)},
                    {"disparador": "endcard", "s": round(narr_end + .3, 3), "e": total}]
        else:
            res.append({"disparador": RES[g["id"]], "s": round(s0 + .15, 3), "e": round(s1, 3)})
    tl = {"total": total, "audio": "sw_narracion.wav", "music": None, "scenes": scenes, "resources": res, "words": words}
    if (HERE / "trabajo/musica.wav").exists():
        shutil.copy(HERE / "trabajo/musica.wav", PUB / "sw_musica.wav"); tl["music"] = "sw_musica.wav"
    (HERE / "remotion/src/timeline_sw.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print(f"total {total:.1f} s; narración termina en {narr_end:.1f} s")
    if "--no-render" in sys.argv: return
    OUT.parent.mkdir(exist_ok=True)
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "Swarovski", str(OUT.resolve()), "--codec", "h264", "--crf", "20"],
                   cwd=HERE / "remotion", check=True)
    print("→", OUT)

if __name__ == "__main__":
    main()
