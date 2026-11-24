import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BackgroundProvider } from './components/PhotoBackground';
import Intro from './components/Intro';
import Navbar from './components/Navbar';
import HomePill from './components/HomePill';
import Assistant from './components/Assistant';
import GlobeHost from './components/GlobeHost';
import Footer from './components/Footer';
import Home from './pages/Home';
import Search from './pages/Search';
import Cars from './pages/Cars';
import Bookings from './pages/Bookings';
import { Login, Register } from './pages/Auth';
import NotFound from './pages/NotFound';
import Support from './pages/Support';
import Explore from './pages/Explore';
import Destination from './pages/Destination';
import Checkout from './pages/Checkout';
import World from './pages/World';
import Guide from './pages/Guide';
import RentCheckout from './pages/RentCheckout';
import { useAuth } from './context/AuthContext';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

export default function App() {
  const location = useLocation();
  // opening animation plays once per visit (not on every reload)
  const [intro, setIntro] = useState(() => { try { return !sessionStorage.getItem('tripnova_intro_seen'); } catch { return true; } });
  const finishIntro = useCallback(() => {
    try { sessionStorage.setItem('tripnova_intro_seen', '1'); } catch {}
    setIntro(false);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: location.pathname === '/' ? 'auto' : 'smooth' }); }, [location.pathname]);
  useEffect(() => { document.body.style.overflow = intro ? 'hidden' : ''; }, [intro]);

  return (
    <BackgroundProvider>
      <AnimatePresence>{intro && <Intro key="intro" onDone={finishIntro} />}</AnimatePresence>
      {/* the app renders underneath the intro, so the globe is already loaded when the intro zooms into it */}
      <>
          <Navbar />
          <main className="main">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/bookings" element={<Protected><Bookings /></Protected>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/support" element={<Support />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/explore/:slug" element={<Destination />} />
              <Route path="/world" element={<World />} />
              <Route path="/globe" element={<Navigate to="/" replace />} />
              <Route path="/guide/*" element={<Guide />} />
              <Route path="/book" element={<Protected><Checkout /></Protected>} />
              <Route path="/rent/:carId" element={<Protected><RentCheckout /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <HomePill />
          <GlobeHost />
          {!intro && <Assistant />}
      </>
    </BackgroundProvider>
  );
}
