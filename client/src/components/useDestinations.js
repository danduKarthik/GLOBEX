import { useEffect, useState } from 'react';
import { api } from '../api';

let cache = null;
let pending = null;

/** All destinations (summary), fetched once and shared. */
export default function useDestinations() {
  const [list, setList] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    pending = pending || api('/destinations').then((d) => (cache = d.destinations));
    pending.then(setList).catch(() => { pending = null; });
  }, []);
  return list;
}
