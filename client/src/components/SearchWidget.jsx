import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, TrainFront, Bus, Car, ArrowLeftRight, Search, MapPin, Calendar, Users } from 'lucide-react';
import Button from './Button';
import useCities from './useCities';
import CityPicker from './CityPicker';
import { isoDate } from '../api';
import { useToast } from '../context/ToastContext';

export const MODES = [
  { id: 'flight', label: 'Flights', icon: Plane },
  { id: 'train', label: 'Trains', icon: TrainFront },
  { id: 'bus', label: 'Buses', icon: Bus },
  { id: 'car', label: 'Cars', icon: Car },
];

function Field({ icon: Icon, label, children }) {
  return (
    <motion.label className="field" whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
      <span className="field-label"><Icon size={14} /> {label}</span>
      {children}
    </motion.label>
  );
}

export default function SearchWidget({ initial = {}, compact = false }) {
  const navigate = useNavigate();
  const toast = useToast();
  const cities = useCities();
  const [mode, setMode] = useState(initial.type || 'flight');
  const [from, setFrom] = useState(initial.from || 'HYD');
  const [to, setTo] = useState(initial.to || 'DEL');
  const [date, setDate] = useState(initial.date || isoDate(3));
  const [pax, setPax] = useState(Number(initial.pax) || 1);
  const [location, setLocation] = useState(initial.location || 'HYD');
  const [pickup, setPickup] = useState(initial.pickup || isoDate(1));
  const [ret, setRet] = useState(initial.ret || isoDate(3));
  const [spin, setSpin] = useState(0);

  const swap = () => { setFrom(to); setTo(from); setSpin((s) => s + 180); };

  // trains, buses and cars are India-only: if an international city is selected, fall back
  const isIntl = (code) => cities.find((c) => c.code === code)?.intl;
  const pickMode = (m) => {
    setMode(m);
    if (m !== 'flight') {
      const f = isIntl(from) ? 'HYD' : from;
      if (f !== from) setFrom(f);
      if (isIntl(to)) setTo(f === 'DEL' ? 'BOM' : 'DEL');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'car') {
      if (ret <= pickup) return toast('Return date must be after pickup date', 'error');
      navigate(`/cars?location=${location}&pickup=${pickup}&return=${ret}`);
    } else {
      if (from === to) return toast('Origin and destination must be different', 'error');
      navigate(`/search?type=${mode}&from=${from}&to=${to}&date=${date}&pax=${pax}`);
    }
  };


  return (
    <motion.form
      onSubmit={submit}
      className={`search-widget glass ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay: compact ? 0 : 0.35 }}
    >
      <div className="mode-tabs">
        {MODES.map((m) => (
          <motion.button
            type="button"
            key={m.id}
            className={`mode-tab ${mode === m.id ? 'active' : ''}`}
            onClick={() => pickMode(m.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.93 }}
          >
            {mode === m.id && <motion.span layoutId={compact ? 'mode-pill-c' : 'mode-pill'} className="mode-pill" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            <motion.span className="mode-icon" animate={mode === m.id ? { rotate: [0, -14, 10, 0] } : {}} transition={{ duration: 0.5 }}>
              <m.icon size={17} />
            </motion.span>
            <span>{m.label}</span>
          </motion.button>
        ))}
      </div>

      <>
        <motion.div
          key={mode === 'car' ? 'car' : 'trip'}
          className={`search-fields ${mode === 'car' ? 'car-fields' : ''}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {mode === 'car' ? (
            <>
              <CityPicker label="Pickup city" value={location} onChange={setLocation} cities={cities} domesticOnly />
              <Field icon={Calendar} label="Pickup date">
                <input type="date" value={pickup} min={isoDate(0)} onChange={(e) => setPickup(e.target.value)} />
              </Field>
              <Field icon={Calendar} label="Return date">
                <input type="date" value={ret} min={pickup} onChange={(e) => setRet(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <div className="route-pair">
                <CityPicker label="From" value={from} onChange={setFrom} cities={cities} domesticOnly={mode !== 'flight'} exclude={to} />
                <motion.button type="button" className="swap-btn" onClick={swap} animate={{ rotate: spin }} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} aria-label="Swap cities">
                  <ArrowLeftRight size={16} />
                </motion.button>
                <CityPicker label="To" value={to} onChange={setTo} cities={cities} domesticOnly={mode !== 'flight'} exclude={from} />
              </div>
              <Field icon={Calendar} label="Travel date">
                <input type="date" value={date} min={isoDate(0)} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field icon={Users} label="Travellers">
                <select value={pax} onChange={(e) => setPax(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'traveller' : 'travellers'}</option>)}
                </select>
              </Field>
            </>
          )}
          <Button type="submit" size="lg" icon={Search} className="search-btn">
            {mode === 'car' ? 'Find cars' : 'Search'}
          </Button>
        </motion.div>
      </>
    </motion.form>
  );
}
