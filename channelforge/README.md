# ChannelForge

Desktop app (PySide6) that runs three automated YouTube channels end to end on top of
[OpenMontage](https://github.com/yefry08/OpenMontage),
[stickman-video-director](https://github.com/yefry08/stickman-video-director) and
[hand-drawn-canvas-animation](https://github.com/alesha-pro/tools/tree/main/skills/hand-drawn-canvas-animation).

**Status: milestone M1** — app skeleton, SQLite job queue, approval gates, and the
OmniRoute → OpenRouter model router with forced-failure tests. The channel pipelines
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

# 3. OmniRoute gateway (Node >= 22.22)
npm install -g omniroute
OMNIROUTE_SERVER_HOST=127.0.0.1 omniroute serve --no-open   # bind loopback: /v1 has no key requirement by default
```

In the OmniRoute dashboard (http://localhost:20128):

1. **Providers** → connect *Claude Code* (your subscription, OAuth — model ids `cc/…`),
   *Anthropic* (API key, `anthropic/…`) and *OpenRouter* (`openrouter/…`).
2. **API Manager** → create an inference key → `channelforge secrets set omniroute_api_key`.
3. **Settings → Access Tokens** → create a `write` token →
   `channelforge secrets set omniroute_mgmt_token`.
4. `channelforge secrets set openrouter_api_key` (used directly when OmniRoute is down).
5. `channelforge omniroute setup` creates/updates the two combos and warns about any model id
   that isn't in OmniRoute's `/v1/models` (edit them in *Settings* if so).

Then run `channelforge`. Try `channelforge --demo` first: it wires the whole app to local
mock gateways (the mock "Claude" answers once, then returns HTTP 429), so you can watch a
live model switch, resume-from-checkpoint and the approval gates without keys or spend.

## How routing works

| Caller | Path | Fallback |
|---|---|---|
| Agent stages (OpenMontage, skills) | `claude -p --output-format stream-json --verbose` subprocess in the engine dir, `ANTHROPIC_BASE_URL` = OmniRoute root, `--model channelforge-primary` | OmniRoute walks the combo (Claude subscription → Claude API → OpenRouter). If the whole combo fails (429/529, usage-limit/quota message, timeout, or OmniRoute down), the supervisor kills the agent, points it at OpenRouter directly (`https://openrouter.ai/api`, `ANTHROPIC_API_KEY=""`) and starts a fresh session that **resumes from the last OpenMontage checkpoint**. |
| Metadata, captions, critic | `httpx` → OmniRoute `/v1/chat/completions` (`channelforge-primary`, or `channelforge-cheap` for metadata) | OpenRouter `/api/v1/chat/completions` with the configured model list. |

Claude Code retries 429/529 ten times (~3 min) by itself; ChannelForge watches its
`system/api_retry` events and switches after `agent_api_retries_before_switch` (default 2).
Every attempt lands in the *Model routing* tab (target, model served, tokens, cost, failure).
Agent-stage cost is Claude Code's estimate (`cost_basis=claude_code_estimate`); direct calls
use the gateway-reported cost.

## Approvals

OpenMontage gates (`human_approval_default: true` in the pipeline manifest) show up in
*Approvals* as approve / request changes / reject. The decision is relayed to the agent,
which writes the checkpoint with `human_approved=True` (OpenMontage's `lib/checkpoint.py`
refuses otherwise). "Auto-approve creative gates" is per channel; the **publish** gate can
never be auto-approved (enforced in the DB layer).

## Tests

```bash
cd channelforge && QT_QPA_PLATFORM=offscreen pytest -q          # 38 tests
```

Includes: router failover for 429/529/usage-limit/quota/timeout/OmniRoute-down; the
acceptance test *simulated 429 mid-job → OpenRouter → job completes from its checkpoint*;
app-crash resume; auto-approve; publish-gate guard; a secret-leak scan of every file the
app writes; the real `claude` CLI against a mock gateway; and — when a local OmniRoute is
running — the real CLI and router against the real gateway.
