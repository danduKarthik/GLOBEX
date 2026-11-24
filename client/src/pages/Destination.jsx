import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, Clock, Plane, Search, Check, Plus, MapPin, Landmark, Waves, Trees, UtensilsCrossed,
  ShoppingBag, Mountain, Building2, Sparkles, Car, X, IndianRupee, TrainFront, Bus, Users, Ticket,
} from 'lucide-react';
import Page from '../components/Page';
import Img from '../components/Img';
import Button from '../components/Button';
import { useBackground } from '../components/PhotoBackground';
import CityPicker from '../components/CityPicker';
import useCities from '../components/useCities';
import { api, isoDate } from '../api';
import { useToast } from '../context/ToastContext';

const TYPE_ICON = { Landmark, Beach: Waves, Nature: Trees, Food: UtensilsCrossed, Shopping: ShoppingBag, Adventure: Mountain, City: Building2, Culture: Sparkles };
const planKey = (slug) => `tripnova_plan_${slug}`;
const loadPlan = (slug) => { try { return JSON.parse(localStorage.getItem(planKey(slug))) || []; } catch { return []; } };

function SpotCard({ s, selected, onToggle, highlight, index }) {
  const Icon = TYPE_ICON[s.type] || MapPin;
  const ref = useRef(null);
  useEffect(() => {
    if (highlight) setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
  }, [highlight]);
  return (
    <motion.article
      ref={ref}
      layout
      className={`spot-card glass ${selected ? 'selected' : ''} ${highlight ? 'highlight' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 170, damping: 22, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -5 }}
      onClick={onToggle}
      data-hover
    >
      <div className="spot-photo">
        {s.photo ? <Img id={s.photo} size="card" alt={s.name} /> : <span className="spot-icon-bg"><Icon size={40} /></span>}
        <span className="spot-type"><Icon size={13} /> {s.type}</span>
        <motion.button
          className="spot-check"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          whileTap={{ scale: 0.8 }}
          animate={selected ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          aria-pressed={selected}
          aria-label={selected ? `Remove ${s.name} from plan` : `Add ${s.name} to plan`}
        >
          {selected ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
        </motion.button>
      </div>
      <div className="spot-body">
        <h3>{s.name}</h3>
        <p className="muted">{s.desc}</p>
        <div className="spot-meta">
          <span><Clock size={13} /> {s.hours >= 24 ? 'Overnight' : `${s.hours} h`}</span>
          <span><IndianRupee size={13} /> {s.cost}</span>
        </div>
      </div>
    </motion.article>
  );
}


function TripPlanner({ d }) {
  const navigate = useNavigate();
  const cities = useCities();
  const domestic = d.country === 'India';
  const modes = domestic
    ? [{ id: 'flight', label: 'Flight', icon: Plane }, { id: 'train', label: 'Train', icon: TrainFront }, { id: 'bus', label: 'Bus', icon: Bus }]
    : [{ id: 'flight', label: 'Flight', icon: Plane }];
  const [mode, setMode] = useState(domestic && d.airport === 'WGL' ? 'train' : 'flight');
  const [from, setFrom] = useState(d.airport === 'HYD' ? 'WGL' : 'HYD');
  const [date, setDate] = useState(isoDate(7));
  const [pax, setPax] = useState(1);
  const search = () => navigate(`/search?type=${mode}&from=${from}&to=${d.airport}&date=${date}&pax=${pax}`);
  return (
    <motion.section id="book-trip" className="planner glass" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="planner-head">
        <span className="eyebrow"><Ticket size={14} /> Book your trip</span>
        <h2>Travel to {d.name}</h2>
      </div>
      <div className="mode-tabs">
        {modes.map((m) => (
          <motion.button type="button" key={m.id} className={`mode-tab ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)} whileTap={{ scale: 0.93 }}>
            {mode === m.id && <motion.span layoutId="planner-pill" className="mode-pill" />}
            <span className="mode-icon"><m.icon size={17} /></span><span>{m.label}</span>
          </motion.button>
        ))}
      </div>
      <div className="planner-fields">
        <CityPicker label="From" value={from} onChange={setFrom} cities={cities} domesticOnly={mode !== 'flight'} exclude={d.airport} />
        <div className="field planner-to"><span className="field-label"><MapPin size={14} /> To</span><span className="city-value">{d.name} <small>{d.airport}</small></span></div>
        <label className="field"><span className="field-label"><CalendarDays size={14} /> Date</span>
          <input type="date" value={date} min={isoDate(0)} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field"><span className="field-label"><Users size={14} /> Travellers</span>
          <select value={pax} onChange={(e) => setPax(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
        <Button size="lg" icon={Search} onClick={search} className="search-btn">Search {mode === 'flight' ? 'flights' : mode === 'train' ? 'trains' : 'buses'}</Button>
      </div>
      {domestic && (
        <button className="planner-car" onClick={() => navigate(`/cars?location=${d.airport === 'WGL' ? 'WGL' : d.airport}`)}>
          <Car size={16} /> Or rent a car in {d.name} <span>→</span>
        </button>
      )}
    </motion.section>
  );
}

export default function Destination() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useBackground();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [plan, setPlan] = useState(() => loadPlan(slug));
  const focusSpot = params.get('spot');

  useEffect(() => {
    setD(null); setError(''); setQ(''); setType('All'); setPlan(loadPlan(slug));
    api(`/destinations/${slug}`).then((r) => setD(r.destination)).catch((e) => setError(e.message));
  }, [slug]);

  // this destination's own photos become the animated background
  useEffect(() => {
    if (!d || !bg) return;
    const ids = [d.cover, ...d.gallery, ...d.spots.map((s) => s.photo).filter(Boolean)];
    bg.setOverride([...new Set(ids)].slice(0, 7).map((id, i) => ({ key: `${d.slug}-${i}`, id, place: d.name })));
    return () => bg.setOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  useEffect(() => { try { localStorage.setItem(planKey(slug), JSON.stringify(plan)); } catch {} }, [plan, slug]);

  const types = useMemo(() => (d ? ['All', ...new Set(d.spots.map((s) => s.type))] : []), [d]);
  const spots = useMemo(() => {
    if (!d) return [];
    const t = q.trim().toLowerCase();
    return d.spots.filter((s) => (type === 'All' || s.type === type) && (!t || `${s.name} ${s.desc} ${s.type}`.toLowerCase().includes(t)));
  }, [d, q, type]);

  if (error) return <Page className="container"><div className="empty glass"><h3>{error}</h3><Button to="/explore">All destinations</Button></div></Page>;
  if (!d) return <Page className="container"><div className="page-loader"><span className="spinner" /></div></Page>;

  const chosen = d.spots.filter((s) => plan.includes(s.id));
  const hours = chosen.reduce((a, s) => a + Math.min(s.hours, 8), 0);
  const toggle = (s) => {
    const on = plan.includes(s.id);
    setPlan((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]));
    toast(on ? `Removed ${s.name}` : `Added ${s.name} to your ${d.name} plan`, on ? 'info' : 'success');
  };
  const from = d.airport === 'HYD' ? 'DEL' : 'HYD';
  const flightUrl = `/search?type=flight&from=${from}&to=${d.airport}&date=${isoDate(14)}&pax=1`;
  const domestic = d.country === 'India';

  return (
    <Page className="container destination-page">
      <Link to="/explore" className="back-crumb"><ArrowLeft size={16} /> All destinations</Link>

      <section className="dest-hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dest-hero-copy">
          <span className="eyebrow">{domestic ? <MapPin size={14} /> : <Plane size={14} />} {d.country} · {d.region}</span>
          <h1>{d.name}</h1>
          <p className="dest-tagline">{d.tagline}</p>
          <div className="dest-facts">
            <span><CalendarDays size={15} /> Best time <b>{d.bestTime}</b></span>
            <span><Clock size={15} /> Ideal trip <b>{d.days}</b></span>
            <span><Plane size={15} /> Fly into <b>{d.airportName} ({d.airport})</b></span>
          </div>
          <div className="dest-actions">
            <Button size="lg" icon={Ticket} onClick={() => document.getElementById('book-trip')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Book a trip to {d.name}</Button>
            {domestic && <Button to={`/cars?location=${d.airport}`} size="lg" variant="ghost" icon={Car}>Rent a car here</Button>}
          </div>
        </motion.div>
        <motion.div className="dest-about glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>About {d.name}</h3>
          <p className="muted">{d.about}</p>
          <div className="dest-tags">{d.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
        </motion.div>
      </section>

      <TripPlanner d={d} />

      <section className="section spots-section">
        <div className="spots-head">
          <div>
            <span className="eyebrow"><Landmark size={14} /> Places to visit</span>
            <h2>Top spots in {d.name}</h2>
            <p className="muted">Tap the places you want to see — we'll build your plan.</p>
          </div>
          <label className="explore-search">
            <Search size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search places in ${d.name}…`} />
            {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={15} /></button>}
          </label>
        </div>
        <div className="chip-group scroll-x">
          {types.map((t) => (
            <motion.button key={t} className={`chip-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
              {type === t && <motion.span layoutId="spot-type-pill" className="chip-pill" />}
              <span>{t}</span>
            </motion.button>
          ))}
        </div>

        <motion.div layout className="spots-grid">
          <>
            {spots.map((s, i) => (
              <SpotCard key={s.id} s={s} index={i} selected={plan.includes(s.id)} onToggle={() => toggle(s)} highlight={focusSpot === s.id} />
            ))}
          </>
        </motion.div>
        {spots.length === 0 && <div className="empty glass"><Search size={28} /><h3>No places match “{q}”</h3></div>}
      </section>

      <AnimatePresence>
        {chosen.length > 0 && (
          <motion.div className="plan-bar" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <div className="plan-info">
              <b>Your {d.name} plan · {chosen.length} place{chosen.length > 1 ? 's' : ''}</b>
              <span className="muted small">About {Math.round(hours)} h of sightseeing · {Math.max(1, Math.ceil(hours / 8))} day{hours > 8 ? 's' : ''}</span>
              <div className="plan-chips">
                {chosen.map((s) => (
                  <motion.button key={s.id} layout className="plan-chip" onClick={() => toggle(s)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    {s.name} <X size={12} />
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="plan-actions">
              <button className="back-link" onClick={() => setPlan([])}>Clear</button>
              <Button icon={Ticket} onClick={() => document.getElementById('book-trip')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Book this trip</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
