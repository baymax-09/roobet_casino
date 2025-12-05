import { config } from 'src/system'
import { isCryptoBalanceType } from 'src/modules/user/types/Balance'
import { type BalanceType } from 'src/modules/user/types/Balance'

export const getWagerRequirement = (balanceType: BalanceType) => {
  if (isCryptoBalanceType(balanceType)) {
    return config.cryptoWagerRequirement
  }
  return config.cashWagerRequirement
}
