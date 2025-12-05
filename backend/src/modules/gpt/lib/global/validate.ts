import { type Types as UserTypes } from 'src/modules/user'

import { checkOfferAlreadyProcessed } from '../../documents/gpt_pipeline'
import {
  checkOfferAlreadyProcessedHistorically,
  type Offer,
} from '../../documents/gpt_history'
import { PipelineActions } from '../actions'

export async function globalOfferValidate(user: UserTypes.User, offer: Offer) {
  if (offer.value < 0) {
    return { nextAction: PipelineActions.Chargeback }
  }

  if (await checkOfferAlreadyProcessed(offer.id)) {
    return { nextAction: PipelineActions.Abort }
  }
  if (await checkOfferAlreadyProcessedHistorically(offer.id)) {
    return { nextAction: PipelineActions.Abort }
  }

  /*
   * check if this user should even be able to complete offers in the first place..
   * if (user.hiddenTotalDeposited < 5) {
   *   return {
   *     nextAction: PipelineActions.Abort,
   *     reason: "User doesn't meet the minimum requirements (user.hiddenTotalDeposited < 5)."
   *   }
   * }
   */

  if (user.isPromoBanned) {
    return {
      nextAction: PipelineActions.Abort,
      reason: 'User is banned from promotions.',
    }
  }

  const requiredFields = [
    'network',
    'value',
    'offerId',
    'description',
    'ip',
  ] as const
  for (const field of requiredFields) {
    if (typeof offer[field] === 'undefined') {
      return {
        nextAction: PipelineActions.Abort,
        reason: `Missing required field: ${field}`,
      }
    }
  }

  return { nextAction: PipelineActions.Continue }
}
