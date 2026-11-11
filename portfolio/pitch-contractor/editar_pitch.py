#!/usr/bin/env python3
"""Edit the Contractor AI 90-second pitch from the team's own takes (no animation): trims each take, adds a lower third with
the speaker's name and role and short on-screen text callouts, joins the takes, closes on a plain end card, levels the
audio and exports a 1920x1080 MP4 ready for YouTube.

    python3 editar_pitch.py plan.json salida.mp4

plan.json (see plan_ejemplo.json):
  segments[]: clip (path), in/out in seconds (optional: leading/trailing silence is trimmed automatically),
              lower_third {name, role} (optional), callouts[] {text, at, until, pos: top-left | top-right} (optional)
  end_card:   {title, line, seconds}
  max_seconds: hard limit (the competition allows 90)
Needs ffmpeg and Pillow."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
INK, ACCENT, NAVY, PAPER = (24, 28, 38), (102, 126, 234), (22, 28, 48), (247, 247, 245)


def font(size, bold=True):
    for name in (["LiberationSans-Bold.ttf", "DejaVuSans-Bold.ttf", "arialbd.ttf"] if bold else ["LiberationSans-Regular.ttf", "DejaVuSans.ttf", "arial.ttf"]):
        for base in ("/usr/share/fonts/truetype/liberation", "/usr/share/fonts/truetype/dejavu", "C:/Windows/Fonts", "/Library/Fonts", ""):
            p = Path(base) / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.load_default(size)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"ffmpeg failed:\n{' '.join(map(str, cmd))}\n{r.stderr[-1500:]}")
    return r


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(r.stdout.strip())


def speech_bounds(path, pad=.15):
    """First and last moment someone speaks (silencedetect at -35 dB), with a little air kept on each side."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-"],
                       capture_output=True, text=True)
    total = duration(path); starts, ends = [], []
    for line in r.stderr.splitlines():
        if "silence_start:" in line:
            starts.append(float(line.split("silence_start:")[1].split()[0]))
        elif "silence_end:" in line:
            ends.append(float(line.split("silence_end:")[1].split()[0]))
    a = ends[0] if starts and starts[0] <= .05 and ends else 0.0
    b = starts[-1] if starts and (len(ends) < len(starts) or ends[-1] >= total - .05) else total
    return max(0.0, a - pad), min(total, b + pad)


def lower_third(name, role):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    f1, f2 = font(46), font(28, False); x, y = W - 90, H - 175
    w = max(d.textlength(name, font=f1), d.textlength(role, font=f2))
    d.rectangle((x - w - 34, y - 14, x + 18, y + 104), fill=(255, 255, 255, 215))
    d.rectangle((x + 10, y - 14, x + 18, y + 104), fill=ACCENT)
    d.text((x - w - 16, y), name, font=f1, fill=ACCENT); d.text((x - w - 16, y + 60), role, font=f2, fill=INK)
    return img


def callout(text, pos):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img); f = font(52); lines = text.split("\n")
    lw = max(d.textlength(l, font=f) for l in lines); lh = 66; x = 110 if pos == "top-left" else W - 110 - lw; y = 110
    d.rectangle((x - 22, y - 16, x + lw + 22, y + lh * len(lines) + 4), fill=(255, 255, 255, 225))
    for i, l in enumerate(lines):
        d.text((x, y + i * lh), l, font=f, fill=INK)
    d.rectangle((x - 22, y + lh * len(lines) + 4, x + lw + 22, y + lh * len(lines) + 12), fill=ACCENT)
    return img


def end_card(title, line):
    img = Image.new("RGB", (W, H), NAVY); d = ImageDraw.Draw(img); f1, f2 = font(120), font(48, False)
    d.text((W / 2, H / 2 - 50), title, font=f1, fill=PAPER, anchor="mm"); d.text((W / 2, H / 2 + 80), line, font=f2, fill=(190, 200, 255), anchor="mm")
    return img


def render_segment(seg, tmp, i):
    clip = Path(seg["clip"])
    if not clip.exists():
        sys.exit(f"Missing take: {clip}")
    a, b = (seg["in"], seg["out"]) if "in" in seg and "out" in seg else speech_bounds(clip)
    dur = b - a; inputs, chains, last = ["-ss", f"{a:.3f}", "-t", f"{dur:.3f}", "-i", str(clip)], [], "v0"
    chains.append(f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},format=yuv420p[v0]")
    overlays = []
    if seg.get("lower_third"):
        lt = seg["lower_third"]; overlays.append((lower_third(lt["name"], lt["role"]), lt.get("at", .4), lt.get("until", min(dur, 5.5))))
    for c in seg.get("callouts", []):
        overlays.append((callout(c["text"], c.get("pos", "top-left")), c["at"], c.get("until", dur)))
    for k, (img, t0, t1) in enumerate(overlays):
        p = tmp / f"ov{i}_{k}.png"; img.save(p); inputs += ["-i", str(p)]
        chains.append(f"[{last}][{k + 1}:v]overlay=0:0:enable='between(t,{t0:.2f},{t1:.2f})'[v{k + 1}]"); last = f"v{k + 1}"
    chains.append(f"[0:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.08,afade=t=out:st={max(0, dur - .12):.3f}:d=0.12[a]")
    out = tmp / f"seg{i:02d}.mp4"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(chains), "-map", f"[{last}]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(out)])
    return out, dur


def render_end(card, tmp):
    p = tmp / "end.png"; end_card(card["title"], card["line"]).save(p); out = tmp / "seg99.mp4"; s = card.get("seconds", 2.5)
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", str(s), "-i", str(p), "-f", "lavfi", "-t", str(s), "-i", "anullsrc=r=48000:cl=stereo",
         "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)])
    return out, s


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    plan = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")); base = Path(sys.argv[1]).resolve().parent
    for seg in plan["segments"]:
        seg["clip"] = str((base / seg["clip"]).resolve()) if not Path(seg["clip"]).is_absolute() else seg["clip"]
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t); parts = []
        for i, seg in enumerate(plan["segments"]):
            out, dur = render_segment(seg, tmp, i); parts.append(out); print(f"  {Path(seg['clip']).name:28s} {dur:5.1f} s")
        if plan.get("end_card"):
            out, dur = render_end(plan["end_card"], tmp); parts.append(out); print(f"  {'end card':28s} {dur:5.1f} s")
        lst = tmp / "list.txt"; lst.write_text("".join(f"file '{p}'\n" for p in parts))
        joined = tmp / "joined.mp4"; run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k",
             "-ar", "48000", "-movflags", "+faststart", sys.argv[2]])
    total = duration(sys.argv[2]); limit = plan.get("max_seconds", 90)
    print(f"→ {sys.argv[2]}  {total:.1f} s" + ("" if total <= limit else f"  ⚠ OVER THE {limit} s LIMIT: cut {total - limit:.1f} s"))
    if total > limit:
        sys.exit(1)


if __name__ == "__main__":
    main()
