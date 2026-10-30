"""Rebuild the flyer from /layers using PSD offsets, stack order and blend modes; diff against final flyer.jpg."""
import re, sys, numpy as np
from PIL import Image
from psd_tools import PSDImage
p = PSDImage.open('poster.psd')
names = {re.sub(r'[^A-Za-z0-9]+', '-', l.name).strip('-'): l for l in p}
import glob, os
files = {re.sub(r'poster_\d+_', '', os.path.basename(f))[:-4]: f for f in glob.glob('layers/*.png')}
W, H = 1080, 1350
canvas = np.ones((H, W, 3))
final = np.asarray(Image.open('final flyer.jpg').convert('RGB'), float) / 255
def blend(cb, cs, mode):
    if mode == 'MULTIPLY': return cb * cs
    if mode == 'SCREEN': return cb + cs - cb * cs
    if mode == 'LIGHTEN': return np.maximum(cb, cs)
    return cs
order = []
for l in p:                       # bottom -> top
    key = re.sub(r'[^A-Za-z0-9]+', '-', l.name).strip('-')
    if key not in files or not l.visible: continue
    im = Image.open(files[key]).convert('RGBA'); a = np.asarray(im, float) / 255
    x0, y0 = max(l.bbox[0], 0), max(l.bbox[1], 0)
    if key.startswith('Layer-30') or key.startswith('Layer-2-copy-9') or key.startswith('Layer-2-copy-10') or True:
        # export is trimmed to canvas-visible bbox; find offset via PSD composite alpha bbox
        c = l.composite(viewport=(0, 0, W, H)); bb = c.convert('RGBA').getchannel('A').getbbox() if c else None
        if bb: x0, y0 = bb[0], bb[1]
    h, w = a.shape[:2]
    reg = canvas[y0:y0+h, x0:x0+w]; h2, w2 = reg.shape[:2]; a = a[:h2, :w2]
    al = a[..., 3:4] * (l.opacity / 255)
    out = (1 - al) * reg + al * blend(reg, a[..., :3], l.blend_mode.name)
    canvas[y0:y0+h2, x0:x0+w2] = out
    order.append((key, x0, y0, w, h, l.blend_mode.name))
Image.fromarray((canvas * 255).astype('uint8')).save('docs/rebuild-from-layers.png')
d = np.abs(canvas - final)
print('mean abs diff vs final flyer: %.4f  (p99 %.3f)' % (d.mean(), np.percentile(d, 99)))
for o in order: print(o)
