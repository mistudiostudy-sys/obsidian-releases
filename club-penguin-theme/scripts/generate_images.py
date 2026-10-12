"""Generates the PNG images used by the themes.

    python3 scripts/generate_images.py

Requires Pillow (pip install pillow). Everything is drawn from scratch
(original fan art inspired by Club Penguin, no official assets).
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SS = 2  # supersampling factor for smooth edges

random.seed(31)


def ellipse_poly(cx, cy, rx, ry, angle_deg=0.0, steps=64):
    a = math.radians(angle_deg)
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts


def lerp(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


# ---------------------------------------------------------------- characters

def draw_penguin(d, cx, top, s, body, hat=None, accessory=None):
    """Draws a Club-Penguin-style penguin. Geometry mirrors media/pet.js (64x80 units)."""
    X = lambda x: cx + (x - 32) * s
    Y = lambda y: top + y * s
    E = lambda x, y, rx, ry, **kw: d.ellipse([X(x - rx), Y(y - ry), X(x + rx), Y(y + ry)], **kw)
    dark = lerp(body, (0, 0, 0), 0.2)
    orange, orange_dark = (255, 160, 0), (201, 106, 0)

    E(24, 76, 8, 3.5, fill=orange, outline=orange_dark, width=max(1, int(s)))
    E(40, 76, 8, 3.5, fill=orange, outline=orange_dark, width=max(1, int(s)))
    d.polygon([(X(x), Y(y)) for x, y in ellipse_poly(13, 48, 5, 14, 22)], fill=dark)
    d.polygon([(X(x), Y(y)) for x, y in ellipse_poly(51, 48, 5, 14, -22)], fill=dark)
    E(32, 51, 20, 24, fill=body)
    E(32, 26, 16, 16, fill=body)
    E(32, 55, 14, 19, fill=(255, 255, 255))
    E(32, 27, 13, 8.5, fill=(255, 255, 255))
    E(26.5, 21, 7, 5.5, fill=(255, 255, 255))
    E(37.5, 21, 7, 5.5, fill=(255, 255, 255))
    for ex in (27, 37):
        E(ex, 23, 2.7, 3.7, fill=(17, 17, 17))
        E(ex + 0.9, 21.6, 0.95, 0.95, fill=(255, 255, 255))
    d.polygon([(X(25.5), Y(29)), (X(32), Y(27)), (X(38.5), Y(29)), (X(32), Y(32.5))], fill=orange, outline=orange_dark)
    E(22, 30, 2.4, 1.4, fill=lerp((255, 255, 255), (255, 138, 168), 0.55))
    E(42, 30, 2.4, 1.4, fill=lerp((255, 255, 255), (255, 138, 168), 0.55))

    if accessory == "scarf":
        d.polygon([(X(16), Y(37)), (X(32), Y(41.5)), (X(48), Y(37)), (X(48), Y(42.5)), (X(32), Y(47)), (X(16), Y(42.5))], fill=(255, 138, 31))
        d.polygon([(X(37), Y(43)), (X(44), Y(42)), (X(45), Y(57)), (X(39), Y(58))], fill=(214, 100, 10))
    if hat == "witch":
        d.polygon([(X(22), Y(13)), (X(33), Y(-14)), (X(37), Y(-8)), (X(42), Y(13))], fill=(59, 33, 96))
        d.polygon([(X(23.3), Y(9.5)), (X(40.9), Y(9.5)), (X(41.7), Y(13)), (X(22.5), Y(13))], fill=(255, 138, 31))
        E(32, 14, 21, 3.6, fill=(42, 24, 64))
    elif hat == "propeller":
        d.pieslice([X(17), Y(-1), X(47), Y(35)], 180, 360, fill=(232, 52, 58))
        d.polygon([(X(32), Y(2)), (X(24), Y(8)), (X(21), Y(16)), (X(27), Y(16)), (X(28), Y(8))], fill=(255, 210, 31))
        d.polygon([(X(32), Y(2)), (X(40), Y(8)), (X(43), Y(16)), (X(37), Y(16)), (X(36), Y(8))], fill=(45, 127, 249))
        d.polygon([(X(44), Y(15)), (X(55), Y(15)), (X(54), Y(18)), (X(44), Y(18))], fill=(45, 127, 249))
        d.rectangle([X(31), Y(-3), X(33), Y(3)], fill=(68, 68, 68))
        E(32, -3, 10, 1.8, fill=(255, 210, 31))


def draw_puffle(d, cx, cy, r, color):
    dark = lerp(color, (0, 0, 0), 0.25)
    k = r / 14
    P = lambda x, y: (cx + (x - 20) * k, cy + (y - 25) * k)
    d.polygon([P(13, 14), P(10, 3), P(17, 9), P(19, 0), P(22, 9), P(29, 2), P(27, 14)], fill=dark)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    for ex in (15.5, 25.5):
        x, y = P(ex, 23)
        d.ellipse([x - 3.8 * k, y - 4.8 * k, x + 3.8 * k, y + 4.8 * k], fill=(255, 255, 255))
        x, y = P(ex + 1.3, 23.8)
        d.ellipse([x - 2.1 * k, y - 2.1 * k, x + 2.1 * k, y + 2.1 * k], fill=(17, 17, 17))
    d.arc([*P(17, 26.5), *P(25, 33)], 20, 160, fill=(17, 17, 17), width=max(1, int(1.4 * k)))


def draw_pumpkin(d, cx, cy, w, h, lit=True):
    body, ridge = (255, 128, 20), (214, 92, 0)
    d.rectangle([cx - w * 0.05, cy - h * 0.62, cx + w * 0.05, cy - h * 0.38], fill=(70, 120, 40))
    for off in (-0.3, 0.3, 0):
        d.ellipse([cx + off * w - w * 0.32, cy - h / 2, cx + off * w + w * 0.32, cy + h / 2], fill=body, outline=ridge, width=max(1, int(w / 60)))
    if lit:
        glow = (255, 225, 90)
        for sx in (-1, 1):
            ex = cx + sx * w * 0.2
            d.polygon([(ex - w * 0.08, cy - h * 0.05), (ex + w * 0.08, cy - h * 0.05), (ex, cy - h * 0.22)], fill=glow)
        d.polygon([(cx - w * 0.3, cy + h * 0.08), (cx + w * 0.3, cy + h * 0.08), (cx + w * 0.18, cy + h * 0.28),
                   (cx + w * 0.06, cy + h * 0.18), (cx - w * 0.06, cy + h * 0.28), (cx - w * 0.18, cy + h * 0.18)], fill=glow)


def draw_bat(d, cx, cy, span, color=(12, 4, 20)):
    s = span / 2
    pts = [(cx, cy - s * 0.12), (cx - s * 0.15, cy - s * 0.3), (cx - s * 0.3, cy - s * 0.25), (cx - s * 0.6, cy - s * 0.35),
           (cx - s, cy - s * 0.1), (cx - s * 0.75, cy - s * 0.05), (cx - s * 0.6, cy + s * 0.15), (cx - s * 0.4, cy + s * 0.02),
           (cx - s * 0.25, cy + s * 0.2), (cx, cy + s * 0.08)]
    full = pts + [(2 * cx - x, y) for x, y in reversed(pts)]
    d.polygon(full, fill=color)


def draw_ghost(d, cx, cy, size):
    w = size
    d.ellipse([cx - w / 2, cy - w / 2, cx + w / 2, cy + w / 2], fill=(245, 240, 255))
    d.rectangle([cx - w / 2, cy, cx + w / 2, cy + w * 0.55], fill=(245, 240, 255))
    for i in range(4):
        x0 = cx - w / 2 + i * w / 4
        d.pieslice([x0, cy + w * 0.4, x0 + w / 4, cy + w * 0.7], 0, 180, fill=(245, 240, 255))
    for sx in (-1, 1):
        d.ellipse([cx + sx * w * 0.17 - w * 0.07, cy - w * 0.1, cx + sx * w * 0.17 + w * 0.07, cy + w * 0.1], fill=(30, 15, 45))
    d.ellipse([cx - w * 0.08, cy + w * 0.14, cx + w * 0.08, cy + w * 0.3], fill=(30, 15, 45))


# ---------------------------------------------------------------- images

def ntp_background():
    W, H = 1920 * SS, 1080 * SS
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)

    stops = [(0.0, (14, 5, 30)), (0.45, (52, 18, 84)), (0.72, (120, 40, 100)), (0.86, (200, 90, 50))]
    for y in range(H):
        t = y / H
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                d.line([(0, y), (W, y)], fill=lerp(c0, c1, (t - t0) / (t1 - t0)))
                break
        else:
            d.line([(0, y), (W, y)], fill=stops[-1][1])

    for _ in range(260):
        x, y, r = random.uniform(0, W), random.uniform(0, H * 0.6), random.uniform(0.6, 2.2) * SS
        d.ellipse([x - r, y - r, x + r, y + r], fill=lerp((255, 255, 255), (255, 220, 160), random.random()))

    # Moon glow + moon
    mx, my, mr = 1460 * SS, 250 * SS, 140 * SS
    gr = int(mr * 2.6)
    glow = Image.radial_gradient("L").point(lambda v: int(max(0.0, 1 - v / 128) ** 2 * 120)).resize((2 * gr, 2 * gr), Image.BICUBIC)
    img.paste((255, 200, 120), (mx - gr, my - gr), mask=glow)
    d = ImageDraw.Draw(img)
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(255, 236, 180))
    for ox, oy, rr in ((-40, -30, 26), (50, 40, 18), (10, 70, 14), (-60, 50, 12), (60, -50, 10)):
        d.ellipse([mx + (ox - rr) * SS, my + (oy - rr) * SS, mx + (ox + rr) * SS, my + (oy + rr) * SS], fill=(240, 214, 150))

    for bx, by, span in ((1300, 170, 70), (1560, 330, 50), (1640, 140, 40), (420, 160, 60), (560, 260, 36), (980, 110, 44), (1120, 300, 30)):
        draw_bat(d, bx * SS, by * SS, span * SS)

    # Back hills + haunted lighthouse
    d.polygon([(0, 760 * SS), (300 * SS, 690 * SS), (700 * SS, 740 * SS), (1100 * SS, 680 * SS), (1500 * SS, 650 * SS),
               (1920 * SS, 700 * SS), (W, H), (0, H)], fill=(88, 62, 140))
    lx, ly = 1660 * SS, 655 * SS
    d.polygon([(lx - 38 * SS, ly), (lx + 38 * SS, ly), (lx + 22 * SS, ly - 230 * SS), (lx - 22 * SS, ly - 230 * SS)], fill=(44, 22, 66))
    for k in range(3):
        y0 = ly - (60 + k * 60) * SS
        d.rectangle([lx - 40 * SS, y0 - 14 * SS, lx + 40 * SS, y0], fill=(36, 16, 54))
    d.rectangle([lx - 26 * SS, ly - 270 * SS, lx + 26 * SS, ly - 230 * SS], fill=(255, 190, 60))
    d.polygon([(lx - 34 * SS, ly - 270 * SS), (lx + 34 * SS, ly - 270 * SS), (lx, ly - 310 * SS)], fill=(44, 22, 66))
    beam = Image.new("L", (W, H), 0)
    ImageDraw.Draw(beam).polygon([(lx, ly - 250 * SS), (lx - 420 * SS, ly - 300 * SS), (lx - 420 * SS, ly - 220 * SS)], fill=45)
    beam = beam.filter(ImageFilter.GaussianBlur(6 * SS))
    img.paste((255, 210, 120), mask=beam)
    d = ImageDraw.Draw(img)

    # Front snow hill (purple tinted by the night)
    d.polygon([(0, 850 * SS), (420 * SS, 800 * SS), (900 * SS, 830 * SS), (1400 * SS, 790 * SS), (1920 * SS, 840 * SS), (W, H), (0, H)],
              fill=(206, 196, 238))
    d.polygon([(0, 930 * SS), (700 * SS, 900 * SS), (1300 * SS, 920 * SS), (1920 * SS, 900 * SS), (W, H), (0, H)], fill=(225, 218, 248))

    # Igloo
    ix, iy, ir = 330 * SS, 860 * SS, 150 * SS
    d.pieslice([ix - ir, iy - ir, ix + ir, iy + ir], 180, 360, fill=(236, 232, 255), outline=(170, 158, 210), width=3 * SS)
    for k in range(1, 4):
        yy = iy - k * ir / 4
        half = math.sqrt(max(0, ir ** 2 - (iy - yy) ** 2))
        d.line([(ix - half, yy), (ix + half, yy)], fill=(170, 158, 210), width=3 * SS)
    d.pieslice([ix + 30 * SS, iy - 90 * SS, ix + 130 * SS, iy + 90 * SS], 180, 360, fill=(40, 20, 50))
    d.rectangle([ix + 30 * SS, iy - 2 * SS, ix + 130 * SS, iy + 4 * SS], fill=(40, 20, 50))

    # Pumpkins, ghost, penguin, puffle
    draw_pumpkin(d, 560 * SS, 880 * SS, 110 * SS, 80 * SS)
    draw_pumpkin(d, 660 * SS, 905 * SS, 70 * SS, 52 * SS)
    draw_pumpkin(d, 1360 * SS, 870 * SS, 130 * SS, 95 * SS)
    draw_pumpkin(d, 1480 * SS, 900 * SS, 80 * SS, 60 * SS, lit=False)
    draw_ghost(d, 1180 * SS, 520 * SS, 90 * SS)

    draw_penguin(d, 960 * SS, 610 * SS, 3.6 * SS, (124, 63, 200), hat="witch", accessory="scarf")
    draw_puffle(d, 1110 * SS, 860 * SS, 44 * SS, (255, 147, 48))
    draw_puffle(d, 810 * SS, 870 * SS, 34 * SS, (43, 43, 43))

    out = img.resize((1920, 1080), Image.LANCZOS)
    out.save(ROOT / "chrome-theme-halloween/images/ntp_background.png", optimize=True)


def frame():
    W, H = 1200, 120
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp((44, 18, 74), (26, 10, 44), y / H))
    for _ in range(70):
        x, y, r = random.uniform(0, W), random.uniform(0, H), random.uniform(0.4, 1.3)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 220, 170))
    for bx, by, span in ((140, 30, 22), (520, 60, 16), (860, 25, 20), (1080, 70, 14)):
        draw_bat(d, bx, by, span, color=(14, 4, 24))
    img.save(ROOT / "chrome-theme-halloween/images/frame.png", optimize=True)


def icon():
    S = 128 * 4
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=S // 5, fill=(11, 42, 74))
    d.ellipse([-S * 0.2, S * 0.78, S * 1.2, S * 1.4], fill=(225, 240, 255))
    draw_penguin(d, S / 2, S * 0.17, S / 104, (29, 95, 209), hat="propeller")
    img.resize((128, 128), Image.LANCZOS).save(ROOT / "vscode-extension/media/icon.png", optimize=True)


if __name__ == "__main__":
    ntp_background()
    frame()
    icon()
    print("Imágenes generadas ✔")
