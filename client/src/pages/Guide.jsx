import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe2, MapPin, Landmark, Search, X, Check, Plus, Clock, Ticket, Plane, TrainFront, Bus, Car,
  CalendarDays, Users, Map as MapIcon, ExternalLink, Sparkles, RefreshCw, ChevronDown, Compass,
} from 'lucide-react';
import Page from '../components/Page';
import Img from '../components/Img';
import Flag from '../components/Flag';
import Button from '../components/Button';
import CityPicker from '../components/CityPicker';
import useCities from '../components/useCities';
import { useBackground } from '../components/PhotoBackground';
import { guideLink } from './World';
import { api, isoDate } from '../api';
import { buildGuideInBrowser } from '../browserGuide';
import { useToast } from '../context/ToastContext';

const display = (t = '') => t.split('/').pop().replace(/\s*\(.*\)$/, '');
const inIndia = (lat, lon) => lat > 6.5 && lat < 35.7 && lon > 68 && lon < 97.5;
const planKey = (t) => `tripnova_plan_guide_${t}`;
const loadPlan = (t) => { try { return JSON.parse(localStorage.getItem(planKey(t))) || []; } catch { return []; } };
const mapUrl = (lat, lon) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;

/* -------- book a trip to any place on Earth -------- */
function WorldPlanner({ name, lat, lon, country }) {
  const navigate = useNavigate();
  const toast = useToast();
  const cities = useCities();
  const domestic = country ? /india/i.test(country) : inIndia(lat, lon);
  const [mode, setMode] = useState('flight');
  const [from, setFrom] = useState('HYD');
  const [date, setDate] = useState(isoDate(7));
  const [pax, setPax] = useState(1);
  const [busy, setBusy] = useState(false);
  const modes = domestic
    ? [{ id: 'flight', label: 'Flight', icon: Plane }, { id: 'train', label: 'Train', icon: TrainFront }, { id: 'bus', label: 'Bus', icon: Bus }]
    : [{ id: 'flight', label: 'Flight', icon: Plane }];

  const search = async () => {
    setBusy(true);
    try {
      const { city } = await api('/world/bookable', { method: 'POST', body: { name, lat, lon, country } });
      if (city.code === from) return toast('You are already there — pick a different starting city', 'error');
      navigate(`/search?type=${mode}&from=${from}&to=${city.code}&date=${date}&pax=${pax}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.section id="book-trip" className="planner glass" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="planner-head">
        <span className="eyebrow"><Ticket size={14} /> Book your trip</span>
        <h2>Travel to {name}</h2>
      </div>
      <div className="mode-tabs">
        {modes.map((m) => (
          <motion.button type="button" key={m.id} className={`mode-tab ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)} whileTap={{ scale: 0.93 }}>
            {mode === m.id && <motion.span layoutId="world-planner-pill" className="mode-pill" />}
            <span className="mode-icon"><m.icon size={17} /></span><span>{m.label}</span>
          </motion.button>
        ))}
      </div>
      <div className="planner-fields">
        <CityPicker label="From" value={from} onChange={setFrom} cities={cities} domesticOnly={mode !== 'flight'} />
        <div className="field planner-to"><span className="field-label"><MapPin size={14} /> To</span><span className="city-value">{name}</span></div>
        <label className="field"><span className="field-label"><CalendarDays size={14} /> Date</span>
          <input type="date" value={date} min={isoDate(0)} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field"><span className="field-label"><Users size={14} /> Travellers</span>
          <select value={pax} onChange={(e) => setPax(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select>
        </label>
        <Button size="lg" icon={Search} onClick={search} loading={busy} className="search-btn">Search {mode === 'flight' ? 'flights' : mode === 'train' ? 'trains' : 'buses'}</Button>
      </div>
      {domestic && (
        <button className="planner-car" onClick={() => navigate('/cars')}><Car size={16} /> Or rent a car <span>→</span></button>
      )}
    </motion.section>
  );
}

/* -------- one place card -------- */
function PlaceCard({ p, selected, onToggle, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.article
      className={`spot-card glass ${selected ? 'selected' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onToggle}
      data-hover
    >
      <div className="spot-photo">
        {p.photo ? <Img src={p.photo} alt={p.name} /> : <span className="spot-icon-bg">{p.type === 'Do' ? <Sparkles size={38} /> : <Landmark size={38} />}</span>}
        <span className="spot-type">{p.type === 'Do' ? <Sparkles size={13} /> : <Landmark size={13} />} {p.type === 'Do' ? 'Things to do' : 'Sight'}</span>
        <motion.button className="spot-check" onClick={(e) => { e.stopPropagation(); onToggle(); }} whileTap={{ scale: 0.8 }} aria-pressed={selected} aria-label={selected ? `Remove ${p.name}` : `Add ${p.name}`}>
          {selected ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
        </motion.button>
      </div>
      <div className="spot-body">
        <h3>{p.name}</h3>
        {p.alt && <span className="muted small">{p.alt}</span>}
        {p.desc && <p className={`muted ${open ? '' : 'clamp-3'}`}>{p.desc}</p>}
        {p.desc && p.desc.length > 140 && (
          <button className="more-link" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>{open ? 'Less' : 'More'}</button>
        )}
        <div className="spot-meta wrap">
          {p.hours && <span><Clock size={13} /> {p.hours}</span>}
          {p.price && <span><Ticket size={13} /> {p.price}</span>}
          {p.district && <span><MapPin size={13} /> {p.district}</span>}
        </div>
        <div className="spot-links" onClick={(e) => e.stopPropagation()}>
          {p.lat != null && p.lon != null && <a href={mapUrl(p.lat, p.lon)} target="_blank" rel="noreferrer"><MapIcon size={13} /> Map</a>}
          {p.url && <a href={p.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Website</a>}
        </div>
      </div>
    </motion.article>
  );
}

/* -------- region / city cards -------- */
function SubSection({ title, icon: Icon, items, country }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 12);
  return (
    <section className="section sub-section">
      <h2 className="sub-title"><Icon size={22} /> {title} <span className="muted">· {items.length}</span></h2>
      <div className="sub-grid">
        {shown.map((s) => (
          <Link key={s.title} to={guideLink(s.title, country)} className="photo-card sub-card" data-hover>
            {s.photo ? <Img src={s.photo} alt={s.name} /> : <span className="img-fallback" />}
            <span className="photo-card-shade" />
            <span className="photo-card-body">
              <b>{display(s.name || s.title)}</b>
              {s.desc && <em className="clamp-2">{s.desc}</em>}
              <span className="explore-cta"><Landmark size={14} /> See places <span>→</span></span>
            </span>
          </Link>
        ))}
      </div>
      {items.length > 12 && (
        <button className="more-link center" onClick={() => setAll((a) => !a)}>{all ? 'Show fewer' : `Show all ${items.length}`} <ChevronDown size={14} /></button>
      )}
    </section>
  );
}

export default function Guide() {
  const params = useParams();
  const title = decodeURIComponent(params['*'] || '');
  const location = useLocation();
  const countryHint = new URLSearchParams(location.search).get('country') || '';
  const toast = useToast();
  const bg = useBackground();
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [plan, setPlan] = useState([]);
  const [leadOpen, setLeadOpen] = useState(false);
  const [direct, setDirect] = useState(false);

  useEffect(() => {
    setGuide(null); setError(''); setQ(''); setType('All'); setLeadOpen(false); setDirect(false);
    let alive = true;
    const show = (g) => { if (!alive) return; setGuide(g); setPlan(loadPlan(g.title)); };
    api(`/world/guide?title=${encodeURIComponent(title)}`)
      .then((d) => show(d.guide))
      .catch((e) => {
        if (e.status === 404) throw e;
        // the server was limited by Wikimedia (or offline) → load it straight from the browser
        if (alive) setDirect(true);
        return buildGuideInBrowser(title).then(show);
      })
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [title, reload]);

  // the destination's own photos become the moving background
  useEffect(() => {
    if (!guide || !bg) return;
    const srcs = [guide.bannerUrl, ...guide.places.map((p) => p.photo)].filter(Boolean).slice(0, 6);
    if (srcs.length) bg.setOverride(srcs.map((src, i) => ({ key: `g-${guide.title}-${i}`, src, place: display(guide.title) })));
    return () => bg.setOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide]);

  useEffect(() => { if (guide) try { localStorage.setItem(planKey(guide.title), JSON.stringify(plan)); } catch {} }, [plan, guide]);

  const places = useMemo(() => {
    if (!guide) return [];
    const t = q.trim().toLowerCase();
    return guide.places.filter((p) => (type === 'All' || p.type === type) && (!t || `${p.name} ${p.alt} ${p.desc} ${p.district || ''}`.toLowerCase().includes(t)));
  }, [guide, q, type]);

  if (error) {
    return (
      <Page className="container guide-page">
        <Link to="/world" className="back-crumb"><ArrowLeft size={16} /> All countries</Link>
        <div className="empty glass">
          <Compass size={36} />
          <h3>{error}</h3>
          <p className="muted">Travel guides are loaded live from Wikivoyage. Check your internet connection and try again in a moment.</p>
          <Button icon={RefreshCw} onClick={() => setReload((r) => r + 1)}>Try again</Button>
        </div>
      </Page>
    );
  }
  if (!guide) {
    return (
      <Page className="container guide-page">
        <div className="guide-loading">
          <span className="spinner" />
          <p>Loading the travel guide for <b>{display(title)}</b>…</p>
          <span className="muted small">{direct ? 'Loading directly from Wikivoyage in your browser…' : "First visit can take a few seconds — after that it's instant."}</span>
        </div>
      </Page>
    );
  }

  const name = display(guide.title);
  const country = guide.country?.name || countryHint;
  const lat = guide.geo?.lat ?? guide.country?.lat ?? null;
  const lon = guide.geo?.lon ?? guide.country?.lon ?? null;
  const chosen = guide.places.filter((p) => plan.includes(p.id));
  const toggle = (p) => {
    const on = plan.includes(p.id);
    setPlan((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]));
    toast(on ? `Removed ${p.name}` : `Added ${p.name} to your ${name} plan`, on ? 'info' : 'success');
  };
  const types = ['All', ...new Set(guide.places.map((p) => p.type))];
  const kindLabel = { country: 'Country', region: 'Region', city: 'City', park: 'Park' }[guide.kind] || 'Destination';
  const lead = guide.lead || `Explore ${name}.`;

  return (
    <Page className="container guide-page">
      <div className="crumbs">
        <Link to="/world" className="back-crumb"><Globe2 size={15} /> All countries</Link>
        {guide.partOf && <Link to={guideLink(guide.partOf, country)} className="back-crumb"><ArrowLeft size={15} /> {display(guide.partOf)}</Link>}
      </div>

      <section className="dest-hero">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dest-hero-copy">
          <span className="eyebrow">{guide.country?.flag ? <span className="eyebrow-flag"><Flag code={guide.country.code} emoji={guide.country.flag} size={20} /></span> : <MapPin size={14} />} {kindLabel}{country && guide.kind !== 'country' ? ` · ${country}` : ''}</span>
          <h1>{name}</h1>
          <div className="dest-facts">
            {guide.country?.capital && <span><Landmark size={15} /> Capital <b>{guide.country.capital}</b></span>}
            {guide.country?.subregion && <span><Globe2 size={15} /> <b>{guide.country.subregion}</b></span>}
            {guide.places.length > 0 && <span><MapPin size={15} /> <b>{guide.places.length}</b> places to visit</span>}
            {lat != null && <a className="fact-link" href={mapUrl(lat, lon)} target="_blank" rel="noreferrer"><MapIcon size={15} /> View on map</a>}
          </div>
          <div className="dest-actions">
            {lat != null && (
              <Button size="lg" icon={Ticket} onClick={() => document.getElementById('book-trip')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Book a trip to {name}</Button>
            )}
            {guide.places.length > 0 && (
              <Button size="lg" variant="ghost" icon={Landmark} onClick={() => document.getElementById('places')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>See places</Button>
            )}
          </div>
        </motion.div>
        <motion.div className="dest-about glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>About {name}</h3>
          <p className={`muted ${leadOpen ? '' : 'clamp-6'}`}>{lead}</p>
          {lead.length > 320 && <button className="more-link" onClick={() => setLeadOpen((o) => !o)}>{leadOpen ? 'Show less' : 'Read more'}</button>}
          <a className="source-link" href={guide.source} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Full guide on Wikivoyage</a>
        </motion.div>
      </section>

      {lat != null && <WorldPlanner name={name} lat={lat} lon={lon} country={country} />}

      {guide.places.length > 0 && (
        <section id="places" className="section spots-section">
          <div className="spots-head">
            <div>
              <span className="eyebrow"><Landmark size={14} /> Places to visit</span>
              <h2>Top places in {name}</h2>
              <p className="muted">Tap the places you want to see — we'll build your plan.</p>
            </div>
            <label className="explore-search">
              <Search size={17} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search places in ${name}…`} />
              {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={15} /></button>}
            </label>
          </div>
          {types.length > 2 && (
            <div className="chip-group scroll-x">
              {types.map((t) => (
                <motion.button key={t} className={`chip-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)} whileTap={{ scale: 0.94 }}>
                  {type === t && <motion.span layoutId="guide-type-pill" className="chip-pill" />}
                  <span>{t === 'See' ? 'Sights' : t === 'Do' ? 'Things to do' : 'All'}</span>
                </motion.button>
              ))}
            </div>
          )}
          <div className="spots-grid">
            {places.map((p, i) => <PlaceCard key={p.id} p={p} index={i} selected={plan.includes(p.id)} onToggle={() => toggle(p)} />)}
          </div>
          {places.length === 0 && <div className="empty glass"><Search size={28} /><h3>No places match “{q}”</h3></div>}
        </section>
      )}

      <SubSection title={guide.kind === 'country' ? 'Regions' : 'Areas'} icon={Globe2} items={guide.links.regions} country={country} />
      <SubSection title="Cities" icon={MapPin} items={guide.links.cities} country={country} />
      <SubSection title="Other destinations" icon={Compass} items={guide.links.destinations} country={country} />
      <SubSection title="Districts" icon={MapIcon} items={guide.kind === 'country' ? [] : guide.links.districts} country={country} />

      {!guide.places.length && !guide.links.cities.length && !guide.links.regions.length && !guide.links.destinations.length && (
        <div className="empty glass"><Compass size={30} /><h3>This guide doesn't list specific places yet</h3>
          <p className="muted">Read the full guide on Wikivoyage, or book a trip and explore it yourself!</p></div>
      )}

      <p className="attribution muted small">
        Travel information from <a href={guide.source} target="_blank" rel="noreferrer">Wikivoyage</a> (CC BY-SA). Photos from Wikipedia / Wikimedia Commons.
      </p>

      <AnimatePresence>
        {chosen.length > 0 && (
          <motion.div className="plan-bar" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <div className="plan-info">
              <b>Your {name} plan · {chosen.length} place{chosen.length > 1 ? 's' : ''}</b>
              <div className="plan-chips">
                {chosen.map((p) => <button key={p.id} className="plan-chip" onClick={() => toggle(p)}>{p.name} <X size={12} /></button>)}
              </div>
            </div>
            <div className="plan-actions">
              <button className="back-link" onClick={() => setPlan([])}>Clear</button>
              {lat != null && <Button icon={Ticket} onClick={() => document.getElementById('book-trip')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Book this trip</Button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
