import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car } from 'lucide-react';
import Page from '../components/Page';
import CarCard from '../components/CarCard';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TYPES = ['All', 'Hatchback', 'Sedan', 'SUV', 'MUV', 'EV', 'Luxury'];

export default function Cars() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const [cars, setCars] = useState([]);
  const [driverFee, setDriverFee] = useState(800);
  const [type, setType] = useState('All');
  const [sort, setSort] = useState('price');
  const [loading, setLoading] = useState(true);

  const defaults = useMemo(() => ({
    location: params.get('location'),
    pickup: params.get('pickup'),
    ret: params.get('return'),
  }), [params]);

  useEffect(() => {
    api('/cars')
      .then((d) => { setCars(d.cars); setDriverFee(d.driverFeePerDay); })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const visible = useMemo(() => {
    const list = type === 'All' ? cars : cars.filter((c) => c.type === type);
    return [...list].sort(sort === 'price' ? (a, b) => a.pricePerDay - b.pricePerDay : (a, b) => b.rating - a.rating);
  }, [cars, type, sort]);

  const rentUrl = (car) => {
    const q = new URLSearchParams();
    if (defaults.location) q.set('location', defaults.location);
    if (defaults.pickup) q.set('pickup', defaults.pickup);
    if (defaults.ret) q.set('return', defaults.ret);
    return `/rent/${car.id}${q.toString() ? `?${q}` : ''}`;
  };

  const onRent = (car) => {
    if (!user) {
      toast('Please log in to rent a car', 'info');
      navigate('/login', { state: { from: rentUrl(car) } });
      return;
    }
    navigate(rentUrl(car));
  };

  return (
    <Page className="container cars-page">
      <motion.div className="page-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow"><Car size={14} /> Car rental</span>
        <h1>Pick your <span className="gradient-text">perfect ride</span></h1>
        <p className="muted">Self-drive or chauffeur-driven. Hover a car to take it for a spin.</p>
      </motion.div>

      <div className="cars-toolbar">
        <div className="chip-group scroll-x">
          {TYPES.map((t) => (
            <motion.button key={t} className={`chip-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
              {type === t && <motion.span layoutId="car-type-pill" className="chip-pill" />}
              <span>{t}</span>
            </motion.button>
          ))}
        </div>
        <select className="input sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="price">Price: low to high</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <motion.div layout className="cars-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="car-card glass skeleton" style={{ height: 380 }} />)
          : (
            <>
              {visible.map((c) => <CarCard key={c.id} car={c} onRent={onRent} />)}
            </>
          )}
      </motion.div>

    </Page>
  );
}
