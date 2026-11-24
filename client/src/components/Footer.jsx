import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Phone, LifeBuoy } from 'lucide-react';
import { Logo } from './Navbar';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted footer-tag">Flights, trains, buses and self-drive cars — booked in seconds.</p>
          <div className="socials">
            <motion.a href="mailto:support@globex.app" className="social" whileHover={{ y: -4, scale: 1.12 }} whileTap={{ scale: 0.9 }} title="Email support"><Mail size={17} /></motion.a>
            <motion.a href="tel:+911800123456" className="social" whileHover={{ y: -4, scale: 1.12 }} whileTap={{ scale: 0.9 }} title="Call support"><Phone size={17} /></motion.a>
            <motion.div whileHover={{ y: -4, scale: 1.12 }} whileTap={{ scale: 0.9 }}>
              <Link to="/support" className="social" title="Help centre"><LifeBuoy size={17} /></Link>
            </motion.div>
          </div>
        </div>
        <div>
          <h4>Book</h4>
          <Link to="/search?type=flight">Flights</Link>
          <Link to="/search?type=train">Trains</Link>
          <Link to="/search?type=bus">Buses</Link>
          <Link to="/cars">Car rental</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/bookings">My trips</Link>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/support#help">Help centre</Link>
          <Link to="/support#cancellation">Cancellation policy</Link>
          <Link to="/support#privacy">Privacy</Link>
          <Link to="/support#contact">Contact us</Link>
        </div>
      </div>
      <div className="container footer-bottom muted">
        © {new Date().getFullYear()} GlobeX · Demo project — payments are simulated · Photos from Unsplash
      </div>
    </footer>
  );
}
