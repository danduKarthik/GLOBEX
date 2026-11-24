// Famous destinations around the world + the places to visit inside each one.
// Photos: free Unsplash licence (IDs only — the client builds the CDN URL).
// `airport` links a destination to a bookable city code in data.js.

const spot = (id, name, type, desc, hours, photo = null, cost = 'Free') => ({ id, name, type, desc, hours, photo, cost });

export const DESTINATIONS = [
  // ---------------- India ----------------
  {
    slug: 'goa', name: 'Goa', country: 'India', region: 'India', airport: 'GOI',
    tagline: 'Palm-fringed beaches & sunset shacks',
    about: 'India\'s favourite coastline: golden beaches lined with coconut palms, beach shacks, Portuguese-era churches and lazy sunsets over the Arabian Sea.',
    bestTime: 'Nov – Feb', days: '4–5 days', tags: ['Beaches', 'Nightlife', 'Food'],
    cover: '1512343879784-a960bf40e7f2',
    gallery: ['1582972236019-ea4af5ffe587', '1625505826533-5c80aca7d157', '1581892197913-fd2e407e698a'],
    spots: [
      spot('south-beaches', 'South Goa beaches', 'Beach', 'Quiet crescent bays with soft sand and swaying palms — perfect for a slow day.', 4, '1582972236019-ea4af5ffe587'),
      spot('beach-shacks', 'Beach shacks & sunbeds', 'Food', 'Fresh seafood, cold drinks and loungers right on the sand.', 3, '1560179406-1c6c60e0dc76', '₹₹'),
      spot('sunset-point', 'Sunset among the palms', 'Nature', 'Watch the sun drop into the Arabian Sea framed by coconut palms.', 1.5, '1625505826533-5c80aca7d157'),
      spot('old-goa', 'Old Goa churches', 'Culture', 'Whitewashed 16th-century churches from the Portuguese era.', 2, '1661157092769-48a9ab57a4fd'),
      spot('portuguese-houses', 'Portuguese-era houses', 'Culture', 'Wander lanes of colourful heritage homes and tiny cafés.', 2, '1587922546307-776227941871'),
      spot('cliff-views', 'Clifftop sea views', 'Nature', 'Hilltop viewpoints over the coastline and fishing boats.', 1.5, '1652820330085-82a0c2b88d78'),
    ],
  },
  {
    slug: 'kerala', name: 'Kerala', country: 'India', region: 'India', airport: 'COK',
    tagline: 'Backwaters, houseboats & tea hills',
    about: 'God\'s Own Country: glide through palm-lined backwaters on a houseboat, then climb into misty tea estates in Munnar.',
    bestTime: 'Sep – Mar', days: '5–6 days', tags: ['Nature', 'Backwaters', 'Relaxing'],
    cover: '1593693411515-c20261bcad6e',
    gallery: ['1602216056096-3b40cc0c9944', '1766671966028-618f17c3c51f', '1590050752117-238cb0fb12b1'],
    spots: [
      spot('houseboat', 'Alappuzha houseboat cruise', 'Nature', 'Overnight on a traditional kettuvallam through quiet backwater villages.', 8, '1593693411515-c20261bcad6e', '₹₹₹'),
      spot('backwater-canoe', 'Backwater canoe ride', 'Adventure', 'Paddle narrow canals under palm canopies at sunrise.', 2, '1602216056096-3b40cc0c9944', '₹'),
      spot('munnar-tea', 'Munnar tea estates', 'Nature', 'Rolling emerald tea gardens and cool mountain air.', 5, '1766671966028-618f17c3c51f'),
      spot('tea-road', 'Scenic tea-estate drive', 'Nature', 'Winding hill roads through plantations at golden hour.', 2, '1627370778723-4d26700cd972'),
      spot('backwater-sunset', 'Backwater sunset', 'Nature', 'Wooden boats silhouetted against an orange sky.', 1.5, '1590050752117-238cb0fb12b1'),
      spot('kathakali', 'Kathakali performance', 'Culture', 'Kerala\'s classical dance-drama with elaborate make-up.', 1.5, '1597735881932-d9664c9bbcea', '₹'),
    ],
  },
  {
    slug: 'jaipur', name: 'Jaipur', country: 'India', region: 'India', airport: 'JAI',
    tagline: 'The Pink City of palaces & forts',
    about: 'Rajasthan\'s royal capital — honeycomb palaces, hilltop forts, bustling bazaars and lakes that glow at dusk.',
    bestTime: 'Oct – Mar', days: '2–3 days', tags: ['Heritage', 'Shopping', 'Forts'],
    cover: '1477587458883-47145ed94245',
    gallery: ['1524230507669-5ff97982bb5e', '1599661046289-e31897846e41', '1706961121783-4ae6c933983a'],
    spots: [
      spot('hawa-mahal', 'Hawa Mahal', 'Landmark', 'The iconic "Palace of Winds" with 953 latticed windows.', 1, '1524230507669-5ff97982bb5e', '₹'),
      spot('amber-fort', 'Amber Fort', 'Landmark', 'A sprawling hilltop fort of sandstone ramparts and mirror halls.', 3, '1599661046289-e31897846e41', '₹'),
      spot('jal-mahal', 'Man Sagar Lake & Jal Mahal', 'Nature', 'A palace that seems to float in the middle of the lake.', 1, '1477586957327-847a0f3f4fe3'),
      spot('painted-gates', 'Painted gateways', 'Culture', 'Bright, intricately painted arches perfect for photos.', 1, '1772522255879-d3e23227cd5b'),
      spot('city-palace', 'City Palace gates', 'Culture', 'Ornate brass doors and courtyards of the royal residence.', 2, '1524228529766-4d7fe5dc55ca', '₹'),
      spot('bazaars', 'Johari & Bapu bazaars', 'Shopping', 'Gemstones, block-print textiles and street food.', 2.5, '1769122620093-82fb8a5351b0', '₹₹'),
    ],
  },
  {
    slug: 'agra', name: 'Agra', country: 'India', region: 'India', airport: 'AGR',
    tagline: 'Home of the Taj Mahal',
    about: 'The Mughal city on the Yamuna — see the Taj Mahal at sunrise, explore red-sandstone forts and taste famous Agra petha.',
    bestTime: 'Oct – Mar', days: '1–2 days', tags: ['Heritage', 'Wonder of the World'],
    cover: '1564507592333-c60657eea523',
    gallery: ['1548013146-72479768bada', '1585135497273-1a86b09fe70e'],
    spots: [
      spot('taj-mahal', 'Taj Mahal', 'Landmark', 'The white-marble wonder — go at sunrise for soft light and fewer crowds.', 3, '1548013146-72479768bada', '₹₹'),
      spot('taj-sunset', 'Taj sunset view (Mehtab Bagh)', 'Nature', 'Gardens across the river with a framed view of the Taj at dusk.', 1.5, '1585135497273-1a86b09fe70e', '₹'),
      spot('agra-fort', 'Agra Fort', 'Landmark', 'A walled red-sandstone fort and palace complex of the Mughals.', 2.5, null, '₹'),
      spot('fatehpur-sikri', 'Fatehpur Sikri', 'Culture', 'An abandoned Mughal capital an hour from Agra.', 3, null, '₹'),
      spot('kinari-bazaar', 'Kinari Bazaar', 'Shopping', 'Marble inlay souvenirs, sweets and street snacks.', 1.5, null, '₹'),
    ],
  },
  {
    slug: 'ladakh', name: 'Ladakh', country: 'India', region: 'India', airport: 'IXL',
    tagline: 'High-altitude lakes & mountain passes',
    about: 'A dramatic cold desert in the Himalayas — turquoise lakes, monasteries on cliffs and some of the highest motorable roads on Earth.',
    bestTime: 'Jun – Sep', days: '6–8 days', tags: ['Adventure', 'Mountains', 'Road trips'],
    cover: '1619837374214-f5b9eb80876d',
    gallery: ['1773575133321-92249861395c', '1768728410263-9fa72c338a90', '1617824077360-7a77db40aae1'],
    spots: [
      spot('pangong', 'Pangong Lake', 'Nature', 'A vast high-altitude lake that shifts between blue and turquoise.', 6, '1773575133321-92249861395c'),
      spot('sangam', 'Indus–Zanskar Sangam', 'Nature', 'Where two coloured rivers meet beneath bare mountains.', 1.5, '1619837374214-f5b9eb80876d'),
      spot('leh-town', 'Leh town & palace', 'Culture', 'Old town lanes below snow peaks and a 17th-century palace.', 3, '1768728410263-9fa72c338a90'),
      spot('khardung-la', 'Khardung La bike ride', 'Adventure', 'Ride one of the highest motorable passes in the world.', 5, '1581793745862-99fde7fa73d2', '₹₹'),
      spot('stupas', 'Hilltop stupas & monasteries', 'Culture', 'White stupas and prayer flags with panoramic views.', 2, '1760835252169-8e773111460b'),
    ],
  },
  {
    slug: 'varanasi', name: 'Varanasi', country: 'India', region: 'India', airport: 'VNS',
    tagline: 'Ghats, boats & the Ganga Aarti',
    about: 'One of the oldest living cities in the world — stone ghats on the Ganges, dawn boat rides and the mesmerising evening aarti.',
    bestTime: 'Oct – Mar', days: '2–3 days', tags: ['Spiritual', 'Culture', 'River'],
    cover: '1561359313-0639aad49ca6',
    gallery: ['1561361058-c24cecae35ca', '1627894483216-2138af692e32'],
    spots: [
      spot('ganga-aarti', 'Ganga Aarti at Dashashwamedh', 'Culture', 'Fire, chants and bells every evening on the river steps.', 1.5, '1627894483216-2138af692e32'),
      spot('sunrise-boat', 'Sunrise boat ride', 'Nature', 'Row past the ghats as the city wakes up.', 1.5, '1596097825168-c9b773f404ff', '₹'),
      spot('ghats-walk', 'Walk the ghats', 'Culture', 'Stroll the 80+ riverfront steps from Assi to Manikarnika.', 2.5, '1561361058-c24cecae35ca'),
      spot('sarnath', 'Sarnath', 'Culture', 'Where the Buddha gave his first sermon — 30 minutes away.', 3, null, '₹'),
    ],
  },
  {
    slug: 'hyderabad', name: 'Hyderabad', country: 'India', region: 'India', airport: 'HYD',
    tagline: 'Charminar, biryani & pearls',
    about: 'The City of Pearls mixes Qutb Shahi monuments, buzzing bazaars, a lakeside Buddha and the best biryani you will ever eat.',
    bestTime: 'Oct – Feb', days: '2–3 days', tags: ['Food', 'Heritage', 'Shopping'],
    cover: '1696941515998-d83f24967aca',
    gallery: ['1787043940937-4c6f89b92bdf', '1601619933635-023753974a65'],
    spots: [
      spot('charminar', 'Charminar', 'Landmark', 'The 1591 four-minaret monument at the heart of the Old City.', 1.5, '1787043940937-4c6f89b92bdf', '₹'),
      spot('laad-bazaar', 'Laad Bazaar', 'Shopping', 'Lac bangles, pearls and attar in the lanes around Charminar.', 2, '1787044050216-19d30c0aeaf5', '₹₹'),
      spot('hussain-sagar', 'Hussain Sagar Buddha', 'Nature', 'A giant monolithic Buddha in the middle of the lake.', 1.5, '1712422813106-dfb845a8a7ed', '₹'),
      spot('old-city-mosques', 'Old City mosques', 'Culture', 'Grand Qutb Shahi-era architecture near Charminar.', 1, '1657981630164-769503f3a9a8'),
      spot('golconda', 'Golconda Fort', 'Landmark', 'Clap at the gate and hear it echo at the hilltop citadel.', 3, null, '₹'),
      spot('biryani-trail', 'Hyderabadi biryani trail', 'Food', 'Dum biryani, haleem and Irani chai with Osmania biscuits.', 2, null, '₹₹'),
    ],
  },
  {
    slug: 'warangal', name: 'Warangal', country: 'India', region: 'India', airport: 'WGL',
    tagline: 'Kakatiya temples, forts & lakes',
    about: 'The old Kakatiya capital of Telangana — intricately carved stone temples, the ruins of a great fort, and calm lakes ringed by forest.',
    bestTime: 'Oct – Feb', days: '1–2 days', tags: ['Heritage', 'Temples', 'Lakes'],
    cover: '1714931150627-6240fddba6e4',
    gallery: ['1673702558247-493f3c468774', '1714931149787-803cde05f313', '1580919388081-960c283bb72d'],
    spots: [
      spot('warangal-fort', 'Warangal Fort', 'Landmark', 'Ruins of the Kakatiya citadel with its famous carved stone gateways.', 2, '1673702558247-493f3c468774'),
      spot('thousand-pillar', 'Thousand Pillar Temple', 'Culture', 'A star-shaped 12th-century temple full of finely carved pillars.', 1.5, '1714931150627-6240fddba6e4'),
      spot('ramappa', 'Ramappa Temple', 'Culture', 'UNESCO World Heritage temple about 70 km away, famous for its sculptures.', 4, '1714931149787-803cde05f313'),
      spot('bhadrakali', 'Bhadrakali Temple & Lake', 'Culture', 'Hilltop temple overlooking a peaceful lake.', 1.5, null),
      spot('laknavaram', 'Laknavaram Lake', 'Nature', 'A forest lake with a hanging bridge and little islands.', 4, null, '₹'),
      spot('kakatiya-garden', 'Kakatiya Musical Garden', 'Nature', 'Evening gardens with a musical fountain.', 1.5, '1580919388081-960c283bb72d', '₹'),
    ],
  },
  {
    slug: 'delhi', name: 'New Delhi', country: 'India', region: 'India', airport: 'DEL',
    tagline: 'Mughal tombs, grand avenues & street food',
    about: 'India\'s capital mixes Mughal monuments, broad colonial avenues and the chaotic, delicious lanes of Old Delhi.',
    bestTime: 'Oct – Mar', days: '2–3 days', tags: ['Heritage', 'Food', 'City'],
    cover: '1587474260584-136574528ed5',
    gallery: ['1592639296346-560c37a0f711', '1575566668200-7dcaa7b2cf28'],
    spots: [
      spot('india-gate', 'India Gate', 'Landmark', 'The war memorial arch, beautiful at sunset and lit at night.', 1, '1587474260584-136574528ed5'),
      spot('kartavya-path', 'Kartavya Path & Rashtrapati Bhavan', 'Landmark', 'The grand ceremonial avenue up to the President\'s House.', 1.5, '1592639296346-560c37a0f711'),
      spot('qutub-minar', 'Qutub Minar', 'Landmark', 'A 73 m sandstone victory tower from the 12th century.', 1.5, '1598977054780-2dc700fdc9d3', '₹'),
      spot('safdarjung', 'Safdarjung\'s Tomb', 'Culture', 'A quiet Mughal garden tomb — the last of its kind.', 1, '1575566668200-7dcaa7b2cf28', '₹'),
      spot('humayun', 'Humayun\'s Tomb', 'Culture', 'The garden tomb that inspired the Taj Mahal.', 1.5, null, '₹'),
      spot('chandni-chowk', 'Chandni Chowk & Old Delhi', 'Food', 'Rickshaw rides, spice markets and legendary street food.', 3, '1624858020896-4a558c5d7042', '₹'),
      spot('red-fort', 'Red Fort', 'Landmark', 'The red-sandstone Mughal fort where the flag is hoisted each Independence Day.', 2, null, '₹'),
    ],
  },
  {
    slug: 'mumbai', name: 'Mumbai', country: 'India', region: 'India', airport: 'BOM',
    tagline: 'Sea breeze, Bollywood & the Gateway of India',
    about: 'The city of dreams — sea-facing promenades, Victorian landmarks, Bollywood and the best vada pav anywhere.',
    bestTime: 'Nov – Feb', days: '2–3 days', tags: ['City', 'Food', 'Sea'],
    cover: '1595658658481-d53d3f999875',
    gallery: ['1569758267239-d08deb78bb1a', '1529253355930-ddbe423a2ac7'],
    spots: [
      spot('gateway', 'Gateway of India', 'Landmark', 'The 1924 arch on the harbour, next to the Taj Mahal Palace hotel.', 1, '1529253355930-ddbe423a2ac7'),
      spot('sea-link', 'Bandra–Worli Sea Link', 'Landmark', 'Drive the cable-stayed bridge over the Arabian Sea.', 0.5, '1569758267239-d08deb78bb1a'),
      spot('marine-drive', 'Marine Drive', 'City', 'The "Queen\'s Necklace" seafront promenade — best at sunset.', 1.5, '1567157577867-05ccb1388e66'),
      spot('heritage-mile', 'Victorian Gothic landmarks', 'Culture', 'CSMT station and the BMC building in the Fort heritage district.', 1.5, '1566552881560-0be862a7c445'),
      spot('elephanta', 'Elephanta Caves', 'Culture', 'Ferry to an island of rock-cut cave temples.', 5, null, '₹₹'),
      spot('juhu', 'Juhu Beach street food', 'Food', 'Pav bhaji, bhel puri and sunset on the sand.', 2, null, '₹'),
    ],
  },
  {
    slug: 'bengaluru', name: 'Bengaluru', country: 'India', region: 'India', airport: 'BLR',
    tagline: 'Garden city, palaces & cafés',
    about: 'India\'s tech capital is also a city of gardens, a Tudor-style palace, buzzing markets and a great café and brewery scene.',
    bestTime: 'Oct – Feb', days: '2 days', tags: ['City', 'Gardens', 'Food'],
    cover: '1596176530529-78163a4f7af2',
    gallery: ['1774934879484-542f4102743f', '1771429631954-6b601145d99c'],
    spots: [
      spot('vidhana-soudha', 'Vidhana Soudha', 'Landmark', 'The grand granite legislature building, lit up on Sundays.', 0.5, '1774934879484-542f4102743f'),
      spot('bangalore-palace', 'Bangalore Palace', 'Landmark', 'A Tudor-style palace with turrets and ivy-covered walls.', 2, '1771429631954-6b601145d99c', '₹₹'),
      spot('lalbagh', 'Lalbagh Botanical Garden', 'Nature', 'Century-old gardens with a glasshouse and flower shows.', 2, '1694886322255-9cb789e8a385', '₹'),
      spot('cubbon', 'Cubbon Park', 'Nature', 'Shady lawns and heritage buildings in the heart of the city.', 1.5, '1565018054866-968e244671af'),
      spot('old-markets', 'Old covered markets', 'Shopping', 'Flowers, fruit and spices under ornate market halls.', 1.5, '1766098818213-32eae68f4e7a', '₹'),
      spot('nandi-hills', 'Nandi Hills sunrise', 'Adventure', 'Drive up before dawn to watch the sun rise above the clouds.', 5, null, '₹'),
    ],
  },
  {
    slug: 'chennai', name: 'Chennai', country: 'India', region: 'India', airport: 'MAA',
    tagline: 'Temples, Marina Beach & filter coffee',
    about: 'The gateway to Tamil Nadu — towering temple gopurams, one of the world\'s longest city beaches and classic South Indian food.',
    bestTime: 'Nov – Feb', days: '2–3 days', tags: ['Temples', 'Beaches', 'Food'],
    cover: '1582510003544-4d00b7f74220',
    gallery: ['1570553305204-149983b3d081', '1563715493579-e0b3e0493b60'],
    spots: [
      spot('gopurams', 'Mylapore temple gopurams', 'Culture', 'Colourful sculpted temple towers in the old quarter.', 1.5, '1582510003544-4d00b7f74220'),
      spot('marina', 'Marina Beach', 'Beach', 'A 13 km urban beach — come at sunrise or for evening snacks.', 1.5, '1570553305204-149983b3d081'),
      spot('mahabalipuram', 'Mahabalipuram stone temples', 'Culture', 'UNESCO-listed rock-cut temples by the sea, an hour south.', 5, '1563715493579-e0b3e0493b60', '₹'),
      spot('red-brick', 'Red-brick colonial landmarks', 'Culture', 'Indo-Saracenic heritage buildings around Central station.', 1, '1629466800880-5db24451ea18'),
      spot('fishing-boats', 'Fishing village boats', 'Beach', 'Colourful boats pulled up on the sand at dawn.', 1, '1644852037516-95c8fba481f9'),
      spot('filter-coffee', 'Filter coffee & tiffin trail', 'Food', 'Dosa, idli, vada and a strong filter coffee.', 1.5, null, '₹'),
    ],
  },
  {
    slug: 'kolkata', name: 'Kolkata', country: 'India', region: 'India', airport: 'CCU',
    tagline: 'City of joy, trams & the Victoria Memorial',
    about: 'Grand colonial architecture, yellow taxis, old trams, the Hooghly river and India\'s biggest festivals.',
    bestTime: 'Oct – Feb', days: '2–3 days', tags: ['Heritage', 'Food', 'Culture'],
    cover: '1496372412473-e8548ffd82bc',
    gallery: ['1571679654681-ba01b9e1e117', '1626198226928-617fc6c6203e'],
    spots: [
      spot('victoria-memorial', 'Victoria Memorial', 'Landmark', 'White-marble museum and gardens, reflected in the pond at dusk.', 2, '1496372412473-e8548ffd82bc', '₹'),
      spot('hooghly-boat', 'Hooghly river boat ride', 'Nature', 'Row under the great bridges at golden hour.', 1, '1571679654681-ba01b9e1e117', '₹'),
      spot('trams', 'Heritage tram ride', 'City', 'Ride Asia\'s oldest operating electric tram network.', 1, '1626198226928-617fc6c6203e', '₹'),
      spot('bridges-night', 'Bridges lit at night', 'City', 'Howrah and Vidyasagar Setu glowing over the river.', 1, '1589041127168-9b1915731dc3'),
      spot('festivals', 'Festivals & colours', 'Culture', 'Durga Puja, Holi and street celebrations across the city.', 3, '1773555671444-1e89df83e672'),
      spot('sweets', 'Rosogolla & street-food trail', 'Food', 'Kathi rolls, puchka and Bengali sweets.', 2, null, '₹'),
    ],
  },
  // ---------------- Asia ----------------
  {
    slug: 'bali', name: 'Bali', country: 'Indonesia', region: 'Asia', airport: 'DPS',
    tagline: 'Temples, rice terraces & cliff beaches',
    about: 'The Island of the Gods: lake temples, emerald rice terraces, dramatic clifftop beaches and a relaxed, spiritual vibe.',
    bestTime: 'Apr – Oct', days: '6–7 days', tags: ['Beaches', 'Temples', 'Nature'],
    cover: '1537996194471-e657df975ab4',
    gallery: ['1555400038-63f5ba517a47', '1577717903315-1691ae25ab3f', '1544644181-1484b3fdfc62'],
    spots: [
      spot('ulun-danu', 'Pura Ulun Danu Bratan', 'Landmark', 'A multi-tiered water temple on a misty mountain lake.', 2, '1544644181-1484b3fdfc62', '₹'),
      spot('tegallalang', 'Tegallalang rice terraces', 'Nature', 'Layered green terraces under coconut palms near Ubud.', 2, '1555400038-63f5ba517a47', '₹'),
      spot('lempuyang', 'Lempuyang "Gates of Heaven"', 'Culture', 'Split stone gates framing Mount Agung.', 3, '1537953773345-d172ccf13cf1', '₹'),
      spot('kelingking', 'Nusa Penida cliffs', 'Nature', 'The famous T-Rex shaped cliff above turquoise water.', 6, '1577717903315-1691ae25ab3f', '₹₹'),
      spot('diamond-beach', 'Diamond Beach', 'Beach', 'White sand and turquoise water below limestone cliffs.', 3, '1573790387438-4da905039392'),
      spot('tanah-lot', 'Sea temple at sunset', 'Culture', 'A temple perched on a rock arch as waves crash below.', 1.5, '1766854269605-bd06cb72217e', '₹'),
    ],
  },
  {
    slug: 'maldives', name: 'Maldives', country: 'Maldives', region: 'Islands', airport: 'MLE',
    tagline: 'Overwater villas & turquoise lagoons',
    about: '1,000+ coral islands in the Indian Ocean — glass-clear lagoons, overwater bungalows, sandbanks and world-class snorkelling.',
    bestTime: 'Nov – Apr', days: '4–5 days', tags: ['Islands', 'Luxury', 'Honeymoon'],
    cover: '1514282401047-d79a71a590e8',
    gallery: ['1595184979141-090792f6b578', '1759676015346-a2ea5f4a3caa', '1573843981267-be1999ff37cd'],
    spots: [
      spot('overwater', 'Overwater villa stay', 'Beach', 'Wake up above the lagoon and step straight into the sea.', 24, '1595184979141-090792f6b578', '₹₹₹'),
      spot('sandbank', 'Sandbank picnic', 'Beach', 'A private strip of white sand in the middle of the ocean.', 3, '1762961881563-66852e1e4527', '₹₹'),
      spot('snorkel', 'Lagoon snorkelling', 'Adventure', 'Reef fish, turtles and rays in crystal-clear shallows.', 2, '1759676015346-a2ea5f4a3caa', '₹₹'),
      spot('seaplane', 'Seaplane transfer', 'Adventure', 'See the atolls from above on a scenic seaplane hop.', 1, '1512100356356-de1b84283e18', '₹₹₹'),
      spot('dhoni', 'Sunset dhoni cruise', 'Nature', 'Sail a traditional boat at golden hour, dolphins likely.', 2, '1578922746465-3a80a228f223', '₹₹'),
    ],
  },
  {
    slug: 'singapore', name: 'Singapore', country: 'Singapore', region: 'Asia', airport: 'SIN',
    tagline: 'Garden city of the future',
    about: 'A spotless city-state where giant Supertrees, an indoor waterfall and a skyline of icons meet hawker-centre food.',
    bestTime: 'Feb – Apr', days: '3–4 days', tags: ['City', 'Family', 'Food'],
    cover: '1525625293386-3f8f99389edd',
    gallery: ['1508964942454-1a56651d54ac', '1765886177901-dc0660c078b7'],
    spots: [
      spot('gardens-bay', 'Gardens by the Bay', 'Nature', 'Walk the skyway between the glowing Supertrees.', 3, '1508964942454-1a56651d54ac', '₹₹'),
      spot('mbs', 'Marina Bay Sands', 'Landmark', 'The iconic three-tower hotel with a sky-high observation deck.', 2, '1574227492706-f65b24c3688a', '₹₹'),
      spot('jewel', 'Jewel Changi waterfall', 'Landmark', 'The world\'s tallest indoor waterfall inside the airport.', 1.5, '1765886177901-dc0660c078b7'),
      spot('merlion', 'Merlion Park', 'Landmark', 'Singapore\'s half-lion, half-fish mascot on the bay.', 0.5, '1565967511849-76a60a516170'),
      spot('artscience', 'ArtScience Museum', 'Culture', 'Lotus-shaped museum with immersive digital art.', 2, '1542114740389-9b46fb1e5be7', '₹₹'),
    ],
  },
  {
    slug: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'Asia', airport: 'HND',
    tagline: 'Neon streets & ancient temples',
    about: 'Neon-lit crossings, quiet shrines, world-class food and a day trip to Mount Fuji — Tokyo is endlessly surprising.',
    bestTime: 'Mar – May, Oct – Nov', days: '5–6 days', tags: ['City', 'Food', 'Culture'],
    cover: '1540959733332-eab4deabeeaf',
    gallery: ['1542051841857-5f90071e7989', '1513407030348-c983a97b98d8', '1526481280693-3bfa7568e0f3'],
    spots: [
      spot('shibuya', 'Shibuya Crossing', 'Landmark', 'The world\'s busiest scramble crossing under neon screens.', 1, '1542051841857-5f90071e7989'),
      spot('tokyo-tower', 'Tokyo Tower', 'Landmark', 'The red-and-white tower with city views at dusk.', 1.5, '1513407030348-c983a97b98d8', '₹₹'),
      spot('shinjuku', 'Shinjuku nights', 'Food', 'Tiny izakaya alleys, ramen and skyscraper lights.', 3, '1503899036084-c55cdd92da26', '₹₹'),
      spot('pagodas', 'Temples & pagodas', 'Culture', 'Peaceful temple grounds hidden among the trees.', 2, '1545569341-9eb8b30979d9'),
      spot('fuji', 'Mount Fuji & Chureito Pagoda', 'Nature', 'Day trip for the classic pagoda-and-Fuji view.', 9, '1526481280693-3bfa7568e0f3', '₹₹'),
    ],
  },
  // ---------------- Middle East ----------------
  {
    slug: 'dubai', name: 'Dubai', country: 'UAE', region: 'Middle East', airport: 'DXB',
    tagline: 'Skyscrapers, desert & the sea',
    about: 'Record-breaking towers, man-made islands, golden desert dunes and beaches — all within a short drive.',
    bestTime: 'Nov – Mar', days: '4–5 days', tags: ['City', 'Shopping', 'Luxury'],
    cover: '1512453979798-5ea266f8880c',
    gallery: ['1518684079-3c830dcef090', '1786991810391-e28ee367c3aa'],
    spots: [
      spot('burj-khalifa', 'Burj Khalifa', 'Landmark', 'The tallest building on Earth — go up at sunset.', 2, '1634007626524-f47fa37810a7', '₹₹₹'),
      spot('burj-al-arab', 'Burj Al Arab', 'Landmark', 'The sail-shaped hotel on its own island.', 1, '1518684079-3c830dcef090'),
      spot('palm', 'Palm Jumeirah', 'Beach', 'The palm-shaped island with beaches and resorts.', 3, '1786991810391-e28ee367c3aa', '₹₹'),
      spot('dubai-frame', 'Dubai Frame', 'Landmark', 'A giant golden picture frame between old and new Dubai.', 1.5, '1628859017536-c2f1d69f3c84', '₹₹'),
      spot('marina', 'Dubai Marina walk', 'City', 'Waterfront promenade lined with towers and cafés.', 2, '1580674684081-7617fbf3d745'),
      spot('desert-safari', 'Desert safari', 'Adventure', 'Dune bashing, camel rides and a BBQ dinner under the stars.', 6, null, '₹₹₹'),
    ],
  },
  // ---------------- Europe ----------------
  {
    slug: 'paris', name: 'Paris', country: 'France', region: 'Europe', airport: 'CDG',
    tagline: 'The City of Light',
    about: 'Boulevards, cafés and world-famous art — from the Eiffel Tower to the Louvre, Paris is made for wandering.',
    bestTime: 'Apr – Jun, Sep – Oct', days: '4–5 days', tags: ['Romance', 'Art', 'Food'],
    cover: '1502602898657-3e91760cbb34',
    gallery: ['1511739001486-6bfe10ce785f', '1499856871958-5b9627545d1a', '1509439581779-6298f75bf6e5'],
    spots: [
      spot('eiffel', 'Eiffel Tower', 'Landmark', 'Ride to the summit, then picnic on the Champ de Mars.', 2.5, '1511739001486-6bfe10ce785f', '₹₹'),
      spot('arc', 'Arc de Triomphe', 'Landmark', 'Climb to the roof for views down the Champs-Élysées.', 1.5, '1509439581779-6298f75bf6e5', '₹₹'),
      spot('pont-alexandre', 'Pont Alexandre III', 'Landmark', 'Paris\'s most ornate bridge, magical when lit at night.', 0.5, '1499856871958-5b9627545d1a'),
      spot('cafes', 'Parisian cafés', 'Food', 'Croissants and coffee at a classic pavement café.', 1.5, '1772119044027-04e80adeda6b', '₹₹'),
      spot('louvre', 'The Louvre', 'Culture', 'Home of the Mona Lisa and 35,000 works of art.', 4, null, '₹₹'),
      spot('seine', 'Seine riverside stroll', 'City', 'Bookstalls, bridges and riverbank sunsets.', 2, '1503917988258-f87a78e3c995'),
    ],
  },
  {
    slug: 'london', name: 'London', country: 'United Kingdom', region: 'Europe', airport: 'LHR',
    tagline: 'Royal history & riverside icons',
    about: 'Big Ben, Tower Bridge, red buses and world-class museums — many of them free.',
    bestTime: 'May – Sep', days: '4–5 days', tags: ['City', 'History', 'Museums'],
    cover: '1513635269975-59663e0ac1ad',
    gallery: ['1529655683826-aba9b3e77383', '1533929736458-ca588d08c8be'],
    spots: [
      spot('big-ben', 'Big Ben & Westminster', 'Landmark', 'The famous clock tower beside the Houses of Parliament.', 1, '1529655683826-aba9b3e77383'),
      spot('tower-bridge', 'Tower Bridge', 'Landmark', 'Walk the glass floor high above the Thames.', 1.5, '1533929736458-ca588d08c8be', '₹₹'),
      spot('st-pauls', 'St Paul\'s Cathedral', 'Culture', 'Climb the dome for a panorama of the City.', 2, '1506501139174-099022df5260', '₹₹'),
      spot('thames', 'Thames riverside walk', 'City', 'From Westminster to the South Bank\'s street performers.', 2, '1784597141076-7d91a82a733f'),
      spot('red-bus', 'Double-decker bus ride', 'City', 'See the sights from the top deck of a red bus.', 1, '1526129318478-62ed807ebdf9', '₹'),
      spot('british-museum', 'British Museum', 'Culture', 'Free entry to treasures from every continent.', 3, null),
    ],
  },
  {
    slug: 'santorini', name: 'Santorini', country: 'Greece', region: 'Europe', airport: 'JTR',
    tagline: 'Blue domes & caldera sunsets',
    about: 'Whitewashed villages tumble down volcanic cliffs above a sapphire sea, with the most famous sunset in Greece.',
    bestTime: 'May – Oct', days: '3–4 days', tags: ['Islands', 'Romance', 'Views'],
    cover: '1570077188670-e3a8d69ac5ff',
    gallery: ['1580502304784-8985b7eb7260', '1613395877344-13d4a8e0d49e'],
    spots: [
      spot('oia-sunset', 'Oia sunset', 'Nature', 'Golden light on whitewashed houses as the sun sets.', 2, '1580502304784-8985b7eb7260'),
      spot('blue-domes', 'Blue-domed churches', 'Culture', 'The postcard view of blue domes above the Aegean.', 1, '1613395877344-13d4a8e0d49e'),
      spot('caldera-walk', 'Caldera cliff walk', 'Adventure', 'Hike the clifftop trail from Fira to Oia.', 4, '1696519669474-3001c0e2b548'),
      spot('villages', 'Cliffside villages', 'City', 'Lanes of cave houses, cafés and boutiques.', 2.5, '1533105079780-92b9be482077'),
      spot('red-beach', 'Red Beach', 'Beach', 'Dramatic red volcanic cliffs above dark sand.', 2, null),
    ],
  },
  {
    slug: 'swiss-alps', name: 'Swiss Alps', country: 'Switzerland', region: 'Europe', airport: 'ZRH',
    tagline: 'Waterfall valleys & snowy summits',
    about: 'Storybook valleys with waterfalls, cogwheel trains up to glaciers, alpine lakes and wildflower meadows.',
    bestTime: 'Jun – Sep, Dec – Mar', days: '5–7 days', tags: ['Mountains', 'Nature', 'Snow'],
    cover: '1530122037265-a5f1f91d3b99',
    gallery: ['1507039915464-9d829b6d2d78', '1517079810336-d39e72287591'],
    spots: [
      spot('lauterbrunnen', 'Lauterbrunnen valley', 'Nature', 'A valley of 72 waterfalls and wooden chalets.', 3, '1530122037265-a5f1f91d3b99'),
      spot('jungfraujoch', 'Jungfraujoch "Top of Europe"', 'Adventure', 'A cogwheel train to a glacier above the clouds.', 6, '1507039915464-9d829b6d2d78', '₹₹₹'),
      spot('lakes', 'Alpine lakeside villages', 'Nature', 'Mirror-still lakes beneath snowy peaks.', 3, '1517079810336-d39e72287591'),
      spot('meadows', 'Alpine meadows', 'Nature', 'Wildflowers, cowbells and easy hiking trails.', 2, '1530638458177-fcc275860f8b'),
      spot('mountain-roads', 'Scenic mountain drives', 'Adventure', 'Hairpin passes with views at every turn.', 4, '1515179984198-74497483a356', '₹₹'),
    ],
  },
  // ---------------- Americas ----------------
  {
    slug: 'new-york', name: 'New York', country: 'USA', region: 'Americas', airport: 'JFK',
    tagline: 'The city that never sleeps',
    about: 'Skyscraper skylines, Broadway lights, Central Park and food from every corner of the world.',
    bestTime: 'Apr – Jun, Sep – Nov', days: '4–6 days', tags: ['City', 'Shopping', 'Food'],
    cover: '1499092346589-b9b6be3e94b2',
    gallery: ['1496588152823-86ff7695e68f', '1543716091-a840c05249ec'],
    spots: [
      spot('brooklyn-bridge', 'Brooklyn Bridge', 'Landmark', 'Walk across at sunrise for skyline views.', 1, '1496588152823-86ff7695e68f'),
      spot('empire-state', 'Empire State Building', 'Landmark', 'The Art Deco icon with an open-air deck.', 1.5, '1543716091-a840c05249ec', '₹₹₹'),
      spot('times-square', 'Times Square', 'City', 'Giant billboards and Broadway theatres.', 1, '1496442226666-8d4d0e62e6e9'),
      spot('central-park', 'Central Park', 'Nature', 'Rowboats, lawns and 840 acres of green in Manhattan.', 3, '1568515387631-8b650bbcdb90'),
      spot('liberty', 'Statue of Liberty', 'Landmark', 'Ferry to Liberty Island for the classic view.', 4, null, '₹₹'),
    ],
  },
];

const summary = (d) => ({
  slug: d.slug, name: d.name, country: d.country, region: d.region, airport: d.airport,
  tagline: d.tagline, cover: d.cover, tags: d.tags, bestTime: d.bestTime, days: d.days, spotCount: d.spots.length,
});

export const REGIONS = ['India', 'Asia', 'Islands', 'Middle East', 'Europe', 'Americas'];

export function listDestinations({ region, q } = {}) {
  const term = (q || '').trim().toLowerCase();
  return DESTINATIONS
    .filter((d) => !region || region === 'All' || d.region === region)
    .filter((d) => !term || [d.name, d.country, d.tagline, ...d.tags, ...d.spots.map((s) => s.name)].join(' ').toLowerCase().includes(term))
    .map(summary);
}

export const getDestination = (slug) => DESTINATIONS.find((d) => d.slug === slug) || null;

/** Search destinations, countries and individual places inside them. */
export function searchPlaces(q, limit = 12) {
  const term = (q || '').trim().toLowerCase();
  if (term.length < 1) return [];
  const score = (text) => {
    const t = text.toLowerCase();
    if (t.startsWith(term)) return 3;
    if (t.split(/[\s,()&-]+/).some((w) => w.startsWith(term))) return 2;
    return t.includes(term) ? 1 : 0;
  };
  const results = [];
  for (const d of DESTINATIONS) {
    const s = Math.max(score(d.name) * 2, score(d.country), ...d.tags.map(score));
    if (s) results.push({ kind: 'destination', score: s + 1, slug: d.slug, name: d.name, sub: `${d.country} · ${d.tagline}`, cover: d.cover });
    for (const p of d.spots) {
      const ps = Math.max(score(p.name) * 2, score(p.type));
      if (ps) results.push({ kind: 'spot', score: ps, slug: d.slug, spotId: p.id, name: p.name, sub: `${p.type} in ${d.name}, ${d.country}`, cover: p.photo || d.cover });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit).map(({ score: _s, ...r }) => r);
}
