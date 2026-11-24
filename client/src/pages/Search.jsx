import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Sunrise, Sun, Sunset, Moon, SearchX, Plane } from 'lucide-react';
import Button from '../components/Button';
import Page from '../components/Page';
import SearchWidget from '../components/SearchWidget';
import TripCard from '../components/TripCard';
import { api, isoDate, fmtDate, inr } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SORTS = [
  { id: 'price', label: 'Cheapest' },
  { id: 'duration', label: 'Fastest' },
  { id: 'departure', label: 'Earliest' },
  { id: 'rating', label: 'Top rated' },
];
const SLOTS = [
  { id: 'morning', label: 'Morning', icon: Sunrise, range: [5, 12] },
  { id: 'afternoon', label: 'Afternoon', icon: Sun, range: [12, 17] },
  { id: 'evening', label: 'Evening', icon: Sunset, range: [17, 21] },
  { id: 'night', label: 'Night', icon: Moon, range: [21, 29] },
];
const inSlot = (time, slot) => {
  let h = Number(time.slice(0, 2));
  if (h < 5) h += 24;
  return h >= slot.range[0] && h < slot.range[1];
};

function Skeleton() {
  return (
    <div className="trip-card glass skeleton">
      <div className="sk sk-a" /><div className="sk sk-b" /><div className="sk sk-c" />
    </div>
  );
}

export default function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();

  const type = params.get('type') || 'flight';
  const from = params.get('from') || 'HYD';
  const to = params.get('to') || 'DEL';
  const date = params.get('date') || isoDate(3);
  const pax = Number(params.get('pax')) || 1;

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('price');
  const [slots, setSlots] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (type === 'car') { navigate('/cars', { replace: true }); return; }
    setLoading(true); setError(''); setSlots([]); setMaxPrice(null);
    api(`/search?type=${type}&from=${from}&to=${to}&date=${date}`)
      .then((d) => setTrips(d.trips))
      .catch((e) => { setError(e.message); setTrips([]); })
      .finally(() => setLoading(false));
  }, [type, from, to, date, navigate]);

  const priceBounds = useMemo(() => {
    if (!trips.length) return [0, 0];
    const ps = trips.map((t) => t.price);
    return [Math.min(...ps), Math.max(...ps)];
  }, [trips]);

  const visible = useMemo(() => {
    let list = trips.filter((t) => (maxPrice == null || t.price <= maxPrice) && (!slots.length || slots.some((s) => inSlot(t.departure, SLOTS.find((x) => x.id === s)))));
    const by = {
      price: (a, b) => a.price - b.price,
      duration: (a, b) => a.durationMin - b.durationMin,
      departure: (a, b) => a.departure.localeCompare(b.departure),
      rating: (a, b) => b.rating - a.rating,
    }[sort];
    return [...list].sort(by);
  }, [trips, sort, slots, maxPrice]);

  const onBook = (trip, cls) => {
    if (!user) {
      toast('Please log in to book your ticket', 'info');
      navigate('/login', { state: { from: `/book?trip=${encodeURIComponent(trip.id)}&class=${encodeURIComponent(cls.name)}&pax=${pax}` } });
      return;
    }
    navigate(`/book?trip=${encodeURIComponent(trip.id)}&class=${encodeURIComponent(cls.name)}&pax=${pax}`);
  };

  const toggleSlot = (id) => setSlots((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Page className="container search-page">
      <SearchWidget compact initial={{ type, from, to, date, pax }} key={`${type}${from}${to}${date}${pax}`} />

      <div className="results-head">
        <div>
          <h2>{loading ? 'Searching…' : `${visible.length} ${type === 'flight' ? 'flights' : type === 'train' ? 'trains' : 'buses'} found`}</h2>
          <span className="muted">{fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} · {pax} traveller{pax > 1 ? 's' : ''}</span>
        </div>
        <motion.button className="icon-btn filter-toggle" onClick={() => setShowFilters((s) => !s)} whileTap={{ scale: 0.9 }}>
          <SlidersHorizontal size={18} />
        </motion.button>
      </div>

      <div className="results-layout">
        <aside className={`filters glass ${showFilters ? 'open' : ''}`}>
          <h4>Sort by</h4>
          <div className="chip-group">
            {SORTS.map((s) => (
              <motion.button key={s.id} className={`chip-btn ${sort === s.id ? 'active' : ''}`} onClick={() => setSort(s.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
                {sort === s.id && <motion.span layoutId="sort-pill" className="chip-pill" />}
                <span>{s.label}</span>
              </motion.button>
            ))}
          </div>

          <h4>Departure time</h4>
          <div className="slot-grid">
            {SLOTS.map((s) => (
              <motion.button key={s.id} className={`slot ${slots.includes(s.id) ? 'active' : ''}`} onClick={() => toggleSlot(s.id)} whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}>
                <s.icon size={18} />
                <span>{s.label}</span>
              </motion.button>
            ))}
          </div>

          {trips.length > 0 && priceBounds[1] > priceBounds[0] && (
            <>
              <h4>Max price <span className="gradient-text">{inr(maxPrice ?? priceBounds[1])}</span></h4>
              <input
                type="range" className="range"
                min={priceBounds[0]} max={priceBounds[1]} step="10"
                value={maxPrice ?? priceBounds[1]}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </>
          )}
        </aside>

        <section className="results">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
          ) : error ? (
            <div className="empty glass">
              <SearchX size={36} /><h3>{error}</h3>
              {type !== 'flight' && (
                <Button icon={Plane} onClick={() => navigate(`/search?type=flight&from=${from}&to=${to}&date=${date}&pax=${pax}`)}>Search flights instead</Button>
              )}
            </div>
          ) : visible.length === 0 ? (
            <motion.div className="empty glass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <SearchX size={36} />
              <h3>No results match your filters</h3>
              <p className="muted">Try clearing a time slot or raising the max price.</p>
            </motion.div>
          ) : (
            <>
              {visible.map((t, i) => <TripCard key={t.id} trip={t} index={i} onBook={onBook} />)}
            </>
          )}
        </section>
      </div>

    </Page>
  );
}
