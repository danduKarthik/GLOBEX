import { api } from './api';
import { searchWikivoyage } from './browserGuide';

const strip = (t = '') => t.split('/').pop().replace(/\s*\(.*\)$/, '');

/**
 * One search across everything:
 *  1. our featured destinations + their places (instant, offline)
 *  2. all 250 countries
 *  3. any city / region / island / park in the world (Wikivoyage)
 */
export async function searchAll(term) {
  const [local, world] = await Promise.all([
    api(`/places/search?q=${encodeURIComponent(term)}`).catch(() => ({ results: [] })),
    api(`/world/search?q=${encodeURIComponent(term)}`).catch(() => ({ countries: [], guides: [] })),
  ]);
  // server limited by Wikimedia → search Wikivoyage directly from the browser
  if (world.blocked) {
    world.guides = await searchWikivoyage(term).catch(() => []);
    world.guides = world.guides.filter((g) => !world.countries.some((c) => c.guide === g.title));
  }
  const featured = new Set(local.results.filter((r) => r.kind === 'destination').map((r) => r.name.toLowerCase()));
  const countries = world.countries.map((c) => ({
    kind: 'country', key: `c-${c.code}`, name: c.name, flag: c.flag, code: c.code,
    sub: `${c.capital ? `Capital ${c.capital} · ` : ''}${c.subregion || c.region}`, to: `/guide/${encodeURIComponent(c.guide)}?country=${encodeURIComponent(c.name)}`,
  }));
  const guides = world.guides
    .filter((g) => !featured.has(strip(g.title).toLowerCase()))
    .map((g) => ({
      kind: 'guide', key: `g-${g.title}`, name: strip(g.title),
      sub: g.title.includes('/') ? `Area of ${g.title.split('/')[0]}` : (g.desc || 'Travel guide · tourist places'), to: `/guide/${encodeURIComponent(g.title)}`,
    }));
  const mine = local.results.map((r) => ({
    ...r, key: `l-${r.slug}-${r.spotId || ''}`, to: r.kind === 'spot' ? `/explore/${r.slug}?spot=${r.spotId}` : `/explore/${r.slug}`,
  }));
  return [...mine.slice(0, 6), ...countries.slice(0, 4), ...guides.slice(0, 8)];
}

export const KIND_LABEL = { destination: 'Destination', spot: 'Place', country: 'Country', guide: 'World guide' };
