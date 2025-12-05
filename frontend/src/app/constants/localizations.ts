export const localizations = [
  {
    code: 'en',
    lang: 'English',
  },
  {
    code: 'es',
    lang: 'Español',
  },
  {
    code: 'pt',
    lang: 'Português',
  },
  {
    code: 'fr',
    lang: 'Français',
  },
  {
    code: 'sr',
    lang: 'Srpski',
  },
  {
    code: 'tr',
    lang: 'Türkçe',
  },
  {
    code: 'ar',
    lang: 'عربي',
  },
  {
    code: 'cs',
    lang: 'Čeština',
  },
  {
    code: 'hi',
    lang: 'हिंदी',
  },
  {
    code: 'ja',
    lang: '日本',
  },
  {
    code: 'fil',
    lang: 'Filipino',
  },
  {
    code: 'fa',
    lang: 'فارسی',
  },
  {
    code: 'id',
    lang: 'Bahasa Indonesia',
  },
  {
    code: 'fi',
    lang: 'Suomalainen',
  },
  {
    code: 'zh',
    lang: '中国人',
  },
  {
    code: 'vi',
    lang: 'Tiếng Việt',
  },
  {
    code: 'th',
    lang: 'แบบไทย',
  },
  {
    code: 'ko',
    lang: '한국인',
  },
  {
    code: 'ru',
    lang: 'Pусский',
  },
] as const

export const supportedLngs = localizations.map(({ code }) => code)

export const isSupportedLanguage = (lang: any): lang is SupportedLanguages =>
  supportedLngs.includes(lang)

export type SupportedLanguages = (typeof supportedLngs)[number]
