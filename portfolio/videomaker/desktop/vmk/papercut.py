"""Third visual style, "recorte": the paper-cut documentary look. Charcoal backdrop with grain (or an old map), big cream
serif headlines with a red accent, sepia cut-outs standing on a torn orange strip, rounded colour label tags, torn-paper
cards, small cream captions and a torn-paper wipe between scenes. No outlet's logo, name or brand marks; plain drawing
code, no generative models."""
import math
import re

import cairo
from PIL import Image

from . import draw as D
from .draw import CX, TAU, W, H, Sprite, clamp, ease_out, ease_out_back, rgb, rng

PC = dict(char="#1d1d1d", char2="#2b2b2b", cream="#efe6d6", card="#e6dccb", orange="#e0531f", blue="#7fb0e0", lime="#d9ec5c",
          ink="#1a1a1a", map="#d8cfbb", mapline="rgba(90,70,40,.18)")
MAP_BG = {"kraft", "cream", "sky", "rays_blue"}


def torn(c, x, y, w, h, seed, jag=9, sides="tb"):
    """Path of a rectangle whose top/bottom (and optionally left/right) edges are torn."""
    r = rng(seed); n = max(6, int(w / 26)); m = max(4, int(h / 26))
    c.move_to(x, y)
    for i in range(1, n + 1):
        c.line_to(x + w * i / n, y + ((r() - .5) * jag if "t" in sides else 0))
    for i in range(1, m + 1):
        c.line_to(x + w + ((r() - .5) * jag if "r" in sides else 0), y + h * i / m)
    for i in range(n - 1, -1, -1):
        c.line_to(x + w * i / n, y + h + ((r() - .5) * jag if "b" in sides else 0))
    for i in range(m - 1, 0, -1):
        c.line_to(x + ((r() - .5) * jag if "l" in sides else 0), y + h * i / m)
    c.close_path()


def background(kind):
    s = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); c = cairo.Context(s); r = rng(5)
    if kind in MAP_BG:   # an old printed map: graticule, faint coastlines, foxing
        rgb(c, PC["map"]); c.paint(); rgb(c, PC["mapline"]); c.set_line_width(2)
        for x in range(-40, W + 40, 135):
            c.move_to(x, 0); c.curve_to(x + 30, H * .33, x - 30, H * .66, x + 10, H)
        for y in range(60, H, 135):
            c.move_to(0, y); c.line_to(W, y + 18)
        c.stroke()
        rgb(c, "rgba(70,55,35,.35)"); c.set_line_width(2.4)
        for k in range(4):
            x, y = r() * W, 200 + r() * (H - 400); c.move_to(x, y); a = r() * TAU
            for _ in range(70):
                a += (r() - .5) * .9; x += math.cos(a) * 14; y += math.sin(a) * 9; c.line_to(x, y)
            c.stroke()
        for _ in range(14):
            rgb(c, f"rgba(140,100,50,{.04 + r() * .05:.3f})"); c.arc(r() * W, r() * H, 20 + r() * 90, 0, TAU); c.fill()
        dark = .38
    else:
        rgb(c, PC["char"]); c.paint(); dark = .55
        g = cairo.RadialGradient(CX, H * .42, 50, CX, H * .42, H * .7); g.add_color_stop_rgba(0, .2, .2, .2, .9); g.add_color_stop_rgba(1, .2, .2, .2, 0)
        c.set_source(g); c.paint()
    rgb(c, "rgba(255,255,255,.035)")
    for _ in range(9000):
        c.rectangle(r() * W, r() * H, 1.6, 1.6)
    c.fill(); rgb(c, "rgba(0,0,0,.06)")
    for _ in range(9000):
        c.rectangle(r() * W, r() * H, 1.6, 1.6)
    c.fill()
    g = cairo.RadialGradient(CX, H / 2, H * .3, CX, H / 2, H * .85); g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, dark)
    c.set_source(g); c.paint()
    return s


def solid_box(sprite):
    """(left, top, right, bottom) of the sprite's opaque part, relative to its origin (ignores the soft shadow)."""
    s = sprite.surf; s.flush(); w, h = s.get_width(), s.get_height()
    a = Image.frombuffer("RGBA", (w, h), bytes(s.get_data()), "raw", "BGRA", s.get_stride(), 1).getchannel("A").point(lambda v: 255 if v > 200 else 0)
    l, t, r, b = a.getbbox() or (0, 0, w, h)
    return l - sprite.ox, t - sprite.oy, r - sprite.ox, b - sprite.oy


def sepia(sprite):
    """Old-print version of a cut-out: sepia tones with a little contrast, alpha kept."""
    s = sprite.surf; s.flush(); w, h = s.get_width(), s.get_height()
    img = Image.frombuffer("RGBA", (w, h), bytes(s.get_data()), "raw", "BGRA", s.get_stride(), 1)
    r, g, b, a = img.split(); lum = Image.merge("RGB", (r, g, b)).convert("L").point(lambda v: max(0, min(255, int((v - 128) * 1.18 + 128))))
    out = Image.merge("RGBA", (lum, lum.point(lambda v: int(v * .93)), lum.point(lambda v: int(v * .8)), a)).tobytes("raw", "BGRA")
    return Sprite(cairo.ImageSurface.create_for_data(bytearray(out), cairo.FORMAT_ARGB32, w, h, w * 4), sprite.ox, sprite.oy)


def headline(c, text, x, y, t, size, style, dark):
    """Serif headline, word by word: cream by default, the red accent for style 'red', yellow for 'yellow'."""
    if t <= 0:
        return
    color = {"red": PC["orange"], "yellow": "#f0c44c"}.get(style, PC["cream"] if dark else PC["ink"])
    D.font(c, size, D.SERIF)
    while D.text_w(c, text) > W - 110 and size > 30:   # shrink long headlines to fit the frame
        size -= 4; D.font(c, size, D.SERIF)
    words = text.split(); space = D.text_w(c, " ")
    widths = [D.text_w(c, w) for w in words]; total = sum(widths) + space * (len(words) - 1); cx = x - total / 2
    for i, (w, ww) in enumerate(zip(words, widths)):
        a = clamp((t - i * .09) / .35)
        if a > 0:
            c.push_group(); D.font(c, size, D.SERIF); D.text(c, w, cx + ww / 2, y + (1 - ease_out(a)) * 18, color); c.pop_group_to_source(); c.paint_with_alpha(a)
        cx += ww + space


def tag(c, text, x, y, t, size, style, seed):
    """Rounded colour label (like 'torn paper', 'old photos'), popping in with a small tilt."""
    if t <= 0:
        return
    bg, fg = {"red": (PC["orange"], PC["cream"]), "black": (PC["blue"], PC["ink"]), "white": (PC["cream"], PC["ink"]),
              "yellow": (PC["lime"], PC["ink"])}.get(style, (PC["orange"], PC["cream"]))
    k = ease_out_back(clamp(t / .35), 1.6) if t < .35 else 1; rot = ((seed % 7) - 3) * .012
    D.font(c, size, D.SANS); w, h = D.text_w(c, text) + size * .9, size * 1.45
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k)
    c.set_source_rgba(0, 0, 0, .35); D.R(-w / 2 + 4, -h / 2 + 7, w, h, h * .22)(c); c.fill()
    rgb(c, bg); D.R(-w / 2, -h / 2, w, h, h * .22)(c); c.fill(); D.font(c, size, D.SANS); D.text(c, text, 0, 2, fg); c.restore()


def card(c, text, x, y, t, size, seed):
    """Torn beige paper card with dark text; numbers count up."""
    if t <= 0:
        return
    m = re.search(r"\d[\d.,]*", text); k = ease_out(clamp(t / 1.1))
    if m and m.group(0).replace(".", "").replace(",", "").isdigit() and k < 1:
        digits = m.group(0); val = int(digits.replace(".", "").replace(",", ""))
        shown = f"{int(val * k):,}".replace(",", "." if "." in digits else ",") if len(digits) > 3 else str(int(val * k))
        text = text[:m.start()] + shown + text[m.end():]
    D.font(c, size, D.SERIF); full = m and D.text_w(c, m.group(0)) or 0
    w = max(D.text_w(c, text), full) + size * 1.2; h = size * 1.7; u = ease_out(clamp(t / .4))
    c.save(); c.translate(x, y + (1 - u) * 40); c.rotate(((seed % 5) - 2) * .01)
    c.set_source_rgba(0, 0, 0, .4 * u); torn(c, -w / 2 + 6, -h / 2 + 10, w, h, seed, 10, "tblr"); c.fill()
    c.push_group(); rgb(c, PC["card"]); torn(c, -w / 2, -h / 2, w, h, seed, 10, "tblr"); c.fill()
    D.font(c, size, D.SERIF); D.text(c, text, 0, 2, PC["ink"]); c.pop_group_to_source(); c.paint_with_alpha(u); c.restore()


def note(c, text, x, y, t, size, dark):
    if t <= 0:
        return
    words = text.split(); D.font(c, size, D.SANS, False); shown = " ".join(words[:max(1, int(len(words) * clamp(t / .8)) + 1)])
    c.push_group(); D.font(c, size, D.SANS, False); D.text(c, shown, x, y, PC["cream"] if dark else PC["ink"]); c.pop_group_to_source(); c.paint_with_alpha(clamp(t / .3))


def strip_under(c, x, y, w, t, seed):
    """Torn orange strip the cut-out stands on."""
    u = ease_out(clamp(t / .5))
    if u <= 0:
        return
    c.save(); c.translate(x - w / 2, y); rgb(c, PC["orange"]); torn(c, 0, 0, w * u, 54, seed, 8, "tbr"); c.fill()
    D.halftone(c, lambda g: g.rectangle(0, 0, w * u, 54), "rgba(0,0,0,.12)", 7); c.restore()


def caption(c, s, dark):
    D.font(c, 46, D.SANS); tw = D.text_w(c, s)
    c.set_source_rgba(0, 0, 0, .55); D.R(CX - tw / 2 - 24, 1590 - 40, tw + 48, 80, 40)(c); c.fill()
    D.text(c, s, CX, 1590, PC["cream"])


def wipe(c, prev, new, u):
    """Torn-paper wipe: the new scene is revealed behind a ragged vertical edge moving left to right."""
    c.set_source_surface(prev, 0, 0); c.paint()
    ex = -80 + (W + 160) * ease_out(u); r = rng(3)
    pts = [(ex + (r() - .5) * 46, H * i / 40) for i in range(41)]
    c.save(); c.move_to(0, 0)
    for p in pts:
        c.line_to(*p)
    c.line_to(0, H); c.close_path(); c.clip(); c.set_source_surface(new, 0, 0); c.paint(); c.restore()
    c.new_path(); c.move_to(*pts[0])
    for p in pts[1:]:
        c.line_to(*p)
    rgb(c, PC["cream"]); c.set_line_width(12); c.stroke()
