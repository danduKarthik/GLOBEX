import { Router } from 'express';

/**
 * GlobeX assistant.
 * If ANTHROPIC_API_KEY is set (server/.env), questions are answered by Claude with the app guide below.
 * Without a key this returns 503 and the browser falls back to its built-in offline guide — the bot still works.
 */
const router = Router();

const GUIDE = `You are "Globo", the friendly assistant inside GlobeX, a travel web app (India-focused, with destinations worldwide).
Help users find their way around the app and plan trips. Keep answers short (under 110 words), warm and practical; use simple steps when explaining how to do something. No markdown headings; plain sentences or short numbered steps.
What GlobeX can do:
- Home page: a 3D globe. Pull down at the very top of the page ("Scroll down to go high") or click the Earth to open the full globe. In the full globe: drag to turn, + / − to zoom, compass to reset, search places, tap a photo label to fly there, "Spin" lands on a random place, "Yes, take me there" opens that place. Push up / Esc to go back.
- Top bar: Explore, Flights, Trains, Buses, Car Rental, search (magnifier), notifications, account (log in / sign up / My Trips).
- Flights / Trains / Buses: pick From, To, date and travellers, press Search, filter by time and price, choose a fare class, pick seats on the seat map, enter passenger details, pay (card, UPI or net banking — demo payments, no real money), get a ticket with a PNR.
- Car Rental: choose city and dates, pick a self-drive car, add extras, pay; doorstep delivery.
- Explore: famous destinations and all their tourist places; select places and book a trip from there. World section: every country and its travel guide.
- My Trips (Bookings): see and cancel bookings (needs log-in).
- Support page for help and FAQs.
If asked something unrelated to travel or the app, answer briefly and steer back to trip planning. Never invent prices; say the app shows live fares on the search page.`;

router.post('/', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'offline', message: 'No AI key configured — using the built-in guide.' });
  const history = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return res.status(400).json({ error: 'Ask me something first' });
  const page = typeof req.body?.page === 'string' ? req.body.page.slice(0, 120) : '/';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ASSISTANT_MODEL || 'claude-haiku-5-5',
        max_tokens: 400,
        system: `${GUIDE}\nThe user is currently on the page: ${page}`,
        messages,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || `AI service error (${r.status})` });
    const reply = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return res.json({ reply: reply || 'Sorry, I could not think of an answer — try asking another way.', source: 'ai' });
  } catch {
    return res.status(502).json({ error: 'Could not reach the AI service' });
  }
});

export default router;
