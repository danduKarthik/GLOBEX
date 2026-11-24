// =====================================================================
// World travel data — every country, and tourist places for (almost) any
// destination on Earth.
//
//  • Countries: the `world-countries` package (250 countries & territories).
//  • Places:    Wikivoyage (free, CC BY-SA travel guide, ~30,000 destinations).
//               We read each guide's "See" and "Do" listings, its cities,
//               regions and districts.
//  • Photos:    Wikipedia page images + Wikimedia Commons.
//
// Everything fetched is cached on disk in server/data/cache for 7 days, so
// pages load instantly after the first visit and we stay polite to Wikimedia.
// =====================================================================
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import wtf from 'wtf_wikipedia';
import { CITIES } from './data.js';

const require = createRequire(import.meta.url);
const WORLD_COUNTRIES = require('world-countries');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'data', 'cache');
const CITY_FILE = path.join(__dirname, 'data', 'world-cities.json');
const TTL = 7 * 24 * 3600 * 1000;
const WV = 'https://en.wikivoyage.org/w/api.php';
const WP = 'https://en.wikipedia.org/w/api.php';
// Wikimedia asks every app to identify itself with a name, version and a way to contact the owner:
// https://meta.wikimedia.org/wiki/User-Agent_policy — set WIKI_CONTACT to your email or website.
const CONTACT = process.env.WIKI_CONTACT || 'https://en.wikivoyage.org/wiki/User:GlobeX-demo';
const UA = `GlobeXTravelDemo/1.1 (${CONTACT}) node/${process.versions.node}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
let blockedUntil = 0; // after Wikimedia refuses us, stop asking for a while (the browser takes over)

// ---------------------------------------------------------------- helpers
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 20);

async function getJSON(url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${hash(url)}.json`);
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < TTL) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* re-fetch */ }
  }
  if (Date.now() < blockedUntil) {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const err = new Error('The travel guide service is limiting requests from this server.');
    err.status = 503; err.code = 'BLOCKED'; throw err;
  }
  let res;
  for (let attempt = 0; attempt < 2; attempt++) {
    // be polite: Wikimedia prefers one request at a time, spaced out a little
    const wait = lastCall + 250 - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json', 'Accept-Encoding': 'gzip' } });
    } catch {
      // offline: fall back to an old cached copy if we have one
      if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
      const err = new Error('Could not reach the travel guide service. Check your internet connection.');
      err.status = 503; err.code = 'OFFLINE'; throw err;
    }
    if (res.status !== 429 && res.status !== 503) break;
    if (attempt === 1) break;
    const retryAfter = Math.min(Number(res.headers.get('retry-after')) || 1, 2);
    await sleep(retryAfter * 1000);
  }
  if (!res.ok) {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); // stale copy beats an error
    const blocked = res.status === 429 || res.status === 403;
    if (blocked) blockedUntil = Date.now() + 10 * 60 * 1000;
    const err = new Error(blocked ? 'The travel guide service is limiting requests from this server.' : `Travel guide service error (${res.status})`);
    err.status = 503; err.code = blocked ? 'BLOCKED' : 'UPSTREAM'; throw err;
  }
  const data = await res.json();
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

const q = (params) => new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params }).toString();
export const commonsImage = (file, width = 1280) =>
  file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/^(File|Image):/i, '').trim())}?width=${width}` : null;

const clean = (s = '') => {
  if (!s) return '';
  let t = String(s);
  if (/[[{']/.test(t)) { try { t = wtf(t).text(); } catch { /* keep raw */ } }
  return t.replace(/\s+/g, ' ').trim();
};
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const firstLink = (s = '') => { const m = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/.exec(s); return m ? m[1].trim() : null; };
const shorten = (s, n) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, '')}…`);

// ---------------------------------------------------------------- countries
// A few names differ between the country list and Wikivoyage article titles.
const WV_TITLE = {
  US: 'United States of America', CD: 'Democratic Republic of the Congo', CG: 'Republic of the Congo',
  CZ: 'Czech Republic', CI: "Côte d'Ivoire", MM: 'Myanmar', VA: 'Vatican City', PS: 'Palestinian territories',
  KR: 'South Korea', KP: 'North Korea', GB: 'United Kingdom', MK: 'North Macedonia', TL: 'East Timor',
  SZ: 'Eswatini', CV: 'Cape Verde', FM: 'Federated States of Micronesia', BL: 'Saint Barthélemy',
};

export const COUNTRIES = WORLD_COUNTRIES
  .map((c) => ({
    code: c.cca2,
    name: c.name.common,
    official: c.name.official,
    capital: (c.capital || [])[0] || '',
    region: c.region || 'Other',
    subregion: c.subregion || '',
    flag: c.flag || '',
    lat: c.latlng?.[0] ?? null,
    lon: c.latlng?.[1] ?? null,
    guide: WV_TITLE[c.cca2] || c.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const WORLD_REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'Antarctic'];

// ---------------------------------------------------------------- wikitext parsing
const PLACE_TYPES = { see: 'See', do: 'Do' };
const SECTION_GROUPS = {
  cities: /^(cities|towns|cities and towns|major cities)$/i,
  destinations: /^(other destinations|destinations|islands|attractions)$/i,
  regions: /^(regions|states|provinces|states and territories|counties)$/i,
  districts: /^(districts|neighbourhoods|neighborhoods|quarters)$/i,
};

/** Split raw wikitext into level-2 sections: { 'cities': '…text…', … } */
function splitSections(text) {
  const out = {};
  const re = /^==\s*([^=].*?)\s*==\s*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(text))) marks.push({ title: m[1].trim(), start: m.index, end: re.lastIndex });
  marks.forEach((mk, i) => { out[mk.title] = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : text.length); });
  return out;
}

/** Bulleted destination lists ("* [[Paris]] — the capital" or {{marker|name=[[Paris]]|lat=…}}) */
function parseDestinationList(body) {
  const items = [];
  const seen = new Set();
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('*')) continue;
    let title = null; let lat = null; let lon = null;
    const marker = /\{\{\s*marker\s*\|((?:\[\[[^\]]*\]\]|[^}])*)\}\}/i.exec(line);
    if (marker) {
      // protect the "|" inside [[Page|Label]] links before splitting the template parameters
      const safe = marker[1].replace(/\[\[[^\]]*\]\]/g, (l) => l.replace(/\|/g, '\u0001'));
      const params = Object.fromEntries(safe.split('|').map((p) => p.replace(/\u0001/g, '|').split('=')).filter((p) => p.length >= 2).map(([k, ...v]) => [k.trim().toLowerCase(), v.join('=').trim()]));
      title = firstLink(params.name || '') || clean(params.name || '');
      lat = num(params.lat); lon = num(params.long ?? params.lon);
    }
    title = title || firstLink(line);
    if (!title || seen.has(title) || /^(file|image|category):/i.test(title)) continue;
    seen.add(title);
    const descRaw = line.replace(/\{\{\s*marker[^}]*\}\}/i, '').replace(/^\*+\s*/, '').replace(/^\[\[[^\]]+\]\]/, '');
    const desc = clean(descRaw).replace(/^[\s—–:,-]+/, '');
    items.push({ title, name: title.split('/').pop().replace(/\s*\(.*\)$/, ''), desc: shorten(desc, 160), lat, lon });
  }
  return items;
}

/** {{Regionlist | region1name=[[X]] | region1description=… }} */
function parseRegionlist(body) {
  const items = [];
  const VAL = '((?:\\[\\[[^\\]]*\\]\\]|[^|\\n])+)';
  const re = new RegExp(`region(\\d+)name\\s*=\\s*${VAL}`, 'gi');
  let m;
  while ((m = re.exec(body))) {
    const title = firstLink(m[2]);
    if (!title) continue;
    const d = new RegExp(`region${m[1]}description\\s*=\\s*${VAL}`, 'i').exec(body);
    items.push({ title, name: clean(m[2]).replace(/\s*\(.*\)$/, '') || title.split('/').pop(), desc: shorten(clean(d?.[1] || ''), 160), lat: null, lon: null });
  }
  return items;
}

/** Parse a Wikivoyage article into our "guide" shape. */
export function parseGuide(title, text) {
  const doc = wtf(text);
  const templates = doc.templates().map((t) => (typeof t.json === 'function' ? t.json() : t));
  const tpl = (name) => templates.find((t) => (t.template || '').toLowerCase() === name);

  const bannerT = tpl('pagebanner');
  const banner = bannerT ? (bannerT.list?.[0] || bannerT.image || bannerT['1'] || null) : null;
  const geoT = tpl('geo');
  const geo = geoT ? { lat: num(geoT.lat ?? geoT.list?.[0]), lon: num(geoT.lon ?? geoT.long ?? geoT.list?.[1]) } : null;
  const partT = tpl('ispartof');
  const partOf = partT ? (partT.list?.[0] || partT['1'] || null) : null;
  const typeT = templates.find((t) => /^(citystatus|cityguide|cityusable|countryguide|regionguide|outlineregion|usablecity|guidecity|outlinecity|starcity|usablecountry|outlinecountry|guidecountry|usableregion|outlinepark|usablepark)$/i.test(t.template || ''));

  // lead = text before the first heading, without templates/files
  const leadText = clean(text.split(/^==[^=]/m)[0].replace(/\{\{[\s\S]*?\}\}/g, '').replace(/\[\[(File|Image):[^\]]*\]\]/gi, ''));

  // places to visit
  const places = [];
  const seen = new Set();
  for (const t of templates) {
    const name = (t.template || '').toLowerCase();
    const type = name === 'listing' ? (t.type || '').toLowerCase() : name;
    if (!PLACE_TYPES[type]) continue;
    const pname = clean(t.name || '');
    if (!pname || seen.has(pname.toLowerCase())) continue;
    seen.add(pname.toLowerCase());
    places.push({
      id: slug(pname),
      name: pname,
      alt: clean(t.alt || ''),
      type: PLACE_TYPES[type],
      desc: shorten(clean(t.content || t.description || ''), 420),
      lat: num(t.lat), lon: num(t.long ?? t.lon),
      address: clean(t.address || ''),
      hours: clean(t.hours || ''),
      price: clean(t.price || ''),
      url: /^https?:\/\//.test(t.url || '') ? t.url : '',
      image: t.image || null,
      wikipedia: clean(t.wikipedia || '') || null,
      wikidata: t.wikidata || null,
    });
  }

  // sub-destinations
  const sections = splitSections(text);
  const links = { cities: [], destinations: [], regions: [], districts: [] };
  for (const [heading, body] of Object.entries(sections)) {
    for (const [group, re] of Object.entries(SECTION_GROUPS)) {
      if (!re.test(heading)) continue;
      const found = /regionlist/i.test(body) ? parseRegionlist(body) : [];
      links[group].push(...found, ...parseDestinationList(body).filter((x) => !found.some((f) => f.title === x.title)));
    }
  }
  // huge cities (e.g. Paris) keep their sights on district sub-pages "Paris/…"
  if (!links.districts.length) {
    const prefix = `${title}/`;
    const set = new Set();
    for (const m of text.matchAll(/\[\[([^\]|#]+)/g)) if (m[1].startsWith(prefix)) set.add(m[1].trim());
    links.districts = [...set].map((t) => ({ title: t, name: t.slice(prefix.length), desc: '', lat: null, lon: null }));
  }

  const kind = /country/i.test(typeT?.template || '') ? 'country'
    : /region/i.test(typeT?.template || '') || (links.cities.length && !places.length) ? 'region'
      : /park/i.test(typeT?.template || '') ? 'park' : 'city';

  return { title, lead: shorten(leadText, 900), banner, geo, partOf, kind, places, links };
}

// ---------------------------------------------------------------- fetching
async function fetchArticle(title) {
  const data = await getJSON(`${WV}?${q({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', redirects: '1', titles: title })}`);
  const page = data?.query?.pages?.[0];
  if (!page || page.missing || !page.revisions) return null;
  return { title: page.title, text: page.revisions[0].slots?.main?.content ?? page.revisions[0].content ?? '' };
}

/** Wikipedia thumbnails + one-line descriptions for up to 50 titles per call. */
async function wikipediaThumbs(titles, size = 640) {
  const out = {};
  const unique = [...new Set(titles.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    try {
      const data = await getJSON(`${WP}?${q({ action: 'query', prop: 'pageimages|description', piprop: 'thumbnail', pithumbsize: String(size), redirects: '1', titles: batch.join('|') })}`);
      const back = {};
      for (const n of data?.query?.normalized || []) back[n.to] = n.from;
      for (const r of data?.query?.redirects || []) back[r.to] = back[r.from] || r.from;
      for (const p of data?.query?.pages || []) {
        const key = back[p.title] || p.title;
        out[key] = { thumb: p.thumbnail?.source || null, description: p.description || '' };
        out[p.title] = out[key];
      }
    } catch { /* photos are optional */ }
  }
  return out;
}

/** Full guide for any Wikivoyage destination (country, region, city or district). */
const guideFile = (title) => path.join(CACHE_DIR, `guide-${hash(title.trim().toLowerCase())}.json`);

/** Read a finished guide from the cache (fast path, also used for guides built by the browser). */
export function cachedGuide(title) {
  const f = guideFile(title);
  if (fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs < TTL) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* ignore */ } }
  return null;
}
export function saveGuide(requested, guide) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const json = JSON.stringify(guide);
  fs.writeFileSync(guideFile(guide.title), json);
  if (requested && requested.toLowerCase() !== guide.title.toLowerCase()) fs.writeFileSync(guideFile(requested), json);
}

/** Parse wikitext the browser fetched itself (used when Wikimedia limits this server). */
export function parseForBrowser(title, text) {
  const guide = parseGuide(title, text);
  guide.country = COUNTRIES.find((c) => c.guide === guide.title || c.name === guide.title) || null;
  if (guide.country) guide.kind = 'country';
  guide.source = `https://en.wikivoyage.org/wiki/${encodeURIComponent(guide.title.replace(/ /g, '_'))}`;
  return guide;
}

export async function getGuide(title) {
  const cached = cachedGuide(title);
  if (cached) return cached;
  let article = await fetchArticle(title);
  if (!article) {
    const s = await searchGuides(title, 1);
    if (s[0]) article = await fetchArticle(s[0].title);
  }
  if (!article) { const e = new Error(`No travel guide found for “${title}”.`); e.status = 404; throw e; }

  const guide = parseGuide(article.title, article.text);

  // big cities: pull sights from up to 6 district pages
  if (guide.places.length < 6 && guide.links.districts.length && guide.kind !== 'country') {
    const subs = [];
    for (const d of guide.links.districts.slice(0, 6)) subs.push(await fetchArticle(d.title).catch(() => null));
    const seen = new Set(guide.places.map((p) => p.name.toLowerCase()));
    subs.filter(Boolean).forEach((a) => {
      for (const p of parseGuide(a.title, a.text).places) {
        if (seen.has(p.name.toLowerCase())) continue;
        seen.add(p.name.toLowerCase());
        guide.places.push({ ...p, district: a.title.split('/').pop() });
      }
    });
  }
  guide.places = guide.places.slice(0, 80);

  // photos: Wikipedia page image of each place / sub-destination, else the listing's own Commons image
  const subs = [...guide.links.cities, ...guide.links.destinations, ...guide.links.regions, ...guide.links.districts].slice(0, 60);
  const thumbs = await wikipediaThumbs([
    ...guide.places.map((p) => p.wikipedia || p.name),
    ...subs.map((s) => s.title.split('/').pop()),
    guide.title,
  ]);
  for (const p of guide.places) {
    const t = thumbs[p.wikipedia || p.name];
    p.photo = t?.thumb || commonsImage(p.image, 640) || null;
    if (!p.desc && t?.description) p.desc = t.description;
  }
  for (const s of subs) {
    const t = thumbs[s.title.split('/').pop()];
    s.photo = t?.thumb || null;
    if (!s.desc && t?.description) s.desc = t.description;
  }
  guide.bannerUrl = commonsImage(guide.banner, 1800) || thumbs[guide.title]?.thumb || guide.places.find((p) => p.photo)?.photo || null;
  guide.country = COUNTRIES.find((c) => c.guide === guide.title || c.name === guide.title) || null;
  if (guide.country) guide.kind = 'country';
  guide.source = `https://en.wikivoyage.org/wiki/${encodeURIComponent(guide.title.replace(/ /g, '_'))}`;
  saveGuide(title, guide);
  return guide;
}

/** Search Wikivoyage destinations (any city, region, park, island… in the world). */
export async function searchGuides(term, limit = 8) {
  if (!term?.trim()) return [];
  const data = await getJSON(`${WV}?${q({ action: 'opensearch', namespace: '0', limit: String(limit), search: term.trim() })}`);
  const [, titles = [], descs = []] = Array.isArray(data) ? data : [];
  return titles
    .filter((t) => !/^(travel topics|phrasebook|.* phrasebook)$/i.test(t))
    .map((t, i) => ({ title: t, desc: descs[i] || '' }));
}

export function searchCountries(term, limit = 6) {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  return COUNTRIES
    .map((c) => ({ c, s: c.name.toLowerCase().startsWith(t) ? 0 : c.name.toLowerCase().includes(t) ? 1 : c.capital.toLowerCase().startsWith(t) ? 2 : 9 }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map((x) => x.c);
}

// ---------------------------------------------------------------- make any place bookable
// Flights work between any two coordinates, so a destination found in the guide
// is added as a bookable city (saved in data/world-cities.json).
function loadWorldCities() {
  try { return JSON.parse(fs.readFileSync(CITY_FILE, 'utf8')); } catch { return []; }
}
for (const c of loadWorldCities()) if (!CITIES.some((x) => x.code === c.code)) CITIES.push(c);

const inIndia = (lat, lon) => lat > 6.5 && lat < 35.7 && lon > 68 && lon < 97.5;

export function ensureCity({ name, lat, lon, country }) {
  const clean = String(name || '').split('/').pop().replace(/\s*\(.*\)$/, '').trim();
  if (!clean || !Number.isFinite(lat) || !Number.isFinite(lon)) { const e = new Error('This place has no location to fly to.'); e.status = 400; throw e; }
  // already bookable? (same name, or an airport within ~60 km)
  const near = CITIES.find((c) => c.name.toLowerCase() === clean.toLowerCase()
    || (Math.abs(c.lat - lat) < 0.5 && Math.abs(c.lon - lon) < 0.5));
  if (near) return near;
  const domestic = country ? /india/i.test(country) : inIndia(lat, lon);
  let code;
  do { code = `W${parseInt(hash(clean + Math.random()).slice(0, 6), 16).toString(36).toUpperCase().slice(0, 3)}`; }
  while (CITIES.some((c) => c.code === code));
  const city = { code, name: clean, state: country || '', country: domestic ? 'India' : (country || 'World'), intl: !domestic, lat, lon, world: true };
  CITIES.push(city);
  const saved = loadWorldCities(); saved.push(city);
  fs.mkdirSync(path.dirname(CITY_FILE), { recursive: true });
  fs.writeFileSync(CITY_FILE, JSON.stringify(saved, null, 2));
  return city;
}
