/**
 * EDITABLE TIMING + SCENE CONFIGURATION
 * ---------------------------------------------------------------------------
 * All times are in seconds on the soundtrack clock (audio/…mp3, 56.63 s).
 *
 * Musical map (tools/analyze_audio.py → src/config/audio-analysis.json):
 *   ≈131 BPM, 4/4 → beat 0.457 s, bar 1.83 s.
 *   Strongest onsets used as hit points:
 *     1.06  4.28  4.99  6.11  8.60  10.41  13.76  19.47  31.14 (largest mid-song accent)
 *     36.86 39.82 43.47 45.30 51.64  54.78 (final orchestral hit, then natural tail)
 *   Bar-lines (when no strong onset exists) fall on  firstDownbeat 1.43 + n × 1.83.
 *
 * A "cue" is the moment the reveal should LAND on the beat. Each reveal starts `lead`
 * seconds earlier (default `motion.lead`) so the fast part of the easing hits the beat.
 */

export const DURATION = 56.6; // video length; soundtrack is 56.63 s and is used in full (natural ending)
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1350;

/** Hit points for every reveal. Change a number here and the whole timeline re-flows. */
export const cues = {
  // ── Scene 1 · atmospheric introduction (0 – 4.2) ─────────────────────────
  bloomStart: 0.0,
  ornamentMain: 1.15, // gold geometric V draws upward
  logoPpmi: 1.06, //     strong onset (≈5σ) – ministry logo
  ornamentMid: 1.99,
  ornamentTop: 2.6,
  logoSop: 3.37, //      gold monogram, top right
  // ── Scene 2 · portraits (4.2 – 15) ───────────────────────────────────────
  portraitHost: 4.28, //  onset 8.5σ
  textHost: 4.99, //      onset 11σ  – "HOST PROPH. SAMPSON OKYERE"
  portraitTopLeft: 6.11, // onset 10.6σ
  textInhouse: 6.79,
  portraitTopRight: 8.6, // onset 12σ (largest in the first 10 s)
  textGuest: 9.29,
  portraitLowerLeft: 10.41,
  portraitLowerCentre: 12.2,
  portraitLowerRight: 13.76, // onset 9σ
  // ── Scene 3 · title (15 – 22) ────────────────────────────────────────────
  choir: 15.84,
  titleRow1: 17.82, //   "SACRIFICE"
  titleRow2: 18.55, //   "OF PRAISE"
  title26: 19.47, //     "'26" impact, onset 8σ
  titleShimmer: 20.3, // reflective sweep, ends ≈ 22.3
  // ── Scene 4 · supporting information (21.5 – 31) ─────────────────────────
  harps: 21.54,
  themeBadge: 23.37, //  bar-line
  themeText: 24.95,
  date: 26.1,
  time: 26.78,
  venue: 28.39,
  contact: 29.76,
  // ── Scene 5 · complete flyer (31.1 → end) ────────────────────────────────
  complete: 31.14, //    largest mid-song accent (15σ): light sweep, camera begins, parallax fades in
  finalHit: 54.78, //    final orchestral hit
} as const;

/** Lens glints – gold sparkle on metallic details, each on a musical accent. */
export const glints: { t: number; x: number; y: number; size: number; rot?: number }[] = [
  { t: 3.37, x: 948, y: 52, size: 170 }, //   SOP monogram appears
  { t: 19.47, x: 700, y: 1085, size: 260 }, // "'26" lands
  { t: 21.54, x: 70, y: 1015, size: 190 }, //  left harp
  { t: 22.1, x: 1010, y: 1030, size: 190 }, // right harp
  { t: 31.14, x: 300, y: 1075, size: 230 }, // complete flyer: title
  { t: 33.44, x: 948, y: 52, size: 170 },
  { t: 36.86, x: 760, y: 1070, size: 250 },
  { t: 39.82, x: 62, y: 1018, size: 190 },
  { t: 43.47, x: 240, y: 1075, size: 220 },
  { t: 45.3, x: 1015, y: 1040, size: 190 },
  { t: 47.11, x: 210, y: 330, size: 170 }, //   ornament
  { t: 51.64, x: 948, y: 52, size: 170 },
  { t: 54.78, x: 790, y: 1085, size: 300 }, //  final hit
];

/** Metallic shimmer sweeps (reflective band masked to the layer's own pixels). */
export const shimmers: { layer: string; t: number; dur: number }[] = [
  { layer: 'logo-ppmi', t: 1.4, dur: 1.4 },
  { layer: 'logo-sop', t: 3.6, dur: 1.3 },
  { layer: 'title', t: cues.titleShimmer, dur: 2.0 },
  { layer: 'harp-left', t: 21.9, dur: 1.6 },
  { layer: 'harp-right', t: 22.2, dur: 1.6 },
  { layer: 'text-theme', t: 25.6, dur: 1.4 },
  { layer: 'title', t: 36.7, dur: 2.2 },
  { layer: 'harp-left', t: 39.7, dur: 1.8 },
  { layer: 'logo-sop', t: 41.0, dur: 1.4 },
  { layer: 'harp-right', t: 45.2, dur: 1.8 },
  { layer: 'title', t: 51.4, dur: 2.2 },
  { layer: 'logo-sop', t: 51.6, dur: 1.4 },
];

/** Shared motion constants. */
export const motion = {
  lead: 0.12, //            seconds a reveal starts before its cue
  portraitDur: 1.5,
  portraitRise: 46, //      px
  portraitScale: 1.035,
  textDur: 1.0,
  ease: { out: 'power3.out', outStrong: 'power4.out', inOut: 'power2.inOut', soft: 'sine.inOut' },
};

/** Slow camera + parallax (Scene 5). Margins are chosen so no layer edge or logo is ever clipped. */
export const camera = {
  maxScale: 1.014, // at 1.014 the top logo stays inside the frame (needs < 1.018)
  parallaxPx: 3.5, //   max drift for depth = 1
  parallaxPeriod: 26, // seconds per slow drift cycle
  parallaxIn: [31.0, 36.0] as [number, number], // amplitude ramps 0 → 1 over this span
};

/** Particles (deterministic, seeded). */
export const particles = { count: 80, fadeIn: 3.0, seed: 26 };

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
