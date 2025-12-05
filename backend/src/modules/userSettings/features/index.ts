import { type User } from 'src/modules/user/types'

import { isUserGrantedPaymentiq } from './lib'
import { type UserGrantedFeaturesRequest } from './types'

export const determineUserGrantedFeatures = async (
  { countryCode }: UserGrantedFeaturesRequest,
  _: User,
) => {
  return {
    paymentiq: await isUserGrantedPaymentiq(countryCode),
  }
}
