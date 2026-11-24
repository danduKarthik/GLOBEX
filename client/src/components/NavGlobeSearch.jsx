import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, MapPin } from 'lucide-react';
import { GLOBE_PLACES } from '../globePlaces';
import { WORLD_PLACES } from '../globeWorld';
import { imageUrl } from '../backgrounds';

const ALL = [...GLOBE_PLACES, ...WORLD_PLACES];
const POPULAR = ['Hyderabad', 'Goa', 'Taj Mahal', 'Paris', 'Tokyo', 'Bali', 'Dubai', 'New York']
  .map((n) => ALL.find((p) => p.name.toLowerCase() === n.toLowerCase())).filter(Boolean);
const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const THUMB_KEY = 'tripnova_globe_thumbs_v1';

/**
 * Home-page search (top bar): a small dark field that drops a list of places right under it —
 * same look as the search inside the globe. Picking a place opens the 3D globe and flies there.
 */
export default function NavGlobeSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const [bad, setBad] = useState({});                 // photos that failed to load → show a pin instead
  const box = useRef(null);
  const input = useRef(null);
  const thumbs = useMemo(() => { try { return JSON.parse(localStorage.getItem(THUMB_KEY)) || {}; } catch { return {}; } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return POPULAR;
    const starts = []; const words = []; const rest = []; const seen = new Set();
    ALL.forEach((p) => {
      if (seen.has(p.slug)) return;
      const n = norm(p.name);
      if (n.startsWith(t)) { starts.push(p); seen.add(p.slug); }
      else if (n.split(/[\s-]+/).some((w) => w.startsWith(t))) { words.push(p); seen.add(p.slug); }
      else if (norm(`${p.country} ${p.region || ''}`).includes(t)) { rest.push(p); seen.add(p.slug); }
    });
    return [...starts, ...words, ...rest].slice(0, 8);
  }, [q]);
  useEffect(() => setHi(0), [q]);

  useEffect(() => {
    if (!open) return undefined;
    setTimeout(() => input.current?.focus(), 60);
    const close = (e) => { if (!box.current?.contains(e.target)) { setOpen(false); setQ(''); } };
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); setQ(''); } };
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('keydown', esc); };
  }, [open]);

  const photo = (p) => (bad[p.slug] ? null : p.photo ? imageUrl({ id: p.photo }, 'thumb') : thumbs[p.wiki] || null);
  const pick = (p) => {
    setOpen(false); setQ('');
    window.dispatchEvent(new CustomEvent('globex:open-globe', { detail: { place: p } }));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && results[hi]) { e.preventDefault(); pick(results[hi]); }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); }
  };

  return (
    <div className="ngs" ref={box}>
      <motion.button className="nav-round" onClick={() => setOpen((o) => !o)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} aria-label="Search places" title="Search places">
        <Search size={19} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="ngs-pop" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <label className="ngs-field">
              <Search size={18} />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search Paris, Bali, Machu Picchu…" aria-label="Search places" />
              <button type="button" onClick={() => { setQ(''); setOpen(false); }} aria-label="Close search"><X size={16} /></button>
            </label>
            {results.length > 0 && (
              <div className="ngs-list">
                {!q.trim() && <h6>Popular on the globe</h6>}
                {results.map((p, i) => (
                  <button key={p.slug} type="button" className={i === hi ? 'hi' : ''} onMouseEnter={() => setHi(i)} onClick={() => pick(p)}>
                    {photo(p) ? <img src={photo(p)} alt="" loading="lazy" decoding="async" onError={() => setBad((b) => ({ ...b, [p.slug]: 1 }))} /> : <span className="ngs-noimg"><MapPin size={16} /></span>}
                    <span><b>{p.name}</b><em>{p.country}</em></span>
                  </button>
                ))}
              </div>
            )}
            {q.trim() && results.length === 0 && <p className="ngs-empty">No places match “{q}”.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
