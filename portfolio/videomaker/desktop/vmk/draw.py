"""Paper-collage drawing primitives on a cairo context: palette, shapes, ink (with the white paper-border silhouette pass),
halftone dots, text, and cached sprites with soft drop shadows. Everything here is plain code, no generative models."""
import math
import random
import sys

import cairo
from PIL import Image, ImageFilter

TAU = math.tau
W, H = 1080, 1920
CX, CY = W / 2, H / 2

PA = dict(kraft="#c99a5b", kraftD="#a77a42", cream="#efe4cc", paper="#f6efdf", red="#c8382e", redD="#9e2a22", teal="#1f4d55",
          navy="#1b2433", sky="#9cc7d3", ink="#1d1a17", grey="#8d877b", steel="#6f7782", orange="#e0702b", green="#3c7d4f", yellow="#f0c44c")

if sys.platform.startswith("win"):
    SANS, SERIF = "Arial", "Georgia"
elif sys.platform == "darwin":
    SANS, SERIF = "Helvetica", "Georgia"
else:
    SANS, SERIF = "Liberation Sans", "Liberation Serif"


def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_out_back(t, s=1.70158):
    t -= 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2


def pop(t):
    return 0.0 if t <= 0 else 1.0 if t >= 1 else ease_out_back(clamp(t), 1.4)


def col(s):
    """'#rrggbb' or 'rgba(r,g,b,a)' -> (r, g, b, a) floats."""
    if s.startswith("#"):
        return tuple(int(s[i:i + 2], 16) / 255 for i in (1, 3, 5)) + (1.0,)
    v = [float(x) for x in s[s.index("(") + 1:-1].split(",")]
    return (v[0] / 255, v[1] / 255, v[2] / 255, v[3] if len(v) > 3 else 1.0)


def rgb(c, s):
    c.set_source_rgba(*col(s))


# ---------- shapes: callables that append a sub-path to the context ----------
def R(x, y, w, h, r=0):
    def f(c):
        c.new_sub_path()
        if not r:
            c.rectangle(x, y, w, h); return
        rr = min(r, w / 2, h / 2)
        c.arc(x + w - rr, y + rr, rr, -math.pi / 2, 0); c.arc(x + w - rr, y + h - rr, rr, 0, math.pi / 2)
        c.arc(x + rr, y + h - rr, rr, math.pi / 2, math.pi); c.arc(x + rr, y + rr, rr, math.pi, 1.5 * math.pi); c.close_path()
    return f


def CIRC(x, y, r):
    def f(c):
        c.new_sub_path(); c.arc(x, y, r, 0, TAU); c.close_path()
    return f


def ELL(x, y, rx, ry, a0=0.0, a1=TAU, ccw=False, sub=True):
    def f(c):
        if sub:
            c.new_sub_path()
        c.save(); c.translate(x, y); c.scale(rx, ry)
        (c.arc_negative if ccw else c.arc)(0, 0, 1, a0, a1); c.restore()
    return f


def POLY(pts):
    def f(c):
        c.move_to(*pts[0])
        for p in pts[1:]:
            c.line_to(*p)
        c.close_path()
    return f


def SVG(d):
    """Tiny absolute SVG path parser: M L C Q Z."""
    toks, out = d.replace(",", " ").replace("M", " M ").replace("L", " L ").replace("C", " C ").replace("Q", " Q ").replace("Z", " Z ").split(), []
    i = 0
    while i < len(toks):
        cmd = toks[i]; i += 1
        n = {"M": 2, "L": 2, "C": 6, "Q": 4, "Z": 0}[cmd]
        while True:
            out.append((cmd, [float(v) for v in toks[i:i + n]])); i += n
            if n == 0 or i >= len(toks) or toks[i] in "MLCQZ":
                break
            if cmd == "M":
                cmd = "L"

    def f(c):
        for cmd, a in out:
            if cmd == "M":
                c.move_to(*a)
            elif cmd == "L":
                c.line_to(*a)
            elif cmd == "C":
                c.curve_to(*a)
            elif cmd == "Q":
                x0, y0 = c.get_current_point(); qx, qy, x, y = a
                c.curve_to(x0 + 2 / 3 * (qx - x0), y0 + 2 / 3 * (qy - y0), x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y), x, y)
            else:
                c.close_path()
    return f


def PATH(*parts):
    def f(c):
        for p in parts:
            p(c)
    return f


# ---------- ink: every prop is drawn twice, first as a fat paper silhouette (SIL > 0), then as art ----------
SIL = 0


def ink(c, shape, fill, stroke=PA["ink"], w=4):
    c.new_path(); shape(c)
    c.set_line_join(cairo.LINE_JOIN_ROUND); c.set_line_cap(cairo.LINE_CAP_ROUND)
    if SIL:
        rgb(c, PA["paper"])
        if fill:
            c.fill_preserve()
        c.set_line_width(w + SIL * 2); c.stroke(); return
    if fill:
        rgb(c, fill)
        c.fill_preserve() if stroke else c.fill()
    if stroke:
        rgb(c, stroke); c.set_line_width(w); c.stroke()
    c.new_path()


_DOTS = {}


def halftone(c, shape, color="rgba(0,0,0,.18)", step=9):
    if SIL:
        return
    if color not in _DOTS:
        s = cairo.ImageSurface(cairo.FORMAT_ARGB32, step * 2, step * 2); g = cairo.Context(s); rgb(g, color)
        for x, y in [(0, 0), (step, 0), (step / 2, step), (step * 1.5, step), (0, step * 2), (step * 2, step * 2), (step * 2, 0)]:
            g.arc(x, y, step * .22, 0, TAU); g.fill()
        p = cairo.SurfacePattern(s); p.set_extend(cairo.EXTEND_REPEAT); _DOTS[color] = p
    c.save(); c.new_path(); shape(c); c.clip(); c.set_source(_DOTS[color]); c.paint(); c.restore()


def line(c, x0, y0, x1, y1, color, w):
    if SIL:
        return
    c.new_path(); c.move_to(x0, y0); c.line_to(x1, y1); rgb(c, color); c.set_line_width(w); c.set_line_cap(cairo.LINE_CAP_ROUND); c.stroke()


def font(c, size, family=None, bold=True, italic=False):
    c.select_font_face(family or SANS, cairo.FONT_SLANT_ITALIC if italic else cairo.FONT_SLANT_NORMAL,
                       cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    c.set_font_size(size)


def text_w(c, s):
    return c.text_extents(s).x_advance


def text(c, s, x, y, color, align="center"):
    """Draw s with its vertical middle at y (like canvas textBaseline=middle)."""
    asc, desc = c.font_extents()[:2]
    w = text_w(c, s)
    dx = -w / 2 if align == "center" else 0 if align == "left" else -w
    c.move_to(x + dx, y + (asc - desc) / 2); rgb(c, color); c.show_text(s); c.new_path()


# ---------- sprites: draw once into an image with a blurred drop shadow, then composite with any transform ----------
class Sprite:
    def __init__(self, surf, ox, oy):
        self.surf, self.ox, self.oy = surf, ox, oy

    def paint(self, c, x, y, scale=1.0, sy=None, rot=0.0, alpha=1.0, offset=(0, 0)):
        sy = scale if sy is None else sy
        if abs(scale) < .01 or abs(sy) < .01 or alpha <= 0:   # a flat sprite is invisible (and a singular matrix for cairo)
            return
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(scale, sy); c.translate(*offset)
        c.set_source_surface(self.surf, -self.ox, -self.oy); c.get_source().set_filter(cairo.FILTER_BILINEAR)
        c.paint_with_alpha(alpha) if alpha < 1 else c.paint(); c.restore()


def _alpha_blur(surf, radius):
    w, h = surf.get_width(), surf.get_height(); surf.flush()
    a = Image.frombuffer("RGBA", (w, h), bytes(surf.get_data()), "raw", "BGRA", surf.get_stride(), 1).getchannel("A")
    a = a.filter(ImageFilter.GaussianBlur(radius))
    stride = cairo.ImageSurface.format_stride_for_width(cairo.FORMAT_A8, w)
    buf = bytearray(stride * h); raw = a.tobytes()
    for y in range(h):
        buf[y * stride:y * stride + w] = raw[y * w:(y + 1) * w]
    return cairo.ImageSurface.create_for_data(buf, cairo.FORMAT_A8, w, h, stride)


def sprite(draw, half_w, half_h, shadow=(0, 6, 14, .4), silhouette=None):
    """draw(ctx) paints around (0,0) within +/-half_w, +/-half_h. silhouette(ctx), if given, paints the shape that casts the shadow
    (else the drawing itself does)."""
    dx, dy, blur, alpha = shadow
    pad = int(blur * 2 + max(abs(dx), abs(dy)) + 4)
    w, h = int(half_w * 2 + pad * 2), int(half_h * 2 + pad * 2); ox, oy = half_w + pad, half_h + pad
    out = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h); c = cairo.Context(out)
    if alpha > 0:
        m = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h); mc = cairo.Context(m); mc.translate(ox, oy); (silhouette or draw)(mc)
        mask = _alpha_blur(m, blur / 2)
        c.set_source_rgba(20 / 255, 10 / 255, 0, alpha); c.mask_surface(mask, dx, dy)
    c.translate(ox, oy); draw(c)
    return Sprite(out, ox, oy)


def rng(seed):
    return random.Random(seed).random
