// Photos for each city (used in the city picker suggestions, booking headers
// and the "Explore the world" section). Free Unsplash photos.
import { imageUrl } from './backgrounds';

export const CITY_PHOTOS = {
  HYD: { id: '1696941515998-d83f24967aca', caption: 'Charminar' },
  DEL: { id: '1587474260584-136574528ed5', caption: 'India Gate' },
  BOM: { id: '1569758267239-d08deb78bb1a', caption: 'Bandra–Worli Sea Link' },
  BLR: { id: '1596176530529-78163a4f7af2', caption: 'Bengaluru by night' },
  MAA: { id: '1582510003544-4d00b7f74220', caption: 'Temple gopuram' },
  CCU: { id: '1742325646212-f917ba1feeaa', caption: 'Howrah Bridge' },
  JAI: { id: '1477587458883-47145ed94245', caption: 'Hawa Mahal' },
  AGR: { id: '1564507592333-c60657eea523', caption: 'Taj Mahal' },
  GOI: { id: '1614082242765-7c98ca0f3df3', caption: 'Beach huts & palms' },
  COK: { id: '1593693411515-c20261bcad6e', caption: 'Kerala backwaters' },
  VNS: { id: '1561359313-0639aad49ca6', caption: 'Ghats on the Ganges' },
  IXL: { id: '1619837374214-f5b9eb80876d', caption: 'Indus–Zanskar Sangam' },
  WGL: { id: '1627370778723-4d26700cd972', caption: 'Telangana countryside' },
  PNQ: { id: '1476231682828-37e571bc172f', caption: 'Western Ghats roads' },
  AMD: { id: '1589392764091-2aaa3afe42df', caption: 'Sunset rail line' },
  LKO: { id: '1426086800127-2601510ca027', caption: 'Hills of the north' },
  VTZ: { id: '1507525428034-b723cf961d3e', caption: 'Bay of Bengal coast' },
  IXC: { id: '1559310589-2673bfe16970', caption: 'Gateway to the Himalayas' },
  DXB: { id: '1512453979798-5ea266f8880c', caption: 'Burj Khalifa skyline' },
  SIN: { id: '1525625293386-3f8f99389edd', caption: 'Marina Bay Sands' },
  DPS: { id: '1577717903315-1691ae25ab3f', caption: 'Nusa Penida cliffs' },
  MLE: { id: '1573843981267-be1999ff37cd', caption: 'Overwater villas' },
  CDG: { id: '1511739001486-6bfe10ce785f', caption: 'Eiffel Tower' },
  LHR: { id: '1486299267070-83823f5448dd', caption: 'Big Ben' },
  JTR: { id: '1570077188670-e3a8d69ac5ff', caption: 'Blue domes of Oia' },
  ZRH: { id: '1527668752968-14dc70a27c95', caption: 'Swiss Alpine village' },
  HND: { id: '1526481280693-3bfa7568e0f3', caption: 'Chureito Pagoda & Mt Fuji' },
  JFK: { id: '1496588152823-86ff7695e68f', caption: 'Brooklyn Bridge' },
  SYD: { id: '1506973035872-a4ec16b8e8d9', caption: 'Sydney Opera House' },
};

export const cityPhoto = (code, wide = 'card') => {
  const p = CITY_PHOTOS[code] || CITY_PHOTOS.GOI;
  return imageUrl({ id: p.id }, wide);
};

// Small thumbnail for lists
export const cityThumb = (code) => {
  const p = CITY_PHOTOS[code] || CITY_PHOTOS.GOI;
  return imageUrl({ id: p.id }, 'thumb');
};

// Famous places shown in suggestions + the Explore section
export const POPULAR = ['GOI', 'DEL', 'JAI', 'AGR', 'COK', 'IXL', 'DXB', 'MLE', 'DPS', 'CDG', 'JTR', 'SIN'];

export const EXPLORE = [
  { code: 'MLE', tag: 'Beaches', blurb: 'Overwater villas & turquoise lagoons' },
  { code: 'DPS', tag: 'Beaches', blurb: 'Cliffs, temples & rice terraces' },
  { code: 'JTR', tag: 'Beaches', blurb: 'Whitewashed villages over the Aegean' },
  { code: 'GOI', tag: 'Beaches', blurb: 'Palm-fringed shacks & sunsets' },
  { code: 'ZRH', tag: 'Mountains', blurb: 'Alpine villages & glacier trains' },
  { code: 'IXL', tag: 'Mountains', blurb: 'High passes & turquoise rivers' },
  { code: 'HND', tag: 'Cities', blurb: 'Neon nights & Mt Fuji views' },
  { code: 'CDG', tag: 'Cities', blurb: 'Cafés, art & the Eiffel Tower' },
  { code: 'JFK', tag: 'Cities', blurb: 'Skyline, parks & Broadway' },
  { code: 'LHR', tag: 'Cities', blurb: 'Royal history & the Thames' },
  { code: 'DXB', tag: 'Cities', blurb: 'Desert dunes & record skyscrapers' },
  { code: 'SIN', tag: 'Cities', blurb: 'Gardens by the Bay & street food' },
  { code: 'SYD', tag: 'Cities', blurb: 'Harbour, beaches & the Opera House' },
  { code: 'AGR', tag: 'Heritage', blurb: 'The Taj Mahal at sunrise' },
  { code: 'JAI', tag: 'Heritage', blurb: 'Pink City palaces & forts' },
  { code: 'VNS', tag: 'Heritage', blurb: 'Evening aarti on the Ganges' },
  { code: 'COK', tag: 'Heritage', blurb: 'Houseboats on the backwaters' },
];
