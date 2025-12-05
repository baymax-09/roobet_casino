import btc from 'assets/images/newDesignIcons/BTC.svg'
import eth from 'assets/images/newDesignIcons/ETH.svg'
import ltc from 'assets/images/newDesignIcons/LTC.svg'
import cash from 'assets/images/newDesignIcons/Cash.svg'
import usdt from 'assets/images/newDesignIcons/USDT.svg'
import usdc from 'assets/images/newDesignIcons/USDC.svg'
import xrp from 'assets/images/newDesignIcons/XRP.svg'
import doge from 'assets/images/newDesignIcons/Doge.svg'
import trx from 'assets/images/newDesignIcons/TRX.svg'
import { type UserObjectBalanceField, type BalanceType } from 'common/types'

interface ShouldHideBalanceArgs {
  balanceType: BalanceType
  selectedBalanceType: BalanceType
  balance: number
  isPaymentIQAllowed: boolean
  hideEmptyBalances: boolean
}
type Code = BalanceType | UserObjectBalanceField | 'btc'

const codeToIcon: Readonly<Record<Code, RoobetAssetPath<'svg'>>> = {
  btc,
  crypto: btc,
  balance: btc,
  eth,
  ethBalance: eth,
  ltc,
  ltcBalance: ltc,
  cash,
  cashBalance: cash,
  usdt,
  usdc,
  xrp,
  doge,
  trx,
}

export const getWalletImageUri = (code: Code) => {
  return codeToIcon[code]
}

export const shouldHideBalance = ({
  balanceType,
  balance,
  isPaymentIQAllowed,
  selectedBalanceType,
  hideEmptyBalances,
}: ShouldHideBalanceArgs): boolean => {
  // allowance for feature flags
  if (balanceType === 'cash' && !isPaymentIQAllowed && balance < 0.001) {
    return true
  }
  // never hide the selected balance
  if (balanceType === selectedBalanceType) {
    return false
  }
  if (hideEmptyBalances && balance < 0.01) {
    return true
  }
  return false
}
