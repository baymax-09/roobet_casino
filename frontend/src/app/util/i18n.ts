import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { env } from 'common/constants'
import { supportedLngs } from 'app/constants'
import en from 'app/locale/en.json'
import pt from 'app/locale/pt.json'
import es from 'app/locale/es.json'
import fr from 'app/locale/fr.json'
import sr from 'app/locale/sr.json'
import tr from 'app/locale/tr.json'
import ar from 'app/locale/ar.json'
import cs from 'app/locale/cs.json'
import hi from 'app/locale/hi.json'
import ja from 'app/locale/ja.json'
import fil from 'app/locale/fil.json'
import fa from 'app/locale/fa.json'
import id from 'app/locale/id.json'
import fi from 'app/locale/fi.json'
import zh from 'app/locale/zh.json'
import vi from 'app/locale/vi.json'
import th from 'app/locale/th.json'
import ko from 'app/locale/ko.json'
import ru from 'app/locale/ru.json'

export const resources = {
  en: {
    translation: { ...en },
  },
  pt: {
    translation: { ...pt },
  },
  es: {
    translation: { ...es },
  },
  fr: {
    translation: { ...fr },
  },
  sr: {
    translation: { ...sr },
  },
  tr: {
    translation: { ...tr },
  },
  ar: {
    translation: { ...ar },
  },
  cs: {
    translation: { ...cs },
  },
  hi: {
    translation: { ...hi },
  },
  ja: {
    translation: { ...ja },
  },
  fil: {
    translation: { ...fil },
  },
  fa: {
    translation: { ...fa },
  },
  id: {
    translation: { ...id },
  },
  fi: {
    translation: { ...fi },
  },
  zh: {
    translation: { ...zh },
  },
  vi: {
    translation: { ...vi },
  },
  th: {
    translation: { ...th },
  },
  ko: {
    translation: { ...ko },
  },
  ru: {
    translation: { ...ru },
  },
}

/**
 * @see {@link https://www.i18next.com/overview/configuration-options | i18next docs} for all options.
 */
export const i18Instance = i18n
  // pass the i18n instance to react-i18next.
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    /*
     * This detection config is the default config from the 'i18next-browser-languagedetector' library
     * The only exception is the "order" array where we prioritize local storage over the query string.
     * https://github.com/i18next/i18next-browser-languageDetector/blob/9efebe6ca0271c3797bc09b84babf1ba2d9b4dbb/src/index.js#L11
     */
    detection: {
      order: [
        'localStorage',
        'querystring',
        'cookie',
        'sessionStorage',
        'navigator',
        'htmlTag',
      ],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
    },
    resources,
    fallbackLng: 'en',
    debug: env.NODE_ENV === 'development',
    supportedLngs,
    interpolation: {
      escapeValue: false, // not needed for React as it escapes by default
    },
  })

export const initializeTranslations = () => {
  return i18Instance
}
