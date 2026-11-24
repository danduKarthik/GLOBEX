import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/** Soft spotlight + ring that follow the cursor (desktop only). */
export default function CursorGlow() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });
  const rx = useSpring(x, { stiffness: 600, damping: 35 });
  const ry = useSpring(y, { stiffness: 600, damping: 35 });
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      setHovering(!!e.target.closest?.('a, button, select, input, textarea, [data-hover]'));
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div className="cursor-glow" style={{ left: sx, top: sy }} />
      <motion.div
        className="cursor-ring"
        style={{ left: rx, top: ry }}
        animate={{ scale: hovering ? 1.9 : 1, opacity: hovering ? 0.9 : 0.5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </>
  );
}
