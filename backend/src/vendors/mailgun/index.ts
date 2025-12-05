import axios from 'axios'

import { config } from 'src/system'
import { t } from 'src/util/i18n'
import { type Types as UserTypes } from 'src/modules/user'
import { getUserById } from 'src/modules/user'
import { type AvailableLocale } from 'src/system/i18n'
import { mailgunLogger } from './lib/logger'

export * as Workers from './workers'

const MAILGUN_TEMPLATE_LANGS: AvailableLocale[] = [
  'en',
  'es',
  'fr',
  'pt',
  'sr',
  'tr',
  'zh',
  'vi',
  'th',
]

type MailgunTemplateLangs = (typeof MAILGUN_TEMPLATE_LANGS)[number]

const isAvailableLocale = (locale?: string): locale is MailgunTemplateLangs => {
  return !!locale && (MAILGUN_TEMPLATE_LANGS as string[]).includes(locale)
}

const KEY = Buffer.from(`api:${config.mailgun.key}`).toString('base64')

const api = axios.create({
  baseURL: `https://api.mailgun.net/v3/${config.mailgun.domain}`,
  headers: { Authorization: `Basic ${KEY}` },
})

const apiV4 = axios.create({
  baseURL: 'https://api.mailgun.net/v4',
  headers: { Authorization: `Basic ${KEY}` },
  timeout: 5000,
})

export async function getUnsubscribes() {
  const {
    data: { items },
  } = await api.get('/unsubscribes')
  return items
}

export async function getBounces() {
  const {
    data: { items },
  } = await api.get('/bounces')
  return items
}

export async function getSpamComplaints() {
  const {
    data: { items },
  } = await api.get('/complaints')
  return items
}

export async function deleteUnsubscribe(address: string) {
  const { data } = await api.delete(`/unsubscribes/${address}`)
  return data
}

export async function deleteBounce(address: string) {
  const { data } = await api.delete(`/bounces/${address}`)
  return data
}

export async function deleteSpamComplaint(address: string) {
  const { data } = await api.delete(`/complaints/${address}`)
  return data
}

const localeVersionMap: Record<
  AvailableLocale,
  Exclude<AvailableLocale, 'en'> | 'initial'
> = {
  en: 'initial',
  es: 'es',
  pt: 'pt',
  fr: 'fr',
  sr: 'sr',
  tr: 'tr',
  ar: 'ar',
  cs: 'cs',
  hi: 'hi',
  ja: 'ja',
  fil: 'fil',
  fa: 'fa',
  id: 'id',
  fi: 'fi',
  zh: 'zh',
  vi: 'vi',
  th: 'th',
  ko: 'ko',
  ru: 'ru',
}

export async function isEmailDeliverable(email: string) {
  try {
    const { data } = await apiV4.get('/address/validate', {
      params: {
        address: email,
      },
    })
    return data.result === 'deliverable'
  } catch (err) {
    mailgunLogger('isEmailDeliverable', { userId: null }).error('err', {}, err)
  }
  return false
}

type TemplateName =
  | 'verify'
  | 'recover-account'
  | 'email-2fa'
  | 'admin-report'
  | 'admin-report-failure'
  | 'account-update'

export async function sendTemplatedEmail(
  user: UserTypes.User,
  to: string,
  template: TemplateName,
  variables: Record<string, string>,
  subject: string,
) {
  const logger = mailgunLogger('sendTemplatedEmail', { userId: user.id })
  if (!config.isProd && !config.isStaging) {
    logger.info('dev env - not sending email', { subject, to })
    return
  }

  const data = new URLSearchParams({
    from: config.mailgun.from,
    template,
    't:version': isAvailableLocale(user.locale)
      ? localeVersionMap[user.locale]
      : 'initial',
    to,
    subject,
    ...variables,
    'o:tag': template,
  })

  try {
    await api.post('/messages', data)
  } catch (error) {
    logger.error('/messages', error)
  }
}

export async function sendTwoFactorCode(
  user: UserTypes.User,
  to: string,
  twoFactorCode: string,
  name: string,
) {
  await sendTemplatedEmail(
    user,
    to,
    'email-2fa',
    { 'v:twoFactorCode': twoFactorCode, 'v:name': name },
    t(user, 'email__secure_login', [name]),
  )
}

export async function sendVerificationEmail(
  user: UserTypes.User,
  to: string,
  verificationURL: string,
  name: string,
) {
  await sendTemplatedEmail(
    user,
    to,
    'verify',
    { 'v:verificationURL': verificationURL, 'v:name': name },
    t(user, 'email__please_verify', [name]),
  )
}

export async function sendRecoveryEmail(
  user: UserTypes.User,
  to: string,
  token: string,
) {
  await sendTemplatedEmail(
    user,
    to,
    'recover-account',
    { 'v:token': token },
    t(user, 'email__recovery_code', [user.name]),
  )
}

export async function sendTwoFactorActivity(
  user: UserTypes.User,
  to: string,
  name: string,
) {
  // await sendTemplatedEmail(
  //   user,
  //   to,
  //   'account-update',
  //   { 'v:name': name,
  //     'v:updatedSetting':'2FA settings',
  //   },
  //   t(user, 'account__2fa_update'),
  // )
}

export const sendAdminReportSuccessEmail = async (
  userId: string,
  reportName: string,
  reportLink: string,
) => {
  try {
    const user = await getUserById(userId)
    if (!user?.email || !user.email.endsWith('@roobet.com')) {
      throw new Error(`User ${userId} has no email address`)
    }

    await sendTemplatedEmail(
      user,
      user.email,
      'admin-report',
      { 'v:reportName': reportName, 'v:reportLink': reportLink },
      `Your report, ${reportName}, is available`,
    )
  } catch (error) {
    mailgunLogger('sendAdminReportSuccessEmail', { userId }).error(
      'Failed to send Admin Report Success',
      {},
      error,
    )
  }
}

export const sendAdminReportFailureEmail = async (
  userId: string,
  reportName: string,
) => {
  try {
    const user = await getUserById(userId)
    if (!user?.email || !user.email.endsWith('@roobet.com')) {
      throw new Error(`User ${userId} has no email address`)
    }

    await sendTemplatedEmail(
      user,
      user.email,
      'admin-report-failure',
      { reportName },
      `Your report, ${reportName}, failed to generate`,
    )
  } catch (error) {
    mailgunLogger('sendAdminReportFailureEmail', { userId }).error(
      'Failed to send Admin Report Failure',
      {},
      error,
    )
  }
}
