import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Zap, BadgePercent, Headphones, ArrowRight, Plane, TrainFront, Bus, Car, Sparkles, MapPin, Globe2 } from 'lucide-react';
import Page, { stagger, rise } from '../components/Page';
import SearchWidget from '../components/SearchWidget';
import HeroSearch from '../components/HeroSearch';
import TiltCard from '../components/TiltCard';
import Counter from '../components/Counter';
import Button from '../components/Button';
import CarIllustration from '../components/CarIllustration';
import { useBackground } from '../components/PhotoBackground';
import useCities from '../components/useCities';
import { cityPhoto } from '../places';
import useDestinations from '../components/useDestinations';
import { DestinationCard, REGION_TABS } from './Explore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isoDate } from '../api';
import { LITE } from '../perf';
import GlobeHero from '../components/GlobeHero';
import { LINKS } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Ticket, User } from 'lucide-react';

const WORDS = ['flights', 'trains', 'buses', 'road trips'];

const FEATURES = [
  { icon: Zap, title: 'Book in 30 seconds', text: 'Search, pick a class and confirm — fewer taps, zero clutter.' },
  { icon: BadgePercent, title: 'Honest prices', text: 'All taxes shown up front. What you see is what you pay.' },
  { icon: ShieldCheck, title: 'Free cancellation*', text: 'Cancel from My Trips in one tap and get an instant refund.' },
  { icon: Headphones, title: '24×7 support', text: 'Real humans ready to help, whenever your plans change.' },
];

const ROUTES = [
  { from: 'HYD', to: 'GOI', fromName: 'Hyderabad', toName: 'Goa', type: 'flight', icon: Plane, hue: 190, tag: 'Beach escape' },
  { from: 'DEL', to: 'JAI', fromName: 'New Delhi', toName: 'Jaipur', type: 'train', icon: TrainFront, hue: 30, tag: 'Pink city' },
  { from: 'BLR', to: 'COK', fromName: 'Bengaluru', toName: 'Kochi', type: 'bus', icon: Bus, hue: 150, tag: 'Backwaters' },
  { from: 'BOM', to: 'DEL', fromName: 'Mumbai', toName: 'New Delhi', type: 'flight', icon: Plane, hue: 270, tag: 'Metro hop' },
  { from: 'DEL', to: 'AGR', fromName: 'New Delhi', toName: 'Agra', type: 'train', icon: TrainFront, hue: 330, tag: 'Taj Mahal' },
  { from: 'LKO', to: 'VNS', fromName: 'Lucknow', toName: 'Varanasi', type: 'train', icon: TrainFront, hue: 45, tag: 'Spiritual' },
];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="rotator">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[i]}
          className="gradient-text"
          initial={{ y: '100%', opacity: 0, rotateX: -80 }}
          animate={{ y: '0%', opacity: 1, rotateX: 0 }}
          exit={{ y: '-100%', opacity: 0, rotateX: 80 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PhotoCaption() {
  const bg = useBackground();
  if (!bg?.current) return null;
  return (
    <motion.div className="photo-caption" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
      <button className="photo-nav" onClick={() => bg.goTo(bg.index - 1)} aria-label="Previous photo"><ChevronLeft size={15} /></button>
      <AnimatePresence mode="wait">
        <motion.span key={bg.current.key} className="place" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          <MapPin size={13} /> {bg.current.place}
        </motion.span>
      </AnimatePresence>
      <div className="photo-dots">
        {bg.slides.map((s, i) => (
          <button key={s.key} className={i === bg.index ? 'active' : ''} onClick={() => bg.goTo(i)} aria-label={`Show ${s.place}`} />
        ))}
      </div>
      <button className="photo-nav" onClick={() => bg.goTo(bg.index + 1)} aria-label="Next photo"><ChevronRight size={15} /></button>
    </motion.div>
  );
}

function ExploreWorld() {
  const all = useDestinations();
  const [region, setRegion] = useState('All');
  const list = all.filter((d) => region === 'All' || d.region === region).slice(0, region === 'All' ? 9 : 8);
  return (
    <section className="container section">
      <motion.div className="section-head row-between" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="stack-sm">
          <span className="eyebrow"><Globe2 size={14} /> Suggestions for you</span>
          <h2>Famous places around the world</h2>
        </div>
        <div className="row gap">
          <Button to="/explore" variant="ghost" size="sm" iconRight={ArrowRight}>Top destinations</Button>
          <Button to="/world" size="sm" icon={Globe2}>All 250 countries</Button>
        </div>
      </motion.div>
      <div className="chip-group scroll-x explore-tabs">
        {REGION_TABS.map((t) => (
          <motion.button key={t} className={`chip-btn ${region === t ? 'active' : ''}`} onClick={() => setRegion(t)} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}>
            {region === t && <motion.span layoutId="explore-pill" className="chip-pill" />}
            <span>{t}</span>
          </motion.button>
        ))}
      </div>
      <motion.div layout className="explore-grid">
        <>
          {list.map((d, i) => <DestinationCard key={d.slug} d={d} index={i} big={i === 0 && region === 'All'} />)}
        </>
      </motion.div>
    </section>
  );
}

function HomeMenu() {
  const { user } = useAuth();
  return (
    <nav className="home-menu glass" aria-label="Main">
      {LINKS.filter((l) => l.match !== 'home').map((l) => (
        <Link key={l.label} to={l.to} className="hm-link"><l.icon size={17} /> <span>{l.label}</span></Link>
      ))}
      <span className="hm-sep" />
      {user
        ? <Link to="/bookings" className="hm-link"><Ticket size={17} /> <span>My Trips</span></Link>
        : <Link to="/login" className="hm-link hm-login"><User size={17} /> <span>Log in</span></Link>}
    </nav>
  );
}

export default function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);
  const [instantGlobe] = useState(() => { try { return !sessionStorage.getItem('tripnova_intro_seen'); } catch { return false; } });

  return (
    <Page className="home-page">
      {/* first screen: globe card → menu → search → popular routes (fits a desktop screen) */}
      {/* globe runs edge to edge across the screen */}
      <GlobeHero instant={instantGlobe} />

      <section className="container section home-routes-sec">
        <div className="section-head">
          <span className="eyebrow">Trending in India</span>
          <h2>Popular routes this week</h2>
        </div>
        <div className="routes-grid">
          {ROUTES.map((r) => (
            <Link key={r.from + r.to + r.type} to={`/search?type=${r.type}&from=${r.from}&to=${r.to}&date=${isoDate(5)}&pax=1`} className="photo-card route-photo">
              <img src={cityPhoto(r.to)} alt={r.toName} loading="lazy" decoding="async" />
              <span className="photo-card-shade" />
              <span className="photo-card-top"><span className="tag light"><r.icon size={13} /> {r.type === 'flight' ? 'Flight' : r.type === 'train' ? 'Train' : 'Bus'}</span></span>
              <span className="photo-card-body">
                <em>{r.tag}</em>
                <b>{r.fromName} <ArrowRight size={16} className="route-arrow" /> {r.toName}</b>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <motion.section className="container stats" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
        {[
          { n: 2.4, s: 'M+', d: 1, l: 'Happy travellers' },
          { n: 1200, s: '+', l: 'Daily routes' },
          { n: 350, s: '+', l: 'Cars to rent' },
          { n: 4.8, s: '★', d: 1, l: 'Average rating' },
        ].map((x) => (
          <motion.div key={x.l} className="stat glass" variants={rise} whileHover={{ y: -6, scale: 1.03 }}>
            <strong className="gradient-text"><Counter to={x.n} suffix={x.s} decimals={x.d || 0} /></strong>
            <span className="muted">{x.l}</span>
          </motion.div>
        ))}
      </motion.section>

      <ExploreWorld />

      <section className="container section">
        <motion.div className="section-head" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="eyebrow">Why GlobeX</span>
          <h2>Travel booking, reimagined</h2>
        </motion.div>
        <motion.div className="features-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={rise}>
              <TiltCard className="feature glass">
                <motion.span className="feature-icon" whileHover={{ rotate: 360 }} transition={{ duration: 0.7 }}>
                  <f.icon size={22} />
                </motion.span>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="container section">
        <motion.div
          className="cta glass"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
        >
          <div className="cta-copy">
            <span className="eyebrow"><Car size={14} /> Self-drive & chauffeur</span>
            <h2>Your own wheels, <span className="gradient-text">anywhere.</span></h2>
            <p className="muted">Hatchbacks to luxury SUVs and EVs. Unlimited km, doorstep delivery, and an optional professional driver.</p>
            <Button to="/cars" size="lg" iconRight={ArrowRight}>Explore cars</Button>
          </div>
          <div className="cta-car">
            <div className="road"><span /></div>
            <motion.div animate={{ x: [-8, 8, -8] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <CarIllustration color="#0ea5e9" type="SUV" hovered />
            </motion.div>
          </div>
        </motion.div>
      </section>
    </Page>
  );
}
