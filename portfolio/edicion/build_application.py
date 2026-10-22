#!/usr/bin/env python3
"""Arma un video de postulación en inglés (1920x1080) desde su guion <nombre>_guion.json:
- trabajo/<nombre>/*.wav (tu voz clonada, tts_swarovski.py <nombre>)
- entrada/crudo.mp4 y entrada/clips/2_210303.mp4 (tus tomas en el parque y frente a la fuente)
- entrada/referencia.mp4 (planos recurso sin hablar a cámara, para las frases con "visual": "broll")
Cada frase del guion dice su visual ("cam": tu toma + rótulo a la derecha; "full": rótulo a pantalla completa;
"broll": planos de referencia y luego tu toma) y su rótulo ("res": nombre, o [[nombre, palabra donde empieza], ...]).
Escribe remotion/src/timeline_<nombre>.json, copia los medios a remotion/public y renderiza.
Uso: python3 build_application.py swarovski|dalailama|fortis|benergy   →  salida/<nombre>_application.mp4
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).parent
NAME = next((a for a in sys.argv[1:] if not a.startswith("-")), "swarovski")
COMP = {"swarovski": "Swarovski", "dalailama": "DalaiLama", "fortis": "Fortis", "benergy": "BEnergy"}[NAME]
W = HERE / f"trabajo/{NAME}"
PUB = HERE / "remotion/public"
OUT = HERE / f"salida/{NAME}_application.mp4"
GUION = json.loads((HERE / f"{NAME}_guion.json").read_text())
LEAD, GAP, TAIL = 0.5, 0.45, 3.0

# Tomas de cámara (suéter rosado), en orden: parque y luego la fuente. Revisadas segundo a segundo; se saltan
# los momentos en que sales de cuadro (crudo 8–9.5 s, 66.8–68 s) y el final de la toma 2 (te tapas la cara).
CAM = [("crudo.mp4", 0.0, 8.0), ("crudo.mp4", 9.5, 57.3), ("crudo.mp4", 68.0, 12.5), ("toma2.mp4", 0.5, 40.0)]
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

class Camara:
    """Reparte las tomas de cámara entre las frases, sin repetir, en orden."""
    def __init__(self): self.i, self.pos = 0, CAM[0][1]
    def take(self, length):
        clips, left = [], length
        while left > 0.05 and self.i < len(CAM):
            src, a, d = CAM[self.i]; avail = a + d - self.pos
            t = min(avail, left); clips.append({"src": src, "from": round(self.pos, 3), "dur": round(t, 3)})
            left -= t; self.pos += t
            if self.pos >= a + d - 0.05:
                self.i += 1; self.pos = CAM[self.i][1] if self.i < len(CAM) else 0
        if left > 0.05: raise SystemExit(f"faltan {left:.1f} s de toma de cámara")
        return clips

def main():
    PUB.mkdir(exist_ok=True)
    for src, dst in [(HERE / "entrada/crudo.mp4", "crudo.mp4"), (HERE / "entrada/clips/2_210303.mp4", "toma2.mp4"),
                     (HERE / "entrada/referencia.mp4", "referencia.mp4")]:
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
                    str(PUB / f"{NAME}_narracion.wav")], check=True)
    # escenas visuales y rótulos
    words, scenes, res, cam = [], [], [], Camara()
    for g in GUION:
        a, b = times[g["id"]]; ws = words_for(W / f"{g['id']}.wav", g["say"], a); words += ws
        # cada escena dura hasta el inicio de la siguiente frase (o el final)
        nxt = next((times[h["id"]][0] for h in GUION[GUION.index(g) + 1:]), total)
        s0 = 0.0 if g is GUION[0] else a - GAP / 2; s1 = nxt - GAP / 2 if nxt != total else total
        vis = g["visual"]
        if vis == "cam":
            scenes.append({"kind": "V", "layout": "square", "start": round(s0, 3), "dur": round(s1 - s0, 3), "clips": cam.take(s1 - s0)})
        elif vis == "broll":
            clips = [{"src": "referencia.mp4", "from": f, "dur": d} for f, d in g["clips"]]
            bd = min(sum(c["dur"] for c in clips), s1 - s0)
            scenes.append({"kind": "V", "layout": "tall", "start": round(s0, 3), "dur": round(bd, 3), "clips": clips})
            if s1 - s0 - bd > .05:
                scenes.append({"kind": "V", "layout": "square", "start": round(s0 + bd, 3), "dur": round(s1 - s0 - bd, 3), "clips": cam.take(s1 - s0 - bd)})
        else:
            scenes.append({"kind": "N", "start": round(s0, 3), "dur": round(s1 - s0, 3)})
        end = narr_end + .3 if g is GUION[-1] else s1
        # rótulos: uno por frase, o varios que empiezan en la palabra indicada
        parts = g["res"] if isinstance(g["res"], list) else [[g["res"], None]]
        starts = [s0 + .15 if pat is None else next(w for w in ws if re.match(pat, w["w"], re.I))["s"] - .12 for _, pat in parts]
        for k, (r, _) in enumerate(parts):
            res.append({"disparador": r, "s": round(starts[k], 3), "e": round(starts[k + 1] if k + 1 < len(parts) else end, 3), "panel": vis != "full"})
        if g is GUION[-1]:
            res.append({"disparador": "endcard", "sub": g.get("endcard", ""), "s": round(end, 3), "e": total})
    tl = {"total": total, "audio": f"{NAME}_narracion.wav", "music": None, "scenes": scenes, "resources": res, "words": words}
    if (HERE / "trabajo/musica.wav").exists():
        shutil.copy(HERE / "trabajo/musica.wav", PUB / "sw_musica.wav"); tl["music"] = "sw_musica.wav"
    (HERE / f"remotion/src/timeline_{NAME}.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print(f"total {total:.1f} s; narración termina en {narr_end:.1f} s")
    if "--no-render" in sys.argv: return
    OUT.parent.mkdir(exist_ok=True)
    subprocess.run(["npx", "remotion", "render", "src/index.ts", COMP, str(OUT.resolve()), "--codec", "h264", "--crf", "20"],
                   cwd=HERE / "remotion", check=True)
    print("→", OUT)

if __name__ == "__main__":
    main()
