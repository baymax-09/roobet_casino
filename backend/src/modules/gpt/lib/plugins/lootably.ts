import crypto from 'crypto'

import { scopedLogger } from 'src/system/logger'
import { getUserById } from 'src/modules/user'
import { createUniqueID } from 'src/util/helpers/id'

import { PipelineActions } from '../actions'
import { type Offer } from '../../documents/gpt_history'
import { type GPTPlugin } from '.'

export interface LootablyPostback {
  userID: string
  transactionID: string
  ip: string
  offerName: string
  offerID: string
  revenue: string
  currencyReward: string
  status: string
  hash: string
  network: 'lootably'
}

export interface LootablyOffer extends Offer {
  network: 'lootably'
  userID: string
  revenue: string
  currencyReward: string
  description: `Lootably offer: ${string}`
  secret: string
  status: string
}

const gptLogger = scopedLogger('gpt/lootably')

const sha256 = (input: string) =>
  crypto.createHash('sha256').update(input).digest('hex')

const LootablyPlugin: GPTPlugin<LootablyPostback, LootablyOffer> = {
  pluginOfferValidate: async (user, offer) => {
    const logger = gptLogger('pluginOfferValidate', { userId: offer.userID })
    const sha = sha256(
      offer.userID +
        offer.ip +
        offer.revenue +
        offer.currencyReward +
        'vwa4c5xlHkrm6SI5bJwcNgLuqDDNzB6JXnpSytDL41XLLJjrWZSsOhSPzr27PPXSo2jmoWVjAXdH8Yw',
    )
    logger.info('validating offer', {
      offer,
      shaInput:
        offer.userID +
        offer.ip +
        offer.revenue +
        offer.currencyReward +
        'vwa4c5xlHkrm6SI5bJwcNgLuqDDNzB6JXnpSytDL41XLLJjrWZSsOhSPzr27PPXSo2jmoWVjAXdH8Yw',
      revenue: offer.revenue,
      currencyReward: offer.currencyReward,
    })
    if (sha != offer.secret) {
      return {
        nextAction: PipelineActions.Abort,
        reason: `invalid secret - ${offer.secret}`,
      }
    }
    // We are currently not docking users for chargebacks
    if (offer.status === '0') {
      return { nextAction: PipelineActions.Abort, reason: 'Chargeback' }
    }

    return { nextAction: PipelineActions.Continue }
  },

  pluginFraudCheck: async (user, offer) => {
    return { nextAction: PipelineActions.Continue }
  },

  buildOffer: async postbackFields => {
    gptLogger('buildOffer', { userId: postbackFields.userID }).info(
      'building offer',
      { postbackFields },
    )
    const user = await getUserById(postbackFields.userID)
    const offer: LootablyOffer = {
      id: createUniqueID([
        postbackFields.network,
        postbackFields.transactionID,
      ]),
      network: postbackFields.network,
      userID: postbackFields.userID,
      revenue: postbackFields.revenue,
      currencyReward: postbackFields.currencyReward,
      offerId: postbackFields.offerID,
      ip: postbackFields.ip,
      description: `Lootably offer: ${postbackFields.offerName}`,
      value: parseFloat(postbackFields.currencyReward),
      secret: postbackFields.hash,
      name: postbackFields.offerName,
      status: postbackFields.status,
      currency: 'usd',
    }

    return { user, offer }
  },
}

export default LootablyPlugin
