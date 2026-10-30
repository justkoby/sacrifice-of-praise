import { DURATION } from '../config/timing';

interface Props { time: number; playing: boolean; onToggle: () => void; onReplay: () => void; onScrub: (t: number) => void; muted: boolean; onMute: () => void }
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

export function Controls({ time, playing, onToggle, onReplay, onScrub, muted, onMute }: Props) {
  return (
    <div className="controls">
      <button onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
      <button onClick={onReplay} aria-label="Replay from start">↺ Replay</button>
      <input type="range" min={0} max={DURATION} step={1 / 30} value={time} onChange={(e) => onScrub(parseFloat(e.target.value))} aria-label="Timeline" />
      <span className="time">{fmt(time)} / {fmt(DURATION)}</span>
      <button onClick={onMute} aria-label="Mute">{muted ? '🔇' : '🔊'}</button>
    </div>
  );
}
