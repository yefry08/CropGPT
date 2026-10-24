"""A videomaker project is one folder: project.json (script, scenes, settings) plus audio/<section>.wav and the exported files."""
import json
import re
from pathlib import Path

from . import voice

CREDITS = {"es": ["Voz sintética clonada (Voicebox) · Animación hecha con código", "Ilustración, sin imágenes reales · Fuentes en la descripción"],
           "en": ["Cloned synthetic voice (Voicebox) · Animation made with code", "Illustration, no real footage · Sources in the description"]}
WORDS_PER_SEC = 2.6


def new(title="Nuevo video", lang="es"):
    return {"title": title, "lang": lang, "style": "collage", "profile_id": "", "gap": .45, "tail": 2.8, "tempo": 1.08, "disclosure": "", "post_text": "",
            "sources": [], "facts": [], "credits": CREDITS[lang],
            "sections": [section("s1", "Gancho", "Escribe aquí lo que dirá tu voz en esta escena.")]}


def section(sid, chapter="", text="", background="rays_red"):
    return {"id": sid, "chapter": chapter, "text": text, "tts": "", "seed": 7, "background": background,
            "beats": [{"items": [{"kind": "tape", "text": "TÍTULO", "prop": "none", "x": 0, "y": 300, "style": "black", "size": 96},
                                 {"kind": "prop", "text": "", "prop": "robot", "x": 0, "y": 760, "style": "black", "size": 100}]}]}


def new_id(p):
    n = 1
    while any(s["id"] == f"s{n}" for s in p["sections"]):
        n += 1
    return f"s{n}"


def load(folder):
    p = json.loads((Path(folder) / "project.json").read_text(encoding="utf-8"))
    p.setdefault("credits", CREDITS.get(p.get("lang", "es"), CREDITS["en"])); p.setdefault("style", "collage")
    for s in p["sections"]:
        s.setdefault("seed", 7); s.setdefault("tts", "")
    return p


def save(p, folder):
    folder = Path(folder); folder.mkdir(parents=True, exist_ok=True)
    tmp = folder / "project.json.tmp"; tmp.write_text(json.dumps(p, ensure_ascii=False, indent=1), encoding="utf-8"); tmp.replace(folder / "project.json")


def audio_path(folder, s):
    return Path(folder) / "audio" / f"{s['id']}.wav"


def timed(p, folder):
    """Copy of the project with each section's duration: its voice take (or a reading-speed estimate) + gap; the last also
    holds the credits."""
    out = json.loads(json.dumps(p)); n = len(out["sections"])
    for i, s in enumerate(out["sections"]):
        a = audio_path(folder, s) if folder else None
        d = voice.duration(a) if a and a.exists() else max(2.0, len(s["text"].split()) / WORDS_PER_SEC)
        s["duration"] = round(d + p.get("gap", .45) + (p.get("tail", 2.8) if i == n - 1 else 0), 3)
    return out


def safe_name(s):
    return re.sub(r"[^\w\-]+", "-", s.strip().lower()).strip("-") or "video"


def description(p):
    es = p.get("lang", "es") == "es"
    out = [f"# {p['title']}", "", "**" + ("Texto para publicar:" if es else "Post text:") + "**", p.get("post_text", ""), ""]
    if p.get("disclosure"):
        out += [("Aviso: " if es else "Disclosure: ") + p["disclosure"], ""]
    out += ["Voz sintética clonada de mi propia voz. Animación hecha con código; ilustraciones genéricas, sin personas reales." if es
            else "Cloned synthetic voice (my own). Animation made with code; generic illustrations, no real people.", ""]
    if p.get("facts"):
        out += ["**" + ("Qué verificamos:" if es else "What we checked:") + "**", "", "| " + ("Se decía" if es else "Claim") + " | "
                + ("Lo que dicen las fuentes" if es else "What sources say") + " |", "|---|---|"] + [f"| {f['claim']} | {f['finding']} |" for f in p["facts"]] + [""]
    if p.get("sources"):
        out += ["**" + ("Fuentes:" if es else "Sources:") + "**"] + [f"- {s['title']}: {s['url']}" for s in p["sources"]] + [""]
    out += ["**" + ("Contenido sintético:" if es else "Synthetic content:") + "** " + ("sí (la voz). Marca la casilla de contenido generado con IA al publicar."
                                                                                         if es else "yes (the voice). Tick the AI-generated content label when posting.")]
    return "\n".join(out) + "\n"
