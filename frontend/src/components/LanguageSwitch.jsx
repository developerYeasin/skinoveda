import { useLang } from '../i18n';

/** BN / EN pill switch. `onLight` styles it for light backgrounds. */
export default function LanguageSwitch({ onLight = false }) {
  const { lang, setLang, langs } = useLang();

  return (
    <div className={`lang-switch ${onLight ? 'on-light' : ''}`} role="group" aria-label="Language">
      {Object.values(langs).map((l) => (
        <button
          key={l.code}
          type="button"
          className={lang === l.code ? 'active' : ''}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          title={l.label}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
