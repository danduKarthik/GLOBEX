// Catalogue data + deterministic trip generator.
// Same search (type + route + date) always returns the same trips,
// so prices can be validated on the server when a booking is made.

export const CITIES = [
  // India — flights, trains and buses
  { code: 'HYD', name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.385, lon: 78.4867 },
  { code: 'WGL', name: 'Warangal', state: 'Telangana', country: 'India', lat: 17.9689, lon: 79.5941 },
  { code: 'DEL', name: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.209 },
  { code: 'BOM', name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.076, lon: 72.8777 },
  { code: 'BLR', name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946 },
  { code: 'MAA', name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707 },
  { code: 'CCU', name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639 },
  { code: 'PNQ', name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567 },
  { code: 'AMD', name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714 },
  { code: 'JAI', name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873 },
  { code: 'AGR', name: 'Agra', state: 'Uttar Pradesh', country: 'India', lat: 27.1767, lon: 78.0081 },
  { code: 'GOI', name: 'Goa', state: 'Goa', country: 'India', lat: 15.2993, lon: 74.124 },
  { code: 'COK', name: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lon: 76.2673 },
  { code: 'LKO', name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lon: 80.9462 },
  { code: 'VNS', name: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lon: 82.9739 },
  { code: 'VTZ', name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: 17.6868, lon: 83.2185 },
  { code: 'IXC', name: 'Chandigarh', state: 'Chandigarh', country: 'India', lat: 30.7333, lon: 76.7794 },
  { code: 'IXL', name: 'Leh, Ladakh', state: 'Ladakh', country: 'India', lat: 34.1526, lon: 77.5771 },
  // International — flights only
  { code: 'DXB', name: 'Dubai', state: 'UAE', country: 'United Arab Emirates', intl: true, lat: 25.2048, lon: 55.2708 },
  { code: 'SIN', name: 'Singapore', state: 'Singapore', country: 'Singapore', intl: true, lat: 1.3521, lon: 103.8198 },
  { code: 'DPS', name: 'Bali', state: 'Indonesia', country: 'Indonesia', intl: true, lat: -8.4095, lon: 115.1889 },
  { code: 'MLE', name: 'Maldives', state: 'Malé', country: 'Maldives', intl: true, lat: 4.1755, lon: 73.5093 },
  { code: 'CDG', name: 'Paris', state: 'France', country: 'France', intl: true, lat: 48.8566, lon: 2.3522 },
  { code: 'LHR', name: 'London', state: 'United Kingdom', country: 'United Kingdom', intl: true, lat: 51.5072, lon: -0.1276 },
  { code: 'JTR', name: 'Santorini', state: 'Greece', country: 'Greece', intl: true, lat: 36.3932, lon: 25.4615 },
  { code: 'ZRH', name: 'Zurich (Swiss Alps)', state: 'Switzerland', country: 'Switzerland', intl: true, lat: 47.3769, lon: 8.5417 },
  { code: 'HND', name: 'Tokyo', state: 'Japan', country: 'Japan', intl: true, lat: 35.6762, lon: 139.6503 },
  { code: 'JFK', name: 'New York', state: 'USA', country: 'United States', intl: true, lat: 40.7128, lon: -74.006 },
  { code: 'SYD', name: 'Sydney', state: 'Australia', country: 'Australia', intl: true, lat: -33.8688, lon: 151.2093 },
];

const CONFIG = {
  flight: {
    speed: 720, overhead: 45, baseFare: 1800, perKm: 3.6,
    operators: [
      { name: 'SkyWave Airlines', code: 'SW' },
      { name: 'AeroNova', code: 'AN' },
      { name: 'BlueJet', code: 'BJ' },
      { name: 'Horizon Air', code: 'HZ' },
      { name: 'IndiFly', code: 'IF' },
    ],
    classes: [
      { name: 'Economy', mult: 1 },
      { name: 'Premium Economy', mult: 1.6 },
      { name: 'Business', mult: 3.2 },
    ],
    amenities: ['Meals', 'Wi-Fi', 'USB charging', 'Extra legroom', '15kg check-in', 'Seat select'],
  },
  train: {
    speed: 68, overhead: 20, baseFare: 180, perKm: 0.9,
    operators: [
      { name: 'Vande Bharat Express', code: 'VB' },
      { name: 'Rajdhani Express', code: 'RJ' },
      { name: 'Duronto Express', code: 'DR' },
      { name: 'Deccan Superfast', code: 'DS' },
      { name: 'Coromandel Express', code: 'CM' },
      { name: 'Garib Rath', code: 'GR' },
    ],
    classes: [
      { name: 'Sleeper (SL)', mult: 1 },
      { name: 'AC 3 Tier (3A)', mult: 2.6 },
      { name: 'AC 2 Tier (2A)', mult: 3.7 },
      { name: 'First AC (1A)', mult: 6.1 },
    ],
    amenities: ['Pantry', 'Bedroll', 'Charging point', 'Live tracking', 'Clean toilets', 'CCTV'],
  },
  bus: {
    speed: 55, overhead: 30, baseFare: 150, perKm: 1.4,
    operators: [
      { name: 'GreenLine Travels', code: 'GL' },
      { name: 'Orange Tours', code: 'OT' },
      { name: 'RoyalRide', code: 'RR' },
      { name: 'Kaveri Travels', code: 'KV' },
      { name: 'SwiftBus', code: 'SB' },
      { name: 'NightOwl Coaches', code: 'NO' },
    ],
    classes: [
      { name: 'Non-AC Seater', mult: 1 },
      { name: 'AC Seater', mult: 1.4 },
      { name: 'AC Sleeper', mult: 1.9 },
      { name: 'Volvo Multi-Axle', mult: 2.3 },
    ],
    amenities: ['Water bottle', 'Blanket', 'Charging point', 'Reading light', 'Live tracking', 'Emergency exit'],
  },
};

export const CARS = [
  { id: 'car-1', name: 'Swift', brand: 'Maruti Suzuki', type: 'Hatchback', seats: 5, transmission: 'Manual', fuel: 'Petrol', pricePerDay: 1499, rating: 4.5, color: '#22d3ee', features: ['Bluetooth', 'AC', 'Power windows'] },
  { id: 'car-2', name: 'i20', brand: 'Hyundai', type: 'Hatchback', seats: 5, transmission: 'Automatic', fuel: 'Petrol', pricePerDay: 1799, rating: 4.6, color: '#f97316', features: ['Sunroof', 'Apple CarPlay', 'Rear camera'] },
  { id: 'car-3', name: 'City', brand: 'Honda', type: 'Sedan', seats: 5, transmission: 'Automatic', fuel: 'Petrol', pricePerDay: 2299, rating: 4.7, color: '#0ea5e9', features: ['Cruise control', 'Android Auto', 'Lane watch'] },
  { id: 'car-4', name: 'Verna', brand: 'Hyundai', type: 'Sedan', seats: 5, transmission: 'Automatic', fuel: 'Diesel', pricePerDay: 2399, rating: 4.6, color: '#f59e0b', features: ['Ventilated seats', 'ADAS', 'Sunroof'] },
  { id: 'car-5', name: 'Creta', brand: 'Hyundai', type: 'SUV', seats: 5, transmission: 'Automatic', fuel: 'Diesel', pricePerDay: 2999, rating: 4.8, color: '#34d399', features: ['Panoramic roof', 'ADAS', '360° camera'] },
  { id: 'car-6', name: 'XUV700', brand: 'Mahindra', type: 'SUV', seats: 7, transmission: 'Automatic', fuel: 'Diesel', pricePerDay: 3999, rating: 4.8, color: '#ef4444', features: ['7 seats', 'Skyroof', 'ADAS L2'] },
  { id: 'car-7', name: 'Innova Crysta', brand: 'Toyota', type: 'MUV', seats: 7, transmission: 'Manual', fuel: 'Diesel', pricePerDay: 3499, rating: 4.9, color: '#e5e7eb', features: ['Captain seats', 'Rear AC', 'Huge boot'] },
  { id: 'car-8', name: 'Ertiga', brand: 'Maruti Suzuki', type: 'MUV', seats: 7, transmission: 'Manual', fuel: 'CNG', pricePerDay: 2199, rating: 4.4, color: '#60a5fa', features: ['CNG', '7 seats', 'Fuel efficient'] },
  { id: 'car-9', name: 'Nexon EV', brand: 'Tata', type: 'EV', seats: 5, transmission: 'Automatic', fuel: 'Electric', pricePerDay: 2799, rating: 4.7, color: '#2dd4bf', features: ['465 km range', 'Fast charge', 'Connected car'] },
  { id: 'car-10', name: 'ZS EV', brand: 'MG', type: 'EV', seats: 5, transmission: 'Automatic', fuel: 'Electric', pricePerDay: 3299, rating: 4.6, color: '#10b981', features: ['461 km range', 'Panoramic roof', 'i-SMART'] },
  { id: 'car-11', name: 'Fortuner', brand: 'Toyota', type: 'Luxury', seats: 7, transmission: 'Automatic', fuel: 'Diesel', pricePerDay: 5999, rating: 4.9, color: '#fbbf24', features: ['4x4', 'Leather seats', 'Premium audio'] },
  { id: 'car-12', name: 'C-Class', brand: 'Mercedes-Benz', type: 'Luxury', seats: 5, transmission: 'Automatic', fuel: 'Petrol', pricePerDay: 8999, rating: 5.0, color: '#94a3b8', features: ['Ambient lighting', 'Burmester audio', 'Chauffeur-ready'] },
];

export const DRIVER_FEE_PER_DAY = 800;

export const cityByCode = (code) => CITIES.find((c) => c.code === code);

function haversine(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function hash(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (m) => `${pad(Math.floor((m % 1440) / 60))}:${pad(m % 60)}`;

export function searchTrips({ type, from, to, date }) {
  const cfg = CONFIG[type];
  const A = cityByCode(from);
  const B = cityByCode(to);
  if (!cfg || !A || !B || from === to || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return [];
  if (type !== 'flight' && (A.intl || B.intl)) return [];

  const dist = Math.max(80, Math.round(haversine(A, B) * (type === 'flight' ? 1 : 1.25)));
  const rand = mulberry32(hash(`${type}|${from}|${to}|${date}`));
  const count = 5 + Math.floor(rand() * 4);
  const trips = [];

  for (let i = 0; i < count; i++) {
    const op = cfg.operators[Math.floor(rand() * cfg.operators.length)];
    const dep = Math.floor(rand() * 96) * 15; // every 15 minutes across the day
    const stops = type === 'flight' ? (rand() < 0.65 ? 0 : 1) : Math.floor(rand() * 6) + 1;
    const dur = Math.round(((dist / cfg.speed) * 60 + cfg.overhead + (type === 'flight' ? stops * 75 : 0)) * (0.92 + rand() * 0.25) / 5) * 5;
    const base = (cfg.baseFare + dist * cfg.perKm) * (0.85 + rand() * 0.45);
    const classes = cfg.classes.map((c) => {
      const total = allSeats(seatLayout(type, c.name)).length;
      const free = Math.max(2, Math.round(total * (0.12 + rand() * 0.6)));
      return { name: c.name, price: Math.round((base * c.mult) / 10) * 10, seatsLeft: Math.min(free, total), totalSeats: total };
    });
    const amenities = cfg.amenities.filter(() => rand() > 0.45);

    trips.push({
      id: `${type}_${from}_${to}_${date}_${i}`,
      type,
      operator: op.name,
      operatorCode: op.code,
      number: `${op.code}${type === 'train' ? 12000 + Math.floor(rand() * 7999) : 100 + Math.floor(rand() * 899)}`,
      from: { code: A.code, name: A.name },
      to: { code: B.code, name: B.name },
      date,
      departure: fmtTime(dep),
      arrival: fmtTime(dep + dur),
      dayOffset: Math.floor((dep + dur) / 1440),
      durationMin: dur,
      distanceKm: dist,
      stops,
      rating: Number((3.7 + rand() * 1.3).toFixed(1)),
      amenities: amenities.length ? amenities : [cfg.amenities[0]],
      classes,
      price: classes[0].price,
    });
  }
  return trips.sort((a, b) => a.departure.localeCompare(b.departure));
}

export function findTrip(id) {
  const [type, from, to, date] = String(id).split('_');
  return searchTrips({ type, from, to, date }).find((t) => t.id === id) || null;
}

// ------------------------------------------------------------------
// Seat maps
// A layout is { vehicle, decks: [{ name, rows }] } where each row is an
// array of seats or null (aisle). An empty row [] is a visual gap
// (e.g. between train bays). Seat = { id, label, kind, fee }.
// ------------------------------------------------------------------

const TRAIN_COACH = {
  'Sleeper (SL)': { coach: 'S1', bays: 9, style: 3 },
  'AC 3 Tier (3A)': { coach: 'B1', bays: 8, style: 3 },
  'AC 2 Tier (2A)': { coach: 'A1', bays: 6, style: 2 },
  'First AC (1A)': { coach: 'H1', bays: 5, style: 1 },
};

function flightLayout(className) {
  const spec = {
    Business: { from: 1, to: 4, cols: ['A', 'C', null, 'D', 'F'] },
    'Premium Economy': { from: 5, to: 9, cols: ['A', 'B', 'C', null, 'D', 'E', 'F'] },
    Economy: { from: 10, to: 31, cols: ['A', 'B', 'C', null, 'D', 'E', 'F'] },
  }[className];
  if (!spec) return null;
  const rows = [];
  for (let r = spec.from; r <= spec.to; r++) {
    const exit = className === 'Economy' && (r === 15 || r === 16);
    rows.push(spec.cols.map((c) => {
      if (!c) return null;
      const kind = 'AF'.includes(c) ? 'window' : 'CD'.includes(c) ? 'aisle' : 'middle';
      let fee = 0;
      if (className === 'Economy') fee = exit ? 450 : kind === 'window' ? 250 : kind === 'aisle' ? 150 : 0;
      return { id: `${r}${c}`, label: `${r}${c}`, kind: exit ? 'exit' : kind, fee };
    }));
    if (exit && r === 16) rows.push([]);
  }
  return { vehicle: 'flight', decks: [{ name: className, rows }] };
}

function trainLayout(className) {
  const cfg = TRAIN_COACH[className];
  if (!cfg) return null;
  const { coach, bays, style } = cfg;
  const s = (n, kind) => ({ id: `${coach}-${n}`, label: String(n), kind, fee: 0 });
  const per = { 3: 8, 2: 6, 1: 4 }[style];
  const rows = [];
  for (let b = 0; b < bays; b++) {
    const n = b * per;
    if (style === 3) {
      rows.push([s(n + 1, 'LB'), s(n + 2, 'MB'), s(n + 3, 'UB'), null, s(n + 7, 'SL')]);
      rows.push([s(n + 4, 'LB'), s(n + 5, 'MB'), s(n + 6, 'UB'), null, s(n + 8, 'SU')]);
    } else if (style === 2) {
      rows.push([s(n + 1, 'LB'), s(n + 2, 'UB'), null, s(n + 5, 'SL')]);
      rows.push([s(n + 3, 'LB'), s(n + 4, 'UB'), null, s(n + 6, 'SU')]);
    } else {
      rows.push([s(n + 1, 'LB'), s(n + 2, 'UB')]);
      rows.push([s(n + 3, 'LB'), s(n + 4, 'UB')]);
    }
    if (b < bays - 1) rows.push([]);
  }
  return { vehicle: 'train', coach, decks: [{ name: `Coach ${coach}`, rows }] };
}

function busLayout(className) {
  if (className === 'AC Sleeper') {
    const deck = (prefix) => {
      const rows = [];
      for (let r = 0; r < 6; r++) {
        const n = r * 3;
        rows.push([
          { id: `${prefix}${n + 1}`, label: `${prefix}${n + 1}`, kind: 'single', fee: 0 },
          null,
          { id: `${prefix}${n + 2}`, label: `${prefix}${n + 2}`, kind: 'window', fee: 0 },
          { id: `${prefix}${n + 3}`, label: `${prefix}${n + 3}`, kind: 'aisle', fee: 0 },
        ]);
      }
      return rows;
    };
    return { vehicle: 'bus', sleeper: true, decks: [{ name: 'Lower deck', rows: deck('L') }, { name: 'Upper deck', rows: deck('U') }] };
  }
  const count = { 'Non-AC Seater': 10, 'AC Seater': 10, 'Volvo Multi-Axle': 12 }[className];
  if (!count) return null;
  const rows = [];
  for (let r = 0; r < count; r++) {
    const n = r * 4;
    rows.push([
      { id: `${n + 1}`, label: `${n + 1}`, kind: 'window', fee: 0 },
      { id: `${n + 2}`, label: `${n + 2}`, kind: 'aisle', fee: 0 },
      null,
      { id: `${n + 3}`, label: `${n + 3}`, kind: 'aisle', fee: 0 },
      { id: `${n + 4}`, label: `${n + 4}`, kind: 'window', fee: 0 },
    ]);
  }
  return { vehicle: 'bus', decks: [{ name: className, rows }] };
}

export function seatLayout(type, className) {
  if (type === 'flight') return flightLayout(className);
  if (type === 'train') return trainLayout(className);
  if (type === 'bus') return busLayout(className);
  return null;
}

export const allSeats = (layout) => layout.decks.flatMap((d) => d.rows.flat().filter(Boolean));

/** Seats already sold to "other travellers" — deterministic per trip + class. */
export function preTakenSeats(trip, cls) {
  const layout = seatLayout(trip.type, cls.name);
  const ids = allSeats(layout).map((s) => s.id);
  const rand = mulberry32(hash(`${trip.id}|${cls.name}`));
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, Math.max(0, ids.length - cls.seatsLeft));
}
