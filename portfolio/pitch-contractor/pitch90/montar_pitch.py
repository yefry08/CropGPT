import json, subprocess, sys, wave, contextlib
sys.path.insert(0, "/home/user/CropGPT/portfolio/pitch-contractor")
from editar_pitch import lower_third, end_card
CAM = "/root/.claude/uploads/6418ed0f-59aa-521a-8a13-46a8cd39b68c/6f7fe9db-httpswwwyoutubecomwatchvssesh788ckc.mp4"
RAW = "../rec/raw.mkv"; run = lambda c: subprocess.run(c, check=True)
def dur(f):
    with contextlib.closing(wave.open(f)) as w: return w.getnframes() / w.getframerate()
lower_third("Yefry Núñez", "Founder & developer, Contractor AI").save("lt.png")
end_card("Contractor AI", "contractor-ai-one.vercel.app").save("end.png")
ENC = ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
def cam(a, b, out, lt=True):
    fc = ("[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=30:4,eq=brightness=-0.08[bg];"
          "[0:v]scale=-2:1080:flags=lanczos,unsharp=5:5:0.6[fg];[bg][fg]overlay=(W-w)/2:0[v0]")
    inp = ["-ss", str(a), "-t", str(b - a), "-i", CAM]
    if lt:
        inp += ["-i", "lt.png"]; fc += f";[v0][1:v]overlay=0:0:enable='between(t,0.2,{min(b - a, 5.5):.2f})'[v]"
    else:
        fc += ";[v0]null[v]"
    run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", fc + ";[0:a]afade=t=in:d=0.05,afade=t=out:st=%.2f:d=0.1[a]" % (b - a - .1),
         "-map", "[v]", "-map", "[a]", *ENC, out])
def screen(k, wins, out):
    d = dur(f"nar/{k}.wav"); L = d + .4; vid = sum(b - a for a, b in wins)
    fc = "".join(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[s{i}];" for i, (a, b) in enumerate(wins))
    fc += "".join(f"[s{i}]" for i in range(len(wins))) + f"concat=n={len(wins)}:v=1:a=0,tpad=stop_mode=clone:stop_duration={max(0, L - vid):.2f},trim=0:{L:.2f},fps=30,format=yuv420p[v];"
    fc += f"[1:a]adelay=200|200,apad,atrim=0:{L:.2f},aresample=48000[a]"
    run(["ffmpeg", "-v", "error", "-y", "-i", RAW, "-i", f"nar/{k}.wav", "-filter_complex", fc, "-map", "[v]", "-map", "[a]", *ENC, out])
cam(0.0, 3.0, "p1.mp4")
screen("v1", [(80.5, 92.5)], "p2.mp4")
screen("v2", [(41.0, 46.5), (66.0, 72.5)], "p3.mp4")
screen("v3", [(98.0, 103.5), (114.5, 120.5)], "p4.mp4")
screen("v4", [(124.5, 134.0)], "p5.mp4")
cam(57.3, 84.45, "p6.mp4")
screen("v5", [(72.5, 79.7)], "p7.mp4")
run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", "2", "-i", "end.png", "-f", "lavfi", "-t", "2", "-i", "anullsrc=r=48000:cl=stereo", "-vf", "fps=30,format=yuv420p", *ENC, "-shortest", "p8.mp4"])
open("list.txt", "w").write("".join(f"file 'p{i}.mp4'\n" for i in range(1, 8)))
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "joined.mp4"])
run(["ffmpeg", "-v", "error", "-y", "-i", "joined.mp4", "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "contractor-ai-pitch-90s.mp4"])
