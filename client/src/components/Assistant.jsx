import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, X, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { GLOBE_PLACES } from '../globePlaces';

/* ------------------------------------------------------------------------------------------------
 * Globo — the GlobeX assistant (bottom-left).
 * Answers with Claude when the server has an ANTHROPIC_API_KEY, otherwise with the built-in guide
 * below. Every answer can carry buttons that take you straight to the right page.
 * ---------------------------------------------------------------------------------------------- */

const FEATURED = GLOBE_PLACES.filter((p) => p.kind === 'featured');
const SUGGESTIONS = ['How do I book a flight?', 'Choose my seat', 'Rent a car', 'How does the 3D globe work?', 'Suggest a beach trip', 'Cancel a booking'];

const has = (t, ...words) => words.some((w) => t.includes(w));

function guide(text, path) {
  const t = ` ${text.toLowerCase()} `;
  const place = FEATURED.find((p) => t.includes(` ${p.name.toLowerCase()}`) || t.includes(` ${p.slug.replace(/-/g, ' ')}`));
  const act = (label, to) => ({ label, to });
  const globe = { label: 'Open the 3D globe', globe: true };

  if (has(t, ' hi ', ' hello', ' hey', 'namaste', 'good morning', 'good evening')) {
    return { text: "Hi! I'm Globo 👋 I can help you book flights, trains, buses or a car, find places to visit, or show you how the 3D globe works. What would you like to do?", chips: SUGGESTIONS.slice(0, 4) };
  }
  if (has(t, 'thank', 'thanks', 'great', 'awesome', 'nice')) return { text: "Happy to help! Ask me anything else about your trip ✈️" };
  if (has(t, 'bye', 'see you')) return { text: 'Bye! Have a wonderful journey 🌍' };

  if (has(t, 'seat')) {
    return { text: 'To pick your seat:\n1. Search your route and press **Select** on a flight, train or bus.\n2. The seat map opens — tap any free seat (green). Window, aisle and extra-legroom seats are marked.\n3. Pick one seat per traveller, then **Continue** to passenger details.', actions: [act('Search flights', '/search?type=flight'), act('Search trains', '/search?type=train')] };
  }
  if (has(t, 'cancel', 'refund', 'my trip', 'my booking', 'bookings', 'pnr', 'ticket')) {
    return { text: 'Your bookings live in **My Trips** (you need to be logged in). Open a booking to see the ticket and PNR, or press **Cancel booking** — the refund goes back to the payment method you used.', actions: [act('Open My Trips', '/bookings'), act('Log in', '/login')] };
  }
  if (has(t, 'pay', 'upi', 'card', 'net banking', 'netbanking')) {
    return { text: 'At checkout you can pay by **card**, **UPI** or **net banking** (tap your bank). Payments in GlobeX are a demo — no real money is charged. After paying you get your ticket with a PNR straight away.' };
  }
  if (has(t, ' car', 'rent', 'self drive', 'self-drive', 'drive')) {
    return { text: 'To rent a car:\n1. Open **Car Rental**.\n2. Choose your city, pick-up and drop-off dates.\n3. Pick a car (hatchback, sedan, SUV, EV…), add extras like a child seat.\n4. Pay — the car can be delivered to your door.', actions: [act('Rent a car', '/cars')] };
  }
  if (has(t, 'flight', 'fly', 'plane', 'airport')) {
    return { text: 'Booking a flight:\n1. Open **Flights**, choose From, To, date and travellers.\n2. Press **Search**, then filter by time or price.\n3. Pick a fare (Economy, Premium, Business) and your seats.\n4. Add passenger details and pay.', actions: [act('Search flights', '/search?type=flight')] };
  }
  if (has(t, 'train', 'rail')) {
    return { text: 'Booking a train: open **Trains**, choose From, To and the date, press **Search**, pick a class (Sleeper, 3A, 2A, 1A…), choose berths on the coach map, add passengers and pay.', actions: [act('Search trains', '/search?type=train')] };
  }
  if (has(t, ' bus', 'buses', 'volvo', 'sleeper bus')) {
    return { text: 'Booking a bus: open **Buses**, choose From, To and the date, press **Search**, pick a bus, choose your seat (upper / lower deck), add passengers and pay.', actions: [act('Search buses', '/search?type=bus')] };
  }
  if (has(t, 'globe', 'earth', 'spin', '3d', 'map')) {
    return { text: 'The 3D globe:\n• On the home page, at the very top, **scroll down to go high** (or click the Earth) — the full globe opens.\n• Drag to turn it, use + / − to zoom, and the compass to reset.\n• Tap a photo label to fly there, or press **Spin** for a surprise place.\n• Push up or press Esc to come back.', actions: [globe] };
  }
  if (place) {
    return { text: `${place.name}, ${place.country} — ${place.tagline || 'a lovely place to visit'}. ${place.bestTime ? `Best time: ${place.bestTime}. ` : ''}${place.days ? `Ideal trip: ${place.days}.` : ''} Open it to see all its tourist places and book from there.`, actions: [act(`Explore ${place.name}`, `/explore/${place.slug}`)] };
  }
  if (has(t, 'beach', 'sea', 'island', 'coast')) {
    return { text: 'Beach ideas 🏖️: **Goa** for sunsets and shacks, **Andaman** for clear water, **Kerala** for palm-lined coasts and backwaters, or **Bali** and the **Maldives** abroad.', actions: [act('Goa', '/explore/goa'), act('Kerala', '/explore/kerala'), act('Maldives', '/explore/maldives')] };
  }
  if (has(t, 'mountain', 'snow', 'hill', 'trek')) {
    return { text: 'Mountain ideas 🏔️: **Ladakh** for high passes and lakes, **Manali** and **Shimla** for snow, or the **Swiss Alps** abroad.', actions: [act('Ladakh', '/explore/ladakh'), act('Explore all', '/explore')] };
  }
  if (has(t, 'where', 'visit', 'suggest', 'recommend', 'trip', 'holiday', 'vacation', 'tourist', 'place')) {
    return { text: 'Open **Explore** to browse famous destinations and all their tourist places — select the ones you like and book your journey from there. Or spin the 3D globe for a surprise!', actions: [act('Explore destinations', '/explore'), globe] };
  }
  if (has(t, 'country', 'countries', 'abroad', 'international', 'visa')) {
    return { text: 'The **World** section has every country with its travel guide — cities, sights and tips. Visa rules change often, so please check the embassy website before you travel.', actions: [act('Browse countries', '/world')] };
  }
  if (has(t, 'login', 'log in', 'sign up', 'signup', 'account', 'register', 'password')) {
    return { text: 'Use the account button (top right) to **Log in** or **Create account**. You need an account to book and to see My Trips.', actions: [act('Log in', '/login'), act('Create account', '/register')] };
  }
  if (has(t, 'cheap', 'price', 'cost', 'fare', 'budget', 'discount', 'offer', 'deal')) {
    return { text: 'Tips for a better price: search a few dates around your trip, use the **Cheapest** sort and the price slider on the results page, and book early for flights. The live fares are always shown on the search page.', actions: [act('Search flights', '/search?type=flight')] };
  }
  if (has(t, 'help', 'support', 'contact', 'problem', 'issue', 'complain')) {
    return { text: 'For anything else, the **Support** page has FAQs and a contact form.', actions: [act('Open Support', '/support')] };
  }
  return {
    text: path === '/' ? "I'm not sure about that one yet 🤔 I can help with bookings, seats, payments, car rental, destinations and the 3D globe." : "I'm not sure about that one yet 🤔 Try one of these:",
    chips: SUGGESTIONS,
  };
}

// **bold** and line breaks
function Rich({ text }) {
  return text.split('\n').map((line, i) => (
    <span key={i} className="as-line">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : part))}
    </span>
  ));
}

export default function Assistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [msgs, setMsgs] = useState(() => [{ role: 'assistant', content: "Hi! I'm Globo, your GlobeX guide 🌍 How can I help you today?", chips: SUGGESTIONS }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const aiOk = useRef(true);
  const botRef = useRef(null);

  // say hello once, a few seconds after the page opens
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('globex_bot_hi') === '1'; } catch { /* ignore */ }
    if (seen) return undefined;
    const t1 = setTimeout(() => setBubble(true), 6500);
    const t2 = setTimeout(() => { setBubble(false); try { sessionStorage.setItem('globex_bot_hi', '1'); } catch { /* ignore */ } }, 13500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, typing]);
  useEffect(() => { if (open) { setBubble(false); setTimeout(() => inputRef.current?.focus(), 250); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  const ask = async (text) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput('');
    const history = [...msgs, { role: 'user', content: q }];
    setMsgs(history);
    setTyping(true);
    const local = guide(q, location.pathname);
    let reply = null;
    if (aiOk.current) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        const r = await fetch('/api/assistant', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
          body: JSON.stringify({ page: location.pathname, messages: history.map((m) => ({ role: m.role, content: m.content })) }),
        });
        clearTimeout(timer);
        if (r.status === 503) aiOk.current = false; // no key on the server: use the built-in guide from now on
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.reply) reply = data.reply;
      } catch { /* offline: fall back */ }
    }
    if (!reply) await new Promise((res) => setTimeout(res, 450 + Math.min(900, local.text.length * 4)));
    setTyping(false);
    setMsgs((m) => [...m, { role: 'assistant', content: reply || local.text, actions: local.actions, chips: reply ? undefined : local.chips }]);
  };

  const doAction = (a) => {
    if (a.globe) {
      if (location.pathname === '/') window.dispatchEvent(new Event('globex:open-globe'));
      else navigate('/');
      setOpen(false);
      return;
    }
    navigate(a.to);
    if (window.innerWidth < 640) setOpen(false);
  };
  const reset = () => setMsgs([{ role: 'assistant', content: 'Fresh start! What can I help you with?', chips: SUGGESTIONS }]);

  const hidden = useMemo(() => /^\/(book|checkout|rent)/.test(location.pathname), [location.pathname]);

  return createPortal(
    <div className={`assistant ${open ? 'is-open' : ''} ${hidden ? 'low' : ''}`}>
      <AnimatePresence>
        {open && (
          <motion.section className="as-panel" role="dialog" aria-label="GlobeX assistant"
            initial={{ opacity: 0, y: 24, scale: 0.92, transformOrigin: '0% 100%' }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <header className="as-head">
              <span className="as-ava"><img src="/assistant/bot.png" alt="" /></span>
              <span className="as-title"><b>Globo</b><em><i className="as-online" /> GlobeX assistant</em></span>
              <button onClick={reset} aria-label="New chat" title="New chat"><RotateCcw size={16} /></button>
              <button onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18} /></button>
            </header>
            <div className="as-list" ref={listRef}>
              {msgs.map((m, i) => (
                <motion.div key={i} className={`as-msg ${m.role === 'user' ? 'from-user' : 'from-bot'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <div className="as-bubble"><Rich text={m.content} /></div>
                  {m.actions?.length > 0 && (
                    <div className="as-actions">
                      {m.actions.map((a) => <button key={a.label} onClick={() => doAction(a)}>{a.label} <ArrowRight size={14} /></button>)}
                    </div>
                  )}
                  {m.chips?.length > 0 && i === msgs.length - 1 && (
                    <div className="as-chips">
                      {m.chips.map((c) => <button key={c} onClick={() => ask(c)}>{c}</button>)}
                    </div>
                  )}
                </motion.div>
              ))}
              {typing && <div className="as-msg from-bot"><div className="as-bubble as-typing"><i /><i /><i /></div></div>}
            </div>
            <form className="as-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your trip…" aria-label="Message" maxLength={500} />
              <motion.button type="submit" disabled={!input.trim() || typing} whileTap={{ scale: 0.9 }} aria-label="Send"><Send size={17} /></motion.button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bubble && !open && (
          <motion.button className="as-hello" onClick={() => setOpen(true)} initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}>
            <Sparkles size={14} /> Need help planning a trip?
          </motion.button>
        )}
      </AnimatePresence>

      <button ref={botRef} type="button" className="as-bot" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close assistant' : 'Open the GlobeX assistant'}
        onMouseEnter={() => !open && setBubble(true)} onMouseLeave={() => setBubble(false)}>
        <span className="as-twinkles" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className="as-bot-3d">
          <img src="/assistant/bot.png" alt="" draggable="false" />
          <i className="as-eye l" /><i className="as-eye r" />
          <i className="as-sheen" />
        </span>
        <i className="as-shadow" />
      </button>
    </div>,
    document.body,
  );
}
