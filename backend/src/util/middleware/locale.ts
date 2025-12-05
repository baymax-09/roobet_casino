import { type RequestHandler } from 'express'

import { updateUser } from 'src/modules/user'
import { type AvailableLocale, isAvailableLocale } from 'src/system/i18n'

const localeRegex =
  /((([a-zA-Z]+(-[a-zA-Z0-9]+){0,2})|\*)(;q=[0-1](\.[0-9]+)?)?)*/g

const parse = (acceptLanguageHeader: string) => {
  const matchResults = (acceptLanguageHeader || '').match(localeRegex)

  if (!matchResults) {
    return [
      {
        code: 'en',
        quality: 1.0,
      },
    ]
  }

  return matchResults
    .map(string => {
      if (!string) {
        return {
          code: 'en',
          quality: 0.0,
        }
      }

      const bits = string.split(';')
      const ietf = bits[0].split('-')

      return {
        code: ietf[0],
        quality: bits[1] ? parseFloat(bits[1].split('=')[1]) : 1.0,
      }
    })
    .filter(r => r)
    .sort((a, b) => b.quality - a.quality)
}

export const getBestLanguageMatch = (
  acceptedLanguage: string | undefined,
): AvailableLocale => {
  if (!acceptedLanguage) {
    return 'en'
  }
  // Grab the highest quality language (sorted from highest -> lowest)
  const languageCode = parse(acceptedLanguage)[0].code

  if (isAvailableLocale(languageCode)) {
    return languageCode
  }
  return 'en'
}

export const localeMiddleware: RequestHandler = (req, _, next) => {
  const headerLocale = getBestLanguageMatch(req.headers['accept-language'])
  if (req.user && !req.user.locale) {
    const user = req.user
    req.user.locale = headerLocale
    updateUser(user.id, { locale: headerLocale })
  }
  next()
}
