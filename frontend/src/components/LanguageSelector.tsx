import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  flag: string;
  /** Key in the "language" namespace for the display name */
  labelKey: 'spanish' | 'english' | 'portuguese';
}

const LANGUAGES: Language[] = [
  { code: 'es', flag: '🇪🇸', labelKey: 'spanish' },
  { code: 'en', flag: '🇺🇸', labelKey: 'english' },
  { code: 'pt', flag: '🇧🇷', labelKey: 'portuguese' },
];

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation('language');
  const activeLng = i18n.resolvedLanguage ?? i18n.language.split('-')[0];
  const current = LANGUAGES.find((l) => l.code === activeLng) ?? LANGUAGES[0];

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const select = (code: string) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('ariaLabel')}
        className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 transition-colors cursor-pointer select-none"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {current.flag}
        </span>
        <span className="hidden sm:inline">{t(current.labelKey)}</span>
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul
          role="listbox"
          aria-label={t('ariaLabel')}
          className="absolute right-0 mt-2 w-44 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/10 focus:outline-none z-50 overflow-hidden animate-fade-in"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === activeLng;
            return (
              <li key={lang.code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => select(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {lang.flag}
                  </span>
                  <span>{t(lang.labelKey)}</span>
                  {isActive && (
                    <svg
                      className="ml-auto w-4 h-4 text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
