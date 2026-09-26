# ChannelForge

Desktop app (PySide6) that runs three automated YouTube channels end to end on top of
[OpenMontage](https://github.com/yefry08/OpenMontage),
[stickman-video-director](https://github.com/yefry08/stickman-video-director) and
[hand-drawn-canvas-animation](https://github.com/alesha-pro/tools/tree/main/skills/hand-drawn-canvas-animation).

**Status: milestone M1** — app skeleton, SQLite job queue, approval gates, and the
OmniRoute-only model router with forced-failure tests. The channel pipelines
arrive in M2–M4 (the channel tabs currently run OpenMontage's `framework-smoke`
pipeline so the plumbing can be exercised end to end).

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

Then, in the OmniRoute dashboard (http://localhost:20128):

1. **Providers** → connect *Claude Code* (your subscription, OAuth — ids `cc/…`) and
   *Anthropic* (API key — ids `anthropic/…`), plus any other providers you want as fallback.
   Everything connected there is what OmniRoute's `auto/…` router can fall back to.
2. **Endpoints** → create an API key → `channelforge secrets set omniroute_api_key`.

And from the terminal:

3. `channelforge omniroute connect` — asks for your dashboard password once, mints a
   `write`-scoped access token (`POST /api/cli/connect`) and keeps it in the OS keyring.
4. `channelforge omniroute setup` — creates/updates the `channelforge-primary` combo and warns
   about any model id your OmniRoute doesn't list (edit ids in *Settings* if so).

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

## Approvals

OpenMontage gates (`human_approval_default: true` in the pipeline manifest) show up in
*Approvals* as approve / request changes / reject. The decision is relayed to the agent,
which writes the checkpoint with `human_approved=True` (OpenMontage's `lib/checkpoint.py`
refuses otherwise). "Auto-approve creative gates" is per channel; the **publish** gate can
never be auto-approved (enforced in the DB layer).

## Tests

```bash
cd channelforge && QT_QPA_PLATFORM=offscreen pytest -q          # 47 tests
```

Includes: fallback for 429/529/usage-limit/quota/timeout/503; the acceptance test
*simulated 429 on Claude mid-job → `auto/coding` → job completes from its checkpoint*;
OmniRoute down → restarted, or paused and resumed from checkpoint with the pending approval
re-delivered; app-crash resume; auto-approve; publish-gate guard; a secret-leak scan of every
file the app writes; the real `claude` CLI against a mock gateway (including a dead one); and,
when a local OmniRoute is running, the real CLI and router against it plus a real
stop → auto-start cycle.
