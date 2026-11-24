import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { BACKGROUNDS, backgroundFor, imageUrl } from '../backgrounds';
import { LITE } from '../perf';

/**
 * Cinematic real-photo background.
 * • Page-aware photo sets (beach/forest/mountains on Home, planes on Flights, trains on Trains …)
 * • Crossfades every 7s with a slow "Ken Burns" zoom & pan
 * • Mouse + scroll parallax, drifting sunlight, floating light particles, film grain
 * • Optional video: put client/public/media/background.mp4 and it plays instead of photos
 */
const BgContext = createContext(null);
export const useBackground = () => useContext(BgContext);

const SLIDE_MS = 7000;
// Ken Burns directions — each slide gets a different camera move
const MOVES = [
  { from: { scale: 1.08, x: '-1.5%', y: '0%' }, to: { scale: 1.22, x: '1.5%', y: '-1.5%' } },
  { from: { scale: 1.22, x: '1.5%', y: '-1%' }, to: { scale: 1.08, x: '-1%', y: '1%' } },
  { from: { scale: 1.1, x: '0%', y: '1.5%' }, to: { scale: 1.24, x: '0%', y: '-1.5%' } },
  { from: { scale: 1.18, x: '-2%', y: '-1%' }, to: { scale: 1.1, x: '2%', y: '0.5%' } },
];

function useWide() {
  const [wide, setWide] = useState(() => window.innerWidth > 820);
  useEffect(() => {
    const r = () => setWide(window.innerWidth > 820);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  return wide;
}

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export function BackgroundProvider({ children }) {
  const location = useLocation();
  const [override, setOverride] = useState(null); // a page (e.g. a destination) can supply its own photos
  const name = override ? `custom-${override[0].key}` : backgroundFor(location.pathname, location.search);
  const slides = override || BACKGROUNDS[name];
  const wide = useWide();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(null); // { src, photo, key } currently on screen
  const [failed, setFailed] = useState(() => new Set());
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const soft = name === 'checkout'; // light booking pages: tiny photo = soft blur for free

  // new page → restart its set
  useEffect(() => { setIndex(0); }, [name]);

  // load the target photo before showing it (no half-loaded flashes)
  useEffect(() => {
    let alive = true;
    const photo = slides[index % slides.length];
    const size = soft ? 'soft' : wide;
    const src = imageUrl(photo, size);
    preload(src).then((ok) => {
      if (!alive) return;
      if (ok) {
        setShown({ src, photo, key: `${name}-${index}-${photo.key}` });
        // warm up the next one
        const next = slides[(index + 1) % slides.length];
        preload(imageUrl(next, size));
      } else {
        setFailed((f) => new Set(f).add(photo.key));
        if (failed.size + 1 < slides.length) setIndex((i) => (i + 1) % slides.length);
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, index, wide]);

  // auto-advance
  useEffect(() => {
    if (paused || slides.length < 2) return;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [index, name, paused, slides.length]);

  // pause when the tab is hidden
  useEffect(() => {
    const v = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', v);
    return () => document.removeEventListener('visibilitychange', v);
  }, []);

  const goTo = useCallback((i) => setIndex(((i % slides.length) + slides.length) % slides.length), [slides.length]);
  const value = useMemo(() => ({ slides, index: index % slides.length, goTo, current: shown?.photo, setOverride }), [slides, index, goTo, shown]);

  return (
    <BgContext.Provider value={value}>
      <PhotoStage shown={shown} index={index} soft={soft} />
      {children}
    </BgContext.Provider>
  );
}

function PhotoStage({ shown, index, soft }) {
  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [videoOk, setVideoOk] = useState(false);

  // mouse parallax (desktop) + gentle scroll drift
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, [0, 1500], [0, -60]);
  const y = useTransform([sy, drift], ([a, b]) => a + b);

  useEffect(() => {
    if (LITE || !window.matchMedia('(pointer: fine)').matches) return;
    const move = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * -24);
      my.set((e.clientY / window.innerHeight - 0.5) * -16);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [mx, my]);

  // phones / slow devices: smaller, gentler camera moves; booking pages: still
  const move = soft
    ? { from: { scale: 1.15 }, to: { scale: 1.15 } }
    : LITE
      ? { from: { scale: 1.04 }, to: { scale: 1.12 } }
      : MOVES[index % MOVES.length];
  const particles = useMemo(() => Array.from({ length: LITE ? 0 : 22 }, (_, i) => ({
    left: Math.random() * 100, size: 3 + Math.random() * 6, dur: 14 + Math.random() * 16, delay: -Math.random() * 30, drift: (Math.random() - 0.5) * 120, i,
  })), []);

  return (
    <div className="photo-bg" aria-hidden="true">
      <motion.div className={`photo-stack ${soft ? 'soft' : ''}`} style={LITE ? undefined : { x: sx, y }}>
        <AnimatePresence initial={false}>
          {shown && (
            <motion.div
              key={shown.key}
              className="photo-slide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            >
              <motion.img decoding="async"
                src={shown.src}
                alt=""
                draggable="false"
                initial={reduce || soft ? move.from : move.from}
                animate={reduce || soft ? move.from : move.to}
                transition={{ duration: SLIDE_MS / 1000 + 2.5, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!LITE && <video
          className={`photo-video ${videoOk ? 'on' : ''}`}
          src="/media/background.mp4"
          autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setVideoOk(true)}
          onError={() => setVideoOk(false)}
        />}
      </motion.div>

      {!shown && <div className="photo-fallback" />}
      <div className="photo-tint" />
      <div className="sun-sweep" />
      <div className="light-particles">
        {particles.map((p) => (
          <i key={p.i} style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, '--drift': `${p.drift}px` }} />
        ))}
      </div>
      <div className="grain" />
    </div>
  );
}
