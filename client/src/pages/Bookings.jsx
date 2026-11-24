import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, TrainFront, Bus, Car, Ticket, XCircle, Calendar, MapPin, Users, Luggage } from 'lucide-react';
import Page from '../components/Page';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { api, inr, fmtDate, fmtDuration, isoDate } from '../api';
import { useToast } from '../context/ToastContext';

const ICON = { flight: Plane, train: TrainFront, bus: Bus, car: Car };
const TABS = ['Upcoming', 'Past', 'Cancelled', 'All'];

function TicketCard({ b, onCancel, index }) {
  const Icon = ICON[b.type];
  const cancelled = b.status === 'CANCELLED';
  return (
    <motion.article
      layout
      className={`ticket ${cancelled ? 'cancelled' : ''}`}
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      data-hover
    >
      <div className="ticket-left">
        <div className="ticket-head">
          <span className={`ticket-icon t-${b.type}`}><Icon size={18} /></span>
          <div>
            <strong>{b.kind === 'car' ? `${b.car.brand} ${b.car.name}` : `${b.trip.operator} · ${b.trip.number}`}</strong>
            <span className="muted small">{b.kind === 'car' ? `${b.car.type} · ${b.car.transmission} · ${b.car.fuel}` : b.className}</span>
          </div>
          <span className={`status ${cancelled ? 'bad' : 'good'}`}>{b.status}</span>
        </div>

        {b.kind === 'car' ? (
          <div className="ticket-info">
            <span><MapPin size={14} /> {b.rental.location}</span>
            <span><Calendar size={14} /> {fmtDate(b.rental.pickupDate)} → {fmtDate(b.rental.returnDate)}</span>
            <span><Luggage size={14} /> {b.rental.days} day{b.rental.days > 1 ? 's' : ''}{b.rental.withDriver ? ' · with driver' : ' · self-drive'}</span>
          </div>
        ) : (
          <>
            <div className="ticket-route">
              <div><b>{b.trip.departure}</b><span className="muted small">{b.trip.from.name}</span></div>
              <div className="ticket-line"><span className="muted small">{fmtDuration(b.trip.durationMin)}</span><i /></div>
              <div className="right"><b>{b.trip.arrival}{b.trip.dayOffset > 0 && <sup className="plus-day">+{b.trip.dayOffset}</sup>}</b><span className="muted small">{b.trip.to.name}</span></div>
            </div>
            <div className="ticket-info">
              <span><Calendar size={14} /> {fmtDate(b.trip.date)}</span>
              <span><Users size={14} /> {b.passengers.map((p) => `${p.name} (${p.seat})`).join(', ')}</span>
            </div>
          </>
        )}
      </div>
      <div className="ticket-right">
        <span className="muted small">{b.kind === 'car' ? 'Booking ID' : 'PNR'}</span>
        <b className="pnr">{b.pnr}</b>
        <span className="price">{inr(b.amount.total)}</span>
        {cancelled
          ? <span className="muted small">Refund {inr(b.refund)}</span>
          : b.travelDate >= isoDate(0) && <Button size="sm" variant="danger" icon={XCircle} onClick={() => onCancel(b)}>Cancel</Button>}
      </div>
    </motion.article>
  );
}

export default function Bookings() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Upcoming');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/bookings')
      .then((d) => setBookings(d.bookings))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const today = isoDate(0);
  const filtered = useMemo(() => bookings.filter((b) => {
    if (tab === 'All') return true;
    if (tab === 'Cancelled') return b.status === 'CANCELLED';
    if (b.status === 'CANCELLED') return false;
    return tab === 'Upcoming' ? b.travelDate >= today : b.travelDate < today;
  }), [bookings, tab, today]);

  const doCancel = async () => {
    setBusy(true);
    try {
      const d = await api(`/bookings/${confirm.id}/cancel`, { method: 'PATCH' });
      setBookings((bs) => bs.map((b) => (b.id === d.booking.id ? d.booking : b)));
      toast(`Cancelled. ${inr(d.booking.refund)} will be refunded.`, 'success');
      setConfirm(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page className="container bookings-page">
      <motion.div className="page-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow"><Ticket size={14} /> My trips</span>
        <h1>Your <span className="gradient-text">bookings</span></h1>
      </motion.div>

      <div className="chip-group">
        {TABS.map((t) => (
          <motion.button key={t} className={`chip-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
            {tab === t && <motion.span layoutId="booking-tab" className="chip-pill" />}
            <span>{t}</span>
          </motion.button>
        ))}
      </div>

      <div className="tickets">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="ticket skeleton" style={{ height: 150 }} />)
        ) : filtered.length === 0 ? (
          <motion.div className="empty glass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}><Ticket size={40} /></motion.span>
            <h3>No {tab.toLowerCase()} trips yet</h3>
            <p className="muted">Your next adventure is a search away.</p>
            <div className="row gap center">
              <Button to="/">Book a ticket</Button>
              <Button to="/cars" variant="ghost">Rent a car</Button>
            </div>
          </motion.div>
        ) : (
          <>
            {filtered.map((b, i) => <TicketCard key={b.id} b={b} index={i} onCancel={setConfirm} />)}
          </>
        )}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Cancel this booking?">
        {confirm && (
          <>
            <p className="muted">
              You'll receive <b className="gradient-text">{inr(Math.round(confirm.amount.total * 0.8))}</b> (80%) back to your original payment method.
              This can't be undone.
            </p>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setConfirm(null)}>Keep booking</Button>
              <Button variant="danger" loading={busy} onClick={doCancel}>Yes, cancel</Button>
            </div>
          </>
        )}
      </Modal>
    </Page>
  );
}
