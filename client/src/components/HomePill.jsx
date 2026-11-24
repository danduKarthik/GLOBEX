import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

/** "↑ Back to globe" — a way home from every page. */
export default function HomePill() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/') return null;
  return (
    <motion.button
      key={location.pathname}
      className="home-pill"
      onClick={() => navigate('/')}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}
      aria-label="Back to the globe home page"
    >
      <span className="nav-globe" /> <ArrowUp size={14} /> Back to globe
    </motion.button>
  );
}
