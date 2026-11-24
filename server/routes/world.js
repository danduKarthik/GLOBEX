import { Router } from 'express';
import { COUNTRIES, WORLD_REGIONS, getGuide, searchGuides, searchCountries, ensureCity, cachedGuide, saveGuide, parseForBrowser } from '../world.js';

const router = Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(e.status || 500).json({ error: e.message || 'Something went wrong', code: e.code }));

// GET /api/world/countries → all 250 countries & territories
router.get('/countries', (_req, res) => res.json({ regions: WORLD_REGIONS, countries: COUNTRIES }));

// GET /api/world/guide?title=Jaipur → places to visit, cities, regions, photos (from Wikivoyage)
router.get('/guide', wrap(async (req, res) => {
  const title = String(req.query.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  res.json({ guide: await getGuide(title) });
}));

// --- browser fallback (when Wikimedia limits this server, the browser fetches the page itself) ---
// GET  /api/world/cached?title=X        → a guide saved earlier, or 404
router.get('/cached', (req, res) => {
  const g = cachedGuide(String(req.query.title || ''));
  return g ? res.json({ guide: g }) : res.status(404).json({ error: 'not cached' });
});
// POST /api/world/parse { title, text } → parse Wikivoyage wikitext (no network)
router.post('/parse', (req, res) => {
  const { title, text } = req.body || {};
  if (!title || typeof text !== 'string') return res.status(400).json({ error: 'title and text are required' });
  res.json({ guide: parseForBrowser(String(title), text) });
});
// POST /api/world/save { requested, guide } → keep the finished guide so the next visit is instant
router.post('/save', (req, res) => {
  const { requested, guide } = req.body || {};
  if (!guide?.title || !Array.isArray(guide.places) || !guide.links) return res.status(400).json({ error: 'invalid guide' });
  saveGuide(String(requested || guide.title), guide);
  res.json({ ok: true });
});

// GET /api/world/search?q=kyoto → matching countries + any destination worldwide
router.get('/search', wrap(async (req, res) => {
  const term = String(req.query.q || '');
  const countries = searchCountries(term);
  let guides = [];
  let blocked = false;
  try { guides = await searchGuides(term, 8); } catch { blocked = true; /* the browser will search Wikivoyage itself */ }
  guides = guides.filter((g) => !countries.some((c) => c.guide === g.title));
  res.json({ countries, guides, blocked });
}));

// POST /api/world/bookable { name, lat, lon, country } → a city code you can fly to
router.post('/bookable', wrap(async (req, res) => {
  const { name, lat, lon, country } = req.body || {};
  res.json({ city: ensureCity({ name, lat: Number(lat), lon: Number(lon), country }) });
}));

export default router;
