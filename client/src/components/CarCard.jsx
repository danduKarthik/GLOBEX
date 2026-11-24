import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Fuel, Cog, Star } from 'lucide-react';
import TiltCard from './TiltCard';
import CarIllustration from './CarIllustration';
import Button from './Button';
import { inr } from '../api';

export default function CarCard({ car, onRent }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onTapStart={() => setHover(true)}
      onTap={() => setTimeout(() => setHover(false), 900)}
      onTapCancel={() => setHover(false)}
    >
      <TiltCard className="car-card glass" intensity={7}>
        <div className="car-top">
          <span className="tag">{car.type}</span>
          <span className="rating"><Star size={13} fill="currentColor" /> {car.rating}</span>
        </div>
        <div className="car-stage" style={{ '--car': car.color }}>
          <CarIllustration color={car.color} type={car.type} hovered={hover} />
        </div>
        <div className="car-name">
          <span className="muted small">{car.brand}</span>
          <h3>{car.name}</h3>
        </div>
        <div className="car-specs">
          <span><Users size={14} /> {car.seats}</span>
          <span><Cog size={14} /> {car.transmission}</span>
          <span><Fuel size={14} /> {car.fuel}</span>
        </div>
        <div className="car-features">
          {car.features.map((f) => <span key={f} className="chip">{f}</span>)}
        </div>
        <div className="car-bottom">
          <div>
            <span className="price">{inr(car.pricePerDay)}</span>
            <span className="muted small"> / day</span>
          </div>
          <Button size="sm" onClick={() => onRent(car)}>Rent now</Button>
        </div>
      </TiltCard>
    </motion.div>
  );
}
