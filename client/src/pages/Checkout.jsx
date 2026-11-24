import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, UserPlus, X, Lock, Mail, Pencil, Plane, TrainFront, Bus, Clock, CalendarDays, Armchair } from 'lucide-react';
import CheckoutLayout, { Stepper } from '../components/CheckoutLayout';
import Button from '../components/Button';
import PaymentForm, { validatePayment } from '../components/PaymentForm';
import SeatMap from '../components/SeatMap';
import Success from '../components/Success';
import { api, inr, fmtDate, fmtDuration } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STEPS = ['Travellers', 'Seats', 'Payment'];
const GENDERS = ['Male', 'Female', 'Other'];
const ICON = { flight: Plane, train: TrainFront, bus: Bus };
const blank = () => ({ name: '', age: '', gender: 'Male', seat: '' });

/** Full-page, light checkout for flights / trains / buses: travellers → seats → payment. */
export default function Checkout() {
  const [params] = useSearchParams();
  const tripId = params.get('trip');
  const className = params.get('class');
  const pax = Math.min(6, Math.max(1, Number(params.get('pax')) || 1));
  const { user } = useAuth();
  const toast = useToast();

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [passengers, setPassengers] = useState(() => Array.from({ length: pax }, blank));
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [editContact, setEditContact] = useState(false);
  const [method, setMethod] = useState('card');
  const [payDetails, setPayDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [seatMap, setSeatMap] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api(`/trips/${encodeURIComponent(tripId)}`).then((d) => setTrip(d.trip)).catch((e) => setError(e.message));
  }, [tripId]);

  useEffect(() => {
    if (!user) return;
    setPassengers((ps) => ps.map((p, i) => (i === 0 && !p.name ? { ...p, name: user.name } : p)));
    setContact((c) => ({ email: c.email || user.email || '', phone: c.phone || user.phone || '' }));
  }, [user]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const seatsById = useMemo(() => {
    if (!seatMap) return {};
    return Object.fromEntries(seatMap.layout.decks.flatMap((d) => d.rows.flat().filter(Boolean)).map((s) => [s.id, s]));
  }, [seatMap]);

  const backToResults = trip
    ? `/search?type=${trip.type}&from=${trip.from.code}&to=${trip.to.code}&date=${trip.date}&pax=${pax}`
    : '/';

  if (error) {
    return (
      <CheckoutLayout back="/" backLabel="Home" title="Trip not available">
        <div className="ck-card"><p className="muted">{error}</p><Button to="/">Search again</Button></div>
      </CheckoutLayout>
    );
  }
  if (!trip) {
    return <CheckoutLayout back="/" title="Loading your trip…"><div className="ck-card ck-loading"><span className="spinner" /></div></CheckoutLayout>;
  }

  const cls = trip.classes.find((c) => c.name === className) || trip.classes[0];
  const Icon = ICON[trip.type];
  const fare = cls.price * passengers.length;
  const seatFees = passengers.reduce((sum, p) => sum + (seatsById[p.seat]?.fee || 0), 0);
  const base = fare + seatFees;
  const taxes = Math.round(base * 0.05);
  const total = base + taxes + 49;
  const allSeated = passengers.length > 0 && passengers.every((p) => p.seat);
  const done = !!booking;

  const update = (i, k, v) => setPassengers((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  const next = async () => {
    if (step === 0) {
      const bad = passengers.findIndex((p) => !p.name.trim() || !(Number(p.age) > 0 && Number(p.age) < 120));
      if (bad !== -1) return toast(`Add a name and age for traveller ${bad + 1}`, 'error');
      if (!/^\S+@\S+\.\S+$/.test(contact.email)) { setEditContact(true); return toast('Add an email for your ticket', 'error'); }
      return setStep(1);
    }
    if (step === 1) {
      if (!allSeated) return toast('Pick a seat for every traveller', 'error');
      return setStep(2);
    }
    const payErr = validatePayment(method, payDetails);
    if (payErr) return toast(payErr, 'error');
    setLoading(true);
    try {
      const d = await api('/bookings', {
        method: 'POST',
        body: { kind: 'transport', tripId: trip.id, className: cls.name, passengers, contact, paymentMethod: method },
      });
      setBooking(d.booking);
      setStep(3);
      toast('Booking confirmed! 🎉', 'success');
    } catch (e) {
      toast(e.message, 'error');
      if (/seat/i.test(e.message)) {
        setPassengers((ps) => ps.map((p) => ({ ...p, seat: '' })));
        setReloadKey((k) => k + 1);
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = step === 0 ? 'Continue to seats' : step === 1 ? 'Continue to payment' : `Pay ${inr(total)}`;
  const actionBtn = (
    <Button block icon={step === 2 ? Lock : undefined} iconRight={step < 2 ? ArrowRight : undefined} loading={loading} onClick={next}>
      {actionLabel}
    </Button>
  );

  const summary = (
    <div className="ck-card ck-summary">
      <div className="ck-trip">
        <span className="ck-trip-icon"><Icon size={18} /></span>
        <div>
          <b>{trip.operator}</b>
          <span className="muted small">{trip.number} · {cls.name}</span>
        </div>
      </div>
      <div className="ck-route">
        <div><b>{trip.departure}</b><span>{trip.from.name}</span></div>
        <div className="ck-route-mid"><span className="muted small">{fmtDuration(trip.durationMin)}</span><i /></div>
        <div className="right"><b>{trip.arrival}{trip.dayOffset > 0 && <sup>+{trip.dayOffset}</sup>}</b><span>{trip.to.name}</span></div>
      </div>
      <div className="ck-meta">
        <span><CalendarDays size={14} /> {fmtDate(trip.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span><Clock size={14} /> {fmtDuration(trip.durationMin)}</span>
      </div>
      {passengers.some((p) => p.seat) && (
        <div className="seat-summary">
          {passengers.map((p, i) => <span key={i}><Armchair size={12} /> {p.name.split(' ')[0] || `Traveller ${i + 1}`} · <b>{seatsById[p.seat]?.label || p.seat || '—'}</b></span>)}
        </div>
      )}
      <div className="price-lines ck-prices">
        <span>Fare ({inr(cls.price)} × {passengers.length})</span><b>{inr(fare)}</b>
        {seatFees > 0 && <><span>Seat selection</span><b>{inr(seatFees)}</b></>}
        <span>Taxes (5%)</span><b>{inr(taxes)}</b>
        <span>Convenience fee</span><b>{inr(49)}</b>
      </div>
      <div className="ck-total"><span>Total</span><motion.strong key={total} initial={{ scale: 1.15, color: '#0d9488' }} animate={{ scale: 1, color: '#0f2533' }}>{inr(total)}</motion.strong></div>
      {!done && <div className="ck-aside-action">{actionBtn}</div>}
    </div>
  );

  return (
    <CheckoutLayout
      back={done ? '/bookings' : backToResults}
      backLabel={done ? 'My trips' : 'Back to results'}
      title={`${trip.from.name} → ${trip.to.name}`}
      subtitle={`${trip.operator} · ${fmtDate(trip.date)} · ${trip.departure} – ${trip.arrival}`}
      aside={summary}
      mobileBar={done ? null : (
        <>
          <div className="ck-mb-total"><span>Total</span><b>{inr(total)}</b></div>
          {actionBtn}
        </>
      )}
    >
      {!done && <Stepper steps={STEPS} step={step} />}

      <motion.div key={step} className="ck-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        {step === 0 && (
          <div className="stack">
            <h2 className="step-title">Who's travelling?</h2>
            {passengers.map((p, i) => (
              <div key={i} className="traveller-card">
                <div className="tc-head">
                  <span>Traveller {i + 1}</span>
                  {passengers.length > 1 && (
                    <button className="tc-remove" onClick={() => setPassengers((ps) => ps.filter((_, j) => j !== i))}><X size={14} /> Remove</button>
                  )}
                </div>
                <div className="tc-fields">
                  <label className="lf grow"><span>Full name</span>
                    <input className="input" placeholder="As on ID proof" value={p.name} onChange={(e) => update(i, 'name', e.target.value)} />
                  </label>
                  <label className="lf age"><span>Age</span>
                    <input className="input" inputMode="numeric" placeholder="25" value={p.age} onChange={(e) => update(i, 'age', e.target.value.replace(/\D/g, '').slice(0, 3))} />
                  </label>
                </div>
                <div className="segmented" role="radiogroup" aria-label="Gender">
                  {GENDERS.map((g) => (
                    <button key={g} type="button" role="radio" aria-checked={p.gender === g} className={p.gender === g ? 'on' : ''} onClick={() => update(i, 'gender', g)}>
                      {p.gender === g && <motion.span layoutId={`g-${i}`} className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                      <span>{g}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {passengers.length < 6 && (
              <button className="add-link" onClick={() => setPassengers((ps) => [...ps, blank()])}><UserPlus size={16} /> Add another traveller</button>
            )}
            <div className="contact-line">
              {editContact ? (
                <div className="tc-fields">
                  <label className="lf grow"><span>Email for ticket</span>
                    <input className="input" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                  </label>
                  <label className="lf grow"><span>Mobile</span>
                    <input className="input" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                  </label>
                </div>
              ) : (
                <>
                  <Mail size={16} />
                  <span>Ticket will be sent to <b>{contact.email || 'your email'}</b>{contact.phone ? <> · {contact.phone}</> : null}</span>
                  <button className="edit-link" onClick={() => setEditContact(true)}><Pencil size={13} /> Edit</button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="stack">
            <div className="ck-step-head">
              <h2 className="step-title">Choose your seat{passengers.length > 1 ? 's' : ''}</h2>
              <button className="back-link" onClick={() => setStep(0)}><ArrowLeft size={15} /> Travellers</button>
            </div>
            <SeatMap trip={trip} className={cls.name} passengers={passengers} onChange={setPassengers} onMap={setSeatMap} reloadKey={reloadKey} />
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <div className="ck-step-head">
              <h2 className="step-title">How would you like to pay?</h2>
              <button className="back-link" onClick={() => setStep(1)}><ArrowLeft size={15} /> Seats</button>
            </div>
            <PaymentForm method={method} setMethod={setMethod} details={payDetails} setDetails={setPayDetails} />
          </div>
        )}

        {done && (
          <div className="stack">
            <Success title="You're all set!">
              <p className="muted">PNR <b className="pnr">{booking.pnr}</b></p>
              <div className="seat-summary center">
                {booking.passengers.map((p) => <span key={p.seat}>{p.name} · <b>Seat {p.seatLabel || p.seat}</b></span>)}
              </div>
              <p className="muted small">A copy has been sent to {contact.email}</p>
            </Success>
            <div className="ck-done-actions">
              <Button to="/" variant="ghost">Book another trip</Button>
              <Button to="/bookings" iconRight={ArrowRight}>View my trips</Button>
            </div>
          </div>
        )}
      </motion.div>
    </CheckoutLayout>
  );
}
