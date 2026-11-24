import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Page from '../components/Page';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function FloatInput({ icon: Icon, label, type = 'text', value, onChange, ...rest }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <motion.label className={`float-input ${value ? 'filled' : ''}`} whileHover={{ scale: 1.01 }}>
      <Icon size={17} className="fi-icon" />
      <input type={isPw && show ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder=" " {...rest} />
      <span className="fi-label">{label}</span>
      {isPw && (
        <motion.button type="button" className="fi-eye" onClick={() => setShow((s) => !s)} whileTap={{ scale: 0.85 }} aria-label="Toggle password">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </motion.button>
      )}
      <span className="fi-underline" />
    </motion.label>
  );
}

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <Page className="auth-page">
      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 16 }}
      >
        <div className="auth-orb" />
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="muted small auth-footer">{footer}</p>
      </motion.div>
    </Page>
  );
}

export function Login() {
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const dest = location.state?.from || '/';

  if (user) return <Navigate to={dest} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`, 'success');
      navigate(dest, { replace: true });
    } catch (err) {
      toast(err.message, 'error');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to book and manage your trips." footer={<>New to GlobeX? <Link to="/register" state={location.state}>Create an account</Link></>}>
      <motion.form onSubmit={submit} className="stack" key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
        <FloatInput icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <FloatInput icon={Lock} label="Password" type="password" value={password} onChange={setPassword} required autoComplete="current-password" />
        <Button type="submit" size="lg" block loading={loading} iconRight={ArrowRight}>Log in</Button>
      </motion.form>
    </AuthShell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const dest = location.state?.from || '/';
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (user) return <Navigate to={dest} replace />;

  const strength = Math.min(4, [/.{6,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await register(form);
      toast(`Account created. Welcome, ${u.name.split(' ')[0]}! ✨`, 'success');
      navigate(dest, { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Join GlobeX and start exploring." footer={<>Already have an account? <Link to="/login" state={location.state}>Log in</Link></>}>
      <form onSubmit={submit} className="stack">
        <FloatInput icon={User} label="Full name" value={form.name} onChange={set('name')} required autoComplete="name" />
        <FloatInput icon={Mail} label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <FloatInput icon={Phone} label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        <FloatInput icon={Lock} label="Password (min 6 chars)" type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" />
        <div className="strength">
          {[0, 1, 2, 3].map((i) => (
            <motion.i key={i} animate={{ scaleX: i < strength ? 1 : 0.15, opacity: i < strength ? 1 : 0.3 }} className={`s${strength}`} />
          ))}
        </div>
        <Button type="submit" size="lg" block loading={loading} iconRight={ArrowRight}>Create account</Button>
      </form>
    </AuthShell>
  );
}
