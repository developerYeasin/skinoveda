"""
Skinoveda photo grading.

Pushes the stock photography into the brand's purple-and-gold look so the
imagery matches the design reference instead of looking like generic stock.

  shadows   -> deep purple    #2A0834
  midtones  -> orchid purple  #8A3BA3
  highlights-> warm gold      #F0DCB4

plus a soft bloom, saturation/contrast lift and a gentle vignette.

Usage:
    python tools/grade_photos.py              # grade every photo
    python tools/grade_photos.py hero-alt     # grade one photo
    python tools/grade_photos.py --strength .8
"""

import os
import sys
from PIL import Image, ImageEnhance, ImageFilter, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
STOCK = os.path.join(HERE, "..", "backend", "uploads", "stock")
RAW = os.path.join(STOCK, "_raw")

# multi-stop ramp: near-black plum -> deep purple -> orchid -> gold -> warm cream.
# Matching the reference means keeping plenty of dark range and pushing the
# highlights to gold rather than white.
RAMP = [
    (0.00, (20, 4, 28)),
    (0.22, (58, 15, 71)),
    (0.45, (111, 35, 133)),
    (0.66, (160, 78, 186)),
    (0.84, (212, 169, 106)),
    (1.00, (246, 230, 196)),
]

# photos of herbs/products take a lighter grade so they stay readable
LIGHT_GRADE = {"cat-naturopathy", "treat-3", "treat-4", "collection"}

# photos where a face is the subject: keep the skin warm and let the
# surroundings carry the purple, the way the reference art does
FACES = {
    "doctor", "doc-ayesha", "doc-tanvir", "doc-nusrat",
    "hero-alt", "ba-1", "ba-2", "ba-3", "ba-4",
    "cat-aesthetic", "cat-skin", "cat-women", "treat-1",
    "blog-melasma", "blog-laser", "blog-pcos",
    "treat-acupuncture", "treat-facemask", "treat-cream",
}

# portraits take a gentler overall grade
PORTRAIT = {"doctor", "doc-ayesha", "doc-tanvir", "doc-nusrat",
            "hero-alt", "ba-1", "ba-2", "ba-3", "ba-4"}

# Close-up faces fill the frame, so a heavy grade blotches the skin no matter
# how good the mask is. These get a light touch instead.
CLOSE_UP = {
    "cat-aesthetic": 0.34,
    "cat-skin": 0.34,
    "cat-women": 0.34,
    "treat-1": 0.32,
    "blog-melasma": 0.34,
    "blog-laser": 0.34,
    "blog-pcos": 0.40,
    "ba-1": 0.34,
    "ba-2": 0.34,
    "ba-3": 0.34,
    "ba-4": 0.32,
    "doctor": 0.72,
    "doc-ayesha": 0.70,
    "doc-tanvir": 0.66,
    "doc-nusrat": 0.66,
    "treat-facemask": 0.38,
    "treat-acupuncture": 0.44,
    "treat-cream": 0.40,
}


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def ramp_at(t):
    """Sample the multi-stop ramp at 0..1."""
    for i in range(len(RAMP) - 1):
        t0, c0 = RAMP[i]
        t1, c1 = RAMP[i + 1]
        if t0 <= t <= t1:
            return lerp(c0, c1, (t - t0) / (t1 - t0))
    return RAMP[-1][1]


def build_lut():
    """256-entry gradient map from the ramp above."""
    r, g, b = [], [], []
    for i in range(256):
        # a slight S-curve keeps the darks dark instead of washing to lavender
        t = i / 255.0
        t = t * t * (3 - 2 * t)
        c = ramp_at(t)
        r.append(c[0]); g.append(c[1]); b.append(c[2])
    return r + g + b


LUT = build_lut()


def bloom(img, radius=18, amount=0.28):
    """Soft highlight glow, like the lighting in the reference art."""
    blurred = img.filter(ImageFilter.GaussianBlur(radius))
    return Image.blend(img, ImageChops.screen(img, blurred), amount)


def vignette(img, strength=0.30):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    # a radial falloff built from a scaled ellipse
    grad = Image.new("L", (w * 2, h * 2), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(grad)
    d.ellipse((0, 0, w * 2, h * 2), fill=255)
    grad = grad.resize((w, h)).filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    mask = grad
    dark = Image.new("RGB", (w, h), (30, 6, 38))
    return Image.composite(img, Image.blend(img, dark, strength), mask)


def skin_mask(img):
    """
    White where the pixel looks like skin.

    The reference art keeps faces warm and luminous while the room around them
    goes deep purple, so the grade has to leave skin largely alone.
    """
    h, s, v = img.convert("HSV").split()
    hp, sp, vp = h.load(), s.load(), v.load()
    w, ht = img.size
    mask = Image.new("L", (w, ht), 0)
    mp = mask.load()

    for y in range(ht):
        for x in range(w):
            hue, sat, val = hp[x, y], sp[x, y], vp[x, y]
            # skin hues sit at the warm end of the wheel, at modest saturation
            warm = hue <= 28 or hue >= 238
            if warm and 25 <= sat <= 170 and val >= 55:
                mp[x, y] = 255

    # feather it so there is no cut-out edge
    return mask.filter(ImageFilter.GaussianBlur(max(3, min(w, ht) // 90)))


def grade(path, out_path, strength=0.62, warmth=1.0, protect_skin=True):
    original = Image.open(path).convert("RGB")

    # 1. tone: lift contrast and saturation so the grade has something to bite on
    img = ImageEnhance.Contrast(original).enhance(1.16)
    img = ImageEnhance.Color(img).enhance(1.18)
    img = ImageEnhance.Brightness(img).enhance(0.96)   # the reference is moody, not bright

    base = img

    # 2. split-tone via a luminance gradient map, blended over the base
    toned = img.convert("L").convert("RGB").point(LUT)
    img = Image.blend(base, toned, strength)

    # 3. put the skin back, warmed rather than purpled
    if protect_skin:
        small = base.resize((base.width // 4, base.height // 4))
        mask = skin_mask(small).resize(base.size, Image.BILINEAR)
        # skin keeps its own colour with only a light wash of the grade
        skin = Image.blend(base, toned, strength * 0.22)
        skin = ImageEnhance.Color(skin).enhance(1.12)
        skin = ImageEnhance.Brightness(skin).enhance(1.06)
        img = Image.composite(skin, img, mask)

    # 4. warm golden bloom in the highlights
    img = bloom(img, radius=max(12, min(img.size) // 40), amount=0.24 * warmth)

    # 5. settle it back toward a believable image
    img = ImageEnhance.Color(img).enhance(1.10)
    img = ImageEnhance.Contrast(img).enhance(1.06)
    img = vignette(img, 0.30)

    img.save(out_path, "JPEG", quality=88, optimize=True)
    return img.size


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strength_arg = next((a for a in sys.argv[1:] if a.startswith("--strength")), None)
    override = float(strength_arg.split("=")[1]) if strength_arg and "=" in strength_arg else None

    os.makedirs(RAW, exist_ok=True)

    # keep an untouched copy of every photo so grading is always repeatable
    for f in os.listdir(STOCK):
        if f.endswith(".jpg") and not os.path.exists(os.path.join(RAW, f)):
            Image.open(os.path.join(STOCK, f)).convert("RGB").save(
                os.path.join(RAW, f), "JPEG", quality=94
            )

    names = args or [f[:-4] for f in sorted(os.listdir(RAW)) if f.endswith(".jpg")]
    for name in names:
        src = os.path.join(RAW, name + ".jpg")
        if not os.path.exists(src):
            print(f"  skip  {name} (no raw copy)")
            continue

        if override is not None:
            s = override
        elif name in CLOSE_UP:
            s = CLOSE_UP[name]
        elif name in PORTRAIT:
            s = 0.62          # background goes purple, skin stays warm
        elif name in LIGHT_GRADE:
            s = 0.58
        else:
            s = 0.72

        faces = name in FACES
        size = grade(src, os.path.join(STOCK, name + ".jpg"),
                     strength=s, protect_skin=faces)
        print(f"  graded {name:<18} strength {s:.2f}  "
              f"{'skin-safe' if faces else 'full     '}  {size[0]}x{size[1]}")

    print(f"\nDone. Raw originals kept in {os.path.relpath(RAW, HERE)}")


if __name__ == "__main__":
    main()
