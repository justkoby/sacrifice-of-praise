/**
 * EDITABLE TIMING + SCENE CONFIGURATION  ·  30-second promo edit
 * ---------------------------------------------------------------------------
 * All times are in seconds on the soundtrack clock. The edit plays the first 30 s of
 * audio/…mp3 with a 3 s fade-out (the full track is 56.63 s; the 56.6 s version is in git history, commit e02ab97).
 *
 * Structure:  0 – 19.7 s  build (five scenes, fast)   ·   19.7 – 30 s  complete flyer held (~10 s)
 *
 * Musical map (tools/analyze_audio.py → src/config/audio-analysis.json):
 *   ≈131 BPM, 4/4 → beat 0.457 s, bar 1.83 s. Hit points are the strongest onsets:
 *     1.06  4.28  4.99  5.65  6.11  6.79  8.60  10.41  13.76 (9σ)  19.47 (8σ)  and bar-lines 17.88 / 19.71.
 *
 * A "cue" is the moment the reveal should LAND on the beat. Each reveal starts `lead`
 * seconds earlier (default `motion.lead`) so the fast part of the easing hits the beat.
 */

export const DURATION = 30; // video length (s)
export const AUDIO_FADE = 3; // seconds of fade-out at the end of the soundtrack
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1350;

/** Hit points for every reveal. Change a number here and the whole timeline re-flows. */
export const cues = {
  // ── Scene 1 · atmospheric introduction (0 – 4) ───────────────────────────
  bloomStart: 0.0,
  ornamentMain: 0.3, //  gold geometric V draws upward
  ornamentMid: 0.9,
  ornamentTop: 1.5,
  logoPpmi: 1.06, //     strong onset (≈5σ) – ministry logo
  logoSop: 1.99, //      gold monogram, top right
  // ── Scene 2 · portraits (4.2 – 11.5) ─────────────────────────────────────
  portraitHost: 4.28, //  onset 8.5σ
  textHost: 4.99, //      onset 11σ  – "HOST PROPH. SAMPSON OKYERE"
  portraitTopLeft: 5.65, // 7.6σ
  textInhouse: 6.11, //   10.6σ
  portraitTopRight: 6.79, // 8.2σ
  textGuest: 7.47,
  portraitLowerLeft: 8.6, // 12σ (largest in the first 10 s)
  portraitLowerCentre: 10.41, // 10σ
  portraitLowerRight: 11.09,
  // ── Scene 3 · choir + title (11.5 – 16) ──────────────────────────────────
  choir: 11.54,
  titleRow1: 12.88, //   "SACRIFICE"
  titleRow2: 13.33, //   "OF PRAISE"
  title26: 13.76, //     "'26" impact, onset 9σ
  titleShimmer: 14.4, // reflective sweep
  // ── Scene 4 · supporting information (15.8 – 20) ─────────────────────────
  harps: 15.84,
  themeBadge: 16.32,
  themeText: 16.96,
  date: 17.82, //        bar-line
  time: 18.34,
  venue: 18.78,
  contact: 19.47, //     onset 8σ – last element lands by ≈20.0
  // ── Scene 5 · complete flyer, held ≈10 s (19.7 → 30) ─────────────────────
  complete: 19.71, //    bar-line: light sweep, camera drift + parallax fade in
} as const;

/** Lens glints – gold sparkle on metallic details, each on a musical accent. */
export const glints: { t: number; x: number; y: number; size: number; rot?: number }[] = [
  { t: 1.99, x: 948, y: 52, size: 170 }, //    SOP monogram appears
  { t: 13.76, x: 700, y: 1085, size: 260 }, // "'26" lands
  { t: 15.84, x: 70, y: 1015, size: 190 }, //  left harp
  { t: 16.2, x: 1010, y: 1030, size: 190 }, // right harp
  { t: 19.47, x: 300, y: 1075, size: 230 }, // complete flyer: title
  { t: 21.54, x: 948, y: 52, size: 170 },
  { t: 23.37, x: 210, y: 330, size: 170 }, //   ornament
  { t: 24.95, x: 62, y: 1018, size: 190 },
  { t: 26.1, x: 760, y: 1070, size: 250 },
  { t: 26.78, x: 1015, y: 1040, size: 190 },
  { t: 28.39, x: 240, y: 1075, size: 220 },
];

/** Metallic shimmer sweeps (reflective band masked to the layer's own pixels). */
export const shimmers: { layer: string; t: number; dur: number }[] = [
  { layer: 'logo-ppmi', t: 1.4, dur: 1.3 },
  { layer: 'logo-sop', t: 2.2, dur: 1.2 },
  { layer: 'title', t: cues.titleShimmer, dur: 1.8 },
  { layer: 'harp-left', t: 16.0, dur: 1.5 },
  { layer: 'harp-right', t: 16.3, dur: 1.5 },
  { layer: 'text-theme', t: 17.4, dur: 1.3 },
  { layer: 'title', t: 20.6, dur: 2.2 },
  { layer: 'logo-sop', t: 21.6, dur: 1.3 },
  { layer: 'logo-ppmi', t: 23.4, dur: 1.3 },
  { layer: 'harp-left', t: 24.9, dur: 1.6 },
  { layer: 'title', t: 26.0, dur: 2.2 },
  { layer: 'harp-right', t: 26.7, dur: 1.6 },
];

/** Shared motion constants. */
export const motion = {
  lead: 0.12, //            seconds a reveal starts before its cue
  portraitDur: 1.2,
  portraitRise: 46, //      px
  portraitScale: 1.035,
  textDur: 0.9,
  ease: { out: 'power3.out', outStrong: 'power4.out', inOut: 'power2.inOut', soft: 'sine.inOut' },
};

/** Slow camera + parallax (Scene 5, the held ending). Margins are chosen so no layer edge or logo is ever clipped. */
export const camera = {
  maxScale: 1.014, // at 1.014 the top logo stays inside the frame (needs < 1.018)
  parallaxPx: 3.5, //   max drift for depth = 1
  parallaxPeriod: 12, // seconds per slow drift cycle
  parallaxIn: [19.7, 23.0] as [number, number], // amplitude ramps 0 → 1 over this span
};

/** Particles (deterministic, seeded). */
export const particles = { count: 80, fadeIn: 2.0, seed: 26 };

/**
 * Sub-regions of a layer that animate independently (layer-local pixels).
 * Boundaries were taken from the transparent gaps in each layer's alpha channel:
 *   title        gap x 444-454  → "SACRIFICE / OF PRAISE" | "'26"; gap y 58-72 between rows
 *   text-details gaps at the vertical rules   x≈170, 330, 476
 *   text-theme   THEME badge ends x≈130
 */
export interface Slice { name: string; x: number; y: number; w: number; h: number; free?: boolean }
export const slices: Record<string, Slice[]> = {
  title: [
    { name: 'row1', x: 0, y: 0, w: 449, h: 65 },
    { name: 'row2', x: 0, y: 65, w: 449, h: 61 },
    { name: 'num', x: 449, y: 0, w: 293, h: 126, free: true },
  ],
  'text-details': [
    { name: 'date', x: 0, y: 0, w: 160, h: 64 },
    { name: 'time', x: 160, y: 0, w: 162, h: 64 },
    { name: 'venue', x: 322, y: 0, w: 144, h: 64 },
    { name: 'info', x: 466, y: 0, w: 278, h: 64 },
  ],
  'text-theme': [
    { name: 'badge', x: 0, y: 0, w: 130, h: 40 },
    { name: 'text', x: 130, y: 0, w: 593, h: 40 },
  ],
};

/** Layers that receive a metallic shimmer mask. */
export const shineLayers = ['logo-ppmi', 'logo-sop', 'title', 'harp-left', 'harp-right', 'text-theme'];
