import { type Types as UserTypes } from 'src/modules/user'

import { type Offer } from '../../documents/gpt_history'
import { PipelineActions } from '../actions'

export async function globalFraudCheck(user: UserTypes.User, offer: Offer) {
  // return { nextAction: PipelineActions.Hold }

  // Hold rules
  /*
   * const offerPayout = offer.value
   * const holdAmount = 2;
   * if(offerPayout > holdAmount) {
   *   return { nextAction: PipelineActions.Hold, reason: `offerPayout > ${holdAmount}`}
   * }
   */

  /*
   * const otherUserIpCount = await otherUsersTouchedIp(user.id, offer.ip, 'offers');
   * if(otherUserIpCount > 0) {
   *   return { nextAction: PipelineActions.Hold, reason: `otherUserIpCount > 0`}
   * }
   * if(!(await isSystemEnabled(user, 'surveys'))) {
   *   return { nextAction: PipelineActions.Hold, reason: `user.disabledSurveys`}
   * }
   */

  // we detected nothing fishy sir.. you may continue
  return { nextAction: PipelineActions.Continue }
}
