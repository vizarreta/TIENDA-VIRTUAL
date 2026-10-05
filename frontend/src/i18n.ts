import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es,
      en,
      pt,
    },
    defaultNS: 'common',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt'],
    load: 'languageOnly',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

const updateDocumentLanguage = () => {
  document.documentElement.lang = i18n.resolvedLanguage || 'es';
  document.title = i18n.t('navbar:storeName');
};
i18n.on('languageChanged', updateDocumentLanguage);
void i18n.loadNamespaces('navbar').then(updateDocumentLanguage);

export default i18n;
