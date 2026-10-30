import { HEIGHT, WIDTH, particles as cfg } from '../config/timing';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
interface P { x: number; y: number; vy: number; ax: number; fx: number; ph: number; r: number; a: number; bokeh: boolean }
const r = rng(cfg.seed);
const P_LIST: P[] = Array.from({ length: cfg.count }, (_, i) => {
  const bokeh = i % 5 === 0;
  return { x: r() * WIDTH, y: r() * HEIGHT, vy: 6 + r() * 16, ax: 6 + r() * 18, fx: 0.15 + r() * 0.35, ph: r() * 6.28,
    r: bokeh ? 9 + r() * 14 : 1.4 + r() * 2.6, a: bokeh ? 0.10 + r() * 0.08 : 0.45 + r() * 0.4, bokeh };
});

/** Soft gold dust. Pure function of t → frame-exact when exporting. */
export function drawParticles(ctx: CanvasRenderingContext2D, t: number, total: number) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const fadeIn = Math.min(1, t / cfg.fadeIn), fadeOut = Math.min(1, Math.max(0, (total - t) / 1.2));
  const env = fadeIn * fadeIn * (3 - 2 * fadeIn) * fadeOut;
  if (env <= 0.001) return;
  for (const p of P_LIST) {
    const y = ((p.y - p.vy * t) % (HEIGHT + 60) + HEIGHT + 60) % (HEIGHT + 60) - 30;
    const x = p.x + Math.sin(t * p.fx + p.ph) * p.ax;
    const tw = p.bokeh ? 0.7 + 0.3 * Math.sin(t * 0.4 + p.ph) : 0.45 + 0.55 * Math.max(0, Math.sin(t * (0.9 + p.fx * 2) + p.ph));
    const a = p.a * tw * env;
    if (a < 0.01) continue;
    const rad = p.r * (p.bokeh ? 1 : 2.6);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    if (p.bokeh) { g.addColorStop(0, `rgba(236,196,98,${a})`); g.addColorStop(0.7, `rgba(226,178,76,${a * 0.7})`); g.addColorStop(1, 'rgba(226,178,76,0)'); }
    else { g.addColorStop(0, `rgba(255,244,196,${a})`); g.addColorStop(0.25, `rgba(232,184,80,${a * 0.85})`); g.addColorStop(1, 'rgba(226,178,76,0)'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
  }
}
