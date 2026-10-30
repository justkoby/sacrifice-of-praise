"""Build src/config/layers.json + docs/LAYER_MANIFEST.md from poster.psd (positions/blend modes) and /layers (pixels).
Order = PSD stacking order, bottom -> top. Verified against `final flyer.jpg` by tools/verify_stack.py."""
import glob, json, os, re
from PIL import Image
from psd_tools import PSDImage

# psd layer key -> (id, role, depth(parallax -1 far .. 1 near), description)
META = [
 ('Background',      'bg-base',            'background', -1.0, 'Opaque white base'),
 ('Layer-14',        'bg-silk',            'background', -0.9, 'Soft silk/fold texture (Multiply)'),
 ('Layer-25',        'bg-facets',          'background', -0.8, 'Faceted white polygon texture'),
 ('Color-Fill-1',    'bg-tint',            'background', -0.8, 'Flat light-grey tint (Multiply)'),
 ('Layer-21',        'ornament-v-main',    'ornament',   -0.6, 'Large gold geometric "V" (Adinkra-style pattern), rear'),
 ('Layer-21-copy',   'ornament-v-mid',     'ornament',   -0.5, 'Gold V, middle copy'),
 ('Layer-21-copy-2', 'ornament-v-top',     'ornament',   -0.4, 'Gold V, upper fragments'),
 ('Layer-2-copy-2',  'glare-corner',       'glare',      -0.4, 'Warm gold corner glow (Screen)'),
 ('Layer-2-copy-3',  'glare-left',         'glare',      -0.3, 'Gold glow, left edge (Screen)'),
 ('Layer-2-copy-6',  'glare-bloom',        'glare',      -0.3, 'Large central gold bloom (Screen)'),
 ('Layer-3-copy',    'portrait-host',      'portrait',    0.0, 'Host - Prophet Sampson Okyere (centre, top)'),
 ('Layer-7',         'portrait-top-right', 'portrait',    0.0, 'Artiste, upper right'),
 ('Layer-45',        'portrait-top-left',  'portrait',    0.0, 'Artiste, upper left'),
 ('Layer-25-copy-2', 'fade-facets',        'fade',        0.1, 'White facet fade that tucks the back row'),
 ('Color-Fill-3',    'fade-white',         'fade',        0.1, 'White fade over the back row'),
 ('Layer-9',         'portrait-lower-left','portrait',    0.2, 'Artiste, lower left'),
 ('Layer-13',        'portrait-lower-right','portrait',   0.2, 'Artiste, lower right'),
 ('Layer-2-copy-5',  'glare-centre',       'glare',       0.2, 'Gold glow behind lower-centre artiste (Screen)'),
 ('Layer-43',        'portrait-lower-centre','portrait',  0.3, 'Artiste, lower centre'),
 ('Layer-2-copy-7',  'glare-choir',        'glare',       0.3, 'Gold glow behind choir (Screen)'),
 ('Layer-11',        'choir',              'choir',       0.4, 'Heavenly Royals choir (six singers)'),
 ('Gradient-Fill-1', 'fade-bottom',        'fade',        0.4, 'White gradient fading the lower flyer'),
 ('Layer-47',        'text-inhouse',       'text',        0.8, 'IN-HOUSE ARTISTES list'),
 ('Layer-46',        'text-guest',         'text',        0.8, 'GUEST ARTISTES list'),
 ('Layer-31',        'logo-ppmi',          'logo',        0.8, 'Prayer Paradigm Ministry International logo + name'),
 ('Layer-49',        'text-host',          'text',        0.8, 'HOST PROPH. SAMPSON OKYERE'),
 ('Layer-24',        'title',              'title',       0.9, '"SACRIFICE OF PRAISE" + gold "\'26"'),
 ('Layer-26',        'text-theme',         'text',        0.8, 'THEME: PRAISE IN ADVANCE | 1 CHRONICLES 20:21'),
 ('Layer-17',        'logo-sop',           'logo',        0.9, 'Gold SOP monogram'),
 ('Layer-28',        'text-details',       'text',        0.8, 'Date / time / venue / contact row'),
 ('Layer-30',        'harp-left',          'harp',        1.0, 'Gold harp, left'),
 ('Layer-30-copy',   'harp-right',         'harp',        1.0, 'Gold harp, right'),
 ('Layer-2-copy-9',  'glare-harp-left',    'glare',       0.9, 'Gold glow, lower left (Screen)'),
 ('Layer-2-copy-10', 'glare-harp-right',   'glare',       0.9, 'Gold glow, lower right (Screen)'),
]
W, H = 1080, 1350
psd = PSDImage.open('poster.psd')
files = {re.sub(r'poster_\d+_', '', os.path.basename(f))[:-4]: f for f in glob.glob('layers/*.png')}
by = {re.sub(r'[^A-Za-z0-9]+', '-', l.name).strip('-'): l for l in psd}
out = []
for key, lid, role, depth, desc in META:
    l = by[key]; f = files[key]; im = Image.open(f)
    c = l.composite(viewport=(0, 0, W, H)); bb = (c.convert('RGBA').getchannel('A').getbbox() if c else None) or (0, 0, W, H)
    assert (bb[2]-bb[0], bb[3]-bb[1]) == im.size or key == 'Color-Fill-3', (key, bb, im.size)
    x, y = (bb[0], bb[1]) if key != 'Color-Fill-3' else (0, 0)
    a = im.convert('RGBA').getchannel('A'); ex = a.getextrema()
    out.append(dict(id=lid, source=os.path.basename(f), file=f'assets/{lid}.png', x=x, y=y, w=im.size[0], h=im.size[1],
                    blend={'NORMAL': 'normal', 'MULTIPLY': 'multiply', 'SCREEN': 'screen'}[l.blend_mode.name],
                    role=role, depth=depth, description=desc, mode=im.mode, alpha=[ex[0], ex[1]]))
missing = sorted(set(files) - {m[0] for m in META})
assert not missing, missing
json.dump(out, open('src/config/layers.json', 'w'), indent=1)
rows = ['| # | id | source file | x,y | size | blend | role | alpha range |', '|---|---|---|---|---|---|---|---|']
for i, o in enumerate(out, 1):
    rows.append(f"| {i} | `{o['id']}` | `{o['source']}` | {o['x']},{o['y']} | {o['w']}×{o['h']} | {o['blend']} | {o['role']} | {o['alpha'][0]}–{o['alpha'][1]} |")
open('docs/layer-table.md', 'w').write('\n'.join(rows) + '\n')
print(len(out), 'layers')
