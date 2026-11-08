"""Fourth visual style, "fotocollage": the editorial photo-collage look. Black-and-white archive photographs (public domain,
from Wikimedia Commons) as torn prints and white-edged cut-outs, layered torn paper, mustard yellow with halftone corners,
crumpled blue paper, dark newsprint, cut-paper word labels and word-by-word captions. No outlet's logo, name or brand marks;
plain drawing code and real archive images, no generative models."""
import math
from pathlib import Path

import cairo
from PIL import Image, ImageChops, ImageFilter, ImageOps

from . import draw as D
from .draw import CX, TAU, W, H, Sprite, clamp, ease_out, ease_out_back, rgb, rng

FC = dict(yellow="#f1c232", blue="#2b4fd0", blue2="#4a6ee6", navy="#1f2c86", paper="#ebe5d6", char="#22201e", white="#f8f5ee",
          ink="#151515", sky="#7fb6e8")
KIND = {"kraft": "yellow", "rays_red": "yellow", "green": "yellow", "sky": "blue", "rays_blue": "blue", "rays_teal": "blue",
        "cream": "paper", "navy": "news", "teal": "news"}
LIGHT = {"yellow", "paper"}


def kind_of(bg):
    return KIND.get(bg, "paper")


def is_dark(bg):
    return kind_of(bg) not in LIGHT


# ---------- backgrounds ----------
def _grain(c, r, n=14000, a=.05):
    for col in (f"rgba(255,255,255,{a})", f"rgba(0,0,0,{a * 1.4})"):
        rgb(c, col)
        for _ in range(n):
            c.rectangle(r() * W, r() * H, 1.7, 1.7)
        c.fill()


def _dots(c, cx, cy, radius, step=22, color="rgba(20,20,20,.85)"):
    """Halftone dots that shrink away from (cx, cy), like a printed gradient."""
    rgb(c, color)
    for y in range(int(cy - radius), int(cy + radius), step):
        for x in range(int(cx - radius), int(cx + radius), step):
            ox = x + (step / 2 if (y // step) % 2 else 0); d = math.hypot(ox - cx, y - cy) / radius
            if d < 1:
                c.arc(ox, y, step * .48 * (1 - d) ** 1.4, 0, TAU); c.fill()


def background(bg):
    k = kind_of(bg); s = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H); c = cairo.Context(s); r = rng(11 + len(bg))
    if k == "yellow":
        rgb(c, FC["yellow"]); c.paint(); _dots(c, 0, 0, 620); _dots(c, W, H, 560)
    elif k == "blue":   # crumpled paper: jittered facets, each a little lighter or darker, and fold lines
        rgb(c, FC["blue"]); c.paint(); step = 150; pts = {}
        for gy in range(-1, H // step + 2):
            for gx in range(-1, W // step + 2):
                pts[gx, gy] = (gx * step + (r() - .5) * step * .9, gy * step + (r() - .5) * step * .9)
        for gy in range(-1, H // step + 1):
            for gx in range(-1, W // step + 1):
                a, b, cc, d = pts[gx, gy], pts[gx + 1, gy], pts[gx + 1, gy + 1], pts[gx, gy + 1]
                for tri in ((a, b, cc), (a, cc, d)):
                    v = (r() - .5) * .22
                    c.set_source_rgba(1, 1, 1, v) if v > 0 else c.set_source_rgba(0, 0, .1, -v)
                    c.move_to(*tri[0]); c.line_to(*tri[1]); c.line_to(*tri[2]); c.close_path(); c.fill()
        c.set_line_width(1.6)
        for (gx, gy), p in pts.items():
            if (gx + 1, gy + 1) in pts and r() < .45:
                c.set_source_rgba(1, 1, 1, .1 + r() * .1); c.move_to(*p); c.line_to(*pts[gx + 1, gy + 1]); c.stroke()
    elif k == "news":   # dark newsprint: faint columns of type
        rgb(c, FC["char"]); c.paint(); rgb(c, "rgba(255,255,255,.045)")
        for col in range(4):
            x0 = 40 + col * 255
            for y in range(40, H - 40, 26):
                if r() < .9:
                    c.rectangle(x0, y, 200 + (r() - .5) * 40 if r() > .15 else 120 * r(), 9)
            c.fill()
    else:
        rgb(c, FC["paper"]); c.paint()
        for _ in range(10):
            rgb(c, f"rgba(150,120,70,{.03 + r() * .04:.3f})"); c.arc(r() * W, r() * H, 40 + r() * 140, 0, TAU); c.fill()
    _grain(c, r)
    g = cairo.RadialGradient(CX, H / 2, H * .3, CX, H / 2, H * .85); g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, .35 if k == "news" else .18); c.set_source(g); c.paint()
    return s


def torn_path(c, x, y, w, h, seed, jag=14, sides="tb"):
    r = rng(seed); n = max(8, int(w / 22)); m = max(4, int(h / 22))
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


def band(c, bg, seed, t):
    """A torn strip of contrasting paper across the scene (sky blue on dark, blue on paper, cream on blue), behind the items."""
    k = kind_of(bg)
    if k == "yellow" or t <= 0:
        return
    colr = {"news": FC["sky"], "paper": FC["blue2"], "blue": FC["paper"]}[k]; u = ease_out(clamp(t / .7))
    y0, h = 470 + (seed % 5) * 30, 520; w = (W + 120) * u
    c.save(); c.translate(-60, y0); c.rotate(-.025)
    c.set_source_rgba(0, 0, 0, .3); torn_path(c, 4, 12, w, h, seed, 28); c.fill()
    rgb(c, FC["white"]); torn_path(c, 0, -8, w, h + 16, seed + 1, 30); c.fill()   # the white fibres of the tear
    rgb(c, colr); torn_path(c, 0, 0, w, h, seed, 26); c.fill()
    if k == "news":   # a few clouds on the sky strip
        r = rng(seed)
        for _ in range(5):
            cx, cy = r() * w, 120 + r() * 280; rgb(c, "rgba(255,255,255,.55)")
            for j in range(5):
                c.arc(cx + j * 34, cy + math.sin(j) * 10, 34 + 10 * math.sin(j * 1.7), 0, TAU)
            c.fill()
    c.restore()


# ---------- photos ----------
def _surface(img):
    img = img.convert("RGBA"); w, h = img.size; data = bytearray(img.tobytes("raw", "BGRa"))
    return cairo.ImageSurface.create_for_data(data, cairo.FORMAT_ARGB32, w, h, w * 4)


def _shadowed(img, dx=10, dy=16, blur=14, a=.45):
    pad = blur * 3 + max(abs(dx), abs(dy)); w, h = img.size
    out = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0)); alpha = img.getchannel("A").point(lambda v: int(v * a))
    sh.paste((0, 0, 0, 255), (pad + dx, pad + dy), alpha); sh = sh.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(sh); out.alpha_composite(img, (pad, pad))
    return Sprite(_surface(out), out.width / 2, out.height / 2)


def _tone(img, style):
    g = ImageOps.autocontrast(img.convert("L"), cutoff=1)
    g = g.filter(ImageFilter.UnsharpMask(2, 80, 2))
    if style == "yellow":
        return ImageOps.colorize(g, "#1b1606", FC["yellow"])
    if style == "red":
        return ImageOps.colorize(g, "#0b123f", "#9fb6ff")
    return ImageOps.colorize(g, "#141414", "#f3eee2")


def photo_sprite(path, size, style, seed):
    """style 'black': torn black-and-white print; 'yellow'/'red': yellow or blue duotone print; 'white': cut-out (the near-white
    background of an engraving or studio shot becomes transparent) with a white sticker edge."""
    img = Image.open(path).convert("RGB"); maxw, maxh = int(6.4 * size), int(7.4 * size)
    m = int(min(img.size) * .06); img = img.crop((m, m, img.width - m, img.height - m))   # scans carry film/mount borders
    if style == "white":
        img.thumbnail((maxw, maxh)); g = img.convert("L")
        mask = g.point(lambda v: 0 if v > 228 else 255).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MaxFilter(3))
        toned = _tone(img, "black").convert("RGBA"); toned.putalpha(mask)
        pad = 18; base = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
        edge = Image.new("L", base.size, 0); edge.paste(mask, (pad, pad)); edge = edge.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(1.2))
        base.paste((248, 245, 238, 255), (0, 0), edge); base.alpha_composite(toned, (pad, pad))
        return _shadowed(base)
    if img.width / img.height > maxw / maxh:
        img = ImageOps.fit(img, (int(img.height * maxw / maxh), img.height))
    img.thumbnail((maxw, maxh)); toned = _tone(img, style).convert("RGBA")
    b = 16; w, h = toned.width + b * 2, toned.height + b * 2
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s = cairo.ImageSurface(cairo.FORMAT_A8, w, h); c = cairo.Context(s); torn_path(c, 0, 0, w, h, seed, 18, "tblr")
    c.set_source_rgba(0, 0, 0, 1); c.fill(); s.flush()
    stride = s.get_stride(); raw = bytes(s.get_data()); mask = Image.frombytes("L", (w, h), b"".join(raw[y * stride:y * stride + w] for y in range(h)))
    card.paste((246, 242, 232, 255), (0, 0), mask)
    inner = Image.new("L", toned.size, 0); inner.paste(mask.crop((b, b, b + toned.width, b + toned.height)))
    card.paste(toned, (b, b), ImageChops.multiply(inner, inner))
    return _shadowed(card)


def photo(c, sp, x, y, t, seed, side):
    if t <= 0:
        return
    u = ease_out(clamp(t / .55)); k = 1 + .045 * clamp(t / 6)   # slides in, then a slow push (Ken Burns)
    rot = ((seed % 7) - 3) * .012 + (1 - u) * .08 * side
    sp.paint(c, x + (1 - u) * 160 * side, y + (1 - u) * 40, k, rot=rot, alpha=clamp(t / .2))


# ---------- type ----------
LABEL = {"black": (FC["navy"], FC["yellow"]), "red": (FC["yellow"], FC["navy"]), "white": (FC["white"], FC["blue"]),
         "yellow": (FC["yellow"], FC["ink"])}


def label(c, text, x, y, t, size, style, seed, small=False):
    """Cut-paper word label: a ragged rectangle that wipes in, then the condensed bold word."""
    if t <= 0:
        return
    bg, fg = (FC["white"], FC["blue"]) if small else LABEL.get(style, LABEL["black"])
    D.font(c, size, D.SANS); sx = .84; tw = D.text_w(c, text) * sx
    while tw > W - 120 and size > 30:
        size -= 4; D.font(c, size, D.SANS); tw = D.text_w(c, text) * sx
    w, h = tw + size * .7, size * 1.22; u = ease_out(clamp(t / .3)); rot = ((seed % 5) - 2) * .018
    c.save(); c.translate(x, y); c.rotate(rot)
    c.set_source_rgba(0, 0, 0, .3); torn_path(c, -w / 2 + 6, -h / 2 + 9, w * u, h, seed, 7, "tblr"); c.fill()
    rgb(c, bg); torn_path(c, -w / 2, -h / 2, w * u, h, seed, 7, "tblr"); c.fill()
    a = clamp((t - .12) / .2)
    if a > 0:
        c.push_group(); c.scale(sx, 1); D.font(c, size, D.SANS); D.text(c, text, 0, size * .03, fg); c.pop_group_to_source(); c.paint_with_alpha(a)
    c.restore()


def note(c, text, x, y, t, size, dark):
    if t <= 0:
        return
    a = clamp(t / .3); D.font(c, size, D.SANS)
    while D.text_w(c, text) > W - 100 and size > 26:
        size -= 2; D.font(c, size, D.SANS)
    c.push_group()
    if dark:
        D.text(c, text, x + 2, y + 3, "rgba(0,0,0,.7)")
    D.text(c, text, x, y, FC["white"] if dark else FC["ink"]); c.pop_group_to_source(); c.paint_with_alpha(a)


def card(c, text, x, y, t, size, seed):
    """Big number on a torn white card."""
    if t <= 0:
        return
    D.font(c, size, D.SERIF); w, h = D.text_w(c, text) + size * .9, size * 1.5; k = ease_out_back(clamp(t / .35), 1.5)
    c.save(); c.translate(x, y); c.rotate(((seed % 5) - 2) * .015); c.scale(k, k)
    c.set_source_rgba(0, 0, 0, .35); torn_path(c, -w / 2 + 6, -h / 2 + 10, w, h, seed, 10, "tblr"); c.fill()
    rgb(c, FC["white"]); torn_path(c, -w / 2, -h / 2, w, h, seed, 10, "tblr"); c.fill()
    D.font(c, size, D.SERIF); D.text(c, text, 0, 2, FC["ink"]); c.restore()


def caption(c, chunk, frac):
    """Word-by-word caption: the whole chunk in white, the word being said on a blue highlight."""
    words = chunk.split(); D.font(c, 50, D.SANS); sp = D.text_w(c, " "); ws = [D.text_w(c, w) for w in words]
    total = sum(ws) + sp * (len(words) - 1); x = CX - total / 2; y = 1600; cur = min(len(words) - 1, int(frac * len(words)))
    c.set_source_rgba(.08, .08, .08, .78); D.R(x - 26, y - 46, total + 52, 92, 10)(c); c.fill()   # dark slip: readable on yellow too
    for i, (w, ww) in enumerate(zip(words, ws)):
        if i == cur:
            rgb(c, FC["blue"]); c.rectangle(x - 8, y - 34, ww + 16, 68); c.fill()
        D.text(c, w, x + ww / 2 + 2, y + 3, "rgba(0,0,0,.6)"); D.text(c, w, x + ww / 2, y, FC["white"]); x += ww + sp
