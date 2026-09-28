"""Application configuration (non-secret). Secrets live in the keyring — see secrets.py."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

ChannelId = Literal["contractor_ai", "ai_news", "geopolitics"]
Language = Literal["es", "en", "pt"]


def app_home() -> Path:
    home = Path(os.environ.get("CHANNELFORGE_HOME", Path.home() / ".channelforge"))
    home.mkdir(parents=True, exist_ok=True)
    return home


class RouterConfig(BaseModel):
    """All model traffic goes through the local OmniRoute gateway; every fallback lives there."""
    omniroute_url: str = "http://localhost:20128"   # root; /v1 is appended per call
    # Start OmniRoute (`omniroute serve --no-open --no-tray --daemon`) when it is found down.
    omniroute_autostart: bool = True
    omniroute_bin: str = "omniroute"
    omniroute_start_timeout_s: float = 90.0
    # Claude combo created by `channelforge omniroute setup`: subscription first, then API key.
    primary_combo: str = "channelforge-primary"
    primary_combo_models: list[str] = Field(default_factory=lambda: [
        "cc/claude-opus-5-5",             # Claude subscription (OmniRoute "Claude Code" OAuth provider)
        "anthropic/claude-opus-5-5",      # Claude API key
    ])
    # Ordered routing targets (OmniRoute model ids). `auto/<variant>` is OmniRoute's zero-config
    # router over every connected provider; it must be its own target — inside a combo OmniRoute
    # skips it (verified on 3.8.50: 503 ALL_TARGETS_SKIPPED).
    agent_models: list[str] = Field(default_factory=lambda: ["channelforge-primary", "auto/coding"])
    general_models: list[str] = Field(default_factory=lambda: ["channelforge-primary", "auto/coding"])
    critic_models: list[str] = Field(default_factory=lambda: ["auto/reasoning", "channelforge-primary"])
    metadata_models: list[str] = Field(default_factory=lambda: ["auto/cheap", "channelforge-primary"])
    request_timeout_s: float = 120.0
    # Claude Code retries 429/529 ten times (~3 min) by itself; switch target after this many.
    agent_api_retries_before_switch: int = 2
    agent_idle_timeout_s: float = 900.0
    # When OmniRoute stays down, paused jobs are retried after this delay (resume from checkpoint).
    gateway_down_retry_s: float = 60.0


class YouTubeProject(BaseModel):
    # Uploads from unverified API projects (created after 2020-07-28) are locked private until audited.
    audited: bool = False
    daily_units: int = 10_000
    # Recent public reports: videos.insert ~100 units (was ~1,600) with a separate 100 uploads/day bucket.
    # Edit if your Cloud console shows otherwise; a real quotaExceeded from YouTube always wins.
    daily_uploads: int = 100
    costs: dict[str, int] = Field(default_factory=lambda: {"videos.insert": 100, "thumbnails.set": 50})


class PublishConfig(BaseModel):
    youtube_projects: dict[str, YouTubeProject] = Field(default_factory=lambda: {"default": YouTubeProject()})
    tiktok_audited: bool = False            # unaudited TikTok clients can only post privately (SELF_ONLY)
    instagram_graph_version: str = "v25.0"
    instagram_mode: str = "resumable"       # or "video_url" with the S3-compatible temporary host below
    instagram_s3: dict[str, str] = Field(default_factory=dict)   # bucket, endpoint_url, region_name (keys in keyring)
    min_lead_minutes: int = 60              # never schedule sooner than this after the publish click
    max_attempts: int = 6
    backoff_base_s: int = 60                # 1, 2, 4, 8, 16, 32 minutes


class ChannelSettings(BaseModel):
    id: ChannelId
    display_name: str
    language: Language = "es"
    visual_style: str
    visual_styles: list[str]
    render_backend: str
    render_backends: list[str]
    budget_cap_usd: float = 5.0
    auto_approve_creative_gates: bool = False
    # Channel 1 brand call to action (overlaid on the last seconds; the URL goes in the description)
    cta_title: str = ""
    cta_line: dict[str, str] = Field(default_factory=dict)
    cta_url: str = ""
    # Use weekday names: APScheduler 3 numbers weekdays from mon=0, unlike standard cron.
    posting_schedule_cron: str = "0 15 * * tue,fri"   # local time
    platforms: list[str] = Field(default_factory=lambda: ["youtube", "tiktok", "instagram"])
    youtube_project: str = "default"                    # which Google Cloud project's quota/client this channel uses
    shorts_spacing_hours: float = 24.0                  # short k goes live k × this after the long video


def default_channels() -> dict[str, ChannelSettings]:
    return {
        "contractor_ai": ChannelSettings(
            id="contractor_ai", display_name="Contractor AI (stickman)",
            visual_style="1B", visual_styles=["1B", "2A"],
            render_backend="omni_flash", render_backends=["omni_flash", "veo", "character_animation"],
            # Omni Flash is ~$0.10/s (OpenMontage estimate_cost): a 9-minute video is ~54 clips ≈ $54.
            budget_cap_usd=60.0,
            cta_title="Contractor AI",
            cta_line={"es": "IA multilingüe que detecta anomalías en la contratación pública",
                      "en": "Multilingual AI that detects anomalies in public procurement",
                      "pt": "IA multilíngue que detecta anomalias em compras públicas"}),
        "ai_news": ChannelSettings(
            id="ai_news", display_name="AI & AI Safety News",
            # the skill's looks (references/style.md); "doodle" is left out: it draws on photos, which
            # would need per-image licences for a news channel
            visual_style="ink", visual_styles=["ink", "pencil", "riso", "screen"],
            render_backend="hand_drawn_canvas", render_backends=["hand_drawn_canvas"],
            budget_cap_usd=3.0),
        "geopolitics": ChannelSettings(
            id="geopolitics", display_name="Geopolitics · Sports × Politics · Data",
            visual_style="clean-professional",
            visual_styles=["clean-professional", "premium-minimalist", "minimalist-diagram"],
            # documentary-montage is not offered: it has no script stage (so the mandatory fact layer
            # cannot run), does not accept reference input, and cuts real archival footage that can
            # show real people photorealistically.
            render_backend="animated-explainer", render_backends=["animated-explainer"],
            budget_cap_usd=5.0),
    }


class AppConfig(BaseModel):
    engines_dir: Path = Field(default_factory=lambda: Path(os.environ.get(
        "CHANNELFORGE_ENGINES", Path(__file__).resolve().parents[2] / "engines")))
    output_root: Path = Field(default_factory=lambda: app_home() / "jobs")
    claude_bin: str = "claude"
    engine_python: str = Field(default_factory=lambda: "python" if os.name == "nt" else "python3")
    # bypassPermissions is refused when running as root; acceptEdits + an explicit allowlist
    # lets the headless agent work without prompts while keeping the tool surface explicit.
    claude_permission_mode: str = "acceptEdits"
    claude_allowed_tools: list[str] = Field(default_factory=lambda: [
        "Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Skill"])
    # Provider env vars OpenMontage tools read (see its registry install_instructions). Values live in the
    # keyring as engine_env:<VAR> (`channelforge secrets set engine_env:GOOGLE_TTS_API_KEY`).
    engine_env_vars: list[str] = Field(default_factory=lambda: [
        "GOOGLE_TTS_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY", "ELEVENLABS_API_KEY",
        "FAL_KEY", "AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION", "PIXABAY_API_KEY", "PEXELS_API_KEY",
        "FREESOUND_API_KEY"])
    router: RouterConfig = Field(default_factory=RouterConfig)
    publish: PublishConfig = Field(default_factory=PublishConfig)
    channels: dict[str, ChannelSettings] = Field(default_factory=default_channels)

    @property
    def openmontage_dir(self) -> Path:
        return self.engines_dir / "OpenMontage"

    @classmethod
    def path(cls) -> Path:
        return app_home() / "config.json"

    @classmethod
    def load(cls) -> "AppConfig":
        p = cls.path()
        if p.exists():
            cfg = cls.model_validate_json(p.read_text(encoding="utf-8"))
            if cfg._upgrade_channels():
                cfg.save()
            return cfg
        cfg = cls()
        cfg.save()
        return cfg

    def _upgrade_channels(self) -> bool:
        """Bring a config saved by an older version up to date without touching the user's choices:
        add new channels, new backend/style options and brand fields; drop options that no longer exist."""
        changed = False
        for cid, d in default_channels().items():
            ch = self.channels.get(cid)
            if ch is None:
                self.channels[cid] = d
                changed = True
                continue
            for attr in ("render_backends", "visual_styles"):
                if getattr(ch, attr) != getattr(d, attr):
                    setattr(ch, attr, list(getattr(d, attr)))
                    changed = True
            if ch.render_backend not in ch.render_backends:
                ch.render_backend, changed = d.render_backend, True
            if ch.visual_style not in ch.visual_styles:
                ch.visual_style, changed = d.visual_style, True
            if not ch.cta_title and d.cta_title:
                ch.cta_title, ch.cta_line, changed = d.cta_title, dict(d.cta_line), True
        return changed

    def save(self) -> None:
        self.path().write_text(json.dumps(self.model_dump(mode="json"), indent=2), encoding="utf-8")
