import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { LITE } from '../perf';
import { globeControl } from './GlobeHero';

/**
 * Opening: a starry sky, "GLOBEX" decodes letter by letter, then the tagline —
 * and the whole thing fades away to the home page (the 3D globe has loaded meanwhile).
 * Click / Skip to jump in.
 */
const SHOW_MS = 2400;   // how long the title stays
const WORD = 'GLOBEX';
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+';

function Decode({ start }) {
  const [txt, setTxt] = useState(WORD.replace(/./g, ' '));
  useEffect(() => {
    if (!start) return undefined;
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      setTxt(WORD.split('').map((ch, i) => {
        const lock = 4 + i * 3;                       // each letter settles a little after the previous one
        if (frame >= lock) return ch;
        if (frame < i * 2) return ' ';
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join(''));
      if (frame > 4 + WORD.length * 3) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [start]);
  return (
    <span className="ix-word" aria-label="GlobeX">
      {txt.split('').map((c, i) => <span key={i} className={c === WORD[i] ? 'ok' : ''}>{c === ' ' ? ' ' : c}</span>)}
    </span>
  );
}

export default function Intro({ onDone }) {
  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const started = useRef(false);
  const [phase, setPhase] = useState('wait'); // wait (globe loading) → title → zoom
  const stars = useMemo(() => Array.from({ length: LITE ? 60 : 140 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, s: Math.random() < 0.12 ? 3 : Math.random() < 0.4 ? 2 : 1,
    d: (Math.random() * 3).toFixed(2), t: (2 + Math.random() * 3).toFixed(2),
  })), []);

  const finish = useCallback(() => {
    if (!started.current) globeControl.introSkip?.();
    onDone();
  }, [onDone]);

  useEffect(() => {
    document.documentElement.classList.add('intro-on');
    return () => document.documentElement.classList.remove('intro-on');
  }, []);

  // the title starts straight away; the 3D globe loads underneath meanwhile
  useEffect(() => { const t = setTimeout(() => setPhase('title'), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (phase !== 'title') return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      started.current = true;
      setPhase('zoom');
      if (globeControl.present) await Promise.race([globeControl.ready, new Promise((r) => setTimeout(r, 2500))]);
      globeControl.introSkip?.();          // show the home page (globe + options)
      if (alive) onDone();                  // and fade the intro away
    }, reduce ? 500 : SHOW_MS);
    return () => { alive = false; clearTimeout(t); };
  }, [phase, onDone, reduce]);

  const zoom = phase === 'zoom';
  const title = phase !== 'wait';

  return createPortal(
    <motion.div className="intro ix" onClick={finish} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: 'easeInOut' }}>
      <motion.div className="gx-stars" animate={{ opacity: zoom ? 0 : 1 }} transition={{ duration: zoom ? 1 : 0.8 }}>
        {stars.map((s, k) => (
          <i key={k} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />
        ))}
      </motion.div>

      <div className="ix-center">
        {/* name + tagline */}
        <motion.div className="ix-text" animate={{ opacity: zoom ? 0 : 1, scale: zoom ? 1.08 : 1 }} transition={{ duration: 0.6 }}>
          <Decode start={title} />
          <motion.p className="ix-tag" initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={title ? { opacity: 1, letterSpacing: '0.32em' } : {}} transition={{ delay: 1.1, duration: 0.9 }}>
            Explore · Plan · Travel
          </motion.p>
        </motion.div>
      </div>

      <motion.button className="intro-skip" onClick={(e) => { e.stopPropagation(); finish(); }} initial={{ opacity: 0 }} animate={{ opacity: zoom ? 0 : 1 }} transition={{ delay: zoom ? 0 : 0.5 }}>
        Skip ›
      </motion.button>
    </motion.div>,
    document.body,
  );
}
