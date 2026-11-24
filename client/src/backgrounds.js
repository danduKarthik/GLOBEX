// Real travel photos (free Unsplash licence), streamed from Unsplash's CDN.
// Each page gets its own set; they crossfade with a slow cinematic zoom.
//
// Want your OWN photos or a VIDEO?
//  • Put files in client/public/media/ and use paths like '/media/goa.jpg'
//  • Drop a video at client/public/media/background.mp4 — it's picked up automatically
//    and plays behind every page (photos are used as the fallback).

import manifest from './photo-manifest.json';

const u = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`;

const P = {
  beachGolden: { id: '1507525428034-b723cf961d3e', place: 'Golden hour on the coast' },
  palmBeach: { id: '1535262412227-85541e910204', place: 'Island lagoon' },
  palmSunset: { id: '1561571994-3c61c554181a', place: 'Coconut palms at sunset' },
  houseboat: { id: '1593693411515-c20261bcad6e', place: 'Alappuzha backwaters, Kerala' },
  teaRoad: { id: '1627370778723-4d26700cd972', place: 'Tea estate road at dusk' },
  forestRoad: { id: '1476231682828-37e571bc172f', place: 'Forest highway' },
  forestLight: { id: '1441974231531-c6227db76b6e', place: 'Sunlit forest' },
  mountainLake: { id: '1559310589-2673bfe16970', place: 'Alpine lake & pine forest' },
  airliner: { id: '1436491865332-7a61a109cc05', place: 'Cruising altitude' },
  wingClouds: { id: '1605590427165-3884d6aa6731', place: 'Above the clouds' },
  aboveClouds: { id: '1513002749550-c59d786b8e6c', place: 'Sky above the clouds' },
  trainMountain: { id: '1426086800127-2601510ca027', place: 'Mountain railway' },
  trainJungle: { id: '1770839012299-fb0130e5ec67', place: 'Viaduct through the jungle' },
  trainForest: { id: '1514250609276-c577268ef8fb', place: 'Train through the trees' },
  trainSunset: { id: '1589392764091-2aaa3afe42df', place: 'Sunset rail line' },
  tourBus: { id: '1776855273007-494dc2121494', place: 'Coach on the highway' },
  coachFields: { id: '1786545638116-1e78f52d1783', place: 'Coach through green fields' },
  treeRoad: { id: '1520022283252-ca69c721d247', place: 'Open road between tall trees' },
  carMountain: { id: '1603881359318-e2bc03deaaee', place: 'Mountain drive' },
  suvRoad: { id: '1529369623266-f5264b696110', place: 'Road-trip stop' },
  emptyRoad: { id: '1551952237-954a0e68786c', place: 'Endless road' },
  palmRoad: { id: '1536420124392-79a70082fbe5', place: 'Palm-lined coastal road' },
  sunTrees: { id: '1530224264768-7ff8c1789d79', place: 'Sun rays through the trees' },
  palmShore: { id: '1586500036065-bdaeac7a4feb', place: 'Palms on the shore' },
  aerialPalms: { id: '1541417904950-b855846fe074', place: 'Coconut grove by the sea' },
  goaHuts: { id: '1614082242765-7c98ca0f3df3', place: 'Beach huts, Goa' },
};

const set = (...keys) => keys.map((k) => ({ key: k, ...P[k] }));

export const BACKGROUNDS = {
  home: set('beachGolden', 'palmRoad', 'sunTrees', 'houseboat', 'aerialPalms', 'mountainLake', 'palmShore', 'forestLight', 'palmSunset', 'teaRoad'),
  flight: set('wingClouds', 'palmBeach', 'airliner', 'beachGolden', 'aboveClouds', 'mountainLake'),
  train: set('trainMountain', 'forestLight', 'trainJungle', 'houseboat', 'trainForest', 'trainSunset'),
  bus: set('tourBus', 'palmSunset', 'coachFields', 'forestRoad', 'treeRoad', 'teaRoad'),
  cars: set('carMountain', 'beachGolden', 'suvRoad', 'forestLight', 'emptyRoad', 'forestRoad'),
  checkout: set('beachGolden', 'forestLight', 'palmBeach', 'sunTrees', 'aerialPalms', 'palmShore', 'mountainLake'),
  calm: set('beachGolden', 'palmBeach', 'forestLight', 'houseboat', 'mountainLake', 'palmSunset'),
};

// Sizes: true → 1920px (desktop backgrounds) · false → 1080px (phone backgrounds, big cards)
//        'card' → 720px (photo cards) · 'thumb' → 240px · 'soft' → 120px (blurred backdrop: tiny = naturally soft & very cheap)
// Photos saved by `npm run photos` are used first (full size + a 1080px "-m" copy for phones/cards).
const WIDTH = { thumb: 240, soft: 120, card: 720 };
export function imageUrl(photo, size = true) {
  if (photo.src) return photo.src; // local override
  const local = manifest[photo.id];
  if (local && size !== 'thumb') {
    const medium = local === 2 && size !== true;
    return `/media/photos/${photo.id}${medium ? '-m' : ''}.jpg`;
  }
  return u(photo.id, WIDTH[size] || (size === true ? 1920 : 1080));
}

export function backgroundFor(pathname, search) {
  if (pathname === '/') return 'home';
  if (pathname === '/cars') return 'cars';
  if (pathname.startsWith('/explore') || pathname === '/world' || pathname.startsWith('/guide')) return 'calm';
  if (pathname === '/book' || pathname.startsWith('/rent/')) return 'checkout';
  if (pathname === '/search') {
    const t = new URLSearchParams(search).get('type');
    return ['flight', 'train', 'bus'].includes(t) ? t : 'flight';
  }
  return 'calm';
}

const COASTAL = ['GOI', 'COK', 'VTZ', 'MAA', 'BOM', 'CCU'];
const BEACHES = ['beachGolden', 'palmBeach', 'palmSunset', 'houseboat'];
const NATURE = ['forestLight', 'forestRoad', 'mountainLake', 'teaRoad', 'treeRoad'];

/** Beach photo for coastal destinations, trees / mountains for everything else. */
export function bannerFor(destCode = '') {
  const pool = COASTAL.includes(destCode) ? BEACHES : NATURE;
  const n = [...destCode].reduce((a, c) => a + c.charCodeAt(0), 0);
  const key = pool[n % pool.length];
  return { key, ...P[key] };
}

export const carBanner = (i = 0) => {
  const key = ['carMountain', 'forestRoad', 'beachGolden', 'teaRoad'][i % 4];
  return { key, ...P[key] };
};
