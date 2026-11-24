import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Plane, Bus, TrainFront, DoorOpen } from 'lucide-react';
import { api, inr } from '../api';

export const KIND_LABEL = {
  window: 'Window', aisle: 'Aisle', middle: 'Middle', exit: 'Exit row · extra legroom',
  LB: 'Lower berth', MB: 'Middle berth', UB: 'Upper berth', SL: 'Side lower', SU: 'Side upper',
  single: 'Single sleeper',
};

/**
 * Interactive seat picker.
 * passengers: [{ name, seat }] — onChange receives the updated array.
 * onMap(map) is called once the seat map has loaded (used for seat fees).
 */
export default function SeatMap({ trip, className, passengers, onChange, onMap, reloadKey }) {
  const [map, setMap] = useState(null);
  const [error, setError] = useState('');
  const [deck, setDeck] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setMap(null); setError('');
    api(`/trips/${encodeURIComponent(trip.id)}/seats?class=${encodeURIComponent(className)}`)
      .then((m) => { setMap(m); onMap?.(m); })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id, className, reloadKey]);

  const seatLabel = (id) => (map ? map.layout.decks.flatMap((d) => d.rows.flat()).find((x) => x && x.id === id)?.label : id) || id;
  const taken = useMemo(() => new Set(map?.taken || []), [map]);
  const seatOwner = useMemo(() => Object.fromEntries(passengers.map((p, i) => [p.seat, i]).filter(([s]) => s)), [passengers]);

  const assign = (seat) => {
    if (taken.has(seat.id)) return;
    const next = passengers.map((p) => ({ ...p }));
    const owner = seatOwner[seat.id];
    if (owner !== undefined) { // clicking your own seat frees it
      next[owner].seat = '';
      setActive(owner);
      onChange(next);
      return;
    }
    next[active].seat = seat.id;
    onChange(next);
    const free = next.findIndex((p, i) => i !== active && !p.seat);
    if (free !== -1) setActive(free);
  };

  const autoPick = () => {
    const rows = map.layout.decks.flatMap((d) => d.rows);
    const freeInRow = (r) => r.filter((s) => s && !taken.has(s.id));
    const need = passengers.length;
    // prefer a single row/bay that seats everyone together, otherwise first free seats
    let pick = rows.map(freeInRow).find((r) => r.length >= need)?.slice(0, need);
    if (!pick) pick = rows.flatMap(freeInRow).slice(0, need);
    onChange(passengers.map((p, i) => ({ ...p, seat: pick[i]?.id || '' })));
  };

  if (error) return <div className="empty">{error}</div>;
  if (!map) return <div className="seat-loading"><span className="spinner" /> Loading seat map…</div>;

  const { layout } = map;
  const vehicle = layout.vehicle;
  const current = layout.decks[deck] || layout.decks[0];
  const VehicleIcon = { flight: Plane, bus: Bus, train: TrainFront }[vehicle];
  let seatIndex = 0;

  return (
    <div className="seat-picker">
      <div className="pax-chips">
        {passengers.length > 1 ? passengers.map((p, i) => (
          <motion.button
            key={i}
            className={`pax-chip ${active === i ? 'active' : ''} ${p.seat ? 'has-seat' : ''}`}
            onClick={() => setActive(i)}
            whileTap={{ scale: 0.95 }}
          >
            <span className="pax-avatar">{(p.name || '?')[0].toUpperCase()}</span>
            <span className="pax-chip-text">
              <b>{p.name || `Traveller ${i + 1}`}</b>
              <em>{p.seat ? `Seat ${seatLabel(p.seat)}` : active === i ? 'Choosing…' : 'No seat yet'}</em>
            </span>
          </motion.button>
        )) : (
          <span className="single-seat">
            {passengers[0]?.seat ? <>Your seat: <b>{seatLabel(passengers[0].seat)}</b></> : 'No seat selected yet'}
          </span>
        )}
        <button className="add-link auto-pick" onClick={autoPick}><Wand2 size={15} /> Pick for me</button>
      </div>

      <div className="seat-legend">
        <span><i className="lg free" /> Available</span>
        <span><i className="lg sel" /> Selected</span>
        <span><i className="lg taken" /> Taken</span>
        {vehicle === 'flight' && className === 'Economy' && <span><i className="lg paid" /> Extra fee</span>}
        <span className="muted">{map.available} of {map.total} free</span>
      </div>

      {layout.decks.length > 1 && (
        <div className="chip-group deck-tabs">
          {layout.decks.map((d, i) => (
            <motion.button key={d.name} className={`chip-btn ${deck === i ? 'active' : ''}`} onClick={() => setDeck(i)} whileTap={{ scale: 0.94 }}>
              {deck === i && <motion.span layoutId="deck-pill" className="chip-pill" />}
              <span>{d.name}</span>
            </motion.button>
          ))}
        </div>
      )}

      <div className={`vehicle-shell v-${vehicle} ${layout.sleeper ? 'sleeper' : ''}`}>
        <div className="vehicle-front">
          <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}><VehicleIcon size={18} /></motion.span>
          <span>{vehicle === 'flight' ? 'Cockpit' : vehicle === 'bus' ? 'Driver' : current.name}</span>
          {vehicle === 'train' && <DoorOpen size={16} />}
        </div>

        <>
          <motion.div
            key={current.name}
            className="seat-rows"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {current.rows.map((row, r) => {
              if (row.length === 0) return <div key={r} className="seat-gap">{vehicle === 'flight' ? '— Exit —' : ''}</div>;
              const rowNum = vehicle === 'flight' ? row.find(Boolean)?.label.replace(/\D/g, '') : '';
              return (
                <div key={r} className="seat-row" style={{ gridTemplateColumns: row.map((s) => (s ? '1fr' : '0.6fr')).join(' ') }}>
                  {row.map((s, c) => {
                    if (!s) return <span key={c} className="aisle">{rowNum}</span>;
                    const isTaken = taken.has(s.id);
                    const owner = seatOwner[s.id];
                    const i = seatIndex++;
                    return (
                      <motion.button
                        key={s.id}
                        className={`seat k-${s.kind} ${isTaken ? 'taken' : ''} ${owner !== undefined ? 'selected' : ''} ${s.fee ? 'paid' : ''}`}
                        onClick={() => assign(s)}
                        disabled={isTaken}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: owner !== undefined ? [1, 1.25, 1.08] : 1 }}
                        transition={{ delay: Math.min(i * 0.006, 0.5), type: 'spring', stiffness: 400, damping: 18 }}
                        whileHover={isTaken ? {} : { y: -4, scale: 1.12 }}
                        whileTap={isTaken ? {} : { scale: 0.9 }}
                        data-tip={`${s.label} · ${KIND_LABEL[s.kind] || s.kind}${s.fee ? ` · +${inr(s.fee)}` : ''}${isTaken ? ' · booked' : ''}`}
                        aria-label={`Seat ${s.label}`}
                      >
                        {owner !== undefined ? (passengers[owner].name || '?')[0].toUpperCase() : (vehicle === 'train' ? <>{s.label}<small>{s.kind}</small></> : s.label)}
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        </>
      </div>
    </div>
  );
}
