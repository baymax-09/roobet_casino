import _PaymentIQCashier, {
  type IPiqCashierConfig,
  type IPiqCashierApiMethods,
} from 'paymentiq-cashier-bootstrapper'

import { env } from 'common/constants'

const merchantId = env.PAYMENTIQ_MERCHANT_ID
const environment = env.PAYMENTIQ_ENV

interface CustomPiqCashierConfig extends IPiqCashierConfig {
  showCustomAmountButton?: boolean
}

export const CashierConfig: CustomPiqCashierConfig = {
  merchantId,
  userId: '123',
  sessionId: '123',
  /** @todo Fix this typing */
  environment,
  user: {
    nationalId: '"nationalId"',
  },
  accountDelete: false,
  amount: '',
  autoOpenFirstPaymentMethod: false,
  predefinedAmounts: [100, 250, 500],
  showAmountLimits: true,
  allowMobilePopup: true,
  receiptBackBtn: true,
  newPaymentBtn: true,
  showCustomAmountButton: true,
  theme: {},
  showtermsAndConditionsTemplate: false,
  listType: 'grid',
  errorMsgTxRefId: true,
}

export const initPaymentCashier = () => {
  // reset the cashier before rendering a new one
  if (window._PaymentIQCashierReset) {
    window._PaymentIQCashierReset()
  }

  const CashierInstance = new _PaymentIQCashier(
    '#paymentiq-cashier',
    CashierConfig,
    // register callbacks
    (api: IPiqCashierApiMethods) => {
      api.css(`
  
       `)
    },
  )

  window.CashierInstance = CashierInstance
  return CashierInstance
}

export const destroyPaymentCashier = () => {
  // reset the cashier before rendering a new one
  if (window._PaymentIQCashierReset) {
    window._PaymentIQCashierReset()
  }
}
