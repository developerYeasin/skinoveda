import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, LANGS } from './translations';

const STORAGE_KEY = 'skv_lang';
const DEFAULT_LANG = 'bn'; // Bangla is the default language

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) return saved;
    } catch { /* storage can be blocked */ }
    return DEFAULT_LANG;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  /** t('key') — falls back to English, then to the key itself. */
  const t = useCallback(
    (key, fallback) => translations[lang]?.[key] ?? translations.en?.[key] ?? fallback ?? key,
    [lang]
  );

  /**
   * Picks the right field from an API row that carries both languages,
   * e.g. pickField(service, 'name') reads `name_bn` when the site is in Bangla
   * and falls back to `name` when no translation has been entered.
   */
  const pickField = useCallback(
    (row, field) => {
      if (!row) return '';
      if (lang === 'bn') return row[`${field}_bn`] || row[field] || '';
      return row[field] || row[`${field}_bn`] || '';
    },
    [lang]
  );

  const toggle = useCallback(() => setLang((l) => (l === 'bn' ? 'en' : 'bn')), []);

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, pickField, langs: LANGS, isBn: lang === 'bn' }),
    [lang, toggle, t, pickField]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}

/** Convenience hook when only the translator is needed. */
export const useT = () => useLang().t;
