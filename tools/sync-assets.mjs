// Copies /layers/*.png (renamed to their manifest ids) and the soundtrack into public/assets.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'public', 'assets');
fs.mkdirSync(out, { recursive: true });
const layers = JSON.parse(fs.readFileSync(path.join(root, 'src/config/layers.json'), 'utf8'));
for (const l of layers) fs.copyFileSync(path.join(root, 'layers', l.source), path.join(out, `${l.id}.png`));
const mp3 = fs.readdirSync(path.join(root, 'audio')).find((f) => f.endsWith('.mp3'));
fs.copyFileSync(path.join(root, 'audio', mp3), path.join(out, 'soundtrack.mp3'));
console.log(`synced ${layers.length} layers + soundtrack`);
