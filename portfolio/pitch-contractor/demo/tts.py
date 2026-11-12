import json, re, sys, torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS
m = ChatterboxTTS.from_pretrained(device="cpu"); ref = sys.argv[1]
segs = json.load(open("narracion.json")); only = sys.argv[2:] or list(segs)
for k in only:
    parts = [s for s in re.split(r"(?<=[.!?])\s+", segs[k]) if s]
    wavs = []
    for s in parts:
        torch.manual_seed(int(__import__("os").environ.get("SEED","7")))
        w = m.generate(s.replace("Chocó", "Chocoh"), audio_prompt_path=ref, exaggeration=0.45, cfg_weight=0.5)
        wavs += [w, torch.zeros(1, int(m.sr * .28))]
    out = torch.cat(wavs[:-1], dim=1); ta.save(f"nar/{k}.wav", out, m.sr); print(k, round(out.shape[1] / m.sr, 1), flush=True)
