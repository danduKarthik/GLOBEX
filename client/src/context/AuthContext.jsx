import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = (d) => { tokenStore.set(d.token); setUser(d.user); return d.user; };
  const login = useCallback((email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth), []);
  const register = useCallback((form) => api('/auth/register', { method: 'POST', body: form }).then(handleAuth), []);
  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
