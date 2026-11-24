import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { globeApi, hostEl, getGlobeHost, setGlobeHost, subscribeGlobeHost } from '../globeHost';
import { globeControl, resolveGlobeReady } from './GlobeHero';

const GlobeExplorer = lazy(() => import('../pages/GlobeExplorer'));

/** Keeps the single 3D globe alive for the whole app (see globeHost.js). */
export default function GlobeHost() {
  const s = useSyncExternalStore(subscribeGlobeHost, getGlobeHost);
  // start building it right away on the home page, otherwise once the browser is idle
  const [on, setOn] = useState(() => window.location.pathname === '/');
  useEffect(() => {
    if (on) return undefined;
    const go = () => setOn(true);
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 3000 }) : setTimeout(go, 2000);
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, [on]);
  useEffect(() => { const t = () => setOn(true); window.addEventListener('globex:need-globe', t); return () => window.removeEventListener('globex:need-globe', t); }, []);
  if (!on || !hostEl) return null;
  return createPortal(
    <Suspense fallback={null}>
      <GlobeExplorer embedded instant paused={s.paused} collapsed={s.collapsed} brandKey={s.brandKey} apiRef={globeApi}
        onFirstFrame={() => { resolveGlobeReady(); setGlobeHost({ ready: true }); }} />
    </Suspense>,
    hostEl,
  );
}
export { globeControl };
