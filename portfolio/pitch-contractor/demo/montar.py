import json, re, subprocess, wave, contextlib
W = {"n1": (1.0, 11.3), "n2": (41.0, 49.4), "n3": (49.4, 61.9), "n4": (61.9, 79.7), "n5": (79.7, 97.5), "n6": (97.5, 110.0), "n7": (110.0, 124.5), "n8": (124.5, 136.1)}
nar = json.load(open("narracion.json")); run = lambda c: subprocess.run(c, check=True)
def dur(f):
    with contextlib.closing(wave.open(f)) as w: return w.getnframes() / w.getframerate()
parts, srt, t, n = [], [], 0.0, 1
fmt = lambda s: f"{int(s//3600):02d}:{int(s%3600//60):02d}:{int(s%60):02d},{int(s*1000%1000):03d}"
for k, (a, b) in W.items():
    d = dur(f"nar/{k}.wav"); L = max(b - a, d + .5); pad = max(0, L - (b - a))
    out = f"seg_{k}.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-t", str(b - a), "-i", "raw.mkv", "-i", f"nar/{k}.wav",
         "-filter_complex", f"[0:v]tpad=stop_mode=clone:stop_duration={pad:.2f},fps=30,format=yuv420p[v];[1:a]adelay=200|200,apad,atrim=0:{L:.3f},aresample=48000[aa]",
         "-map", "[v]", "-map", "[aa]", "-t", f"{L:.3f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-ac", "2", out])
    sents = [s for s in re.split(r"(?<=[.!?])\s+", nar[k]) if s]; tot = sum(len(s) for s in sents); c = t + .2
    for s in sents:
        ln = d * len(s) / tot
        for chunk in re.split(r"(?<=[,:;])\s+", s) if len(s) > 90 else [s]:
            cl = ln * len(chunk) / len(s); srt.append(f"{n}\n{fmt(c)} --> {fmt(c + cl)}\n{chunk}\n"); n += 1; c += cl
    parts.append(out); t += L
open("list.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
open("subs.en.srt", "w").write("\n".join(srt))
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "joined.mp4"])
run(["ffmpeg", "-v", "error", "-y", "-i", "joined.mp4", "-vf", "subtitles=subs.en.srt:force_style='FontName=DejaVu Sans,FontSize=15,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,BorderStyle=4,Outline=0,Shadow=0,MarginV=22'",
     "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "contractor-ai-mvp-walkthrough.mp4"])
print("total", round(t, 1))
