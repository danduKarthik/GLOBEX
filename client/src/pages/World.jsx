import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe2, Search, X } from 'lucide-react';
import Page from '../components/Page';
import { api } from '../api';
import Flag from '../components/Flag';

let cache = null;
export const guideLink = (title, country) =>
  `/guide/${encodeURIComponent(title)}${country ? `?country=${encodeURIComponent(country)}` : ''}`;

/** Every country & territory in the world (250), with region tabs and instant search. */
export default function World() {
  const [data, setData] = useState(cache);
  const [error, setError] = useState('');
  const [region, setRegion] = useState('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (cache) return;
    api('/world/countries').then((d) => { cache = d; setData(d); }).catch((e) => setError(e.message));
  }, []);

  const list = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    return data.countries.filter((c) => (region === 'All' || c.region === region)
      && (!t || `${c.name} ${c.official} ${c.capital} ${c.subregion}`.toLowerCase().includes(t)));
  }, [data, region, q]);

  return (
    <Page className="container world-page">
      <motion.div className="page-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow"><Globe2 size={14} /> The whole world</span>
        <h1>Every country, <span className="gradient-text">every tourist place</span></h1>
        <p className="muted">Pick any of {data ? data.countries.length : 250} countries to see its regions, cities and the places worth visiting, then book your trip there.</p>
      </motion.div>

      <div className="explore-toolbar">
        <label className="explore-search">
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a country or capital — Japan, Peru, Nairobi…" />
          {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={15} /></button>}
        </label>
        <div className="chip-group scroll-x">
          {['All', ...(data?.regions || [])].map((r) => (
            <motion.button key={r} className={`chip-btn ${region === r ? 'active' : ''}`} onClick={() => setRegion(r)} whileTap={{ scale: 0.94 }}>
              {region === r && <motion.span layoutId="world-region-pill" className="chip-pill" />}
              <span>{r}{data && r !== 'All' ? ` · ${data.countries.filter((c) => c.region === r).length}` : ''}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {error && <div className="empty glass"><h3>{error}</h3></div>}
      {!data && !error && <div className="page-loader"><span className="spinner" /></div>}
      {data && (
        <>
          <p className="muted small world-count">{list.length} {list.length === 1 ? 'country' : 'countries'}</p>
          <div className="country-grid">
            {list.map((c) => (
              <Link key={c.code} to={guideLink(c.guide, c.name)} className="country-tile glass" data-hover>
                <span className="country-flag" aria-hidden="true"><Flag code={c.code} emoji={c.flag} /></span>
                <span className="country-txt">
                  <b>{c.name}</b>
                  <em>{c.capital ? `Capital: ${c.capital}` : c.subregion || c.region}</em>
                </span>
              </Link>
            ))}
          </div>
          {list.length === 0 && <div className="empty glass"><Search size={28} /><h3>No country matches “{q}”</h3></div>}
        </>
      )}
    </Page>
  );
}
