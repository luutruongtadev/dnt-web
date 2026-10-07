import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en.json';
import viTranslation from './locales/vi.json';

const resources = {
  en: {
    translation: enTranslation
  },
  vi: {
    translation: viTranslation
  }
};

const defaultLang = typeof window !== 'undefined' ? localStorage.getItem('selectedLang') || 'vi' : 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang, // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // react already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;