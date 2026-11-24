import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, Search, MapPin, CalendarDays, Landmark, ArrowRight } from 'lucide-react';
import Page from '../components/Page';
import Img from '../components/Img';
import useDestinations from '../components/useDestinations';

export const REGION_TABS = ['All', 'India', 'Asia', 'Islands', 'Middle East', 'Europe', 'Americas'];

export function DestinationCard({ d, big = false, index = 0 }) {
  return (
    <motion.div
      layout
      className={big ? 'explore-big' : ''}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link to={`/explore/${d.slug}`} className="photo-card explore-card" data-hover>
        <Img id={d.cover} size={big ? false : 'card'} alt={d.name} />
        <span className="photo-card-shade" />
        <span className="photo-card-top">
          <span className="tag light">{d.region === 'India' ? <MapPin size={12} /> : <Globe2 size={12} />} {d.country}</span>
          <span className="tag light"><Landmark size={12} /> {d.spotCount} places</span>
        </span>
        <span className="photo-card-body">
          <b>{d.name}</b>
          <em>{d.tagline}</em>
          <span className="explore-cta"><CalendarDays size={14} /> Best: {d.bestTime} <ArrowRight size={14} /></span>
        </span>
      </Link>
    </motion.div>
  );
}

export default function Explore() {
  const all = useDestinations();
  const [region, setRegion] = useState('All');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter((d) => (region === 'All' || d.region === region)
      && (!t || `${d.name} ${d.country} ${d.tagline} ${d.tags.join(' ')}`.toLowerCase().includes(t)));
  }, [all, region, q]);

  return (
    <Page className="container explore-page">
      <motion.div className="page-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow"><Globe2 size={14} /> Explore</span>
        <h1>Famous places <span className="gradient-text">around the world</span></h1>
        <p className="muted">Pick a destination to see its must-visit spots, choose the ones you like, and book your trip.</p>
      </motion.div>

      <Link to="/world" className="world-cta glass" data-hover>
        <span className="world-cta-globe"><Globe2 size={26} /></span>
        <span className="world-cta-txt"><b>Browse all 250 countries</b><em>Every country, region and city — with its tourist places, live from the Wikivoyage travel guide</em></span>
        <ArrowRight size={20} />
      </Link>

      <div className="explore-toolbar">
        <label className="explore-search">
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, country or vibe (beach, mountains…)" />
        </label>
        <div className="chip-group scroll-x">
          {REGION_TABS.map((r) => (
            <motion.button key={r} className={`chip-btn ${region === r ? 'active' : ''}`} onClick={() => setRegion(r)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
              {region === r && <motion.span layoutId="region-pill" className="chip-pill" />}
              <span>{r}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div layout className="explore-grid">
        {all.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="photo-card skeleton" />)
          : (
            <>
              {list.map((d, i) => <DestinationCard key={d.slug} d={d} index={i} big={i === 0 && region === 'All' && !q} />)}
            </>
          )}
      </motion.div>
      {all.length > 0 && list.length === 0 && (
        <div className="empty glass"><Search size={30} /><h3>No destinations match</h3><p className="muted">Try another region or search word.</p></div>
      )}
    </Page>
  );
}
