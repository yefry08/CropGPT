"""The prop library: generic drawn objects for the collage (no logos, no real people). Each prop is prop(ctx) drawn around
(0, 0) with draw.ink(), which also handles the paper-border silhouette pass."""
import math

from . import draw as D
from .draw import CIRC, ELL, PATH, POLY, PA, R, SVG, TAU, halftone, ink, line, rgb

INK = PA["ink"]


def _sil():
    return D.SIL


def _label(c, s, x, y, size, color, bold=True, family=None, align="center"):
    if _sil():
        return
    D.font(c, size, family, bold); D.text(c, s, x, y, color, align)


# ---------- from the first collage reels ----------
def robot(c):
    ink(c, R(-150, -170, 300, 320, 60), PA["steel"]); halftone(c, R(-150, -170, 300, 320, 60)); ink(c, R(-110, -60, 220, 70, 20), INK)
    if not _sil():
        for x in (-50, 50):
            rgb(c, "rgba(200,56,46,.35)"); c.arc(x, -25, 30, 0, TAU); c.fill(); rgb(c, PA["red"]); c.arc(x, -25, 18, 0, TAU); c.fill()
    ink(c, R(-80, 50, 160, 50, 10), PA["cream"])
    for i in range(-60, 61, 30):
        line(c, i, 50, i, 100, INK, 4)
    ink(c, R(-20, -230, 40, 60, 8), PA["steel"]); ink(c, CIRC(0, -240, 22), PA["red"]); ink(c, R(-190, -60, 40, 120, 12), PA["steel"]); ink(c, R(150, -60, 40, 120, 12), PA["steel"])


def cog(c):
    pts = [(math.cos(i / 24 * TAU) * (150 if i % 2 else 180), math.sin(i / 24 * TAU) * (150 if i % 2 else 180)) for i in range(24)]
    ink(c, POLY(pts), PA["kraftD"]); halftone(c, POLY(pts)); ink(c, CIRC(0, 0, 70), PA["cream"])


def db(c):
    body = PATH(lambda g: g.move_to(-150, -140), lambda g: g.line_to(-150, 140), ELL(0, 140, 150, 45, math.pi, 0, ccw=True, sub=False),
                lambda g: g.line_to(150, -140), lambda g: g.close_path())
    ink(c, body, PA["sky"]); halftone(c, body)
    if not _sil():
        for y in (-40, 50):
            c.new_path(); ELL(0, y, 150, 45, 0, math.pi)(c); rgb(c, INK); c.set_line_width(4); c.stroke()
    ink(c, ELL(0, -140, 150, 45), "#c7e2ea")


def key(c):
    ink(c, CIRC(-120, 0, 70), PA["yellow"]); halftone(c, CIRC(-120, 0, 70)); ink(c, CIRC(-120, 0, 25), PA["cream"])
    ink(c, POLY([(-55, -18), (170, -18), (170, 18), (150, 18), (150, 55), (120, 55), (120, 18), (95, 18), (95, 45), (70, 45), (70, 18), (-55, 18)]), PA["yellow"])


def laptop(c):
    ink(c, R(-220, -170, 440, 280, 18), PA["steel"]); ink(c, R(-195, -148, 390, 236, 8), PA["navy"])
    for i in range(4):
        if not _sil():
            rgb(c, "rgba(159,224,176,.85)"); c.rectangle(-175, -112 + i * 44, 300 - (i % 3) * 60, 10); c.fill()
    ink(c, POLY([(-270, 110), (270, 110), (240, 150), (-240, 150)]), "#d9d2c2")


def car(c):
    b = POLY([(-230, 40), (-200, -30), (-110, -50), (-60, -110), (90, -110), (150, -50), (230, -30), (240, 40)])
    ink(c, b, PA["red"]); halftone(c, b); ink(c, POLY([(-45, -95), (70, -95), (115, -50), (-90, -50)]), "#cfe6ee")
    for x in (-130, 130):
        ink(c, CIRC(x, 45, 48), INK); ink(c, CIRC(x, 45, 18), PA["grey"])


def watch(c, t=.6):
    ink(c, R(-30, -205, 60, 40, 8), PA["steel"]); ink(c, CIRC(0, 0, 170), PA["cream"]); ink(c, CIRC(0, 0, 140), "#ffffff")
    if _sil():
        return
    c.new_path(); c.move_to(0, 0); c.arc(0, 0, 140, -math.pi / 2, -math.pi / 2 + TAU * t); c.close_path(); rgb(c, "rgba(200,56,46,.85)"); c.fill()
    a = -math.pi / 2 + TAU * t; line(c, 0, 0, math.cos(a) * 120, math.sin(a) * 120, INK, 8)


def calendar(c):
    ink(c, R(-160, -170, 320, 340, 16), PA["paper"]); ink(c, R(-160, -170, 320, 80, 16), PA["red"])
    for i in range(1, 5):
        line(c, -160, -90 + i * 52, 160, -90 + i * 52, "rgba(0,0,0,.25)", 2)


def box(c):
    b = POLY([(-260, -120), (260, -120), (260, 170), (-260, 170)])
    ink(c, b, PA["kraftD"]); halftone(c, b, "rgba(0,0,0,.12)"); ink(c, POLY([(-260, -120), (-200, -190), (200, -190), (260, -120)]), PA["kraft"])


def card(c):
    ink(c, R(-300, -80, 600, 160, 10), PA["paper"]); line(c, -250, -80, -250, 80, "rgba(200,56,46,.5)", 2)


def counter(c):
    ink(c, R(-280, -40, 560, 200, 10), PA["teal"]); ink(c, R(-300, -70, 600, 40, 8), PA["kraftD"]); ink(c, R(-160, -260, 320, 180, 10), PA["paper"])


# ---------- money and markets ----------
def chart(c, up=False):
    ink(c, R(-260, -190, 520, 380, 14), PA["paper"])
    if _sil():
        return
    for i in range(1, 5):
        line(c, -230, -190 + i * 76, 230, -190 + i * 76, "rgba(60,40,20,.18)", 2)
    pts = ([(-220, 150), (-160, 120), (-100, 125), (-40, 60), (20, 30), (80, -40), (140, -90), (190, -120), (225, -160)] if up else
           [(-220, 120), (-160, 80), (-100, 90), (-40, 10), (20, -40), (70, -130), (110, -150), (150, -20), (190, 90), (225, 150)])
    c.new_path(); c.move_to(*pts[0])
    for p in pts[1:]:
        c.line_to(*p)
    rgb(c, PA["green"] if up else PA["red"]); c.set_line_width(10); c.stroke()


def chart_up(c):
    chart(c, True)


def doc(c):
    ink(c, R(-170, -220, 340, 440, 6), PA["cream"]); ink(c, R(-190, -235, 340, 440, 6), PA["paper"])
    if _sil():
        return
    rgb(c, INK)
    for i in range(11):
        c.rectangle(-160, -150 + i * 30, 160 if i % 4 == 3 else 270, 7)
    c.rectangle(-160, -200, 200, 18); c.fill()


def coin(c):
    ink(c, CIRC(0, 0, 70), PA["yellow"]); halftone(c, CIRC(0, 0, 70)); ink(c, CIRC(0, 0, 50), None, PA["kraftD"], 4)
    _label(c, "$", 0, 4, 70, PA["kraftD"], family=D.SERIF)


def lever(c, tilt=.2):
    ink(c, POLY([(-50, 150), (50, 150), (0, 60)]), PA["steel"]); c.save(); c.translate(0, 55); c.rotate(tilt); ink(c, R(-330, -14, 660, 28, 6), PA["kraftD"]); c.restore()


def chip(c):
    ink(c, R(-120, -120, 240, 240, 14), PA["navy"])
    for i in range(5):
        o = -88 + i * 44
        for r in (R(o - 8, -150, 16, 30, 3), R(o - 8, 120, 16, 30, 3), R(-150, o - 8, 30, 16, 3), R(120, o - 8, 30, 16, 3)):
            ink(c, r, PA["steel"], INK, 3)
    ink(c, R(-60, -60, 120, 120, 8), PA["teal"]); halftone(c, R(-60, -60, 120, 120, 8), "rgba(255,255,255,.2)")


def phone(c):
    b = POLY([(-200, 150), (200, 150), (150, -20), (-150, -20)])
    ink(c, b, PA["red"]); halftone(c, b); ink(c, R(-230, -110, 460, 80, 40), PA["redD"]); ink(c, CIRC(0, 70, 55), PA["cream"])


def tag(c):
    p = POLY([(-200, -110), (140, -110), (230, 0), (140, 110), (-200, 110)]); ink(c, p, PA["yellow"]); halftone(c, p); ink(c, CIRC(150, 0, 18), PA["cream"])


def safe(c):
    ink(c, R(-200, -200, 400, 400, 20), PA["steel"]); halftone(c, R(-200, -200, 400, 400, 20)); ink(c, R(-160, -160, 320, 320, 12), "#8a929c")
    ink(c, CIRC(0, 0, 80), PA["cream"]); ink(c, CIRC(0, 0, 18), INK)
    for i in range(12):
        a = i / 12 * TAU; line(c, math.cos(a) * 62, math.sin(a) * 62, math.cos(a) * 74, math.sin(a) * 74, INK, 6)


def ingot(c):
    top = POLY([(-200, -40), (200, -40), (240, 20), (-240, 20)])
    ink(c, R(-240, 20, 480, 90, 6), PA["grey"]); ink(c, top, "#c9ced4"); halftone(c, top, "rgba(0,0,0,.12)")


# ---------- transport, documents, communication ----------
def ship(c):
    hull = POLY([(-330, 20), (330, 20), (270, 140), (-290, 140)]); ink(c, hull, PA["red"]); halftone(c, hull)
    ink(c, R(-300, 0, 600, 24, 4), INK); ink(c, R(170, -150, 110, 150, 6), PA["cream"]); ink(c, R(200, -200, 30, 50, 4), PA["steel"])
    cols = [PA["teal"], PA["orange"], PA["yellow"], PA["steel"], PA["green"]]
    for i in range(5):
        for j in range(2):
            ink(c, R(-280 + i * 86, -60 - j * 58, 80, 54, 3), cols[(i + j * 2) % 5], INK, 3)
    if not _sil():
        rgb(c, INK)
        for i in range(3):
            c.rectangle(186 + i * 30, -120, 18, 16)
        c.fill()


def plane(c):
    p = POLY([(0, -170), (22, -120), (24, -30), (190, 40), (190, 70), (24, 40), (18, 120), (70, 160), (70, 180), (0, 165), (-70, 180), (-70, 160),
              (-18, 120), (-24, 40), (-190, 70), (-190, 40), (-24, -30), (-22, -120)])
    ink(c, p, PA["steel"]); halftone(c, p, "rgba(0,0,0,.15)")


def bubble(c):
    ink(c, PATH(R(-240, -140, 480, 240, 40), POLY([(-120, 98), (-170, 170), (-40, 98)])), PA["paper"])


def folder(c):
    ink(c, POLY([(-250, -170), (-80, -170), (-50, -140), (250, -140), (250, 180), (-250, 180)]), PA["kraftD"])
    ink(c, R(-250, -110, 500, 290, 8), PA["kraft"]); halftone(c, R(-250, -110, 500, 290, 8), "rgba(0,0,0,.1)")


def trefoil(c):
    ink(c, CIRC(0, 0, 170), PA["yellow"])
    if _sil():
        return
    rgb(c, INK)
    for i in range(3):
        a = -math.pi / 2 + i * TAU / 3
        c.new_path(); c.arc(0, 0, 140, a - .5, a + .5); c.arc_negative(0, 0, 40, a + .5, a - .5); c.close_path(); c.fill()
    c.arc(0, 0, 26, 0, TAU); c.fill()


def book(c):
    ink(c, R(-150, -200, 300, 400, 10), PA["teal"]); halftone(c, R(-150, -200, 300, 400, 10), "rgba(255,255,255,.15)")
    ink(c, R(-150, -200, 40, 400, 6), PA["navy"]); ink(c, R(-70, -120, 190, 60, 4), PA["cream"])


def lens(c):
    c.save(); c.rotate(-math.pi / 4); ink(c, R(-25, 120, 50, 190, 20), PA["kraftD"]); c.restore()
    ink(c, CIRC(0, 0, 130), "rgba(200,230,240,.6)", INK, 18)


def form(c):
    ink(c, R(-280, -230, 560, 460, 16), PA["paper"]); ink(c, R(-280, -230, 560, 50, 16), PA["steel"])
    if _sil():
        return
    for x, color in ((-245, PA["red"]), (-215, PA["yellow"]), (-185, PA["green"])):
        rgb(c, color); c.arc(x, -205, 9, 0, TAU); c.fill()
    rgb(c, PA["grey"]); c.set_line_width(3)
    for x, y, w, h in ((-240, -150, 480, 44), (-240, -85, 480, 44), (-240, -20, 480, 130)):
        c.rectangle(x, y, w, h); c.stroke()
    rgb(c, INK)
    for i in range(5):
        c.rectangle(-225, i * 22, 200 if i == 4 else 420, 8)
    c.fill(); c.new_path(); R(60, 140, 180, 60, 10)(c); c.fill()


def badge(c):
    star = lambda n, r1, r2: POLY([(math.cos(-math.pi / 2 + i / n * TAU) * (r2 if i % 2 else r1), math.sin(-math.pi / 2 + i / n * TAU) * (r2 if i % 2 else r1)) for i in range(n)])
    ink(c, star(14, 175, 125), PA["yellow"]); halftone(c, star(14, 175, 125)); ink(c, CIRC(0, 0, 90), PA["navy"]); ink(c, star(10, 60, 26), PA["yellow"], INK, 3)


def passport(c):
    ink(c, R(-140, -190, 280, 380, 14), PA["navy"]); halftone(c, R(-140, -190, 280, 380, 14), "rgba(255,255,255,.12)"); ink(c, CIRC(0, -30, 70), None, PA["yellow"], 6)
    if not _sil():
        rgb(c, PA["yellow"]); c.rectangle(-80, 90, 160, 12); c.rectangle(-60, 120, 120, 10); c.fill()


def funnel(c):
    p = POLY([(-220, -160), (220, -160), (50, 40), (50, 180), (-50, 220), (-50, 40)]); ink(c, p, PA["steel"]); halftone(c, p, "rgba(0,0,0,.15)")
    ink(c, R(-240, -190, 480, 40, 10), PA["redD"])


def plug(c, gap=1.0):
    g = 30 + gap * 130
    c.save(); c.translate(-g, 0); ink(c, R(-300, -12, 200, 24, 10), INK); ink(c, R(-110, -60, 110, 120, 16), PA["red"])
    ink(c, R(0, -40, 50, 16, 4), PA["steel"]); ink(c, R(0, 24, 50, 16, 4), PA["steel"]); c.restore()
    c.save(); c.translate(g, 0); ink(c, R(0, -80, 130, 160, 16), PA["cream"]); ink(c, R(20, -40, 14, 22, 3), INK); ink(c, R(20, 18, 14, 22, 3), INK); c.restore()


# ---------- machines, factory, home ----------
def humanoid(c, arm=0.0):
    ink(c, R(-55, -260, 110, 110, 30), PA["steel"]); ink(c, R(-40, -230, 80, 34, 12), INK)
    if not _sil():
        rgb(c, PA["sky"]); c.rectangle(-30, -222, 60, 18); c.fill()
    ink(c, R(-30, -150, 60, 24, 6), PA["grey"]); ink(c, R(-95, -130, 190, 210, 26), PA["cream"]); halftone(c, R(-95, -130, 190, 210, 26))
    ink(c, R(-70, 80, 55, 190, 18), PA["steel"]); ink(c, R(15, 80, 55, 190, 18), PA["steel"]); ink(c, R(-140, -120, 44, 170, 18), PA["steel"])
    c.save(); c.translate(118, -110); c.rotate(-arm * 2.6); ink(c, R(-22, 0, 44, 170, 18), PA["steel"]); c.restore()


def furnace(c):
    body = POLY([(-300, -60), (300, -60), (250, 220), (-250, 220)]); ink(c, body, INK); halftone(c, body, "rgba(255,255,255,.08)")
    ink(c, R(-320, -90, 640, 50, 14), PA["steel"]); ink(c, ELL(0, -65, 290, 30), PA["orange"])
    if not _sil():
        c.new_path(); ELL(0, -65, 200, 18)(c); rgb(c, PA["yellow"]); c.fill()


def airbag(c):
    ink(c, R(-280, -70, 560, 140, 50), PA["orange"]); halftone(c, R(-280, -70, 560, 140, 50))
    for i in range(-2, 3):
        line(c, i * 100, -60, i * 100, 60, "rgba(0,0,0,.25)", 4)


def battery(c):
    ink(c, R(-110, -200, 220, 400, 24), PA["green"]); ink(c, R(-45, -235, 90, 40, 8), PA["steel"]); halftone(c, R(-110, -200, 220, 400, 24))
    if not _sil():
        c.new_path(); POLY([(20, -110), (-50, 20), (0, 20), (-20, 120), (50, -20), (0, -20)])(c); rgb(c, PA["yellow"]); c.fill()


def fridge(c, heat=0.0):
    ink(c, R(-230, -300, 460, 600, 14), PA["cream"])
    lerp = lambda a, b: int(a + (b - a) * heat)
    ink(c, R(-200, -250, 400, 500, 8), "#%02x%02x%02x" % (lerp(156, 240), lerp(199, 140), lerp(211, 60)))
    if _sil():
        return
    cols = [PA["red"], PA["yellow"], PA["green"], PA["teal"], PA["orange"]]
    for s in range(4):
        rgb(c, PA["steel"]); c.rectangle(-200, -130 + s * 120, 400, 8); c.fill()
        for i in range(5):
            rgb(c, cols[(i + s) % 5]); c.rectangle(-185 + i * 76, -200 + s * 120, 60, 70); c.fill()


def thermo(c, v=.7):
    ink(c, R(-40, -260, 80, 420, 40), PA["paper"]); ink(c, CIRC(0, 190, 70), PA["paper"])
    if _sil():
        return
    rgb(c, PA["red"]); c.arc(0, 190, 48, 0, TAU); c.fill(); h = 40 + v * 340; c.rectangle(-18, 170 - h, 36, h + 20); c.fill()
    for i in range(8):
        line(c, 40, -220 + i * 48, 58, -220 + i * 48, INK, 3)


def ctrl(c):
    ink(c, R(-200, -150, 400, 300, 18), PA["steel"]); halftone(c, R(-200, -150, 400, 300, 18)); ink(c, R(-160, -110, 320, 130, 8), PA["navy"])
    for i, color in enumerate((PA["red"], PA["yellow"], PA["green"])):
        ink(c, CIRC(-90 + i * 90, 85, 26), color)
    if not _sil():
        rgb(c, PA["green"]); c.rectangle(-120, -60, 240, 14); c.rectangle(-120, -30, 160, 14); c.fill()
        for i in range(3):
            c.new_path(); c.arc(0, -150, 50 + i * 45, -2.4, -.75); rgb(c, "rgba(29,26,23,.7)"); c.set_line_width(10); c.stroke()


def bin(c):
    body = POLY([(-170, -150), (170, -150), (140, 230), (-140, 230)]); ink(c, body, PA["green"]); halftone(c, body)
    ink(c, R(-200, -200, 400, 50, 12), PA["green"]); ink(c, R(-50, -235, 100, 40, 10), PA["green"])
    for i in (-1, 0, 1):
        line(c, i * 70, -110, i * 60, 190, "rgba(0,0,0,.3)", 8)


def flame(c):
    ink(c, SVG("M0,-220 C80,-120 150,-40 120,60 C100,140 40,180 0,180 C-40,180 -100,140 -120,60 C-150,-40 -60,-90 -30,-170 C-10,-110 10,-130 0,-220 Z"), PA["orange"])
    ink(c, SVG("M0,-80 C40,-20 70,30 55,90 C45,130 20,150 0,150 C-20,150 -50,130 -55,90 C-65,40 -20,0 0,-80 Z"), PA["yellow"], None)


# ---------- people, power, ideas ----------
def gorilla(c):
    for x, y, r in ((0, 0, 170), (-150, -20, 45), (150, -20, 45)):
        ink(c, CIRC(x, y, r), "#3b3530")
    ink(c, ELL(0, 40, 115, 110), "#7a6a5c")
    if _sil():
        return
    rgb(c, "#3b3530"); c.rectangle(-100, -40, 200, 26); c.fill(); rgb(c, INK)
    for x in (-45, 45):
        c.arc(x, 0, 14, 0, TAU); c.fill()
    for x in (-22, 22):
        c.new_path(); ELL(x, 55, 14, 9)(c); c.fill()
    c.new_path(); c.move_to(-40, 105); c.curve_to(-13, 98, 13, 98, 40, 105); c.set_line_width(6); c.stroke()


def person(c, shirt=PA["teal"]):
    ink(c, CIRC(0, -150, 55), PA["kraft"]); ink(c, R(-70, -90, 140, 190, 30), shirt); ink(c, R(-60, 95, 50, 130, 16), PA["navy"]); ink(c, R(10, 95, 50, 130, 16), PA["navy"])


def cage(c, gold=False):
    color = PA["yellow"] if gold else PA["steel"]
    ink(c, R(-200, 180, 400, 40, 10), color)
    dome = PATH(lambda g: g.move_to(-180, 180), lambda g: g.line_to(-180, -60), lambda g: g.curve_to(-60, -207, 60, -207, 180, -60), lambda g: g.line_to(180, 180))
    if _sil():
        ink(c, dome, PA["paper"]); return
    for i in range(-3, 4):
        line(c, i * 52, 180, i * 52, -60 - (3 - abs(i)) * 40, color, 8)
    ink(c, dome, None, color, 12); ink(c, CIRC(0, -240, 22), color)


def gold_cage(c):
    cage(c, True)


def eye(c):
    ink(c, PATH(lambda g: g.move_to(-250, 0), lambda g: g.curve_to(-83, -133, 83, -133, 250, 0), lambda g: g.curve_to(83, 133, -83, 133, -250, 0)), PA["paper"])
    ink(c, CIRC(0, 0, 85), PA["teal"]); ink(c, CIRC(0, 0, 38), INK)


def shield(c):
    ink(c, SVG("M0,-220 L180,-160 C180,40 120,150 0,220 C-120,150 -180,40 -180,-160 Z"), PA["teal"])
    halftone(c, SVG("M0,-220 L180,-160 C180,40 120,150 0,220 C-120,150 -180,40 -180,-160 Z"), "rgba(255,255,255,.15)")
    ink(c, SVG("M0,-140 L100,-105 C100,10 70,80 0,130 C-70,80 -100,10 -100,-105 Z"), PA["cream"])


def crown(c):
    p = POLY([(-200, 100), (-220, -110), (-110, -10), (0, -150), (110, -10), (220, -110), (200, 100)]); ink(c, p, PA["yellow"]); halftone(c, p)
    ink(c, R(-210, 90, 420, 50, 8), PA["kraftD"])
    for x in (-120, 0, 120):
        ink(c, CIRC(x, 115, 14), PA["red"])


def equal(c):
    ink(c, R(-180, -150, 360, 300, 20), PA["paper"]); ink(c, R(-110, -70, 220, 40, 10), PA["green"]); ink(c, R(-110, 30, 220, 40, 10), PA["green"])


def hand(c):
    ink(c, SVG("M-200,200 L-200,-20 C-200,-60 -150,-60 -150,-20 L-150,-160 C-150,-200 -100,-200 -100,-160 L-100,-200 C-100,-240 -50,-240 -50,-200 "
               "L-50,-180 C-50,-220 0,-220 0,-180 L0,-120 C0,-160 50,-160 50,-120 L50,200 Z"), "rgba(30,36,51,.85)", INK, 4)


# name -> draw function (props fit in about +/-340 x +/-300 units)
PROPS = {name: fn for name, fn in [
    ("robot", robot), ("cog", cog), ("db", db), ("key", key), ("laptop", laptop), ("car", car), ("watch", watch), ("calendar", calendar),
    ("box", box), ("card", card), ("counter", counter), ("chart_down", chart), ("chart_up", chart_up), ("doc", doc), ("coin", coin),
    ("lever", lever), ("chip", chip), ("phone", phone), ("tag", tag), ("safe", safe), ("ingot", ingot), ("ship", ship), ("plane", plane),
    ("bubble", bubble), ("folder", folder), ("trefoil", trefoil), ("book", book), ("lens", lens), ("form", form), ("badge", badge),
    ("passport", passport), ("funnel", funnel), ("plug", plug), ("humanoid", humanoid), ("furnace", furnace), ("airbag", airbag),
    ("battery", battery), ("fridge", fridge), ("thermo", thermo), ("ctrl", ctrl), ("bin", bin), ("flame", flame), ("gorilla", gorilla),
    ("person", person), ("cage", cage), ("gold_cage", gold_cage), ("eye", eye), ("shield", shield), ("crown", crown), ("equal", equal), ("hand", hand)]}
