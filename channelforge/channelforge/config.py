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
    omniroute_url: str = "http://localhost:20128"   # root; /v1 is appended per call
    openrouter_url: str = "https://openrouter.ai/api"
    # OmniRoute combos created by `channelforge omniroute setup`.
    primary_combo: str = "channelforge-primary"
    cheap_combo: str = "channelforge-cheap"
    # Steps inside the primary combo, in priority order (OmniRoute <provider>/<model> ids).
    primary_combo_models: list[str] = Field(default_factory=lambda: [
        "cc/claude-opus-5-5",             # Claude subscription via OmniRoute's Claude Code OAuth provider
        "anthropic/claude-opus-5-5",      # Claude API key
        "openrouter/anthropic/claude-opus-5.5",
        "openrouter/google/gemini-3-pro",
    ])
    cheap_combo_models: list[str] = Field(default_factory=lambda: [
        "openrouter/anthropic/claude-haiku-4.5",
        "openrouter/google/gemini-3-flash",
    ])
    # Direct-to-OpenRouter models used when OmniRoute itself is down.
    openrouter_models: list[str] = Field(default_factory=lambda: [
        "anthropic/claude-opus-5.5",
        "google/gemini-3-pro",
    ])
    openrouter_cheap_models: list[str] = Field(default_factory=lambda: [
        "anthropic/claude-haiku-4.5",
    ])
    request_timeout_s: float = 120.0
    # Claude Code retries 429/529 ten times (~3 min) by itself; switch target after this many.
    agent_api_retries_before_switch: int = 2
    agent_idle_timeout_s: float = 900.0


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
    # Use weekday names: APScheduler 3 numbers weekdays from mon=0, unlike standard cron.
    posting_schedule_cron: str = "0 15 * * tue,fri"   # local time


def default_channels() -> dict[str, ChannelSettings]:
    return {
        "contractor_ai": ChannelSettings(
            id="contractor_ai", display_name="Contractor AI (stickman)",
            visual_style="1B", visual_styles=["1B", "2A"],
            render_backend="omni_flash", render_backends=["omni_flash", "character_animation"],
            budget_cap_usd=15.0),
        "ai_news": ChannelSettings(
            id="ai_news", display_name="AI & AI Safety News",
            visual_style="sketchbook", visual_styles=["sketchbook", "ink-on-paper", "paper3d", "sand"],
            render_backend="hand_drawn_canvas", render_backends=["hand_drawn_canvas"],
            budget_cap_usd=3.0),
        "geopolitics": ChannelSettings(
            id="geopolitics", display_name="Geopolitics · Sports × Politics · Data",
            visual_style="clean-professional",
            visual_styles=["clean-professional", "premium-minimalist", "minimalist-diagram"],
            render_backend="animated-explainer", render_backends=["animated-explainer", "documentary-montage"],
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
    router: RouterConfig = Field(default_factory=RouterConfig)
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
            return cls.model_validate_json(p.read_text(encoding="utf-8"))
        cfg = cls()
        cfg.save()
        return cfg

    def save(self) -> None:
        self.path().write_text(json.dumps(self.model_dump(mode="json"), indent=2), encoding="utf-8")
