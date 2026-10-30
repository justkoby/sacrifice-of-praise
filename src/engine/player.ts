import { buildTimeline } from './timeline';
import { drawParticles } from './particles';
import { DURATION, camera as CAM, cues } from '../config/timing';
import { layers } from '../components/Stage';

const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

/**
 * Deterministic renderer: seek(t) always produces the same frame for the same t.
 * Used by the live preview (driven by the audio clock) and by the MP4 exporter (driven frame by frame).
 */
export class Player {
  readonly tl: gsap.core.Timeline;
  private cam: HTMLElement;
  private outer: { el: HTMLElement; depth: number; role: string; i: number }[];
  private ctx: CanvasRenderingContext2D;
  time = 0;

  constructor(private root: HTMLElement) {
    this.tl = buildTimeline(root);
    this.cam = root.querySelector('[data-camera]') as HTMLElement;
    this.ctx = (root.querySelector('[data-particles]') as HTMLCanvasElement).getContext('2d')!;
    this.outer = layers.map((l, i) => ({ el: root.querySelector(`[data-layer="${l.id}"]`) as HTMLElement, depth: l.depth, role: l.role, i }));
    this.seek(0);
  }

  seek(t: number) {
    t = Math.min(DURATION, Math.max(0, t));
    this.time = t;
    this.tl.time(t, false);

    // very slow push-in (kept < 1.018 so the top-row logos are never clipped)
    const s = 1 + (CAM.maxScale - 1) * smooth(t / DURATION);
    this.cam.style.transform = `scale(${s.toFixed(5)})`;

    // extremely subtle parallax + ambient glare breathing, fading in for the "complete flyer" scene
    const amp = smooth((t - CAM.parallaxIn[0]) / (CAM.parallaxIn[1] - CAM.parallaxIn[0])) * (1 - smooth((t - (DURATION - 1.3)) / 1.0));
    const w = (2 * Math.PI * t) / CAM.parallaxPeriod;
    const px = Math.sin(w) * CAM.parallaxPx * amp, py = Math.sin(w * 0.73 + 1.1) * CAM.parallaxPx * 0.6 * amp;
    for (const o of this.outer) {
      if (o.role !== 'background' || true) o.el.style.transform = amp > 0 ? `translate3d(${(px * o.depth).toFixed(3)}px,${(py * o.depth).toFixed(3)}px,0)` : '';
      if (o.role === 'glare') {
        const b = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 7 + o.i * 1.3);
        o.el.style.opacity = (1 - 0.12 * b * amp).toFixed(4);
      }
    }
    drawParticles(this.ctx, t, DURATION);
  }
}
void cues;
