"""Audio analysis: duration, tempo, beat grid, strong onsets, loudness. Writes src/config/audio-analysis.json.
usage: python3 -I tools/analyze_audio.py <mp3> <out.json>   (needs ffmpeg + numpy)"""
import json, subprocess, sys, numpy as np
mp3, out = sys.argv[1], sys.argv[2]
sr = 22050
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.int16).astype(float) / 32768
H, N = 256, 1024; fps = sr / H; n = (len(x) - N) // H
win = np.hanning(N)
S = np.array([np.abs(np.fft.rfft(x[i*H:i*H+N] * win)) for i in range(n)])
flux = np.maximum(0, np.diff(np.log1p(S * 30), axis=0)).sum(1)
flux = np.maximum(flux - np.convolve(flux, np.ones(40) / 40, 'same'), 0)
t = (np.arange(len(flux)) + 1) / fps
# beat grid: search bpm/phase maximising onset energy on grid
best = (0, 0, 0)
for bpm in np.arange(120, 140, 0.1):
    period = 60 / bpm
    for ph in np.arange(0, period, 0.01):
        g = np.arange(ph, len(x) / sr, period)
        v = np.interp(g, t, flux).sum()
        if v > best[0]: best = (v, bpm, ph)
_, bpm, ph = best
period = 60 / bpm
beats = np.arange(ph, len(x) / sr, period)
# bar downbeat: which of 4 beat positions carries most energy
beat_e = np.interp(beats, t, flux)
down = int(np.argmax([beat_e[i::4].sum() for i in range(4)]))
thr = flux.mean() + 2.2 * flux.std()
peaks = [(round(float(t[i]), 2), round(float(flux[i] / flux.std()), 1)) for i in range(3, len(flux) - 3) if flux[i] > thr and flux[i] == flux[i-4:i+5].max()]
rms = np.sqrt((x[:len(x)//sr*sr].reshape(-1, sr) ** 2).mean(1))
json.dump({'file': mp3.split('/')[-1], 'duration': round(len(x) / sr, 3), 'bpm': round(float(bpm), 2), 'beatPeriod': round(float(period), 4),
           'beatPhase': round(float(ph), 3), 'downbeatOffsetBeats': down,
           'barPeriod': round(float(period * 4), 4), 'firstDownbeat': round(float(beats[down]), 3),
           'strongOnsets': peaks, 'rmsPerSecond': [round(float(v), 3) for v in rms]}, open(out, 'w'), indent=1)
print('bpm', bpm, 'period', period, 'phase', ph, 'downbeat idx', down, 'first downbeat', beats[down])
