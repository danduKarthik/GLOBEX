import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, MapPin, Landmark, Globe2, ArrowRight } from 'lucide-react';
import { searchAll, KIND_LABEL } from '../searchAll';
import Img from './Img';
import Flag from './Flag';
import useDestinations from './useDestinations';

/**
 * "Where do you want to go?" search in the top bar.
 * Finds destinations (Paris, Goa…) AND places inside them (Eiffel Tower, Charminar…).
 * Empty → popular destinations. Keyboard: ↑ ↓ Enter Esc. On phones it opens full-screen.
 */
export default function PlaceSearch({ round = false }) {
  const navigate = useNavigate();
  const all = useDestinations();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hi, setHi] = useState(0);
  const input = useRef(null);

  // debounce the API call
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      searchAll(term)
        .then((list) => { setResults(list); setHi(0); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 80);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  // global shortcut: "/" or Ctrl+K opens search
  useEffect(() => {
    const k = (e) => {
      if ((e.key === '/' && !/input|textarea|select/i.test(e.target.tagName)) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault(); setOpen(true);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const popular = all.slice(0, 8).map((d) => ({ kind: 'destination', slug: d.slug, name: d.name, sub: `${d.country} · ${d.tagline}`, cover: d.cover }));
  const list = q.trim() ? results : popular;

  const go = (r) => {
    setOpen(false); setQ('');
    navigate(r.to || (r.kind === 'spot' ? `/explore/${r.slug}?spot=${r.spotId}` : `/explore/${r.slug}`));
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && list[hi]) { e.preventDefault(); go(list[hi]); }
  };

  return (
    <>
      {round ? (
        <motion.button className="nav-round" onClick={() => setOpen(true)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} aria-label="Search places" title="Search places (/)">
          <Search size={19} />
        </motion.button>
      ) : (
        <motion.button className="place-trigger" onClick={() => setOpen(true)} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} aria-label="Search places">
          <Search size={16} />
          <span className="pt-text">Search places, cities, landmarks…</span>
          <kbd>/</kbd>
        </motion.button>
      )}

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="ps-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
              <motion.div
                className="ps-panel"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: -24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              >
                <div className="ps-input">
                  <Search size={20} />
                  <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
                    placeholder="Where to? Try “Paris”, “Taj Mahal”, “beach”…" aria-label="Search places" />
                  {loading && <span className="spinner sm" />}
                  <button className="ps-close" onClick={() => (q ? setQ('') : setOpen(false))} aria-label="Clear"><X size={18} /></button>
                </div>

                <div className="ps-results">
                  <h6>{q.trim() ? (list.length ? 'Results' : '') : <><Globe2 size={12} /> Popular around the world</>}</h6>
                  {q.trim() && !loading && list.length === 0 && (
                    <p className="ps-empty">No places match “{q}”. Try a city, a country or a landmark.</p>
                  )}
                  {list.map((r, i) => (
                    <motion.button
                      key={r.key || `${r.slug}-${r.spotId || ''}`}
                      className={`ps-row ${i === hi ? 'hi' : ''}`}
                      onMouseEnter={() => setHi(i)}
                      onClick={() => go(r)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.25) }}
                    >
                      {r.kind === 'country' ? <span className="ps-thumb ps-flag"><Flag code={r.code} emoji={r.flag} size={36} /></span> : r.kind === 'guide' ? <span className="ps-thumb ps-globe"><Globe2 size={22} /></span> : <Img id={r.cover} size="thumb" className="ps-thumb" />}
                      <span className="ps-txt">
                        <b>{r.name}</b>
                        <em>{r.kind === 'spot' ? <Landmark size={12} /> : r.kind === 'destination' ? <MapPin size={12} /> : null} {r.sub}</em>
                      </span>
                      <span className="ps-kind">{KIND_LABEL[r.kind]}</span>
                      <ArrowRight size={16} className="ps-arrow" />
                    </motion.button>
                  ))}
                </div>
                <div className="ps-foot">
                  <button onClick={() => { setOpen(false); navigate('/world'); }}>Browse all 250 countries <ArrowRight size={14} /></button>
                  <span className="muted small">↑ ↓ to move · Enter to open · Esc to close</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
