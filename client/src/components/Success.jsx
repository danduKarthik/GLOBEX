import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const COLORS = ['#2dd4bf', '#38bdf8', '#fbbf24', '#f97316', '#34d399'];

/** Animated checkmark with a burst of confetti. */
export default function Success({ title, children }) {
  return (
    <div className="success">
      <div className="confetti">
        {Array.from({ length: 28 }).map((_, i) => {
          const angle = (i / 28) * Math.PI * 2;
          const dist = 90 + Math.random() * 70;
          return (
            <motion.i
              key={i}
              style={{ background: COLORS[i % COLORS.length] }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 40, opacity: 0, rotate: Math.random() * 540, scale: 0.6 }}
              transition={{ duration: 1.3, ease: 'easeOut', delay: 0.15 }}
            />
          );
        })}
      </div>
      <motion.div className="success-ring" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
        <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring' }}>
          <Check size={38} strokeWidth={3} />
        </motion.span>
      </motion.div>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>{title}</motion.h3>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="success-body">
        {children}
      </motion.div>
    </div>
  );
}
