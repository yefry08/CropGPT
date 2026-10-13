#!/usr/bin/env python3
"""Paso 2 — narración con tu voz clonada (Chatterbox Multilingual, language_id="es").

Genera un audio por cada párrafo [N] de guion.txt usando entrada/mi_voz.wav como referencia,
normaliza cada uno a -14 LUFS y además los une con pausas de 0,4 s en trabajo/narracion.wav.
Detecta GPU (cuda / mps) y, si no hay, usa CPU.

Uso:  /root/.venv-tts/bin/python narrar.py [--solo N3]   (--solo regenera un único párrafo)
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

HERE = Path(__file__).parent
OUT = HERE / "trabajo" / "narracion"; OUT.mkdir(parents=True, exist_ok=True)

# Cómo debe sonar cada nombre en inglés. Solo afecta a lo que se le pasa al sintetizador:
# los subtítulos siguen saliendo de guion.txt tal cual.
PRONUNCIA = {
    "Contractor AI": "Contráctor Ei Ái",
    "HackCorruption": "Jack Corrúpshon",
    "Billion Acts Fellow": "Bílion Acts Félou",
    "3R VideoGame": "Tres Erre Vídeo Guéim",
    "ITU SDGs Digital GameChangers": "I Ti Iú, Es Di Yis, Díyital Guéim Chéinyers",
    "NeurIPS 2026": "Níurips dos mil veintiséis",
    "São Paulo": "Sao Páulo",
}
def pronuncia(t):
    for k, v in PRONUNCIA.items(): t = t.replace(k, v)
    return t

def tokens(t):
    import unicodedata
    t = "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", t).split()

def puntua(asr, wav, text):
    """Qué parte de las palabras en español del guion se oye, en orden (los nombres en inglés no cuentan)."""
    import difflib
    ingles = {w for k in PRONUNCIA for w in tokens(k)}
    want = [w for w in tokens(text) if w not in ingles]
    segs, _ = asr.transcribe(str(wav), language="es", condition_on_previous_text=False)
    heard = " ".join(x.text for x in segs)
    got = sum(b.size for b in difflib.SequenceMatcher(None, want, tokens(heard), autojunk=False).get_matching_blocks())
    return got / max(1, len(want)), heard.strip()

def device():
    if torch.cuda.is_available(): return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available(): return "mps"
    return "cpu"

def parrafos():
    out, n = [], 0
    for line in (HERE / "guion.txt").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\[(N|C)\]\s*(.+)", line.strip())
        if m and m.group(1) == "N":
            n += 1; out.append((f"N{n}", m.group(2)))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", help="regenera solo estos párrafos, p. ej. N3 o N2,N5")
    ap.add_argument("--exag", type=float, default=0.45, help="expresividad (0.25-1.0)")
    ap.add_argument("--cfg", type=float, default=0.35, help="más bajo = ritmo más pausado")
    ap.add_argument("--tomas", type=int, default=3, help="tomas por párrafo; se queda la que mejor se entiende")
    a = ap.parse_args()
    dev = device(); print("dispositivo:", dev, flush=True)
    model = ChatterboxMultilingualTTS.from_pretrained(device=dev)
    ref = str(HERE / "entrada" / "mi_voz.wav")
    from faster_whisper import WhisperModel
    asr = WhisperModel("medium", device="cpu", compute_type="int8")
    informe = {}
    for pid, text in parrafos():
        if a.solo and pid not in a.solo.split(","): continue
        best = None
        for seed in [7, 11, 23, 31, 47][: a.tomas]:
            torch.manual_seed(seed)
            wav = model.generate(pronuncia(text), language_id="es", audio_prompt_path=ref, exaggeration=a.exag, cfg_weight=a.cfg)
            cand = OUT / f"{pid}_s{seed}.wav"; ta.save(str(cand), wav, model.sr)
            sc, heard = puntua(asr, cand, text)
            print(f"    {pid} semilla {seed}: {sc:.0%}  «{heard}»", flush=True)
            if best is None or sc > best[0]: best = (sc, seed, cand, heard)
            if sc >= .999: break
        raw = OUT / f"{pid}_raw.wav"; best[2].replace(raw)
        informe[pid] = {"semilla": best[1], "acierto": round(best[0], 3), "se_oye": best[3]}
        # recorta silencio de cabeza y cola y normaliza a -14 LUFS
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
            "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "48000", "-ac", "1", str(OUT / f"{pid}.wav")], check=True)
        d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(OUT / f"{pid}.wav")]))
        print(f"  {pid}  {d:5.1f} s  {text[:60]}…", flush=True)
    if informe:
        prev = HERE / "trabajo" / "narracion_tomas.json"
        old = json.loads(prev.read_text()) if prev.exists() else {}
        old.update(informe); prev.write_text(json.dumps(old, ensure_ascii=False, indent=1))
    # unión con pausas de 0,4 s, normalizada a -14 LUFS
    ids = [p for p, _ in parrafos()]
    lst = OUT / "lista.txt"; gap = OUT / "pausa.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "0.4", str(gap)], check=True)
    lst.write_text("".join(f"file '{i}.wav'\nfile 'pausa.wav'\n" for i in ids))
    j = OUT / "unida.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(j)], check=True)
    def lufs(p):
        e = subprocess.run(["ffmpeg", "-i", str(p), "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True).stderr
        return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1])
    gain, src = 0.0, j
    for _ in range(3):                       # ganancia + limitador de picos, hasta quedar a ±0,2 dB de -14
        gain += -14 - lufs(src)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(j), "-af", f"volume={gain:.2f}dB,alimiter=limit=0.84:level=false",
                        "-ar", "48000", str(HERE / "trabajo" / "narracion.wav")], check=True)
        src = HERE / "trabajo" / "narracion.wav"
        if abs(lufs(src) + 14) <= .2: break
    print(f"narración unida a {lufs(src):.1f} LUFS")
    print("narración unida → trabajo/narracion.wav")

if __name__ == "__main__":
    main()
