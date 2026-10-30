# Phase 1 · Repository audit

## Inventory
| Path | What it is |
|---|---|
| `layers/` | 34 PNG layers exported from `poster.psd` (names carry the PSD stacking index, `0000` = top … `0051` = bottom) |
| `final flyer.jpg` | 1080×1350 reference composite – the source of truth for fidelity |
| `poster.psd`, `flyer v2.ai` | Photoshop / Illustrator masters (used read-only to recover layer offsets + blend modes) |
| `audio/*.mp3` | 56.63 s, 44.1 kHz stereo, 128 kbps |
| `ideas/`, `pics/`, `old concept/`, `revised-poster.png` | Earlier concepts and raw photos – **not** used |

Contact sheet of every layer (checkerboard = transparency): [`layer-contact-sheet.png`](layer-contact-sheet.png)
Full machine-readable manifest: [`../src/config/layers.json`](../src/config/layers.json) · table: [`layer-table.md`](layer-table.md)

## What each layer is (bottom → top, as stacked in the PSD)
| Group | Layers (id ← source) | Notes |
|---|---|---|
| Background | `bg-base` ← 0051, `bg-silk` ← 0050 (Multiply), `bg-facets` ← 0049, `bg-tint` ← 0048 (Multiply) | full-canvas; base + tint are opaque by design |
| Gold ornament | `ornament-v-main` ← 0047, `-mid` ← 0046, `-top` ← 0045 | the large Adinkra-pattern "V" behind the portraits |
| Glare / light (Screen) | `glare-corner` ← 0044, `glare-left` ← 0043, `glare-bloom` ← 0042, `glare-centre` ← 0024, `glare-choir` ← 0021, `glare-harp-left` ← 0001, `glare-harp-right` ← 0000 | **these are the exported lighting effects**; they only make sense under Screen blending (their RGB is dark grey with alpha) |
| Portraits | host ← 0038 (Prophet Sampson Okyere, centre-top), top-left ← 0032, top-right ← 0036, lower-left ← 0027, lower-right ← 0026, lower-centre ← 0022 | 6 cut-outs with clean alpha. Names on the flyer are not tied to individual faces in the file metadata, so non-host portraits are identified **by position only** |
| White fades | `fade-facets` ← 0030, `fade-white` ← 0029, `fade-bottom` ← 0018 | tuck the back row / lower flyer into white |
| Choir | `choir` ← 0020 | six singers, baked soft fade at the feet |
| Text | `text-inhouse` ← 0017, `text-guest` ← 0016, `text-host` ← 0011, `text-theme` ← 0007, `text-details` ← 0005 | gold / charcoal text with alpha |
| Title | `title` ← 0008 | "SACRIFICE OF PRAISE" **and** the gold "'26" are one layer (transparent gap at x 444-454 and y 58-72 is used to split them without cutting any glyph) |
| Logos | `logo-ppmi` ← 0014, `logo-sop` ← 0006 | |
| Harps | `harp-left` ← 0004, `harp-right` ← 0002 | metallic gold – highlighted with shimmer + glints |

## Transparency / repair findings
* All 34 layers load. 29 have fully transparent regions (portraits, text, logos, ornaments, harps, glares, fades); 3 are semi-transparent full-canvas textures (`bg-silk` α≥215, `bg-facets` α≥195, `glare-corner` α≥15); 2 are opaque by design (`bg-base`, `bg-tint`).
* Layers are exported **cropped to their content without offsets**. Offsets were recovered from `poster.psd`
  (`tools/build_manifest.py`); every recovered size matches its PNG exactly.
* `Color-Fill-3` (`fade-white`) composites to nothing inside psd-tools but its exported PNG is valid and is required by the final look – the PNG is used.
* **No layer needed repair.** No artwork was re-drawn, re-generated, re-masked or distorted.
* Hidden PSD layers (e.g. `Layer 3`, `Layer 22/23`, `Layer 33/35/37/39/41`) are not in `/layers` and not visible in `final flyer.jpg`, so nothing is missing.

## Stacking-order proof
`tools/verify_stack.py` rebuilds the flyer from the PNGs with the recovered offsets, stack order and blend modes
(Normal / Multiply / Screen) and diffs against `final flyer.jpg`:

    mean absolute difference 0.0041 (0.4 %), 99th percentile 0.027   → docs/rebuild-from-layers.png

The remaining difference is JPEG compression of the reference.

## Effects that did not exist and were created (procedurally, not substituted artwork)
| Effect | Why | Where |
|---|---|---|
| Soft gold dust / bokeh particles | none in the layers | `src/engine/particles.ts` (seeded, deterministic) |
| Reflective shimmer band | none in the layers | CSS band masked by each layer's own alpha (title, logos, harps, theme badge) |
| Lens glints | none in the layers | CSS star flares placed on gold details, timed to accents |
| Warm backdrop light sweep | none in the layers | multiply-blended gradient |

The seven exported glare layers are reused as the bloom / ambient lighting; they animate (fade + scale + gentle breathing) rather than being replaced.

## Audio analysis (`tools/analyze_audio.py` → `src/config/audio-analysis.json`)
* Duration **56.63 s**; steady, dense mix (loudness varies < ±3 dB) so onset *strength* – not loudness – was used to choose hit points.
* Tempo **≈131 BPM** (beat 0.457 s, bar 1.83 s). Bar-lines: 1.43 + n × 1.83 s.
* Strongest accents: 4.28 · 4.99 · 6.11 · 8.60 · 10.41 · 13.76 · 19.47 · **31.14 (largest, 15σ)** · 36.86 · 39.82 · 43.47 · 45.30 · 51.64 · **54.78 (final hit)**, followed by a natural tail to 56.6 s.
* Because the soundtrack is already 56.6 s, the whole track is used – no cut or artificial fade needed (only a 0.3 s anti-click fade on the last 0.3 s of the export).

### Cue map
| Time | Accent | Visual |
|---|---|---|
| 0.0 – 4.2 | intro | gold bloom, light sweep, V ornaments draw up, PPMI logo (1.06), SOP monogram (3.37) |
| 4.28 / 4.99 | 8.5σ / 11σ | host portrait lands / host name opens from centre |
| 6.11 / 6.79 | 10.6σ / 8σ | upper-left artiste + in-house list |
| 8.60 / 9.29 | 12σ | upper-right artiste + guest list |
| 10.41 · 12.20 · 13.76 | 10σ · 6σ · 9σ | lower-left, lower-centre (+glow), lower-right |
| 15.84 | 5σ | choir rises with glow |
| 17.82 · 18.55 | | "SACRIFICE", "OF PRAISE" rise out of masks |
| **19.47** | 8σ | gold "'26" lands; glint; shimmer follows 20.3 – 22.3 |
| 21.54 | 5.6σ | harps glide in with glow |
| 23.37 / 24.95 | bar | THEME badge / text |
| 26.10 · 26.78 · 28.39 · 29.76 | 5σ | date · time · venue · contact |
| **31.14** | 15σ | complete flyer – light sweep, slow push-in and parallax begin |
| 33 → 54 | | glints on 36.86, 39.82, 43.47, 45.30, 47.11, 51.64 (≈ 22 s of readable hold) |
| 54.78 | final hit | closing glint, parallax settles back to the exact original layout |

## Final quality check (draft 1 export)
`out/sacrifice-of-praise-26.mp4` — H.264 High / yuv420p, 1080×1350, 30 fps, 1698 frames, 56.60 s, AAC-LC stereo (git-ignored; regenerate with `npm run export`).
* Black frames: none (darkest frame mean luma 210/255).
* Harsh cuts: none (largest frame-to-frame change 2.8 at frame 0; 99th percentile 0.44; no frame exceeded 6).
* Final composition with the camera scale removed vs `final flyer.jpg`: mean abs diff **0.0042** (JPEG-level; all portraits, text, logos, harps present, no clipping). With the 1.4 % slow push-in applied the render is that same layout scaled about the centre; the top logos stay inside the frame.
* Checked by eye at keyframes: no overlapping/mispositioned layers; the "'26" transient blur is the only soft frame (0.35 s, by design).
* Not verified: playback sync was checked only through the preview's audio clock and the frame-exact cue times, not by ear.
