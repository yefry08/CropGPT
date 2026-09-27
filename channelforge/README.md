# ChannelForge

Desktop app (PySide6) that runs three automated YouTube channels end to end on top of
[OpenMontage](https://github.com/yefry08/OpenMontage),
[stickman-video-director](https://github.com/yefry08/stickman-video-director) and
[hand-drawn-canvas-animation](https://github.com/alesha-pro/tools/tree/main/skills/hand-drawn-canvas-animation).

**Status: milestone M2**: app skeleton, SQLite job queue, approval gates, the OmniRoute-only
model router (M1), and **Channel 3 end to end** (M2). A Geopolitics job:
reference ingest → OpenMontage `animated-explainer` → script-gate checks (originality + facts)
→ render → ffprobe duration gate → `long.mp4` + `sources.json`. Channels 2 and 1 arrive in
M3/M4; until then their tabs run OpenMontage's `framework-smoke` pipeline.

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

## Approvals

OpenMontage gates (`human_approval_default: true` in the pipeline manifest) show up in
*Approvals* as approve / request changes / reject. The decision is relayed to the agent,
which writes the checkpoint with `human_approved=True` (OpenMontage's `lib/checkpoint.py`
refuses otherwise). "Auto-approve creative gates" is per channel; the **publish** gate can
never be auto-approved (enforced in the DB layer).

## Tests

```bash
cd channelforge && QT_QPA_PLATFORM=offscreen pytest -q          # 77 tests
```

Includes: fallback for 429/529/usage-limit/quota/timeout/503; the acceptance test
*simulated 429 on Claude mid-job → `auto/coding` → job completes from its checkpoint*;
OmniRoute down → restarted, or paused and resumed from checkpoint with the pending approval
re-delivered; app-crash resume; auto-approve; publish-gate guard; a secret-leak scan of every
file the app writes; the real `claude` CLI against a mock gateway (including a dead one); and,
when a local OmniRoute is running, the real CLI and router against it plus a real
stop → auto-start cycle.
