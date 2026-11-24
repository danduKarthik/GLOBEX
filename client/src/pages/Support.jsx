import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, ChevronDown, RotateCcw, Shield, Mail, Phone, Send } from 'lucide-react';
import Page from '../components/Page';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const FAQ = [
  { q: 'How do I book a ticket?', a: 'Search from the home page, pick a trip and a class, add travellers, choose your seats on the seat map, then pay. Your PNR appears instantly and the ticket is saved under My Trips.' },
  { q: 'Can I choose my seat?', a: 'Yes. Every flight, train and bus has a live seat map. Grey striped seats are already taken. On flights, window, aisle and exit-row seats carry a small fee — the price updates as you pick.' },
  { q: 'How do I cancel?', a: 'Open My Trips, find the booking and tap Cancel. Seats are released immediately and 80% of the amount is refunded.' },
  { q: 'Do I need a licence to rent a car?', a: 'For self-drive you need a valid driving licence. If you add a professional driver at checkout, you don\'t need to drive at all.' },
  { q: 'Does GlobeX work on my phone?', a: 'Yes — the whole site is responsive. Open it in your phone\'s browser; everything including the seat maps works with touch.' },
  { q: 'Is my payment real?', a: 'No. This is a demo project: payment details are checked for format only, never stored, and nothing is charged.' },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {FAQ.map((f, i) => (
        <div key={f.q} className={`faq-item glass ${open === i ? 'open' : ''}`}>
          <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{f.q}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown size={18} /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <p className="faq-a muted">{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Support() {
  const { hash } = useLocation();
  const toast = useToast();
  const [msg, setMsg] = useState({ name: '', email: '', text: '' });

  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(t);
  }, [hash]);

  const send = (e) => {
    e.preventDefault();
    if (!msg.name.trim() || !/^\S+@\S+\.\S+$/.test(msg.email) || msg.text.trim().length < 10) {
      return toast('Add your name, a valid email and a message (10+ characters)', 'error');
    }
    toast('Thanks! Our team will reply within 24 hours.', 'success');
    setMsg({ name: '', email: '', text: '' });
  };

  return (
    <Page className="container support-page">
      <motion.div className="page-head" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow"><LifeBuoy size={14} /> Support</span>
        <h1>How can we <span className="gradient-text">help?</span></h1>
      </motion.div>

      <section id="help" className="support-section">
        <h2>Help centre</h2>
        <Faq />
      </section>

      <section id="cancellation" className="support-section glass support-card">
        <h2><RotateCcw size={20} /> Cancellation policy</h2>
        <ul>
          <li>Cancel any upcoming flight, train, bus or car booking from <b>My Trips</b>.</li>
          <li>You get an <b>80% refund</b> of the total amount, back to your original payment method.</li>
          <li>Cancelled seats are released straight away so other travellers can book them.</li>
          <li>Trips whose travel date has passed can't be cancelled.</li>
        </ul>
      </section>

      <section id="privacy" className="support-section glass support-card">
        <h2><Shield size={20} /> Privacy</h2>
        <ul>
          <li>We store your name, email, phone and bookings to run your account.</li>
          <li>Passwords are hashed with bcrypt — nobody can read them, not even us.</li>
          <li>Payment details are validated in your browser and are <b>never sent or stored</b>.</li>
          <li>Delete <code>server/data/db.json</code> to wipe all demo data.</li>
        </ul>
      </section>

      <section id="contact" className="support-section">
        <h2>Contact us</h2>
        <div className="contact-grid">
          <div className="stack">
            <a href="mailto:support@globex.app" className="contact-card glass"><Mail size={20} /> <span><b>Email</b><em className="muted">support@globex.app</em></span></a>
            <a href="tel:+911800123456" className="contact-card glass"><Phone size={20} /> <span><b>Call 24×7</b><em className="muted">1800-123-456</em></span></a>
          </div>
          <form className="glass support-card stack" onSubmit={send}>
            <input className="input" placeholder="Your name" value={msg.name} onChange={(e) => setMsg({ ...msg, name: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={msg.email} onChange={(e) => setMsg({ ...msg, email: e.target.value })} />
            <textarea className="input" rows={4} placeholder="How can we help?" value={msg.text} onChange={(e) => setMsg({ ...msg, text: e.target.value })} />
            <Button type="submit" icon={Send}>Send message</Button>
          </form>
        </div>
      </section>
    </Page>
  );
}
