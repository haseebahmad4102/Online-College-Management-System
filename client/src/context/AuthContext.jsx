import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { passesCan } from '../utils/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage is per-tab, so each tab can be signed in as a different role
    // at once — a login in one tab never bleeds into (or hijacks) another tab.
    const token = sessionStorage.getItem('ocms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => sessionStorage.removeItem('ocms_token'))
      .finally(() => setLoading(false));
  }, []);

  // Permissions can be granted/revoked while someone is signed in — re-sync the
  // profile whenever the tab regains focus so the sidebar and buttons follow
  // without a re-login. Scoped to this tab's own token (sessionStorage), so
  // focusing one tab never re-syncs another tab's session.
  useEffect(() => {
    let lastRefresh = 0;
    const refresh = () => {
      if (!sessionStorage.getItem('ocms_token') || document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefresh < 5000) return; // throttle to max once per 5s
      lastRefresh = now;
      api.get('/auth/me').then((res) => setUser(res.data.user)).catch(() => {});
    };
    window.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  async function login(email, password, role) {
    const res = await api.post('/auth/login', { email, password, ...(role && { role }) });
    sessionStorage.setItem('ocms_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    sessionStorage.removeItem('ocms_token');
    setUser(null);
  }

  // Mirror of the server's can() guard: Principal passes everything; Admin passes
  // read/view permissions only (read + access-control role); everyone else needs at
  // least one of the named permissions on one of their roles.
  function can(...permissions) {
    return passesCan(user, permissions);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
