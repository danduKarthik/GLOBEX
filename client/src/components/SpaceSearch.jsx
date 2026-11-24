import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, Landmark, ArrowRight, X, Globe2, LocateFixed, Star, Building2, Palmtree, Landmark as Monument, Castle, ChevronDown, Box, LogIn, TreePalm } from 'lucide-react';
import { searchAll } from '../searchAll';
import { GLOBE_PLACES } from '../globePlaces';
import Img from './Img';
import Flag from './Flag';

const CHIPS = [
  { slug: 'hyderabad', name: 'Hyderabad', icon: Building2 },
  { slug: 'goa', name: 'Goa', icon: Palmtree },
  { slug: 'delhi', name: 'Delhi', icon: Monument },
  { slug: 'jaipur', name: 'Jaipur', icon: Castle },
  { slug: 'kerala', name: 'Kerala', icon: TreePalm },
];
const MORE = ['mumbai', 'agra', 'varanasi', 'ladakh', 'warangal', 'dubai', 'bali', 'paris', 'london', 'tokyo', 'new-york', 'singapore', 'maldives'];

/** Home search: glass bar with "Use my location" + Explore, and quick chips underneath. */
export default function SpaceSearch({ bar = true }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [hi, setHi] = useState(0);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [locating, setLocating] = useState(false);
  const box = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return undefined; }
    setLoading(true);
    const t = setTimeout(() => {
      searchAll(term).then((list) => { setResults(list); setHi(0); }).catch(() => setResults([])).finally(() => setLoading(false));
    }, 160);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) { setFocused(false); setMore(false); } };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const go = (r) => navigate(r.to || (r.kind === 'spot' ? `/explore/${r.slug}?spot=${r.spotId}` : `/explore/${r.slug}`));
  const submit = () => {
    if (results[hi]) go(results[hi]);
    else if (q.trim()) input.current?.focus();
    else navigate('/explore');
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Escape') setFocused(false);
  };

  // nearest GlobeX destination to where you are
  const useLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: la, longitude: lo } = pos.coords;
      let best = null; let bd = Infinity;
      GLOBE_PLACES.filter((p) => p.kind === 'featured').forEach((p) => {
        const d = (p.lat - la) ** 2 + ((p.lon - lo) * Math.cos((la * Math.PI) / 180)) ** 2;
        if (d < bd) { bd = d; best = p; }
      });
      setLocating(false);
      if (best) navigate(`/explore/${best.slug}`);
    }, () => setLocating(false), { timeout: 8000 });
  };

  const open = focused && q.trim().length > 0;
  const nameOf = (slug) => GLOBE_PLACES.find((p) => p.slug === slug)?.name || slug;

  return (
    <div className="space-search" ref={box}>
      {bar && <div className={`ss-bar ${focused ? 'focus' : ''}`}>
        <Search size={24} className="ss-icon" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocused(true)} onKeyDown={onKey}
          placeholder="Search a city to see its tourist places — e.g. Hyderabad, Goa, Paris..." aria-label="Search a city or place" />
        {loading && <span className="spinner sm" />}
        {q && <button type="button" className="ss-clear" onClick={() => setQ('')} aria-label="Clear"><X size={16} /></button>}
        <span className="ss-div" />
        <button type="button" className="ss-loc" onClick={useLocation}>{locating ? <span className="spinner sm" /> : <LocateFixed size={17} />} <span>Use My Location</span></button>
        <motion.button type="button" className="ss-go" onClick={submit} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <LogIn size={18} /> Explore
        </motion.button>
      </div>}

      <div className="ss-chips">
        <motion.button type="button" className="ss-chip" onClick={() => navigate('/explore')} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
          <Star size={17} /> Popular
        </motion.button>
        {CHIPS.map((c) => (
          <motion.button key={c.slug} type="button" className="ss-chip" onClick={() => navigate(`/explore/${c.slug}`)} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <c.icon size={17} /> {c.name}
          </motion.button>
        ))}
        <span className="ss-sep" />
        <div className="ss-more-wrap">
          <motion.button type="button" className={`ss-chip ${more ? 'open' : ''}`} onClick={() => setMore((m) => !m)} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            More <ChevronDown size={16} />
          </motion.button>
          <AnimatePresence>
            {more && (
              <motion.div className="ss-more" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
                {MORE.map((slug) => <button key={slug} type="button" onClick={() => navigate(`/explore/${slug}`)}><MapPin size={14} /> {nameOf(slug)}</button>)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="hs-results ss-results" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {!loading && results.length === 0 && <p className="ps-empty">No places match “{q}”. Try a city, a country or a landmark.</p>}
            {results.map((r, i) => (
              <button key={r.key || `${r.slug}-${r.spotId || ''}`} type="button" className={`ps-row ${i === hi ? 'hi' : ''}`} onMouseEnter={() => setHi(i)} onClick={() => go(r)}>
                {r.kind === 'country' ? <span className="ps-thumb ps-flag"><Flag code={r.code} emoji={r.flag} size={36} /></span> : r.kind === 'guide' ? <span className="ps-thumb ps-globe"><Globe2 size={22} /></span> : <Img id={r.cover} size="thumb" className="ps-thumb" />}
                <span className="ps-txt"><b>{r.name}</b><em>{r.kind === 'spot' ? <Landmark size={12} /> : r.kind === 'destination' ? <MapPin size={12} /> : null} {r.sub}</em></span>
                <span className="ps-kind">{r.kind === 'spot' ? 'Place' : r.kind === 'country' ? 'Country' : 'See places'}</span>
                <ArrowRight size={16} className="ps-arrow" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
