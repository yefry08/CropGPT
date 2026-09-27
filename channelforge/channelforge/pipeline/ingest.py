"""Job input: a reference URL, several reference URLs, or a topic/notes block.

References are fetched for ANALYSIS ONLY: metadata (yt-dlp --dump-single-json) and a
transcript — platform subtitles first (yt-dlp --write-subs/--write-auto-subs), faster-whisper
on a temporary audio download as fallback. The reference's footage, audio, thumbnail and
script text never enter our output; the transcript is used for style analysis and for the
n-gram originality check, then the temporary audio is deleted.
"""

from __future__ import annotations

import json
import logging
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

log = logging.getLogger(__name__)
URL_RE = re.compile(r"https?://\S+")


@dataclass
class Reference:
    url: str
    title: str = ""
    channel: str = ""
    duration_s: float | None = None
    description: str = ""
    transcript: str = ""
    transcript_source: str = ""        # subtitles | auto_subtitles | whisper | none
    error: str = ""


@dataclass
class JobInput:
    kind: str                           # reference | references | topic
    notes: str                          # the non-URL text the user pasted
    references: list[Reference] = field(default_factory=list)

    @property
    def reference_transcript(self) -> str:
        return "\n".join(r.transcript for r in self.references if r.transcript)


def classify(text: str) -> tuple[str, list[str], str]:
    urls = list(dict.fromkeys(u.rstrip(").,;") for u in URL_RE.findall(text)))
    notes = URL_RE.sub("", text).strip()
    kind = "topic" if not urls else ("reference" if len(urls) == 1 else "references")
    return kind, urls, notes


# ---- subtitles --------------------------------------------------------------
_TS = re.compile(r"^\d{1,2}:\d{2}(:\d{2})?[.,]\d{3}\s+-->")
_TAG = re.compile(r"<[^>]+>")


def vtt_to_text(vtt: str) -> str:
    """Plain text from WebVTT/SRT, dropping cue timing, markup and the rolling duplicates
    YouTube auto-captions produce (each cue repeats the previous line)."""
    out: list[str] = []
    for raw in vtt.splitlines():
        line = raw.strip()
        if (not line or line == "WEBVTT" or line.isdigit() or _TS.match(line)
                or line.startswith(("Kind:", "Language:", "NOTE", "STYLE", "Region:"))):
            continue
        line = _TAG.sub("", line).strip()
        if line and (not out or out[-1] != line):
            out.append(line)
    return " ".join(out)


Runner = Callable[[list[str], Path], subprocess.CompletedProcess]


def _run(cmd: list[str], cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=600)


def fetch_reference(url: str, workdir: Path, *, run: Runner = _run, langs: str = "es.*,en.*,pt.*",
                    whisper: Callable[[Path], str] | None = None) -> Reference:
    ref = Reference(url=url)
    workdir.mkdir(parents=True, exist_ok=True)
    meta = run(["yt-dlp", "--no-playlist", "--dump-single-json", "--skip-download", url], workdir)
    if meta.returncode != 0:
        ref.error = f"metadata: {meta.stderr.strip()[-300:]}"
        return ref
    info = json.loads(meta.stdout)
    (workdir / "info.json").write_text(json.dumps(info, indent=1, ensure_ascii=False), encoding="utf-8")
    ref.title, ref.channel = info.get("title", ""), info.get("channel") or info.get("uploader", "")
    ref.duration_s, ref.description = info.get("duration"), (info.get("description") or "")[:2000]

    for flag, source in (("--write-subs", "subtitles"), ("--write-auto-subs", "auto_subtitles")):
        run(["yt-dlp", "--no-playlist", "--skip-download", flag, "--sub-langs", langs, "--sub-format", "vtt",
             "-o", "ref.%(ext)s", url], workdir)
        subs = sorted(workdir.glob("ref*.vtt"))
        if subs:
            ref.transcript, ref.transcript_source = vtt_to_text(subs[0].read_text(encoding="utf-8")), source
            break
    if not ref.transcript:
        tmp = Path(tempfile.mkdtemp(prefix="cf-audio-"))
        try:
            got = run(["yt-dlp", "--no-playlist", "-f", "bestaudio", "-x", "--audio-format", "m4a",
                       "-o", str(tmp / "audio.%(ext)s"), url], tmp)
            audio = next(tmp.glob("audio.*"), None)
            if got.returncode == 0 and audio:
                ref.transcript, ref.transcript_source = (whisper or whisper_transcribe)(audio), "whisper"
            else:
                ref.transcript_source, ref.error = "none", f"audio: {got.stderr.strip()[-300:]}"
        finally:
            shutil.rmtree(tmp, ignore_errors=True)      # the reference's audio is never kept
    (workdir / "transcript.txt").write_text(ref.transcript, encoding="utf-8")
    return ref


def whisper_transcribe(audio: Path, model_size: str = "small") -> str:
    from faster_whisper import WhisperModel      # heavy import, only when subtitles are missing
    model = WhisperModel(model_size, device="auto", compute_type="int8")
    segments, _info = model.transcribe(str(audio), vad_filter=True)
    return " ".join(s.text.strip() for s in segments)


def ingest(text: str, job_dir: Path, **kw) -> JobInput:
    kind, urls, notes = classify(text)
    job = JobInput(kind=kind, notes=notes)
    for n, url in enumerate(urls, 1):
        try:
            job.references.append(fetch_reference(url, job_dir / "reference" / f"ref{n:02d}", **kw))
        except Exception as e:                    # one bad link must not sink the job
            log.warning("reference %s failed: %s", url, e)
            job.references.append(Reference(url=url, error=f"{type(e).__name__}: {e}"))
    (job_dir / "reference").mkdir(parents=True, exist_ok=True)
    (job_dir / "reference" / "input.json").write_text(json.dumps({
        "kind": job.kind, "notes": job.notes,
        "references": [{k: v for k, v in r.__dict__.items() if k != "transcript"} for r in job.references],
    }, indent=1, ensure_ascii=False), encoding="utf-8")
    return job
