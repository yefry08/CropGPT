# videomaker

From a topic to a fact-checked vertical reel, narrated with your cloned voice and animated in paper-collage style.

    python3 server.py            # http://127.0.0.1:8790  (landing page at /, app at /app)

1. **Research** (`research.py`): Claude (`claude-opus-5-5`, web search + fetch) checks every claim, writes the narration
   (5–7 sections) and plans the scenes as structured JSON: backgrounds, tapes, tiles, stamps and props from the drawing library.
2. **Review**: the app shows the script, the fact table and the sources; you edit the narration and the on-screen notice.
3. **Narrate**: `../edicion/tts_voicebox.py` with your Voicebox profile (the server starts Voicebox if it is down).
4. **Render**: `engine/film.html` draws the spec; the social skill's `build.sh` times the film to the voice, renders and mixes.
5. **Deliver**: `jobs/<id>/video.mp4` and `descripcion.md` (post text, disclosure, fact table, sources).

Requirements: an Anthropic API key in `ANTHROPIC_API_KEY` (or an `ant auth login` profile) for step 1, Voicebox with the
cloned-voice profile for step 3, Node with `puppeteer-core` (shared from `../ia-warhammer/node_modules`) and ffmpeg.
Without a key, pick the **neveras** sample in the app: it skips research and reuses that reel's recorded narration.

The server binds to 127.0.0.1 only: it runs local scripts and spends API credit. Jobs live in `jobs/` (gitignored).
