import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import Page from '../components/Page';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <Page className="container notfound">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="nf-icon">
        <Compass size={64} />
      </motion.div>
      <h1 className="gradient-text">404</h1>
      <p className="muted">Looks like this route isn't on the map.</p>
      <Button to="/">Take me home</Button>
    </Page>
  );
}
