import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Hand } from 'lucide-react';
import { LITE } from '../perf';
import SpaceSearch from './SpaceSearch';

import { globeApi, hostEl, getGlobeHost, setGlobeHost, subscribeGlobeHost } from '../globeHost';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => { const c1 = 1.1; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const homeR = () => {
  const W = window.innerWidth; const H = window.innerHeight;
  const d = W / H < 0.8 ? 5.7 : 3.1;
  return (H / 2) * Math.tan(Math.asin(1 / d)) / Math.tan((21 * Math.PI) / 180);
};
const OPEN_MS = 1000;
const CLOSE_MS = 900;

/** Lets the opening animation hand its little Earth over to the real 3D globe. */
let readyResolve;
export const globeControl = {
  introZoom: null,
  introSkip: null,
  present: false,
  ready: new Promise((r) => { readyResolve = r; }),
};
export const resolveGlobeReady = () => readyResolve?.();

function starShadows(n, W, H, size) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = 0.3 + Math.random() * 0.7;
    out.push(`${Math.round(Math.random() * W)}px ${Math.round(Math.random() * H)}px 0 ${size > 1 ? 0.4 : 0}px rgba(${Math.random() < 0.3 ? '190,215,255' : '255,255,255'},${a.toFixed(2)})`);
  }
  return out.join(',');
}

/**
 * Home page landing: the 3D Earth with the Moon and stars, and the options on top
 * ("Explore the World", the pull-down label and quick chips).
 *
 * Opening the full globe:
 *  • already at the very top, pull down (fingers moving down on a touchpad / phone, or mouse wheel up):
 *    the options slide down at the speed of your fingers while the Earth glides to the middle and grows.
 *    Let go past ~¼ → the full globe opens (labels, search, Spin); otherwise everything springs back.
 *    Scrolling back up from lower on the page only brings you to the top — it never opens by itself.
 *  • or click the Earth / "Open the 3D Globe".
 * Turning it: grab the Earth with the mouse or a finger and drag (landing page and full globe).
 * Full globe: wheel / pinch zooms; zoomed all the way out, push up (fingers up / wheel down) to go back.
 * Closing: that push, a swipe up on the space around the Earth, Esc, or "Swipe up to go back home".
 */
export default function GlobeHero({ instant }) {
  const hero = useRef(null);
  const slot = useRef(null);
  const inner = useRef(null);
  const overlay = useRef(null);
  const apiRef = globeApi;                     // the one shared globe (kept alive between pages)
  const st = useRef({ a: instant ? 'o' : 'hero', b: 'hero', t: 0, ease: null, busy: false, hold: !!instant, scrub: false });
  const host = useSyncExternalStore(subscribeGlobeHost, getGlobeHost);
  const ready = host.ready;
  const fullRef = useRef(false);
  const setPaused = (v) => setGlobeHost({ paused: v });
  const setCollapsed = (v) => setGlobeHost({ collapsed: v });
  const setBrandKey = (f) => setGlobeHost({ brandKey: typeof f === 'function' ? f(getGlobeHost().brandKey) : f });
  const setFull = (v) => { fullRef.current = v; hero.current?.classList.toggle('is-full', v); };
  const stars = useMemo(() => {
    const W = window.screen?.width || 1920; const H = window.screen?.height || 1080;
    return { small: starShadows(LITE ? 220 : 480, W, H, 1), big: starShadows(LITE ? 40 : 90, W, H, 2) };
  }, []);

  useEffect(() => {
    // put the one shared globe into this page; hand it back (paused) when you leave
    window.dispatchEvent(new Event('globex:need-globe'));
    if (hostEl && inner.current && hostEl.parentNode !== inner.current) inner.current.appendChild(hostEl);
    return () => { setGlobeHost({ paused: true, collapsed: true }); hostEl?.remove(); };
  }, []);

  useEffect(() => { if (ready) { st.current.sync?.(); requestAnimationFrame(() => st.current.sync?.()); } }, [ready]);

  useEffect(() => {
    globeControl.present = true;
    const s = st.current;
    const lock = (on) => document.documentElement.classList.toggle('globe-lock', on);     // page can't scroll
    const fullCls = (on) => document.documentElement.classList.toggle('globe-full', on); // hides the top bar
    const dragSpan = () => (hero.current?.clientHeight || window.innerHeight) * 0.7;      // px of finger travel to open

    // where the Earth is (centre + radius) in each state
    const frame = (name) => {
      const W = window.innerWidth; const H = hero.current?.clientHeight || window.innerHeight;
      const R = apiRef.current.earthRadiusPx?.() || homeR();
      if (name === 'full') return { cx: W / 2, cy: H / 2, er: R, sky: 1, ui: 1, hero: 0 };
      if (name === 'o') {
        const r = document.getElementById('intro-o')?.getBoundingClientRect() || { left: W / 2 - 20, top: H / 2 - 20, width: 40, height: 40 };
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 + window.scrollY, er: r.width / 2, sky: 0, ui: 0, hero: 0 };
      }
      if (!s.slotRel || !s.busy) {
        const sl = slot.current?.getBoundingClientRect();
        const hr = hero.current?.getBoundingClientRect();
        if (sl && hr) s.slotRel = { cx: sl.left + sl.width / 2 - hr.left, cy: sl.top + sl.height / 2 - hr.top, r: sl.width / 2 };
      }
      const sr = s.slotRel || { cx: W / 2, cy: H * 0.34, r: H * 0.25 };
      return { cx: sr.cx, cy: sr.cy, er: sr.r, sky: 0, ui: 0, hero: 1 };
    };

    const apply = () => {
      const inn = inner.current; const h = hero.current;
      if (!inn || !h) return;
      const W = window.innerWidth; const H = h.clientHeight;
      const R = apiRef.current.earthRadiusPx?.() || homeR();
      const A = frame(s.a); const B = frame(s.b);
      const e = s.ease ? s.ease(s.t) : s.t;
      const lin = clamp(s.t);
      const cx = lerp(A.cx, B.cx, e); const cy = lerp(A.cy, B.cy, e);
      const er = Math.exp(lerp(Math.log(A.er), Math.log(B.er), e));
      const k = er / R;
      inn.style.transform = `translate3d(${(cx - W / 2).toFixed(2)}px, ${(cy - H / 2).toFixed(2)}px, 0) scale(${k.toFixed(5)})`;
      const mix = (key) => lerp(A[key], B[key], lin);
      apiRef.current.setSky?.(clamp(mix('sky') * 1.6 - 0.6), 1);
      h.style.setProperty('--ui', clamp(mix('ui') * 2 - 1).toFixed(3));
      const heroK = mix('hero');
      if (overlay.current) {
        // the options travel down with your fingers (1 px of pull = 1 px of movement) and fade near the end
        const gone = s.a === 'o' || s.b === 'o' ? 0 : 1 - heroK;
        overlay.current.style.transform = gone > 0.001 ? `translate3d(0, ${(gone * dragSpan()).toFixed(1)}px, 0)` : 'none';
        overlay.current.style.opacity = (s.a === 'o' ? clamp(lin * 2 - 1) : clamp(1 - (gone - 0.45) / 0.5)).toFixed(3);
        overlay.current.style.visibility = heroK < 0.02 && s.a !== 'o' ? 'hidden' : 'visible';
      }
      const nav = document.querySelector('header.nav');
      if (nav) nav.style.opacity = (s.a === 'o' ? clamp(lin * 2 - 1) : clamp(heroK * 1.4 - 0.4)).toFixed(3);
      s.view = { cx, cy, k, W, H, heroK };
      setPaused(s.hold || window.scrollY >= H);
    };

    const setMode = (isFull) => {
      setFull(isFull);
      hero.current?.classList.toggle('is-full', isFull);
      apiRef.current.setUiOff?.(!isFull);
      apiRef.current.setLowRes?.(!isFull);
      setCollapsed(!isFull);
    };
    // re-send the current mode to the globe (it may load after this page is already showing)
    s.sync = () => {
      const g = apiRef.current; if (!g.setUiOff || s.busy) return;
      const full = s.a === 'full';
      g.setUiOff(!full); g.setFullInput?.(full); g.setControls?.(!s.hold);
      g.setRotScale?.(full ? 1 : (s.view?.k ? 1 / s.view.k : 1));
    };
    const toHero = () => {                       // settle state: the landing page, page scrolls normally
      s.a = 'hero'; s.b = 'hero'; s.t = 0; s.ease = null; s.scrub = false; s.busy = false;
      setMode(false); fullCls(false); lock(false);
      apiRef.current.setFullInput?.(false);
      apiRef.current.setControls?.(true);
      apply();
      apiRef.current.setRotScale?.(s.view?.k ? 1 / s.view.k : 1);   // the small Earth turns under your finger at the right speed
    };
    const toFull = () => {
      s.a = 'full'; s.b = 'full'; s.t = 0; s.ease = null; s.scrub = false; s.busy = false;
      lock(true); fullCls(true); setMode(true);
      apply();
      apiRef.current.setRotScale?.(1);
      apiRef.current.setFullInput?.(true);
      apiRef.current.setControls?.(true);
      setBrandKey((x) => x + 1);
    };

    const animate = (a, b, ms, ease) => new Promise((resolve) => {
      s.a = a; s.b = b; s.t = 0; s.ease = ease; s.busy = true;
      apiRef.current.setLowRes?.(true);
      apiRef.current.setUiOff?.(true);
      const start = performance.now();
      const step = (now) => {
        s.t = clamp((now - start) / (ms * (window.__globeSlowMo || 1)));
        apply();
        if (s.t < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });

    const expand = async (then) => {
      if (s.busy || s.a !== 'hero' || s.hold) return;
      if (window.scrollY > 2) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await new Promise((res) => { const t0 = performance.now(); const w = () => (window.scrollY <= 2 || performance.now() - t0 > 1200 ? res() : requestAnimationFrame(w)); w(); });
      }
      lock(true);
      await animate('hero', 'full', OPEN_MS, easeOutBack);
      toFull();
      if (typeof then === 'function') then();
    };
    const collapse = async () => {
      if (s.busy || s.a !== 'full') return;
      apiRef.current.setFullInput?.(false);
      apiRef.current.home?.();                    // zoom the Earth back to its normal size
      setMode(false); fullCls(false);
      await animate('full', 'hero', CLOSE_MS, easeInOut);
      toHero();
    };

    globeControl.introZoom = async (ms) => {
      s.hold = false;
      apiRef.current.setControls?.(false);
      await animate('o', 'hero', ms, easeInOut);
      toHero();
    };
    globeControl.introSkip = () => {
      if (!s.hold) return;
      s.hold = false;
      toHero();
    };

    // ---- pull to open (scrubbed by your fingers) ----------------------------------------------
    let dir = 0; let settleTimer = null; let settleRaf = 0;
    const beginScrub = (from) => {
      cancelAnimationFrame(settleRaf);
      if (from === 1) { setMode(false); apiRef.current.setFullInput?.(false); apiRef.current.home?.(); }
      fullCls(false);
      s.scrub = true; s.busy = true; s.a = 'hero'; s.b = 'full'; s.ease = null; s.t = from;
      lock(true);
      apiRef.current.setLowRes?.(true);
      apiRef.current.setUiOff?.(true);
      apiRef.current.setControls?.(false);
    };
    const settle = () => {
      if (!s.scrub) return;
      clearTimeout(settleTimer);
      const target = dir > 0 ? (s.t > 0.2 ? 1 : 0) : (s.t < 0.8 ? 0 : 1);
      const from = s.t; const start = performance.now();
      const ms = 200 + 480 * Math.abs(target - from);
      const step = (now) => {
        const k = clamp((now - start) / ms);
        s.t = from + (target - from) * easeOut(k);
        apply();
        if (k < 1) { settleRaf = requestAnimationFrame(step); return; }
        if (target === 1) toFull(); else toHero();
      };
      settleRaf = requestAnimationFrame(step);
    };
    let moveRaf = 0;
    const moveBy = (px) => {             // px > 0 → towards the full globe
      if (!px) return;
      dir = Math.sign(px);
      s.t = clamp(s.t + px / dragSpan());
      if (!moveRaf) moveRaf = requestAnimationFrame(() => { moveRaf = 0; if (s.scrub) apply(); });
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 180);
    };

    // "already at the top": you must arrive at the top first; a *new* pull (after a short pause) opens it.
    let topSince = window.scrollY <= 0 ? performance.now() - 2000 : 0;
    let lastWheel = 0; let armed = true; let gestureAtHome = true; let homeSince = 0;
    const onPageScroll = () => {
      if (window.scrollY > 0) { topSince = 0; armed = false; }
      else if (!topSince) topSince = performance.now();
    };

    const onWheel = (e) => {
      const now = performance.now();
      const gap = now - lastWheel; lastWheel = now;
      if (e.target.closest?.('.gt-results, .place-panel, .ss-more, .ps-panel, .nav-pop, .ngs-pop, .as-panel')) return;
      if (e.ctrlKey) { if (s.a === 'full' || s.busy) e.preventDefault(); return; }   // pinch on a touchpad zooms the globe, not the page
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (s.scrub) { e.preventDefault(); cancelAnimationFrame(settleRaf); moveBy(-dy); return; }
      if (s.busy) { if (s.a === 'full' || s.b === 'full') e.preventDefault(); return; }
      if (s.a === 'full') {
        // full globe: the wheel zooms (the globe does that itself). Zoomed all the way out, a *new* push down goes back home.
        e.preventDefault();
        const atH = apiRef.current.atHome?.() ?? true;
        if (!atH) homeSince = 0; else if (!homeSince) homeSince = now;
        if (gap > 180) gestureAtHome = atH && now - homeSince > 300;   // was already zoomed out before this push started
        if (dy > 1 && atH && gestureAtHome) { beginScrub(1); moveBy(-dy); }
        return;
      }
      // landing page
      if (window.scrollY > 0) { topSince = 0; armed = false; return; }          // normal page scrolling
      if (!topSince) topSince = now;
      if (dy >= 0) return;                                                     // scrolling down the page
      if (!armed) {
        // still the same scroll that brought you up here (momentum) → ignore until you pause
        if (gap > 180 && now - topSince > 250) armed = true; else return;
      }
      e.preventDefault();
      beginScrub(0); moveBy(-dy);
    };

    let ty0 = null; let tx0 = 0; let tFrom = 0; let tScrub = false; let tAllowed = false; let tLast = 0;
    const onEarthAt = (x, y) => {                // is this screen point on the Earth? (full globe: centre of the screen)
      const R = apiRef.current.earthRadiusPx?.() || homeR();
      if (s.a === 'full') return Math.hypot(x - window.innerWidth / 2, y - (hero.current?.clientHeight || window.innerHeight) / 2) < R * 1.04;
      const v = s.view;
      return !!v && Math.hypot(x - v.cx, y + window.scrollY - v.cy) < R * v.k;
    };
    const onTouchStart = (e) => {
      ty0 = e.touches[0].clientY; tx0 = e.touches[0].clientX; tLast = ty0; tScrub = false;
      if (e.touches.length > 1) { tAllowed = false; return; }           // two fingers = pinch / turn the globe
      const blocked = e.target.closest?.('.gt-results, .place-panel, .ss-more, .ps-panel, .nav-pop, .ngs-pop, .as-panel, .globe-top, .globe-zoom, .globe-label, .spin-btn, input');
      const atTop = window.scrollY <= 0 && topSince && performance.now() - topSince > 250;
      // full globe: a finger on the Earth turns it; a swipe up on the space around it (or the "go back home" strip) closes it
      const onCue = e.target.closest?.('.scroll-cue, .globe-bottom');
      const fullOk = s.a === 'full' && (onCue || !onEarthAt(e.touches[0].clientX, e.touches[0].clientY));
      tAllowed = !blocked && !s.busy && ((s.a === 'hero' && atTop) || fullOk);
      tFrom = s.a === 'full' ? 1 : 0;
    };
    const onTouchMove = (e) => {
      if (ty0 == null || !tAllowed) return;
      if (e.touches.length > 1) { tAllowed = false; if (tScrub) { tScrub = false; settle(); } return; }
      const y = e.touches[0].clientY; const dy = y - ty0;
      if (!tScrub) {
        if (Math.abs(e.touches[0].clientX - tx0) > Math.abs(dy)) { if (Math.abs(dy) > 10 || Math.abs(e.touches[0].clientX - tx0) > 10) tAllowed = false; return; } // sideways = turning the Earth
        if (s.a === 'hero' && dy > 10) { tScrub = true; beginScrub(0); }
        else if (s.a === 'full' && dy < -10) { tScrub = true; beginScrub(1); }
        else return;
      }
      e.preventDefault();
      dir = Math.sign(y - tLast) || dir; tLast = y;
      s.t = clamp(tFrom + dy / dragSpan());
      if (!moveRaf) moveRaf = requestAnimationFrame(() => { moveRaf = 0; if (s.scrub) apply(); });
    };
    const onTouchEnd = () => { if (tScrub) settle(); ty0 = null; tScrub = false; };
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (s.a === 'full' && ['Escape', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); collapse(); }
    };
    const onOpen = (e) => {
      const place = e.detail?.place;
      if (place && s.a === 'full') { apiRef.current.openPlace?.(place); return; }
      expand(place ? () => apiRef.current.openPlace?.(place) : e.detail?.then);
    };
    const onClose = () => collapse();

    // a click on the Earth (not a drag) opens the full globe
    const stageEl = hero.current?.querySelector('.space-stage');
    let down = null;
    // landing page: only the Earth itself can be grabbed and turned — the starry sky around it does nothing
    const onDownCapture = (e) => {
      if (s.a === 'full') return;
      if (s.busy || !onEarthAt(e.clientX, e.clientY)) e.stopPropagation();
    };
    const onHover = (e) => {
      if (e.pointerType !== 'mouse' || s.a === 'full') return;
      hero.current?.classList.toggle('on-earth', !s.busy && onEarthAt(e.clientX, e.clientY));
    };
    const onDown = (e) => { if (s.a === 'hero' && !s.busy) down = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    const onUp = (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 6 && performance.now() - down.t < 450 && s.a === 'hero' && onEarthAt(e.clientX, e.clientY)) expand();
      down = null;
    };
    stageEl?.addEventListener('pointerdown', onDownCapture, true);
    stageEl?.addEventListener('pointerdown', onDown);
    stageEl?.addEventListener('pointermove', onHover, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('scroll', onPageScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('globex:open-globe', onOpen);
    window.addEventListener('globex:close-globe', onClose);
    window.addEventListener('resize', apply);
    document.documentElement.style.overscrollBehaviorY = 'none';

    let raf = 0; let lastSig = '';
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (s.hold || s.busy) return;
      const sl = slot.current?.getBoundingClientRect();
      const R = apiRef.current.earthRadiusPx?.() || 0;
      const sig = sl ? `${Math.round(sl.left)}|${Math.round(sl.top + window.scrollY)}|${Math.round(sl.width)}|${R.toFixed(1)}|${window.innerWidth}x${hero.current?.clientHeight}|${window.scrollY >= (hero.current?.clientHeight || 0)}` : '';
      if (sig !== lastSig) { lastSig = sig; apply(); }
    };
    raf = requestAnimationFrame(tick);

    if (s.hold) { apiRef.current.setControls?.(false); apply(); } else toHero();

    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(settleRaf); clearTimeout(settleTimer);
      stageEl?.removeEventListener('pointerdown', onDownCapture, true);
      stageEl?.removeEventListener('pointerdown', onDown);
      stageEl?.removeEventListener('pointermove', onHover);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('scroll', onPageScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('globex:open-globe', onOpen);
      window.removeEventListener('globex:close-globe', onClose);
      window.removeEventListener('resize', apply);
      document.documentElement.style.overscrollBehaviorY = '';
      const nav = document.querySelector('header.nav'); if (nav) nav.style.opacity = '';
      globeControl.introZoom = null; globeControl.introSkip = null; globeControl.present = false;
      lock(false); fullCls(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section ref={hero} className={`space-hero ${ready ? 'globe-ready' : ''}`}>
      <div className="space-stage">
        <div className="gs-sky">
          <i style={{ boxShadow: stars.small }} />
          <i className="big" style={{ boxShadow: stars.big }} />
        </div>
        <div ref={inner} className="gs-inner" />
      </div>

      {/* the options on top of the globe — they slide down with your fingers when you pull down at the top */}
      <div ref={overlay} className="space-overlay">
        <div ref={slot} className="earth-slot" aria-hidden="true" />

        <motion.div className="hero-title" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <h1>Explore the <span className="ht-world">World</span></h1>
          <p>Discover. Plan. Travel.</p>
          <span className="ht-bar" />
        </motion.div>

        <div className="hero-bottom">
          <motion.div className="pull-label" aria-hidden="true"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 110, damping: 18 }}>
            <span className="pl-hand"><Hand size={22} /><i /><i /></span>
            <span className="pl-text"><b>Scroll down to go high</b></span>
            <span className="pl-arrows"><ArrowDown size={18} /></span>
          </motion.div>
          <motion.div className="ss-wrap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, type: 'spring', stiffness: 110, damping: 18 }}>
            <SpaceSearch bar={false} />
          </motion.div>
        </div>

        <button type="button" className="descend" onClick={() => window.scrollTo({ top: (hero.current?.clientHeight || 900) - 6, behavior: 'smooth' })}>
          <ArrowDown size={15} /> Descend to discover
        </button>
      </div>
    </section>
  );
}
