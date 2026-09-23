import { createContext, useContext, useEffect, useState } from 'react';
import { settingApi, categoryApi } from '../api/endpoints';
import { initTracking } from '../api/tracking';

const SiteContext = createContext({ settings: {}, categories: [], loading: true });

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, c] = await Promise.allSettled([settingApi.public(), categoryApi.list()]);
      if (!alive) return;
      if (s.status === 'fulfilled') setSettings(s.value || {});
      if (c.status === 'fulfilled') setCategories(c.value || []);
      setLoading(false);
    })();
    initTracking();
    return () => { alive = false; };
  }, []);

  return (
    <SiteContext.Provider value={{ settings, categories, loading }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
