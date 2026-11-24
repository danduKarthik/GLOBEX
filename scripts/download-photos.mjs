// Downloads every background / destination photo into client/public/media/photos/
// so the app loads them locally (faster, and works offline afterwards).
// Run with:  npm run photos      (also runs automatically during `npm run setup`)
// If it fails (no internet), the app simply streams the photos from Unsplash instead.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'client', 'src');
const outDir = path.join(root, 'client', 'public', 'media', 'photos');
const manifestPath = path.join(src, 'photo-manifest.json');

const ids = new Set();
const files = [path.join(src, 'backgrounds.js'), path.join(src, 'places.js'), path.join(root, 'server', 'destinations.js')];
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/'(\d{9,13}-[0-9a-f]{12})'/g)) ids.add(m[1]);
}

fs.mkdirSync(outDir, { recursive: true });
const manifest = {};
let ok = 0, failed = 0;
const list = [...ids];

async function save(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 8000) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.status);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

// full 1920px copy for desktops + a light 1080px "-m" copy for phones and cards
async function get(id) {
  const base = `https://images.unsplash.com/photo-${id}?auto=format&fm=jpg&fit=crop`;
  try {
    await save(`${base}&w=1920&q=72`, path.join(outDir, `${id}.jpg`));
    try { await save(`${base}&w=1080&q=70`, path.join(outDir, `${id}-m.jpg`)); manifest[id] = 2; } catch { manifest[id] = 1; }
    ok++;
    process.stdout.write('.');
  } catch (e) {
    failed++;
    process.stdout.write('x');
  }
}

console.log(`Downloading ${list.length} travel photos…`);
for (let i = 0; i < list.length; i += 5) await Promise.all(list.slice(i, i + 5).map(get));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0));
console.log(`\n✔ ${ok} photos ready${failed ? `, ${failed} will stream from Unsplash instead` : ''}.`);
