"""videomaker: research a topic with Claude (web search + fetch), fact-check it and return the reel script and scene plan as
structured JSON (schema below). Credentials come from the environment (ANTHROPIC_API_KEY or an `ant auth login` profile);
nothing is written to disk here."""
import json

import anthropic

MODEL = "claude-opus-5-5"

PROPS = ["robot", "cog", "db", "key", "laptop", "car", "watch", "calendar", "box", "card", "counter", "chart_down", "chart_up", "doc",
         "coin", "lever", "chip", "phone", "tag", "safe", "ship", "plane", "bubble", "folder", "trefoil", "book", "lens", "form", "badge",
         "passport", "funnel", "plug", "humanoid", "furnace", "airbag", "battery", "ingot", "fridge", "thermo", "ctrl", "bin", "flame",
         "gorilla", "person", "cage", "eye", "shield", "crown", "equal", "hand"]
BACKGROUNDS = ["rays_red", "rays_blue", "rays_teal", "kraft", "navy", "teal", "sky", "cream", "green"]


def _obj(props, required=None):
    return {"type": "object", "properties": props, "required": required or list(props), "additionalProperties": False}


ITEM = _obj({
    "kind": {"type": "string", "enum": ["tape", "tiles", "stamp", "serif", "prop"]},
    "text": {"type": "string", "description": "Text for tape/tiles/stamp/serif; empty for prop. Tape and stamp in CAPITALS, max ~22 chars."},
    "prop": {"type": "string", "enum": PROPS + ["none"], "description": "Drawing for kind=prop, else 'none'."},
    "x": {"type": "integer", "description": "Horizontal offset from centre, -350..350."},
    "y": {"type": "integer", "description": "Vertical position, 180..1350 (captions live below 1400)."},
    "style": {"type": "string", "enum": ["black", "red", "white", "yellow"]},
    "size": {"type": "integer", "description": "Font size 40..140, or prop scale in percent 40..160."},
})
SCHEMA = _obj({
    "title": {"type": "string"},
    "facts": {"type": "array", "items": _obj({
        "claim": {"type": "string", "description": "What the user's input said."},
        "finding": {"type": "string", "description": "What reliable sources say; mark corrections clearly."}})},
    "sources": {"type": "array", "items": _obj({"title": {"type": "string"}, "url": {"type": "string"}})},
    "disclosure": {"type": "string", "description": "On-screen conflict-of-interest notice, or empty string."},
    "post_text": {"type": "string", "description": "Caption to publish, with 4-6 hashtags."},
    "sections": {"type": "array", "items": _obj({
        "id": {"type": "string", "description": "Short slug, e.g. s1-hook."},
        "chapter": {"type": "string"},
        "text": {"type": "string", "description": "Narration, exactly as captioned."},
        "tts": {"type": "string", "description": "Same narration spelled for the voice engine (numbers and foreign names written as spoken)."},
        "background": {"type": "string", "enum": BACKGROUNDS},
        "beats": {"type": "array", "items": _obj({"items": {"type": "array", "items": ITEM}})},
    })},
})

SYSTEM = """You write short, accurate, original explainer reels (9:16, paper-collage style) for a creator's social accounts.

Work in this order:
1. Research the topic with web search and fetch. Check every claim in the user's input against reliable sources, and note what
   you correct, what you could not verify (leave it out of the narration) and what context is missing.
2. Write the narration in the requested language: 5 to 7 sections, 150 to 200 words in total, a hook first and a closing
   question last. Plain spoken sentences, no stage directions. Spell out "inteligencia artificial" in Spanish narration
   (the voice engine mispronounces "IA").
3. Plan the visuals. For each section give 1 to 4 beats; each beat holds 2 to 4 items placed so they do not overlap: a prop
   (y around 650..800, size 70..130), a tape headline (y 250..400 or 1000..1250), optional tiles for numbers or dates and an
   optional stamp. Keep everything between y 180 and 1350.

Rules:
- Real people and organisations appear only as names in text: never as a drawn likeness, logo or brand mark.
- If the story involves Anthropic or Claude, fill "disclosure" with a one-sentence notice that Anthropic makes Claude, the AI
  used to make this video. Otherwise leave it empty.
- Attribute uncertain figures ("según la prensa") and never invent numbers, quotes or dates.
- "sources" lists the pages you actually used."""


def plan(topic: str, lang: str = "es", log=print) -> dict:
    """Research `topic` and return the script dict (see SCHEMA). Raises anthropic errors to the caller."""
    client = anthropic.Anthropic()
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": 8},
             {"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 6}]
    language = {"es": "Spanish", "en": "English"}.get(lang, lang)
    messages = [{"role": "user", "content": f"Narration language: {language}.\n\nTopic, summary or link to remake:\n{topic}"}]
    for _ in range(6):   # resume server-side tool loops that pause
        # fallbacks="default": if a safety classifier declines, the API retries on a suitable fallback model in the same call
        with client.beta.messages.stream(model=MODEL, max_tokens=64000, system=SYSTEM, messages=messages, tools=tools,
                                         thinking={"type": "adaptive"}, betas=["server-side-fallback-2026-07-01"], fallbacks="default",
                                         output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}}) as stream:
            response = stream.get_final_message()
        log(f"Claude: stop_reason={response.stop_reason}, {response.usage.output_tokens} output tokens")
        if response.stop_reason == "pause_turn":
            messages = messages[:1] + [{"role": "assistant", "content": response.content}]
            continue
        if response.stop_reason == "refusal":
            raise RuntimeError("Claude declined this topic.")
        if response.stop_reason == "max_tokens":
            raise RuntimeError("The script was cut off (max_tokens).")
        text = [b.text for b in response.content if b.type == "text"][-1]   # the JSON answer comes after any search commentary
        return json.loads(text)
    raise RuntimeError("Research did not finish after several continuations.")
