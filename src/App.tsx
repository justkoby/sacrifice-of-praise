import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage } from './components/Stage';
import { Controls } from './components/Controls';
import { Player } from './engine/player';
import { AUDIO_FADE, DURATION, FPS, HEIGHT, WIDTH } from './config/timing';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');

declare global { interface Window { __ready?: Promise<void>; __seek?: (t: number) => void; __meta?: { duration: number; fps: number; audioFade: number } } }

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const player = useRef<Player | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [scale, setScale] = useState(1);
  const playingRef = useRef(false);

  useLayoutEffect(() => {
    player.current = new Player(stageRef.current!);
    const t0 = parseFloat(params.get('t') ?? '0') || 0;
    player.current.seek(t0); setTime(t0);
    // expose a deterministic frame API for the exporter
    window.__seek = (t) => player.current!.seek(t);
    window.__meta = { duration: DURATION, fps: FPS, audioFade: AUDIO_FADE };
    window.__ready = Promise.all(Array.from(stageRef.current!.querySelectorAll('img')).map((i) => i.decode().catch(() => undefined))).then(() => undefined);
    return () => { player.current = null; };
  }, []);

  // fit the stage to the window (preview only)
  useEffect(() => {
    if (RENDER) return;
    const fit = () => setScale(Math.min(window.innerWidth / WIDTH, (window.innerHeight - 64) / HEIGHT));
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);

  // playback loop: the soundtrack is the master clock while playing
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const a = audioRef.current!;
      if (playingRef.current) {
        const t = Math.min(a.currentTime, DURATION);
        player.current?.seek(t); setTime(t);
        a.volume = Math.min(1, Math.max(0, (DURATION - t) / AUDIO_FADE)); // same fade-out as the export
        if (a.ended || t >= DURATION) { playingRef.current = false; setPlaying(false); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);

  const play = useCallback(async () => {
    const a = audioRef.current!;
    if (a.currentTime >= DURATION - 0.05) a.currentTime = 0;
    try { await a.play(); } catch { /* autoplay blocked: visuals still run from the audio clock once allowed */ }
    playingRef.current = true; setPlaying(true);
  }, []);
  const pause = useCallback(() => { audioRef.current!.pause(); playingRef.current = false; setPlaying(false); }, []);
  const scrub = useCallback((t: number) => { audioRef.current!.volume = Math.min(1, Math.max(0, (DURATION - t) / AUDIO_FADE)); audioRef.current!.currentTime = t; player.current?.seek(t); setTime(t); }, []);
  const replay = useCallback(() => { scrub(0); void play(); }, [scrub, play]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); playingRef.current ? pause() : void play(); }
      if (e.code === 'ArrowRight') scrub(Math.min(DURATION, time + 1));
      if (e.code === 'ArrowLeft') scrub(Math.max(0, time - 1));
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [play, pause, scrub, time]);

  return (
    <div className={RENDER ? 'app render' : 'app'}>
      <div className="viewport" style={RENDER ? undefined : { width: WIDTH * scale, height: HEIGHT * scale }}>
        <div style={{ transform: RENDER ? undefined : `scale(${scale})`, transformOrigin: '0 0', width: WIDTH, height: HEIGHT }}>
          <Stage ref={stageRef} />
        </div>
        {!RENDER && !playing && time < 0.05 && (
          <button className="bigplay" onClick={play} aria-label="Play">▶ <span>Play with sound</span></button>
        )}
      </div>
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}assets/soundtrack.mp3`} preload="auto" muted={muted} />
      {!RENDER && (
        <Controls time={time} playing={playing} onToggle={() => (playing ? pause() : void play())} onReplay={replay} onScrub={scrub}
                  muted={muted} onMute={() => setMuted((m) => !m)} />
      )}
    </div>
  );
}
