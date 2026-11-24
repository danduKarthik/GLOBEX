import { seatLayout, allSeats, preTakenSeats } from './data.js';

/** Seat IDs booked in our own database for this trip + class (cancelled bookings free their seats). */
function bookedSeats(db, tripId, className) {
  return db.bookings
    .filter((b) => b.kind === 'transport' && b.status !== 'CANCELLED' && b.trip.id === tripId && b.className === className)
    .flatMap((b) => b.passengers.map((p) => p.seat));
}

/** Full seat map for a trip/class: layout + every taken seat. */
export function seatMap(db, trip, className) {
  const cls = trip.classes.find((c) => c.name === className);
  if (!cls) return null;
  const layout = seatLayout(trip.type, className);
  const taken = new Set([...preTakenSeats(trip, cls), ...bookedSeats(db, trip.id, className)]);
  const total = allSeats(layout).length;
  return { layout, taken: [...taken], total, available: total - taken.size };
}

/** Same trips, but seatsLeft reflects real bookings made in this app. */
export function withLiveAvailability(db, trips) {
  return trips.map((t) => ({
    ...t,
    classes: t.classes.map((c) => ({ ...c, seatsLeft: seatMap(db, t, c.name).available })),
  }));
}
