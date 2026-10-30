"""QA the exported MP4: black frames, harsh cuts (frame-to-frame jumps), final frame vs `final flyer.jpg`.
usage: python3 -I tools/qa.py out/sacrifice-of-praise-26.mp4"""
import subprocess, sys, numpy as np
from PIL import Image
mp4 = sys.argv[1]; W, H = 1080, 1350
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', mp4], capture_output=True, text=True).stdout.strip()
print('frames:', probe)
# downscaled gray stream for fast whole-video checks
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', 'scale=108:135,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 135, 108).astype(float)
mean = fr.mean((1, 2)); d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
print('min frame luma %.1f (black frame if < 20): %s' % (mean.min(), 'FAIL' if mean.min() < 20 else 'ok'))
print('max frame-to-frame mean change %.2f at frame %d (%.2fs); 99th pct %.2f' % (d.max(), d.argmax(), d.argmax() / 30, np.percentile(d, 99)))
print('frames with change > 6 (possible harsh cut):', [int(i) for i in np.where(d > 6)[0]])
# last frame vs flyer (flyer scaled by the final camera scale about centre)
last = subprocess.run(['ffmpeg', '-v', 'error', '-sseof', '-0.1', '-i', mp4, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
import io
a = np.asarray(Image.open(io.BytesIO(last)).convert('RGB'), float)
ref = Image.open('final flyer.jpg').convert('RGB')
cs = 1.014  # final camera scale: scale the reference up about the centre to match the render
rw, rh = W * cs, H * cs
ref_s = ref.resize((round(rw), round(rh)), Image.LANCZOS).crop(((rw - W) / 2, (rh - H) / 2, (rw + W) / 2, (rh + H) / 2))
diff = np.abs(a - np.asarray(ref_s, float)) / 255
print('final frame vs final flyer.jpg (reference scaled by final camera scale): mean abs diff %.4f, p99 %.3f' % (diff.mean(), np.percentile(diff, 99)))
Image.fromarray(a.astype('uint8')).save('docs/qa-final-frame.png')
