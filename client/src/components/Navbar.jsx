import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plane, TrainFront, Bus, Car, Ticket, LogOut, Menu, X, User, Compass, House, Bell, ChevronDown, UserPlus, LogIn } from 'lucide-react';
import PlaceSearch from './PlaceSearch';
import NavGlobeSearch from './NavGlobeSearch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from './Button';

export const LINKS = [
  { to: '/', label: 'Home', icon: House, match: 'home' },
  { to: '/explore', label: 'Explore', icon: Compass, match: 'explore' },
  { to: '/search?type=flight', label: 'Flights', icon: Plane, match: 'flight' },
  { to: '/search?type=train', label: 'Trains', icon: TrainFront, match: 'train' },
  { to: '/search?type=bus', label: 'Buses', icon: Bus, match: 'bus' },
  { to: '/cars', label: 'Car Rental', icon: Car, match: 'cars' },
];

/** Brand: a tiny spinning Earth + "GlobeX". The Earth is also the home-page globe once it shrinks away —
 *  tap it to fly back up to the full-screen globe. */
export function Logo() {
  const navigate = useNavigate();
  const location = useLocation();
  const openGlobe = (e) => {
    e.preventDefault();
    if (location.pathname === '/') window.dispatchEvent(new Event('globex:open-globe'));
    else navigate('/');
  };
  return (
    <a href="/" className="logo" data-hover onClick={openGlobe} aria-label="GlobeX — open the globe">
      <motion.span id="nav-globe" className="nav-globe big" whileHover={{ scale: 1.12, rotate: 8 }} whileTap={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 400 }} />
      <span className="logo-text">Globe<b>X</b></span>
    </a>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef(null);
  const isHome = location.pathname === '/';
  const [menu, setMenu] = useState(null); // 'bell' | 'user' | null
  const [unread, setUnread] = useState(() => { try { return localStorage.getItem('globex_notes_seen') !== '1'; } catch { return true; } });
  // one look for everyone: the night globe
  useEffect(() => {
    document.documentElement.classList.remove('theme-day');
    try { localStorage.removeItem('globex_theme_v2'); localStorage.removeItem('globex_theme'); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (!e.target.closest?.('.nav-pop, .nav-round')) setMenu(null); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);
  const openBell = () => { setMenu((m) => (m === 'bell' ? null : 'bell')); setUnread(false); try { localStorage.setItem('globex_notes_seen', '1'); } catch { /* ignore */ } };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); setMenu(null); }, [location]);

  const active = (l) =>
    l.match === 'home' ? location.pathname === '/'
      : l.match === 'explore' ? location.pathname.startsWith('/explore')
      : l.match === 'cars' ? location.pathname === '/cars'
      : location.pathname === '/search' && new URLSearchParams(location.search).get('type') === l.match;

  const doLogout = () => { logout(); toast('You have been logged out', 'info'); navigate('/'); };

  const NOTES = [
    { t: 'Welcome to GlobeX', d: 'Spin the globe to find your next trip.', icon: Compass },
    { t: 'Weekend deal', d: 'Up to 20% off flights to Goa this week.', icon: Plane },
    { t: 'New: self-drive EVs', d: 'Rent an electric car with doorstep delivery.', icon: Car },
  ];

  return (
    <header ref={header} className={`nav nav-v2 ${scrolled ? 'nav-scrolled' : ''} ${isHome ? 'on-home' : ''}`}>
      <div className="nav-inner">
        <div className="nav-brand"><Logo /><span className="nav-divider" /></div>
        <nav className="nav-links">
          {LINKS.map((l, i) => (
            <span key={l.label} className="nav-item">
              {i > 0 && <span className="nav-sep" />}
              <Link to={l.to} className={`nav-link ${active(l) ? 'active' : ''}`}
                onClick={(e) => { if (l.match === 'home' && isHome) { e.preventDefault(); window.dispatchEvent(new Event('globex:close-globe')); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
                {active(l) && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <span className="nav-ico"><l.icon size={18} /></span> <span>{l.label}</span>
              </Link>
            </span>
          ))}
        </nav>
        {!isHome && <PlaceSearch />}
        <div className="nav-actions">
          {isHome && <NavGlobeSearch />}
          <div className="nav-pop-wrap">
            <motion.button className="nav-round" onClick={openBell} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} aria-label="Notifications">
              <Bell size={19} />{unread && <i className="nav-dot" />}
            </motion.button>
            <AnimatePresence>
              {menu === 'bell' && (
                <motion.div className="nav-pop" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <b className="np-title">Notifications</b>
                  {NOTES.map((n) => (
                    <div key={n.t} className="np-row"><span className="np-ico"><n.icon size={16} /></span><span><b>{n.t}</b><em>{n.d}</em></span></div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="nav-pop-wrap">
            <motion.button className="nav-round nav-user" onClick={() => setMenu((m) => (m === 'user' ? null : 'user'))} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} aria-label="Account">
              <span className="nav-avatar">{user ? user.name[0].toUpperCase() : <User size={18} />}</span>
              <ChevronDown size={15} />
            </motion.button>
            <AnimatePresence>
              {menu === 'user' && (
                <motion.div className="nav-pop" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {user ? (
                    <>
                      <div className="np-user"><span className="nav-avatar">{user.name[0].toUpperCase()}</span><span><b>{user.name}</b><em>{user.email}</em></span></div>
                      <Link to="/bookings" className="np-link"><Ticket size={16} /> My Trips</Link>
                      <button className="np-link" onClick={doLogout}><LogOut size={16} /> Log out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="np-link"><LogIn size={16} /> Log in</Link>
                      <Link to="/register" className="np-link"><UserPlus size={16} /> Create account</Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.button className="icon-btn burger" onClick={() => setOpen((o) => !o)} whileTap={{ scale: 0.85 }} aria-label="Menu">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={open ? 'x' : 'm'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu glass"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="mobile-inner">
              {LINKS.map((l) => (
                <motion.div key={l.label} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                  <Link to={l.to} className={`mobile-link ${active(l) ? 'active' : ''}`}><l.icon size={18} /> {l.label}</Link>
                </motion.div>
              ))}
              <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mobile-actions">
                {user ? (
                  <>
                    <Link to="/bookings" className="mobile-link"><Ticket size={18} /> My Trips</Link>
                    <div className="mobile-user"><User size={16} /> {user.name}</div>
                    <Button variant="ghost" block icon={LogOut} onClick={doLogout}>Log out</Button>
                  </>
                ) : (
                  <div className="row gap">
                    <Button to="/login" variant="ghost" block>Log in</Button>
                    <Button to="/register" block>Sign up</Button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
