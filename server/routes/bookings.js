import { Router } from 'express';
import crypto from 'crypto';
import { readDB, writeDB } from '../db.js';
import { requireAuth } from '../auth.js';
import { CARS, DRIVER_FEE_PER_DAY, findTrip, CITIES, allSeats } from '../data.js';
import { seatMap } from '../seats.js';

const router = Router();
router.use(requireAuth);

const TAX_RATE = 0.05;
const CONVENIENCE_FEE = 49;

const makePNR = () => crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6) + Math.floor(Math.random() * 10);

router.get('/', (req, res) => {
  const bookings = readDB().bookings
    .filter((b) => b.userId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ bookings });
});

router.post('/', (req, res) => {
  const { kind } = req.body || {};
  const db = readDB();
  let booking;

  if (kind === 'transport') {
    const { tripId, className, passengers, contact } = req.body;
    const trip = findTrip(tripId);
    if (!trip) return res.status(404).json({ error: 'This trip is no longer available' });
    const cls = trip.classes.find((c) => c.name === className);
    if (!cls) return res.status(400).json({ error: 'Please choose a valid class' });
    if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > 6) {
      return res.status(400).json({ error: 'Add between 1 and 6 passengers' });
    }
    if (passengers.some((p) => !p?.name?.trim() || !(Number(p.age) > 0 && Number(p.age) < 120))) {
      return res.status(400).json({ error: 'Every passenger needs a name and a valid age' });
    }
    // --- seat validation ---
    const map = seatMap(db, trip, cls.name);
    const seatsById = Object.fromEntries(allSeats(map.layout).map((s) => [s.id, s]));
    const chosen = passengers.map((p) => p.seat);
    if (chosen.some((s) => !s)) return res.status(400).json({ error: 'Please choose a seat for every traveller' });
    if (new Set(chosen).size !== chosen.length) return res.status(400).json({ error: 'Each traveller needs a different seat' });
    const invalid = chosen.find((s) => !seatsById[s]);
    if (invalid) return res.status(400).json({ error: `Seat ${invalid} does not exist` });
    const clash = chosen.filter((s) => map.taken.includes(s));
    if (clash.length) return res.status(409).json({ error: `Sorry, seat ${clash.join(', ')} was just booked by someone else`, taken: clash });

    const fare = cls.price * passengers.length;
    const seatFees = chosen.reduce((sum, s) => sum + seatsById[s].fee, 0);
    const base = fare + seatFees;
    const taxes = Math.round(base * TAX_RATE);
    booking = {
      kind: 'transport',
      type: trip.type,
      trip: {
        id: trip.id, operator: trip.operator, number: trip.number, from: trip.from, to: trip.to,
        date: trip.date, departure: trip.departure, arrival: trip.arrival, dayOffset: trip.dayOffset, durationMin: trip.durationMin,
      },
      className: cls.name,
      passengers: passengers.map((p, i) => ({
        name: p.name.trim(), age: Number(p.age), gender: p.gender || 'Other',
        seat: p.seat, seatLabel: seatsById[p.seat].label, seatKind: seatsById[p.seat].kind,
      })),
      contact: contact || {},
      amount: { fare, seatFees, base, taxes, fee: CONVENIENCE_FEE, total: base + taxes + CONVENIENCE_FEE },
      travelDate: trip.date,
    };
  } else if (kind === 'car') {
    const { carId, pickupDate, returnDate, location, withDriver } = req.body;
    const car = CARS.find((c) => c.id === carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });
    if (!CITIES.some((c) => c.code === location)) return res.status(400).json({ error: 'Choose a pickup city' });
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ error: 'Choose pickup and return dates' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (start < today) return res.status(400).json({ error: 'Pickup date cannot be in the past' });
    const days = Math.round((end - start) / 86400000);
    if (days < 1) return res.status(400).json({ error: 'Return date must be after pickup date' });
    if (days > 30) return res.status(400).json({ error: 'Rentals are limited to 30 days' });

    const base = car.pricePerDay * days + (withDriver ? DRIVER_FEE_PER_DAY * days : 0);
    const taxes = Math.round(base * TAX_RATE);
    booking = {
      kind: 'car',
      type: 'car',
      car: { id: car.id, name: car.name, brand: car.brand, type: car.type, color: car.color, seats: car.seats, transmission: car.transmission, fuel: car.fuel },
      rental: { pickupDate, returnDate, days, location: CITIES.find((c) => c.code === location).name, withDriver: !!withDriver },
      amount: { base, taxes, fee: CONVENIENCE_FEE, total: base + taxes + CONVENIENCE_FEE },
      travelDate: pickupDate,
    };
  } else {
    return res.status(400).json({ error: 'kind must be transport or car' });
  }

  booking = {
    id: crypto.randomUUID(),
    pnr: makePNR(),
    userId: req.user.id,
    status: 'CONFIRMED',
    payment: { method: req.body.paymentMethod || 'card', status: 'PAID (demo)' },
    createdAt: new Date().toISOString(),
    ...booking,
  };
  db.bookings.push(booking);
  writeDB(db);
  res.status(201).json({ booking });
});

router.patch('/:id/cancel', (req, res) => {
  const db = readDB();
  const booking = db.bookings.find((b) => b.id === req.params.id && b.userId === req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'CANCELLED') return res.status(400).json({ error: 'Booking is already cancelled' });
  booking.status = 'CANCELLED';
  booking.cancelledAt = new Date().toISOString();
  booking.refund = Math.round(booking.amount.total * 0.8);
  writeDB(db);
  res.json({ booking });
});

export default router;
