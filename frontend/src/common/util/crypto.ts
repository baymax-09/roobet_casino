import { type BalanceType } from 'common/types'
import BTCIcon from 'assets/images/newDesignIcons/BTC.svg'
import ETHIcon from 'assets/images/newDesignIcons/ETH.svg'
import LTCIcon from 'assets/images/newDesignIcons/LTC.svg'
import CashIcon from 'assets/images/newDesignIcons/Cash.svg'
import USDTIcon from 'assets/images/newDesignIcons/USDT.svg'
import USDCIcon from 'assets/images/newDesignIcons/USDC.svg'
import XRPIcon from 'assets/images/newDesignIcons/XRP.svg'
import DogeIcon from 'assets/images/newDesignIcons/Doge.svg'
import TRXIcon from 'assets/images/newDesignIcons/TRX.svg'

const balanceTypeMap: Record<BalanceType, string> = {
  cash: 'USD',
  crypto: 'BTC',
  eth: 'ETH',
  ltc: 'LTC',
  usdt: 'USDT',
  usdc: 'USDC',
  xrp: 'XRP',
  doge: 'Doge',
  trx: 'TRX',
}

const balanceTypIconMap: Record<BalanceType, string> = {
  cash: CashIcon,
  crypto: BTCIcon,
  eth: ETHIcon,
  ltc: LTCIcon,
  usdt: USDTIcon,
  usdc: USDCIcon,
  xrp: XRPIcon,
  doge: DogeIcon,
  trx: TRXIcon,
}

export const getShortFromBalanceType = (balanceType: BalanceType) => {
  return balanceTypeMap[balanceType]
}

export const getBalanceTypeIcon = (balanceType: BalanceType) => {
  return balanceTypIconMap[balanceType]
}
