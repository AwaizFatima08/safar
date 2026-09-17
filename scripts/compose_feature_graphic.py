#!/usr/bin/env python3
"""
compose_feature_graphic.py — regenerates store-assets/feature-graphic-1024x500.png.

Gemini-generated images cannot be trusted to render Urdu (or any) text
correctly — see the commit that introduced this script for an example of
garbled Nastaliq from a first attempt. So the Gemini background is
generated text-free, and the actual "Urdu Safar" branding is composited
on top here using the same real font files and RTL shaping (Pillow's
raqm layout engine) the app itself uses, guaranteeing correct glyph
shaping regardless of what an image model would draw.

Requires: Pillow with raqm support (the pip wheel bundles it), and the
three font files fetched into /tmp/fonts by the commands in this
script's header comment below (not vendored into the repo — re-fetch
if regenerating on a fresh machine):

  curl -fsSL -o /tmp/fonts/NotoNastaliqUrdu.ttf \
    "https://raw.githubusercontent.com/google/fonts/main/ofl/notonastaliqurdu/NotoNastaliqUrdu%5Bwght%5D.ttf"
  curl -fsSL -o /tmp/fonts/Fraunces.ttf \
    "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
  curl -fsSL -o /tmp/fonts/Karla.ttf \
    "https://raw.githubusercontent.com/google/fonts/main/ofl/karla/Karla%5Bwght%5D.ttf"

Usage:
  node scripts/gemini_image.js "<background prompt, explicitly NO TEXT>" /tmp/gen-assets/feature_bg.png
  # crop/resize to 1024x500 if Gemini didn't return that aspect ratio, then:
  python3 scripts/compose_feature_graphic.py <path-to-1024x500-background.png>
"""
import sys
from PIL import Image, ImageDraw, ImageFont

INK = "#1E3A34"
MARIGOLD = "#C97A17"
INK_SOFT = "#54685F"
FONT_DIR = "/tmp/fonts"


def main():
    if len(sys.argv) != 2:
        print("Usage: compose_feature_graphic.py <background-1024x500.png>")
        sys.exit(1)
    bg_path = sys.argv[1]

    bg = Image.open(bg_path).convert("RGB")
    if bg.size != (1024, 500):
        print(f"Warning: background is {bg.size}, expected (1024, 500) — resizing.")
        bg = bg.resize((1024, 500), Image.LANCZOS)
    draw = ImageDraw.Draw(bg)

    fraunces = ImageFont.truetype(f"{FONT_DIR}/Fraunces.ttf", 72, layout_engine=ImageFont.LAYOUT_RAQM)
    fraunces.set_variation_by_axes([600, 9])  # wght, opsz
    nastaliq = ImageFont.truetype(f"{FONT_DIR}/NotoNastaliqUrdu.ttf", 56, layout_engine=ImageFont.LAYOUT_RAQM)
    nastaliq.set_variation_by_axes([700])
    karla = ImageFont.truetype(f"{FONT_DIR}/Karla.ttf", 24, layout_engine=ImageFont.LAYOUT_RAQM)
    karla.set_variation_by_axes([700])

    en_x, en_y = 56, 90
    draw.text((en_x, en_y), "Urdu Safar", font=fraunces, fill=INK)
    bbox = draw.textbbox((en_x, en_y), "Urdu Safar", font=fraunces)
    en_bottom, en_right = bbox[3], bbox[2]

    ur_x = en_right + 24
    ur_bbox = draw.textbbox((0, 0), "سفر", font=nastaliq)
    ur_h = ur_bbox[3] - ur_bbox[1]
    ur_y = en_bottom - ur_h - ur_bbox[1] - 6
    draw.text((ur_x, ur_y), "سفر", font=nastaliq, fill=MARIGOLD)

    draw.text((en_x + 4, en_bottom + 40), "O LEVEL & IGCSE URDU PRACTICE", font=karla, fill=INK_SOFT)

    out_path = "store-assets/feature-graphic-1024x500.png"
    bg.save(out_path)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
