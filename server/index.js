import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import bookingRoutes from './routes/bookings.js';
import worldRoutes from './routes/world.js';
import assistantRoutes from './routes/assistant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// optional settings in server/.env (e.g. ANTHROPIC_API_KEY for the AI assistant)
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
} catch { /* ignore */ }
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '6mb' })); // travel-guide pages can be large

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'GlobeX API' }));
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// In production (after `npm run build`), serve the React app from the same server.
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => console.log(`🌍 GlobeX API running on http://localhost:${PORT}`));
