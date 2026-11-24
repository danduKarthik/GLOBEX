import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Globe2, Star } from 'lucide-react';
import { POPULAR, cityThumb } from '../places';

/**
 * Searchable city field with suggestions:
 * • empty search → "Popular destinations" (with photos) + all cities grouped India / International
 * • typing → instant matches on city, code, state or country
 * • keyboard: ↑ ↓ Enter Esc · on phones it opens as a bottom sheet
 */
export default function CityPicker({ label, value, onChange, cities, domesticOnly = false, exclude }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const btn = useRef(null);
  const input = useRef(null);
  const listRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [mobile, setMobile] = useState(false);

  const selected = cities.find((c) => c.code === value);
  const pool = useMemo(() => cities.filter((c) => (!domesticOnly || !c.intl) && c.code !== exclude), [cities, domesticOnly, exclude]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    return pool
      .map((c) => {
        const name = c.name.toLowerCase();
        const score = c.code.toLowerCase() === t ? 0 : name.startsWith(t) ? 1 : name.includes(t) ? 2
          : (c.state + ' ' + c.country).toLowerCase().includes(t) ? 3 : c.code.toLowerCase().startsWith(t) ? 4 : 9;
        return { c, score };
      })
      .filter((x) => x.score < 9)
      .sort((a, b) => a.score - b.score || a.c.name.localeCompare(b.c.name))
      .map((x) => x.c);
  }, [q, pool]);

  const popular = useMemo(() => POPULAR.map((code) => pool.find((c) => c.code === code)).filter(Boolean).slice(0, 8), [pool]);
  const flat = results ?? [...popular, ...pool.filter((c) => !POPULAR.includes(c.code))];

  const place = () => {
    const r = btn.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    setMobile(isMobile);
    setPos({ left: Math.min(r.left, window.innerWidth - 380), top: r.bottom + 8, width: Math.max(r.width, 340) });
  };

  const openPicker = () => { place(); setQ(''); setHi(0); setOpen(true); };
  const choose = (c) => { onChange(c.code); setOpen(false); };

  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 60);
    const close = (e) => { if (!e.target.closest?.('.city-pop') && !btn.current.contains(e.target)) setOpen(false); };
    const reflow = () => place();
    document.addEventListener('pointerdown', close);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    if (window.innerWidth < 640) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('scroll', reflow, true);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => { setHi(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (flat[hi]) choose(flat[hi]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  let idx = -1;
  const row = (c, photo) => {
    idx += 1;
    const i = idx;
    return (
      <motion.button
        key={c.code}
        type="button"
        data-i={i}
        className={`city-row ${i === hi ? 'hi' : ''} ${c.code === value ? 'current' : ''}`}
        onMouseEnter={() => setHi(i)}
        onClick={() => choose(c)}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(i * 0.012, 0.2) }}
      >
        {photo ? <img src={cityThumb(c.code)} alt="" loading="lazy" decoding="async" className="city-thumb" /> : <span className="city-ico">{c.intl ? <Globe2 size={15} /> : <MapPin size={15} />}</span>}
        <span className="city-txt"><b>{c.name}</b><em>{c.intl ? c.country : `${c.state}, India`}</em></span>
        <span className="city-code">{c.code}</span>
      </motion.button>
    );
  };

  const domestic = pool.filter((c) => !c.intl && !POPULAR.includes(c.code));
  const intl = pool.filter((c) => c.intl && !POPULAR.includes(c.code));

  return (
    <>
      <motion.button type="button" ref={btn} className="field city-field" onClick={openPicker} whileHover={{ y: -2 }} aria-haspopup="listbox">
        <span className="field-label"><MapPin size={14} /> {label}</span>
        <span className="city-value">{selected ? selected.name : 'Choose city'} {selected && <small>{selected.code}</small>}</span>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <>
              {mobile && <motion.div className="city-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
              <motion.div
                className={`city-pop ${mobile ? 'sheet' : ''}`}
                style={mobile ? {} : { left: pos.left, top: pos.top, width: pos.width }}
                initial={mobile ? { y: '100%' } : { opacity: 0, y: -8, scale: 0.97 }}
                animate={mobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={mobile ? { y: '100%' } : { opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                role="listbox"
              >
                <div className="city-search">
                  <Search size={16} />
                  <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={`${label} — city, country or code`} />
                  <button type="button" className="city-close" onClick={() => (q ? setQ('') : setOpen(false))} aria-label="Clear"><X size={16} /></button>
                </div>
                <div className="city-list" ref={listRef}>
                  {results ? (
                    results.length ? results.map((c) => row(c, true)) : (
                      <p className="city-empty">No city matches “{q}”.{domesticOnly ? ' Trains and buses run within India — switch to Flights for international trips.' : ''}</p>
                    )
                  ) : (
                    <>
                      <h6><Star size={12} /> Popular destinations</h6>
                      {popular.map((c) => row(c, true))}
                      <h6><MapPin size={12} /> India</h6>
                      {domestic.map((c) => row(c, false))}
                      {intl.length > 0 && <h6><Globe2 size={12} /> International</h6>}
                      {intl.map((c) => row(c, false))}
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
