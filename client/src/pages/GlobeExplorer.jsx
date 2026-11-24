import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ArrowLeft, Search, X, ChevronDown, Plus, Minus, Compass, Tags, Cloud, Shuffle, Plane, MapPin, CalendarDays, Clock, Landmark, RotateCcw, Hand,
} from 'lucide-react';
import { GLOBE_PLACES } from '../globePlaces';
import { WORLD_PLACES } from '../globeWorld';

const ALL_PLACES = [...GLOBE_PLACES, ...WORLD_PLACES];
import { imageUrl } from '../backgrounds';
import { LITE } from '../perf';

/* =====================================================================
   3D Globe Explorer
   - real NASA Blue Marble Earth with relief, ocean shine, clouds, atmosphere and stars
   - spins on its own; drag with mouse / finger to rotate, scroll / pinch to zoom
   - photo labels pop up as places reach the middle, shrink as they turn away
   - click a photo → camera flies in → details + "Do you want to go there?"
   - Spin button → whirls the Earth and lands on a random place
   ===================================================================== */

const DEG = Math.PI / 180;
const HOME_DIST = 3.1;
// on tall phone screens pull back further so the whole Earth (and the Moon) fit
const homeDist = () => (window.innerWidth / window.innerHeight < 0.8 ? 5.7 : HOME_DIST);
const FOCUS_DIST = 1.65;
const latLonToVec = (lat, lon, r = 1) => {
  const phi = (90 - lat) * DEG;
  const th = (lon + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const THUMB_KEY = 'tripnova_globe_thumbs_v1';

/* ---------- Wikipedia photos for the world landmarks (browser → Wikipedia, cached) ---------- */
async function loadWikiThumbs(places, onBatch) {
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(THUMB_KEY)) || {}; } catch { /* ignore */ }
  const all = [...new Set(places.filter((p) => p.wiki && !cache[p.wiki]).map((p) => p.wiki))];
  onBatch?.({ ...cache });
  for (let i = 0; i < all.length; i += 50) {          // Wikipedia allows 50 titles per request
    const missing = all.slice(i, i + 50);
    try {
      const qs = new URLSearchParams({ action: 'query', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', redirects: '1', format: 'json', formatversion: '2', origin: '*', titles: missing.join('|') });
      const data = await (await fetch(`https://en.wikipedia.org/w/api.php?${qs}`)).json();
      const back = {};
      for (const n of data?.query?.normalized || []) back[n.to] = n.from;
      for (const r of data?.query?.redirects || []) back[r.to] = back[r.from] || r.from;
      for (const p of data?.query?.pages || []) if (p.thumbnail?.source) cache[back[p.title] || p.title] = p.thumbnail.source;
      try { localStorage.setItem(THUMB_KEY, JSON.stringify(cache)); } catch { /* full */ }
      onBatch?.({ ...cache });
    } catch { break; /* offline: labels show a gradient instead */ }
  }
  return cache;
}

async function loadWikiSummary(title) {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
    if (!r.ok) return null;
    const d = await r.json();
    return { extract: d.extract, image: d.originalimage?.source || d.thumbnail?.source, description: d.description };
  } catch { return null; }
}

/* ---------- atmosphere glow shader ---------- */
const glowMaterial = (color, power, intensity, side) => new THREE.ShaderMaterial({
  uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, k: { value: intensity } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 c; uniform float p; uniform float k; varying vec3 vN; varying vec3 vV;
    void main(){ float f = ${side === THREE.BackSide ? 'pow(max(0.0, 0.62 - dot(vN, vV)), p)' : 'pow(1.0 - max(0.0, dot(vN, vV)), p)'}; gl_FragColor = vec4(c, 1.0) * f * k; }`,
  side, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
});

/**
 * "GlobeX" brand that bursts out of the Earth: each letter flies from the centre of the globe to its place,
 * the "o" is a tiny Earth with a plane that loops around it, and a wave of light runs across the word.
 */
function BrandBurst() {
  const W = window.innerWidth; const H = window.innerHeight;
  const letters = ['G', 'l', 'o', 'b', 'e', 'X'];
  return (
    <span className="gt-brand burst" aria-label="GlobeX">
      {letters.map((ch, k) => (
        <motion.span
          key={k}
          className={ch === 'o' ? 'gb-o' : ch === 'X' ? 'gb-x' : 'gb-ch'}
          style={{ '--d': `${1.5 + k * 0.09}s` }}
          initial={{ x: W / 2 - (34 + k * 15), y: H / 2 - 24, scale: 0.15, opacity: 0, rotate: (k - 2.5) * 40 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.15 + k * 0.08, type: 'spring', stiffness: 70, damping: 13, mass: 0.9 }}
        >
          {ch === 'o' ? (
            <>
              <i className="gb-earth" />
              <motion.i className="gb-orbit" initial={{ rotate: 0, opacity: 0 }} animate={{ rotate: 720, opacity: [0, 1, 1, 0] }} transition={{ delay: 0.9, duration: 2.6, ease: 'easeInOut' }}>
                <Plane size={9} />
              </motion.i>
            </>
          ) : ch}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * The 3D Earth. Used full-screen as the home page hero (`embedded`): the page scroll shrinks it into the logo,
 * so here the mouse wheel scrolls the page (zoom with the +/− buttons) and vertical swipes scroll on phones.
 */
export default function GlobeExplorer({ embedded = false, paused = false, collapsed = false, instant = false, apiRef, brandKey = 0, onFirstFrame }) {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const labelEls = useRef({});
  const focusDot = useRef(null);
  const api = useRef({});            // functions exposed from the three.js scene
  const stateRef = useRef({ focused: null, labels: true, spinning: false, paused: false, needFrame: true, uiOff: embedded });
  const searchInput = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const [loading, setLoading] = useState(0);        // texture loading progress 0..1
  const [ready, setReady] = useState(false);
  const [thumbs, setThumbs] = useState({});
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinName, setSpinName] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showClouds, setShowClouds] = useState(true);
  const [q, setQ] = useState('');
  const [hint, setHint] = useState(true);

  const places = ALL_PLACES;
  const photoOf = useCallback((p, size = 'thumb') => (p.photo ? imageUrl({ id: p.photo }, size) : thumbs[p.wiki] || null), [thumbs]);

  useEffect(() => { loadWikiThumbs(places, setThumbs); }, [places]);
  useEffect(() => { stateRef.current.labels = showLabels; }, [showLabels]);
  useEffect(() => { api.current.setClouds?.(showClouds); }, [showClouds]);
  useEffect(() => { const t = setTimeout(() => setHint(false), 6000); return () => clearTimeout(t); }, []);

  /* ================= three.js scene ================= */
  useEffect(() => {
    const mount = mountRef.current;
    const w = () => mount.clientWidth;
    const h = () => mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: !LITE, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LITE ? 1 : 1.5));
    renderer.setSize(w(), h());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // the sky is drawn as the clear colour so it can fade away (the Earth then floats over the page while it flies into the logo)
    renderer.setClearColor('#02040a', 1);
    const camera = new THREE.PerspectiveCamera(42, w() / h(), 0.05, 200);
    // start far away above India, then glide in
    camera.position.copy(latLonToVec(18, 78, instant ? homeDist() : 9));

    // ---- textures
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_u, done, total) => setLoading(done / total);
    manager.onLoad = () => setReady(true);
    const loader = new THREE.TextureLoader(manager);
    const anis = renderer.capabilities.getMaxAnisotropy();
    // pictures are decoded off the main thread (ImageBitmap) so loading the Earth never freezes the page
    const bmpLoader = typeof createImageBitmap === 'function' ? new THREE.ImageBitmapLoader(manager) : null;
    bmpLoader?.setOptions({ imageOrientation: 'flipY' });
    const tex = (url, color = false) => {
      let t;
      if (bmpLoader) {
        t = new THREE.Texture();
        t.flipY = false;
        bmpLoader.load(url, (bmp) => { t.image = bmp; t.needsUpdate = true; stateRef.current.needFrame = true; });
      } else t = loader.load(url);
      if (color) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, anis);
      return t;
    };

    // ---- Earth
    const seg = LITE ? 48 : 128;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, seg, seg),
      new THREE.MeshPhongMaterial({
        map: tex('/earth-tex/earth-2k.jpg', true),   // sharper 4K map swapped in later, when the page is idle
        bumpMap: tex('/earth-tex/bump.jpg'),
        bumpScale: 0.035,
        specularMap: tex('/earth-tex/water.jpg'),
        specular: new THREE.Color('#5a7a99'),
        shininess: 22,
      }),
    );
    scene.add(earth);
    // swap in the 4K Earth when the browser is idle (desktop only)
    if (!LITE && bmpLoader) {
      const up = () => bmpLoader.load('/earth-tex/earth-4k.jpg', (bmp) => {
        const t = new THREE.Texture(bmp); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, anis); t.needsUpdate = true;
        const old = earth.material.map; earth.material.map = t; earth.material.needsUpdate = true; old?.dispose?.();
        stateRef.current.needFrame = true;
      });
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
      setTimeout(() => idle(up, { timeout: 6000 }), 5000);
    }

    // ---- clouds (slowly drifting)
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, seg, seg),
      new THREE.MeshPhongMaterial({ color: '#ffffff', alphaMap: tex('/earth-tex/clouds.jpg'), transparent: true, opacity: 0.9, depthWrite: false }),
    );
    scene.add(clouds);
    api.current.setClouds = (on) => { clouds.visible = on; };

    // ---- atmosphere: inner rim + outer halo
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.003, 64, 64), glowMaterial('#cfe3ff', 5.0, 0.18, THREE.FrontSide)));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.03, 64, 64), glowMaterial('#bcd6ff', 6.0, 0.22, THREE.BackSide));
    scene.add(halo);

    // ---- stars
    const starCount = LITE ? 1500 : 9000;
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(50 + Math.random() * 60);
      pos.set([v.x, v.y, v.z], i * 3);
      const b = 0.45 + Math.random() * 0.55;
      const tint = Math.random();
      col.set(tint < 0.1 ? [b, b * 0.85, b * 0.7] : tint < 0.2 ? [b * 0.8, b * 0.9, b] : [b, b, b], i * 3);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: LITE ? 1.6 : 1.3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95 }));
    scene.add(stars);

    // ---- glowing, twinkling bright stars + a faint Milky Way band
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.85)');
      r.addColorStop(0.45, 'rgba(255,255,255,0.18)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
      // soft cross flare
      g.globalCompositeOperation = 'lighter';
      const lg = g.createLinearGradient(0, 32, 64, 32);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg; g.fillRect(0, 31, 64, 2);
      g.save(); g.translate(32, 32); g.rotate(Math.PI / 2); g.translate(-32, -32); g.fillRect(0, 31, 64, 2); g.restore();
      return new THREE.CanvasTexture(c);
    })();
    const makeGlowStars = (n, minR, spread, sizeMin, sizeMax, band) => {
      const p = new Float32Array(n * 3); const c = new Float32Array(n * 3); const sz = new Float32Array(n); const ph = new Float32Array(n);
      const tilt = new THREE.Matrix4().makeRotationX(1.05).multiply(new THREE.Matrix4().makeRotationZ(0.5));
      for (let i = 0; i < n; i++) {
        let v;
        if (band) { const a = Math.random() * Math.PI * 2; const y = (Math.random() + Math.random() + Math.random() - 1.5) * 0.16; v = new THREE.Vector3(Math.cos(a), y, Math.sin(a)).normalize().applyMatrix4(tilt); }
        else v = new THREE.Vector3().randomDirection();
        v.multiplyScalar(minR + Math.random() * spread);
        p.set([v.x, v.y, v.z], i * 3);
        const t = Math.random();
        c.set(t < 0.22 ? [0.75, 0.85, 1] : t < 0.36 ? [1, 0.88, 0.7] : t < 0.42 ? [1, 0.75, 0.65] : [1, 1, 1], i * 3);
        sz[i] = sizeMin + Math.pow(Math.random(), 2.2) * (sizeMax - sizeMin);
        ph[i] = Math.random() * 6.283;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      g.setAttribute('size', new THREE.BufferAttribute(sz, 1));
      g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
      return new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, map: { value: glowTex }, dpr: { value: renderer.getPixelRatio() }, alpha: { value: band ? 0.8 : 1.25 } },
        vertexShader: `attribute float size; attribute float phase; attribute vec3 color; uniform float time; uniform float dpr; varying vec3 vC; varying float vT;
          void main(){ vC = color; vT = 0.55 + 0.45 * sin(time * (0.8 + fract(phase) * 1.6) + phase * 7.0);
            gl_PointSize = size * dpr * (0.75 + 0.35 * vT); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D map; uniform float alpha; varying vec3 vC; varying float vT;
          void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, 1.0) * t.a * vT * alpha; }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
    };
    const brightStars = makeGlowStars(LITE ? 220 : 600, 45, 50, 7, LITE ? 22 : 30, false);
    const milkyWay = makeGlowStars(LITE ? 700 : 6500, 55, 40, 2.2, 6, true);
    scene.add(brightStars, milkyWay);

    // ---- the Moon (just for show): sits in the sky behind the Earth, top-right of the view, slowly turning
    const moonTex = (() => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
      const g = c.getContext('2d');
      g.fillStyle = '#9b9a97'; g.fillRect(0, 0, 1024, 512);
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '40,40,40'},${0.03 + rnd() * 0.05})`; g.beginPath(); g.arc(rnd() * 1024, rnd() * 512, 2 + rnd() * 14, 0, 7); g.fill(); }
      // dark "seas" (maria)
      const maria = [[300, 170, 90], [380, 230, 70], [230, 230, 60], [460, 160, 55], [520, 250, 50], [330, 300, 45], [700, 200, 40], [180, 300, 40]];
      for (const [x, y, r] of maria) for (let k = 0; k < 14; k++) {
        g.fillStyle = 'rgba(70,70,74,0.16)'; g.beginPath();
        g.ellipse(x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r * 0.7, r * (0.45 + rnd() * 0.6), r * (0.3 + rnd() * 0.5), rnd() * 3, 0, 7); g.fill();
      }
      // craters
      for (let i = 0; i < 420; i++) {
        const x = rnd() * 1024; const y = 30 + rnd() * 452; const r = 1.5 + Math.pow(rnd(), 3) * 26;
        g.fillStyle = 'rgba(60,60,62,0.35)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.strokeStyle = 'rgba(235,235,230,0.35)'; g.lineWidth = Math.max(1, r * 0.18); g.beginPath(); g.arc(x - r * 0.12, y - r * 0.12, r, Math.PI * 0.9, Math.PI * 1.9); g.stroke();
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 48, 48),
      new THREE.MeshPhongMaterial({ map: moonTex, bumpMap: moonTex, bumpScale: 0.02, shininess: 2, specular: new THREE.Color('#111') }),
    );
    moon.rotation.z = 0.12;
    scene.add(moon);
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#cfd8e6', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
    moonGlow.scale.set(2.2, 2.2, 1);
    scene.add(moonGlow);
    moon.material.transparent = true;
    const ambient = new THREE.AmbientLight('#8fa3c0', 0.55);
    scene.add(ambient);
    let skyK = 1;
    let moonK = 1;
    let day = document.documentElement.classList.contains('theme-day');
    const paintSky = () => {
      // day: the sky behind is the page's daylight sky, so no black space, stars or Moon here
      renderer.setClearColor('#02040a', day ? 0 : skyK);
      const st = day ? 0 : skyK;
      stars.material.opacity = 0.95 * st;
      brightStars.material.uniforms.alpha.value = 1.25 * st;
      milkyWay.material.uniforms.alpha.value = 0.8 * st;
      const mk = day ? 0 : moonK;
      moon.material.opacity = mk; moonGlow.material.opacity = 0.22 * mk;
      moon.visible = moonGlow.visible = mk > 0.02;
      stateRef.current.needFrame = true;
    };
    api.current.setSky = (k, mk = k) => {
      if (Math.abs(k - skyK) < 0.002 && Math.abs(mk - moonK) < 0.002) return;
      skyK = k; moonK = mk;
      paintSky();
    };
    api.current.setDay = (on) => {
      day = on;
      paintSky();
      ambient.intensity = on ? 1.05 : 0.55;
      sun.intensity = on ? 3.0 : 2.6;
    };
    const moonNdc = new THREE.Vector3();
    const placeMoon = (now) => {
      const mob = w() < 640;
      const drift = Math.sin(now / 9000) * 0.03;
      moonNdc.set(mob ? 0.52 : 0.74 + drift, mob ? 0.66 : 0.6 + drift * 0.6, 0.5).unproject(camera);
      moonNdc.sub(camera.position).normalize().multiplyScalar(14).add(camera.position);
      moon.position.copy(moonNdc);
      moonGlow.position.copy(moonNdc);
    };

    // ---- place pins drawn on the globe itself (fast even with hundreds of places)
    const pinGeo = new THREE.BufferGeometry();
    const pinPos = new Float32Array(places.length * 3); const pinCol = new Float32Array(places.length * 3);
    places.forEach((p, i) => {
      const v = latLonToVec(p.lat, p.lon, 1.004); pinPos.set([v.x, v.y, v.z], i * 3);
      pinCol.set(p.kind === 'featured' ? [0.98, 0.75, 0.14] : [0.37, 0.92, 0.83], i * 3);
    });
    pinGeo.setAttribute('position', new THREE.BufferAttribute(pinPos, 3));
    pinGeo.setAttribute('color', new THREE.BufferAttribute(pinCol, 3));
    const pins = new THREE.Points(pinGeo, new THREE.ShaderMaterial({
      uniforms: { dpr: { value: renderer.getPixelRatio() }, map: { value: glowTex } },
      vertexShader: `attribute vec3 color; uniform float dpr; varying vec3 vC; varying float vF;
        void main(){ vC = color; vec3 n = normalize(position); vec3 toCam = normalize(cameraPosition - position);
          vF = smoothstep(0.0, 0.25, dot(n, toCam)); float d = length(cameraPosition);
          gl_PointSize = dpr * clamp(13.0 / (d - 0.85), 6.0, 18.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vC; varying float vF;
        void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard;
          float core = 1.0 - smoothstep(0.22, 0.30, r); float ring = (1.0 - smoothstep(0.36, 0.5, r)) * (1.0 - core);
          gl_FragColor = vec4(mix(vec3(0.02, 0.05, 0.08), vC, core) , (core + ring * 0.55) * vF); }`,
      transparent: true, depthWrite: false,
    }));
    pins.renderOrder = 2;
    scene.add(pins);

    // ---- light: a "sun" that follows the camera from the upper-left, so the side you look at is lit
    const sun = new THREE.DirectionalLight('#ffffff', 2.6);
    scene.add(sun);

    // ---- mouse / touch controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 1.3;
    controls.maxDistance = 7;
    controls.zoomSpeed = 0.7;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    if (embedded) {
      controls.enableZoom = false;                       // wheel scrolls the page instead
      renderer.domElement.style.touchAction = 'pan-y';   // phones: swipe up/down scrolls, sideways turns the Earth
    }
    // photo labels never block a drag: a quick tap (no drag) on a label opens that place, anything else turns the Earth
    const cvs = renderer.domElement;
    const labelAt = (x, y) => {
      if (stateRef.current.uiOff) return null;
      let best = null; let bestZ = -1;
      for (const p of places) {
        const el = labelEls.current[p.slug];
        if (!el || !el.classList.contains('on')) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { const z = +el.style.zIndex || 0; if (z > bestZ) { bestZ = z; best = { p, el }; } }
      }
      return best;
    };
    let tap = null; let hovEl = null;
    const onCvsDown = (e) => { tap = e.isPrimary ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; };
    const onCvsUp = (e) => {
      if (!tap) return;
      const quick = Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8 && performance.now() - tap.t < 500;
      tap = null;
      if (!quick) return;
      const hit = labelAt(e.clientX, e.clientY);
      if (hit) api.current.openPlace?.(hit.p);
    };
    const onCvsMove = (e) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      const hit = labelAt(e.clientX, e.clientY);
      const el = hit?.el || null;
      if (el !== hovEl) { hovEl?.classList.remove('hov'); el?.classList.add('hov'); hovEl = el; cvs.style.cursor = el ? 'pointer' : ''; }
    };
    cvs.addEventListener('pointerdown', onCvsDown);
    cvs.addEventListener('pointerup', onCvsUp);
    cvs.addEventListener('pointermove', onCvsMove, { passive: true });

    let resumeTimer = null;
    let rotScale = 1;                                    // the home-page Earth is drawn smaller, so turn it faster per pixel
    controls.addEventListener('start', () => { controls.autoRotate = false; stateRef.current.dragging = true; clearTimeout(resumeTimer); setHint(false); });
    controls.addEventListener('end', () => {
      stateRef.current.dragging = false;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { if (!stateRef.current.focused && !stateRef.current.spinning) controls.autoRotate = true; }, 3500);
    });

    // ---- camera flights
    let flight = null; // { fromDir, q, fromDist, toDist, start, ms, arc, done }
    const flyTo = (dir, toDist, ms = 1800, arc = 0.6) => new Promise((resolve) => {
      const from = camera.position.clone();
      const fromDir = from.clone().normalize();
      flight = {
        fromDir, toDir: dir.clone().normalize(), fromDist: from.length(), toDist, start: performance.now(), ms, arc,
        q: new THREE.Quaternion().setFromUnitVectors(fromDir, dir.clone().normalize()), done: resolve,
      };
      controls.enabled = false;
      controls.autoRotate = false;
    });
    api.current.flyToPlace = (p) => flyTo(latLonToVec(p.lat, p.lon), FOCUS_DIST, 1900, 0.7);
    // screen position of a place on the canvas (for the home-page pin), facing: 1 = facing us, <0 = behind the Earth
    const pv = new THREE.Vector3();
    api.current.project = (lat, lon) => {
      pv.copy(latLonToVec(lat, lon, 1.0));
      const facing = pv.clone().normalize().dot(camera.position.clone().normalize());
      pv.project(camera);
      return { x: (pv.x * 0.5 + 0.5) * w(), y: (-pv.y * 0.5 + 0.5) * h(), facing };
    };
    api.current.setControls = (on) => { controls.enabled = on; };
    api.current.setRotScale = (f) => { rotScale = clamp(f || 1, 0.5, 3); };
    // full globe: drag with one finger, pinch / wheel to zoom. Home page: sideways drag turns it, up/down scrolls the page.
    api.current.setFullInput = (on) => {
      controls.enableZoom = on;
      controls.zoomSpeed = on ? 1.1 : 0.7;
      controls.maxDistance = on ? homeDist() * 1.01 : 7;
      renderer.domElement.style.touchAction = on ? 'none' : 'pan-y';
    };
    api.current.atHome = () => camera.position.length() >= homeDist() * 0.97;
    api.current.home = () => flyTo(camera.position.clone(), homeDist(), 1100, 0).then(() => { controls.autoRotate = true; });
    api.current.zoom = (f) => flyTo(camera.position.clone(), clamp(camera.position.length() * f, controls.minDistance, controls.maxDistance), 450, 0);
    // compass: back to the normal view — north up, India in front, normal size (from any pole / zoom)
    api.current.northUp = () => flyTo(latLonToVec(18, 78, 1), homeDist(), 1300, 0.25);
    api.current.spin = () => new Promise((resolve) => {
      controls.autoRotate = true;
      const t0 = performance.now();
      const step = () => {
        const t = (performance.now() - t0) / 2200;
        controls.autoRotateSpeed = t < 0.25 ? 0.55 + (t / 0.25) * 34 : t < 0.7 ? 34.5 : 34.5 * (1 - (t - 0.7) / 0.3) + 0.55;
        if (t < 1) requestAnimationFrame(step); else { controls.autoRotateSpeed = 0.55; resolve(); }
      };
      step();
    });
    api.current.setAutoRotate = (on) => { controls.autoRotate = on; };
    api.current.dist = () => camera.position.length();
    // shift the picture left/up when the details panel is open, so the place isn't hidden behind it
    let offset = { x: 0, y: 0 }; let offsetTarget = { x: 0, y: 0 };
    api.current.setOffset = (x, y = 0) => { offsetTarget = { x, y }; };
    api.current.stepOffset = () => {
      offset.x += (offsetTarget.x - offset.x) * 0.08; offset.y += (offsetTarget.y - offset.y) * 0.08;
      if (Math.abs(offset.x) < 0.5 && Math.abs(offset.y) < 0.5 && !offsetTarget.x && !offsetTarget.y) { if (camera.view) camera.clearViewOffset(); return; }
      camera.setViewOffset(w(), h(), offset.x, offset.y, w(), h());
    };
    api.current.centerOnScreen = () => ({ w: w(), h: h() });
    // radius of the Earth on screen, in CSS pixels (used to shrink the globe into the logo)
    api.current.earthRadiusPx = () => {
      const d = Math.max(1.01, camera.position.length());
      return (h() / 2) * Math.tan(Math.asin(1 / d)) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    };
    // cheaper frames while the whole globe is flying around the screen
    // one fixed resolution (changing it re-allocates the canvas and causes a hitch mid-animation)
    api.current.setLowRes = () => {};
    api.current.setUiOff = (on) => { stateRef.current.uiOff = on; if (on) { controls.autoRotate = true; } };
    if (apiRef) apiRef.current = api.current;

    // ---- labels: position, size and fade every frame (DOM updated directly, no React re-render)
    const vecs = places.map((p) => latLonToVec(p.lat, p.lon, 1.005));
    const norms = vecs.map((v) => v.clone().normalize());
    const tmp = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const cands = places.map((p) => ({ p, x: 0, y: 0, t: 0 }));
    let labelsHidden = false;
    const updateLabels = () => {
      // while the globe is flying (intro zoom / folding into the logo) skip the label work entirely
      if (stateRef.current.uiOff) {
        if (!labelsHidden) { Object.values(labelEls.current).forEach((el) => { if (el) { el.style.opacity = '0'; el.classList.remove('on'); } }); labelsHidden = true; }
        return;
      }
      labelsHidden = false;
      const W = w(); const H = h();
      camDir.copy(camera.position).normalize();
      const dist = camera.position.length();
      const focused = stateRef.current.focused;
      const maxLabels = focused || stateRef.current.spinning ? 0 : (W < 640 ? 4 : LITE ? 6 : 9);
      places.forEach((p, i) => {
        const facing = norms[i].dot(camDir);
        tmp.copy(vecs[i]).project(camera);
        const x = (tmp.x + 1) / 2 * W;
        const y = (1 - tmp.y) / 2 * H;
        // how close to the middle of the screen (1 = dead centre)
        const cd = Math.hypot(x - W / 2, y - H / 2) / (Math.min(W, H) * 0.5);
        const t = facing > 0.18 ? clamp(1 - cd / 0.95, 0, 1) * clamp((facing - 0.18) / 0.4, 0, 1) : 0;
        const c = cands[i]; c.p = p; c.x = x; c.y = y; c.t = t;
        if (focused?.slug === p.slug && focusDot.current) {
          focusDot.current.style.opacity = facing > 0.04 ? '1' : '0';
          focusDot.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        }
      });
      if (!focused && focusDot.current) focusDot.current.style.opacity = '0';
      const order = cands.slice().sort((a, b) => b.t - a.t);
      const placed = [];
      for (const c of order) {
        const el = labelEls.current[c.p.slug];
        if (!el) continue;
        let show = stateRef.current.labels && c.t > 0.3 && placed.length < maxLabels;
        const k = ease(clamp((c.t - 0.3) / 0.6, 0, 1));            // 0 → 1 as it reaches the centre
        if (show) {
          // real on-screen box of the card (bottom-centre sits on the pin) — never let two cards overlap
          if (!el._w) { el._w = el.offsetWidth || 168; el._h = el.offsetHeight || 130; }
          const sc = 0.55 + k * 0.6;
          c.w = el._w * sc + 8; c.h = el._h * sc + 6;
          show = !placed.some((o) => Math.abs(o.x - c.x) < (o.w + c.w) / 2 && c.y - c.h < o.y && o.y - o.h < c.y);
        }
        if (show) {
          placed.push(c);
          el.style.opacity = String(clamp((c.t - 0.3) / 0.18, 0, 1));
          el.style.transform = `translate(${c.x}px, ${c.y}px) translate(-50%, -100%) scale(${0.55 + k * 0.6})`;
          el.style.zIndex = String(10 + Math.round(c.t * 100));
          
          if (!el.classList.contains('on')) {
            el.classList.add('on');
            const img = el.querySelector('img[data-src]');        // load the photo only when its label first appears
            if (img && img.getAttribute('src') !== img.dataset.src) img.src = img.dataset.src;
          }
        } else if (el.classList.contains('on')) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.classList.remove('on');
        }
      }
    };

    // ---- render loop
    let raf;
    let last = performance.now();
    let started = false;
    let firstFrameSent = false;
    let halfFrame = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) { last = now; return; }
      if (stateRef.current.paused) {
        last = now;
        // paused (behind the intro / folded into the logo): draw just one frame so textures are uploaded early
        if (stateRef.current.needFrame && stateRef.current.ready) {
          stateRef.current.needFrame = false;
          renderer.render(scene, camera);
          if (!firstFrameSent) { firstFrameSent = true; onFirstFrame?.(); }
        }
        return;
      }
      // phones: while the globe is just turning on the home page, 30 frames a second is plenty (saves battery and keeps scrolling smooth)
      if (LITE && stateRef.current.uiOff && !flight && !stateRef.current.dragging) { halfFrame = !halfFrame; if (halfFrame) return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // opening glide from deep space
      if (!started && stateRef.current.ready) {
        started = true;
        if (instant) controls.autoRotate = true;
        else flyTo(camera.position.clone(), homeDist(), 2600, 0).then(() => { controls.autoRotate = true; });
      }
      if (flight) {
        const t = clamp((now - flight.start) / flight.ms, 0, 1);
        const e = ease(t);
        const qt = new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), flight.q, e);
        const dir = flight.fromDir.clone().applyQuaternion(qt);
        const d = flight.fromDist + (flight.toDist - flight.fromDist) * e + Math.sin(Math.PI * e) * flight.arc;
        camera.position.copy(dir.multiplyScalar(d));
        camera.lookAt(0, 0, 0);
        if (t >= 1) { const f = flight; flight = null; controls.enabled = true; controls.update(); f.done(); }
      } else {
        controls.rotateSpeed = clamp((camera.position.length() - 1) * 0.28, 0.06, 0.6) * rotScale; // slower when zoomed in
        controls.update();
      }
      api.current.stepOffset?.();
      clouds.rotation.y += dt * 0.006;
      stars.rotation.y += dt * 0.002;
      brightStars.material.uniforms.time.value = now / 1000;
      milkyWay.material.uniforms.time.value = now / 1000;
      brightStars.rotation.y = milkyWay.rotation.y = stars.rotation.y;
      pins.visible = camera.position.length() < 8 && !stateRef.current.uiOff;
      moon.rotation.y += dt * 0.02;
      placeMoon(now);
      // sun from the upper-left of the viewer → lit face with a soft dark edge, like a photo from space
      sun.position.copy(camera.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.75).add(new THREE.Vector3(0, 1.2, 0));
      renderer.render(scene, camera);
      if (!firstFrameSent) { firstFrameSent = true; onFirstFrame?.(); }
      updateLabels();
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      cvs.removeEventListener('pointerdown', onCvsDown);
      cvs.removeEventListener('pointerup', onCvsUp);
      cvs.removeEventListener('pointermove', onCvsMove);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        const m = o.material;
        if (m) { Object.values(m).forEach((v) => v?.isTexture && v.dispose()); m.dispose?.(); }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [places]);

  useEffect(() => { stateRef.current.ready = ready; }, [ready]);
  useEffect(() => { stateRef.current.paused = paused; }, [paused]);
  // scrolling away from the globe closes the details and search
  useEffect(() => {
    if (!collapsed) return;
    setSelected(null); setSummary(null); setQ(''); setSearchOpen(false);
    if (stateRef.current.focused) {
      stateRef.current.focused = null;
      api.current.setOffset?.(0, 0);
      api.current.home?.();
    }
  }, [collapsed]);

  /* ================= actions ================= */
  const openPlace = useCallback(async (p) => {
    if (stateRef.current.spinning) return;
    setSummary(null);
    stateRef.current.focused = p;
    setSelected(null);
    setQ('');
    const { w: W, h: H } = api.current.centerOnScreen?.() || { w: 0, h: 0 };
    api.current.setOffset?.(W > 900 ? 210 : 0, W > 900 ? 0 : Math.round(H * 0.24));
    await api.current.flyToPlace?.(p);
    setSelected(p);
    if (p.wiki) loadWikiSummary(p.wiki).then(setSummary);
  }, []);

  const closePlace = useCallback(() => {
    api.current.setOffset?.(0, 0);
    setSelected(null);
    stateRef.current.focused = null;
    api.current.home?.();
  }, []);

  const spin = useCallback(async () => {
    if (stateRef.current.spinning) return;
    api.current.setOffset?.(0, 0);
    setSelected(null);
    setSummary(null);
    stateRef.current.focused = null;
    stateRef.current.spinning = true;
    setSpinning(true);
    // slot-machine names while the Earth whirls
    const names = setInterval(() => setSpinName(places[Math.floor(Math.random() * places.length)].name), 90);
    if ((api.current.dist?.() || HOME_DIST) < 2.4) await api.current.home();
    await api.current.spin?.();
    clearInterval(names);
    const pick = places[Math.floor(Math.random() * places.length)];
    setSpinName(pick.name);
    stateRef.current.spinning = false;
    setSpinning(false);
    await openPlace(pick);
    setSpinName('');
  }, [places, openPlace]);
  // let the home page open a place / spin from its own buttons
  useEffect(() => { api.current.openPlace = openPlace; api.current.spinNow = spin; api.current.places = places; }, [openPlace, spin, places]);
  // day / night theme from the top bar
  useEffect(() => {
    const sync = () => api.current.setDay?.(document.documentElement.classList.contains('theme-day'));
    sync(); const t = setTimeout(sync, 500);
    window.addEventListener('globex:theme', sync);
    return () => { clearTimeout(t); window.removeEventListener('globex:theme', sync); };
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return places.filter((p) => `${p.name} ${p.country} ${p.region}`.toLowerCase().includes(t)).slice(0, 8);
  }, [q, places]);

  const goThere = (p) => {
    if (p.kind === 'featured') navigate(`/explore/${p.slug}`);
    else navigate(`/guide/${encodeURIComponent(p.guide)}?country=${encodeURIComponent(p.country.split(' / ')[0])}`);
  };

  /* ================= UI ================= */
  return (
    <div className={`globe-page ${embedded ? 'globe-embedded' : ''}`}>
      <div ref={mountRef} className="globe-canvas" />

      {/* map pins + photo labels (positioned every frame by the scene) */}
      <div className="globe-overlay">
        <span ref={focusDot} className="globe-dot focus" />
        {places.map((p) => (
          <button
            key={p.slug}
            ref={(el) => { labelEls.current[p.slug] = el; }}
            className="globe-label"
            onClick={() => openPlace(p)}
            aria-label={`Fly to ${p.name}`}
          >
            <span className="gl-card">
              {photoOf(p) ? <img data-src={photoOf(p)} alt="" draggable="false" decoding="async" /> : <span className="gl-noimg"><MapPin size={20} /></span>}
              <span className="gl-txt"><b>{p.name}</b><em>{p.country}</em></span>
            </span>
            <span className="gl-stem" />
          </button>
        ))}
      </div>

      {/* loading */}
      <AnimatePresence>
        {!ready && (
          <motion.div className="globe-loading" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <div className="gl-spinner" />
            <p>Loading the Earth… {Math.round(loading * 100)}%</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* top bar */}
      <div className="globe-top">
        {embedded
          ? <BrandBurst key={brandKey} />
          : <button className="gt-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>}
        <motion.div
          className={`gt-search ${searchOpen ? 'open' : ''}`}
          initial={false}
          animate={{ width: searchOpen ? 'min(400px, calc(100vw - 9.5rem))' : 44 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <motion.button
            className="gt-search-btn" aria-label="Search places on the globe"
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
            onClick={() => { setSearchOpen(true); setTimeout(() => searchInput.current?.focus(), 60); }}
          >
            <Search size={18} />
          </motion.button>
          {searchOpen && (
            <>
              <input ref={searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Paris, Bali, Machu Picchu…" aria-label="Search places on the globe"
                onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) openPlace(results[0]); if (e.key === 'Escape') { setQ(''); setSearchOpen(false); if (stateRef.current.focused) closePlace(); } }}
                onBlur={() => setTimeout(() => { if (!searchInput.current?.value) setSearchOpen(false); }, 180)} />
              <button onClick={() => { setQ(''); setSearchOpen(false); if (stateRef.current.focused) closePlace(); }} aria-label="Close search"><X size={16} /></button>
            </>
          )}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div className="gt-results" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {results.map((p) => (
                  <button key={p.slug} onClick={() => { openPlace(p); setSearchOpen(false); }}>
                    {photoOf(p) ? <img src={photoOf(p)} alt="" decoding="async" /> : <span className="gl-noimg sm"><MapPin size={14} /></span>}
                    <span><b>{p.name}</b><em>{p.country}</em></span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="gt-tools">
          <button className={`gt-btn ${showLabels ? 'on' : ''}`} onClick={() => setShowLabels((v) => !v)} title="Photo labels"><Tags size={18} /></button>
          <button className={`gt-btn ${showClouds ? 'on' : ''}`} onClick={() => setShowClouds((v) => !v)} title="Clouds"><Cloud size={18} /></button>
        </div>
      </div>

      {/* help hint */}
      <AnimatePresence>
        {hint && ready && (
          <motion.div className="globe-hint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Hand size={16} /> {embedded ? 'Drag to turn the Earth · pinch or scroll to zoom · tap a photo to fly there' : 'Drag to turn the Earth · scroll or pinch to zoom · tap a photo to fly there'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* spin slot text */}
      <AnimatePresence>
        {spinName && (
          <motion.div className="spin-name" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <span>{spinning ? 'Where to next?' : 'You’re going to…'}</span>
            <b key={spinName}>{spinName}</b>
          </motion.div>
        )}
      </AnimatePresence>

      {/* zoom controls */}
      <div className="globe-zoom">
        <button onClick={() => api.current.zoom?.(0.75)} aria-label="Zoom in"><Plus size={20} /></button>
        <button onClick={() => api.current.zoom?.(1.33)} aria-label="Zoom out"><Minus size={20} /></button>
        <button onClick={() => { stateRef.current.focused = null; setSelected(null); setSummary(null); api.current.setOffset?.(0, 0); api.current.northUp?.().then(() => api.current.setAutoRotate?.(true)); }} aria-label="Reset view" title="Back to the normal view"><Compass size={20} /></button>
      </div>

      {/* SPIN */}
      <div className="globe-bottom">
        <motion.button className={`spin-btn ${spinning ? 'busy' : ''}`} onClick={spin} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} disabled={!ready || spinning}>
          <span className="spin-ring" />
          <Shuffle size={22} />
          <span>{spinning ? 'Spinning…' : 'Spin'}</span>
        </motion.button>
        {embedded
          ? (
            <button className="scroll-cue" onClick={() => window.dispatchEvent(new Event('globex:close-globe'))}>
              <ChevronDown size={14} className="up" /> Swipe up to go back home
            </button>
          )
          : <span className="spin-caption">Feeling lucky? Spin the Earth to a random place</span>}
      </div>

      {/* details: "Do you want to go there?" */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            className="place-panel"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <div className="pp-photo">
              {(selected.photo || summary?.image || photoOf(selected))
                ? <motion.img decoding="async" key={selected.slug + (summary?.image ? 'w' : '')} src={selected.photo ? imageUrl({ id: selected.photo }, false) : summary?.image || photoOf(selected)} alt={selected.name} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 6 }} />
                : <span className="gl-noimg big"><MapPin size={40} /></span>}
              <button className="pp-close" onClick={closePlace} aria-label="Close"><X size={18} /></button>
              <span className="pp-region">{selected.region}</span>
            </div>
            <div className="pp-body">
              <h2>{selected.name}</h2>
              <p className="pp-country"><MapPin size={14} /> {selected.country} · {Math.abs(selected.lat).toFixed(2)}°{selected.lat >= 0 ? 'N' : 'S'}, {Math.abs(selected.lon).toFixed(2)}°{selected.lon >= 0 ? 'E' : 'W'}</p>
              {selected.kind === 'featured' ? (
                <>
                  <p className="pp-tagline">{selected.tagline}</p>
                  <p className="pp-about">{selected.about}</p>
                  <div className="pp-facts">
                    <span><CalendarDays size={14} /> Best time <b>{selected.bestTime}</b></span>
                    <span><Clock size={14} /> Ideal trip <b>{selected.days}</b></span>
                    <span><Landmark size={14} /> <b>{selected.spots}</b> places to visit</span>
                  </div>
                </>
              ) : (
                <>
                  {summary?.description && <p className="pp-tagline">{summary.description}</p>}
                  <p className="pp-about">{summary ? (summary.extract || 'A world-famous place worth seeing.') : 'Loading details…'}</p>
                </>
              )}
              <div className="pp-ask">
                <h3>Do you want to go there?</h3>
                <div className="pp-actions">
                  <motion.button className="pp-yes" onClick={() => goThere(selected)} whileTap={{ scale: 0.96 }}><Plane size={18} /> Yes, take me there</motion.button>
                  <button className="pp-no" onClick={closePlace}><RotateCcw size={16} /> Keep exploring</button>
                </div>
                <button className="pp-spin" onClick={spin}><Shuffle size={15} /> Spin again</button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
