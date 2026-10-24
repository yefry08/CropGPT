"""Turns a project (sections -> beats -> items) into frames: paper backgrounds, pop-in cut-outs, label tapes, flip tiles, stamps,
torn-paper captions, a whip-pan between scenes and the closing credits. Deterministic code, no generative models."""
import math
import subprocess
from pathlib import Path

import cairo

from . import draw as D
from . import explainer as EXS
from .draw import CX, PA, TAU, W, H, Sprite, clamp, ease_out, pop, rgb, rng, sprite
from .props import PROPS

FPS = 24
BACKGROUNDS = ["rays_red", "rays_blue", "rays_teal", "kraft", "navy", "teal", "sky", "cream", "green"]
DARK = {"navy", "teal", "green"}
KINDS = ["tape", "tiles", "stamp", "serif", "prop"]
VISUAL_STYLES = {"collage": "Collage de papel", "explainer": "Explicativo (tipo Vox)"}
STYLES = ["black", "red", "white", "yellow"]
TAPE = {"black": (PA["ink"], "#f4eee2"), "red": (PA["red"], "#fff6ea"), "white": ("#f4eee2", PA["ink"]), "yellow": (PA["yellow"], PA["ink"])}


class Film:
    """Caches backgrounds and sprites for one project; frame(t) returns a cairo ImageSurface (W x H)."""

    def __init__(self, project):
        self.p = project
        self.style = project.get("style", "collage")
        self.bg, self.sp = {}, {}
        self.starts, t = [], 0.0
        for s in project["sections"]:
            self.starts.append(t); t += s["duration"]
        self.total = t

    # ---------- backgrounds ----------
    def background(self, kind):
        if self.style == "explainer":
            if ("ex", kind) not in self.bg:
                self.bg[("ex", kind)] = EXS.background(kind)
            return self.bg[("ex", kind)]
        if kind not in self.bg:
            s = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); c = cairo.Context(s)
            if kind.startswith("rays_"):
                c1, c2 = PA["cream"], {"rays_red": PA["red"], "rays_blue": PA["sky"], "rays_teal": PA["teal"]}[kind]
                rgb(c, c1); c.paint(); rgb(c, c2); cx, cy, n = CX, 760, 18
                for i in range(n):
                    a0 = i / n * TAU; a1 = a0 + TAU / n / 2
                    c.move_to(cx, cy); c.line_to(cx + math.cos(a0) * 3000, cy + math.sin(a0) * 3000); c.line_to(cx + math.cos(a1) * 3000, cy + math.sin(a1) * 3000); c.fill()
                self._grain(c, 3); self._vignette(c, cx, cy, 200, H, .35)
            else:
                rgb(c, {"kraft": PA["kraft"], "navy": PA["navy"], "teal": PA["teal"], "sky": PA["sky"], "cream": PA["cream"], "green": PA["green"]}.get(kind, PA["cream"]))
                c.paint(); self._grain(c, 7); self._fibres(c, 14); self._vignette(c, CX, H / 2, H * .3, H * .8, .28)
            self.bg[kind] = s
        return self.bg[kind]

    @staticmethod
    def _grain(c, seed):
        r = rng(seed)
        for color, n in (("rgba(0,0,0,.05)", 5000), ("rgba(255,255,255,.05)", 3000)):
            rgb(c, color)
            for _ in range(n):
                c.rectangle(r() * W, r() * H, 2, 2)
            c.fill()

    @staticmethod
    def _fibres(c, seed):
        r = rng(seed); rgb(c, "rgba(60,40,20,.10)"); c.set_line_width(1.2)
        for _ in range(120):
            x, y, a, l = r() * W, r() * H, r() * TAU, 8 + r() * 26
            c.move_to(x, y); c.line_to(x + math.cos(a) * l, y + math.sin(a) * l)
        c.stroke()

    @staticmethod
    def _vignette(c, cx, cy, r0, r1, a):
        g = cairo.RadialGradient(cx, cy, r0, cx, cy, r1); g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 30 / 255, 12 / 255, 0, a)
        c.set_source(g); c.paint()

    # ---------- sprites ----------
    def _cached(self, key, make):
        if key not in self.sp:
            self.sp[key] = make()
        return self.sp[key]

    def prop_sprite(self, name, scale):
        def make():
            fn = PROPS[name]; k = scale

            def art(c):
                c.scale(k, k); D.SIL = 0; fn(c)

            def sil(c):
                c.scale(k, k); D.SIL = 16; fn(c); D.SIL = 0

            def both(c):
                c.save(); sil(c); c.restore(); c.save(); art(c); c.restore()
            return sprite(both, 360 * k + 30, 330 * k + 30, shadow=(8, 12, 22, .45), silhouette=sil)
        return self._cached(("prop", name, round(scale, 2)), make)

    def tape_sprite(self, s, size, style):
        def make():
            bg, fg = TAPE.get(style, TAPE["black"]); probe = cairo.Context(cairo.ImageSurface(cairo.FORMAT_A8, 1, 1)); D.font(probe, size)
            w, h = D.text_w(probe, s) * .78 + size * .6, size * 1.18; r = rng(len(s))
            pts = [(-w / 2 + w * i / 10, -h / 2 + (r() - .5) * 5) for i in range(11)] + [(w / 2 + (r() - .5) * 8, -h / 2 + h * i / 6) for i in range(7)] \
                + [(-w / 2 + w * i / 10, h / 2 + (r() - .5) * 5) for i in range(10, -1, -1)]

            def strip_(c):
                c.move_to(*pts[0])
                for p in pts[1:]:
                    c.line_to(*p)
                c.close_path(); rgb(c, bg); c.fill()

            def draw(c):
                c.rotate(-.02); strip_(c); c.save(); c.scale(.78, 1); D.font(c, size); D.text(c, s, 0, size * .05, fg); c.restore()
            return sprite(draw, w / 2 + 10, h / 2 + 10, shadow=(0, 6, 14, .4), silhouette=lambda c: (c.rotate(-.02), strip_(c)))
        return self._cached(("tape", s, size, style), make)

    def tile_sprite(self, ch, size, bg):
        def make():
            w = size * .8

            def draw(c):
                rgb(c, bg); c.rectangle(-w / 2, -size * .62, w, size * 1.24); c.fill()
                rgb(c, "rgba(0,0,0,.25)"); c.rectangle(-w / 2, -1, w, 2); c.fill(); D.font(c, size, D.SERIF); D.text(c, ch, 0, size * .06, PA["ink"])
            return sprite(draw, w / 2 + 4, size * .62 + 4, shadow=(0, 6, 10, .4),
                          silhouette=lambda c: (rgb(c, bg), c.rectangle(-w / 2, -size * .62, w, size * 1.24), c.fill()))
        return self._cached(("tile", ch, size, bg), make)

    def strip_sprite(self, lines, size=46):
        def make():
            probe = cairo.Context(cairo.ImageSurface(cairo.FORMAT_A8, 1, 1)); D.font(probe, size, D.SERIF)
            w = max(D.text_w(probe, l) for l in lines) + 80; h = len(lines) * size * 1.25 + 40; r = rng(len("".join(lines)))
            top = [(-w / 2 + w * i / 24, -h / 2 + (r() - .5) * 8) for i in range(25)]; bot = [(-w / 2 + w * i / 24, h / 2 + (r() - .5) * 8) for i in range(24, -1, -1)]

            def paper(c):
                c.move_to(*top[0])
                for p in top[1:] + bot:
                    c.line_to(*p)
                c.close_path(); rgb(c, PA["paper"]); c.fill()

            def draw(c):
                paper(c); D.font(c, size, D.SERIF)
                for i, l in enumerate(lines):
                    D.text(c, l, 0, -h / 2 + 20 + size * .62 + i * size * 1.25, PA["ink"])
            return sprite(draw, w / 2 + 6, h / 2 + 6, shadow=(0, 6, 12, .35), silhouette=paper)
        return self._cached(("strip", tuple(lines), size), make)

    # ---------- items ----------
    def item(self, c, it, t, dark):
        if t <= 0:
            return
        x, y, kind, size = CX + it.get("x", 0), it.get("y", 760), it["kind"], it.get("size") or 0
        if self.style == "explainer":
            return self.item_explainer(c, it, t, dark, x, y, kind, size)
        if kind == "tape" and it.get("text"):
            k = pop(t / .35); self.tape_sprite(it["text"], size or 84, it.get("style", "black")).paint(c, x, y, k)
        elif kind == "tiles" and it.get("text"):
            sz = size or 110; s = it["text"]; n = len(s); w = sz * .8; gap = 12; x0 = x - (n * w + (n - 1) * gap) / 2
            bg = PA["yellow"] if it.get("style") == "yellow" else PA["paper"]; tt = t / .7
            for i, ch in enumerate(s):
                ti = clamp((tt - i * .12) * 2.5)
                if ti <= 0:
                    continue
                sq = abs(math.cos((1 - ti) * math.pi / 2 * 3)) if ti < 1 else 1
                if ch.strip():
                    self.tile_sprite(ch, sz, bg).paint(c, x0 + i * (w + gap) + w / 2, y, 1, sy=sq)
        elif kind == "stamp" and it.get("text"):
            sz = size or 100; tt = t / .3; k = 1 + 1.2 * (1 - ease_out(clamp(tt))) if tt < 1 else 1
            c.save(); c.translate(x, y); c.rotate(-.12); c.scale(k, k); D.font(c, sz); w = D.text_w(c, it["text"]) * .8 + sz * .5
            a = clamp(tt * 4) * .92; c.set_source_rgba(*D.col(PA["redD"])[:3], a); c.set_line_width(8); c.rectangle(-w / 2, -sz * .7, w, sz * 1.35); c.stroke()
            c.scale(.8, 1); c.push_group(); D.text(c, it["text"], 0, sz * .05, PA["redD"]); c.pop_group_to_source(); c.paint_with_alpha(a); c.restore()
        elif kind == "serif" and it.get("text"):
            c.push_group(); D.font(c, size or 46, D.SERIF, True, True); D.text(c, it["text"], x, y, PA["cream"] if dark else PA["ink"])
            c.pop_group_to_source(); c.paint_with_alpha(clamp(t / .3 * 3))
        elif kind == "prop" and it.get("prop") in PROPS:
            tt = t / .5; k = pop(tt); rot = ((it.get("y", 0) * 7 + it.get("x", 0)) % 9 - 4) * .01 + (1 - k) * .15
            if k > 0:
                self.prop_sprite(it["prop"], (size or 100) / 100).paint(c, x, y + (1 - clamp(tt * 1.5)) * 60, k, rot=rot)

    def item_explainer(self, c, it, t, dark, x, y, kind, size):
        txt = it.get("text") or ""
        if kind == "tape" and txt:
            EXS.headline(c, txt, x, y, t, size or 84, it.get("style", "black"), dark)
        elif kind == "tiles" and txt:
            EXS.counter(c, txt, x, y, t, size or 110, it.get("style", "black"), dark)
        elif kind == "stamp" and txt:
            EXS.annotation(c, txt, x, y, t, int((size or 100) * .7), dark)
        elif kind == "serif" and txt:
            EXS.typewriter(c, txt, x, y, t, size or 46, dark)
        elif kind == "prop" and it.get("prop") in PROPS:
            key = ("mono", it["prop"], round((size or 100) / 100, 2))
            sp = self._cached(key, lambda: EXS.mono(self.prop_sprite(it["prop"], (size or 100) / 100)))
            u = ease_out(clamp(t / .55)); side = -1 if it.get("x", 0) < 0 else 1; sc = (size or 100) / 100
            # a flat colour disc behind the black-and-white cut-out, the style's accent
            accent = (EXS.EX["yellow"], EXS.EX["red"], EXS.EX["blue"])[(abs(it.get("x", 0)) // 50 + it.get("y", 0) // 100) % 3]
            c.save(); c.set_source_rgba(*D.col(accent)[:3], .9 * clamp(t / .4)); c.arc(x + 40 * sc, y + 30 * sc, 230 * sc * ease_out(clamp(t / .4)), 0, TAU); c.fill(); c.restore()
            sp.paint(c, x + side * (1 - u) * 90, y, 1, alpha=clamp(t / .3))

    # ---------- captions ----------
    @staticmethod
    def chunks(text):
        out, cur = [], []
        for w in text.split():
            cur.append(w); s = " ".join(cur)
            if len(s) > 26 or (w[-1] in ".,:;?" and len(s) > 14):
                out.append(s); cur = []
        if cur:
            out.append(" ".join(cur))
        return out

    def caption(self, c, text, tau, d):
        cs = self.chunks(text); tot = sum(len(s) for s in cs) or 1; a0, a1, acc = .2, d - .5, .2
        for s in cs:
            ln = (a1 - a0) * len(s) / tot
            if acc <= tau < acc + ln:
                if self.style == "explainer":
                    EXS.caption_bar(c, s)
                else:
                    self.strip_sprite([s]).paint(c, CX, 1590)
                return
            acc += ln

    @staticmethod
    def wrap(s, n):
        out, cur = [], ""
        for w in s.split():
            if len((cur + " " + w).strip()) > n:
                out.append(cur.strip()); cur = w
            else:
                cur += " " + w
        if cur.strip():
            out.append(cur.strip())
        return out

    # ---------- frames ----------
    def section_at(self, t):
        for i in range(len(self.starts) - 1, -1, -1):
            if t >= self.starts[i]:
                return i
        return 0

    def scene(self, c, sec, tau):
        d = sec["duration"]; beats = sec.get("beats") or [{"items": []}]; n = len(beats)
        b = min(int(tau / d * n), n - 1) if d > 0 else 0; t = tau - d * b / n
        c.set_source_surface(self.background(sec.get("background", "cream")), 0, 0); c.paint()
        c.save()
        if self.style == "explainer":   # slow camera push over the whole scene
            z = 1 + .03 * clamp(tau / d) if d > 0 else 1; c.translate(CX, 760); c.scale(z, z); c.translate(-CX, -760)
        for i, it in enumerate(beats[b].get("items", [])):
            self.item(c, it, t - .1 - i * .3, sec.get("background") in DARK)
        c.restore()

    def frame(self, t):
        out = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); c = cairo.Context(out)
        i = self.section_at(t); sec = self.p["sections"][i]; tau = t - self.starts[i]; d = sec["duration"]
        u = clamp(tau / .3)
        if u >= 1:
            self.scene(c, sec, tau)
        else:   # whip-pan in: the new scene slides from the right with a motion blur
            tmp = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); self.scene(cairo.Context(tmp), sec, tau)
            off = (1 - ease_out(u)) * W * .9; blur = (1 - u) * 36
            if i > 0:
                prev = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); ps = self.p["sections"][i - 1]
                self.scene(cairo.Context(prev), ps, ps["duration"] - .01); c.set_source_surface(prev, 0, 0); c.paint()
            else:
                rgb(c, PA["cream"]); c.paint()
            if self.style == "explainer":   # clean push: the old scene slides out left as the new one enters
                c2 = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); cc = cairo.Context(c2); cc.set_source_surface(out, 0, 0); cc.paint()
                rgb(c, "#141414"); c.paint(); c.set_source_surface(c2, off - W * .9 - 0, 0); c.paint(); c.set_source_surface(tmp, off, 0); c.paint()
            else:
                for k in range(5):
                    c.set_source_surface(tmp, -off + (k - 2) * blur / 4, 0); c.paint_with_alpha(1 / (k + 1))
        self.caption(c, sec["text"], tau, d)
        if i == len(self.p["sections"]) - 1:
            if self.p.get("disclosure"):
                self.strip_sprite(self.wrap(self.p["disclosure"], 44), 32).paint(c, CX, 1430, alpha=clamp((tau - .5) / .3))
            a = clamp((tau - (d - 3)) / .6)
            if a > 0:
                c.push_group(); rgb(c, "rgba(246,239,223,.92)"); c.rectangle(0, 1745, W, 110); c.fill()
                for j, l in enumerate(self.p.get("credits", [])[:2]):
                    D.font(c, 26, D.SERIF, True, True); D.text(c, l, CX, 1780 + j * 40, "#5d5446")
                c.pop_group_to_source(); c.paint_with_alpha(a)
        out.flush()
        return out


def render(project, out_path, audio_path=None, progress=None, cancel=None):
    """Render every frame to an H.264 mp4 through ffmpeg (raw BGRA frames on stdin), muxing the narration if given."""
    film = Film(project); n = int(math.ceil(film.total * FPS))
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr0", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio_path:
        cmd += ["-i", str(audio_path), "-af", "apad,loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-t", f"{film.total:.3f}", str(out_path)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    ok = False
    try:
        for f in range(n):
            if cancel and cancel():
                raise RuntimeError("Render cancelled.")
            enc.stdin.write(bytes(film.frame(f / FPS).get_data()))
            if progress and f % 12 == 0:
                progress(f / n)
        enc.stdin.close()
        if enc.wait():
            raise RuntimeError("ffmpeg failed while encoding.")
        ok = True
    finally:
        if enc.poll() is None:
            enc.kill()
        if not ok:   # never leave a half-written video behind
            Path(out_path).unlink(missing_ok=True)
    if progress:
        progress(1.0)
