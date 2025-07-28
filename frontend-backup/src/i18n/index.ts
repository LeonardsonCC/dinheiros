import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ptBR from './pt-BR.json';

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
};

const savedLang = localStorage.getItem('language');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Save language change to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
