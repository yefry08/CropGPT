"""Second visual style, "explicativo": the look of animated news explainers. Clean off-white paper with a faint dot grid,
bold black headlines over a yellow highlighter swipe, black-and-white cut-outs that slide in, a hand-drawn red circle for
annotations, count-up numbers, typewriter captions, a lower-third subtitle bar, a slow camera push and a slide between scenes.
No outlet's logo, name or brand marks. Plain drawing code, no generative models."""
import math
import re

import cairo
from PIL import Image

from . import draw as D
from .draw import CX, TAU, W, H, Sprite, clamp, ease_out, rgb, rng

EX = dict(paper="#f2eee5", paper2="#e9e2d3", blue_paper="#e3ebee", ink="#141414", yellow="#ffd23f", red="#e4572e",
          blue="#2f6690", grey="#8a8a8a", dark="#1e1e1e", dark2="#25313a", white="#ffffff")
DARK = {"navy", "teal", "green"}


def background(kind):
    s = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); c = cairo.Context(s)
    base = {"kraft": EX["paper2"], "sky": EX["blue_paper"], "rays_blue": EX["blue_paper"], "navy": EX["dark"], "teal": EX["dark2"],
            "green": "#22302a"}.get(kind, EX["paper"])
    rgb(c, base); c.paint(); dark = kind in DARK
    # faint dot grid, like graph paper
    rgb(c, "rgba(255,255,255,.07)" if dark else "rgba(20,20,20,.07)")
    for y in range(20, H, 40):
        for x in range(20, W, 40):
            c.rectangle(x, y, 2, 2)
    c.fill()
    if kind == "rays_red":    # a bold accent band
        c.save(); c.translate(CX, 760); c.rotate(-.12); rgb(c, "rgba(228,87,46,.16)"); c.rectangle(-900, -260, 1800, 520); c.fill(); c.restore()
    elif kind == "rays_teal":
        rgb(c, "rgba(47,102,144,.12)"); c.arc(W * .82, 330, 420, 0, TAU); c.fill()
    r = rng(11); rgb(c, "rgba(255,255,255,.04)" if dark else "rgba(0,0,0,.035)")
    for _ in range(6000):
        c.rectangle(r() * W, r() * H, 1.5, 1.5)
    c.fill()
    g = cairo.RadialGradient(CX, H / 2, H * .35, CX, H / 2, H * .85); g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, .18 if dark else .10)
    c.set_source(g); c.paint()
    return s


def mono(sprite):
    """Black-and-white version of a cut-out sprite (archival-print look), keeping its alpha."""
    s = sprite.surf; s.flush(); w, h = s.get_width(), s.get_height()
    img = Image.frombuffer("RGBA", (w, h), bytes(s.get_data()), "raw", "BGRA", s.get_stride(), 1)
    r, g, b, a = img.split(); lum = Image.merge("RGB", (r, g, b)).convert("L").point(lambda v: min(255, int(v * 1.08)))
    out = Image.merge("RGBA", (lum, lum, lum, a)).tobytes("raw", "BGRA")
    surf = cairo.ImageSurface.create_for_data(bytearray(out), cairo.FORMAT_ARGB32, w, h, w * 4)
    return Sprite(surf, sprite.ox, sprite.oy)


def headline(c, text, x, y, t, size, style, dark):
    if t <= 0:
        return
    D.font(c, size); tw = D.text_w(c, text); bar = clamp(t / .45)
    fg = EX["white"] if dark and style in ("black", "white") else EX["ink"]
    color = {"black": EX["yellow"], "yellow": EX["yellow"], "red": EX["red"], "white": None}.get(style, EX["yellow"])
    if style == "red":
        fg = EX["white"]
    if color:   # highlighter swipe from left to right, slightly tilted and ragged
        c.save(); c.translate(x - tw / 2 - 14, y); c.rotate(-.015); rgb(c, color)
        c.rectangle(0, -size * .42, (tw + 28) * ease_out(bar), size * .84); c.fill(); c.restore()
    a = clamp((t - .12) / .3)
    if a > 0:
        c.push_group(); D.font(c, size); D.text(c, text, x, y + (1 - a) * 10, fg); c.pop_group_to_source(); c.paint_with_alpha(a)
    if style == "white" and not color:
        rgb(c, fg); c.set_line_width(5); c.move_to(x - tw / 2, y + size * .55); c.line_to(x - tw / 2 + tw * ease_out(bar), y + size * .55); c.stroke()


def counter(c, text, x, y, t, size, style, dark):
    """Numbers count up (prefix/suffix kept); other text types in."""
    if t <= 0:
        return
    m = re.search(r"\d[\d.,]*", text); k = ease_out(clamp(t / 1.1))
    if m and m.group(0).replace(".", "").replace(",", "").isdigit():
        digits = m.group(0); val = int(digits.replace(".", "").replace(",", ""))
        shown = digits if k >= 1 else (f"{int(val * k):,}".replace(",", "." if "." in digits else ",") if len(digits) > 3 else str(int(val * k)))
        s = text[:m.start()] + shown + text[m.end():]
    else:
        s = text[:max(1, int(len(text) * k))]
    fg = EX["white"] if dark else EX["ink"]
    D.font(c, size); D.text(c, s, x, y, fg)
    D.font(c, size); tw = D.text_w(c, text)
    rgb(c, EX["yellow"] if style == "yellow" else EX["red"]); c.set_line_width(8); c.move_to(x - tw / 2, y + size * .62); c.line_to(x - tw / 2 + tw * clamp(t / .6), y + size * .62); c.stroke()


def annotation(c, text, x, y, t, size, dark):
    """Red handwriting-style note with a circle drawn around it."""
    if t <= 0:
        return
    D.font(c, size, D.SANS, True, True); tw = D.text_w(c, text)
    p = ease_out(clamp(t / .7)); rx, ry = tw / 2 + 40, size * .95; r = rng(len(text))
    rgb(c, EX["red"]); c.set_line_width(7); c.set_line_cap(cairo.LINE_CAP_ROUND); c.new_path()
    steps = max(2, int(64 * p * 1.08))
    for i in range(steps):
        a = -2.4 + TAU * 1.08 * i / 64; wob = 1 + (r() - .5) * .03
        (c.line_to if i else c.move_to)(x + math.cos(a) * rx * wob, y + math.sin(a) * ry * wob)
    c.stroke()
    a = clamp((t - .2) / .3)
    if a > 0:
        c.push_group(); D.font(c, size, D.SANS, True, True); D.text(c, text, x, y, EX["red"]); c.pop_group_to_source(); c.paint_with_alpha(a)


def typewriter(c, text, x, y, t, size, dark):
    if t <= 0:
        return
    n = int(len(text) * clamp(t / max(.6, len(text) * .035)))
    D.font(c, size, D.SERIF, False, True); full = D.text_w(c, text)
    D.text(c, text[:n], x - full / 2, y, EX["paper"] if dark else "#333333", align="left")


def caption_bar(c, s, alpha=1.0):
    D.font(c, 44); tw = D.text_w(c, s); w, h = tw + 64, 80
    c.push_group(); rgb(c, "rgba(20,20,20,.88)"); D.R(CX - w / 2, 1590 - h / 2, w, h, 10)(c); c.fill()
    rgb(c, EX["yellow"]); c.rectangle(CX - w / 2, 1590 - h / 2, 10, h); c.fill()
    D.font(c, 44); D.text(c, s, CX, 1590, EX["white"]); c.pop_group_to_source(); c.paint_with_alpha(alpha)
