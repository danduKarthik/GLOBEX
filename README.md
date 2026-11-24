# 🌍 GlobeX — Full-Stack Travel Booking

Book **flights, trains and buses**, and **rent cars**, in one app. It works on mobile and desktop and has an animated, modern UI.

- **Frontend:** React 18 + Vite + Framer Motion + Lucide icons
- **Backend:** Node.js + Express + JWT auth (bcrypt passwords)
- **Database:** JSON file (`server/data/db.json`, created automatically). No setup needed.

---

## 🚀 Run it in VS Code

**Requirement:** [Node.js 18 or newer](https://nodejs.org) (check with `node -v`).

1. Extract the zip and open the `globex` folder in VS Code (**File → Open Folder**).
2. Open the terminal (**Ctrl + `**) and run:

```bash
npm run setup     # installs everything + downloads the travel photos, first time only
npm run dev       # starts API (port 5000) + website (port 5173) together
```

3. Open **http://localhost:5173** in your browser.

📱 **On your phone:** yes, it works on mobile.
1. Keep `npm run dev` running on your laptop.
2. Connect your phone to the **same Wi-Fi** as the laptop.
3. In the terminal, Vite prints a line like `➜  Network: http://192.168.1.5:5173/`. Type that address into your phone's browser.
4. On Windows, if it doesn't load, click **Allow** when Windows Firewall asks about Node.js. You can also allow Node.js under *Windows Security → Firewall → Allow an app*.

### Production mode (one server)
```bash
npm run build     # builds the React app into client/dist
npm start         # Express serves both API + website at http://localhost:5000
```

---

## ✨ Features

| Area | What it does |
|---|---|
| Search | Flights / trains / buses between 16 Indian cities, by date and number of travellers |
| Results | Sort by price, duration, departure time or rating · filter by time of day and max price · class picker with seats left |
| Booking | Full-page **light** checkout (travellers → seats → payment) over a soft, blurred, animated beach-and-trees photo background, with a trip summary card beside it and the total + main button pinned at the bottom on phones. Same for car rental. One step per screen (travellers → seats → payment). The total and main button are always at the bottom, with fare details one tap away. On phones it opens as a bottom sheet. Flow: travellers → **pick seats** → payment (simulated card/UPI/net banking) → confirmation with PNR |
| Seat selection | Real seat maps: aircraft cabin (window/aisle/exit rows, paid seats), train coaches with LB/MB/UB/side berths, 2+2 buses and two-deck sleeper buses. Booked seats are blocked, Auto-pick seats a group together, and the server rejects double-booking |
| Car rental | 12 cars (hatchback → luxury, EVs), filter by type, pick dates and city, optional driver, live price |
| My Trips | Upcoming / past / cancelled tabs, ticket-style cards, cancel with 80% refund |
| Auth | Register / login with JWT, password strength meter, protected routes |
| Whole world | **All 250 countries** (`/world`, with region tabs and search). Open any country to see its regions, cities and other destinations. Open any city to see its **places to visit** (sights and things to do, with photos, opening hours, prices, map links and websites). Search places inside the city, select them to build a plan, and **book flights** there (plus trains and buses inside India). Data comes live from [Wikivoyage](https://en.wikivoyage.org) (CC BY-SA, ~30,000 destinations), with photos from Wikipedia. It is cached in `server/data/cache` for 7 days, so after the first visit pages open instantly |
| Home search | Big "Search a city" box on the home page. Type a city (e.g. Warangal, Goa, Paris) and pick it to see all its tourist places |
| Explore the world | 23 destinations (Hyderabad, Warangal, Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Goa, Kerala, Jaipur, Agra, Ladakh, Varanasi, Bali, Maldives, Singapore, Tokyo, Dubai, Paris, London, Santorini, Swiss Alps, New York), each with its must-see places. Tap places to build a plan (saved on your device), then use the "Book your trip" panel on that page: choose flight / train / bus, your starting city, a date, and search |
| Place search | Search bar at the top of every page (or press `/`). Finds cities, countries and landmarks ("Eiffel", "Charminar", "beach"…). Every destination page also has its own "Search places in …" box and category filters |
| City picker | Type-to-search city fields with photo suggestions. International cities are available for flights; trains and buses run within India |
| Support | Help centre FAQ, cancellation policy, privacy, contact form (footer links all work) |
| Payment (demo) | Card / UPI / net-banking details are validated (try card 4242 4242 4242 4242, any future MM/YY, any 3-digit CVV). Nothing is charged |

### Look & animation
- **Real photo backgrounds** (beaches, Kerala backwaters, forests, mountain lakes, planes, trains, coaches, road trips) that crossfade every 7 seconds with a slow cinematic zoom and pan, drifting sunlight, floating light particles and film grain. **Each page has its own set**: Flights show planes and clouds, Trains show railways, Buses show highways, and Car Rental shows road trips.
- On the home page, use the arrows or dots under the search box to step through the photos.
- **Opening animation:** "GlobeX" with a spinning Earth as the **o**, which zooms into the live 3D globe. Click or press Skip to jump in.
- Ocean colour theme: teal, sky blue and sand gold.
- Every button is animated (magnetic pull, shine sweep, ripple, glow), with 3D tilt cards and smooth page transitions.
- Fully responsive, with touch-friendly seat maps and filters on phones.
- **Smooth on phones:** a lite mode switches on automatically on phones, tablets and slower computers. It keeps the photos, slides and button animations, but turns off live blur, film grain, particles and parallax, and loads smaller photos. In a test simulating a mid-range phone, home-page scrolling went from ~33 fps to ~55 fps. To force a mode, run `localStorage.tripnova_perf = 'lite'` or `'full'` in the browser console and reload.
- The opening animation plays once per visit.

### Use your own photos or a video
- **Video background:** save any `.mp4` as `client/public/media/background.mp4`. It plays behind every page automatically (muted, looped), and the photos are used as the fallback. Free travel videos are available on pexels.com/videos and mixkit.co.
- **Different photos:** edit `client/src/backgrounds.js`. Swap any Unsplash photo ID, or add `src: '/media/your-photo.jpg'` to use a local file.
- `npm run setup` downloads all ~130 photos into `client/public/media/photos/`, so they load fast and also work offline. Run `npm run photos` any time to fetch them again. If a photo can't be downloaded, it streams from Unsplash instead; if you're fully offline, a soft animated gradient is shown.

---

## 📁 Structure

```
globex/
├── package.json            ← root scripts (setup / dev / build / start)
├── server/
│   ├── index.js            ← Express app
│   ├── data.js             ← cities, cars, deterministic trip generator
│   ├── db.js               ← JSON-file database helper
│   ├── auth.js             ← JWT helpers + middleware
│   └── routes/             ← auth.js, catalog.js, bookings.js
└── client/
    ├── vite.config.js      ← proxies /api → localhost:5000
    └── src/
        ├── App.jsx, main.jsx, api.js, styles.css
        ├── context/        ← AuthContext, ToastContext
        ├── components/     ← Button, AnimatedBackground, SearchWidget, TripCard, BookingModal, CarCard …
        └── pages/          ← Home, Search, Cars, Bookings, Auth, NotFound
```

## 🔌 API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | `{ name, email, password, phone? }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/cities` | – | City list |
| GET | `/api/search?type=flight&from=HYD&to=DEL&date=2026-12-01` | – | Trips (`flight`/`train`/`bus`) |
| GET | `/api/trips/:id/seats?class=Economy` | – | Seat map + taken seats |
| GET | `/api/destinations?region=Europe&q=beach` | – | Destination list |
| GET | `/api/destinations/:slug` | – | Destination + places to visit |
| GET | `/api/places/search?q=eiffel` | – | Search cities and landmarks |
| GET | `/api/world/countries` | – | All 250 countries |
| GET | `/api/world/guide?title=Kyoto` | – | Places to visit, cities, regions and photos for any destination |
| GET | `/api/world/search?q=kyo` | – | Countries + destinations worldwide |
| POST | `/api/world/bookable` | – | Makes any city with coordinates bookable for flights |
| GET | `/api/cars?type=SUV` | – | Rental cars |
| GET | `/api/bookings` | ✔ | My bookings |
| POST | `/api/bookings` | ✔ | `{ kind: 'transport', tripId, className, passengers[{name, age, seat}] }` or `{ kind: 'car', carId, pickupDate, returnDate, location, withDriver }` |
| PATCH | `/api/bookings/:id/cancel` | ✔ | Cancel + refund |

Prices are always recalculated on the server, so the browser can't change them.

## 🛠 Customising
- **Colours:** edit the `:root` variables at the top of `client/src/styles.css`. The scene colours are the `[data-mood='sunset']` and `[data-mood='night']` blocks
- **Opening animation:** `client/src/components/Intro.jsx` (change `ZOOM_AT` / `ZOOM_MS` to make it longer or shorter)
- **Cities / cars / operators:** edit `server/data.js`
- **JWT secret:** set the `JWT_SECRET` environment variable for anything beyond local use
- **Reset data:** delete `server/data/db.json`

> ⚠️ This is a demo. Trips are generated, and payments are simulated, so no money is charged.

## 🌍 About the world data
- Country list: the `world-countries` package (works offline).
- Tourist places: fetched live from Wikivoyage by **your server** the first time you open a place, then cached. An internet connection is needed for places you haven't opened before.
- Big cities such as Paris or London keep their sights in district pages, so the app automatically collects them from up to 6 districts.
- If Wikimedia limits requests from your server (error 429), the app switches automatically: your **browser** loads the guide directly from Wikivoyage, and the server saves it so later visits are instant. To identify your app politely to Wikimedia, you can start the server with your email: `WIKI_CONTACT=you@example.com npm run dev` (Windows PowerShell: `$env:WIKI_CONTACT="you@example.com"; npm run dev`).
- Any city you open can be booked as a flight destination. The app saves it in `server/data/world-cities.json`.
- To test without internet: `cd server && node --import ./test/fake-fetch.mjs index.js` (uses sample pages from `server/test/fixtures`).

## 🌍 Home page
- **Opening animation:** on a starry sky, "GLOBEX" decodes letter by letter, the tagline appears, and it fades into the home page.
- **Landing:** top bar (logo · Explore / Flights / Trains / Buses / Car Rental · 🔍 search · day/night · notifications · account), the turning Earth with the Moon and stars, "Explore the World — Discover. Plan. Travel.", the **Scroll down with your fingers** label, quick chips (Popular · Hyderabad · Goa · Delhi · Jaipur · Kerala · More) and **Descend to discover**.
- **🔍 Search (top bar):** a small dark field with places listed right under it; pick one and the globe opens and flies there.
- **Day / night:** the moon/sun button shows a preview of both looks; pick one to switch. Night (stars & Moon) is the default for everyone; day shows a blue sky with sun and clouds.
- **Open the globe:** when you are already at the top, pull down (fingers moving down on a touchpad / phone, or the mouse wheel up). The options slide down at the speed of your fingers while the Earth glides to the middle and grows; let go past about a quarter and the full globe opens with its place labels (otherwise it springs back). Scrolling back up from lower on the page only brings you to the top — pause, then pull again to open. Clicking the Earth also opens it.
- **Close it:** push up (fingers up / mouse wheel down), Esc, or "Swipe up to go back home" — the options slide back the same way and the page scrolls normally straight away.
- Every other page has **↑ Back to globe** (bottom-right) and the logo to return home.

## 🤖 Globo — the AI assistant
A little 3D robot sits at the bottom-left of every page (it floats, blinks and has little twinkles around it). Click it to chat:
- Ask things like *"How do I book a flight?"*, *"Choose my seat"*, *"Rent a car"*, *"Suggest a beach trip"*, *"Tell me about Goa"* or *"How does the 3D globe work?"*. Answers come with buttons that take you straight to the right page.
- **Works out of the box** with a built-in travel guide (no internet or key needed).
- **Optional real AI answers:** copy `server/.env.example` to `server/.env` and put your Anthropic API key after `ANTHROPIC_API_KEY=`, then restart `npm run dev`. The bot then answers any question with Claude, and still shows the shortcut buttons. Never commit your `.env` file.

### Performance note
The 3D globe is created once and kept alive (paused) while you're on other pages, so the **Home** button brings it back instantly — no reloading.
