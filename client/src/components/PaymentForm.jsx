import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, Landmark, ShieldCheck } from 'lucide-react';

const METHODS = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'netbanking', label: 'Net banking', icon: Landmark },
];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];
const BANK_SHORT = { 'State Bank of India': 'SBI', 'HDFC Bank': 'HDFC', 'ICICI Bank': 'ICICI', 'Axis Bank': 'AXIS', 'Kotak Mahindra Bank': 'KOTAK' };

/** Returns an error message, or '' when the (demo) payment details look valid. */
export function validatePayment(method, d = {}) {
  if (method === 'card') {
    const num = (d.card || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(num)) return 'Enter a 16-digit card number (demo: 4242 4242 4242 4242)';
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(d.expiry || '');
    if (!m || +m[1] < 1 || +m[1] > 12) return 'Enter expiry as MM/YY';
    const exp = new Date(2000 + +m[2], +m[1]); // first day of the month after expiry
    if (exp <= new Date()) return 'This card has expired';
    if (!/^\d{3,4}$/.test(d.cvv || '')) return 'Enter the 3-digit CVV';
    if (!(d.holder || '').trim()) return 'Enter the name on the card';
  } else if (method === 'upi') {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test((d.upi || '').trim())) return 'Enter a valid UPI ID, e.g. name@okaxis';
  } else if (method === 'netbanking') {
    if (!d.bank) return 'Choose your bank';
  }
  return '';
}

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const fmtExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Demo payment step — validated, but no money is ever charged. */
export default function PaymentForm({ method, setMethod, details = {}, setDetails }) {
  const set = (k, v) => setDetails?.({ ...details, [k]: v });
  return (
    <div className="payment">
      <div className="pay-methods">
        {METHODS.map((m) => (
          <motion.button
            type="button"
            key={m.id}
            className={`pay-method ${method === m.id ? 'active' : ''}`}
            onClick={() => setMethod(m.id)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <m.icon size={20} />
            {m.label}
          </motion.button>
        ))}
      </div>
      <>
        <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {method === 'card' && (
            <div className="form-grid">
              <input className="input span-2" placeholder="Card number" inputMode="numeric" autoComplete="cc-number"
                value={details.card || ''} onChange={(e) => set('card', fmtCard(e.target.value))} />
              <input className="input" placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp"
                value={details.expiry || ''} onChange={(e) => set('expiry', fmtExpiry(e.target.value))} />
              <input className="input" placeholder="CVV" inputMode="numeric" type="password" maxLength={4} autoComplete="cc-csc"
                value={details.cvv || ''} onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <input className="input span-2" placeholder="Name on card" autoComplete="cc-name"
                value={details.holder || ''} onChange={(e) => set('holder', e.target.value)} />
            </div>
          )}
          {method === 'upi' && (
            <input className="input" placeholder="yourname@okaxis" value={details.upi || ''} onChange={(e) => set('upi', e.target.value)} />
          )}
          {method === 'netbanking' && (
            <div className="bank-grid" role="radiogroup" aria-label="Choose your bank">
              {BANKS.map((b) => (
                <motion.button
                  type="button"
                  key={b}
                  role="radio"
                  aria-checked={details.bank === b}
                  className={`bank-option ${details.bank === b ? 'on' : ''}`}
                  onClick={() => set('bank', b)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="bank-logo">{BANK_SHORT[b]}</span>
                  <span className="bank-name">{b}</span>
                  <span className="bank-radio" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </>
      <p className="secure muted small"><ShieldCheck size={14} /> Demo mode — details are checked but never stored, and no money is charged. Try card 4242 4242 4242 4242.</p>
    </div>
  );
}
