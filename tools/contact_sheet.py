"""Build a labelled contact sheet of every PNG in /layers (checkerboard shows transparency)."""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
files = sorted(glob.glob('layers/*.png'))
CW, CH, COLS = 300, 330, 6
rows = (len(files) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * CW, rows * CH), (40, 40, 44))
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception: font = ImageFont.load_default()
def checker(w, h, s=10):
    c = Image.new('RGB', (w, h), (200, 200, 200)); d = ImageDraw.Draw(c)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2: d.rectangle([x, y, x + s - 1, y + s - 1], fill=(150, 150, 150))
    return c
for i, f in enumerate(files):
    im = Image.open(f).convert('RGBA'); im.thumbnail((CW - 20, CH - 60))
    bg = checker(*im.size); bg.paste(im, mask=im.getchannel('A'))
    x, y = (i % COLS) * CW, (i // COLS) * CH
    sheet.paste(bg, (x + 10, y + 10))
    d = ImageDraw.Draw(sheet)
    d.text((x + 10, y + CH - 44), f"{i+1:02d} {os.path.basename(f)[7:-4]}", fill=(255, 255, 255), font=font)
    d.text((x + 10, y + CH - 26), f"{Image.open(f).size[0]}x{Image.open(f).size[1]}", fill=(180, 180, 180), font=font)
sheet.save('docs/layer-contact-sheet.png')
print(sheet.size)
