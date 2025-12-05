import { t } from 'i18next'

import { getWalletImageUri } from 'app/util/wallet'
import { type BalanceType } from 'common/types'
import BankIcon from 'assets/images/icons/cash/Bank.svg'
import CreditCardIcon from 'assets/images/icons/cash/CreditCard.svg'
import InteracIcon from 'assets/images/icons/cash/Interac.svg'
import PagoEfectivoIcon from 'assets/images/icons/cash/PagoEfectivo.svg'
import PIXIcon from 'assets/images/icons/cash/PIX.svg'
import SPEIIcon from 'assets/images/icons/cash/SPEI.svg'
import WebPayPlusIcon from 'assets/images/icons/cash/WebPayPlus.svg'

type CryptoName =
  | 'Bitcoin'
  | 'Ethereum'
  | 'Litecoin'
  | 'Tether'
  | 'USDC'
  | 'Ripple'
  | 'Dogecoin'
  | 'TRON'
type CryptoQR =
  | 'bitcoin'
  | 'ethereum'
  | 'litecoin'
  | 'ripple'
  | 'dogecoin'
  | 'tron'
export type CryptoPlugin =
  | 'bitcoin'
  | 'ethereum'
  | 'litecoin'
  | 'tether'
  | 'usdc'
  | 'ripple'
  | 'dogecoin'
  | 'tron'
type CryptoWalletName =
  | 'Bitcoin (BTC)'
  | 'Tether (USDT)'
  | 'USD Coin (USDC)'
  | 'Ethereum (ETH)'
  | 'Litecoin (LTC)'
  | 'XRP (XRP)'
  | 'Dogecoin (DOGE)'
  | 'TRON (TRX)'
export type CryptoShortCode =
  | 'btc'
  | 'eth'
  | 'ltc'
  | 'usdt'
  | 'usdc'
  | 'xrp'
  | 'doge'
  | 'trx'
type CryptoTag = 'Destination Tag'
export type CryptoNetwork = 'ETH'

interface BalanceTypeOption {
  balanceType: BalanceType
  canTip: boolean
  minimumDeposit: number
  image: RoobetAssetPath<'svg'>
  /** The order in which the option is shown in the accordions */
  priority: number
}

export interface CryptoOption extends BalanceTypeOption {
  qr: CryptoQR
  /** the name of the withdraw plugin */
  plugin: CryptoPlugin
  walletName: CryptoWalletName
  walletTag?: CryptoTag
  shortCode: CryptoShortCode
  crypto: CryptoName
  instant?: boolean
  confirmations: number
  network?: CryptoNetwork
}

interface PaymentIcon {
  icon: RoobetAssetPath<'svg'>
  alt: string
  width: number
}
export interface CashOption extends BalanceTypeOption {
  crypto: null
  walletName: string
  shortCode: 'cash'
  minimumWithdraw: number
  isAdmin: boolean
  paymentIcons: PaymentIcon[]
}

export const DefaultBalanceType = 'crypto'

export const CryptoOptions: Readonly<CryptoOption[]> = [
  {
    instant: true,
    priority: 1,
    balanceType: 'crypto',
    canTip: true,
    minimumDeposit: 10,
    qr: 'bitcoin',
    plugin: 'bitcoin',
    walletName: 'Bitcoin (BTC)',
    shortCode: 'btc',
    crypto: 'Bitcoin',
    image: getWalletImageUri('btc'),
    confirmations: 1,
  },
  {
    priority: 2,
    balanceType: 'usdt',
    crypto: 'Tether',
    walletName: 'Tether (USDT)',
    shortCode: 'usdt',
    image: getWalletImageUri('usdt'),
    qr: 'ethereum',
    plugin: 'tether',
    minimumDeposit: 10,
    canTip: true,
    confirmations: 3,
    network: 'ETH',
  },
  {
    priority: 3,
    balanceType: 'usdc',
    crypto: 'USDC',
    walletName: 'USD Coin (USDC)',
    shortCode: 'usdc',
    image: getWalletImageUri('usdc'),
    qr: 'ethereum',
    plugin: 'usdc',
    minimumDeposit: 10,
    canTip: true,
    confirmations: 3,
    network: 'ETH',
  },
  {
    priority: 4,
    balanceType: 'eth',
    canTip: true,
    minimumDeposit: 10,
    walletName: 'Ethereum (ETH)',
    crypto: 'Ethereum',
    qr: 'ethereum',
    plugin: 'ethereum',
    shortCode: 'eth',
    image: getWalletImageUri('eth'),
    confirmations: 3,
    network: 'ETH',
  },
  {
    priority: 5,
    balanceType: 'xrp',
    canTip: true,
    minimumDeposit: 10,
    walletName: 'XRP (XRP)',
    walletTag: 'Destination Tag',
    crypto: 'Ripple',
    qr: 'ripple',
    plugin: 'ripple',
    shortCode: 'xrp',
    image: getWalletImageUri('xrp'),
    confirmations: 1,
  },
  {
    priority: 6,
    balanceType: 'trx',
    canTip: true,
    minimumDeposit: 10,
    walletName: 'TRON (TRX)',
    crypto: 'TRON',
    qr: 'tron',
    plugin: 'tron',
    shortCode: 'trx',
    image: getWalletImageUri('trx'),
    confirmations: 20,
  },
  {
    priority: 7,
    balanceType: 'ltc',
    canTip: true,
    minimumDeposit: 10,
    walletName: 'Litecoin (LTC)',
    crypto: 'Litecoin',
    qr: 'litecoin',
    plugin: 'litecoin',
    shortCode: 'ltc',
    image: getWalletImageUri('ltc'),
    confirmations: 3,
  },
  {
    priority: 8,
    balanceType: 'doge',
    canTip: true,
    minimumDeposit: 10,
    walletName: 'Dogecoin (DOGE)',
    crypto: 'Dogecoin',
    qr: 'dogecoin',
    plugin: 'dogecoin',
    shortCode: 'doge',
    image: getWalletImageUri('doge'),
    confirmations: 3,
  },
]

const codeToIconMap: Record<
  string,
  { walletName: string; paymentIcon: PaymentIcon }
> = {
  PE: {
    walletName: `PagoEfectivo, ${t('cashier.cardsAndMore')}`,
    paymentIcon: { icon: PagoEfectivoIcon, alt: 'Pago Efectivo', width: 32 },
  },
  MX: {
    walletName: `SPEI, ${t('cashier.otherBanksAndMore')}`,
    paymentIcon: { icon: SPEIIcon, alt: 'SPEI', width: 18 },
  },
  CL: {
    walletName: `Webpay, ${t('cashier.banksAndMore')}`,
    paymentIcon: { icon: WebPayPlusIcon, alt: 'Web Pay Plus', width: 24 },
  },
  CA: {
    walletName: `Interac, ${t('cashier.cardsAndMore')}`,
    paymentIcon: { icon: InteracIcon, alt: 'Interac', width: 16 },
  },
  BR: {
    walletName: `PIX, ${t('cashier.banksAndMore')}`,
    paymentIcon: { icon: PIXIcon, alt: 'PIX', width: 35 },
  },
}

const getDynamicNameAndIcons = (
  cashierWalletNames: boolean,
  addressCountry: string | undefined,
) => {
  if (!cashierWalletNames) {
    return { walletName: t('cashier.cash'), paymentIcons: [] }
  }

  const defaultPaymentIcons = {
    paymentIcons: [
      { icon: CreditCardIcon, alt: 'Credit Card', width: 18 },
      { icon: BankIcon, alt: 'Bank', width: 18 },
    ],
  }

  if (!addressCountry || !codeToIconMap[addressCountry]) {
    return {
      walletName: t('cashier.cardsBanksAndMore'),
      ...defaultPaymentIcons,
    }
  }

  const { walletName, paymentIcon } = codeToIconMap[addressCountry]
  return {
    walletName,
    paymentIcons: [paymentIcon, ...defaultPaymentIcons.paymentIcons],
  }
}

export const CashOptions = (
  cashierWalletNames: boolean,
  addressCountry: string | undefined,
): Readonly<CashOption[]> => {
  return [
    {
      crypto: null,
      balanceType: 'cash',
      canTip: false,
      minimumDeposit: 10,
      minimumWithdraw: 15,
      shortCode: 'cash',
      image: getWalletImageUri('cash'),
      isAdmin: false,
      priority: 6,
      ...getDynamicNameAndIcons(cashierWalletNames, addressCountry),
    },
  ]
}

export type CashierOption = CryptoOption | CashOption

export const isCashOption = (
  cashierOption: CashierOption,
): cashierOption is CashOption => {
  return !!CashOptions(false, undefined).find(
    option => option.balanceType === cashierOption.balanceType,
  )
}
export const hasCryptoTag = (crypto: CryptoShortCode) => crypto === 'xrp'
