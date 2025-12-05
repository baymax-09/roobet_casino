import { I18n } from 'i18n'

import { scopedLogger } from 'src/system/logger'
import { UserModel } from 'src/modules/user'
import { type User } from 'src/modules/user/types'
import { basicConfiguration } from 'src/system/i18n'

type LocaleHeaders = string[] | boolean

const i18nLogger = scopedLogger('i18n')

export async function translateForUserId(
  userId: string,
  message: string,
  args: string[] = [],
): Promise<string> {
  try {
    const user = await UserModel.getCachedUserById(userId, 30)
    return translateForUser(user, message, args)
  } catch (error) {
    i18nLogger('translateForUserId', { userId }).error(
      'Failed to translate',
      { message, args },
      error,
    )
  }
  return message
}

export function translateForUser(
  user: User | undefined | null,
  message: string,
  args: string[] = [],
): string {
  try {
    const translator = getUserTranslator(user)
    return translator.__(message, ...args)
  } catch (error) {
    i18nLogger('translateForUser', { userId: user?.id ?? null }).error(
      'Failed to translate',
      { message, args },
      error,
    )
  }
  return message
}

export function translateWithLocale(
  localeArray: LocaleHeaders,
  message: string,
  args: string[] = [],
) {
  try {
    const translator = getLocaleTranslator(localeArray)
    return translator.__(message, ...args)
  } catch (error) {
    i18nLogger('translateWithLocale', { userId: null }).error(
      'Failed to translate',
      { message, args, localeArray },
      error,
    )
  }
  return message
}

function getUserTranslator(user: User | undefined | null) {
  const i18nInstance = initializeLocalization()

  if (user?.locale) {
    i18nInstance.setLocale(user.locale)
  }
  return i18nInstance
}

function getLocaleTranslator(localeArray: LocaleHeaders) {
  const i18nInstance = initializeLocalization()

  if (Array.isArray(localeArray)) {
    const locale = localeArray.pop()
    locale && i18nInstance.setLocale(locale)
  }
  return i18nInstance
}

function initializeLocalization() {
  const i18nInstance = new I18n()

  i18nInstance.configure({
    ...basicConfiguration,
  })

  return i18nInstance
}

export const t = translateForUser
export const tuid = translateForUserId
