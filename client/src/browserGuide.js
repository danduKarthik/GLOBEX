// Browser fallback for the world travel guides.
// If Wikimedia limits requests from your server (HTTP 429), the browser —
// which Wikivoyage allows — fetches the pages directly. The server only
// parses the text (no network) and then saves the finished guide, so the
// next visit is instant for everyone using this server.
import { api } from './api';

const WV = 'https://en.wikivoyage.org/w/api.php';
const WP = 'https://en.wikipedia.org/w/api.php';
const q = (p) => new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...p }).toString();
const commonsImage = (file, width = 1280) =>
  file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/^(File|Image):/i, '').trim())}?width=${width}` : null;

async function getJSON(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status !== 429) throw new Error(`Wikivoyage error (${res.status})`);
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  throw new Error('Wikivoyage is busy right now — please try again in a minute.');
}

async function fetchArticle(title) {
  const data = await getJSON(`${WV}?${q({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', redirects: '1', titles: title })}`);
  const page = data?.query?.pages?.[0];
  if (!page || page.missing || !page.revisions) return null;
  return { title: page.title, text: page.revisions[0].slots?.main?.content ?? page.revisions[0].content ?? '' };
}

export async function searchWikivoyage(term, limit = 8) {
  const data = await getJSON(`${WV}?${q({ action: 'opensearch', namespace: '0', limit: String(limit), search: term })}`);
  const [, titles = [], descs = []] = Array.isArray(data) ? data : [];
  return titles.map((t, i) => ({ title: t, desc: descs[i] || '' }));
}

async function thumbs(titles) {
  const out = {};
  const unique = [...new Set(titles.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 50) {
    try {
      const data = await getJSON(`${WP}?${q({ action: 'query', prop: 'pageimages|description', piprop: 'thumbnail', pithumbsize: '640', redirects: '1', titles: unique.slice(i, i + 50).join('|') })}`);
      const back = {};
      for (const n of data?.query?.normalized || []) back[n.to] = n.from;
      for (const r of data?.query?.redirects || []) back[r.to] = back[r.from] || r.from;
      for (const p of data?.query?.pages || []) {
        const v = { thumb: p.thumbnail?.source || null, description: p.description || '' };
        out[back[p.title] || p.title] = v; out[p.title] = v;
      }
    } catch { /* photos are optional */ }
  }
  return out;
}

const parse = (title, text) => api('/world/parse', { method: 'POST', body: { title, text } }).then((d) => d.guide);

export async function buildGuideInBrowser(requested) {
  let article = await fetchArticle(requested);
  if (!article) {
    const s = await searchWikivoyage(requested, 1);
    if (s[0]) article = await fetchArticle(s[0].title);
  }
  if (!article) throw new Error(`No travel guide found for “${requested}”.`);
  const guide = await parse(article.title, article.text);

  // big cities keep their sights on district pages
  if (guide.places.length < 6 && guide.links.districts.length && guide.kind !== 'country') {
    const seen = new Set(guide.places.map((p) => p.name.toLowerCase()));
    for (const d of guide.links.districts.slice(0, 6)) {
      const a = await fetchArticle(d.title).catch(() => null);
      if (!a) continue;
      const sub = await parse(a.title, a.text);
      for (const p of sub.places) {
        if (seen.has(p.name.toLowerCase())) continue;
        seen.add(p.name.toLowerCase());
        guide.places.push({ ...p, district: a.title.split('/').pop() });
      }
    }
  }
  guide.places = guide.places.slice(0, 80);

  const subs = [...guide.links.cities, ...guide.links.destinations, ...guide.links.regions, ...guide.links.districts].slice(0, 60);
  const t = await thumbs([...guide.places.map((p) => p.wikipedia || p.name), ...subs.map((s) => s.title.split('/').pop()), guide.title]);
  for (const p of guide.places) {
    const x = t[p.wikipedia || p.name];
    p.photo = x?.thumb || commonsImage(p.image, 640) || null;
    if (!p.desc && x?.description) p.desc = x.description;
  }
  for (const s of subs) {
    const x = t[s.title.split('/').pop()];
    s.photo = x?.thumb || null;
    if (!s.desc && x?.description) s.desc = x.description;
  }
  guide.bannerUrl = commonsImage(guide.banner, 1800) || t[guide.title]?.thumb || guide.places.find((p) => p.photo)?.photo || null;

  api('/world/save', { method: 'POST', body: { requested, guide } }).catch(() => {});
  return guide;
}
