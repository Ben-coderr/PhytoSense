import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../../../../../packages/i18n/en.json';
import fr from '../../../../../packages/i18n/fr.json';
import ar from '../../../../../packages/i18n/ar.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

// Detect system locale
const deviceLocale = Localization.getLocales()[0]?.languageCode || 'fr';
const initialLang = ['en', 'fr', 'ar'].includes(deviceLocale) ? deviceLocale : 'fr';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: initialLang,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
