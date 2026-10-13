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


def draw_mark(d, x, y, size, fill=INK):
    """The split A with the blue bar, same points as the site's SVG (240 unit box)."""
    s = size / 240.0
    def pts(p):
        return [(x + a * s, y + b * s) for a, b in p]
    d.polygon(pts([(20, 220), (100, 20), (103, 20), (103, 220)]), fill=fill)
    d.polygon(pts([(137, 220), (137, 20), (140, 20), (220, 220)]), fill=fill)
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


def fit(lines, size, wdth, wght, max_width):
    """Shrink the headline until every line fits the picture."""
    while size > 24:
        f = font(size, wdth, wght)
        if all(f.getlength(line) <= max_width for line in lines):
            return f, size
        size -= 2
    return font(size, wdth, wght), size


def make(name, headline_lines, sub):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 18, H], fill=BLUE)
    draw_mark(d, 84, 92, 150)
    wordmark(d, 268, 206, font(50, 100, 400))
    spaced(d, 270, 244, "AUTHENTIC INFLUENCE", font(20, 70, 600), (90, 88, 80), 5)
    y = 372
    big, size = fit(headline_lines, 58, 125, 600, W - 84 - 60)
    for line in headline_lines:
        d.text((84, y), line, font=big, fill=INK, anchor="ls")
        y += int(size * 1.14)
    d.text((84, 540), sub, font=fit([sub], 26, 100, 500, W - 84 - 60)[0], fill=(90, 88, 80), anchor="ls")
    spaced(d, 84, 586, "ALBRIGHT-INNOVATIONS.COM", font(18, 70, 600), BLUE, 4)
    OUT.mkdir(exist_ok=True)
    img.save(OUT / name, optimize=True)
    print("  wrote og/" + name, (OUT / name).stat().st_size // 1024, "KB")


def poster(name, headline_lines, sub):
    """A 16:9 poster for the video slot on /free-website, in the same brand layout."""
    PW, PH = 1280, 720
    img = Image.new("RGB", (PW, PH), INK)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 18, PH], fill=BLUE)
    draw_mark(d, 90, 110, 150, fill=CREAM)
    y = 440
    big, size = fit(headline_lines, 64, 125, 600, PW - 90 - 70)
    for line in headline_lines:
        d.text((90, y), line, font=big, fill=CREAM, anchor="ls")
        y += int(size * 1.14)
    d.text((90, 610), sub, font=fit([sub], 26, 100, 500, PW - 90 - 70)[0], fill=(168, 164, 154), anchor="ls")
    spaced(d, 90, 660, "ALBRIGHT-INNOVATIONS.COM", font(18, 70, 600), (138, 155, 255), 4)
    out = ROOT / "img" / name
    img.save(out, optimize=True)
    print("  wrote img/" + name, out.stat().st_size // 1024, "KB")


IMAGES = {
    "share.png": (["You built the business.", "We handle the headaches."],
                  "Marketing and operations for small businesses. Big Rapids, MI and Waxhaw, NC."),
    "answers.png": (["Straight answers", "for busy owners."],
                    "Sourced, plain-English answers about the office side of a small business."),
    "free-website.png": (["A free website", "for your business."],
                         "Clean, modern, yours to keep. Waxhaw, South Charlotte and the Big Rapids area."),
    "operations.png": (["Hours lost to busywork?", "Let's talk."],
                       "We help owners find where the week goes and fix it, one step at a time."),
    "contractors.png": (["You're on the job.", "Who's answering your website?"],
                        "A 24/7 assistant that answers questions and sends you the lead."),
}

if __name__ == "__main__":
    import sys
    # With no arguments, every image is made. Or name the ones you want:  py -3 make_og.py operations.png
    wanted = sys.argv[1:] or list(IMAGES) + ["poster"]
    for name in wanted:
        if name == "poster":
            poster("free-website-poster.png", ["You built the business.", "We help it grow."], "The free website offer, in about two minutes.")
        elif name in IMAGES:
            make(name, *IMAGES[name])
        else:
            sys.exit(f"Don't know how to make {name}. Choose from: {', '.join(IMAGES)}, poster")
