import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, Landmark, ArrowRight, X , Globe2 } from 'lucide-react';
import { searchAll, KIND_LABEL } from '../searchAll';
import Img from './Img';
import Flag from './Flag';

const QUICK = [
  { slug: 'hyderabad', name: 'Hyderabad' }, { slug: 'warangal', name: 'Warangal' }, { slug: 'goa', name: 'Goa' },
  { slug: 'delhi', name: 'Delhi' }, { slug: 'jaipur', name: 'Jaipur' }, { slug: 'kerala', name: 'Kerala' },
  { slug: 'dubai', name: 'Dubai' }, { slug: 'bali', name: 'Bali' }, { slug: 'paris', name: 'Paris' },
];

/**
 * Big home-page search: type a city → see it plus its tourist places instantly.
 * Picking a city opens all its places (select the ones you like, then book from there).
 */
export default function HeroSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [hi, setHi] = useState(0);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      searchAll(term)
        .then((list) => { setResults(list); setHi(0); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 160);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) setFocused(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const go = (r) => navigate(r.to || (r.kind === 'spot' ? `/explore/${r.slug}?spot=${r.spotId}` : `/explore/${r.slug}`));
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && results[hi]) { e.preventDefault(); go(results[hi]); }
    else if (e.key === 'Escape') setFocused(false);
  };

  const open = focused && q.trim().length > 0;

  return (
    <motion.div
      className="hero-search"
      ref={box}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 110, damping: 18 }}
    >
      <label className={`hs-input ${focused ? 'focus' : ''}`}>
        <Search size={22} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKey}
          placeholder="Search a city to see its tourist places — Hyderabad, Goa, Paris…"
          aria-label="Search a city or place"
        />
        {loading && <span className="spinner sm" />}
        {q && <button type="button" className="hs-clear" onClick={() => setQ('')} aria-label="Clear"><X size={16} /></button>}
      </label>

      <div className="hs-quick">
        <motion.button type="button" className="hs-globe" onClick={() => window.dispatchEvent(new Event('globex:open-globe'))} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
          <span className="fab-earth mini" /> Open the 3D globe
        </motion.button>
        <span>Popular:</span>
        {QUICK.map((c) => (
          <motion.button key={c.slug} type="button" onClick={() => navigate(`/explore/${c.slug}`)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
            {c.name}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="hs-results" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {!loading && results.length === 0 && <p className="ps-empty">No places match “{q}”. Try a city, a country or a landmark.</p>}
            {results.map((r, i) => (
              <button key={r.key || `${r.slug}-${r.spotId || ''}`} type="button" className={`ps-row ${i === hi ? 'hi' : ''}`} onMouseEnter={() => setHi(i)} onClick={() => go(r)}>
                {r.kind === 'country' ? <span className="ps-thumb ps-flag"><Flag code={r.code} emoji={r.flag} size={36} /></span> : r.kind === 'guide' ? <span className="ps-thumb ps-globe"><Globe2 size={22} /></span> : <Img id={r.cover} size="thumb" className="ps-thumb" />}
                <span className="ps-txt">
                  <b>{r.name}</b>
                  <em>{r.kind === 'spot' ? <Landmark size={12} /> : r.kind === 'destination' ? <MapPin size={12} /> : null} {r.sub}</em>
                </span>
                <span className="ps-kind">{r.kind === 'spot' ? 'Place' : r.kind === 'country' ? 'Country' : 'See places'}</span>
                <ArrowRight size={16} className="ps-arrow" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
