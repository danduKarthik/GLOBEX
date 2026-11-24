import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCheck, Lock, ArrowRight, ArrowLeft, Users, Cog, Fuel, CalendarDays, MapPin } from 'lucide-react';
import CheckoutLayout, { Stepper } from '../components/CheckoutLayout';
import Button from '../components/Button';
import CityPicker from '../components/CityPicker';
import CarIllustration from '../components/CarIllustration';
import PaymentForm, { validatePayment } from '../components/PaymentForm';
import Success from '../components/Success';
import useCities from '../components/useCities';
import { api, inr, isoDate, fmtDate } from '../api';
import { useToast } from '../context/ToastContext';

const STEPS = ['Trip details', 'Payment'];

/** Full-page, light car-rental checkout: where & when → pay. */
export default function RentCheckout() {
  const { carId } = useParams();
  const [params] = useSearchParams();
  const cities = useCities();
  const toast = useToast();
  const [car, setCar] = useState(null);
  const [driverFee, setDriverFee] = useState(800);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState(params.get('location') || 'HYD');
  const [pickup, setPickup] = useState(params.get('pickup') || isoDate(1));
  const [ret, setRet] = useState(params.get('return') || isoDate(3));
  const [withDriver, setWithDriver] = useState(false);
  const [method, setMethod] = useState('card');
  const [payDetails, setPayDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    api('/cars').then((d) => {
      const c = d.cars.find((x) => x.id === carId);
      if (!c) setError('This car is not available'); else { setCar(c); setDriverFee(d.driverFeePerDay); }
    }).catch((e) => setError(e.message));
  }, [carId]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  if (error) return <CheckoutLayout back="/cars" backLabel="All cars" title={error}><div className="ck-card"><Button to="/cars">Choose another car</Button></div></CheckoutLayout>;
  if (!car) return <CheckoutLayout back="/cars" title="Loading…"><div className="ck-card ck-loading"><span className="spinner" /></div></CheckoutLayout>;

  const days = Math.max(0, Math.round((new Date(ret) - new Date(pickup)) / 86400000));
  const base = days * car.pricePerDay + (withDriver ? days * driverFee : 0);
  const taxes = Math.round(base * 0.05);
  const total = base + taxes + 49;
  const cityName = cities.find((c) => c.code === location)?.name || location;
  const done = !!booking;

  const next = async () => {
    if (step === 0) {
      if (days < 1) return toast('Return date must be after pickup date', 'error');
      if (days > 30) return toast('Rentals are limited to 30 days', 'error');
      return setStep(1);
    }
    const payErr = validatePayment(method, payDetails);
    if (payErr) return toast(payErr, 'error');
    setLoading(true);
    try {
      const d = await api('/bookings', {
        method: 'POST',
        body: { kind: 'car', carId: car.id, pickupDate: pickup, returnDate: ret, location, withDriver, paymentMethod: method },
      });
      setBooking(d.booking);
      setStep(2);
      toast(`${car.name} reserved! 🚗`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const actionBtn = (
    <Button block icon={step === 1 ? Lock : undefined} iconRight={step === 0 ? ArrowRight : undefined} loading={loading} onClick={next} disabled={days < 1}>
      {step === 0 ? 'Continue to payment' : `Pay ${inr(total)}`}
    </Button>
  );

  const summary = (
    <div className="ck-card ck-summary">
      <div className="ck-car" style={{ '--car': car.color }}>
        <motion.div initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 70, damping: 14 }}>
          <CarIllustration color={car.color} type={car.type} hovered={false} />
        </motion.div>
      </div>
      <div className="ck-trip">
        <div><b>{car.brand} {car.name}</b><span className="muted small">{car.type} · {inr(car.pricePerDay)}/day</span></div>
      </div>
      <div className="car-mini-specs">
        <span><Users size={14} /> {car.seats} seats</span><span><Cog size={14} /> {car.transmission}</span><span><Fuel size={14} /> {car.fuel}</span>
      </div>
      <div className="ck-meta">
        <span><MapPin size={14} /> {cityName}</span>
        <span><CalendarDays size={14} /> {fmtDate(pickup)} → {fmtDate(ret)}</span>
      </div>
      <div className="price-lines ck-prices">
        <span>{inr(car.pricePerDay)} × {days} day{days === 1 ? '' : 's'}</span><b>{inr(days * car.pricePerDay)}</b>
        {withDriver && <><span>Driver × {days}</span><b>{inr(days * driverFee)}</b></>}
        <span>Taxes (5%)</span><b>{inr(taxes)}</b>
        <span>Convenience fee</span><b>{inr(49)}</b>
      </div>
      <div className="ck-total"><span>Total</span><motion.strong key={total} initial={{ scale: 1.15, color: '#0d9488' }} animate={{ scale: 1, color: '#0f2533' }}>{inr(total)}</motion.strong></div>
      {!done && <div className="ck-aside-action">{actionBtn}</div>}
    </div>
  );

  return (
    <CheckoutLayout
      back={done ? '/bookings' : '/cars'}
      backLabel={done ? 'My trips' : 'All cars'}
      title={`Rent ${car.brand} ${car.name}`}
      subtitle={`${car.type} · ${car.seats} seats · ${car.transmission} · ${car.fuel}`}
      aside={summary}
      mobileBar={done ? null : (<><div className="ck-mb-total"><span>Total · {days}d</span><b>{inr(total)}</b></div>{actionBtn}</>)}
    >
      {!done && <Stepper steps={STEPS} step={step} />}
      <motion.div key={step} className="ck-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        {step === 0 && (
          <div className="stack">
            <h2 className="step-title">Where and when?</h2>
            <CityPicker label="Pickup city" value={location} onChange={setLocation} cities={cities} domesticOnly />
            <div className="tc-fields">
              <label className="lf grow"><span>Pickup date</span>
                <input className="input" type="date" value={pickup} min={isoDate(0)} onChange={(e) => setPickup(e.target.value)} />
              </label>
              <label className="lf grow"><span>Return date</span>
                <input className="input" type="date" value={ret} min={pickup} onChange={(e) => setRet(e.target.value)} />
              </label>
            </div>
            <motion.button type="button" className={`toggle-row ${withDriver ? 'on' : ''}`} onClick={() => setWithDriver((v) => !v)} whileTap={{ scale: 0.99 }}>
              <UserCheck size={18} />
              <span>Add a professional driver <em className="muted small">+{inr(driverFee)}/day</em></span>
              <span className="switch"><motion.i layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} /></span>
            </motion.button>
          </div>
        )}
        {step === 1 && (
          <div className="stack">
            <div className="ck-step-head">
              <h2 className="step-title">How would you like to pay?</h2>
              <button className="back-link" onClick={() => setStep(0)}><ArrowLeft size={15} /> Trip details</button>
            </div>
            <PaymentForm method={method} setMethod={setMethod} details={payDetails} setDetails={setPayDetails} />
          </div>
        )}
        {done && (
          <div className="stack">
            <Success title="Your car is reserved!">
              <p className="muted">Booking ID <b className="pnr">{booking.pnr}</b></p>
              <p className="muted small">Pickup in {booking.rental.location} on {fmtDate(booking.rental.pickupDate)} · {booking.rental.days} day{booking.rental.days > 1 ? 's' : ''}</p>
            </Success>
            <div className="ck-done-actions">
              <Button to="/cars" variant="ghost">Rent another car</Button>
              <Button to="/bookings" iconRight={ArrowRight}>View my trips</Button>
            </div>
          </div>
        )}
      </motion.div>
    </CheckoutLayout>
  );
}
