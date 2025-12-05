import i18n from 'i18n'
import path from 'path'

export const AvailableLocales = [
  'en',
  'es',
  'fr',
  'pt',
  'sr',
  'tr',
  'ar',
  'cs',
  'hi',
  'ja',
  'fil',
  'fa',
  'id',
  'fi',
  'zh',
  'vi',
  'th',
  'ko',
  'ru',
] as const
export type AvailableLocale = (typeof AvailableLocales)[number]
export const isAvailableLocale = (locale: any): locale is AvailableLocale => {
  return AvailableLocales.includes(locale)
}

export const basicConfiguration: i18n.ConfigurationOptions = {
  directory: path.resolve(__dirname, '../../locales'),
  defaultLocale: 'en',
  cookie: 'lc',
  updateFiles: false,
  retryInDefaultLocale: true,
}

i18n.configure(basicConfiguration)

export default i18n
