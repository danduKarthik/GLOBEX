import { Router } from 'express';
import { CITIES, CARS, DRIVER_FEE_PER_DAY, searchTrips, findTrip } from '../data.js';
import { readDB } from '../db.js';
import { seatMap, withLiveAvailability } from '../seats.js';
import { listDestinations, getDestination, searchPlaces, REGIONS } from '../destinations.js';

const router = Router();

router.get('/cities', (_req, res) => {
  res.json({ cities: CITIES.map(({ code, name, state, country, intl }) => ({ code, name, state, country, intl: !!intl })) });
});

// GET /api/search?type=flight|train|bus&from=HYD&to=DEL&date=2026-12-01
router.get('/search', (req, res) => {
  const { type, from, to, date } = req.query;
  if (!['flight', 'train', 'bus'].includes(type)) return res.status(400).json({ error: 'type must be flight, train or bus' });
  if (!from || !to || !date) return res.status(400).json({ error: 'from, to and date are required' });
  if (from === to) return res.status(400).json({ error: 'Origin and destination must be different' });
  const A = CITIES.find((c) => c.code === from);
  const B = CITIES.find((c) => c.code === to);
  if (!A || !B) return res.status(400).json({ error: 'Unknown city' });
  if (type !== 'flight' && (A.intl || B.intl)) {
    return res.status(400).json({ error: `${type === 'train' ? 'Trains' : 'Buses'} run within India only. Try Flights for ${A.intl ? A.name : B.name}.`, code: 'INTL_ONLY_FLIGHTS' });
  }
  // small artificial delay so the loading animation is visible
  const trips = withLiveAvailability(readDB(), searchTrips({ type, from, to, date }));
  setTimeout(() => res.json({ trips }), 450);
});

// GET /api/trips/:id → one trip with live seat counts (used by the checkout page)
router.get('/trips/:id', (req, res) => {
  const trip = findTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'This trip is no longer available' });
  res.json({ trip: withLiveAvailability(readDB(), [trip])[0] });
});

// GET /api/trips/:id/seats?class=Economy  → seat layout + taken seats
router.get('/trips/:id/seats', (req, res) => {
  const trip = findTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const map = seatMap(readDB(), trip, req.query.class);
  if (!map) return res.status(400).json({ error: 'Unknown class for this trip' });
  res.json(map);
});

// ---- Destinations & place search ----
// GET /api/destinations?region=Europe&q=beach
router.get('/destinations', (req, res) => {
  res.json({ regions: REGIONS, destinations: listDestinations({ region: req.query.region, q: req.query.q }) });
});

// GET /api/destinations/paris → full details + places to visit
router.get('/destinations/:slug', (req, res) => {
  const d = getDestination(req.params.slug);
  if (!d) return res.status(404).json({ error: 'Destination not found' });
  const city = CITIES.find((c) => c.code === d.airport);
  res.json({ destination: { ...d, airportName: city?.name } });
});

// GET /api/places/search?q=eiffel → matching destinations + places inside them
router.get('/places/search', (req, res) => {
  res.json({ results: searchPlaces(req.query.q) });
});

router.get('/cars', (req, res) => {
  const { type } = req.query;
  const cars = type && type !== 'All' ? CARS.filter((c) => c.type === type) : CARS;
  res.json({ cars, driverFeePerDay: DRIVER_FEE_PER_DAY });
});

export default router;
