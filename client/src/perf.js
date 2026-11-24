// "Lite mode" for phones, tablets and slower computers.
// Keeps the real-photo backgrounds, slide/zoom animations and button effects,
// but turns off the effects that make mobile browsers stutter: live blur
// (backdrop-filter), film grain, floating particles, parallax and always-running
// gradient animations.
const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const small = typeof window !== 'undefined' && window.innerWidth < 900;
const weakCpu = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4;
const lowMemory = typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory <= 4;
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Override for testing: localStorage.tripnova_perf = 'lite' | 'full'
let forced = null;
try { forced = localStorage.getItem('tripnova_perf'); } catch {}

export const LITE = forced ? forced === 'lite' : coarse || small || weakCpu || lowMemory || reduce;

export function applyPerfMode() {
  document.documentElement.classList.toggle('lite', LITE);
}
