"""Per-channel production recipes: which engine/pipeline runs a job and with what brief.

M1 ships the plumbing; the channel briefs are filled in at M2 (geopolitics),
M3 (AI news) and M4 (Contractor AI).
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from pathlib import Path

from ..agent.checkpoints import manifest_stages
from ..agent.supervisor import EngineJob
from ..config import AppConfig


@dataclass
class ChannelRecipe:
    channel: str
    pipeline: str                     # OpenMontage pipeline manifest name
    final_stage: str | None = None    # stop here; later stages (e.g. publish) belong to ChannelForge
    script_checks: bool = False       # originality + fact layer at the script gate
    long_video: bool = False          # ffprobe duration gate after compose

    def pipeline_for(self, job: dict) -> str:
        return self.pipeline

    # Non-OpenMontage engines override these three.
    def manifest_path(self, cfg: AppConfig, job: dict) -> Path:
        return cfg.openmontage_dir / "pipeline_defs" / f"{self.pipeline_for(job)}.yaml"

    def workspace(self, cfg: AppConfig) -> tuple[Path, Path]:
        """(cwd for the agent, folder that holds projects/<id>)."""
        return cfg.openmontage_dir, cfg.openmontage_dir / "projects"

    def add_dirs(self, cfg: AppConfig) -> tuple[Path, ...]:
        return ()

    def script_stage(self, job: dict) -> str:
        """Stage whose gate carries the script (originality + fact checks, re-plan target)."""
        return "script"

    def brief(self, job: dict) -> str:
        raise NotImplementedError(f"channel '{self.channel}' is implemented in a later milestone")


class SmokeRecipe(ChannelRecipe):
    """OpenMontage's own framework-smoke pipeline (research -> script, both gated).

    Used by the M1 demo and tests to exercise routing, gates and resume
    without spending on media generation.
    """

    def brief(self, job: dict) -> str:
        return (f"Run the OpenMontage 'framework-smoke' pipeline for project '{job['project_id']}'. "
                "Initialise the project with lib.checkpoint.init_project, then produce a schema-valid "
                "research_brief and script about the topic below, honouring each stage's approval gate.\n\n"
                f"Topic / notes:\n{job['input_text']}")


LANG_NAMES = {"es": "Spanish", "en": "English", "pt": "Portuguese"}

SOURCES_SCHEMA = """{"claims": [{"id": "c1", "section_id": "<script section id>", "text": "<the claim as narrated>",
  "kind": "fact|statistic|allegation",
  "legal_status": "accused|charged|under_investigation|convicted|acquitted|sanctioned  (allegations only)",
  "sources": [{"url": "https://...", "title": "...", "publisher": "...",
               "type": "dataset|official|court_ruling|official_audit|news|academic|other"}]}]}"""


def reference_block(job: dict) -> str:
    out = Path(job.get("output_dir") or "")
    info = out / "reference" / "input.json"
    if not info.exists():
        return "No reference video: work from the topic/notes."
    data = json.loads(info.read_text(encoding="utf-8"))
    refs = data.get("references", [])
    if not refs:
        return "No reference video: work from the topic/notes."
    lines = ["REFERENCE VIDEO(S) — for analysis only:"]
    for n, r in enumerate(refs, 1):
        tpath = out / "reference" / f"ref{n:02d}" / "transcript.txt"
        lines.append(f"- {r.get('title') or r['url']} ({r['url']}); transcript: {tpath if tpath.exists() else 'unavailable'}"
                     + (f"; note: {r['error']}" if r.get("error") else ""))
    lines.append("Read skills/meta/video-reference-analyst.md and extract ONLY hook style, pacing, structure and "
                 "tone. Produce an ORIGINAL script with a new angle. Never reuse the reference's footage, audio, "
                 "thumbnail or script text. ChannelForge rejects the script if more than 10% of its 5-word "
                 "sequences also appear in the reference transcript.")
    return "\n".join(lines)


class GeopoliticsRecipe(ChannelRecipe):
    """Channel 3 — geopolitics, sports x politics and data: long 16:9 data explainer."""

    def pipeline_for(self, job: dict) -> str:
        if job["render_backend"] == "documentary-montage":
            raise ValueError("documentary-montage cannot run Channel 3: it has no script stage for the mandatory "
                             "fact layer and uses real footage of real people; use animated-explainer")
        return self.pipeline

    def brief(self, job: dict) -> str:
        pid, lang = job["project_id"], LANG_NAMES.get(job["language"], job["language"])
        return f"""Produce a long-form data-driven geopolitics explainer with the OpenMontage '{self.pipeline_for(job)}'
pipeline. Project id: '{pid}' (init with lib.checkpoint.init_project, title from the concept, style playbook
'{job["visual_style"]}'). Follow AGENT_GUIDE.md, the pipeline manifest and every stage director skill.

CHANNEL: Geopolitics, sports x politics, and data. Style: data-driven explainer — animated maps, animated
charts, stat reveals and timelines. Prefer Remotion for these (log both runtimes in decision_log as the guide
requires). Narration and on-screen text language: {lang}.

HARD DELIVERY CONSTRAINTS
- Long video: 16:9, 1920x1080, final duration 480–600 seconds (target ~540 s). Plan ~1,200–1,500 narration
  words at ~150 wpm. ChannelForge measures the render with ffprobe and sends it back if it is outside the
  range. Never pad with silence, freeze frames or slowed audio to hit the duration.
- Background music must cover the whole duration (request tracks at least as long as the video, or
  crossfade several); record each track's licence in the asset manifest.
- Stop after the 'compose' stage. Do NOT run the publish stage — ChannelForge owns publishing. The
  render_report must list the 1920x1080 MP4 (under projects/{pid}/renders/) in outputs[0].
- Budget cap for this video: ${job["budget_cap_usd"]:.2f} for all paid tools. Estimate before paid calls; if the
  estimate exceeds the cap, stop at the proposal gate and say so.

DATA AND FACTS (mandatory)
- Every number must come from a citable dataset or official source: World Bank, IMF, SIPRI, UN agencies, OECD,
  national statistics offices, official sports federations, election authorities, court or audit records.
  Name the dataset and year on screen when a figure appears.
- At the script stage, also write projects/{pid}/artifacts/sources.json mapping EVERY factual claim in the
  narration to at least one source URL, in exactly this shape:
  {SOURCES_SCHEMA}
- Allegations of wrongdoing against named people or entities: only when backed by a court ruling, an official
  audit, or 2+ reputable outlets; narrate with the accurate legal status (accused / under investigation /
  convicted). A second model fact-checks the script against sources.json before the gate.
- Never depict a real person photorealistically: maps, flags, charts, icons, silhouettes or illustration only.
  Do not generate images of real people.

{reference_block(job)}

TOPIC / NOTES FROM THE HUMAN:
{job["input_text"]}
"""


CF_PIPELINES = Path(__file__).resolve().parents[1] / "pipelines"
CF_TOOLS = Path(__file__).resolve().parents[1] / "engine_support"


class AiNewsRecipe(ChannelRecipe):
    """Channel 2 — AI & AI-safety news, hand-drawn canvas animation, research window 7 days."""

    def manifest_path(self, cfg: AppConfig, job: dict) -> Path:
        return CF_PIPELINES / "hand-drawn-news.yaml"

    def skill_dir(self, cfg: AppConfig) -> Path:
        return cfg.engines_dir / "tools" / "skills" / "hand-drawn-canvas-animation"

    def workspace(self, cfg: AppConfig) -> tuple[Path, Path]:
        root = cfg.output_root.parent / "projects"
        return root, root

    def add_dirs(self, cfg: AppConfig) -> tuple[Path, ...]:
        return (self.skill_dir(cfg),)

    def brief(self, job: dict) -> str:
        pid, lang, proj = job["project_id"], LANG_NAMES.get(job["language"], job["language"]), job["project_dir"]
        created = time.strftime("%Y-%m-%d", time.gmtime(job["created_at"]))
        start = time.strftime("%Y-%m-%d", time.gmtime(job["created_at"] - 7 * 86400))
        skill = "{SKILL}"
        return f"""Produce this week's AI & AI Safety News episode for ChannelForge. Project '{pid}', project folder
{proj} (already initialised). Write every file inside it. Record progress with the checkpoint tool:
  python {proj}/tools/cf_checkpoint.py {proj} <stage> <in_progress|awaiting_human|completed> --artifact name=relative/path
Stages, in order: research → script (human gate) → [narration: ChannelForge] → film (human gate) →
[compose: ChannelForge]. After you finish a stage whose next stage belongs to ChannelForge, end your turn.
At a gated stage write awaiting_human and end your turn; when ChannelForge relays APPROVED, re-run the tool
with `completed --approved` and the same artifacts.

Narration and on-screen text language: {lang}. Visual style: '{job["visual_style"]}'.

1) RESEARCH (window {start} .. {created} only; nothing older)
- Primary sources first: AI lab and company blogs, arXiv, government and regulator sites; then reputable
  outlets. Use web search/fetch; open every source; record its real publication date.
- Write artifacts/research.json: {{"stories": [{{"id": "st1", "headline": "...", "why_it_matters": "...",
  "sources": [{{"url": "https://...", "publisher": "...", "published_at": "YYYY-MM-DD",
  "type": "lab_blog|company_blog|arxiv|government|regulator|official|news|other"}}],
  "no_primary_reason": "only if no primary source exists"}}]}}. List the primary source first in each story.
  5–8 stories; ChannelForge rejects any source dated outside the window.
- Checkpoint: research completed --artifact research=artifacts/research.json

2) SCRIPT (gate)
- Long episode: 8–10 minutes. Write ~1,250–1,450 words at ~150 wpm, one section per story plus intro and
  outro, in OpenMontage's script shape: artifacts/script.json {{"version": "1.0", "title": "...",
  "total_duration_seconds": N, "sections": [{{"id": "intro", "text": "...", "start_seconds": 0,
  "end_seconds": 30}}, ...]}}. Plain spoken text only (no stage directions inside "text").
- Also write artifacts/sources.json mapping EVERY factual claim to a source URL:
  {SOURCES_SCHEMA}
- Accurate, non-sensational safety framing; say when something is a claim by a company, a preprint not yet
  peer-reviewed, or a proposal rather than law.
- Checkpoint: script awaiting_human --artifact script=artifacts/script.json. ChannelForge then checks
  freshness, originality and facts, and a second model critiques the script before a human sees it.

3) FILM (gate) — after ChannelForge writes artifacts/narration.json
- Read {skill}/SKILL.md fully and follow its workflow and quality gates. Create the film in
  {proj}/film/ and copy core.js, studio.js, cels.js, materials.js, render.mjs and package.json from
  {skill}/assets and {skill}/scripts as SKILL.md step 2 describes.
- 16:9, defineFilm format {{ ar: '16:9', width: 1920 }}, 24 fps. The timeline must total exactly film_s
  from narration.json, with scene cuts at the section start times listed there (the voice-over is laid
  over your film afterwards; do not add your own narration audio). Include a quiet score (defineFilm
  score) that runs to the end, including the final end_card_s-second closing card.
- Show the key source on screen (publisher + date) when a story starts. Illustrate ideas, labs, papers and
  policies with drawn metaphors, diagrams and hand lettering. Never draw real people recognisably or
  photorealistically, and no company logos.
- Closing card: episode title and "Made with AI tools · Sources in the description".
- Run the skill's --grid preview yourself and fix what you see, then:
  film awaiting_human --artifact film=film/<name>.html

TOPIC / NOTES FROM THE HUMAN (optional focus):
{job["input_text"]}
""".replace("{SKILL}", str(job.get("skill_dir", "")))


STYLE_TEXT = {
    "1B": "Style 1 (Classic Minimalist), DARK theme: flat pitch-black canvas, pure white line art, at most three "
          "saturated accent colours named in ordinary words",
    "2A": "Style 2A (Modern Beanie Zeke, Studio Tech): the red-beanie/yellow-shirt stick figure in a bright white "
          "studio with a subtle light-gray floor grid and cyan/blue glass UI",
}
OMNI_BACKENDS = {"omni_flash": "Gemini Omni Flash", "omni_flash_fal": "Gemini Omni Flash (fal.ai)", "veo": "Veo 3.1"}


class ContractorRecipe(ChannelRecipe):
    """Channel 1 — Contractor AI: democracy, politics, public procurement and corruption, as stickman videos."""

    def pipeline_for(self, job: dict) -> str:
        return "stickman-omni" if job["render_backend"] in OMNI_BACKENDS else "character-animation"

    def manifest_path(self, cfg: AppConfig, job: dict) -> Path:
        if self.pipeline_for(job) == "stickman-omni":
            return CF_PIPELINES / "stickman-omni.yaml"
        return cfg.openmontage_dir / "pipeline_defs" / "character-animation.yaml"

    def workspace(self, cfg: AppConfig) -> tuple[Path, Path]:      # set per job in build_engine_job
        return cfg.openmontage_dir, cfg.openmontage_dir / "projects"

    def workspace_for(self, cfg: AppConfig, job: dict) -> tuple[Path, Path]:
        if self.pipeline_for(job) == "stickman-omni":
            root = cfg.output_root.parent / "projects"
            return root, root
        return self.workspace(cfg)

    def add_dirs(self, cfg: AppConfig) -> tuple[Path, ...]:
        return (cfg.engines_dir / "stickman-video-director" / "skills" / "directing-stickman-videos",)

    def script_stage(self, job: dict) -> str:
        return "direction" if self.pipeline_for(job) == "stickman-omni" else "script"

    def _common(self, job: dict) -> str:
        lang = LANG_NAMES.get(job["language"], job["language"])
        cta = job.get("cta_title") or "Contractor AI"
        return f"""CHANNEL: Contractor AI. Topics: democracy, politics, public procurement and corruption around the world.
Contractor AI is a multilingual AI system that detects anomalies in public procurement. Every video ends with a
Contractor AI call to action: the LAST narration section must be a one- or two-sentence CTA that names
{cta} and what it does ({job.get("cta_line") or "detects anomalies in public procurement"}); keep it factual (no
claims about Contractor AI that the human did not provide).

DIRECTION: read {job["skill_dir"]}/SKILL.md, references/storyboard-template.md and references/style-catalog.md and
follow them. The skill's setup gate is answered here: aspect ratio 16:9; visual style {STYLE_TEXT.get(job["visual_style"], job["visual_style"])};
duration: a LONG video of 8–10 minutes — plan 540 seconds (54 ten-second clips), scaling the 5-stage arc
(Golden Hook → Disrupting Assumptions → Insider Secrets → Ultimate Truth → Elevation & Discussion).
VOICE-OVER LANGUAGE: {lang} (this overrides the skill's English default), ~20–25 words per 10 seconds,
about 1,150–1,350 words in total.

FACTS AND SAFETY (mandatory, political content)
- Every factual claim in the narration goes in sources.json with a source URL:
  {SOURCES_SCHEMA}
- Allegations of corruption or wrongdoing against named people or entities only when backed by a court ruling,
  an official audit, or 2+ reputable outlets; narrate the accurate legal status (accused / under
  investigation / charged / convicted / acquitted). Prefer procurement records, audit-office reports, court
  records and open-contracting data (e.g. OCDS portals) as sources.
- Never depict a real person photorealistically: stick figures only, no likeness, no names written on screen.
- A second model fact-checks the script against sources.json before the human gate.

TOPIC / NOTES / REFERENCE FROM THE HUMAN:
{job["input_text"]}
"""

    def brief(self, job: dict) -> str:
        pid, proj = job["project_id"], job["project_dir"]
        if self.pipeline_for(job) != "stickman-omni":
            return f"""Produce a Contractor AI stickman video with the OpenMontage 'character-animation' pipeline (local SVG rig +
GSAP + HyperFrames). Project id: '{pid}' (init with lib.checkpoint.init_project). Follow AGENT_GUIDE.md, the
manifest and every stage director skill. Use the stickman-video-director skill below for the narrative and
the character: your proposal stage IS the skill's Phase A director proposal (5-stage arc, storyboard, VO),
and the character_design stage builds the skill's stick figure for the chosen style.
Delivery: 16:9 1920x1080, 480–600 s, stop after 'compose' (ChannelForge owns publishing); render_report
outputs[0] = the MP4. Write projects/{pid}/artifacts/sources.json at the script stage. Budget cap
${job["budget_cap_usd"]:.2f}.

{self._common(job)}"""
        backend = OMNI_BACKENDS[job["render_backend"]]
        return f"""Produce a Contractor AI stickman video whose clips will be generated with {backend}. Project '{pid}', project
folder {proj} (already initialised). Write every file inside it and record progress with:
  python {proj}/tools/cf_checkpoint.py {proj} <stage> <in_progress|awaiting_human|completed> --artifact name=relative/path
Stages: direction (human gate) → [narration: ChannelForge] → prompts (human gate, with cost estimate) →
[clips + compose: ChannelForge]. End your turn after each gated stage; when ChannelForge relays APPROVED,
re-run the tool with `completed --approved` and the same artifacts.

1) DIRECTION = the skill's Phase A. Write artifacts/proposal.md (the full director's proposal in the human's
language), artifacts/script.json in OpenMontage's script shape — {{"version": "1.0", "title": "...",
"total_duration_seconds": 540, "sections": [{{"id": "c01", "text": "<VO for this ~10 s clip>",
"start_seconds": 0, "end_seconds": 10}}, ...]}}, one section per storyboard clip, spoken text only — and
artifacts/sources.json. Then: direction awaiting_human --artifact proposal=artifacts/proposal.md
--artifact script=artifacts/script.json

2) PROMPTS = the skill's Phase B, only after direction is approved AND ChannelForge has written
artifacts/narration.json (the synthesised voice-over with real section timings; film_s includes a
{int(6)} s CTA ending). Read references/omni-flash-prompt-contract.md. Write one standalone prompt per ~10 s of
film_s (N = ceil(film_s / 10)) plus 3 spare continuation prompts that extend the final scene, as
artifacts/clips.json: {{"clips": [{{"id": "c01", "prompt": "...", "vo_start": 0.0, "vo_end": 9.6,
"slot_s": 10}}, ...]}}. Every prompt must carry all the contract's locks, state "16:9", include the three
timed beats [0–3s] [3–7s] [7–10s], "no speech bubbles", and the style locks — with ONE change to the
contract's audio section: write "Audio: synchronized sound effects only; no narration, no speech, no music"
(ChannelForge lays one continuous voice-over and BGM over the stitched clips, as the skill's audio note
recommends). No visible words anywhere; the final clips stage the Contractor AI CTA visually and
ChannelForge overlays the CTA text. Also write the stitching guide to artifacts/phase_b.md. Then:
prompts awaiting_human --artifact clips=artifacts/clips.json
ChannelForge validates the locks and shows the cost estimate; anything above the ${job["budget_cap_usd"]:.2f} cap is
blocked. Do not call any video-generation tool yourself.

{self._common(job)}"""


RECIPES: dict[str, ChannelRecipe] = {
    "geopolitics": GeopoliticsRecipe("geopolitics", "animated-explainer", final_stage="compose",
                                     script_checks=True, long_video=True),
    "ai_news": AiNewsRecipe("ai_news", "hand-drawn-news", script_checks=True, long_video=True),
    "contractor_ai": ContractorRecipe("contractor_ai", "stickman-omni", final_stage="compose", script_checks=True,
                                      long_video=True),
}


# The framework-smoke pipeline on every channel: used by the demo and the M1 plumbing tests.
SMOKE_RECIPES: dict[str, ChannelRecipe] = {c: SmokeRecipe(c, "framework-smoke") for c in RECIPES}


def slugify(text: str, max_len: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (s[:max_len].rstrip("-") or "job")


def project_id_for(job: dict) -> str:
    return job.get("project_id") or f"cf{job['id']}-{job['channel'].replace('_', '-')}-{slugify(job['input_text'], 24)}"


def cta_fields(cfg: AppConfig, job: dict) -> dict:
    ch = cfg.channels.get(job["channel"])
    if not ch or not ch.cta_title:
        return {}
    return {"cta_title": ch.cta_title, "cta_line": ch.cta_line.get(job["language"], ""), "cta_url": ch.cta_url}


def build_engine_job(cfg: AppConfig, job: dict, recipes: dict[str, ChannelRecipe] = RECIPES) -> EngineJob:
    recipe = recipes[job["channel"]]
    pipeline = recipe.pipeline_for(job)
    cwd, root = recipe.workspace_for(cfg, job) if hasattr(recipe, "workspace_for") else recipe.workspace(cfg)
    job = {**job, "project_id": project_id_for(job)}
    specs = manifest_stages(recipe.manifest_path(cfg, job))
    stages = [s["name"] for s in specs]
    if recipe.final_stage and recipe.final_stage in stages:
        stages = stages[:stages.index(recipe.final_stage) + 1]
    project_dir = root / job["project_id"]
    return EngineJob(
        job_id=job["id"], engine_dir=cwd if cwd != root else project_dir, project_id=job["project_id"],
        project_dir=project_dir, pipeline=pipeline, stages=stages,
        initial_prompt=recipe.brief({**job, "project_dir": str(project_dir),
                                     "skill_dir": str(recipe.add_dirs(cfg)[0]) if recipe.add_dirs(cfg) else "",
                                     **cta_fields(cfg, job)}),
        budget_cap_usd=job["budget_cap_usd"],
        language=job["language"], directive=job.get("directive"),
        app_stages=frozenset(s["name"] for s in specs if s["owner"] == "app"), add_dirs=recipe.add_dirs(cfg))


def job_output_dir(cfg: AppConfig, job: dict) -> Path:
    d = cfg.output_root / f"{job['id']:05d}-{job['channel']}-{time.strftime('%Y%m%d', time.localtime(job['created_at']))}"
    d.mkdir(parents=True, exist_ok=True)
    return d
