# ChannelForge

Desktop app (PySide6) that runs three automated YouTube channels end to end on top of
[OpenMontage](https://github.com/yefry08/OpenMontage),
[stickman-video-director](https://github.com/yefry08/stickman-video-director) and
[hand-drawn-canvas-animation](https://github.com/alesha-pro/tools/tree/main/skills/hand-drawn-canvas-animation).

**Status: milestone M4**: app skeleton, job queue, approval gates and the OmniRoute-only
router (M1); **Channel 3** on OpenMontage (M2); **Channel 2** on the hand-drawn-canvas-animation
skill (M3); **Channel 1** on the stickman-video-director skill with both render backends (M4).
Shorts, metadata and thumbnails arrive in M5; publishing in M6.

## Setup

```bash
# 1. engines (not committed)
mkdir -p engines && cd engines
git clone https://github.com/yefry08/OpenMontage
git clone https://github.com/yefry08/stickman-video-director
git clone https://github.com/alesha-pro/tools
pip install -r OpenMontage/requirements.txt
cd ..

# 2. app
cd channelforge && pip install -e ".[dev]"

# 3. OmniRoute — the only model gateway (Node >= 22.22)
npm install -g omniroute
omniroute setup                     # guided: dashboard password + first provider
```

Bind OmniRoute to loopback: by default `/v1` listens on 0.0.0.0 with no API-key
requirement. Put `OMNIROUTE_SERVER_HOST=127.0.0.1` in `~/.omniroute/.env`
(ChannelForge starts it with `omniroute serve --no-open --no-tray --daemon` when it is down).

Then, in the OmniRoute dashboard:

1. **Providers** (http://localhost:20128/dashboard/providers): connect what you want to use.
   Paid Claude: *Claude Code* (subscription, OAuth, model prefix `cc/`) and/or *Anthropic*
   (API key, `anthropic/`). Free: *Kiro AI* (Claude via Kiro, prefix `kr/`), *OpenCode Free*
   (`oc/`, no auth). OmniRoute's `auto/…` router falls back across everything connected here.
2. **API Keys** (http://localhost:20128/dashboard/api-manager) → **Create API Key** → name it
   `channelforge` → **Copy API Key** → `channelforge secrets set omniroute_api_key` (paste; input
   is hidden). The *Endpoints* page only lists or reveals keys that already exist.

And from the terminal:

3. `channelforge omniroute connect`: asks for your dashboard password once, mints a
   `write`-scoped access token (`POST /api/cli/connect`) and keeps it in the OS keyring.
4. `channelforge omniroute verify`: OmniRoute's quick start check (`GET /v1/models` with your
   key), plus which providers are connected and which Claude models the combo will use.
5. `channelforge omniroute setup`: builds the `channelforge-primary` combo from the Claude
   models of providers you **actually connected**. This comes from `GET /api/providers`, because
   `/v1/models` lists OmniRoute's whole catalog, 300+ models from providers you never connected.
   Your configured ids go first (subscription, then API key), then up to 4 other connected
   Claude models such as Kiro's. With no Claude connected, the combo is left out and every call
   goes straight to `auto/…`; re-run `setup` after connecting one and it is put back.

Then run `channelforge`. Try `channelforge --demo` first: it wires the whole app to a local
mock OmniRoute whose Claude combo answers once and then returns HTTP 429, so you can watch
a live model switch, resume-from-checkpoint and the approval gates without keys or spend.

## How routing works

All model traffic goes through the local OmniRoute gateway. Each kind of call has an ordered
list of OmniRoute model ids (editable in *Settings*):

| Caller | Targets (in order) |
|---|---|
| Agent stages (OpenMontage, skills): `claude -p --output-format stream-json --verbose` in the engine dir, `ANTHROPIC_BASE_URL` = OmniRoute root | `channelforge-primary` → `auto/coding` |
| Script / general generation (Python → `/v1/chat/completions`) | `channelforge-primary` → `auto/coding` |
| Fact-check critic | `auto/reasoning` → `channelforge-primary` |
| Metadata only (titles, captions, hashtags) | `auto/cheap` → `channelforge-primary` |

`channelforge-primary` is an OmniRoute combo: Claude subscription (`cc/…`) first, then the
Claude API key (`anthropic/…`); OmniRoute fails over between them itself. `auto/<variant>`
is OmniRoute's zero-config router over every connected provider. It has to be its own
target: inside a combo OmniRoute skips `auto/*` steps (verified: 503 `ALL_TARGETS_SKIPPED`).

ChannelForge moves to the next target on HTTP 429/529, usage/session-limit or quota
messages, timeouts, and 502/503 (the route can't serve). For agent stages it kills Claude
Code, switches the model, and starts a fresh session that **resumes from the last
OpenMontage checkpoint**. Claude Code retries 429/529 ten times (~3 min) on its own;
ChannelForge watches its `system/api_retry` events and switches after
`agent_api_retries_before_switch` (default 2).

**If OmniRoute itself is down** (connection refused; Claude Code reports this as status-less
retries and `ECONNREFUSED`), ChannelForge restarts it. If it can't, the job is *paused*,
nothing is lost, and it resumes from its checkpoint (same model, pending approvals
re-delivered) once OmniRoute answers again.

Every attempt lands in the *Model routing* tab (target, model served, tokens, cost, failure).
Agent-stage cost is Claude Code's estimate (`cost_basis=claude_code_estimate`); Python calls
use OmniRoute's `X-OmniRoute-Response-Cost`.

## Channel 3 (M2): what a job does

1. **Input**: paste a topic/notes block, one reference URL, or several. References are read
   for analysis only: `yt-dlp --dump-single-json --skip-download` for metadata, platform
   subtitles (`--write-subs`, then `--write-auto-subs`), and `faster-whisper` on a temporary
   audio download only when there are no subtitles (the audio is deleted afterwards). Files
   land in `<job>/reference/`.
2. **Production**: Claude Code drives OpenMontage's `animated-explainer` pipeline with a brief
   that fixes the delivery: 16:9 1920×1080, 480–600 s (≈1,200–1,500 words at 150 wpm),
   Remotion for maps/charts/stat reveals/timelines, citable datasets only, no photorealistic
   real people, music covering the full length, a budget cap, and stop after `compose`
   (publishing belongs to ChannelForge). `documentary-montage` is not offered for this
   channel: it has no script stage for the mandatory fact layer and cuts real footage of real
   people.
3. **Script gate**: before you see the script, ChannelForge checks it:
   - **originality**: share of the script's 5-word sequences that also occur in the reference
     transcript; over 10% fails;
   - **facts**: `artifacts/sources.json` must map every claim to a source URL; allegations
     against named parties need a court ruling, an official audit or 2+ reputable outlets,
     plus an accurate legal status; then a second model (`critic_models`, by default
     `auto/reasoning`) flags unsupported or overstated statements.

   A failure goes back to the agent automatically (up to 3 times) with the exact problems;
   after that the gate shows you the report. The Approvals panel always shows these checks.
4. **Duration gate**: after `compose`, `ffprobe` measures the render. It must be 480–600 s at
   1920×1080 with no trailing silence (`silencedetect`). Otherwise ChannelForge archives the
   checkpoints from `script` onwards (`history/channelforge-replan-N/`, nothing deleted) and
   re-opens the job with a word target, e.g. "~1,350 words", so the scenes are re-planned
   and re-rendered. It never pads. Up to 3 re-plans.
5. **Outputs** in the job folder: `long.mp4`, `sources.json`, `reports/script_gate.json`,
   `reports/duration.json`, `reference/`.

### What the engine needs on your machine for a real Channel 3 render

```bash
cd engines/OpenMontage/remotion-composer && npm install   # Remotion (maps, charts)
pip install piper-tts                                      # free local voice, or use a TTS key below
```

Provider keys for OpenMontage tools (TTS, music, images) stay in the keyring and are injected
into the agent process only, never written to a `.env`:

```bash
channelforge secrets set engine_env:GOOGLE_TTS_API_KEY     # or OPENAI_API_KEY, ELEVENLABS_API_KEY, …
channelforge secrets set engine_env:PIXABAY_API_KEY        # royalty-free music search
```

The list of variables passed through is `engine_env_vars` in `config.json`.

## Channel 2 (M3): AI & AI Safety News, hand-drawn

This channel is not an OpenMontage pipeline, so ChannelForge ships its own manifest
(`channelforge/pipelines/hand-drawn-news.yaml`) using OpenMontage's checkpoint format. The
agent records progress with `tools/cf_checkpoint.py`, which enforces the same gate rule
(a gated stage can't be `completed` without an approval).

| Stage | Who | What |
|---|---|---|
| research | agent | stories from the last 7 days only, primary sources first (lab/company blogs, arXiv, government, regulators) → `artifacts/research.json` |
| script (gate) | agent | ~1,300 words + `sources.json`; ChannelForge checks research freshness (dates in the window, arXiv ids by YYMM, primary source listed first), originality and facts before you see it |
| narration | ChannelForge | TTS per section through OpenMontage's `tts_selector`, joined with short pauses; if voice + 3 s end card isn't 480–600 s, the script goes back with a word target, **before** any drawing or rendering |
| film (gate) | agent | follows the skill's SKILL.md: a 16:9 24 fps film whose scenes cut at the narration's section times, with a quiet score; ChannelForge renders the skill's `--grid` preview for the gate |
| compose | ChannelForge | the skill's `render.mjs` at 1920 wide, then voice + score mixed with ffmpeg → ffprobe duration gate → `long.mp4`, `sources.json` |

Projects live in `~/.channelforge/projects/<id>/`. The agent gets read access to the skill folder
(`--add-dir`). Rendering needs Chrome and Node; as root on Linux ChannelForge wraps Chrome with
`--no-sandbox`. A 9-minute film is ~13,000 frames: expect roughly 10–15 minutes of render time.

## Channel 1 (M4): Contractor AI, stickman

Direction always follows the stickman-video-director skill: its Phase A director proposal
(5-stage arc: hook → disrupt assumptions → insider secrets → truth → discussion) is a human
gate. Its setup gate is answered from the channel tab: 16:9, style **1B** (Style 1, dark canvas)
or **2A** (Studio Tech), 8–10 minutes, voice-over in the channel language instead of the skill's
English default. The last narration section is always the Contractor AI call to action, and
the fact layer applies with the allegation rules (court ruling / official audit / 2+ outlets,
accurate legal status). Stick figures only, never a real likeness.

**Backend (a): Gemini Omni Flash / Veo** (ChannelForge pipeline `stickman-omni.yaml`)

| Stage | Who | What |
|---|---|---|
| direction (gate) | agent | Phase A: `proposal.md`, `script.json` (one section per ~10 s clip), `sources.json` |
| narration | ChannelForge | one continuous voice-over (TTS); length must fit 8–10 min including a 6 s CTA ending |
| prompts (gate) | agent | Phase B: one standalone prompt per ~10 s + 3 spares, all contract locks; clip audio = SFX only |
| clips | ChannelForge | OpenMontage's `gemini_omni_video` / `veo_video` / `gemini_omni_fal` tool, clip by clip |
| compose | ChannelForge | conform to 1920×1080 24 fps, stitch, voice + BGM + ducked SFX, CTA text overlay |

- **Cost**: at the prompts gate ChannelForge checks the Phase B contract (timed beats, style
  locks, no colour codes, "16:9", no speech bubbles, SFX-only audio), then estimates cost with the
  provider tool's own `estimate_cost`. If spent + estimate exceeds the job's cap the job is
  **blocked**: no approval is offered until you raise that job's cap (Jobs → Budget…, then Retry)
  or switch to the free backend. During generation the cap is checked before every clip with the
  real charges, so it holds even if a provider charges more than estimated. Every clip lands in
  the Model routing ledger as `media` spend.
- **Typical cost**: Omni Flash ≈ $0.10/s, so a 9-minute video ≈ 54–55 clips ≈ **$55**; Veo on Google
  ≈ $0.40/s (8 s clips) ≈ **$220**. The channel's default cap is $60.
- **Clip lengths vary** (Omni Flash chooses 3–10 s): each clip is retimed into its 10 s slot when
  within 0.85–1.18×; otherwise it keeps its length and the next clips follow. Spares cover a shortfall.
- **Resume**: each clip has a sidecar with its prompt's hash. A retry after a failure, or an
  extension with continuation prompts, reuses clips made from identical prompts and never pays twice.
- **Keys**: `channelforge secrets set engine_env:GEMINI_API_KEY` (Omni Flash / Veo on Google) or
  `engine_env:FAL_KEY` (fal.ai).

**Backend (b): character animation (free, local).** OpenMontage's `character-animation` pipeline
(SVG rig + GSAP + HyperFrames), driven by the same skill: its proposal stage is the Phase A
proposal and its character design is the skill's stick figure. Same script-gate checks, the
ffprobe duration gate and stop-after-compose as Channel 3. Needs HyperFrames (Node ≥ 22):
check `python -c "from tools.tool_registry import registry; registry.discover(); print(registry.provider_menu_summary()['composition_runtimes'])"` in `engines/OpenMontage`.

The CTA text per language and the CTA URL (used in the description at M5) are
`cta_title`, `cta_line` and `cta_url` of the channel in `config.json`.

## Approvals

OpenMontage gates (`human_approval_default: true` in the pipeline manifest) show up in
*Approvals* as approve / request changes / reject. The decision is relayed to the agent,
which writes the checkpoint with `human_approved=True` (OpenMontage's `lib/checkpoint.py`
refuses otherwise). "Auto-approve creative gates" is per channel; the **publish** gate can
never be auto-approved (enforced in the DB layer).

## Tests

```bash
cd channelforge && QT_QPA_PLATFORM=offscreen pytest -q          # 94 tests (pytest -m 'not slow' for the fast 82)
```

Includes: fallback for 429/529/usage-limit/quota/timeout/503; the acceptance test
*simulated 429 on Claude mid-job → `auto/coding` → job completes from its checkpoint*;
OmniRoute down → restarted, or paused and resumed from checkpoint with the pending approval
re-delivered; app-crash resume; auto-approve; publish-gate guard; a secret-leak scan of every
file the app writes; the real `claude` CLI against a mock gateway (including a dead one); and,
when a local OmniRoute is running, the real CLI and router against it plus a real
stop → auto-start cycle.
