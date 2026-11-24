// TEST ONLY — pretends to be Wikivoyage / Wikipedia using the sample pages in ./fixtures.
// Start the server with:  node --import ./test/fake-fetch.mjs index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const pages = Object.fromEntries(fs.readdirSync(dir).map((f) => [f.replace(/\.wiki$/, '').replace(/_/g, '/'), fs.readFileSync(path.join(dir, f), 'utf8')]));
const alias = { 'United States': 'India' };
const realFetch = globalThis.fetch;
const json = (data) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
globalThis.fetch = async (url, opts) => {
  const u = new URL(String(url));
  if (u.hostname === 'en.wikivoyage.org') {
    const p = u.searchParams;
    if (p.get('action') === 'opensearch') {
      const term = (p.get('search') || '').toLowerCase();
      const hits = Object.keys(pages).filter((t) => t.toLowerCase().includes(term)).slice(0, 8);
      return json([term, hits, hits.map(() => ''), hits.map((h) => `https://en.wikivoyage.org/wiki/${h}`)]);
    }
    const t = p.get('titles');
    const title = pages[t] ? t : alias[t];
    if (!title) return json({ query: { pages: [{ title: t, missing: true }] } });
    return json({ query: { pages: [{ title, revisions: [{ slots: { main: { content: pages[title] } } }] }] } });
  }
  if (u.hostname === 'en.wikipedia.org') {
    const titles = (u.searchParams.get('titles') || '').split('|');
    return json({ query: { pages: titles.map((t, i) => ({ title: t, description: `About ${t}`, ...(i % 4 === 3 ? {} : { thumbnail: { source: `https://upload.wikimedia.org/fake/${encodeURIComponent(t)}.jpg` } }) })) } });
  }
  return realFetch(url, opts);
};
console.log('[test] fake Wikivoyage/Wikipedia enabled');
