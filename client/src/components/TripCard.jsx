import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, TrainFront, Bus, Star, ChevronDown, Armchair } from 'lucide-react';
import Button from './Button';
import { inr, fmtDuration } from '../api';

const ICON = { flight: Plane, train: TrainFront, bus: Bus };

export default function TripCard({ trip, index, onBook }) {
  const [cls, setCls] = useState(trip.classes[0]);
  const [open, setOpen] = useState(false);
  const Icon = ICON[trip.type];
  const stopsLabel = trip.type === 'flight'
    ? (trip.stops ? `${trip.stops} stop` : 'Non-stop')
    : `${trip.stops} halt${trip.stops > 1 ? 's' : ''}`;

  return (
    <motion.article
      layout
      className="trip-card glass"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      data-hover
    >
      <div className="trip-main">
        <div className="trip-operator">
          <motion.div className="op-badge" whileHover={{ rotate: 8, scale: 1.08 }}>{trip.operatorCode}</motion.div>
          <div>
            <strong>{trip.operator}</strong>
            <span className="muted small">{trip.number}</span>
          </div>
        </div>

        <div className="trip-timeline">
          <div className="t-end">
            <span className="t-time">{trip.departure}</span>
            <span className="muted small">{trip.from.name}</span>
          </div>
          <div className="t-mid">
            <span className="muted small">{fmtDuration(trip.durationMin)}</span>
            <div className="t-line">
              <span className="t-dot" />
              <motion.span className="t-mover" animate={{ left: ['0%', '100%'] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}>
                <Icon size={14} />
              </motion.span>
              <span className="t-dot" />
            </div>
            <span className="muted small">{stopsLabel}</span>
          </div>
          <div className="t-end right">
            <span className="t-time">{trip.arrival}{trip.dayOffset > 0 && <sup className="plus-day">+{trip.dayOffset}</sup>}</span>
            <span className="muted small">{trip.to.name}</span>
          </div>
        </div>

        <div className="trip-price">
          <span className="rating"><Star size={13} fill="currentColor" /> {trip.rating}</span>
          <motion.span key={cls.price} className="price" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{inr(cls.price)}</motion.span>
          <span className="muted small">per person</span>
          <Button size="sm" onClick={() => onBook(trip, cls)}>Book now</Button>
        </div>
      </div>

      <div className="class-row">
        {trip.classes.map((c) => (
          <motion.button
            key={c.name}
            className={`class-chip ${cls.name === c.name ? 'active' : ''}`}
            onClick={() => setCls(c)}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{c.name}</span>
            <b>{inr(c.price)}</b>
            <em className={c.seatsLeft < 8 ? 'low' : ''}><Armchair size={11} /> {c.seatsLeft} left</em>
          </motion.button>
        ))}
        <motion.button className="details-toggle" onClick={() => setOpen((o) => !o)} whileHover={{ x: 2 }}>
          Details <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={15} /></motion.span>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="trip-details" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="details-inner">
              <div><span className="muted small">Distance</span><b>{trip.distanceKm} km</b></div>
              <div><span className="muted small">Date</span><b>{trip.date}</b></div>
              <div className="amenities">
                {trip.amenities.map((a, i) => (
                  <motion.span key={a} className="tag" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>{a}</motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
