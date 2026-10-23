"""videomaker pipeline: one job per video in jobs/<id>/ (gitignored).

  research (Claude, research.py)  ->  review (the user edits and approves the script)  ->  narrate (cloned voice, Voicebox)
  ->  render (paper-collage film, engine/film.html + the social skill's build.sh)  ->  done (video.mp4 + descripcion.md)

State lives in jobs/<id>/job.json so the server can restart without losing jobs."""
import json
import shutil
import subprocess
import threading
import time
import urllib.request
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
JOBS = HERE / "jobs"
ENGINE = HERE / "engine"
SAMPLES = HERE / "samples"
TTS = REPO / "portfolio/edicion/tts_voicebox.py"
BUILD = REPO / ".claude/skills/social/scripts/build.sh"
NODE_MODULES = REPO / "portfolio/ia-warhammer/node_modules"
VOICEBOX = "http://127.0.0.1:17493"
VOICEBOX_DIR = REPO / "engines/voicebox"
CREDITS = {"es": ["Voz sintética clonada (Voicebox) · Animación con IA (Claude)", "Ilustración, sin imágenes reales · Fuentes en la descripción"],
           "en": ["Cloned synthetic voice (Voicebox) · AI animation (Claude)", "Illustration, no real footage · Sources in the description"]}
_lock = threading.Lock()


def _path(job_id):
    p = (JOBS / job_id).resolve()
    if p.parent != JOBS.resolve():
        raise ValueError("bad job id")
    return p


def load(job_id):
    return json.loads((_path(job_id) / "job.json").read_text())


def save(job):
    d = _path(job["id"]); d.mkdir(parents=True, exist_ok=True)
    with _lock:
        tmp = d / "job.json.tmp"; tmp.write_text(json.dumps(job, ensure_ascii=False, indent=1)); tmp.replace(d / "job.json")


def jobs():
    JOBS.mkdir(exist_ok=True)
    out = [json.loads(p.read_text()) for p in JOBS.glob("*/job.json")]
    return sorted(out, key=lambda j: j["created"], reverse=True)


def _log(job, msg):
    job["log"].append(f"{time.strftime('%H:%M:%S')} {msg}"); save(job)


def _fail(job, err):
    job["status"] = "error"; _log(job, f"Error: {err}")


def samples():
    return sorted(p.stem for p in SAMPLES.glob("*.json"))


def create(topic, lang="es", sample=None):
    """Start a job. With `sample`, skip research and load samples/<sample>.json (works without an API key)."""
    job = {"id": time.strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:4], "topic": topic, "lang": lang, "status": "researching",
           "created": time.time(), "log": [], "script": None, "sample": sample}
    save(job); threading.Thread(target=_research, args=(job,), daemon=True).start()
    return job


def _research(job):
    try:
        if job["sample"]:
            if job["sample"] not in samples():
                raise ValueError(f"unknown sample {job['sample']}")
            job["script"] = json.loads((SAMPLES / f"{job['sample']}.json").read_text()); _log(job, "Sample script loaded (no research call).")
        else:
            import research
            _log(job, "Researching and fact-checking with Claude (web search)…")
            job["script"] = research.plan(job["topic"], job["lang"], log=lambda m: _log(job, m))
        job["status"] = "review"; _log(job, "Script ready: review it and approve to render.")
    except Exception as e:   # surfaced to the UI; the job stays inspectable
        _fail(job, e)


def approve(job_id, sections=None, disclosure=None):
    """Apply the user's edits (narration text per section, disclosure) and start narration + render."""
    job = load(job_id)
    if job["status"] not in ("review", "error"):
        raise ValueError(f"job is {job['status']}")
    for s in sections or []:
        for t in job["script"]["sections"]:
            if t["id"] == s.get("id") and s.get("text") and s["text"] != t["text"]:
                t["text"] = s["text"]; t["tts"] = s["text"]
    if disclosure is not None:
        job["script"]["disclosure"] = disclosure
    job["status"] = "narrating"; save(job)
    threading.Thread(target=_produce, args=(job,), daemon=True).start()
    return job


def _voicebox_up():
    try:
        return json.loads(urllib.request.urlopen(VOICEBOX + "/health", timeout=3).read()).get("status") == "healthy"
    except OSError:
        return False


def _ensure_voicebox(job):
    if _voicebox_up():
        return
    _log(job, "Starting the Voicebox voice server…")
    subprocess.Popen([str(VOICEBOX_DIR / "backend/venv/bin/python"), "-m", "backend.main", "--host", "127.0.0.1", "--port", "17493",
                      "--data-dir", "/root/voicebox-data"], cwd=VOICEBOX_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    for _ in range(60):
        time.sleep(3)
        if _voicebox_up():
            return
    raise RuntimeError("Voicebox did not start (engines/voicebox).")


def _run(job, cmd, cwd):
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    tail = (p.stdout + p.stderr).strip().splitlines()[-3:]
    for line in tail:
        _log(job, "  " + line[:200])
    if p.returncode:
        raise RuntimeError(f"{Path(cmd[1] if cmd[0] in ('python3', 'bash') else cmd[0]).name} failed ({p.returncode})")


def _produce(job):
    d = _path(job["id"]); sc = job["script"]; lang = job["lang"]
    try:
        # 1. files the film and the narrator read
        for f in ENGINE.iterdir():
            if f.is_file():
                shutil.copy(f, d / f.name)
        if not (d / "node_modules").exists():
            (d / "node_modules").symlink_to(NODE_MODULES)
        (d / "sections-reel.json").write_text(json.dumps({"title": sc["title"], "language": lang,
            "sections": [{"id": s["id"], "chapter": s["chapter"], "text": s["text"]} for s in sc["sections"]]}, ensure_ascii=False, indent=2))
        spec = {"sections": [{"id": s["id"], "text": s["text"], "background": s["background"], "beats": s["beats"]} for s in sc["sections"]],
                "disclosure": sc.get("disclosure", ""), "credits": CREDITS.get(lang, CREDITS["en"])}
        (d / "spec.js").write_text("window.SPEC = " + json.dumps(spec, ensure_ascii=False) + ";\n")
        # 2. narration: reuse a sample's recorded takes if present, else the cloned voice
        raw = d / "audio-reel/raw"; raw.mkdir(parents=True, exist_ok=True)
        reuse = REPO / sc["audio_from"] if sc.get("audio_from") else None
        if reuse and all((reuse / f"{s['id']}.wav").exists() for s in sc["sections"]):
            for s in sc["sections"]:
                shutil.copy(reuse / f"{s['id']}.wav", raw / f"{s['id']}.wav")
            _log(job, "Narration: reusing the sample's recorded takes.")
        else:
            _ensure_voicebox(job)
            (d / "voz.json").write_text(json.dumps([{"id": s["id"], "say": s["text"], "tts": s.get("tts") or s["text"]} for s in sc["sections"]],
                                                   ensure_ascii=False, indent=1))
            _log(job, "Narrating with the cloned voice (a few minutes per section)…")
            _run(job, ["python3", str(TTS), str(d / "voz.json"), str(raw), "--lang", lang], cwd=TTS.parent)
        # 3. render: time the film to the voice, render frames, mix and verify
        job["status"] = "rendering"; _log(job, "Rendering the collage film…")
        _run(job, ["bash", str(BUILD), "film.html", "sections-reel.json", "timing-reel.js", "audio-reel", "video.mp4",
                   "--tempo", "1.08", "--gap", "0.45", "--tail", "2.8"], cwd=d)
        # 4. post description
        (d / "descripcion.md").write_text(describe(sc, lang), encoding="utf-8")
        shutil.rmtree(d / "out", ignore_errors=True)   # frames and intermediates are large
        job["status"] = "done"; _log(job, "Done: video.mp4 and descripcion.md are ready.")
    except Exception as e:
        _fail(job, e)


def describe(sc, lang):
    es = lang == "es"
    lines = [f"# {sc['title']}", "", "**" + ("Texto para publicar:" if es else "Post text:") + "**", sc.get("post_text", ""), ""]
    if sc.get("disclosure"):
        lines += [("Aviso: " if es else "Disclosure: ") + sc["disclosure"], ""]
    lines += [("Voz sintética clonada. Ilustraciones genéricas, sin personas reales." if es else "Cloned synthetic voice. Generic illustrations, no real people."), ""]
    lines += ["**" + ("Qué verificamos:" if es else "What we checked:") + "**", "",
              "| " + ("Se decía" if es else "Claim") + " | " + ("Lo que dicen las fuentes" if es else "What sources say") + " |", "|---|---|"]
    lines += [f"| {f['claim']} | {f['finding']} |" for f in sc.get("facts", [])]
    lines += ["", "**" + ("Fuentes:" if es else "Sources:") + "**"] + [f"- {s['title']}: {s['url']}" for s in sc.get("sources", [])]
    lines += ["", "**" + ("Contenido sintético:" if es else "Synthetic content:") + "** " + ("sí. Marca la casilla de contenido generado con IA al publicar." if es else "yes. Tick the AI-generated content label when posting.")]
    return "\n".join(lines) + "\n"
