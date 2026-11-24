import { useEffect, useState } from 'react';
import { api } from '../api';

let cache = null;

export default function useCities() {
  const [cities, setCities] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    api('/cities').then((d) => { cache = d.cities; setCities(d.cities); }).catch(() => {});
  }, []);
  return cities;
}
