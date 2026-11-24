import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * Light page shell used by the seat + payment flow.
 * Turns on `body.light-page` so the animated beach / tree photo background
 * behind it becomes soft, blurred and bright.
 */
export function useLightPage() {
  useEffect(() => {
    document.body.classList.add('light-page');
    return () => document.body.classList.remove('light-page');
  }, []);
}

export function Stepper({ steps, step }) {
  return (
    <div className="stepper-lite ck-stepper">
      {steps.map((s, i) => (
        <div key={s} className={`sl-step ${i < step ? 'past' : ''} ${i === step ? 'now' : ''}`}>
          <span className="sl-dot">{i < step ? '✓' : i + 1}</span>
          <span className="sl-label">{s}</span>
        </div>
      ))}
      <div className="sl-track"><motion.i animate={{ width: `${(Math.min(step, steps.length - 1) / (steps.length - 1)) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} /></div>
    </div>
  );
}

export default function CheckoutLayout({ back, backLabel = 'Back', title, subtitle, children, aside, mobileBar }) {
  useLightPage();
  return (
    <motion.div
      className="checkout-page light-scope"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container">
        <Link to={back} className="ck-back"><ArrowLeft size={16} /> {backLabel}</Link>
        <div className="ck-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="ck-grid">
          <main className="ck-main">{children}</main>
          {aside && <aside className="ck-aside">{aside}</aside>}
        </div>
      </div>
      {mobileBar && <div className="ck-mobilebar">{mobileBar}</div>}
    </motion.div>
  );
}
