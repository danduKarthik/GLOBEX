import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

/**
 * Animated button: magnetic pull toward the cursor, click ripple,
 * shine sweep on hover, springy press. Use `to` for navigation.
 */
export default function Button({
  children, variant = 'primary', size = 'md', to, className = '', onClick,
  loading = false, disabled, icon: Icon, iconRight: IconRight, block, type = 'button', ...rest
}) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 15, mass: 0.4 });
  const y = useSpring(my, { stiffness: 260, damping: 15, mass: 0.4 });

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.32);
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const reset = () => { mx.set(0); my.set(0); };

  const handleClick = (e) => {
    const r = ref.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((rp) => rp.id !== id)), 700);
    onClick?.(e);
  };

  const content = (
    <>
      <span className="btn-shine" />
      {ripples.map((r) => <span key={r.id} className="btn-ripple" style={{ left: r.x, top: r.y }} />)}
      <span className="btn-content">
        {loading ? <span className="spinner sm" /> : Icon && <Icon size={size === 'sm' ? 15 : 18} className="btn-icon" />}
        {children}
        {IconRight && !loading && <IconRight size={size === 'sm' ? 15 : 18} className="btn-icon-right" />}
      </span>
    </>
  );

  const props = {
    ref,
    className: `btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`,
    style: { x, y },
    onMouseMove: handleMove,
    onMouseLeave: reset,
    whileTap: { scale: 0.94 },
    whileHover: { scale: 1.03 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
    ...rest,
  };

  if (to) {
    return <MotionLink to={to} {...props} onClick={handleClick}>{content}</MotionLink>;
  }
  return (
    <motion.button type={type} disabled={disabled || loading} {...props} onClick={handleClick}>
      {content}
    </motion.button>
  );
}
