import { motion } from 'framer-motion';
import { LITE } from '../perf';
// (no blur filter on the page transition: blurring a whole page — and the 3D globe — every frame made it stutter)

/** Wraps every route with a smooth enter transition (enter-only, so a page can never get stuck mid-exit). */
export default function Page({ children, className = '' }) {
  return (
    <motion.div
      className={`page ${className}`}
      initial={LITE ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={LITE ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};
