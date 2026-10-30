#!/usr/bin/env node
/**
 * Frame-accurate MP4 export:  npm run build && npm run export
 *   1080×1350 · 30 fps · H.264 (High, yuv420p, BT.709) + AAC 192k, original soundtrack, +faststart
 *
 * Every frame is rendered by seeking the deterministic timeline (window.__seek(t)) in headless Chromium
 * and screenshotting the stage, so output never depends on machine speed. Frames are split across
 * workers; each worker pipes straight into its own x264 encode, then the chunks are concatenated
 * (stream copy) and muxed with the soundtrack.
 *
 * Options:  --out <file>  --workers <n>  --crf <n>  --from <frame>  --to <frame>  --preset <x264 preset>
 * Needs:    ffmpeg on PATH, Chromium (Playwright's, or set CHROMIUM_PATH).
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const out = path.resolve(arg('out', path.join(root, 'out/sacrifice-of-praise-26.mp4')));
const workers = +arg('workers', Math.max(1, Math.min(4, os.cpus().length)));
const crf = arg('crf', '14'), preset = arg('preset', 'medium');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('dist/ missing – run `npm run build` first'); process.exit(1); }
const tmp = path.join(root, '.render-tmp'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });

// tiny static server for dist/
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const f = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+$/, 'index.html'));
  const file = fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(dist, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/?render=1`;

const launchOpts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launchOpts);
const probe = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await probe.goto(url); await probe.evaluate(() => window.__ready);
const { duration, fps } = await probe.evaluate(() => window.__meta);
await probe.close();
const total = Math.round(duration * fps);
const from = +arg('from', 0), to = Math.min(+arg('to', total), total);
console.log(`rendering frames ${from}–${to - 1} (${((to - from) / fps).toFixed(2)} s @ ${fps} fps) with ${workers} worker(s)`);

const chunk = Math.ceil((to - from) / workers);
let done = 0; const t0 = Date.now();
async function worker(i) {
  const a = from + i * chunk, b = Math.min(to, a + chunk); if (a >= b) return null;
  const file = path.join(tmp, `chunk_${String(i).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', preset, '-crf', crf,
    '-profile:v', 'high', '-g', String(fps), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((r) => ff.on('close', r));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(url); await page.evaluate(() => window.__ready);
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => window.__seek(t), f / fps);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 60 === 0) { const el = (Date.now() - t0) / 1000; console.log(`  ${done}/${to - from} frames  ${el.toFixed(0)}s  eta ${(el / done * (to - from - done)).toFixed(0)}s`); }
  }
  ff.stdin.end(); await closed; await page.close(); return file;
}
const chunks = (await Promise.all(Array.from({ length: workers }, (_, i) => worker(i)))).filter(Boolean);
await browser.close(); server.close();

fs.writeFileSync(path.join(tmp, 'list.txt'), chunks.map((c) => `file '${c}'`).join('\n'));
const mp3 = path.join(dist, 'assets/soundtrack.mp3');
const vlen = (to - from) / fps;
const mux = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'),
  '-ss', String(from / fps), '-i', mp3, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
  '-af', `afade=t=out:st=${Math.max(0, vlen - 0.3).toFixed(2)}:d=0.3`, '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
  '-t', vlen.toFixed(3), '-movflags', '+faststart', out], { stdio: 'inherit' });
if (mux.status !== 0) process.exit(mux.status);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`done → ${out}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
