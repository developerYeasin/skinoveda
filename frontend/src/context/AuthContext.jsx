import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skv_user') || 'null'); } catch { return null; }
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('skv_token');
    if (!token) { setChecking(false); return; }
    authApi.me()
      .then((u) => { setUser(u); localStorage.setItem('skv_user', JSON.stringify(u)); })
      .catch(() => { localStorage.removeItem('skv_token'); localStorage.removeItem('skv_user'); setUser(null); })
      .finally(() => setChecking(false));
  }, []);

  const login = async (email, password) => {
    const { token, user: u } = await authApi.login({ email, password });
    localStorage.setItem('skv_token', token);
    localStorage.setItem('skv_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('skv_token');
    localStorage.removeItem('skv_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, checking }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
