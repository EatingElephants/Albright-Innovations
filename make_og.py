#!/usr/bin/env python3
"""
Makes the share images (the picture that shows when a page is pasted into Facebook,
Messenger, texts and so on). Brand colors only: cream, ink and the brand blue.

    How to run:   py -3 make_og.py

Needs the Pillow image library once:   py -3 -m pip install pillow
You only need to run this if you change the wording below; the images are saved in og/.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
FONT = ROOT / "src" / "fonts" / "Archivo-variable.ttf"
OUT = ROOT / "og"
W, H = 1200, 630
CREAM = (243, 240, 232)
INK = (21, 23, 28)
BLUE = (47, 75, 216)


def font(size, wdth, wght):
    f = ImageFont.truetype(str(FONT), size)
    axes = [a["name"] if isinstance(a.get("name"), str) else a["name"].decode() for a in f.get_variation_axes()]
    values = []
    for name in axes:
        key = name.lower()
        values.append(wdth if "width" in key or key == "wdth" else wght)
    f.set_variation_by_axes(values)
    return f


def draw_mark(d, x, y, size):
    """The split A with the blue bar, same points as the site's SVG (240 unit box)."""
    s = size / 240.0
    def pts(p):
        return [(x + a * s, y + b * s) for a, b in p]
    d.polygon(pts([(20, 220), (100, 20), (103, 20), (103, 220)]), fill=INK)
    d.polygon(pts([(137, 220), (137, 20), (140, 20), (220, 220)]), fill=INK)
    d.rectangle([x + 109 * s, y + 2 * s, x + 131 * s, y + 220 * s], fill=BLUE)


def spaced(d, x, y, text, f, fill, spacing):
    """Letter-spaced caps, the way the site's labels are set."""
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill, anchor="ls")
        x += f.getlength(ch) + spacing
    return x


def wordmark(d, x, y, f):
    """ALBRIGHT INNOVATIONS with the A and the I in blue."""
    for word in ("Albright", "Innovations"):
        first, rest = word[0].upper(), word[1:].upper()
        d.text((x, y), first, font=f, fill=BLUE, anchor="ls")
        x += f.getlength(first)
        d.text((x, y), rest, font=f, fill=INK, anchor="ls")
        x += f.getlength(rest) + f.getlength(" ") * 0.9
    return x


def make(name, headline_lines, sub):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 18, H], fill=BLUE)
    draw_mark(d, 84, 92, 150)
    wordmark(d, 268, 206, font(50, 100, 400))
    spaced(d, 270, 244, "AUTHENTIC INFLUENCE", font(20, 70, 600), (90, 88, 80), 5)
    y = 372
    big = font(58, 125, 600)
    for line in headline_lines:
        d.text((84, y), line, font=big, fill=INK, anchor="ls")
        y += 66
    d.text((84, 540), sub, font=font(26, 100, 500), fill=(90, 88, 80), anchor="ls")
    spaced(d, 84, 586, "ALBRIGHT-INNOVATIONS.COM", font(18, 70, 600), BLUE, 4)
    OUT.mkdir(exist_ok=True)
    img.save(OUT / name, optimize=True)
    print("  wrote og/" + name, (OUT / name).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    make("share.png",
         ["You built the business.", "We handle the headaches."],
         "Marketing and operations for small businesses. Big Rapids, MI and Waxhaw, NC.")
    make("answers.png",
         ["Straight answers", "for busy owners."],
         "Sourced, plain-English answers about the office side of a small business.")
