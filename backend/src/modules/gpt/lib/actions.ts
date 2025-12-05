import { type ValueOf } from 'ts-essentials'

import { scopedLogger } from 'src/system/logger'
import { translateForUser } from 'src/util/i18n'
import { type Types as UserTypes } from 'src/modules/user'
import { createNotification, getUserById } from 'src/modules/user'
import { changeSystemEnabledUser } from 'src/modules/userSettings'

import { type Offer } from '../documents/gpt_history'
import {
  chargeBackOffer,
  checkOfferIsChargedBack,
  addOfferToHistory,
} from '../documents/gpt_history'
import { type PipelineFeedback } from '../documents/gpt_pipeline'
import {
  getOfferById,
  deleteOfferById,
  removeOfferFromPipeline,
  upsertOfferForUser,
} from '../documents/gpt_pipeline'
import { creditBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

const gptLogger = scopedLogger('gpt')

export const PipelineActions = {
  Continue: 'Continue', // we keep going through the pipeline
  Abort: 'Abort', // we don't store the offer in the db or process it in any way - usually when its already been processed
  Hold: 'Hold', // we hold the offer for manual review
  Reject: 'Reject', // we store it in the pipeline as rejected and send the user a message
  Chargeback: 'Chargeback',
  Finish: 'Finish',
} as const
export type PipelineAction = ValueOf<typeof PipelineActions>

/**
 * when going through the pipeline, we get feedback from the pipeline
 * that feedback tells us what actions to perform next.
 */
const ActionFunctions = {
  [PipelineActions.Hold]: holdOffer,
  [PipelineActions.Reject]: rejectOffer,
  [PipelineActions.Abort]: async () => null,
  [PipelineActions.Continue]: async () => null,
  [PipelineActions.Chargeback]: chargebackOffer,
  [PipelineActions.Finish]: async () => null,
} as const

/**
 * actions that should result in aborting any further pipeline processing for now
 */
const abortPipelineActions = [
  PipelineActions.Hold,
  PipelineActions.Reject,
  PipelineActions.Chargeback,
  PipelineActions.Abort,
  PipelineActions.Finish,
] as const

async function moveFromPipelineToHistory(user: UserTypes.User, offer: Offer) {
  await addOfferToHistory(user, offer)
  await removeOfferFromPipeline(offer.id)
}

async function chargebackOffer(
  user: UserTypes.User,
  offer: Offer,
  pipelineFeedback: PipelineFeedback,
) {
  const isChargedBack = await checkOfferIsChargedBack(offer.id)
  if (isChargedBack) {
    return
  }

  await changeSystemEnabledUser(user.id, 'surveys', false)
  await chargeBackOffer(offer.id)
}

async function holdOffer(
  user: UserTypes.User,
  offer: Offer,
  pipelineFeedback: PipelineFeedback,
) {
  const convertedValue = await exchangeAndFormatCurrency(
    Math.abs(offer.value),
    user,
  )
  const holdMessage = translateForUser(user, 'gpt__hold', [
    offer.network,
    convertedValue,
  ])
  await createNotification(user.id, holdMessage, 'hold', {})
  await upsertOfferForUser(user, offer, pipelineFeedback)
}

async function rejectOffer(
  user: UserTypes.User,
  offer: Offer,
  pipelineFeedback: PipelineFeedback,
) {
  const convertedValue = await exchangeAndFormatCurrency(
    Math.abs(offer.value),
    user,
  )
  const rejectMessage = translateForUser(user, 'gpt__reject', [
    offer.network,
    convertedValue,
  ])
  await createNotification(user.id, rejectMessage, 'hold', {})
  await upsertOfferForUser(user, offer, pipelineFeedback)
}

export async function payoutOffer(user: UserTypes.User, offer: Offer) {
  gptLogger('payoutOffer', { userId: user.id }).info('', {
    network: offer.network,
    value: offer.value,
  })

  const transMeta: TransactionMeta['survey'] = {
    offerName: offer.name,
    ipAddress: offer.ip,
    network: offer.network,
  }

  await creditBalance({
    user,
    amount: offer.value,
    transactionType: 'survey',
    meta: transMeta,
    balanceTypeOverride: null,
  })

  const convertedOffering = await exchangeAndFormatCurrency(
    Math.abs(offer.value),
    user,
  )

  const payoutMessage = translateForUser(user, 'gpt__convertedPayout', [
    convertedOffering,
    offer.description,
  ])

  await createNotification(user.id, payoutMessage, 'survey')
  await moveFromPipelineToHistory(user, offer)

  return { nextAction: PipelineActions.Continue }
}

export async function manuallyPayoutOffer(offerId: string) {
  const offer = await getOfferById(offerId)
  if (!offer) {
    return
  }

  const user = await getUserById(offer.userId)
  if (!user) {
    return
  }
  await payoutOffer(user, offer.offer)
}

export async function manuallyRejectOffer(offerId: string) {
  const offer = await getOfferById(offerId)
  if (!offer) {
    return
  }

  await deleteOfferById(offerId)

  const user = await getUserById(offer.userId)
  if (!user) {
    return
  }

  if (offer.offer) {
    await addOfferToHistory(user, {
      ...offer.offer,
      reason: offer.pipelineFeedback.reason,
      rejected: true,
    })
    const network = offer.offer.network
    const value = offer.offer.value

    if (value && network) {
      const convertedValue = await exchangeAndFormatCurrency(
        Math.abs(value),
        user,
      )
      const rejectMessage = translateForUser(user, 'gpt__reject', [
        network,
        convertedValue,
      ])
      await createNotification(user.id, rejectMessage, 'payout', {})
    }
  }
}

export async function integratePipelineFeedback(
  user: UserTypes.User,
  offer: Offer,
  pipelineFeedback: PipelineFeedback,
) {
  const { nextAction } = pipelineFeedback
  await ActionFunctions[nextAction](user, offer, pipelineFeedback)
  return { abortPipeline: abortPipelineActions.includes(nextAction as any) }
}
