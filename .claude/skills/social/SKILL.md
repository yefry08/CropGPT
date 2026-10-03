---
name: social
description: >-
  Turn a topic, a news story or a summary of someone else's video into an original, fact-checked,
  narrated hand-drawn explainer for social media: a long 16:9 video (YouTube) and a 60-second 9:16 reel
  (Reels/TikTok/Shorts), with Gemini TTS voice, timed scenes, music, chapters, sources and captions.
  Use when the user asks for a video, reel, short or "uno largo / la versión corta / el reel" about a
  topic, company, AI incident or news event, or pastes a video summary to remake. Not for editing
  existing footage.
---

# /social: fact-checked explainer videos and reels

Everything lives in `portfolio/<slug>/`. Spanish is the default language; follow the user's language.

**Deliverables, every time:** the long 16:9 video **and** the 60 s 9:16 reel, unless the user asks for
only one. Plan the voice quota for both (long ≈ 8–9 requests + reel 5) and use the same TTS model for
both when the quota allows, so they sound alike; otherwise say which model each one used.

## 1. Verify first (mandatory)
Read [references/fact-check.md](references/fact-check.md). Search every claim, tell the user in a short table
what was confirmed, corrected or left out, and only then write. Allegations are labelled and answered;
conflicts of interest (Anthropic) are disclosed.

## 2. Start the project
```bash
bash .claude/skills/social/scripts/new_project.sh <slug> [rainbow|blue-red|ink]
```
Palettes: `rainbow` = white paper, six inks · `blue-red` = only blue and red on white · `ink` = warm paper,
dark ink, violet/red. Use what the user asked for ("fondo blanco y más colores" → rainbow).

## 3. Script → `sections.json`
- One section per scene, each `{ "id", "chapter", "text" }`. Original wording (≤10% overlap with any
  reference transcript). Long video: 500–750 words (~3.5–5 min). Reel: ~140 words, 5 sections.
- `text` holds **only the words to speak**. Never put style instructions in it: Gemini reads them aloud.
- Write numbers as words when the voice should say them naturally ("diez mil", "ochenta y ocho").
- Reel script goes in `sections-reel.json` (own ids), condensed, not a cut of the long one.

## 4. Voice (Gemini TTS)
- Key: `GEMINI_API_KEY` in the environment (ask the user to add it to the environment settings; never
  write it to a file, a commit or a log; redact it in any printed output).
- Free tier = **10 requests per day per model**; one request per section. Check what is left and pick a
  model with quota: `gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`, `gemini-3.1-flash-tts-preview`,
  `gemini-2.5-flash-preview-tts` (list them via ListModels). Use one model for a whole video.
- `narrate.py` resumes (keeps finished takes), honours Retry-After, shortens long pauses, and writes the
  measured timing:
  ```bash
  python3 narrate.py --model <m> [--tempo 1.0] [--spec sections-reel.json --audio audio-reel --timing timing-reel.js --gap 0.4 --tail 2.5]
  python3 narrate.py --reuse --tempo 1.07 …     # re-time without the API (e.g. fit a reel into 60 s)
  ```
  Natural Gemini speed is ~150–170 wpm: keep tempo 1.0 for long videos; 1.05–1.12 is fine to fit a reel.

## 5. Film
Edit `<slug>.html` (16:9) and `reel.html` (9:16) from the templates. `kit.js` gives: `txt` (with
`rainbow`, `bg`), `caption`, `drawArt` (self-drawing strokes, flat `fill`), `box/ln/circ/arrow`, `card`,
`bullet`, `vortex`, props (`robot`, `server`, `cloud`, `cylinder`, `warn`, `check`, `cross`, `bubble`),
`push` (slow camera), `fmt` (1.200 / 70.000), `quietScore`, `socialFilm(ar, [[id, fn], …])`.
- One scene per section; `D(id)` is its measured duration, so time beats as fractions of `d`.
- Keep art above the caption band (16:9: y < 880; 9:16: y < 1300). Draw credits after `resetT(c)`
  so the camera push never crops them.
- Preview before the full render: `node render.mjs <film>.html --grid 24 --out out/preview` and look at
  the contact sheet (overlaps, clipped text, empty frames). Use `--only <frame>` for full-size checks.

## 6. Build, check, deliver
```bash
bash .claude/skills/social/scripts/build.sh <slug>.html sections.json timing.js audio <slug>-es.mp4 --model <m>
bash .claude/skills/social/scripts/build.sh reel.html sections-reel.json timing-reel.js audio-reel <slug>-reel-es.mp4 --model <m> --gap 0.4 --tail 2.5
python3 .claude/skills/social/scripts/chapters.py sections.json timing.js
```
`build.sh` mixes voice over the score (−16 LUFS), verifies with ffprobe and a full decode. Grab a few
frames with ffmpeg and look at them. Write `descripcion.md`: title, description, chapters, "datos a…",
disclosures, sources (links), tags, synthetic-content flag, and a short caption with hashtags.
Commit the sources (never audio, MP4s or keys; `new_project.sh` adds them to `.gitignore`), push, and send
the MP4 with SendUserFile from inside the repo.

## Report to the user
Length/format, what the verification changed, voice model used, anything not verified (e.g. sources only
seen via search snippets), the caption, and a reminder to tick the AI-content label and listen before posting.
