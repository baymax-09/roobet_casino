import request from 'request-promise'

import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'

interface SlackOptions {
  skipLog?: boolean
}

const logger = scopedLogger('slack')('useSlack', { userId: null })

function surroundUrlsWithBackticks(text: string) {
  const urlRegex =
    // eslint-disable-next-line no-useless-escape
    /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))/gi
  return text.replace(urlRegex, '`$1`')
}

export const useSlack =
  (path: string, channelName: string, options: SlackOptions = {}) =>
  (text: string) => {
    try {
      if (!options.skipLog) {
        logger.info(`Slack ${channelName} ${text}`)
      }

      if (!config.isProd && !config.slackChannelOverride) {
        return
      }

      const channelSecret = config.slackChannelOverride || path
      // Remove any URL's from slack text to avoid blind SSRF attacks
      const sanitizedText = surroundUrlsWithBackticks(text)
      const message = config.slackChannelOverride
        ? `[${channelName}]\n${sanitizedText}`
        : sanitizedText

      request({
        method: 'POST',
        uri: `https://hooks.slack.com/services/TPVJ4QV0E/${channelSecret}`,
        json: true,
        body: { text: message },
      }).catch(error => {
        logger.error('Error sending Slack Alert', { channelName }, error)
      })
    } catch (error) {
      logger.error('Error formatting Slack Alert', { channelName }, error)
    }
  }

// TODO move keys to constants
// Product Channels
export const slackTransaction = useSlack(
  'B03PJHGE36E/Hj9Wcg7w7hbVZcaR5lGaw1w0',
  'Transaction',
) // #trans
export const slackMarketingTip = useSlack(
  'B01B19FLFK3/gYUpGy8rGEDL7zaoSwvgJnAw',
  'Marketing Tip',
) // TODO still needs to be migrated to Mr. Roo's Alerts or deleted
export const slackRiskAlert = useSlack(
  'B03PM358UPN/abvwGXLq5OE27HvlPRa5qLCO',
  'Chainalysis Risk Alert',
) // #chainalysis-risk-alerts
export const slackTransactionHr = useSlack(
  'B03Q2R74R0T/rbmv8yagulxMkj7dldB7uy8U',
  'Transaction HR',
) // #transactions-hr
export const slackBalances = useSlack(
  'B03PC3UPN06/EO975yW4krjYXqizrNsJugXV',
  'Balances',
  { skipLog: true },
) // #balances
export const slackAdminLog = useSlack(
  'B03PBVBHG14/2wFQVEVRSRhCtPRGMzjVL1Oa',
  'Admin Log',
) // #staffactions
export const slackKycLevel1Alert = useSlack(
  'B06C5KKC0MQ/S3Z3lQfDDF2JN1EkD2jUtAC0',
  'KYC Level 1 Alert',
) // #kyc-level-1-alerts
export const slackKycLevel1RGAlert = useSlack(
  'B06SJTV58V6/1XsmsBD3lxp17Gvblxl4ujo3',
  'KYC Level 1 Responsible Gambling',
) // #kyc-level-1-alerts
export const slackKycLevel2Alert = useSlack(
  'B03PFNTH2SZ/bYyvknAKWHCgfxu3KUSbk4cS',
  'KYC Level 2 Alert',
) // #kyc-level-2-alerts
export const slackKycLevel3Alert = useSlack(
  'B06AF3ZFT1S/jJQJ4ho4Wq6BZCqXYY2LaGFZ',
  'KYC Level 3 Alert',
) // #kyc-level-3-alerts
export const slackKycLevel4Alert = useSlack(
  'B06C5GBPT5H/BfTO9hsm6wOeE14Ao04E3FxK',
  'KYC Level 4 Alert',
) // #kyc-level-4-alerts
export const slackWatchlistAlert = useSlack(
  'B057T9GEM3R/vXC172DqUWDuR82lGv2erDyl',
  'KYC Watchlist Alert',
) // #risk-alerts-watchlist-checks
export const slackHighAlert = useSlack(
  'B03P409UL31/A7Q1OZ1c6wFy8Rt7yu7IMWUg',
  'High Alert',
) // #alerts
export const slackSeonFraudAlert = useSlack(
  'B03PJJ9LH8B/vPPjMYkmFTmEt5iTEQ8RcdWe',
  'Seon Risk Alerts',
) // #seon-risk-alerts
export const slackSeonRuleAlert = useSlack(
  'B04LBNG0E02/tn53Zu5sKahn7H4J8AL7Vak7',
  'Seon Rule Alerts',
) // #seon-rule-alerts
export const slackKYCSubmissions = useSlack(
  'B03JEKH7VMG/yfIUSRVlY4PqWg30Nh2FvELJ',
  'KYC Uploads',
) // #kyc-uploads
export const slackFTDAlert = useSlack(
  'B05T728J09F/uOBor5wEZz2DTItkHX41Fn1H',
  'FTD Alert',
) // #alerts-ftd-experience
export const slackBigDepositExperience = useSlack(
  'B05SU9PD04T/lfGGnzbKKH9kmvkhAbR6fPyL',
  'Big Deposit Experience',
) // #alerts-bigdeposit-experience

export const slackFTDToVipAlert = useSlack(
  'B070EUDLNPP/Dm1ffoSCSUlgbnYyj6kvmMat',
  'FTD To Vip Alert',
) // #alerts-ftd-to-vip
