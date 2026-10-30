import gsap from 'gsap';
import { cues as C, glints, motion as M, shimmers } from '../config/timing';

type Q = (sel: string) => HTMLElement;
const lead = M.lead;

/** Builds the paused master timeline. Every reveal is positioned from config/timing.ts. */
export function buildTimeline(root: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
  const inner: Q = (id) => root.querySelector(`[data-inner="${id}"]`) as HTMLElement;
  const slice: Q = (k) => root.querySelector(`[data-slice="${k}"]`) as HTMLElement;
  const simg: Q = (k) => root.querySelector(`[data-slice-img="${k}"]`) as HTMLElement;
  const E = M.ease;

  /** portrait / photographic layers: opacity + rise + slight depth scale. Pixels stay crisp (no blur). */
  const portrait = (id: string, cue: number, o: { dur?: number; x?: number; origin?: string } = {}) => {
    const dur = o.dur ?? M.portraitDur;
    tl.fromTo(inner(id), { y: M.portraitRise, x: o.x ?? 0, scale: M.portraitScale, transformOrigin: o.origin ?? '50% 100%' },
      { y: 0, x: 0, scale: 1, duration: dur, ease: E.out }, cue - lead);
    // opacity resolves faster than position so the figure never looks ghosted
    tl.fromTo(inner(id), { opacity: 0 }, { opacity: 1, duration: dur * 0.55, ease: 'sine.out' }, cue - lead);
  };
  /** text blocks: clip-path wipe, no deformation. */
  const wipe = (target: HTMLElement, cue: number, from: string, o: { dur?: number; y?: number } = {}) => {
    tl.fromTo(target, { clipPath: from, opacity: 1, y: o.y ?? 0 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: o.dur ?? M.textDur, ease: E.inOut }, cue - lead);
  };
  /** soft glow layers (Screen): bloom in with a gentle scale. */
  const bloom = (id: string, at: number, dur: number, s0 = 0.9) =>
    tl.fromTo(inner(id), { opacity: 0, scale: s0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: dur, ease: E.soft }, at);

  // ── Scene 1 · atmosphere ───────────────────────────────────────────────
  bloom('glare-corner', C.bloomStart, 3.4, 0.94);
  bloom('glare-bloom', C.bloomStart + 0.3, 3.8, 0.9);
  bloom('glare-left', 2.0, 3.0, 0.92);
  const amb = root.querySelector('[data-ambient]') as HTMLElement;
  tl.set(amb, { opacity: 0, xPercent: -130 }, 0);
  /** warm light band drifting across the backdrop */
  const sweep = (at: number, dur: number, peak: number) => {
    tl.fromTo(amb, { xPercent: -130 }, { xPercent: 130, duration: dur, ease: 'sine.inOut', immediateRender: false }, at);
    tl.fromTo(amb, { opacity: 0 }, { opacity: peak, duration: dur * 0.3, ease: 'sine.out', immediateRender: false }, at);
    tl.to(amb, { opacity: 0, duration: dur * 0.35, ease: 'sine.in' }, at + dur * 0.65);
  };
  sweep(0.1, 4.6, 1);

  const vReveal = (id: string, cue: number, dur: number) => {
    tl.fromTo(inner(id), { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0, scale: 1.03, transformOrigin: '50% 100%' },
      { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, scale: 1, duration: dur, ease: E.inOut }, cue);
  };
  vReveal('ornament-v-main', C.ornamentMain, 2.6);
  vReveal('ornament-v-mid', C.ornamentMid, 2.4);
  vReveal('ornament-v-top', C.ornamentTop, 2.2);

  tl.fromTo(inner('logo-ppmi'), { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0, x: -14 }, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, x: 0, duration: 1.3, ease: E.inOut }, C.logoPpmi - 0.2);
  tl.fromTo(inner('logo-sop'), { opacity: 0, scale: 0.92, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 1.2, ease: E.outStrong }, C.logoSop - lead);

  // ── Scene 2 · portraits ────────────────────────────────────────────────
  portrait('portrait-host', C.portraitHost, { dur: 1.9 });
  bloom('glare-centre', C.portraitLowerCentre - 0.4, 2.0, 0.9);
  wipe(inner('text-host'), C.textHost, 'inset(0% 50% 0% 50%)', { dur: 1.1 });
  portrait('portrait-top-left', C.portraitTopLeft, { origin: '0% 100%' });
  wipe(inner('text-inhouse'), C.textInhouse, 'inset(0% 100% 0% 0%)');
  portrait('portrait-top-right', C.portraitTopRight, { origin: '100% 100%' });
  wipe(inner('text-guest'), C.textGuest, 'inset(0% 0% 0% 100%)');
  portrait('portrait-lower-left', C.portraitLowerLeft, { origin: '0% 100%' });
  portrait('portrait-lower-centre', C.portraitLowerCentre, { dur: 1.7 });
  portrait('portrait-lower-right', C.portraitLowerRight, { origin: '100% 100%' });

  // ── Scene 3 · choir + title ────────────────────────────────────────────
  tl.fromTo(inner('choir'), { opacity: 0, y: 64, scale: 1.02, transformOrigin: '50% 100%' }, { opacity: 1, y: 0, scale: 1, duration: 1.9, ease: E.out }, C.choir - lead);
  bloom('glare-choir', C.choir - 0.2, 2.2, 0.9);
  // masked typography: each row rises out of its own clipping slice
  tl.fromTo(simg('title:row1'), { yPercent: 108 }, { yPercent: 0, duration: 1.0, ease: E.outStrong }, C.titleRow1 - lead);
  tl.fromTo(simg('title:row2'), { yPercent: 108 }, { yPercent: 0, duration: 1.0, ease: E.outStrong }, C.titleRow2 - lead);
  tl.fromTo(slice('title:num'), { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'sine.out' }, C.title26 - 0.22);
  tl.fromTo(simg('title:num'), { scale: 1.2, filter: 'blur(9px)', transformOrigin: '8% 55%' },
    { scale: 1, filter: 'blur(0px)', duration: 1.15, ease: E.outStrong }, C.title26 - 0.22);

  // ── Scene 4 · supporting information ───────────────────────────────────
  tl.fromTo(inner('harp-left'), { opacity: 0, x: -70 }, { opacity: 1, x: 0, duration: 2.0, ease: E.out }, C.harps - lead);
  tl.fromTo(inner('harp-right'), { opacity: 0, x: 70 }, { opacity: 1, x: 0, duration: 2.0, ease: E.out }, C.harps - lead);
  bloom('glare-harp-left', C.harps, 2.4, 0.9);
  bloom('glare-harp-right', C.harps, 2.4, 0.9);
  wipe(slice('text-theme:badge'), C.themeBadge, 'inset(0% 100% 0% 0%)', { dur: 0.8 });
  wipe(slice('text-theme:text'), C.themeText, 'inset(0% 100% 0% 0%)', { dur: 1.3 });
  const row = (name: string, cue: number) => {
    wipe(slice(`text-details:${name}`), cue, 'inset(0% 100% 0% 0%)', { dur: 0.75 });
    tl.fromTo(simg(`text-details:${name}`), { y: 14 }, { y: 0, duration: 0.75, ease: E.out }, cue - lead);
  };
  row('date', C.date); row('time', C.time); row('venue', C.venue); row('info', C.contact);

  // ── Shimmer sweeps + lens glints ───────────────────────────────────────
  for (const s of shimmers) {
    const sh = root.querySelector(`[data-shine="${s.layer}"]`) as HTMLElement;
    const band = sh.querySelector('.band') as HTMLElement;
    const at = s.t;
    tl.set(band, { opacity: 0, xPercent: -120, skewX: -18 }, 0);
    tl.fromTo(band, { xPercent: -120 }, { xPercent: 260, duration: s.dur, ease: 'sine.inOut', immediateRender: false }, at);
    tl.fromTo(band, { opacity: 0 }, { opacity: 1, duration: s.dur * 0.3, ease: 'sine.out', immediateRender: false }, at);
    tl.to(band, { opacity: 0, duration: s.dur * 0.3, ease: 'sine.in' }, at + s.dur * 0.7);
  }
  sweep(C.complete - 0.3, 5.5, 0.9); // marks the "complete flyer" moment

  glints.forEach((g, i) => {
    const el = root.querySelector(`[data-glint="${i}"]`) as HTMLElement;
    const rot = g.rot ?? 18;
    if (i === 0) tl.set(glints.map((_, j) => root.querySelector(`[data-glint="${j}"]`)), { opacity: 0 }, 0);
    tl.fromTo(el, { opacity: 0, scale: 0.35, rotation: -rot }, { opacity: 1, scale: 1, rotation: 0, duration: 0.28, ease: 'power2.out', immediateRender: false }, g.t - 0.12);
    tl.to(el, { opacity: 0, scale: 0.7, rotation: rot * 0.6, duration: 0.85, ease: 'power2.in' }, g.t + 0.16);
  });

  return tl;
}
