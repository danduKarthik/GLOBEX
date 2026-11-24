// One 3D globe for the whole app. It is created once and kept alive (paused) while you are on other pages,
// so coming back Home is instant — no reloading textures or rebuilding the 3D scene.
const subs = new Set();
let state = { paused: true, collapsed: true, brandKey: 0, ready: false };

export const globeApi = { current: {} };
export const hostEl = typeof document !== 'undefined' ? Object.assign(document.createElement('div'), { className: 'globe-host' }) : null;

export const getGlobeHost = () => state;
export function setGlobeHost(patch) {
  const next = { ...state, ...patch };
  if (Object.keys(patch).every((k) => next[k] === state[k])) return;
  state = next;
  subs.forEach((fn) => fn());
}
export function subscribeGlobeHost(fn) { subs.add(fn); return () => subs.delete(fn); }
if (typeof window !== 'undefined' && window.location.search.includes('gdebug')) window.__globe = globeApi;
