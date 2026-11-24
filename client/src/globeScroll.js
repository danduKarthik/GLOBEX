// Tiny shared store: how far the home-page globe has "collapsed" into the navbar (0 = full screen, 1 = tiny button).
const subs = new Set();
let progress = 1;
export const globeProgress = () => progress;
export function setGlobeProgress(p) {
  if (p === progress) return;
  progress = p;
  subs.forEach((fn) => fn(p));
}
export function onGlobeProgress(fn) { subs.add(fn); fn(progress); return () => subs.delete(fn); }
